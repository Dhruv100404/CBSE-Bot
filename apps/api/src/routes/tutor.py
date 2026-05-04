from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from src.services.rag_service import answer_tutor_query, get_chapter_content_map

router = APIRouter(prefix="/tutor", tags=["tutor"])


class TutorRespondRequest(BaseModel):
    message: str
    subjectId: str | None = None
    chapterId: str | None = None
    mode: str = "rag_preview"
    conversationSummary: str | None = None
    recentMessages: list[dict[str, str]] = []
    attachments: list[dict[str, Any]] = []


@router.post("/respond")
def tutor_respond(payload: TutorRespondRequest) -> dict[str, Any]:
    return answer_tutor_query(
        payload.message,
        subject_id=payload.subjectId,
        chapter_id=payload.chapterId,
        conversation_summary=payload.conversationSummary,
        recent_messages=payload.recentMessages,
    )


@router.get("/context")
def tutor_context() -> dict[str, Any]:
    from src.services.rag_service import get_available_rag_context

    return get_available_rag_context()


@router.get("/chapters/{subject_id}/{chapter_id}/objects")
def tutor_chapter_objects(subject_id: str, chapter_id: str) -> dict[str, Any]:
    return get_chapter_content_map(subject_id, chapter_id)
