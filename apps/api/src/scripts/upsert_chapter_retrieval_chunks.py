from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from src.core.config import settings
from src.services.embedding_service import embed_texts
from src.services.pinecone_service import describe_index_stats, upsert_records


REPO_ROOT = Path(__file__).resolve().parents[4]
CHUNKS_PATH = (
    REPO_ROOT
    / "data"
    / "cbse-ai-content"
    / "mathematics"
    / "class-12"
    / "relations-and-functions"
    / "retrieval-chunks.json"
)


def main() -> None:
    payload = json.loads(CHUNKS_PATH.read_text(encoding="utf-8"))
    namespace = payload["pineconeNamespace"]
    chunks = payload["chunks"]

    validate_index_dimension()
    total = 0
    for batch in batched(chunks, 32):
        embeddings = embed_texts([chunk["text"] for chunk in batch])
        records = []
        for chunk, embedding in zip(batch, embeddings, strict=True):
            if len(embedding) != settings.embedding_dimension:
                raise RuntimeError(
                    f"Embedding dimension mismatch for {chunk['id']}: "
                    f"{len(embedding)} != {settings.embedding_dimension}"
                )
            records.append(
                {
                    "id": chunk["id"],
                    "values": embedding,
                    "metadata": {
                        **chunk["metadata"],
                        "text": chunk["text"][:8000],
                        "embeddingModel": f"{settings.embedding_provider}:{settings.embedding_model}",
                        "chunkSchemaVersion": payload["schemaVersion"],
                    },
                }
            )
        result = upsert_records(records, namespace=namespace)
        total += int(result.get("upsertedCount", len(records)))
        print(f"Upserted batch: {len(records)} records")

    print(json.dumps({"namespace": namespace, "upserted": total}, indent=2))


def validate_index_dimension() -> None:
    stats = describe_index_stats()
    dimension = stats.get("dimension")
    if dimension and int(dimension) != settings.embedding_dimension:
        raise RuntimeError(f"Pinecone index dimension {dimension} != configured embedding dimension {settings.embedding_dimension}")


def batched(items: list[dict[str, Any]], size: int) -> list[list[dict[str, Any]]]:
    return [items[index : index + size] for index in range(0, len(items), size)]


if __name__ == "__main__":
    main()
