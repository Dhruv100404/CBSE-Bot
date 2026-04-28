from fastapi import APIRouter

from src.schemas.common import MessageResponse

router = APIRouter(prefix="/paper-uploads", tags=["paper_uploads"])


@router.post("", response_model=MessageResponse)
def paper_uploads_placeholder() -> MessageResponse:
    return MessageResponse(message="Paper uploads not implemented yet")
