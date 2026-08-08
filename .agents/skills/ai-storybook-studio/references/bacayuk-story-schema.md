# BacaYuk Story Schema Notes

Use these notes when mapping AI output into app data.

## Core Story

Required for a usable draft:

- `id`: stable slug or generated id
- `title`
- `author`
- `category`
- `targetAge`
- `description`
- `moralMessage`
- `coverImage` or cover concept placeholder
- `coverBg`, `themeColor`, `accentColor`
- `status: "draft"`
- `pages`

Each `StoryPage` should include:

- `pageNumber`
- `title`
- `text`
- `illustrationType`: one of `forest`, `dragon`, `space`, `sea`, `castle`, `garden`, `custom`
- `illustrationPrompt` for custom/generative visual work
- `colors` copied from app defaults unless a design system mapping exists

## Enhancements

Optional until review:

- `textEn`
- `glossary`
- `vocabularyQuiz`
- `interactiveElements`
- `quizQuestion`
- `downloadEnabled`
- `ebookPrice`
- `watermarkEnabled`

Do not block draft creation because optional enhancements are absent.

## Status Model

Use this mental model even if the app only stores `draft` and `published` today:

```text
Draft -> Story Complete -> Illustrated -> Enhanced -> Ready to Publish
```

Store app status as `draft` until a human explicitly publishes.

## Validation

A generated draft should pass these checks:

- 8-12 pages unless the user requested short/long.
- Page numbers are sequential.
- No empty `text` fields.
- Markdown/meta-chat is removed or rendered intentionally.
- Quiz answer indexes/options are stable and deterministic.
- English text is real translation, not a copied Indonesian fallback.
