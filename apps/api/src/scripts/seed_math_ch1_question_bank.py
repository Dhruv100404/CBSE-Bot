from __future__ import annotations

from uuid import uuid4

from sqlalchemy import text

from src.core.db import SessionLocal
from src.services.paper_studio_service import load_question_bank


def main() -> None:
    questions = load_question_bank()
    with SessionLocal() as db:
        board_id = upsert_board(db)
        subject_id = upsert_subject(db, board_id)
        chapter_id = upsert_chapter(db, subject_id)

        inserted = 0
        answer_keys = 0
        for question in questions:
            question_id = str(uuid4())
            result = db.execute(
                text(
                    """
                    INSERT INTO questions (
                        id,
                        canonical_hash,
                        class_level,
                        subject_id,
                        chapter_id,
                        question_type,
                        difficulty,
                        marks,
                        estimated_time_sec,
                        text,
                        answer_style,
                        board_relevance_score,
                        source_quality_score,
                        created_by_type,
                        status,
                        metadata_json
                    )
                    VALUES (
                        :id,
                        :canonical_hash,
                        12,
                        :subject_id,
                        :chapter_id,
                        :question_type,
                        :difficulty,
                        :marks,
                        :estimated_time_sec,
                        :text,
                        :answer_style,
                        :board_relevance_score,
                        :source_quality_score,
                        'extracted',
                        'active',
                        CAST(:metadata_json AS jsonb)
                    )
                    ON CONFLICT (canonical_hash) DO UPDATE SET
                        question_type = EXCLUDED.question_type,
                        difficulty = EXCLUDED.difficulty,
                        marks = EXCLUDED.marks,
                        text = EXCLUDED.text,
                        metadata_json = EXCLUDED.metadata_json
                    RETURNING id
                    """
                ),
                {
                    "id": question_id,
                    "canonical_hash": question["sourceKey"],
                    "subject_id": subject_id,
                    "chapter_id": chapter_id,
                    "question_type": question["questionType"],
                    "difficulty": question["difficulty"],
                    "marks": question["defaultMarks"],
                    "estimated_time_sec": int(question["defaultMarks"]) * 90,
                    "text": question["questionText"],
                    "answer_style": "solved" if question["sourceType"] == "example" else "descriptive",
                    "board_relevance_score": 0.92,
                    "source_quality_score": 0.86,
                    "metadata_json": json_payload(
                        {
                            "sourceKey": question["sourceKey"],
                            "sourceType": question["sourceType"],
                            "chapterSlug": "relations-and-functions",
                            "exerciseNumber": question.get("exerciseNumber"),
                            "questionNumber": question.get("questionNumber"),
                            "pageStart": question.get("pageStart"),
                            "tags": question.get("tags", []),
                        }
                    ),
                },
            )
            persisted_question_id = result.scalar_one()
            inserted += 1

            db.execute(text("DELETE FROM question_tags WHERE question_id = :question_id"), {"question_id": persisted_question_id})
            db.execute(text("DELETE FROM answer_keys WHERE question_id = :question_id"), {"question_id": persisted_question_id})

            for tag in question.get("tags", []):
                db.execute(
                    text(
                        """
                        INSERT INTO question_tags (
                            id, question_id, tag_type, tag_value, confidence, created_by_type
                        )
                        VALUES (:id, :question_id, 'concept', :tag_value, 0.76, 'extracted')
                        """
                    ),
                    {"id": str(uuid4()), "question_id": persisted_question_id, "tag_value": tag},
                )

            if question.get("answerText"):
                db.execute(
                    text(
                        """
                        INSERT INTO answer_keys (
                            id,
                            question_id,
                            answer_format,
                            answer_text,
                            final_answer_json,
                            citation_json,
                            confidence_score,
                            version
                        )
                        VALUES (
                            :id,
                            :question_id,
                            'text',
                            :answer_text,
                            '{}'::jsonb,
                            CAST(:citation_json AS jsonb),
                            0.82,
                            1
                        )
                        """
                    ),
                    {
                        "id": str(uuid4()),
                        "question_id": persisted_question_id,
                        "answer_text": question["answerText"],
                        "citation_json": json_payload(
                            {
                                "sourceKey": question["sourceKey"],
                                "pageStart": question.get("pageStart"),
                                "sourceType": question["sourceType"],
                            }
                        ),
                    },
                )
                answer_keys += 1

        db.commit()
        print({"questions": inserted, "answerKeys": answer_keys, "subjectId": subject_id, "chapterId": chapter_id})


def upsert_board(db) -> str:
    board_id = db.execute(text("SELECT id FROM boards WHERE code = 'CBSE'")).scalar_one_or_none()
    if board_id:
        return str(board_id)
    board_id = str(uuid4())
    db.execute(
        text("INSERT INTO boards (id, code, name) VALUES (:id, 'CBSE', 'Central Board of Secondary Education')"),
        {"id": board_id},
    )
    return board_id


def upsert_subject(db, board_id: str) -> str:
    subject_id = db.execute(text("SELECT id FROM subjects WHERE slug = 'mathematics-12'")).scalar_one_or_none()
    if subject_id:
        return str(subject_id)
    subject_id = str(uuid4())
    db.execute(
        text(
            """
            INSERT INTO subjects (id, board_id, class_level, code, name, slug)
            VALUES (:id, :board_id, 12, 'mathematics', 'Mathematics', 'mathematics-12')
            """
        ),
        {"id": subject_id, "board_id": board_id},
    )
    return subject_id


def upsert_chapter(db, subject_id: str) -> str:
    chapter_id = db.execute(text("SELECT id FROM chapters WHERE slug = 'relations-and-functions'")).scalar_one_or_none()
    if chapter_id:
        return str(chapter_id)
    chapter_id = str(uuid4())
    db.execute(
        text(
            """
            INSERT INTO chapters (
                id, subject_id, chapter_number, name, slug, description, sequence_index, active_session
            )
            VALUES (
                :id,
                :subject_id,
                1,
                'Relations and Functions',
                'relations-and-functions',
                'NCERT Class 12 Mathematics Chapter 1',
                1,
                '2026-27'
            )
            """
        ),
        {"id": chapter_id, "subject_id": subject_id},
    )
    return chapter_id


def json_payload(value: dict) -> str:
    import json

    return json.dumps(value)


if __name__ == "__main__":
    main()
