"""create content ingest core

Revision ID: 0005_content_ingest
Revises: 0004_prompt_ai_runs
Create Date: 2026-04-27
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0005_content_ingest"
down_revision = "0004_prompt_ai_runs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "academic_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("board_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("boards.id"), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("starts_on", sa.Date(), nullable=True),
        sa.Column("ends_on", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_academic_sessions_board_name", "academic_sessions", ["board_id", "name"], unique=True)

    op.create_table(
        "formulas",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("concept_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("concepts.id"), nullable=False),
        sa.Column("latex", sa.Text(), nullable=False),
        sa.Column("verbal_form", sa.String(length=500), nullable=True),
        sa.Column("symbol_map_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "experiments",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("subject_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("subjects.id"), nullable=False),
        sa.Column("chapter_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("chapters.id"), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_experiments_slug", "experiments", ["slug"], unique=True)

    op.create_table(
        "documents",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("organizations.id"), nullable=True),
        sa.Column("uploaded_by_user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("board_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("boards.id"), nullable=True),
        sa.Column("academic_session_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("academic_sessions.id"), nullable=True),
        sa.Column("subject_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("subjects.id"), nullable=True),
        sa.Column("source_type", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("class_level", sa.Integer(), nullable=True),
        sa.Column("language", sa.String(length=50), nullable=False, server_default="english"),
        sa.Column("file_url", sa.String(length=1000), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("page_count", sa.Integer(), nullable=True),
        sa.Column("ingest_status", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("visibility", sa.String(length=50), nullable=False, server_default="private"),
        sa.Column("checksum", sa.String(length=128), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_documents_subject_status", "documents", ["subject_id", "ingest_status"], unique=False)
    op.create_index("ix_documents_checksum", "documents", ["checksum"], unique=False)

    op.create_table(
        "document_versions",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("documents.id"), nullable=False),
        sa.Column("version_label", sa.String(length=100), nullable=False),
        sa.Column("file_url", sa.String(length=1000), nullable=False),
        sa.Column("checksum", sa.String(length=128), nullable=True),
        sa.Column("change_summary", sa.String(length=1000), nullable=True),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_document_versions_document", "document_versions", ["document_id"], unique=False)

    op.create_table(
        "document_pages",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("documents.id"), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=False),
        sa.Column("raw_text", sa.Text(), nullable=True),
        sa.Column("extracted_text", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(length=1000), nullable=True),
        sa.Column("ocr_confidence", sa.Float(), nullable=True),
        sa.Column("layout_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("chapter_guess_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("chapters.id"), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_document_pages_document_page", "document_pages", ["document_id", "page_number"], unique=True)

    op.create_table(
        "page_assets",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("page_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("document_pages.id"), nullable=False),
        sa.Column("asset_type", sa.String(length=50), nullable=False),
        sa.Column("file_url", sa.String(length=1000), nullable=False),
        sa.Column("bbox_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_page_assets_page", "page_assets", ["page_id"], unique=False)

    op.create_table(
        "chunks",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("documents.id"), nullable=False),
        sa.Column("page_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("document_pages.id"), nullable=True),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("chunk_text", sa.Text(), nullable=False),
        sa.Column("chunk_type", sa.String(length=50), nullable=False, server_default="paragraph"),
        sa.Column("token_count", sa.Integer(), nullable=True),
        sa.Column("lexical_tsv", sa.Text(), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_chunks_document_index", "chunks", ["document_id", "chunk_index"], unique=True)
    op.create_index("ix_chunks_page", "chunks", ["page_id"], unique=False)

    op.create_table(
        "chunk_embeddings",
        sa.Column("chunk_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("chunks.id"), primary_key=True, nullable=False),
        sa.Column("embedding", postgresql.ARRAY(sa.Float()), nullable=False),
        sa.Column("embedding_model", sa.String(length=100), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "document_tags",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("documents.id"), nullable=False),
        sa.Column("page_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("document_pages.id"), nullable=True),
        sa.Column("chunk_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("chunks.id"), nullable=True),
        sa.Column("tag_type", sa.String(length=100), nullable=False),
        sa.Column("tag_value", sa.String(length=255), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("created_by_type", sa.String(length=50), nullable=False, server_default="ai"),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_document_tags_document_type", "document_tags", ["document_id", "tag_type"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_document_tags_document_type", table_name="document_tags")
    op.drop_table("document_tags")
    op.drop_table("chunk_embeddings")
    op.drop_index("ix_chunks_page", table_name="chunks")
    op.drop_index("ix_chunks_document_index", table_name="chunks")
    op.drop_table("chunks")
    op.drop_index("ix_page_assets_page", table_name="page_assets")
    op.drop_table("page_assets")
    op.drop_index("ix_document_pages_document_page", table_name="document_pages")
    op.drop_table("document_pages")
    op.drop_index("ix_document_versions_document", table_name="document_versions")
    op.drop_table("document_versions")
    op.drop_index("ix_documents_checksum", table_name="documents")
    op.drop_index("ix_documents_subject_status", table_name="documents")
    op.drop_table("documents")
    op.drop_index("ix_experiments_slug", table_name="experiments")
    op.drop_table("experiments")
    op.drop_table("formulas")
    op.drop_index("ix_academic_sessions_board_name", table_name="academic_sessions")
    op.drop_table("academic_sessions")
