from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[4]
SOURCE_PATH = (
    REPO_ROOT
    / "data"
    / "ocr-output"
    / "math-class12-ch1"
    / "chapter-1.pages.content-objects.with-answers.json"
)
CONTENT_ROOT = REPO_ROOT / "data" / "cbse-ai-content"


def main() -> None:
    objects = load_source_objects()
    if not objects:
        raise SystemExit(f"No source objects found at {SOURCE_PATH}")

    normalized = [normalize_object(item) for item in objects]
    chapter = chapter_descriptor(normalized)
    chapter_dir = (
        CONTENT_ROOT
        / chapter["subjectSlug"]
        / f"class-{chapter['classLevel']}"
        / chapter["chapterSlug"]
    )
    chapter_dir.mkdir(parents=True, exist_ok=True)

    grouped = group_content(normalized)
    write_json(CONTENT_ROOT / "index.json", build_root_index(chapter, grouped))
    write_json(chapter_dir / "chapter.json", build_chapter_manifest(chapter, grouped))
    write_json(chapter_dir / "objects.json", normalized)
    write_json(chapter_dir / "content.json", grouped["content"])
    write_json(chapter_dir / "definitions.json", grouped["definitions"])
    write_json(chapter_dir / "examples.json", grouped["examples"])
    write_json(chapter_dir / "exercises.json", grouped["exercises"])
    write_json(chapter_dir / "formulas.json", grouped["formulas"])

    print(f"Built content namespace at {chapter_dir}")


def load_source_objects() -> list[dict[str, Any]]:
    return json.loads(SOURCE_PATH.read_text(encoding="utf-8")) if SOURCE_PATH.exists() else []


def normalize_object(item: dict[str, Any]) -> dict[str, Any]:
    metadata = item.get("metadata_json") or {}
    body_text = repair_text(str(item.get("body_text", ""))).strip()
    normalized_text = repair_text(str(item.get("normalized_text", ""))).strip()
    object_type = item.get("object_type")
    object_key = item.get("object_key")

    return {
        "id": item.get("id"),
        "type": object_type,
        "key": object_key,
        "title": repair_text(str(item.get("title", ""))).strip(),
        "bodyText": body_text,
        "normalizedText": normalized_text,
        "pageStart": item.get("page_start"),
        "pageEnd": item.get("page_end"),
        "sequenceIndex": item.get("sequence_index"),
        "subject": metadata.get("subject", "mathematics"),
        "classLevel": metadata.get("class_level", 12),
        "chapterSlug": metadata.get("chapter_slug", "relations-and-functions"),
        "chapterTitle": metadata.get("chapter_title", "Relations and Functions"),
        "exerciseNumber": extract_exercise_number(object_key),
        "questionNumber": extract_question_number(object_key),
        "exampleNumber": extract_number(object_key, "example"),
        "definitionNumber": extract_number(object_key, "definition"),
        "sectionNumber": metadata.get("section_number") or extract_section_number(object_key),
        "source": {
            "document": "NCERT Mathematics Class 12",
            "pageStart": item.get("page_start"),
            "pageEnd": item.get("page_end"),
            "span": item.get("source_span_json") or {},
        },
        "metadata": metadata,
        "confidence": item.get("confidence_score"),
        "status": item.get("status", "extracted"),
    }


def chapter_descriptor(objects: list[dict[str, Any]]) -> dict[str, Any]:
    first = objects[0]
    subject = first["subject"]
    return {
        "board": "cbse",
        "source": "ncert",
        "subjectSlug": subject,
        "subjectName": subject.title(),
        "classLevel": first["classLevel"],
        "chapterSlug": first["chapterSlug"],
        "chapterTitle": first["chapterTitle"],
        "namespace": f"cbse-ai-content/{subject}/class-{first['classLevel']}/{first['chapterSlug']}",
    }


def group_content(objects: list[dict[str, Any]]) -> dict[str, Any]:
    by_type: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in objects:
        by_type[item["type"]].append(item)

    exercise_questions = by_type["exercise_question"]
    exercise_answers = by_type["exercise_answer"]
    answer_by_key = {
        str(answer["key"]).replace(":answer", ""): answer
        for answer in exercise_answers
    }

    exercises: dict[str, dict[str, Any]] = {}
    for question in exercise_questions:
        exercise_number = question["exerciseNumber"] or "unknown"
        exercise = exercises.setdefault(
            exercise_number,
            {
                "exerciseNumber": exercise_number,
                "questions": [],
                "answerCount": 0,
                "questionCount": 0,
            },
        )
        answer = answer_by_key.get(question["key"])
        exercise["questions"].append(
            {
                "key": question["key"],
                "questionNumber": question["questionNumber"],
                "title": question["title"],
                "questionText": question["bodyText"],
                "answerText": answer["bodyText"] if answer else None,
                "pageStart": question["pageStart"],
                "pageEnd": question["pageEnd"],
                "answerPageStart": answer["pageStart"] if answer else None,
                "source": question["source"],
                "answerSource": answer["source"] if answer else None,
                "confidence": min(
                    value
                    for value in [question.get("confidence"), answer.get("confidence") if answer else None]
                    if value is not None
                ),
            }
        )

    for exercise in exercises.values():
        exercise["questions"].sort(key=lambda item: int(item["questionNumber"] or 0))
        exercise["questionCount"] = len(exercise["questions"])
        exercise["answerCount"] = sum(1 for question in exercise["questions"] if question["answerText"])

    return {
        "content": sorted(by_type["general_content"], key=sort_key),
        "definitions": sorted(by_type["definition"], key=sort_key),
        "examples": sorted(by_type["example"], key=sort_key),
        "exercises": sorted(exercises.values(), key=lambda item: item["exerciseNumber"]),
        "formulas": sorted(by_type["formula"], key=sort_key),
        "counts": {key: len(value) for key, value in by_type.items()},
    }


def build_root_index(chapter: dict[str, Any], grouped: dict[str, Any]) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "namespace": "cbse-ai-content",
        "subjects": [
            {
                "id": f"{chapter['subjectSlug']}-{chapter['classLevel']}",
                "slug": chapter["subjectSlug"],
                "name": chapter["subjectName"],
                "classLevel": chapter["classLevel"],
                "chapters": [
                    {
                        "slug": chapter["chapterSlug"],
                        "title": chapter["chapterTitle"],
                        "path": f"{chapter['subjectSlug']}/class-{chapter['classLevel']}/{chapter['chapterSlug']}",
                        "counts": grouped["counts"],
                    }
                ],
            }
        ],
    }


def build_chapter_manifest(chapter: dict[str, Any], grouped: dict[str, Any]) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        **chapter,
        "counts": grouped["counts"],
        "files": {
            "objects": "objects.json",
            "content": "content.json",
            "definitions": "definitions.json",
            "examples": "examples.json",
            "exercises": "exercises.json",
            "formulas": "formulas.json",
        },
    }


def sort_key(item: dict[str, Any]) -> tuple[int, int]:
    return int(item.get("pageStart") or 0), int(item.get("sequenceIndex") or 0)


def extract_number(key: Any, prefix: str) -> int | None:
    match = re.search(rf"{prefix}:(\d+)", str(key or ""))
    return int(match.group(1)) if match else None


def extract_exercise_number(key: Any) -> str | None:
    match = re.search(r"exercise:(\d+\.\d+)", str(key or ""))
    return match.group(1) if match else None


def extract_question_number(key: Any) -> int | None:
    match = re.search(r":q(\d+)", str(key or ""))
    return int(match.group(1)) if match else None


def extract_section_number(key: Any) -> str | None:
    match = re.search(r"section:(\d+\.\d+)", str(key or ""))
    return match.group(1) if match else None


def repair_text(text: str) -> str:
    try:
        text = text.encode("latin-1").decode("utf-8")
    except UnicodeError:
        pass
    replacements = {
        "\u00e2\u0080\u0099": "'",
        "\u00e2\u0080\u0098": "'",
        "\u00e2\u0080\u00b2": "'",
        "\u00e2\u0080\u0093": "-",
        "\u00e2\u0080\u0094": "-",
        "\u00e2\u0088\u0092": "-",
        "\u00e2\u0086\u0092": "->",
        "\u00e2\u0087\u0092": "=>",
        "\u00e2\u0088\u0088": "in",
        "\u00e2\u0088\u0089": "not in",
        "\u00e2\u008a\u0082": "subset",
        "\u00e2\u0089\u00a4": "<=",
        "\u00e2\u0089\u00a5": ">=",
        "\u00e2\u0088\u00aa": "union",
        "\u00e2\u0088\u00a9": "intersection",
        "\u00cf\u0086": "phi",
        "\u00c3\u0097": "x",
        "’": "'",
        "‘": "'",
        "′": "'",
        "–": "-",
        "—": "-",
        "−": "-",
        "×": "x",
        "→": "->",
        "⇒": "=>",
        "∈": "in",
        "∉": "not in",
        "⊂": "subset",
        "∪": "union",
        "∩": "intersection",
        "≤": "<=",
        "≥": ">=",
        "φ": "phi",
        "\u00a0": " ",
    }
    for bad, good in replacements.items():
        text = text.replace(bad, good)
    return text


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
