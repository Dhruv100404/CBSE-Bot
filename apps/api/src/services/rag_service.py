from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

from src.services.embedding_service import embed_texts
from src.services.llm_formatter import format_rag_answer
from src.services.pinecone_service import canonical_namespace, query_records


REPO_ROOT = Path(__file__).resolve().parents[4]
CONTENT_INDEX_PATH = REPO_ROOT / "data" / "cbse-ai-content" / "index.json"
CONTENT_NAMESPACE_ROOT = REPO_ROOT / "data" / "cbse-ai-content"
CONTENT_MANIFEST_PATH = (
    REPO_ROOT
    / "data"
    / "ocr-output"
    / "math-class12-ch1"
    / "chapter-1.pages.content-objects.with-answers.json"
)

EXAMPLE_QUERY_RE = re.compile(r"\bexample\s+(?P<number>\d+)\b", re.IGNORECASE)
EXERCISE_QUERY_RE = re.compile(
    r"\bexercise\s+(?P<exercise>\d+\.\d+)\b.*\b(?:q|question)\s*(?P<question>\d+)\b",
    re.IGNORECASE,
)


@lru_cache(maxsize=1)
def load_content_objects() -> list[dict[str, Any]]:
    namespace_objects = load_namespace_objects()
    if namespace_objects:
        return namespace_objects
    if not CONTENT_MANIFEST_PATH.exists():
        return []
    return json.loads(CONTENT_MANIFEST_PATH.read_text(encoding="utf-8"))


def load_namespace_objects() -> list[dict[str, Any]]:
    if not CONTENT_INDEX_PATH.exists():
        return []

    index = json.loads(CONTENT_INDEX_PATH.read_text(encoding="utf-8"))
    objects: list[dict[str, Any]] = []
    for subject in index.get("subjects", []):
        for chapter in subject.get("chapters", []):
            objects_path = CONTENT_NAMESPACE_ROOT / chapter["path"] / "objects.json"
            if not objects_path.exists():
                continue
            namespace_items = json.loads(objects_path.read_text(encoding="utf-8"))
            objects.extend(namespace_to_legacy_object(item) for item in namespace_items)
    return objects


def namespace_to_legacy_object(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": item.get("id"),
        "object_type": item.get("type"),
        "object_key": item.get("key"),
        "title": item.get("title"),
        "body_text": item.get("bodyText"),
        "normalized_text": item.get("normalizedText"),
        "page_start": item.get("pageStart"),
        "page_end": item.get("pageEnd"),
        "sequence_index": item.get("sequenceIndex"),
        "source_span_json": (item.get("source") or {}).get("span") or {},
        "metadata_json": {
            "subject": item.get("subject"),
            "class_level": item.get("classLevel"),
            "chapter_slug": item.get("chapterSlug"),
            "chapter_title": item.get("chapterTitle"),
            "exercise_number": item.get("exerciseNumber"),
            "question_number": item.get("questionNumber"),
            "example_number": item.get("exampleNumber"),
            "definition_number": item.get("definitionNumber"),
            "section_number": item.get("sectionNumber"),
            "content_namespace": "cbse-ai-content",
            **(item.get("metadata") or {}),
        },
        "confidence_score": item.get("confidence"),
        "status": item.get("status"),
    }


def get_available_rag_context() -> dict[str, Any]:
    namespace_context = get_namespace_rag_context()
    if namespace_context:
        return namespace_context

    objects = load_content_objects()
    chapters: dict[str, dict[str, Any]] = {}
    for item in objects:
        metadata = item.get("metadata_json") or {}
        chapter_slug = metadata.get("chapter_slug", "relations-and-functions")
        chapter = chapters.setdefault(
            chapter_slug,
            {
                "subjectId": "mathematics-12",
                "subjectName": "Mathematics",
                "classLevel": 12,
                "chapterId": chapter_slug,
                "chapterTitle": metadata.get("chapter_title", "Relations and Functions"),
                "objectCount": 0,
                "examples": 0,
                "exerciseQuestions": 0,
                "exerciseAnswers": 0,
            },
        )
        chapter["objectCount"] += 1
        if item.get("object_type") == "example":
            chapter["examples"] += 1
        if item.get("object_type") == "exercise_question":
            chapter["exerciseQuestions"] += 1
        if item.get("object_type") == "exercise_answer":
            chapter["exerciseAnswers"] += 1

    return {
        "subjects": [
            {
                "id": "mathematics-12",
                "name": "Mathematics",
                "classLevel": 12,
                "available": True,
                "chapters": list(chapters.values()),
            },
            {"id": "physics-12", "name": "Physics", "classLevel": 12, "available": False, "chapters": []},
            {"id": "chemistry-12", "name": "Chemistry", "classLevel": 12, "available": False, "chapters": []},
            {"id": "biology-12", "name": "Biology", "classLevel": 12, "available": False, "chapters": []},
        ]
    }


def get_namespace_rag_context() -> dict[str, Any] | None:
    if not CONTENT_INDEX_PATH.exists():
        return None
    index = json.loads(CONTENT_INDEX_PATH.read_text(encoding="utf-8"))
    subjects: list[dict[str, Any]] = []
    for subject in index.get("subjects", []):
        chapters = []
        for chapter in subject.get("chapters", []):
            counts = chapter.get("counts") or {}
            chapters.append(
                {
                    "subjectId": subject["id"],
                    "subjectName": subject["name"],
                    "classLevel": subject["classLevel"],
                    "chapterId": chapter["slug"],
                    "chapterTitle": chapter["title"],
                    "objectCount": sum(int(value) for value in counts.values()),
                    "examples": counts.get("example", 0),
                    "exerciseQuestions": counts.get("exercise_question", 0),
                    "exerciseAnswers": counts.get("exercise_answer", 0),
                    "definitions": counts.get("definition", 0),
                    "formulas": counts.get("formula", 0),
                    "namespacePath": chapter["path"],
                    "pineconeNamespace": canonical_namespace(
                        subject=subject["slug"],
                        class_level=int(subject["classLevel"]),
                        chapter_slug=chapter["slug"],
                    ),
                }
            )
        subjects.append(
            {
                "id": subject["id"],
                "name": subject["name"],
                "classLevel": subject["classLevel"],
                "available": bool(chapters),
                "chapters": chapters,
            }
        )

    known_subject_ids = {subject["id"] for subject in subjects}
    for subject_id, name in [
        ("physics-12", "Physics"),
        ("chemistry-12", "Chemistry"),
        ("biology-12", "Biology"),
    ]:
        if subject_id not in known_subject_ids:
            subjects.append({"id": subject_id, "name": name, "classLevel": 12, "available": False, "chapters": []})
    return {"subjects": subjects}


def get_chapter_content_map(subject_id: str, chapter_id: str) -> dict[str, Any]:
    chapter_path = find_namespace_chapter_path(subject_id, chapter_id)
    if not chapter_path:
        return {
            "subjectId": subject_id,
            "chapterId": chapter_id,
            "available": False,
            "examples": [],
            "exercises": [],
            "definitions": [],
            "formulas": [],
            "content": [],
        }

    chapter_dir = CONTENT_NAMESPACE_ROOT / chapter_path
    chapter = read_json_file(chapter_dir / "chapter.json", {})
    examples = read_json_file(chapter_dir / "examples.json", [])
    exercises = read_json_file(chapter_dir / "exercises.json", [])
    definitions = read_json_file(chapter_dir / "definitions.json", [])
    formulas = read_json_file(chapter_dir / "formulas.json", [])
    content = read_json_file(chapter_dir / "content.json", [])

    return {
        "subjectId": subject_id,
        "chapterId": chapter_id,
        "available": True,
        "chapter": chapter,
        "examples": [compact_namespace_object(item, "example") for item in examples],
        "exercises": [compact_exercise(item) for item in exercises],
        "definitions": [compact_namespace_object(item, "definition") for item in definitions],
        "formulas": [compact_namespace_object(item, "formula") for item in formulas[:40]],
        "content": [compact_namespace_object(item, "content") for item in content],
    }


def find_namespace_chapter_path(subject_id: str, chapter_id: str) -> str | None:
    if not CONTENT_INDEX_PATH.exists():
        return None
    index = json.loads(CONTENT_INDEX_PATH.read_text(encoding="utf-8"))
    for subject in index.get("subjects", []):
        if subject.get("id") != subject_id:
            continue
        for chapter in subject.get("chapters", []):
            if chapter.get("slug") == chapter_id:
                return str(chapter.get("path"))
    return None


def compact_namespace_object(item: dict[str, Any], kind: str) -> dict[str, Any]:
    return {
        "kind": kind,
        "key": item.get("key"),
        "title": item.get("title"),
        "number": item.get("exampleNumber") or item.get("definitionNumber"),
        "pageStart": item.get("pageStart"),
        "pageEnd": item.get("pageEnd"),
        "preview": preview_text(str(item.get("bodyText", "")), 260),
        "hasAnswer": False,
    }


def compact_exercise(item: dict[str, Any]) -> dict[str, Any]:
    questions = item.get("questions") or []
    return {
        "kind": "exercise",
        "exerciseNumber": item.get("exerciseNumber"),
        "questionCount": item.get("questionCount", len(questions)),
        "answerCount": item.get("answerCount", 0),
        "questions": [
            {
                "kind": "exercise_question",
                "key": question.get("key"),
                "title": question.get("title"),
                "questionNumber": question.get("questionNumber"),
                "pageStart": question.get("pageStart"),
                "pageEnd": question.get("pageEnd"),
                "preview": preview_text(str(question.get("questionText", "")), 220),
                "hasAnswer": bool(question.get("answerText")),
            }
            for question in questions
        ],
    }


def preview_text(text: str, max_chars: int) -> str:
    text = " ".join(clean_text(text).split())
    return f"{text[: max_chars - 3]}..." if len(text) > max_chars else text


def read_json_file(path: Path, fallback: Any) -> Any:
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def answer_tutor_query(
    message: str,
    *,
    subject_id: str | None = None,
    chapter_id: str | None = None,
    conversation_summary: str | None = None,
    recent_messages: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    objects = filter_objects_for_context(load_content_objects(), subject_id, chapter_id)
    route = route_query(message)
    matches = find_matches(objects, route, message=message, subject_id=subject_id, chapter_id=chapter_id)

    if not matches:
        return {
            "answerText": fallback_answer(message),
            "summaryBullets": [
                "I could not find an exact Example or Exercise match in the local Chapter 1 RAG set yet.",
                "Try asking: 'Give me solution of Example 1' or 'In Exercise 1.1 tell me answer of Q1'.",
            ],
            "citations": [],
            "confidenceScore": 0.36,
            "route": route,
            "matches": [],
            "conversationSummary": update_conversation_summary(
                conversation_summary,
                message,
                "No exact RAG match found.",
                route,
            ),
            "formatter": "deterministic_rag",
        }

    raw_answer_text = build_answer_text(matches, route)
    citations = [build_citation(item) for item in matches]
    answer_text, formatter = format_rag_answer(
        user_message=message,
        raw_answer=raw_answer_text,
        citations=citations,
        conversation_summary=conversation_summary,
        route=route,
    )
    return {
        "answerText": answer_text,
        "summaryBullets": build_summary(matches, route),
        "citations": citations,
        "confidenceScore": 0.88 if route["intent"].startswith("exact") else 0.62,
        "route": route,
        "matches": [serialize_match(item) for item in matches],
        "conversationSummary": update_conversation_summary(conversation_summary, message, answer_text, route),
        "formatter": formatter,
        "rawAnswerText": raw_answer_text,
    }


def filter_objects_for_context(
    objects: list[dict[str, Any]],
    subject_id: str | None,
    chapter_id: str | None,
) -> list[dict[str, Any]]:
    if not subject_id and not chapter_id:
        return objects

    filtered: list[dict[str, Any]] = []
    for item in objects:
        metadata = item.get("metadata_json") or {}
        subject_matches = not subject_id or subject_id == "mathematics-12"
        chapter_matches = not chapter_id or metadata.get("chapter_slug") == chapter_id
        if subject_matches and chapter_matches:
            filtered.append(item)
    return filtered


def route_query(message: str) -> dict[str, str | None]:
    exercise_match = EXERCISE_QUERY_RE.search(message)
    if exercise_match:
        return {
            "intent": "exact_exercise_question",
            "objectKey": f"exercise:{exercise_match.group('exercise')}:q{exercise_match.group('question')}",
        }

    example_match = EXAMPLE_QUERY_RE.search(message)
    if example_match:
        return {"intent": "exact_example", "objectKey": f"example:{example_match.group('number')}"}

    return {"intent": "semantic_preview", "objectKey": None}


def find_matches(
    objects: list[dict[str, Any]],
    route: dict[str, str | None],
    *,
    message: str,
    subject_id: str | None,
    chapter_id: str | None,
) -> list[dict[str, Any]]:
    object_key = route.get("objectKey")
    if object_key:
        target_keys = {object_key, f"{object_key}:answer"}
        return [item for item in objects if item.get("object_key") in target_keys]

    pinecone_matches = find_semantic_matches(message, subject_id=subject_id, chapter_id=chapter_id)
    if pinecone_matches:
        return pinecone_matches

    return [
        item
        for item in objects
        if item.get("object_type") in {"definition", "general_content", "example"}
    ][:4]


def find_semantic_matches(message: str, *, subject_id: str | None, chapter_id: str | None) -> list[dict[str, Any]]:
    namespace = namespace_for_context(subject_id, chapter_id)
    if not namespace:
        return []
    try:
        vector = embed_texts([message])[0]
        result = query_records(vector, namespace=namespace, top_k=8)
    except Exception:
        return []

    matches = []
    formula_requested = asks_for_formula(message)
    for match in result.get("matches", []):
        metadata = match.get("metadata") or {}
        object_type = metadata.get("objectType", "retrieval_chunk")
        if object_type == "formula_reference" and not formula_requested:
            continue
        text = metadata.get("text") or metadata.get("textPreview") or ""
        if not text:
            continue
        matches.append(
            {
                "id": match.get("id"),
                "object_type": object_type,
                "object_key": metadata.get("objectKey") or match.get("id"),
                "title": metadata.get("title", "Retrieved chapter source"),
                "body_text": text,
                "normalized_text": text,
                "page_start": metadata.get("pageStart"),
                "page_end": metadata.get("pageEnd"),
                "metadata_json": {
                    "chapter_title": metadata.get("chapterTitle"),
                    "chapter_slug": metadata.get("chapterSlug"),
                    "source": metadata.get("source"),
                    "pinecone_score": match.get("score"),
                    "pinecone_namespace": namespace,
                },
                "confidence_score": match.get("score"),
                "status": "indexed",
            }
        )
        if len(matches) >= 4:
            break
    return matches


def asks_for_formula(message: str) -> bool:
    lowered = message.lower()
    return any(marker in lowered for marker in ["formula", "equation", "symbol", "derive", "derivation"])


def namespace_for_context(subject_id: str | None, chapter_id: str | None) -> str | None:
    if not subject_id or not chapter_id:
        return None
    subject_slug, class_level = parse_subject_id(subject_id)
    if not subject_slug or not class_level:
        return None
    return canonical_namespace(subject=subject_slug, class_level=class_level, chapter_slug=chapter_id)


def parse_subject_id(subject_id: str) -> tuple[str | None, int | None]:
    match = re.match(r"(?P<subject>[a-z-]+)-(?P<class_level>\d{2})$", subject_id)
    if not match:
        return None, None
    return match.group("subject"), int(match.group("class_level"))


def build_answer_text(matches: list[dict[str, Any]], route: dict[str, str | None]) -> str:
    if route["intent"] == "exact_exercise_question":
        question = next((item for item in matches if item["object_type"] == "exercise_question"), None)
        answer = next((item for item in matches if item["object_type"] == "exercise_answer"), None)
        if answer:
            return format_exercise_answer(answer["body_text"])
        if question:
            return "I found the question, but the answer key for this exact item is not indexed yet."
        return "I could not find this exercise question in the indexed chapter."

    if route["intent"] == "exact_example":
        return format_example_answer(matches[0]["body_text"])

    return format_concept_preview(matches)


def build_summary(matches: list[dict[str, Any]], route: dict[str, str | None]) -> list[str]:
    if route["intent"] == "exact_example":
        return ["Exact example matched."]
    if route["intent"] == "exact_exercise_question":
        has_answer = any(item["object_type"] == "exercise_answer" for item in matches)
        return ["Answer key found." if has_answer else "Answer key not found yet."]
    return ["Pinecone chapter retrieval used."]


def build_citation(item: dict[str, Any]) -> dict[str, Any]:
    metadata = item.get("metadata_json") or {}
    return {
        "title": item.get("title"),
        "objectType": item.get("object_type"),
        "objectKey": item.get("object_key"),
        "chapterTitle": metadata.get("chapter_title", "Relations and Functions"),
        "pageStart": item.get("page_start"),
        "pageEnd": item.get("page_end"),
    }


def serialize_match(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "objectType": item.get("object_type"),
        "objectKey": item.get("object_key"),
        "title": item.get("title"),
        "pageStart": item.get("page_start"),
        "pageEnd": item.get("page_end"),
        "bodyPreview": clean_text(str(item.get("body_text", "")))[:1200],
    }


def fallback_answer(message: str) -> str:
    return (
        "The Chapter 1 RAG demo is live, but this question did not map to an exact stored object yet. "
        f"Your query was: {message}"
    )


def format_exercise_answer(answer_text: str) -> str:
    cleaned = clean_text(answer_text).strip()
    if cleaned.startswith("1. "):
        cleaned = cleaned[3:].strip()
    return f"Answer:\n{cleaned}"


def format_example_answer(example_text: str) -> str:
    example_text = clean_text(example_text)
    if "Solution" not in example_text:
        return example_text
    problem, solution = example_text.split("Solution", 1)
    return f"{problem.strip()}\n\nSolution:\n{solution.strip()}"


def format_concept_preview(matches: list[dict[str, Any]]) -> str:
    if not matches:
        return "I could not find a grounded match in this chapter yet."
    blocks = []
    for item in matches[:3]:
        title = item.get("title") or "Chapter note"
        body = clean_text(str(item.get("body_text", ""))).strip()
        blocks.append(f"{title}\n{body[:700]}")
    return "\n\n".join(blocks)


def clean_text(text: str) -> str:
    try:
        text = text.encode("latin-1").decode("utf-8")
    except UnicodeError:
        pass
    replacements = {
        "\u00e2\u0080\u0099": "'",
        "\u00e2\u0080\u0098": "'",
        "\u00e2\u0080\u00b2": "'",
        "\u00e2\u0080\u0093": "-",
        "\u00e2\u0080\u0094": "-",
        "\u00e2\u0088\u0092": "-",
        "\u00e2\u0086\u0092": "->",
        "\u00e2\u0087\u0092": "=>",
        "\u00e2\u0088\u0088": "in",
        "\u00e2\u0088\u0089": "not in",
        "\u00e2\u008a\u0082": "subset",
        "\u00e2\u0089\u00a4": "<=",
        "\u00e2\u0089\u00a5": ">=",
        "\u00e2\u0088\u00aa": "union",
        "\u00e2\u0088\u00a9": "intersection",
        "\u00cf\u0086": "phi",
        "\u00c3\u0097": "x",
        "â": "-",
        "â": "-",
        "â": "-",
        "â": "->",
        "â": "=>",
        "â¤": "<=",
        "â¥": ">=",
        "â": "in",
        "â": "not in",
        "â": "subset",
        "âª": "union",
        "â©": "intersection",
        "Ï": "phi",
        "Ã": "x",
        "Â": "",
        "′": "'",
        "→": "->",
        "⇒": "=>",
        "∪": "union",
        "∩": "intersection",
        "φ": "phi",
        "×": "x",
    }
    cleaned = text
    for bad, good in replacements.items():
        cleaned = cleaned.replace(bad, good)
    return cleaned


def update_conversation_summary(
    current_summary: str | None,
    user_message: str,
    answer_text: str,
    route: dict[str, str | None],
) -> str:
    previous = (current_summary or "").strip()
    answer_hint = " ".join(answer_text.split())[:220]
    new_line = (
        f"User asked: {user_message.strip()} | "
        f"route={route.get('intent')} | source={route.get('objectKey') or 'semantic_preview'} | "
        f"answer_basis={answer_hint}"
    )
    if not previous:
        return new_line
    combined = f"{previous}\n{new_line}"
    lines = combined.splitlines()[-6:]
    return "\n".join(lines)
