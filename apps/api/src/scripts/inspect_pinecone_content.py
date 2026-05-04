from __future__ import annotations

import json
from pathlib import Path

from src.services.pinecone_service import canonical_namespace, describe_index_stats, find_index, list_namespaces


REPO_ROOT = Path(__file__).resolve().parents[4]
CONTENT_INDEX_PATH = REPO_ROOT / "data" / "cbse-ai-content" / "index.json"
CONTENT_NAMESPACE_ROOT = REPO_ROOT / "data" / "cbse-ai-content"


def main() -> None:
    index = find_index()
    if not index:
        raise SystemExit("Pinecone index not found or PINECONE_API_KEY missing.")

    local_namespaces = expected_local_namespaces()
    remote_namespaces = list_namespaces()
    stats = describe_index_stats()

    payload = {
        "index": {
            "name": index.get("name"),
            "dimension": index.get("dimension"),
            "metric": index.get("metric"),
            "host": index.get("host"),
            "ready": (index.get("status") or {}).get("ready"),
        },
        "remoteNamespaces": remote_namespaces,
        "expectedLocalNamespaces": local_namespaces,
        "statsNamespaces": stats.get("namespaces", {}),
        "recommendation": "Use one Pinecone namespace per subject/class/chapter and keep object type in metadata.",
    }
    print(json.dumps(payload, indent=2))


def expected_local_namespaces() -> list[dict[str, str | int | None]]:
    if not CONTENT_INDEX_PATH.exists():
        return []
    content_index = json.loads(CONTENT_INDEX_PATH.read_text(encoding="utf-8"))
    namespaces: list[dict[str, str | int | None]] = []
    for subject in content_index.get("subjects", []):
        for chapter in subject.get("chapters", []):
            namespace = canonical_namespace(
                subject=subject["slug"],
                class_level=int(subject["classLevel"]),
                chapter_slug=chapter["slug"],
            )
            namespaces.append(
                {
                    "subjectId": subject["id"],
                    "chapterSlug": chapter["slug"],
                    "namespace": namespace,
                    "currentBroadNamespace": f"cbse-{subject['slug'][:4]}-{subject['classLevel']}",
                    "objectsExpected": sum(int(value) for value in (chapter.get("counts") or {}).values()),
                    "retrievalChunksExpected": retrieval_chunk_count(chapter["path"]),
                }
            )
    return namespaces


def retrieval_chunk_count(chapter_path: str) -> int | None:
    chunks_path = CONTENT_NAMESPACE_ROOT / chapter_path / "retrieval-chunks.json"
    if not chunks_path.exists():
        return None
    payload = json.loads(chunks_path.read_text(encoding="utf-8"))
    return int(payload.get("chunkCount", 0))


if __name__ == "__main__":
    main()
