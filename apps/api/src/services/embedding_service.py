from __future__ import annotations

import json
import socket
import urllib.error
import urllib.request
from urllib.parse import urlparse, urlunparse
from typing import Any

from src.core.config import settings


def embed_texts(texts: list[str]) -> list[list[float]]:
    provider = settings.embedding_provider.lower().strip()
    if provider != "ollama":
        raise RuntimeError(f"Unsupported embedding provider: {settings.embedding_provider}")
    return embed_with_ollama(texts)


def embed_with_ollama(texts: list[str]) -> list[list[float]]:
    payload = {"model": settings.embedding_model, "input": texts}
    for base_url in ollama_base_url_candidates(settings.ollama_base_url):
        data = post_json(f"{base_url.rstrip('/')}/api/embed", payload)
        embeddings = data.get("embeddings") if isinstance(data, dict) else None
        if isinstance(embeddings, list):
            return embeddings
    raise RuntimeError(f"Ollama embedding model unavailable: {settings.embedding_model}")


def post_json(url: str, payload: dict[str, Any]) -> Any | None:
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
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
            candidates.append(urlunparse((parsed.scheme, f"{host}:{port}", parsed.path, "", "", "")))
    deduped: list[str] = []
    for candidate in candidates:
        if candidate not in deduped:
            deduped.append(candidate)
    return deduped
