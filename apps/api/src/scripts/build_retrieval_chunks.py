from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from src.services.pinecone_service import canonical_namespace


REPO_ROOT = Path(__file__).resolve().parents[4]
CHAPTER_DIR = REPO_ROOT / "data" / "cbse-ai-content" / "mathematics" / "class-12" / "relations-and-functions"
OUTPUT_PATH = CHAPTER_DIR / "retrieval-chunks.json"
MAX_EMBED_CHARS = 480


def main() -> None:
    chapter = read_json(CHAPTER_DIR / "chapter.json", {})
    content = read_json(CHAPTER_DIR / "content.json", [])
    definitions = read_json(CHAPTER_DIR / "definitions.json", [])
    examples = read_json(CHAPTER_DIR / "examples.json", [])
    exercises = read_json(CHAPTER_DIR / "exercises.json", [])
    formulas = read_json(CHAPTER_DIR / "formulas.json", [])

    chunks: list[dict[str, Any]] = []
    chunks.extend(section_chunks(chapter, content))
    chunks.extend(object_chunks(chapter, definitions, "definition"))
    chunks.extend(object_chunks(chapter, examples, "example"))
    chunks.extend(exercise_chunks(chapter, exercises))
    chunks.extend(formula_chunks(chapter, formulas))

    payload = {
        "schemaVersion": 1,
        "pineconeIndex": "cbse-pcmb-content",
        "pineconeNamespace": canonical_namespace(
            subject=chapter["subjectSlug"],
            class_level=int(chapter["classLevel"]),
            chapter_slug=chapter["chapterSlug"],
        ),
        "embeddingDimension": 384,
        "embeddingModel": "ollama:all-minilm",
        "chunkCount": len(chunks),
        "chunks": chunks,
    }
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Built {len(chunks)} retrieval chunks at {OUTPUT_PATH}")


def section_chunks(chapter: dict[str, Any], sections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    chunks: list[dict[str, Any]] = []
    for section in sections:
        parts = split_long_text(section["bodyText"], max_chars=MAX_EMBED_CHARS)
        for index, part in enumerate(parts, start=1):
            chunks.append(
                build_chunk(
                    chapter,
                    record_id=f"{section['key']}:chunk:{index}",
                    object_type="section",
                    object_key=section["key"],
                    title=f"{section['title']} - Part {index}",
                    text=part,
                    page_start=section.get("pageStart"),
                    page_end=section.get("pageEnd"),
                    extra={"sectionNumber": section.get("sectionNumber"), "chunkIndex": index},
                )
            )
    return chunks


def object_chunks(chapter: dict[str, Any], objects: list[dict[str, Any]], object_type: str) -> list[dict[str, Any]]:
    chunks: list[dict[str, Any]] = []
    for item in objects:
        if not item.get("bodyText"):
            continue
        parts = split_long_text(item["bodyText"], max_chars=MAX_EMBED_CHARS)
        for index, part in enumerate(parts, start=1):
            chunks.append(
                build_chunk(
                    chapter,
                    record_id=item["key"] if len(parts) == 1 else f"{item['key']}:chunk:{index}",
                    object_type=object_type,
                    object_key=item["key"],
                    title=item["title"] if len(parts) == 1 else f"{item['title']} - Part {index}",
                    text=part,
                    page_start=item.get("pageStart"),
                    page_end=item.get("pageEnd"),
                    extra={
                        "number": item.get("exampleNumber") or item.get("definitionNumber"),
                        "confidence": item.get("confidence"),
                        "chunkIndex": index if len(parts) > 1 else None,
                    },
                )
            )
    return chunks


def exercise_chunks(chapter: dict[str, Any], exercises: list[dict[str, Any]]) -> list[dict[str, Any]]:
    chunks: list[dict[str, Any]] = []
    for exercise in exercises:
        exercise_number = exercise["exerciseNumber"]
        for question in exercise.get("questions", []):
            answer = question.get("answerText")
            text = f"{question['title']}\n\nQuestion:\n{question['questionText']}"
            if answer:
                text += f"\n\nMapped answer key:\n{answer}"
            parts = split_long_text(text, max_chars=MAX_EMBED_CHARS)
            for index, part in enumerate(parts, start=1):
                chunks.append(
                    build_chunk(
                        chapter,
                        record_id=question["key"] if len(parts) == 1 else f"{question['key']}:chunk:{index}",
                        object_type="exercise_qa" if answer else "exercise_question",
                        object_key=question["key"],
                        title=question["title"] if len(parts) == 1 else f"{question['title']} - Part {index}",
                        text=part,
                        page_start=question.get("pageStart"),
                        page_end=question.get("pageEnd"),
                        extra={
                            "exerciseNumber": exercise_number,
                            "questionNumber": question.get("questionNumber"),
                            "hasAnswer": bool(answer),
                            "answerPageStart": question.get("answerPageStart"),
                            "confidence": question.get("confidence"),
                            "chunkIndex": index if len(parts) > 1 else None,
                        },
                    )
                )
    return chunks


def formula_chunks(chapter: dict[str, Any], formulas: list[dict[str, Any]]) -> list[dict[str, Any]]:
    chunks: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in formulas:
        text = " ".join(str(item.get("bodyText", "")).split())
        if not is_useful_formula(text):
            continue
        fingerprint = text.lower()
        if fingerprint in seen:
            continue
        seen.add(fingerprint)
        chunks.append(
            build_chunk(
                chapter,
                record_id=item["key"],
                object_type="formula_reference",
                object_key=item["key"],
                title=item["title"],
                text=text,
                page_start=item.get("pageStart"),
                page_end=item.get("pageEnd"),
                extra={
                    "confidence": item.get("confidence"),
                    "needsReview": item.get("confidence", 0) < 0.75,
                },
            )
        )
    return chunks


def build_chunk(
    chapter: dict[str, Any],
    *,
    record_id: str,
    object_type: str,
    object_key: str,
    title: str,
    text: str,
    page_start: int | None,
    page_end: int | None,
    extra: dict[str, Any],
) -> dict[str, Any]:
    cleaned = clean_text(text)
    return {
        "id": record_id,
        "text": cleaned,
        "metadata": {
            "board": chapter["board"],
            "source": chapter["source"],
            "subject": chapter["subjectSlug"],
            "subjectId": f"{chapter['subjectSlug']}-{chapter['classLevel']}",
            "classLevel": chapter["classLevel"],
            "chapterSlug": chapter["chapterSlug"],
            "chapterTitle": chapter["chapterTitle"],
            "objectType": object_type,
            "objectKey": object_key,
            "title": title,
            "pageStart": page_start,
            "pageEnd": page_end,
            "textPreview": cleaned[:700],
            **{key: value for key, value in extra.items() if value is not None},
        },
    }


def split_long_text(text: str, max_chars: int) -> list[str]:
    cleaned = clean_text(text)
    paragraphs = [part.strip() for part in re.split(r"\n{2,}", cleaned) if part.strip()]
    if not paragraphs:
        paragraphs = [cleaned]

    chunks: list[str] = []
    current = ""
    for paragraph in paragraphs:
        if len(current) + len(paragraph) + 2 <= max_chars:
            current = f"{current}\n\n{paragraph}".strip()
            continue
        if current:
            chunks.append(current)
        if len(paragraph) <= max_chars:
            current = paragraph
        else:
            chunks.extend(paragraph[i : i + max_chars] for i in range(0, len(paragraph), max_chars))
            current = ""
    if current:
        chunks.append(current)
    return chunks


def is_useful_formula(text: str) -> bool:
    if len(text) < 12 or len(text) > 420:
        return False
    symbolic = any(token in text for token in ["=", "{", "}", ":", "->", "=>", "<=", ">=", " in ", " subset "])
    fragmenty = text.lower().startswith(("solution", "hence", "therefore", "similarly"))
    return symbolic and not fragmenty


def clean_text(text: str) -> str:
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
    return text.strip()


def read_json(path: Path, fallback: Any) -> Any:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else fallback


if __name__ == "__main__":
    main()
