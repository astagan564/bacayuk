# Changelog

All notable changes to the **BacaYuk** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-08-11

### Added
- **Addressable frontend routes**: Added file-based routing for the catalog, parent settings, story reader, and Admin sections. Pages such as `/settings`, `/read/:storyId`, `/admin/stories`, `/admin/users`, `/admin/finance`, `/admin/costs`, `/admin/analytics`, and `/admin/settings` can now be bookmarked and opened directly.
- **Addressable Book Studio workflows**: Added dedicated URLs for AI Quick Create, story editing, and story canvas at `/admin/stories/new`, `/admin/stories/:storyId/edit`, and `/admin/stories/:storyId/canvas`.
- **Frontend route generation**: Added TanStack Router and its Vite plugin so the typed route tree and route-specific production chunks are generated during development and build.

### Changed
- **Feature-based frontend architecture**: Split the frontend into focused Admin, Book Studio, reader, and application-shell modules instead of keeping all behavior and markup in `App.tsx` and `AdminDashboard.tsx`.
- **Admin maintenance boundaries**: Moved Stories, Users, Payments, Cost & Margin, Settings, and Reading Retention into independent tab components with explicit typed inputs and actions.
- **Book Studio maintenance boundaries**: Centralized storybook API requests, types, constants, draft helpers, Quick Create, and the story editor under `src/features/book-studio` while retaining the brief-to-draft, enhancement, translation, and illustration workflow.
- **Story editor composition**: Replaced the monolithic story editor with focused production-status, illustration-progress, page-canvas, metadata, bilingual-page, preview, interaction-and-quiz, and glossary components. The dialog now coordinates these sections without owning their detailed markup.
- **Application shell maintenance boundaries**: Moved the global header and catalog/reader workspace into focused components while keeping navigation and reader state coordinated by the application shell.
- **TypeScript configuration**: Enabled full TypeScript `strict` mode and corrected the `@` path alias to resolve from `src`.
- **Book Studio controller boundary**: Moved translation, enhancement, and resumable illustration lifecycle state out of `AdminDashboard` into a dedicated typed controller hook. Draft mapping, save normalization, and validation now live in a separate pure helper module.
- **Quick Create controller boundary**: Moved Quick Create form state, PDF text extraction and OCR progress, AI draft generation, local manuscript fallback, and dialog reset behavior into a dedicated Book Studio controller. `AdminDashboard` now coordinates the resulting draft instead of implementing the import and generation workflow itself.
- **Admin operations controller boundaries**: Moved coupon and transaction state, global settings and cleanup actions, and cost-ledger loading and calculations into dedicated typed controllers. Admin tabs now receive explicit state and actions through the Admin feature boundary instead of accessing persistence directly.
- **Book editor controller boundary**: Moved manual and AI draft opening, route-driven edit/canvas state, validation, persistence, deletion, glossary refresh, canvas interactions, and AI enhancement lifecycle into the Book Studio feature. `AdminDashboard` now composes the editor instead of implementing its workflow.
- **Admin feature composition**: Moved the complete catalog, Quick Create, and editor composition into a dedicated Book Studio workspace. Admin navigation, user activity state, CSV export, and shared section types now live behind the Admin feature boundary.
- **Admin route and access boundary**: Moved Admin URL interpretation, section navigation, story persistence, lazy dashboard loading, PIN verification API calls, and access state out of `App.tsx` into the Admin feature.
- **Reader progress controller boundary**: Moved bookmark, reading-time, completion, rest-reminder, and Admin activity-log state into the Reader feature, with browser persistence isolated behind a typed store.
- **Reader session boundary**: Moved story selection, direct reader-route synchronization, saved-page restoration, page navigation, mobile scroll reset, and AI-created story opening into a dedicated Reader controller.
- **Reader settings boundary**: Moved reading preferences, theme derivation, and document dark-mode synchronization out of the application shell into a focused settings controller.
- **Reader overlay composition**: Moved thumbnail, Story Maker, quiz, rest reminder, parental gate, statistics, voice recorder, and completion modal state and rendering behind the Reader feature boundary.
- **Reader navigation composition**: Replaced the monolithic reader navigation component with a focused controller, desktop sidebar, mobile navigation and tools sheet, plus shared accessible control primitives under the Reader feature.
- **Flipbook composition**: Split flipbook audio, autoplay, keyboard, click, and swipe behavior from story spread, interactive element, back-cover, and vocabulary overlay rendering under the Reader feature.
- **Story catalog composition**: Replaced the monolithic catalog selector with a typed collection controller and focused promo, hero, personal-library tabs, category filter, cover, story-card, and empty-state components under the Reader feature.
- **Account session boundary**: Moved authentication initialization, purchase synchronization, login/logout state, pending-story access, favorites, and recently-read persistence into a dedicated Account feature.
- **Commerce flow state machine**: Replaced separate VIP, parental-gate, book-payment, and download modal booleans with one typed purchase flow and a dedicated Commerce modal composer.
- **Payment gateway boundary**: Moved typed transaction and verification requests, Midtrans Snap loading, checkout state, purchase recording, and focused checkout/success views into the Commerce feature.
- **Download generator boundary**: Split PDF rendering, EPUB document assembly, HTML escaping, and stored ZIP encoding into focused Commerce download modules while retaining the original `fileGenerators` compatibility exports.

### Fixed
- **Duplicate story maker dialog**: Removed a duplicate `StoryMakerModal` render that could mount the same AI story creation interface twice.
- **Direct-link navigation**: Replaced transient view-only navigation with URL-backed navigation so browser refresh and direct entry preserve the requested frontend section.
- **Hidden draft typing errors**: Normalized manuscript and AI page drafts before Story mapping and removed implicit callback types from the Admin data store, allowing the complete project to pass strict TypeScript checks.
- **Admin CSV escaping**: Escaped embedded quotes in exported parent-account fields so names and contact data cannot corrupt CSV columns.
- **Admin PIN retry flow**: Kept the controlled PIN dialog open after failed verification and disabled duplicate submissions while a verification request is running.
- **Reader progress storage validation**: Ignore malformed bookmark, duration, and completion values from browser storage instead of allowing invalid data to enter reader state.
- **Post-login reader route**: Opening a locked story after successful parent login now navigates to its addressable `/read/:storyId` URL and records it in the signed-in account's recent library.
- **Exclusive purchase dialogs**: Purchase transitions now guarantee only one offer, gate, payment, or download dialog can be active at a time.
- **Checkout state consistency**: Changing between book and VIP purchases now clears stale coupon discounts, and successful VIP payments activate the subscription exactly once instead of repeating activation in the purchase flow.
- **Unmounted payment callbacks**: Async transaction and Midtrans callbacks no longer update checkout state after the payment modal has been closed.
- **Reader media cleanup**: Reader navigation and unmounting now cancel pending page-flip and interaction timers, stale narration lookups, and active custom recordings so media cannot continue on the wrong page or story.

## [0.1.0] - 2026-08-10

### Added
- **Cost & margin ledger**: Added a server-written Admin ledger for Gemini draft and image-generation costs, plus Midtrans payment fees after successful verification. Admins can now review total revenue, AI costs, external fees, and per-book cost totals.
- **PDF-to-book import**: Admin Quick Create can now extract text from a PDF in the browser and turn it into a reviewable Book Studio draft. For image-only scans, compressed page previews are sent temporarily to the existing AI service for OCR; the source PDF itself is not uploaded or stored.
- **Personal library**: Added per-device collections for Favorite, Continue Reading, Recently Read, and Completed stories. Favorites can be toggled directly on each cover, and collections retain their state separately for guest and signed-in reader profiles on the same device.
- **AI Storybook Studio**: Added a reusable storybook generation contract, example payload, visual production guide, character bible, review checklist, and illustration continuity rules.
- **Brief-first Quick Create**: Admins can now start from a short idea or manuscript using only a brief, target age, and primary language; title, structure, page beats, glossary, quiz candidates, and visual direction are generated as a reviewable draft.
- **Sequential illustration workflow**: Added resumable cover-first and page-by-page image generation with progress feedback. Completed images are preserved when a later request fails.
- **English page titles**: Added `titleEn` to each story page and to the translation/editor workflow.

### Changed
- **Editorial reader spread**: One story page now becomes one book spread, with a full illustration on the left and focused story text on the right. On mobile, the same page stacks illustration above text.
- **Responsive reader workspace**: Mobile reading now uses safer horizontal-swipe detection, larger text, a compact single-language view for ID+EN, and a bottom bar that stays attached to the viewport. On desktop, the book spread and tool sidebar are sized to the available viewport height; long text scrolls inside the page and long tool lists scroll inside the sidebar.
- **Immersive reading mode**: The global header now stays out of sight while a story is open, leaving the reader controls as the focused way to return, change settings, and navigate.
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
- **Admin catalog deletion**: Deleting a book now removes its Supabase record instead of only removing it from the current browser list. Empty catalogs and deleted books no longer repopulate from the bundled fallback when Supabase is available.
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
