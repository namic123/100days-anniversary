# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A mobile-first interactive 100-day anniversary website for a Korea-Taiwan long-distance relationship. The approved design direction is "Gift Box Diary." This is a personal, emotional experience — not a commercial product or portfolio piece.

Key dates: relationship start `2026-04-28`, 100-day anniversary `2026-08-05`. Default language is Traditional Chinese (zh-TW), with Korean (ko) and English (en) also supported.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build (outputs to dist/)
npm run preview      # Preview production build locally
npm run lint         # ESLint (flat config)
npm run typecheck    # vue-tsc --build --force
npm run test         # Vitest unit tests (jsdom environment)
npm run test:e2e     # Build + Playwright E2E (mobile-chrome-390 project only)

npx vitest run tests/useBookEngine.test.ts   # Single unit test file
npx vitest run -t 'chapter'                  # Single test by name
npx playwright test -g 'full flow'           # Single E2E test (requires an existing dist/)
```

Requires Node >= 22. CI runs: lint → typecheck → test → e2e → build → deploy to GitHub Pages. The build step in CI sets `GITHUB_PAGES_BASE=/100days-anniversary/`; locally `base` defaults to `./`.

Adding a new asset file under `src/assets/` requires restarting the dev server — media is resolved via eager `import.meta.glob`.

## Architecture

Single-page Vue 3 app (Composition API + TypeScript) built with Vite. No Vue Router. Fully static, no backend. The whole experience is three sequential phases driven by `phase` state in `src/App.vue`:

1. **`StarIntro.vue`** — constellation tour through 19 photo/video "stars" → fireworks celebration → a star morphs into a gift box that lands in golden-hour light. Emits `completed`.
2. **`GiftScene.vue`** — three.js/WebGL gift box that opens and raises the diary, then the cover opens. Emits `opened`. Code-split via `defineAsyncComponent` to keep three.js out of the main bundle; on chunk-load failure it falls straight through to reading mode so the app never dead-ends. Has a non-WebGL CSS fallback (`.gsx-fallback`) and exposes `data-gs-phase` on its root for E2E sequencing.
3. **`DiaryReader.vue`** — the page-flip reading mode. This one component renders *every* page section inline (intro, timeline, timeline-media, memory, letter, ending) and owns the flip animation plus swipe/tap/arrow-key navigation and the progress-dot rail. `PageEndingCake.vue` is the only child it delegates to.

`App.vue` also owns the global FAB stack (mute/locale), background music (`public/background-music.mp3`, started on first user gesture), and the crossfade choreography — `showGiftScene` is deliberately decoupled from `phase` so the WebGL scene keeps rendering underneath while reading mode fades in, then unmounts ~1.1s later.

**Legacy components — do not extend.** `BookPageRenderer.vue`, `PageIntro/Timeline/Memory/Map/Future/Letter/Ending.vue`, `BookCover.vue`, `GiftBox.vue`, and `PreIntro.vue` are superseded and unreachable from `App.vue`. Their localized copy was harvested into `DiaryReader.vue`. Edit `DiaryReader.vue` (or `StarIntro.vue`/`GiftScene.vue`) instead.

**`useBookEngine.ts`** is the single source of page order. It builds the page array at runtime from content modules: `intro` → for each `timeline` entry a story page plus a media page *only if* `timelineMedia[id]` is non-empty → enabled `memories` → `letterPages` → `ending`. Chapters (5: intro / story / memories / letter / ending) are derived by finding the first page of each section, with fallback to the next present section when one is empty. Adding content changes page count automatically — `tests/useBookEngine.test.ts` guards this. Note the chapter/TOC API (`chapters`, `currentChapter`, `jumpToChapter`) plus `progress`, `isFlipping`, and `resetBook` are currently exercised only by tests — no production component renders a TOC.

**Media pipeline.** Real photos/videos live in `src/assets/{intro-media,timeline-media,cover-media}/` and are pulled in with eager `import.meta.glob(..., { import: 'default', query: '?url' })`, then matched by filename via a shared `importedMediaUrl()` helper. Any slot with no matching file renders a generated `fauxPhoto()` SVG placeholder, so slots always render. Slot definitions (id, filename, kind, caption, video `poster`) live in `src/content/starIntroMedia.ts` and `src/content/timelineMedia.ts` — those are the files to edit when adding media, and both are unit-tested against the expected filenames.

**Content/localization pattern:**
```ts
type LocalizedText = { 'zh-TW': string; ko: string; en: string }
```
Use `getLocalizedText(text, locale)` from `src/content/localization.ts` (falls back to `zh-TW`). Locale keys are hyphenated BCP 47 (`'zh-TW'`) everywhere — note `AGENTS.md` still shows an older `zhTW` shape; the code is correct, that doc is not. Components re-derive strings through a local `t()`/`L()` computed so switching language mid-animation updates live.

**Other layout:** `src/content/` holds typed story data (keep large personal copy out of templates); `src/styles/main.css` holds all design tokens and the design system; `tests/` is Vitest, `e2e/` is Playwright, `design-lab/` is standalone HTML prototypes excluded from the build (production components are ported from these — the header comment in a component usually names its source mockup).

**E2E specifics:** `e2e/smoke.spec.ts` boots its own `node:http` static server over `dist/` (so `npm run test:e2e` must build first) and asserts zero console errors across the full flow. It must stay WebGL-agnostic — CI's software renderer may take either the WebGL or fallback branch. CI retries twice to absorb renderer flakiness.

**Path alias:** `@/` maps to `./src/` (vite.config.ts and tsconfig.app.json).

## Key Constraints

- **Static only** — no backend, database, API server, analytics collecting personal data, or user-generated content
- **Mobile-first** — primary viewports 375x667, 390x844, 430x932. No horizontal scrolling. Min touch target 44px. Safe-area insets.
- **Page-flip, not scroll** — `DiaryReader` renders only a ±1 window of pages around the current index; rendering all pages as stacked 3D layers was the main source of mobile page-turn jank. Preserve that windowing.
- **Locale key format** — hyphenated BCP 47 (`'zh-TW'`, `'ko'`, `'en'`), never camelCase
- **Three.js is approved but isolated** — confined to `GiftScene.vue`, code-split, one animation loop, with a CSS fallback and teardown on unmount. Prefer CSS transitions everywhere else; do not introduce WebGL into content components.
- **Touch interactions** — do not rely on hover
- **Privacy** — noindex/nofollow/noarchive meta, restrictive robots.txt. Strip EXIF. Non-descriptive filenames keyed to slot ids (`media-01.webp`, `timeline-reunion-04.webp`).
- **Performance** — total assets < 50MB, photos 100-300KB, videos carry a `.webp` poster frame and autoplay muted, lazy load media
- **Accessibility** — semantic HTML, visible focus states, `prefers-reduced-motion` (checked at setup in the animation-heavy components), sufficient contrast, 100dvh with fallback

## Style Conventions

- 2-space indentation for Vue, TypeScript, CSS, JSON, YAML
- Components: `PascalCase.vue`; composables: `useThing.ts`; content files: `camelCase.ts`
- Short imperative commit messages (e.g., `Add scrapbook timeline layout`)
- Fix lint/type errors rather than suppressing rules

## Files Requiring Approval Before Changes

- Real personal photos, audio, or video files
- Final anniversary letter content (`src/content/letter.ts`)
- Deployment workflow (`.github/workflows/deploy.yml`)
- `DESIGN.md` design direction
- `AGENTS.md` governance file

## Reference Documents

- `DESIGN.md` — Full visual/interaction design spec (color tokens, typography, component specs, motion rules)
- `AGENTS.md` — Repository governance, testing guidelines, and content rules
- `docs/intro-media-guide.md` — (Korean) per-slot guide for the constellation intro media
