from __future__ import annotations

import json
import socket
import urllib.error
import urllib.request
from urllib.parse import urlparse, urlunparse
from typing import Any

from src.core.config import settings


def format_rag_answer(
    *,
    user_message: str,
    raw_answer: str,
    citations: list[dict[str, Any]],
    conversation_summary: str | None,
    route: dict[str, str | None],
) -> tuple[str, str]:
    if route.get("intent") == "exact_exercise_question" and not asks_for_explanation(user_message):
        return raw_answer, "exact_answer_key"

    provider = settings.tutor_llm_provider.lower().strip()
    if provider in {"", "off", "none", "deterministic"}:
        return raw_answer, "deterministic_rag"

    prompt = build_formatter_prompt(
        user_message=user_message,
        raw_answer=raw_answer,
        citations=citations,
        conversation_summary=conversation_summary,
        route=route,
    )

    if provider == "ollama":
        formatted = call_ollama(prompt)
        return (formatted, f"ollama:{settings.ollama_model}") if formatted else (raw_answer, "deterministic_rag")

    if provider == "openai":
        formatted = call_openai(prompt)
        return (formatted, f"openai:{settings.openai_model}") if formatted else (raw_answer, "deterministic_rag")

    if provider in {"hf", "huggingface"}:
        formatted = call_huggingface(prompt)
        return (formatted, f"huggingface:{settings.huggingface_model}") if formatted else (raw_answer, "deterministic_rag")

    return raw_answer, "deterministic_rag"


def asks_for_explanation(message: str) -> bool:
    lowered = message.lower()
    return any(
        marker in lowered
        for marker in [
            "explain",
            "detail",
            "detailed",
            "why",
            "how",
            "step",
            "solution",
            "solve",
        ]
    )


def build_formatter_prompt(
    *,
    user_message: str,
    raw_answer: str,
    citations: list[dict[str, Any]],
    conversation_summary: str | None,
    route: dict[str, str | None],
) -> str:
    citation_lines = "\n".join(
        f"- {citation.get('title', 'Source')} page {citation.get('pageStart', '?')}"
        for citation in citations[:4]
    )
    if route.get("intent") == "exact_exercise_question":
        detail_rule = (
            "This is an answer-key request. Preserve every numbered item and subpart from the retrieved answer. "
            "Do not omit, merge, reinterpret, or add explanations unless the student explicitly asks for explanation."
        )
    else:
        detail_rule = "If the student asks for detail, explain step-by-step. Otherwise keep it short and exam-useful."

    return f"""You are Learn AI, a precise CBSE Class 11/12 study tutor.

Your job is ONLY to format and teach from the retrieved RAG answer.
Do not invent facts, questions, examples, page numbers, or formulas.
Answer only what the student asked. Do not add extra concepts, summaries, quizzes, or motivational filler.
If the student asks for only an answer, give only the answer.
If the student asks for a solution/explanation, explain only that object step-by-step.
If the retrieved answer is short, keep your response short.
Use clean plain text equations. Avoid LaTeX unless the raw answer already needs it.
Sound like a sharp study tutor, not a database dump.
Do not include a source/citation line in the answer text; citations are rendered separately in the UI.

Student asked:
{user_message}

Conversation memory:
{conversation_summary or "No previous memory."}

Retrieved answer:
{raw_answer}

Citations:
{citation_lines or "- No citation available"}

Style rules:
- Start with the direct answer.
- Never drop any retrieved answer line, numbered item, subpart, condition, or final value.
- Use bullets or small sections only when they directly answer the user.
- {detail_rule}
- No preface, no recap, no "based on the text" wording.
- Maximum 140 words unless the student explicitly asks for detail.
"""


def call_ollama(prompt: str) -> str | None:
    payload = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.15,
            "num_predict": 700,
        },
    }
    for base_url in ollama_base_url_candidates(settings.ollama_base_url):
        data = post_json(f"{base_url.rstrip('/')}/api/generate", payload, headers={})
        if isinstance(data, dict):
            return clean_model_text(str(data.get("response") or ""))
    return None


def call_openai(prompt: str) -> str | None:
    if not settings.openai_api_key:
        return None

    payload = {
        "model": settings.openai_model,
        "input": [
            {
                "role": "user",
                "content": prompt,
            }
        ],
        "temperature": 0.15,
        "max_output_tokens": 700,
    }
    headers = {"Authorization": f"Bearer {settings.openai_api_key}"}
    data = post_json(f"{settings.openai_base_url.rstrip('/')}/responses", payload, headers=headers)
    if not isinstance(data, dict):
        return None
    return clean_model_text(extract_openai_text(data))


def call_huggingface(prompt: str) -> str | None:
    if not settings.huggingface_api_token:
        return None

    payload = {
        "inputs": prompt,
        "parameters": {
            "temperature": 0.2,
            "max_new_tokens": 700,
            "return_full_text": False,
        },
    }
    headers = {"Authorization": f"Bearer {settings.huggingface_api_token}"}
    url = f"https://api-inference.huggingface.co/models/{settings.huggingface_model}"
    data = post_json(url, payload, headers=headers)

    if isinstance(data, list) and data:
        return clean_model_text(str(data[0].get("generated_text") or ""))
    if isinstance(data, dict):
        return clean_model_text(str(data.get("generated_text") or ""))
    return None


def extract_openai_text(data: dict[str, Any]) -> str:
    direct_text = data.get("output_text")
    if isinstance(direct_text, str):
        return direct_text

    parts: list[str] = []
    for item in data.get("output", []):
        if not isinstance(item, dict):
            continue
        for content in item.get("content", []):
            if not isinstance(content, dict):
                continue
            text = content.get("text")
            if isinstance(text, str):
                parts.append(text)
    return "\n".join(parts)


def post_json(url: str, payload: dict[str, Any], headers: dict[str, str]) -> Any | None:
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", **headers},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=settings.tutor_llm_timeout_seconds) as response:
            return json.loads(response.read().decode("utf-8"))
    except (TimeoutError, urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError):
        return None


def ollama_base_url_candidates(base_url: str) -> list[str]:
    candidates = [base_url]
    parsed = urlparse(base_url)
    if parsed.hostname:
        for family, _, _, _, address in socket.getaddrinfo(parsed.hostname, parsed.port or 11434):
            if family != socket.AF_INET:
                continue
            host, port = address
            netloc = f"{host}:{port}"
            candidates.append(urlunparse((parsed.scheme, netloc, parsed.path, "", "", "")))

    deduped: list[str] = []
    for candidate in candidates:
        if candidate not in deduped:
            deduped.append(candidate)
    return deduped


def clean_model_text(text: str) -> str | None:
    cleaned = repair_mojibake(text.strip())
    replacements = {
        "\u00e2\u0080\u0099": "'",
        "\u00e2\u0080\u00b2": "'",
        "\u00e2\u0080\u0093": "-",
        "\u00e2\u0080\u0094": "-",
        "\u00cf\u0086": "phi",
        "\u00c3\u0097": "x",
        "′": "'",
        "φ": "phi",
        "×": "x",
        "Â": "",
    }
    for bad, good in replacements.items():
        cleaned = cleaned.replace(bad, good)
    if not cleaned:
        return None
    return cleaned


def repair_mojibake(text: str) -> str:
    if not any(marker in text for marker in ["â", "Ã", "Ï", "\u0080", "\u0086", "\u0097"]):
        return text
    try:
        return text.encode("latin-1").decode("utf-8")
    except UnicodeError:
        return text
