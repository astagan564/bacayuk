# Changelog

All notable changes to the **BacaYuk** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-08-08

### Changed
- **Dark mode surfaces**: Unified promo, hero, modal, quiz, stats, recorder, rest reminder, changelog, and admin editor panels with shared reader surface tokens.
- **Reader UI polish**: Replaced older amber/purple gradient-heavy modal treatments with calmer book-inspired surfaces, consistent borders, and clearer dark-mode contrast.
- **Admin editor styling**: Updated story editor inputs and nested panels to use the same reader field and soft-panel styles as the public reading flows.

### Fixed
- **Dark mode mismatch**: Fixed light cards and low-contrast text appearing inside dark mode by aligning reusable CSS selectors with the app's `.dark` class strategy.
- **Invalid Tailwind class**: Removed remaining `slate-850` usages that could be ignored during build and cause inconsistent dark surfaces.
- **Modal readability**: Improved text, divider, field, and button contrast across parent login, parental gate, vocabulary, reading stats, voice recorder, rest reminder, completion, and changelog modals.

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
