def run_ingest_pipeline(document_id: str) -> dict[str, str]:
    return {
        "document_id": document_id,
        "stage": "placeholder",
        "message": "Ingest pipeline skeleton is ready for OCR and chunking stages.",
    }
