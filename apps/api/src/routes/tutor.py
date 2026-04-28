from fastapi import APIRouter

from src.schemas.common import MessageResponse

router = APIRouter(prefix="/tutor", tags=["tutor"])


@router.post("/respond", response_model=MessageResponse)
def tutor_placeholder() -> MessageResponse:
    return MessageResponse(message="Tutor orchestration not implemented yet")
