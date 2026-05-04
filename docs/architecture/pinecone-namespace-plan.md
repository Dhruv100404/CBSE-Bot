# Pinecone Namespace Plan

## Current Pinecone State

```txt
Index: cbse-pcmb-content
Dimension: 384
Metric: cosine
Current namespace: cbse-math-12
Current record count: 244
```

The existing namespace is too broad. It mixes class/subject scope without chapter scope.

## Canonical Namespace Rule

Use one namespace per subject/class/chapter:

```txt
cbse-{subject}-{classLevel}-{chapterSlug}
```

For the currently indexed chapter:

```txt
cbse-mathematics-12-relations-and-functions
```

## Record IDs

Keep stable object keys as Pinecone record IDs:

```txt
section:1.1
definition:1
example:1
exercise:1.1:q1
exercise:1.1:q1:answer
formula:4bdd55f647dc
```

## Metadata Contract

Every vector record should include:

```json
{
  "board": "cbse",
  "source": "ncert",
  "subject": "mathematics",
  "subjectId": "mathematics-12",
  "classLevel": 12,
  "chapterSlug": "relations-and-functions",
  "chapterTitle": "Relations and Functions",
  "objectType": "example",
  "objectKey": "example:1",
  "pageStart": 2,
  "pageEnd": 2,
  "title": "Example 1"
}
```

## Retrieval Rule

The tutor must query the chapter namespace first:

```txt
namespace = cbse-mathematics-12-relations-and-functions
```

Then use metadata filters inside that namespace:

```txt
objectType in ["definition", "general_content", "example", "exercise_question", "exercise_answer", "formula"]
```

## Embedding Constraint

The current Pinecone index dimension is `384`. Any upsert/query embedding model must produce 384-dimensional vectors.

Do not use OpenAI `text-embedding-3-small` with this index unless the index is recreated with a matching dimension.

## Migration Plan

1. Keep current `cbse-math-12` namespace untouched for now.
2. Upsert the same 244 records into `cbse-mathematics-12-relations-and-functions`.
3. Verify namespace count is 244.
4. Point tutor retrieval to the chapter namespace.
5. Delete old broad namespace only after the new namespace is verified.
