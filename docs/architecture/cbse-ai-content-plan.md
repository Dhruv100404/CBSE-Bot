# CBSE AI Content Namespace Plan

## Current problem

The tutor should not depend on one flat OCR/RAG manifest. A student thinks in this order:

1. Subject
2. Class
3. Chapter
4. Concept or section
5. Example, exercise question, answer key, formula, or definition

So our content should be stored that way before the chatbot sees it.

## Canonical folder shape

```txt
data/cbse-ai-content/
  index.json
  mathematics/
    class-12/
      relations-and-functions/
        chapter.json
        objects.json
        content.json
        definitions.json
        examples.json
        exercises.json
        formulas.json
```

## File responsibilities

- `index.json`: subject/class/chapter discovery for the app and API.
- `chapter.json`: chapter metadata, counts, source, and file map.
- `objects.json`: full normalized object list for generic retrieval.
- `content.json`: chapter sections and general explanation blocks.
- `definitions.json`: definitions as first-class lookup objects.
- `examples.json`: solved examples with page references.
- `exercises.json`: exercise questions grouped by exercise number, with mapped answer keys.
- `formulas.json`: extracted symbolic statements for formula/search support.

## Tutor behavior

- Exact answer-key query: return mapped answer key deterministically, no LLM rewriting unless explanation is requested.
- Example/detail query: retrieve exact example, then use LLM only to format/explain.
- Concept query: retrieve definitions, content sections, examples, and formulas in that order.
- Every response must show citations from the namespace object.

## UI behavior

- Show a subject/chapter selector first.
- Show a chapter content map before chat: examples, exercises, answer keys, definitions, formulas.
- Let students click into examples/exercises instead of guessing prompt wording.
- Conversation history is secondary; chapter navigation is primary.

## Next implementation steps

1. Build clickable content browser in tutor sidebar.
2. Add API endpoint for chapter object lists.
3. Add reviewer cleanup for noisy formula extraction.
4. Add vector/Pinecone indexing over `objects.json`, not raw OCR output.
5. Repeat namespace build for the next 1-2 chapters before expanding UI.
