"""create curriculum core

Revision ID: 0003_curriculum_core
Revises: 0002_orgs_classes
Create Date: 2026-04-22
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003_curriculum_core"
down_revision = "0002_orgs_classes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "boards",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_boards_code", "boards", ["code"], unique=True)

    op.create_table(
        "subjects",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("board_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("boards.id"), nullable=False),
        sa.Column("class_level", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_subjects_slug", "subjects", ["slug"], unique=True)

    op.create_table(
        "units",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("subject_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("subjects.id"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("sequence_index", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "chapters",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("subject_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("subjects.id"), nullable=False),
        sa.Column("unit_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("units.id"), nullable=True),
        sa.Column("chapter_number", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=True),
        sa.Column("sequence_index", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("active_session", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_chapters_slug", "chapters", ["slug"], unique=True)

    op.create_table(
        "subtopics",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("chapter_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("chapters.id"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("sequence_index", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_subtopics_slug", "subtopics", ["slug"], unique=True)

    op.create_table(
        "concepts",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("chapter_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("chapters.id"), nullable=False),
        sa.Column("subtopic_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("subtopics.id"), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("concept_type", sa.String(length=50), nullable=True),
        sa.Column("description", sa.String(length=1000), nullable=True),
        sa.Column("difficulty_base", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_concepts_slug", "concepts", ["slug"], unique=True)

    op.create_table(
        "syllabus_mappings",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("board_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("boards.id"), nullable=False),
        sa.Column("subject_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("subjects.id"), nullable=False),
        sa.Column("chapter_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("chapters.id"), nullable=True),
        sa.Column("concept_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("concepts.id"), nullable=True),
        sa.Column("scope_tag", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("syllabus_mappings")
    op.drop_index("ix_concepts_slug", table_name="concepts")
    op.drop_table("concepts")
    op.drop_index("ix_subtopics_slug", table_name="subtopics")
    op.drop_table("subtopics")
    op.drop_index("ix_chapters_slug", table_name="chapters")
    op.drop_table("chapters")
    op.drop_table("units")
    op.drop_index("ix_subjects_slug", table_name="subjects")
    op.drop_table("subjects")
    op.drop_index("ix_boards_code", table_name="boards")
    op.drop_table("boards")
