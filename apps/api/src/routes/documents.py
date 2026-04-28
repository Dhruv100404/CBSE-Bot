from fastapi import APIRouter

from src.schemas.common import MessageResponse

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("/placeholder", response_model=MessageResponse)
def documents_placeholder() -> MessageResponse:
    return MessageResponse(message="Documents API not implemented yet")
