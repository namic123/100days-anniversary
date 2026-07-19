# Repository Guidelines

## Project Purpose

This repository is for a mobile-first interactive 100-day anniversary website for Jay and 苙綺. The experience should feel like a warm, polished scrapbook telling the story of a Korea-Taiwan long-distance relationship. It is personal and emotional, not a commercial product, portfolio, or generic landing page.

Do not begin full production implementation until `DESIGN.md` and this file are reviewed and approved.

## Technology Stack

Production must use:

- Vue 3, Vite, TypeScript, and Composition API
- Vitest for unit and component tests
- Playwright for critical E2E flows
- GitHub Actions and GitHub Pages

The site must remain fully static. Do not add a backend, database, login, API server, admin page, analytics that collect personal data, or user-generated content.

## Project Structure & Module Organization

Expected production layout:

```text
src/components/     Vue UI components
src/content/        Typed story data and localized copy
src/composables/    Small reusable Composition API helpers
src/styles/         Tokens, base CSS, and shared utilities
src/assets/         Imported static assets
public/             Static files copied as-is, including robots.txt
tests/              Vitest tests when not colocated
e2e/                Playwright tests
design-lab/         Lightweight design prototypes only
```

Keep large personal content out of Vue components. Use typed files such as `timeline.ts`, `memories.ts`, `reasons.ts`, `futurePlans.ts`, `situationalMessages.ts`, and `letters.ts`.

## Content & Localization Rules

Default language is Traditional Chinese (`zh-TW`). Korean and English must also be supported. User-facing text should use:

```ts
type LocalizedText = {
  ko: string
  zhTW: string
  en: string
}
```

Current fixed dates:

- Relationship start: `2026-04-28`
- 100-day anniversary: `2026-08-05`

Use placeholder photos and messages until real content is explicitly provided. Do not use private chat screenshots, real addresses, or descriptive media filenames.

## Build, Test, and Development Commands

After Phase 1 setup, the project should support:

```bash
npm run dev          # Start local development
npm run lint         # Run lint checks
npm run typecheck    # Run TypeScript checks
npm run test         # Run Vitest
npm run test:e2e     # Run Playwright
npm run build        # Build for GitHub Pages
```

Do not report a phase complete if required commands fail. Fix confirmed errors instead of suppressing lint or TypeScript rules.

## Coding Style & Naming Conventions

Use TypeScript and Vue Composition API. Prefer small, focused components and typed props. Use 2-space indentation for Vue, TypeScript, CSS, JSON, and YAML.

Naming conventions:

- Components: `PascalCase.vue`
- Composables: `useThing.ts`
- Content files: `camelCase.ts`
- Assets: non-descriptive `kebab-case`, such as `memory-01.webp`
- Types: `PascalCase`

Follow existing project patterns once the app is initialized. Avoid premature abstractions and unnecessary dependencies.

## Design & Interaction Rules

Follow `DESIGN.md`. The approved direction is **Warm Interactive Polaroid Scrapbook**.

Use semantic HTML first. Prefer CSS transitions for envelope opening, card reveals, flower interactions, and paper motion. Do not use Three.js in the first production pass unless explicitly approved. If Three.js is later added, isolate it from regular content components and keep one animation loop.

All interactions must work by touch. Do not rely on hover.

## Mobile, Performance & Accessibility

Primary target viewports:

- `375 x 667`
- `390 x 844`
- `430 x 932`

Rules:

- No horizontal scrolling
- Minimum touch target `44px`
- Support safe-area insets
- Use `100dvh` with fallback
- Support `prefers-reduced-motion`
- Lazy load photos and media
- Keep production assets under about `50MB`
- Keep photos around `100-300KB` where practical
- Remove EXIF metadata before production

Accessibility requirements include semantic headings, visible focus states, descriptive button labels, sufficient contrast, text alternatives, and subtitles or transcripts if audio/video is later added.

## GitHub Pages Constraints

Use a single-page structure and avoid Vue Router unless clearly justified. Vite currently defaults `base` to `./` so built assets work from a GitHub Pages repository subpath; override with `GITHUB_PAGES_BASE` only if a fixed absolute subpath is required. Use `import.meta.env.BASE_URL` for asset paths when needed.

Add `noindex`, `nofollow`, `noarchive`, and a restrictive `robots.txt`, while clearly treating GitHub Pages as public hosting with no real access control.

## Testing Guidelines

Add tests for content helpers, date calculations, localization behavior, interactive components, and critical navigation states. Critical E2E flow:

1. Open the website
2. Open the letter
3. Navigate or scroll through the story
4. Open a memory
5. Reveal a reason
6. Reach the sunflower ending
7. Verify no fatal console errors

Audio/video steps should be added only after that feature is approved.

## Commit & Pull Request Guidelines

This directory is not currently recognized as a valid Git repository, so no history-based convention was available. Use short imperative commit messages once Git is configured, for example `Add scrapbook timeline layout`.

Pull requests should include a concise summary, screenshots for visual changes, tested viewport sizes, commands run, and remaining risks.

## Files Requiring Approval

Do not change these without explicit approval:

- Real personal photos, audio, or video files
- Final anniversary letter content
- Deployment workflow behavior
- `DESIGN.md` design direction
- This `AGENTS.md` governance file

Keep `design-lab/` separate from production implementation.
