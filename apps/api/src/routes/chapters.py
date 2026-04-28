from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.core.db import get_db
from src.models.curriculum import Chapter, Subject
from src.schemas.curriculum import ChapterListItem, ChapterListResponse

router = APIRouter(tags=["chapters"])


@router.get("/subjects/{subject_id}/chapters", response_model=ChapterListResponse)
def list_subject_chapters(subject_id: str, db: Session = Depends(get_db)) -> ChapterListResponse:
    subject = db.scalar(select(Subject).where(Subject.id == subject_id))
    if not subject:
        return ChapterListResponse(items=[])

    records = db.scalars(
        select(Chapter).where(Chapter.subject_id == subject_id).order_by(Chapter.sequence_index, Chapter.name)
    ).all()
    items = [
        ChapterListItem(id=record.id, name=record.name, slug=record.slug, sequence_index=record.sequence_index)
        for record in records
    ]
    return ChapterListResponse(items=items)
