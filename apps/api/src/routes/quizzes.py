from fastapi import APIRouter

from src.schemas.common import MessageResponse

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


@router.post("", response_model=MessageResponse)
def quizzes_placeholder() -> MessageResponse:
    return MessageResponse(message="Quiz creation not implemented yet")
