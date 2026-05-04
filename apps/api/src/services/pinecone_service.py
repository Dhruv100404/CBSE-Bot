from __future__ import annotations

import json
import re
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from src.core.config import settings


def canonical_namespace(*, subject: str, class_level: int, chapter_slug: str) -> str:
    subject_slug = slugify(subject)
    chapter = slugify(chapter_slug)
    return f"{settings.pinecone_namespace_prefix}-{subject_slug}-{class_level}-{chapter}"


def list_indexes() -> list[dict[str, Any]]:
    data = pinecone_control_request("/indexes")
    return data.get("indexes", []) if isinstance(data, dict) else []


def find_index(index_name: str | None = None) -> dict[str, Any] | None:
    name = index_name or settings.pinecone_index_name
    for index in list_indexes():
        if index.get("name") == name:
            return index
    return None


def list_namespaces(index_name: str | None = None) -> list[dict[str, Any]]:
    index = find_index(index_name)
    if not index:
        return []
    host = index.get("host")
    data = pinecone_data_request(str(host), "/namespaces")
    return data.get("namespaces", []) if isinstance(data, dict) else []


def describe_index_stats(index_name: str | None = None) -> dict[str, Any]:
    index = find_index(index_name)
    if not index:
        return {}
    host = index.get("host")
    return pinecone_data_request(str(host), "/describe_index_stats", method="POST", payload={})


def upsert_records(records: list[dict[str, Any]], *, namespace: str, index_name: str | None = None) -> dict[str, Any]:
    index = find_index(index_name)
    if not index:
        raise RuntimeError(f"Pinecone index not found: {index_name or settings.pinecone_index_name}")
    host = index.get("host")
    payload = {"vectors": records, "namespace": namespace}
    result = pinecone_data_request(str(host), "/vectors/upsert", method="POST", payload=payload)
    if not result or "error" in result:
        raise RuntimeError(f"Pinecone upsert failed: {result.get('error') if result else 'empty response'}")
    return result


def query_records(
    vector: list[float],
    *,
    namespace: str,
    top_k: int = 6,
    filter_metadata: dict[str, Any] | None = None,
    index_name: str | None = None,
) -> dict[str, Any]:
    index = find_index(index_name)
    if not index:
        return {}
    host = index.get("host")
    payload: dict[str, Any] = {
        "vector": vector,
        "namespace": namespace,
        "topK": top_k,
        "includeMetadata": True,
    }
    if filter_metadata:
        payload["filter"] = filter_metadata
    return pinecone_data_request(str(host), "/query", method="POST", payload=payload)


def pinecone_control_request(path: str) -> dict[str, Any]:
    return request_json(f"https://api.pinecone.io{path}")


def pinecone_data_request(host: str, path: str, *, method: str = "GET", payload: dict[str, Any] | None = None) -> dict[str, Any]:
    base = host if host.startswith("http") else f"https://{host}"
    return request_json(f"{base}{path}", method=method, payload=payload)


def request_json(url: str, *, method: str = "GET", payload: dict[str, Any] | None = None) -> dict[str, Any]:
    if not settings.pinecone_api_key:
        return {}
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        url,
        data=body,
        method=method,
        headers={
            "Api-Key": settings.pinecone_api_key,
            "Content-Type": "application/json",
            "X-Pinecone-Api-Version": settings.pinecone_api_version,
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        try:
            return {"error": exc.read().decode("utf-8")}
        except Exception:
            return {"error": str(exc)}
    except (TimeoutError, urllib.error.URLError, json.JSONDecodeError) as exc:
        return {"error": str(exc)}
    except Exception as exc:
        return {"error": str(exc)}


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", value.lower())
    return cleaned.strip("-")
