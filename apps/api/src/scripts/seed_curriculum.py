from sqlalchemy import select

from src.core.db import SessionLocal
from src.models.curriculum import Board, Chapter, Subject

STARTER_DATA = {
    "physics-11": [
        "Physical World",
        "Units and Measurements",
        "Motion in a Straight Line",
        "Laws of Motion",
    ],
    "chemistry-11": [
        "Some Basic Concepts of Chemistry",
        "Structure of Atom",
        "Classification of Elements",
        "Chemical Bonding",
    ],
    "mathematics-11": [
        "Sets",
        "Relations and Functions",
        "Trigonometric Functions",
        "Complex Numbers",
    ],
    "biology-11": [
        "The Living World",
        "Biological Classification",
        "Plant Kingdom",
        "Animal Kingdom",
    ],
}


def slugify(value: str) -> str:
    return value.lower().replace(" ", "-")


def main() -> None:
    db = SessionLocal()
    try:
        board = db.scalar(select(Board).where(Board.code == "CBSE"))
        if not board:
            board = Board(code="CBSE", name="Central Board of Secondary Education")
            db.add(board)
            db.flush()

        subject_specs = [
            ("physics", "Physics", 11),
            ("chemistry", "Chemistry", 11),
            ("mathematics", "Mathematics", 11),
            ("biology", "Biology", 11),
        ]

        for code, name, class_level in subject_specs:
            slug = f"{code}-{class_level}"
            subject = db.scalar(select(Subject).where(Subject.slug == slug))
            if not subject:
                subject = Subject(
                    board_id=board.id,
                    class_level=class_level,
                    code=code,
                    name=name,
                    slug=slug,
                )
                db.add(subject)
                db.flush()

            for index, chapter_name in enumerate(STARTER_DATA[slug], start=1):
                chapter_slug = f"{slugify(chapter_name)}-{class_level}"
                chapter = db.scalar(select(Chapter).where(Chapter.slug == chapter_slug))
                if chapter:
                    continue
                db.add(
                    Chapter(
                        subject_id=subject.id,
                        chapter_number=index,
                        name=chapter_name,
                        slug=chapter_slug,
                        sequence_index=index,
                        description=f"Starter chapter for {name}",
                        active_session="2026-27",
                    )
                )

        db.commit()
        print("Seeded starter curriculum.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
