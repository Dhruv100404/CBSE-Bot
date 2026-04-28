from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Board(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "boards"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)


class Subject(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "subjects"

    board_id: Mapped[str] = mapped_column(ForeignKey("boards.id"))
    class_level: Mapped[int] = mapped_column(Integer, nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)


class Unit(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "units"

    subject_id: Mapped[str] = mapped_column(ForeignKey("subjects.id"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sequence_index: Mapped[int] = mapped_column(Integer, nullable=False, default=1)


class Chapter(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "chapters"

    subject_id: Mapped[str] = mapped_column(ForeignKey("subjects.id"))
    unit_id: Mapped[str | None] = mapped_column(ForeignKey("units.id"), nullable=True)
    chapter_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    sequence_index: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    active_session: Mapped[str | None] = mapped_column(String(50), nullable=True)


class Subtopic(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "subtopics"

    chapter_id: Mapped[str] = mapped_column(ForeignKey("chapters.id"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    sequence_index: Mapped[int] = mapped_column(Integer, nullable=False, default=1)


class Concept(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "concepts"

    chapter_id: Mapped[str] = mapped_column(ForeignKey("chapters.id"))
    subtopic_id: Mapped[str | None] = mapped_column(ForeignKey("subtopics.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    concept_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    difficulty_base: Mapped[str | None] = mapped_column(String(50), nullable=True)


class SyllabusMapping(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "syllabus_mappings"

    board_id: Mapped[str] = mapped_column(ForeignKey("boards.id"))
    subject_id: Mapped[str] = mapped_column(ForeignKey("subjects.id"))
    chapter_id: Mapped[str | None] = mapped_column(ForeignKey("chapters.id"), nullable=True)
    concept_id: Mapped[str | None] = mapped_column(ForeignKey("concepts.id"), nullable=True)
    scope_tag: Mapped[str | None] = mapped_column(String(100), nullable=True)
