"""create question system core

Revision ID: 0006_question_system
Revises: 0005_content_ingest
Create Date: 2026-04-27
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0006_question_system"
down_revision = "0005_content_ingest"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "questions",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("canonical_hash", sa.String(length=128), nullable=True),
        sa.Column("class_level", sa.Integer(), nullable=True),
        sa.Column("subject_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("subjects.id"), nullable=False),
        sa.Column("chapter_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("chapters.id"), nullable=True),
        sa.Column("subtopic_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("subtopics.id"), nullable=True),
        sa.Column("concept_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("concepts.id"), nullable=True),
        sa.Column("question_type", sa.String(length=50), nullable=False),
        sa.Column("difficulty", sa.String(length=50), nullable=False, server_default="medium"),
        sa.Column("marks", sa.Integer(), nullable=True),
        sa.Column("estimated_time_sec", sa.Integer(), nullable=True),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("diagram_asset_url", sa.String(length=1000), nullable=True),
        sa.Column("answer_style", sa.String(length=50), nullable=False, server_default="short"),
        sa.Column("bloom_level", sa.String(length=50), nullable=True),
        sa.Column("board_relevance_score", sa.Float(), nullable=True),
        sa.Column("source_quality_score", sa.Float(), nullable=True),
        sa.Column("created_by_type", sa.String(length=50), nullable=False, server_default="extracted"),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="draft"),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_questions_canonical_hash", "questions", ["canonical_hash"], unique=True)
    op.create_index(
        "ix_questions_subject_chapter_type",
        "questions",
        ["subject_id", "chapter_id", "question_type"],
        unique=False,
    )

    op.create_table(
        "question_variants",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("questions.id"), nullable=False),
        sa.Column("variant_label", sa.String(length=100), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("is_generated", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("generation_method", sa.String(length=100), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_question_variants_question", "question_variants", ["question_id"], unique=False)

    op.create_table(
        "question_sources",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("questions.id"), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("documents.id"), nullable=True),
        sa.Column("page_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("document_pages.id"), nullable=True),
        sa.Column("chunk_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("chunks.id"), nullable=True),
        sa.Column("source_span_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("attribution_confidence", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_question_sources_question", "question_sources", ["question_id"], unique=False)

    op.create_table(
        "question_tags",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("questions.id"), nullable=False),
        sa.Column("tag_type", sa.String(length=100), nullable=False),
        sa.Column("tag_value", sa.String(length=255), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("created_by_type", sa.String(length=50), nullable=False, server_default="ai"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_question_tags_question_type", "question_tags", ["question_id", "tag_type"], unique=False)

    op.create_table(
        "answer_keys",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("questions.id"), nullable=False),
        sa.Column("answer_format", sa.String(length=50), nullable=False),
        sa.Column("answer_text", sa.Text(), nullable=False),
        sa.Column("final_answer_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("citation_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_answer_keys_question", "answer_keys", ["question_id"], unique=False)

    op.create_table(
        "marking_schemes",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("questions.id"), nullable=False),
        sa.Column("scheme_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("rubric_text", sa.Text(), nullable=True),
        sa.Column("marks_breakdown_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_marking_schemes_question", "marking_schemes", ["question_id"], unique=False)

    op.create_table(
        "question_reviews",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("questions.id"), nullable=False),
        sa.Column("reviewed_by_user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("changes_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_question_reviews_question", "question_reviews", ["question_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_question_reviews_question", table_name="question_reviews")
    op.drop_table("question_reviews")
    op.drop_index("ix_marking_schemes_question", table_name="marking_schemes")
    op.drop_table("marking_schemes")
    op.drop_index("ix_answer_keys_question", table_name="answer_keys")
    op.drop_table("answer_keys")
    op.drop_index("ix_question_tags_question_type", table_name="question_tags")
    op.drop_table("question_tags")
    op.drop_index("ix_question_sources_question", table_name="question_sources")
    op.drop_table("question_sources")
    op.drop_index("ix_question_variants_question", table_name="question_variants")
    op.drop_table("question_variants")
    op.drop_index("ix_questions_subject_chapter_type", table_name="questions")
    op.drop_index("ix_questions_canonical_hash", table_name="questions")
    op.drop_table("questions")
