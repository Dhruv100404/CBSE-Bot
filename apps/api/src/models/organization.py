from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Organization(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="school")
    plan_tier: Mapped[str] = mapped_column(String(50), default="free")


class OrganizationMembership(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "organization_memberships"

    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    role: Mapped[str] = mapped_column(String(50), default="teacher")
    status: Mapped[str] = mapped_column(String(50), default="active")


class Class(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "classes"

    organization_id: Mapped[str | None] = mapped_column(ForeignKey("organizations.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    grade_level: Mapped[str] = mapped_column(String(20), nullable=False)
    section: Mapped[str | None] = mapped_column(String(20), nullable=True)


class ClassMembership(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "class_memberships"

    class_id: Mapped[str] = mapped_column(ForeignKey("classes.id"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    role: Mapped[str] = mapped_column(String(50), default="student")
    status: Mapped[str] = mapped_column(String(50), default="active")
