"""create student learning core

Revision ID: 0007_student_learning
Revises: 0006_question_system
Create Date: 2026-04-27
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0007_student_learning"
down_revision = "0006_question_system"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "quizzes",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("quiz_mode", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("subject_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("subjects.id"), nullable=False),
        sa.Column("chapter_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("chapters.id"), nullable=True),
        sa.Column("config_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("total_questions", sa.Integer(), nullable=False),
        sa.Column("total_marks", sa.Integer(), nullable=True),
        sa.Column("time_limit_sec", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_quizzes_user_status", "quizzes", ["user_id", "status"], unique=False)

    op.create_table(
        "quiz_questions",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("quiz_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("quizzes.id"), nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("questions.id"), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("marks", sa.Integer(), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
    )
    op.create_index("ix_quiz_questions_quiz_order", "quiz_questions", ["quiz_id", "order_index"], unique=True)

    op.create_table(
        "quiz_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("quiz_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("quizzes.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("max_score", sa.Float(), nullable=True),
        sa.Column("accuracy", sa.Float(), nullable=True),
        sa.Column("time_spent_sec", sa.Integer(), nullable=True),
        sa.Column("analysis_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_quiz_attempts_quiz_user", "quiz_attempts", ["quiz_id", "user_id"], unique=False)

    op.create_table(
        "quiz_attempt_answers",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("attempt_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("quiz_attempts.id"), nullable=False),
        sa.Column("quiz_question_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("quiz_questions.id"), nullable=False),
        sa.Column("user_answer_text", sa.Text(), nullable=True),
        sa.Column("user_answer_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("is_correct", sa.Boolean(), nullable=True),
        sa.Column("awarded_marks", sa.Float(), nullable=True),
        sa.Column("mistake_type", sa.String(length=100), nullable=True),
        sa.Column("feedback_text", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_quiz_attempt_answers_attempt", "quiz_attempt_answers", ["attempt_id"], unique=False)

    op.create_table(
        "saved_notes",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("subject_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("subjects.id"), nullable=True),
        sa.Column("chapter_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("chapters.id"), nullable=True),
        sa.Column("source_type", sa.String(length=50), nullable=False),
        sa.Column("source_id", sa.String(length=255), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_saved_notes_user", "saved_notes", ["user_id"], unique=False)

    op.create_table(
        "mistake_log",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("source_type", sa.String(length=50), nullable=False),
        sa.Column("source_id", sa.String(length=255), nullable=False),
        sa.Column("subject_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("subjects.id"), nullable=False),
        sa.Column("chapter_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("chapters.id"), nullable=True),
        sa.Column("concept_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("concepts.id"), nullable=True),
        sa.Column("mistake_type", sa.String(length=100), nullable=False),
        sa.Column("severity", sa.String(length=50), nullable=True),
        sa.Column("evidence_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_mistake_log_user_subject", "mistake_log", ["user_id", "subject_id"], unique=False)

    op.create_table(
        "mastery_scores",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("subject_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("subjects.id"), nullable=False),
        sa.Column("chapter_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("chapters.id"), nullable=True),
        sa.Column("concept_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("concepts.id"), nullable=True),
        sa.Column("mastery_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("last_evaluated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("signals_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(
        "ix_mastery_scores_user_scope",
        "mastery_scores",
        ["user_id", "subject_id", "chapter_id", "concept_id"],
        unique=False,
    )

    op.create_table(
        "study_plans",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="draft"),
        sa.Column("plan_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("starts_on", sa.Date(), nullable=True),
        sa.Column("ends_on", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_study_plans_user_status", "study_plans", ["user_id", "status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_study_plans_user_status", table_name="study_plans")
    op.drop_table("study_plans")
    op.drop_index("ix_mastery_scores_user_scope", table_name="mastery_scores")
    op.drop_table("mastery_scores")
    op.drop_index("ix_mistake_log_user_subject", table_name="mistake_log")
    op.drop_table("mistake_log")
    op.drop_index("ix_saved_notes_user", table_name="saved_notes")
    op.drop_table("saved_notes")
    op.drop_index("ix_quiz_attempt_answers_attempt", table_name="quiz_attempt_answers")
    op.drop_table("quiz_attempt_answers")
    op.drop_index("ix_quiz_attempts_quiz_user", table_name="quiz_attempts")
    op.drop_table("quiz_attempts")
    op.drop_index("ix_quiz_questions_quiz_order", table_name="quiz_questions")
    op.drop_table("quiz_questions")
    op.drop_index("ix_quizzes_user_status", table_name="quizzes")
    op.drop_table("quizzes")
