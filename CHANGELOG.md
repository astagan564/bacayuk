# Changelog

All notable changes to the **BacaYuk** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-10

### Added
- **AI Storybook Studio**: Added a reusable storybook generation contract, example payload, visual production guide, character bible, review checklist, and illustration continuity rules.
- **Brief-first Quick Create**: Admins can now start from a short idea or manuscript using only a brief, target age, and primary language; title, structure, page beats, glossary, quiz candidates, and visual direction are generated as a reviewable draft.
- **Sequential illustration workflow**: Added resumable cover-first and page-by-page image generation with progress feedback. Completed images are preserved when a later request fails.
- **English page titles**: Added `titleEn` to each story page and to the translation/editor workflow.

### Changed
- **Editorial reader spread**: One story page now becomes one book spread, with a full illustration on the left and focused story text on the right. On mobile, the same page stacks illustration above text.
- **Responsive reader workspace**: Mobile reading now uses safer horizontal-swipe detection, larger text, a compact single-language view for ID+EN, and a bottom bar that stays attached to the viewport. On desktop, the book spread and tool sidebar are sized to the available viewport height; long text scrolls inside the page and long tool lists scroll inside the sidebar.
- **End-of-book actions**: The back cover now presents Vocabulary Quiz and Complete Book actions directly in the story. Completion is recorded only when the child explicitly selects Complete Book, so they can take the final quiz first.
- **External reading toolbar**: Moved quiz, recording, read-aloud, bookmark, completion, and vocabulary actions outside the book surface. Page navigation now sits outside the spread as well.
- **Bilingual narration**: Read-aloud now selects an English voice for English mode and avoids playing Indonesian custom recordings over English text.
- **Vocabulary quiz choices**: Correct answers are distributed across different option positions and reshuffled when a quiz is restarted, including for existing books.
- **Illustration prompt safety**: Image generation now sends only visual scene descriptions and character continuity context, not raw titles or manuscript text, and applies mandatory no-typography exclusions.
- **Storefront covers**: Homepage book cards now display the stored cover artwork with a full-cover treatment and gradient fallback.
- **Story pipeline states**: Illustration and publishing states now reflect whether a real cover and all page images are complete.
- **Dark mode surfaces**: Unified promo, hero, modal, quiz, stats, recorder, rest reminder, changelog, and admin editor panels with shared reader surface tokens.
- **Reader UI polish**: Replaced older amber/purple gradient-heavy modal treatments with calmer book-inspired surfaces, consistent borders, and clearer dark-mode contrast.
- **Admin editor styling**: Updated story editor inputs and nested panels to use the same reader field and soft-panel styles as the public reading flows.
- **Mobile-first reader layout**: Optimized reading mode for phones and tablets with single-page default, tighter book spacing, clearer page controls, larger touch targets, and a cleaner mobile tools sheet.
- **Header responsiveness**: Reduced crowded mobile header actions, kept the theme toggle visible, and made the BacaYuk brand area truncate cleanly instead of overlapping account controls.
- **Admin book CMS**: Expanded internal book management with Supabase-backed persistence, draft/published status, validation, cover preview, page add/duplicate/delete controls, interactive element editing, and per-page mini quiz editing.
- **Checkout story lookup**: Payment creation now resolves book title and price from the Supabase story table before falling back to bundled stories.

### Fixed
- **Reader control anchoring**: Fixed the mobile navigation bar moving with short story pages by replacing the reader entry transform with an opacity-only animation.
- **Missing storefront artwork**: Fixed published book cards rendering only a color gradient instead of their saved cover image.
- **Predictable vocabulary answers**: Fixed every generated vocabulary answer appearing in the first option.
- **Partial English translation**: Fixed translated pages retaining Indonesian page titles.
- **Wrong read-aloud language**: Fixed English story text being pronounced with the Indonesian speech voice.
- **Unwanted text in illustrations**: Removed raw story context that caused generated images to reproduce titles, narration, captions, and other text artifacts.
- **Dark mode mismatch**: Fixed light cards and low-contrast text appearing inside dark mode by aligning reusable CSS selectors with the app's `.dark` class strategy.
- **Invalid Tailwind class**: Removed remaining `slate-850` usages that could be ignored during build and cause inconsistent dark surfaces.
- **Modal readability**: Improved text, divider, field, and button contrast across parent login, parental gate, vocabulary, reading stats, voice recorder, rest reminder, completion, and changelog modals.
- **Reading footer overflow**: Hid the marketing footer while a story is open so mobile reading pages no longer appear to stretch into a long footer after scrolling.
- **Homepage logo collision**: Fixed the front-page header where the logo text could be clipped behind parent login/logout and utility buttons on narrow screens.
- **Admin story persistence**: Fixed added or edited books disappearing after refresh by introducing a story store with local fallback and server-side Supabase sync.

## [0.0.1] - 2026-08-08

### Added
- **Interactive 3D Flipbook**: Core engine for flipping pages with 3D animations and page shadows.
- **Bilingual Support (ID/EN/Dual)**: Ability to switch between Indonesian, English, or both simultaneously.
- **Text-to-Speech (TTS)**: Integration with speech engine to read pages automatically or manually.
- **Voice Recording**: Parents can record their own voice for each page (stored in IndexedDB).
- **Interactive Elements**: Tap-to-translate (Glossary), tap animations on illustrations.
- **Vocabulary Quiz**: A mini-game at the end of each book to test children's memory of English vocabularies.
- **Offline Download**: Download books as PDF or EPUB.
- **Reading Stats**: Track total reading time and books completed.
- **Rest Reminder**: Eye-rest reminder pops up every 20 minutes of continuous reading.
- **Payment & Auth**: Added Midtrans and Supabase integrations (internal scaffolding).
- **Admin Dashboard**: PIN protected dashboard for editing book prices and default settings.
- **Parent Settings**: Dedicated parent settings page with custom reading intervals and customizable parental gate questions.

### Changed
- **Sidebar Navigation**: Completely redesigned desktop reading interface to use a sticky right sidebar instead of a bottom bar.
- Removed middle spine shadow when viewing the book in single-page mode.
