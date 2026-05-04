from __future__ import annotations

import hashlib
import json
import random
from io import BytesIO
from pathlib import Path
from typing import Any
from uuid import uuid4

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


REPO_ROOT = Path(__file__).resolve().parents[4]
CHAPTER_DIR = REPO_ROOT / "data" / "cbse-ai-content" / "mathematics" / "class-12" / "relations-and-functions"


def get_question_bank() -> dict[str, Any]:
    questions = load_question_bank()
    return {
        "subjectId": "mathematics-12",
        "classLevel": 12,
        "chapterId": "relations-and-functions",
        "chapterTitle": "Relations and Functions",
        "totalQuestions": len(questions),
        "questions": questions,
    }


def generate_paper_draft(payload: dict[str, Any]) -> dict[str, Any]:
    bank = load_question_bank()
    seed = str(payload.get("seed") or payload.get("title") or "learn-ai-paper")
    rng = random.Random(seed)
    available = bank[:]
    rng.shuffle(available)

    sections = []
    used_keys: set[str] = set()
    for index, section in enumerate(payload.get("sections", []), start=1):
        section_questions = pick_questions_for_section(available, used_keys, section, rng)
        sections.append(
            {
                "id": f"section-{index}",
                "title": section.get("title") or f"Section {chr(64 + index)}",
                "instructions": section.get("instructions") or default_section_instruction(section),
                "questionType": section.get("questionType", "short_answer"),
                "marksPerQuestion": int(section.get("marksPerQuestion") or 1),
                "questionCount": len(section_questions),
                "totalMarks": sum(int(question["marks"]) for question in section_questions),
                "questions": section_questions,
            }
        )

    sections = renumber_sections(sections)
    total_marks = sum(section["totalMarks"] for section in sections)
    answer_key = [
        {
            "questionNumber": question["paperQuestionNumber"],
            "sourceKey": question["sourceKey"],
            "answerText": question.get("answerText") or "Answer key not available yet.",
            "marks": question["marks"],
        }
        for section in sections
        for question in section["questions"]
    ]

    return {
        "id": str(uuid4()),
        "title": payload.get("title") or "Class 12 Mathematics Practice Paper",
        "classLevel": int(payload.get("classLevel") or 12),
        "subjectId": payload.get("subjectId") or "mathematics-12",
        "subjectName": "Mathematics",
        "durationMinutes": int(payload.get("durationMinutes") or 60),
        "totalMarks": total_marks,
        "requestedMarks": int(payload.get("totalMarks") or total_marks),
        "chapterIds": payload.get("chapterIds") or ["relations-and-functions"],
        "instructions": payload.get("instructions") or default_paper_instructions(),
        "sections": sections,
        "answerKey": answer_key,
        "quality": quality_summary(sections, payload),
    }


def render_exam_pdf(payload: dict[str, Any]) -> bytes:
    draft = payload["draft"]
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=12 * mm,
        leftMargin=12 * mm,
        topMargin=10 * mm,
        bottomMargin=10 * mm,
        title=draft.get("title", "Question Paper"),
        author="Learn AI",
    )

    styles = exam_styles()
    story: list[Any] = []
    story.extend(build_exam_header(payload, draft, styles))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(f"<b>Instructions:</b> {safe_text(draft.get('instructions', ''))}", styles["small"]))
    story.append(Spacer(1, 4 * mm))

    for section in draft.get("sections", []):
        section_title = (
            f"• Write the answer of the following questions. "
            f"[Each carries {section.get('marksPerQuestion', 1)} Mark"
            f"{'' if int(section.get('marksPerQuestion', 1)) == 1 else 's'}]"
        )
        section_flow: list[Any] = [
            Paragraph(section_title, styles["section"]),
            HRFlowable(width="100%", thickness=0.8, color=colors.black, spaceBefore=1, spaceAfter=2),
        ]
        instructions = section.get("instructions")
        if instructions:
            section_flow.append(Paragraph(safe_text(instructions), styles["tiny"]))
            section_flow.append(Spacer(1, 1.5 * mm))
        story.append(KeepTogether(section_flow))

        for question in section.get("questions", []):
            number = question.get("paperQuestionNumber", "")
            marks = question.get("marks", section.get("marksPerQuestion", ""))
            text = safe_text(question.get("editableText") or question.get("questionText") or "")
            table = Table(
                [
                    [
                        Paragraph(f"<b>{number}.</b>", styles["question_number"]),
                        Paragraph(text.replace("\n", "<br/>"), styles["question"]),
                        Paragraph(f"<b>[{marks}]</b>", styles["marks"]),
                    ]
                ],
                colWidths=[9 * mm, 148 * mm, 14 * mm],
                hAlign="LEFT",
            )
            table.setStyle(
                TableStyle(
                    [
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 0),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 2),
                        ("TOPPADDING", (0, 0), (-1, -1), 1.5),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
                    ]
                )
            )
            story.append(table)
            story.append(Spacer(1, 1.2 * mm))
        story.append(Spacer(1, 2 * mm))

    if payload.get("showAnswerKey"):
        story.append(PageBreak())
        story.append(Paragraph("Answer Key", styles["answer_heading"]))
        story.append(HRFlowable(width="100%", thickness=0.8, color=colors.black, spaceBefore=1, spaceAfter=4))
        for item in draft.get("answerKey", []):
            story.append(
                Paragraph(
                    f"<b>Q{item.get('questionNumber')}.</b> {safe_text(item.get('answerText', 'Answer key not available yet.'))}",
                    styles["small"],
                )
            )
            story.append(Spacer(1, 1.5 * mm))

    doc.build(story)
    return buffer.getvalue()


def build_exam_header(payload: dict[str, Any], draft: dict[str, Any], styles: dict[str, ParagraphStyle]) -> list[Any]:
    school = safe_text(payload.get("schoolName") or "St. Xavier's Gandhinagar")
    course = safe_text(payload.get("courseName") or "Full Course")
    exam = safe_text(payload.get("examName") or "Annual Exam")
    exam_date = safe_text(payload.get("examDate") or "")
    duration = format_duration(int(draft.get("durationMinutes") or 0))
    total_marks = draft.get("totalMarks", "")
    class_level = draft.get("classLevel", 12)
    subject = safe_text(draft.get("subjectName") or "Maths")
    title = safe_text(draft.get("title") or "")

    header = Table(
        [
            [
                Paragraph(f"<b>{school}</b><br/>{course}<br/>Std {class_level} : {subject}", styles["header_left"]),
                Paragraph(
                    f"Date : {exam_date}<br/>Total Marks : {total_marks}<br/>{exam}<br/>Time : {duration}",
                    styles["header_right"],
                ),
            ],
            [Paragraph("<b>Welcome To Future - Quantum Paper</b>", styles["center"]), ""],
            [Paragraph(f"<b>{title}</b>", styles["paper_title"]), ""],
        ],
        colWidths=[112 * mm, 59 * mm],
        hAlign="LEFT",
    )
    header.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.8, colors.black),
                ("LINEBELOW", (0, 0), (-1, 0), 0.8, colors.black),
                ("LINEBELOW", (0, 1), (-1, 1), 0.8, colors.black),
                ("SPAN", (0, 1), (-1, 1)),
                ("SPAN", (0, 2), (-1, 2)),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return [header]


def exam_styles() -> dict[str, ParagraphStyle]:
    return {
        "header_left": ParagraphStyle("header_left", fontName="Times-Roman", fontSize=11, leading=14, alignment=TA_LEFT),
        "header_right": ParagraphStyle("header_right", fontName="Times-Roman", fontSize=10, leading=13, alignment=TA_RIGHT),
        "center": ParagraphStyle("center", fontName="Times-Roman", fontSize=9, leading=12, alignment=TA_CENTER),
        "paper_title": ParagraphStyle("paper_title", fontName="Times-Bold", fontSize=11, leading=14, alignment=TA_CENTER),
        "small": ParagraphStyle("small", fontName="Times-Roman", fontSize=9.2, leading=12),
        "tiny": ParagraphStyle("tiny", fontName="Times-Roman", fontSize=8.2, leading=10, textColor=colors.HexColor("#333333")),
        "section": ParagraphStyle("section", fontName="Times-Bold", fontSize=10, leading=12),
        "question_number": ParagraphStyle("question_number", fontName="Times-Bold", fontSize=9.5, leading=12),
        "question": ParagraphStyle("question", fontName="Times-Roman", fontSize=9.4, leading=12),
        "marks": ParagraphStyle("marks", fontName="Times-Bold", fontSize=8.8, leading=11, alignment=TA_RIGHT),
        "answer_heading": ParagraphStyle("answer_heading", fontName="Times-Bold", fontSize=14, leading=18),
    }


def safe_text(value: Any) -> str:
    text = str(value or "")
    replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "≤": "&lt;=",
        "≥": "&gt;=",
        "∈": "in",
        "∉": "not in",
        "⊂": "subset",
        "∪": "union",
        "∩": "intersection",
        "→": "-&gt;",
        "⇒": "=&gt;",
        "×": "x",
        "φ": "phi",
        "–": "-",
        "—": "-",
        "−": "-",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


def format_duration(minutes: int) -> str:
    hours = minutes // 60
    mins = minutes % 60
    if not hours:
        return f"{mins:02d} Min"
    if not mins:
        return f"{hours:02d} Hour"
    return f"{hours:02d} Hour {mins:02d} Min"


def pick_questions_for_section(
    bank: list[dict[str, Any]],
    used_keys: set[str],
    section: dict[str, Any],
    rng: random.Random,
) -> list[dict[str, Any]]:
    count = max(1, int(section.get("questionCount") or 1))
    marks = max(1, int(section.get("marksPerQuestion") or 1))
    requested_type = section.get("questionType") or "short_answer"
    source_types = set(section.get("sourceTypes") or ["exercise"])

    candidates = [
        question
        for question in bank
        if question["sourceType"] in source_types and question["sourceKey"] not in used_keys
    ]
    typed = [question for question in candidates if question["questionType"] == requested_type]
    pool = typed or candidates or [question for question in bank if question["sourceKey"] not in used_keys] or bank
    rng.shuffle(pool)

    selected = []
    for question in pool:
        if len(selected) >= count:
            break
        if question["sourceKey"] in used_keys:
            continue
        used_keys.add(question["sourceKey"])
        selected.append(
            {
                **question,
                "id": str(uuid4()),
                "marks": marks,
                "editableText": question["questionText"],
            }
        )
    return selected


def renumber_sections(sections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    question_number = 1
    for section in sections:
        for question in section["questions"]:
            question["paperQuestionNumber"] = question_number
            question_number += 1
    return sections


def load_question_bank() -> list[dict[str, Any]]:
    exercises = read_json(CHAPTER_DIR / "exercises.json", [])
    examples = read_json(CHAPTER_DIR / "examples.json", [])
    questions: list[dict[str, Any]] = []

    for exercise in exercises:
        for question in exercise.get("questions", []):
            text = clean_question_text(question.get("questionText", ""))
            if not text:
                continue
            questions.append(
                {
                    "id": stable_id(question["key"]),
                    "sourceKey": question["key"],
                    "sourceType": "exercise",
                    "title": question.get("title") or f"Exercise {exercise.get('exerciseNumber')} Question",
                    "chapterId": "relations-and-functions",
                    "chapterTitle": "Relations and Functions",
                    "exerciseNumber": exercise.get("exerciseNumber"),
                    "questionNumber": question.get("questionNumber"),
                    "questionType": infer_question_type(text),
                    "difficulty": infer_difficulty(text),
                    "defaultMarks": infer_default_marks(text),
                    "questionText": text,
                    "answerText": clean_text(question.get("answerText") or ""),
                    "pageStart": question.get("pageStart"),
                    "pageEnd": question.get("pageEnd"),
                    "tags": infer_tags(text),
                    "editable": True,
                }
            )

    for item in examples:
        text = clean_example_question(item.get("bodyText", ""))
        if not text:
            continue
        questions.append(
            {
                "id": stable_id(item["key"]),
                "sourceKey": item["key"],
                "sourceType": "example",
                "title": item.get("title") or "Example",
                "chapterId": "relations-and-functions",
                "chapterTitle": "Relations and Functions",
                "exerciseNumber": None,
                "questionNumber": item.get("exampleNumber"),
                "questionType": "solved_example",
                "difficulty": infer_difficulty(text),
                "defaultMarks": 3,
                "questionText": text,
                "answerText": clean_text(extract_solution(item.get("bodyText", ""))),
                "pageStart": item.get("pageStart"),
                "pageEnd": item.get("pageEnd"),
                "tags": infer_tags(text),
                "editable": True,
            }
        )

    return questions


def infer_question_type(text: str) -> str:
    lowered = text.lower()
    if "determine whether" in lowered or "check whether" in lowered:
        return "short_answer"
    if "show that" in lowered or "prove" in lowered:
        return "proof"
    if "find" in lowered or "number of" in lowered:
        return "application"
    return "short_answer"


def infer_difficulty(text: str) -> str:
    lowered = text.lower()
    if len(text) > 700 or "prove" in lowered or "show that" in lowered:
        return "hard"
    if len(text) > 320 or "check whether" in lowered:
        return "medium"
    return "easy"


def infer_default_marks(text: str) -> int:
    difficulty = infer_difficulty(text)
    if difficulty == "hard":
        return 4
    if difficulty == "medium":
        return 3
    return 2


def infer_tags(text: str) -> list[str]:
    lowered = text.lower()
    tags = []
    for label, markers in {
        "relations": ["relation", " r "],
        "equivalence": ["equivalence", "reflexive", "symmetric", "transitive"],
        "functions": ["function", "one-one", "onto", "bijective"],
        "composition": ["composition", "fog", "gof"],
        "inverse": ["inverse", "invertible"],
    }.items():
        if any(marker in lowered for marker in markers):
            tags.append(label)
    return tags or ["chapter-practice"]


def quality_summary(sections: list[dict[str, Any]], payload: dict[str, Any]) -> dict[str, Any]:
    questions = [question for section in sections for question in section["questions"]]
    answer_keys = sum(1 for question in questions if question.get("answerText"))
    requested_marks = int(payload.get("totalMarks") or 0)
    actual_marks = sum(int(question["marks"]) for question in questions)
    return {
        "questionCount": len(questions),
        "answerKeyCoverage": round(answer_keys / len(questions), 2) if questions else 0,
        "marksMatched": requested_marks == actual_marks if requested_marks else True,
        "duplicateCount": len(questions) - len({question["sourceKey"] for question in questions}),
        "notes": [
            "Generated from structured Chapter 1 exercise/example objects.",
            "Teacher can edit question text and marks before export.",
        ],
    }


def default_paper_instructions() -> str:
    return "All questions are compulsory unless internal choice is mentioned. Write steps clearly for full marks."


def default_section_instruction(section: dict[str, Any]) -> str:
    marks = int(section.get("marksPerQuestion") or 1)
    return f"Each question carries {marks} mark{'s' if marks != 1 else ''}."


def clean_example_question(text: str) -> str:
    text = clean_text(text)
    if "Solution" in text:
        return text.split("Solution", 1)[0].strip()
    return text.strip()


def extract_solution(text: str) -> str:
    text = clean_text(text)
    if "Solution" in text:
        return text.split("Solution", 1)[1].strip()
    return ""


def clean_question_text(text: str) -> str:
    return clean_text(text).strip()


def clean_text(text: str) -> str:
    text = str(text or "")
    replacements = {
        "\u00a0": " ",
        "Reprint 2026-27": "",
        "MATHEMA TICS": "MATHEMATICS",
        "phi": "phi",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return "\n".join(line.rstrip() for line in text.splitlines()).strip()


def stable_id(value: str) -> str:
    return hashlib.sha1(value.encode("utf-8")).hexdigest()[:16]


def read_json(path: Path, fallback: Any) -> Any:
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))
