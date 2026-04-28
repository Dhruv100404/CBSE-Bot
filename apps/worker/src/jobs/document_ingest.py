def queue_document_ingest(document_id: str) -> dict[str, str]:
    return {"document_id": document_id, "status": "queued"}
