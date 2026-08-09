---
name: ai-storybook-studio
description: Create or improve BacaYuk AI storybook generation workflows that turn a title, age range, language, theme, or manuscript into a structured children's book with pages, visual scene prompts, glossary, quiz, interaction ideas, and publish-ready Story data. Use when building, debugging, or designing AI-generated books, Book Studio, Quick Create, story splitting, illustration prompts, child-safe story generation, or visual authoring for BacaYuk.
---

# AI Storybook Studio

Use this skill for BacaYuk features that generate or refine children's books with visuals. Produce reviewable drafts first; never require every enhancement before a book is valid.

## Core Workflow

1. Gather minimal input: title, target age, primary language, theme or manuscript, desired length, and any taboo content.
2. Produce a Core Story before enhancements:
   - metadata
   - cover concept
   - 8-12 pages
   - each page title, story text, and visual scene
3. Add enhancements only after the core draft is coherent:
   - English translation
   - glossary candidates
   - quiz
   - interaction ideas
   - narration notes
   - monetization/download settings
4. Route output into BacaYuk `Story` shape and keep `status: "draft"` until reviewed.
5. Validate by reading the generated draft as a child-facing book, then by running project typecheck/build when code changes.

## BacaYuk Principles

- Treat **page** as the main authoring unit, not database fields.
- Prefer progressive disclosure: Quick Create -> Book Studio -> Advanced.
- Keep generated English translation empty unless it is real translation output from an AI/service.
- Keep interactive X/Y controls hidden behind advanced UI; normal authors should click the visual canvas.
- Keep glossary/quiz suggestions as candidates for approval.
- Do not publish AI output automatically.
- Remove meta-chat from pasted manuscripts, such as "Apakah ada petualangan..." or "Would you like...".

## Generation Rules

- Target 8-12 pages for a normal picture book draft.
- Use short, read-aloud sentences for ages 3-6; use slightly denser paragraphs for ages 7-10.
- One page should carry one beat: setup, problem, discovery, attempt, consequence, resolution, reflection.
- Visual scenes must describe what appears in the illustration, not camera jargon only.
- Quiz questions should test comprehension or moral reasoning, not trivia.
- Glossary should include useful English learning words, not every noun.

## Implementation Notes

- For exact BacaYuk input, package, `Story`, and `StoryPage` interfaces, read `references/storybook-contract.ts`.
- For required versus optional fields and persistence mapping, read `references/bacayuk-story-schema.md`.
- For a complete known-good payload, read `references/example-story.json` and preserve its object shape.
- For visual prompt and illustration rules, read `references/visual-generation.md`.
- If implementing a backend AI endpoint, keep parsing and validation deterministic around the AI call.
- If changing database tables, load the Supabase/Postgres skills first.

## Output Contract

When asked to generate a book draft, provide:

```text
GeneratedStorybookPackage
|- story (directly compatible with BacaYuk admin)
|- productionGuide (character and illustration continuity)
`- review (warnings and human checklist)
```

Require only `brief`, `targetAge`, and `primaryLanguage` from Quick Create. Generate the remaining required `Story` and production fields. Keep `productionGuide` outside `story` until the application schema explicitly stores it.

When implementing code, create small focused changes and verify with:

```bash
npm run lint
npm run build
```
