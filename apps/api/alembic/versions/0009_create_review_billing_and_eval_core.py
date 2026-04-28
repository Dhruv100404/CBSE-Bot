"""create review billing and eval core

Revision ID: 0009_review_billing_eval
Revises: 0008_paper_teacher
Create Date: 2026-04-27
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0009_review_billing_eval"
down_revision = "0008_paper_teacher"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ai_feedback",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("ai_run_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("ai_runs.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("feedback_type", sa.String(length=50), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ai_feedback_run", "ai_feedback", ["ai_run_id"], unique=False)

    op.create_table(
        "eval_datasets",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("task_type", sa.String(length=100), nullable=False),
        sa.Column("version", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("dataset_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_eval_datasets_name_version", "eval_datasets", ["name", "version"], unique=True)

    op.create_table(
        "eval_runs",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("dataset_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("eval_datasets.id"), nullable=False),
        sa.Column("model_name", sa.String(length=100), nullable=False),
        sa.Column("metrics_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("report_url", sa.String(length=1000), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="queued"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_eval_runs_dataset", "eval_runs", ["dataset_id"], unique=False)

    op.create_table(
        "moderation_events",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("actor_user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("target_type", sa.String(length=50), nullable=False),
        sa.Column("target_id", sa.String(length=255), nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_moderation_events_target", "moderation_events", ["target_type", "target_id"], unique=False)

    op.create_table(
        "plans",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("code", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("audience", sa.String(length=50), nullable=False),
        sa.Column("billing_period", sa.String(length=50), nullable=True),
        sa.Column("price_minor", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default="INR"),
        sa.Column("usage_caps_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("features_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_plans_code", "plans", ["code"], unique=True)

    op.create_table(
        "subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("organizations.id"), nullable=True),
        sa.Column("plan_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("plans.id"), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("billing_period", sa.String(length=50), nullable=True),
        sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("usage_caps_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("provider_subscription_id", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_subscriptions_user", "subscriptions", ["user_id"], unique=False)
    op.create_index("ix_subscriptions_organization", "subscriptions", ["organization_id"], unique=False)

    op.create_table(
        "payments",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("subscription_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("subscriptions.id"), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("organizations.id"), nullable=True),
        sa.Column("provider_payment_id", sa.String(length=255), nullable=True),
        sa.Column("amount_minor", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default="INR"),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_payments_subscription", "payments", ["subscription_id"], unique=False)

    op.create_table(
        "coupons",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("code", sa.String(length=100), nullable=False),
        sa.Column("discount_type", sa.String(length=50), nullable=False),
        sa.Column("discount_value", sa.Float(), nullable=False),
        sa.Column("max_redemptions", sa.Integer(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_coupons_code", "coupons", ["code"], unique=True)

    op.create_table(
        "usage_ledgers",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("organizations.id"), nullable=True),
        sa.Column("subscription_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("subscriptions.id"), nullable=True),
        sa.Column("metric_key", sa.String(length=100), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("source_type", sa.String(length=50), nullable=True),
        sa.Column("source_id", sa.String(length=255), nullable=True),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_usage_ledgers_subscription_metric", "usage_ledgers", ["subscription_id", "metric_key"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_usage_ledgers_subscription_metric", table_name="usage_ledgers")
    op.drop_table("usage_ledgers")
    op.drop_index("ix_coupons_code", table_name="coupons")
    op.drop_table("coupons")
    op.drop_index("ix_payments_subscription", table_name="payments")
    op.drop_table("payments")
    op.drop_index("ix_subscriptions_organization", table_name="subscriptions")
    op.drop_index("ix_subscriptions_user", table_name="subscriptions")
    op.drop_table("subscriptions")
    op.drop_index("ix_plans_code", table_name="plans")
    op.drop_table("plans")
    op.drop_index("ix_moderation_events_target", table_name="moderation_events")
    op.drop_table("moderation_events")
    op.drop_index("ix_eval_runs_dataset", table_name="eval_runs")
    op.drop_table("eval_runs")
    op.drop_index("ix_eval_datasets_name_version", table_name="eval_datasets")
    op.drop_table("eval_datasets")
    op.drop_index("ix_ai_feedback_run", table_name="ai_feedback")
    op.drop_table("ai_feedback")
