"""create paper and teacher workflows

Revision ID: 0008_paper_teacher
Revises: 0007_student_learning
Create Date: 2026-04-27
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0008_paper_teacher"
down_revision = "0007_student_learning"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "paper_uploads",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("documents.id"), nullable=False),
        sa.Column("detected_subject_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("subjects.id"), nullable=True),
        sa.Column("class_level_guess", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="uploaded"),
        sa.Column("extraction_quality_score", sa.Float(), nullable=True),
        sa.Column("total_questions_detected", sa.Integer(), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_paper_uploads_user_status", "paper_uploads", ["user_id", "status"], unique=False)

    op.create_table(
        "paper_upload_questions",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("paper_upload_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("paper_uploads.id"), nullable=False),
        sa.Column("question_number", sa.String(length=50), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=True),
        sa.Column("bbox_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("extracted_text", sa.Text(), nullable=False),
        sa.Column("detected_question_type", sa.String(length=50), nullable=True),
        sa.Column("detected_marks", sa.Integer(), nullable=True),
        sa.Column("chapter_guess_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("chapters.id"), nullable=True),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(
        "ix_paper_upload_questions_upload_number",
        "paper_upload_questions",
        ["paper_upload_id", "question_number"],
        unique=False,
    )

    op.create_table(
        "generated_solutions",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column(
            "paper_upload_question_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("paper_upload_questions.id"),
            nullable=False,
        ),
        sa.Column("solution_mode", sa.String(length=50), nullable=False),
        sa.Column("solution_text", sa.Text(), nullable=False),
        sa.Column("final_answer_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("citations_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("validation_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_generated_solutions_question", "generated_solutions", ["paper_upload_question_id"], unique=False)

    op.create_table(
        "paper_blueprints",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("organizations.id"), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("class_level", sa.Integer(), nullable=False),
        sa.Column("subject_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("subjects.id"), nullable=False),
        sa.Column("total_marks", sa.Integer(), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("config_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("blueprint_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_paper_blueprints_owner", "paper_blueprints", ["owner_user_id"], unique=False)

    op.create_table(
        "paper_drafts",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("blueprint_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("paper_blueprints.id"), nullable=False),
        sa.Column("generated_by_run_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("ai_runs.id"), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("instructions_text", sa.Text(), nullable=True),
        sa.Column("paper_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("answer_key_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("marking_scheme_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_paper_drafts_blueprint_status", "paper_drafts", ["blueprint_id", "status"], unique=False)

    op.create_table(
        "paper_sections",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("paper_draft_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("paper_drafts.id"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("instructions_text", sa.Text(), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("marks", sa.Integer(), nullable=True),
        sa.Column("section_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_paper_sections_draft_order", "paper_sections", ["paper_draft_id", "order_index"], unique=True)

    op.create_table(
        "teacher_templates",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("organizations.id"), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("template_type", sa.String(length=50), nullable=False),
        sa.Column("config_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_teacher_templates_owner", "teacher_templates", ["owner_user_id"], unique=False)

    op.create_table(
        "remediation_sets",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("class_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("classes.id"), nullable=True),
        sa.Column("subject_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("subjects.id"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("criteria_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("content_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_remediation_sets_owner", "remediation_sets", ["owner_user_id"], unique=False)

    op.create_table(
        "exported_assets",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("asset_type", sa.String(length=50), nullable=False),
        sa.Column("owner_type", sa.String(length=50), nullable=False),
        sa.Column("owner_id", sa.String(length=255), nullable=False),
        sa.Column("file_url", sa.String(length=1000), nullable=False),
        sa.Column("render_status", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_exported_assets_owner", "exported_assets", ["owner_type", "owner_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_exported_assets_owner", table_name="exported_assets")
    op.drop_table("exported_assets")
    op.drop_index("ix_remediation_sets_owner", table_name="remediation_sets")
    op.drop_table("remediation_sets")
    op.drop_index("ix_teacher_templates_owner", table_name="teacher_templates")
    op.drop_table("teacher_templates")
    op.drop_index("ix_paper_sections_draft_order", table_name="paper_sections")
    op.drop_table("paper_sections")
    op.drop_index("ix_paper_drafts_blueprint_status", table_name="paper_drafts")
    op.drop_table("paper_drafts")
    op.drop_index("ix_paper_blueprints_owner", table_name="paper_blueprints")
    op.drop_table("paper_blueprints")
    op.drop_index("ix_generated_solutions_question", table_name="generated_solutions")
    op.drop_table("generated_solutions")
    op.drop_index("ix_paper_upload_questions_upload_number", table_name="paper_upload_questions")
    op.drop_table("paper_upload_questions")
    op.drop_index("ix_paper_uploads_user_status", table_name="paper_uploads")
    op.drop_table("paper_uploads")
