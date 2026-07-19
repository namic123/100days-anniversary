# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A mobile-first interactive 100-day anniversary website for a Korea-Taiwan long-distance relationship. The approved design direction is "Warm Interactive Polaroid Scrapbook." This is a personal, emotional experience — not a commercial product or portfolio piece.

Key dates: relationship start `2026-04-28`, 100-day anniversary `2026-08-05`. Default language is Traditional Chinese (zh-TW), with Korean (ko) and English (en) also supported.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build (outputs to dist/)
npm run preview      # Preview production build locally
npm run lint         # ESLint (flat config)
npm run typecheck    # vue-tsc --build --force
npm run test         # Vitest unit tests (jsdom environment)
npm run test:e2e     # Build + Playwright E2E tests (mobile viewport 390x844)
```

Requires Node >= 22. CI runs: lint → typecheck → test → e2e → build → deploy to GitHub Pages.

## Architecture

Single-page Vue 3 app (Composition API + TypeScript) built with Vite. No Vue Router — single scroll-based experience. Fully static with no backend.

**Source layout:**
- `src/content/` — Typed data files (timeline, localization, dates). Large personal content lives here, not in Vue templates.
- `src/components/` — Vue UI components (PascalCase.vue)
- `src/composables/` — Composition API helpers (useThing.ts)
- `src/styles/main.css` — CSS custom properties (design tokens) and global styles
- `public/` — Static files (robots.txt, .nojekyll)
- `tests/` — Vitest unit tests
- `e2e/` — Playwright E2E tests
- `design-lab/` — Isolated design prototypes (not part of production build)

**Content/localization pattern:**
```ts
type LocalizedText = { ko: string; zhTW: string; en: string }
```
Use `getLocalizedText(text, locale)` from `src/content/localization.ts` for language selection.

**Path alias:** `@/` maps to `./src/` (configured in vite.config.ts and tsconfig.app.json).

**Build base URL:** Defaults to `./` for GitHub Pages; override with `GITHUB_PAGES_BASE` env var if needed.

## Key Constraints

- **Static only** — no backend, database, API server, analytics collecting personal data, or user-generated content
- **Mobile-first** — primary viewports: 375x667, 390x844, 430x932. No horizontal scrolling. Min touch target 44px.
- **CSS transitions preferred** — no Three.js in first production pass unless explicitly approved
- **Touch interactions** — do not rely on hover
- **Privacy** — noindex/nofollow/noarchive meta, restrictive robots.txt. Remove EXIF from photos. Use non-descriptive filenames (e.g., `memory-01.webp`).
- **Performance** — total assets < 50MB, photos 100-300KB, lazy load media
- **Accessibility** — semantic HTML, visible focus states, `prefers-reduced-motion` support, sufficient contrast, 100dvh with fallback

## Style Conventions

- 2-space indentation for Vue, TypeScript, CSS, JSON, YAML
- Components: `PascalCase.vue`; composables: `useThing.ts`; content files: `camelCase.ts`
- Short imperative commit messages (e.g., `Add scrapbook timeline layout`)
- Use placeholder content until real media/letters are explicitly provided

## Files Requiring Approval Before Changes

- Real personal photos, audio, or video files
- Final anniversary letter content
- Deployment workflow (`.github/workflows/deploy.yml`)
- `DESIGN.md` design direction
- `AGENTS.md` governance file

## Reference Documents

- `DESIGN.md` — Full visual/interaction design spec (color tokens, typography, component specs, motion rules)
- `AGENTS.md` — Repository governance, testing guidelines, and content rules
