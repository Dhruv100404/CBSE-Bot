from fastapi import APIRouter

from src.schemas.common import MessageResponse

router = APIRouter(prefix="/paper-blueprints", tags=["paper_blueprints"])


@router.post("", response_model=MessageResponse)
def paper_blueprints_placeholder() -> MessageResponse:
    return MessageResponse(message="Paper blueprint generation not implemented yet")
