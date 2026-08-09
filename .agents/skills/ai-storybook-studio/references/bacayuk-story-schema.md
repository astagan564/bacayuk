# BacaYuk Story Schema Notes

Use `storybook-contract.ts` as the canonical generation contract and `example-story.json` as the known-good example. Map only `package.story` into the current BacaYuk admin; retain `productionGuide` while generating images and during review.

## Quick Create input

Ask the admin for only these required fields:

| Field | Required | Rule |
|---|---|---|
| `brief` | Yes | A theme, premise, or pasted manuscript; must not be blank. |
| `targetAge` | Yes | Use `3-5`, `6-8`, or `9-12`. |
| `primaryLanguage` | Yes | Use `id` or `en`. |
| `title` | No | Generate it when omitted. |
| `moralMessage` | No | Infer a gentle message when omitted. |
| `characterHints` | No | Use only as hints; create the character bible either way. |
| `pageCount` | No | Default to 8-12. The current admin generator caps output at 12 pages. |
| `visualPreset` | No | Select by age when omitted. |
| `tabooContent` | No | Merge with the default child-safety rules. |

Do not ask for fields the system can generate.

## Required generated package fields

| Path | Required | Rule |
|---|---|---|
| `schemaVersion` | Yes | Use `1.0`. |
| `story` | Yes | Must conform to the current BacaYuk `Story` interface. |
| `productionGuide.visualPreset` | Yes | Keep one preset for the whole book. |
| `productionGuide.characterBible` | Yes | Define every recurring character before scene prompts. |
| `productionGuide.coverPrompt` | Yes | Show the main character, setting, key object, and emotional promise. |
| `productionGuide.continuityRules` | Yes | State the immutable visual traits used on every page. |
| `productionGuide.negativePrompt` | Yes | Exclude unsafe content, text artifacts, and character drift. |
| `review.status` | Yes | Always start at `needs_review`. |
| `review.checklist` | Yes | Include human checks for story, safety, continuity, and images. |
| `review.warnings` | Yes | Use an empty array when there are no known warnings. |

## Required `story` fields

| Field | Required | Rule |
|---|---|---|
| `id` | Yes | Stable lowercase slug; append a unique suffix when saving. |
| `title` | Yes | Child-friendly and concise. |
| `author` | Yes | Default to `BacaYuk Studio`. |
| `category` | Yes | Use the closest editorial category. |
| `coverImage` | Yes | Use an uploaded/generated URL or a temporary review placeholder. |
| `coverBg` | Yes | Valid Tailwind gradient classes used by the current UI. |
| `themeColor` | Yes | Main color token used by the current UI. |
| `accentColor` | Yes | Accent color token used by the current UI. |
| `pages` | Yes | Target 8-12 pages; never empty. |
| `moralMessage` | Yes | One gentle takeaway, not a lecture. |
| `targetAge` | Yes | Human-readable value such as `6-8 Tahun`. |
| `description` | Yes | Short catalog summary. |
| `status` | Yes | Always `draft` for AI output. |
| `pipelineStatus` | Yes | Start at `story_complete` or `illustrated`; never claim later stages without evidence. |

`accessStatus`, download, price, watermark, PDF/EPUB URLs, glossary, and vocabulary quiz are optional defaults or enhancements. Do not block draft creation when they are absent.

## Required page fields

| Field | Required | Rule |
|---|---|---|
| `pageNumber` | Yes | Sequential, starting at 1. |
| `title` | Yes for generated books | Short beat label. The app type permits omission, but generated output must include it. |
| `text` | Yes | Non-empty child-facing story text. |
| `illustrationType` | Yes | `forest`, `dragon`, `space`, `sea`, `castle`, `garden`, or `custom`. |
| `illustrationPrompt` | Yes for generated books | Describe subject, action, setting, mood, key object, and child-safe style. |
| `colors` | Yes | Include all five current UI color fields. |

`textEn`, `imageUrl`, `customSvgPath`, interactions, and page quiz are optional. If `illustrationType` is `custom`, require at least one of `illustrationPrompt`, `customSvgPath`, or `imageUrl`.

## Persistence mapping

The Supabase `admin_stories` table stores `id`, `title`, `category`, `status`, and `sort_order` as columns, with the complete `Story` object in the `story` JSONB column. Persist `package.story`, not the entire package. Keep `productionGuide` in the generation job, draft workspace, or a future dedicated field.

## Validation

- Return valid JSON without Markdown fences or meta-chat.
- Keep page numbers sequential and page text non-empty.
- Keep `status: "draft"` until a human explicitly publishes.
- Use one visual preset and the same character traits across every prompt.
- Make quiz answer indexes valid for their option arrays.
- Leave `textEn` empty until a real translation exists.
- Keep glossary terms relevant to words or concepts in the story.
