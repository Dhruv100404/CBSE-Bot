from typing import Any

from fastapi import APIRouter
from fastapi.responses import Response
from pydantic import BaseModel, Field

from src.services.paper_studio_service import generate_paper_draft, get_question_bank, render_exam_pdf

router = APIRouter(prefix="/paper-blueprints", tags=["paper_blueprints"])


class PaperSectionRequest(BaseModel):
    title: str
    instructions: str | None = None
    questionType: str = "short_answer"
    questionCount: int = Field(default=5, ge=1, le=30)
    marksPerQuestion: int = Field(default=1, ge=1, le=10)
    sourceTypes: list[str] = Field(default_factory=lambda: ["exercise"])


class GeneratePaperDraftRequest(BaseModel):
    title: str = "Class 12 Mathematics Practice Paper"
    classLevel: int = 12
    subjectId: str = "mathematics-12"
    chapterIds: list[str] = Field(default_factory=lambda: ["relations-and-functions"])
    totalMarks: int = Field(default=40, ge=1, le=100)
    durationMinutes: int = Field(default=90, ge=15, le=240)
    instructions: str | None = None
    seed: str | None = None
    sections: list[PaperSectionRequest]


class ExportPaperPdfRequest(BaseModel):
    draft: dict[str, Any]
    schoolName: str = "St. Xavier's Gandhinagar"
    courseName: str = "Full Course"
    examName: str = "Annual Exam"
    examDate: str = "15/04/26"
    showAnswerKey: bool = False


@router.get("/question-bank")
def question_bank() -> dict[str, Any]:
    return get_question_bank()


@router.post("/generate-draft")
def generate_draft(payload: GeneratePaperDraftRequest) -> dict[str, Any]:
    return generate_paper_draft(payload.model_dump())


@router.post("/export-pdf")
def export_pdf(payload: ExportPaperPdfRequest) -> Response:
    pdf_bytes = render_exam_pdf(payload.model_dump())
    filename = f"{payload.draft.get('title', 'question-paper')}.pdf".replace(" ", "-")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
