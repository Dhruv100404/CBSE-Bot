from fastapi import APIRouter

from src.schemas.common import MessageResponse

router = APIRouter(prefix="/review-queue", tags=["review_queue"])


@router.get("", response_model=MessageResponse)
def review_queue_placeholder() -> MessageResponse:
    return MessageResponse(message="Review queue not implemented yet")
