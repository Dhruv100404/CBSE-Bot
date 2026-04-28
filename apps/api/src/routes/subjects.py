from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.core.db import get_db
from src.models.curriculum import Subject
from src.schemas.curriculum import SubjectListItem, SubjectListResponse

router = APIRouter(tags=["subjects"])


@router.get("/subjects", response_model=SubjectListResponse)
def list_subjects(db: Session = Depends(get_db)) -> SubjectListResponse:
    records = db.scalars(select(Subject).order_by(Subject.class_level, Subject.name)).all()
    items = [
        SubjectListItem(
            id=record.id,
            class_level=record.class_level,
            code=record.code,
            name=record.name,
            slug=record.slug,
        )
        for record in records
    ]
    return SubjectListResponse(items=items)
