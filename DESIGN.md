# Design Specification

## Final Concept

The approved direction is **Gift Box Diary** — a mobile-first, static 100-day anniversary experience presented as an interactive gift that opens into a page-flip diary. The site is for Jay and 苙綺, centered on the first 100 days of a Korea-Taiwan long-distance relationship.

The experience should feel personal, romantic, warm, polished, and sophisticated. The interaction metaphor is: receive a gift → open it → discover a diary inside → read it page by page. The visual language uses sunflower illustrations, pressed flowers, paper textures, and warm tones.

## Interaction Model

The site uses a **page-flip book** interface, not vertical scrolling.

```text
[Phase 1: Gift Box]  →  [Phase 2: Book Reveal]  →  [Phase 3: Reading Mode]
Sunflower-illustrated     Diary rises from box       Single-sided page flip
cream box with bow        Title: 우리의 100일 일기    Swipe or tap to turn
Name tag: 苙綺에게        Pressed flower cover        One page at a time (mobile)
```

### Phase 1: Gift Box

- Cream-colored box (`#fff9ed`) with gold ribbon
- CSS-only sunflower illustration (petals `#f4be3a`, center `#3d2b1f`, leaves `#7e8a56`)
- Name tag (localized): 苙綺에게 / 給苙綺 / For Lichi
- Background: faded sunflower and leaf decorations
- Tap → lid opens with CSS 3D `rotateX` + particle burst

### Phase 2: Book Reveal

- Box fades out → diary bounces/scales into view
- Cover: kraft brown with localized title + CSS pressed flower
- Book title (localized): 우리의 100일 일기 / 我們的100天日記 / Our 100-Day Diary
- Left spine detail visible
- Tap → cover flips open → transition to reading mode

### Phase 3: Reading Mode

- **Single-sided stacked pages** (Safari-safe approach)
- Each page flips via `rotateY(-180deg)` with `transform-origin: left center`
- During rotation, hide back face with both standard and webkit prefix:
  ```css
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  ```
- After flip animation completes, remove the flipped page from the rendering layer and interaction targets (e.g., `visibility: hidden` or `pointer-events: none`)
- Do NOT rely on `backface-visibility` alone for content display — the page is single-sided and removed post-flip
- Perspective: `1200px`
- Page size adapts to viewport (`100dvh` based)
- Navigation: swipe left/right + tap page edges (40% zones) + arrow keys (desktop)
- Progress indicator at bottom — dynamically computed from active page array
- Page content padding: `32px 28px` minimum

### Page Flip Mechanics

**Forward flip (next page):**
1. Set `isFlipping = true`
2. Animate current page from `rotateY(0deg)` to `rotateY(-180deg)`
3. On `transitionend`: set `visibility: hidden` and `pointer-events: none` on the flipped page
4. Increment `currentIndex`
5. Set `isFlipping = false`

**Backward flip (previous page):**
1. Set `isFlipping = true`
2. Restore the previous page: set `visibility: visible` and `pointer-events: auto`
3. Animate previous page from `rotateY(-180deg)` to `rotateY(0deg)`
4. On `transitionend`: decrement `currentIndex`
5. Set `isFlipping = false`

**During any flip (`isFlipping === true`):**
- Ignore all additional tap and swipe inputs
- Prevent multiple pages from flipping simultaneously

### Transition Lock

Use an `isFlipping` state during page transitions. While `isFlipping` is true:
- Ignore additional tap and swipe inputs
- Prevent multiple pages from flipping simultaneously
- Reset `isFlipping` after the transition completes (listen for `transitionend`)

### Restart Behavior

The "처음부터 다시 보기" / "從頭再看一次" / "Read Again" button:
- Resets all pages to initial state
- Resets gift box to unopened state
- **Preserves the user's selected language**

### Progress Indicator

Progress is computed only from reading mode pages:
- Gift box phase: no progress shown
- Book cover phase: no progress shown
- First reading page (First 100 days intro): displays as `1 / N`
- Last reading page (Sunflower ending): displays as `N / N`

The gift box and book cover are NOT counted in the total page number or progress percentage.

## Localization

All user-facing text must be managed as `LocalizedText`. This includes:

- Gift box name tag
- Book cover title
- Section/chapter headings
- Progress indicator labels
- Navigation button labels
- Restart button text
- Accessibility labels (aria-label, alt text)

Korean is the approved source content. zh-TW and en are translations that preserve meaning and emotion. The default rendered language is zh-TW.

Examples:
- 苙綺에게 / 給苙綺 / For Lichi
- 우리의 100일 일기 / 我們的100天日記 / Our 100-Day Diary
- 처음부터 다시 보기 / 從頭再看一次 / Read Again

### Locale Key Convention

Use hyphenated BCP 47 tags as data keys to match browser locale identifiers directly. No separate mapping layer needed.

```ts
export type Locale = 'zh-TW' | 'ko' | 'en'

export type LocalizedText = {
  'zh-TW': string
  ko: string
  en: string
}
```

This eliminates ambiguity between browser locale strings (`zh-TW`) and data keys. Use `'zh-TW'` everywhere — in types, data files, runtime state, and URL parameters (if any).

## Core Content Facts

- Relationship start date: `2026-04-28`
- 100-day anniversary: `2026-08-05`
- Default language: `zh-TW`
- Supported languages: `zh-TW`, `ko`, `en`

## 1st Production Scope — Active Sections

The final page order:

1. First 100 days intro
2. Relationship timeline
3. Memory journey
4. Korea and Taiwan
5. Our future
6. Final written letter
7. Sunflower ending

## Deferred Features (Not in 1st Production)

These features are excluded from the current page count, navigation, and rendered output. No placeholder pages, "coming soon" text, or fabricated content should appear for these. Prepare only the type/flag structure for future activation.

```ts
export const features = {
  reasonsSection: false,
  situationalMessages: false,
  backgroundMusic: false,
  voiceLetter: false,
} as const
```

## Dynamic Page Computation

Do NOT hardcode page numbers, total page count, progress percentages, table of contents positions, or chapter start indices.

The page array must be dynamically generated at runtime by:
1. Reading the active feature flags
2. Collecting enabled content items from each section's data array
3. Computing total pages, chapter boundaries, and progress from the resulting array

**The page array is locale-independent.** Changing the language does NOT change the page IDs, page order, or total page count. Locale is used only at render time to select the appropriate string from `LocalizedText`.

```ts
function buildPageArray(features, content): BookPage[] {
  const pages: BookPage[] = []
  pages.push(introPage)
  pages.push(...timelinePages)  // always 6 (unless overflow-split)
  pages.push(...content.memories.filter(m => m.enabled))
  pages.push(...koreaAndTaiwanPages)  // always 2
  pages.push(...futureWishesPages)  // always 2
  pages.push(...content.letterPages)  // fixed page IDs
  pages.push(sunflowerEndingPage)
  return pages
}
// Total count, progress, chapter starts all derived from this array
// Locale is NOT a parameter — array is the same for all languages
```

## Chapter Headings

Do NOT add separate chapter cover pages in the 1st production version. Instead, display the chapter title at the top of each chapter's first content page.

If separate chapter cover pages are desired in the future, they must be explicitly added to the page mapping with their own page IDs.

## Page Mapping

Content is split into single-sided pages. No page internal scrolling — if content overflows, split into more pages. Keep page count consistent across all three languages.

| Section | Pages | Notes |
|---------|-------|-------|
| First 100 days intro | 1 | Dates + 3 confirmed stats |
| Relationship timeline | 6 | 1 milestone per page (6 milestones) |
| Memory journey | up to 10 | 1 page per enabled memory |
| Korea and Taiwan | 2 | Map/postcard + emotional text |
| Our future | 2 | 10 wishes on 2 pages |
| Final letter | 6–8 | Split by semantic paragraphs with fixed page IDs |
| Sunflower ending | 1 | Bloom animation + final message |

**Estimated total: 28–30 pages** (final count confirmed after 375×667 viewport testing with all three languages)

Timeline is fixed at 6 pages. Only increase if mobile viewport testing proves text does not fit within a single page for a given milestone.

### Overflow Split Rule

If any language's text overflows its page at the smallest test viewport (375×667), split that page into sub-pages for ALL three languages using consistent page IDs:

```text
timeline-05-a
timeline-05-b
```

Do NOT:
- Add pages for only one language
- Reduce font size or line height below the design minimum to force fit
- Truncate or abbreviate content

## Section Details

### First 100 Days Intro (1 page)

Display dates and a short emotional description. Use only confirmed stats:

- **100 DAYS**
- **2 COUNTRIES**
- **2026.04.28 → 2026.08.05**

Do not fabricate message counts, call counts, meetings count, or any unverified numbers.

Key text:
- 서로 다른 두 나라에서 같은 마음으로 함께한 첫 100일

### Relationship Timeline (6 pages)

The timeline summarizes how the relationship developed. It shows turning points, not a photo album. Use exactly these 6 milestones — do not add or replace events. Each milestone occupies exactly 1 page.

1. **우리의 이야기가 시작된 날** — 2026-01-31
   서로에게 아직 낯선 사람이었지만, 지금 돌아보면 우리의 이야기가 조용히 시작된 순간이었다.

2. **화면 속 네가 내 앞에 나타난 날** — 2026-02-21
   화면으로만 보던 苙綺를 처음 실제로 만난 날. 만나기 전에는 많이 긴장했지만, 막상 함께 있으니 생각보다 훨씬 편안했어. 화면으로 볼 때보다 더 내 스타일이었고, 환하게 웃으며 분위기를 밝게 만드는 苙綺의 모습이 특히 인상 깊었어.

3. **서로의 마음을 확인한 날** — 2026-04-28
   苙綺가 한국에서의 시간을 마치고 대만으로 돌아간 뒤, 떨어져 있는 동안 더 선명해진 마음을 솔직하게 전했고 우리는 연인이 되었어.

4. **기다림 끝에 다시 만난 우리** — 2026-05-22
   멀리 떨어져 지내는 동안 더욱 분명해진 마음을 직접 마주 보고 다시 전했던 순간. 기다렸던 시간만큼 반가움과 사랑이 더 크게 느껴졌어.
   *(연인이 된 뒤 처음 다시 만나 직접 마음을 전한 재회의 날)*

5. **이번에는 내가 너에게로 간 날** — 2026-06-26
   그동안 화면 너머로만 듣고 상상했던 苙綺의 나라인 대만에 내가 직접 찾아간 날. 낯선 거리와 풍경도 苙綺와 함께 있으니 특별하게 느껴졌고, 네가 살아온 곳과 일상을 조금 더 가까이 알게 되어 기뻤어. 한국에서 나를 만나러 와준 너처럼, 이번에는 내가 너에게 갈 수 있다는 사실이 정말 설레고 행복했어.

6. **우리의 첫 번째 기념일** — 2026-08-05
   보고 싶을 때 바로 만날 수 없는 거리 속에서도 서로를 믿고 기다리며 도착한 첫 100일. 지금까지의 추억을 돌아보고 앞으로 함께할 시간을 약속하는 날.

### Memory Journey (up to 10 pages)

Memories show specific scenes and emotions from real photos, not relationship milestones. Each enabled memory gets 1 page with photo(s) and a short emotional caption.

Each memory item includes an `enabled` field. Only items with `enabled: true` are rendered in the page array. Items remain in data for future activation when photos are confirmed.

1. 처음 함께 찍은 사진 — 화면 속에서만 보던 우리가 처음 같은 사진 안에 담긴 순간. 사진을 볼 때마다 처음 만났던 날의 긴장과 설렘이 다시 생각나.
2. 처음 함께 먹었던 식사 — 무엇을 먹었는지보다 苙綺와 마주 앉아 같은 시간을 보내고 있다는 사실이 더 특별했던 기억.
3. 함께 걸었던 첫 번째 거리 — 특별한 목적지가 없어도, 함께 걷고 이야기하는 것만으로 시간이 빠르게 지나갔던 순간.
4. 환하게 웃던 너의 모습 — 주변 분위기까지 밝게 만드는 苙綺의 웃는 모습이 오래도록 기억에 남았던 순간.
5. 한국에서 함께 보낸 평범한 하루 — 거창한 이벤트가 없어도 함께 밥을 먹고, 걷고, 이야기하는 평범한 하루가 얼마나 행복한지 알게 된 시간.
6. 멀리 있어도 함께했던 밤 — 한국과 대만에 떨어져 있었지만, 전화와 영상통화로 서로의 하루를 나누며 가장 가까이 있다고 느꼈던 밤들.
7. 다시 만난 날의 반가움 — 사진 속 표정과 분위기에 집중. 타임라인의 5월 22일 설명을 반복하지 않고, 재회 순간의 감정과 표정을 묘사.
8. 대만에서 함께 걸었던 거리 — 나에게는 낯선 장소였지만 苙綺와 함께여서 편안했고, 네가 살아가는 세상에 조금 더 가까워졌다고 느꼈던 순간.
9. 대만에서 함께 먹고 웃었던 시간 — 새로운 음식과 풍경보다, 같은 테이블에서 함께 웃고 이야기했던 시간이 더 기억에 남은 순간.
10. 다음 만남을 약속했던 순간 — 다시 멀어져야 하는 아쉬움 속에서도, 다음에는 어디에서 무엇을 함께할지 이야기하며 기다림을 약속했던 순간.

### Korea and Taiwan (2 pages)

**Page 1:** Postcard or paper-map style
- 한국의 Jay, 대만의 苙綺
- Two points connected by a line
- Optional paper airplane or flight path

**Page 2:** Emotional text
- 우리 사이에는 바다와 긴 거리가 있지만, 매일 서로의 하루를 나누는 마음만큼은 언제나 가까이 이어져 있어.
- Do not fabricate distance numbers without confirmed data.

### Our Future (2 pages)

Static checklist or postcard grid. Draft items (may be finalized later):

1. 한국에서 한 달 동안 함께 살아보기
2. 에버랜드 함께 가기
3. 대만의 새로운 도시 여행하기
4. 함께 요리하기
5. 벚꽃 함께 보기
6. 크리스마스 함께 보내기
7. 200일 함께 축하하기
8. 첫 번째 1주년 함께 축하하기
9. 특별한 계획 없이 평범한 하루 함께 보내기
10. 더 이상 다음 만남을 오래 기다리지 않아도 되는 미래 만들기

### Final Letter (6–8 pages, confirmed after viewport testing)

The full Korean letter text is stored in `src/content/letter.ts` with fixed page IDs. The letter is NOT stored as a single string for runtime auto-splitting. Each page has a stable identifier that maps to the same content position across all three languages.

The approved Korean source text must be included in full — no summarization or placeholder substitution. The initial split is 6–8 semantic page IDs. Final page count is confirmed after testing all three languages at 375×667 viewport. All languages share identical page IDs and page count.

```ts
// Structure
export interface LetterPage {
  id: string  // e.g., 'letter-1', 'letter-2', ...
  content: LocalizedText
}

export const letterPages: LetterPage[] = [
  { id: 'letter-1', content: { 'zh-TW': '...', ko: '...', en: '...' } },
  { id: 'letter-2', content: { 'zh-TW': '...', ko: '...', en: '...' } },
  // ...
]
```

Rules:
- Do not abbreviate or paraphrase without approval
- Do not alter sentence meaning
- zh-TW and en are managed as separate localized data
- Translations must preserve the emotion and meaning of the Korean source
- Page count must remain identical across all languages (same page IDs)
- Split by semantic paragraphs — text must not be clipped on small mobile screens
- Use generous spacing and serif typography for a calm reading experience
- If overflow occurs at 375×667, split the overflowing page into sub-pages (e.g., `letter-3-a`, `letter-3-b`) for ALL languages

### Sunflower Ending (1 page)

Final message (localized):
```
해바라기가 언제나 해를 바라보듯,
내 마음도 언제나 苙綺를 향하고 있어.

우리의 첫 100일을 진심으로 축하해.
사랑해.
```

Presentation:
- Quiet paper background
- Light gradually appears
- Sunflower grows or petals open (CSS animation)
- Final message fades in
- Restart button (localized)

Accessibility:
- `prefers-reduced-motion`: replace growth animation with a soft fade transition or display the completed sunflower image from the start.

## Event Priority and Navigation Lock

Page-edge taps and swipes are the primary navigation mechanism. Other interactive elements (photo overlays, language switcher, buttons, card interactions) must not conflict with page navigation.

### Priority Rules

1. **Interactive elements inside page content** (buttons, photo taps, language switcher) take priority within their own hit area. These elements must use `stopPropagation()` to prevent the event from reaching page navigation zones.
2. **Page navigation zones** (left/right 40% edge taps, horizontal swipes) only respond when the event is not captured by a higher-priority element.
3. **Photo enlarge overlays** or any modal-like layer: while open, page navigation is completely disabled (both tap zones and swipe). Dismiss the overlay first to resume navigation.
4. **Language switcher**: positioned outside the page flip container or uses `stopPropagation()` so language changes never trigger accidental page flips.

### Navigation Lock Policy

```ts
// Pseudo-logic
if (overlay.isOpen) → ignore all page navigation input
if (isFlipping) → ignore all page navigation input
if (event.target is interactive element) → handle element, do not flip
else → handle as page navigation
```

## Color Tokens

Use warm, restrained colors. Avoid making the interface look childish or overly decorative.

```css
--color-paper: #f7eedc;
--color-ivory: #fff9ed;
--color-ink: #3d2b1f;
--color-muted: #7c6652;
--color-film: #d8be91;
--color-rose: #c9827f;
--color-sunflower: #f4be3a;
--color-leaf: #7e8a56;
--color-line: rgba(61, 43, 31, 0.18);
--shadow-paper: 0 18px 42px rgba(61, 43, 31, 0.14);
```

## Typography

Download at most **two web font families**:
- **Pretendard** — body text (ko, en, fallback for zh-TW)
- **Noto Serif TC** — display headings, emotional text, letter pages

All other fonts use system fallback only:
- Body fallback: system sans-serif
- Display fallback: Georgia, serif

Rules:
- Do not use tiny decorative handwriting for important content.
- Maintain comfortable line height: `1.6` to `1.8` for body text; `2.0`+ for letter pages.
- Do not scale font sizes directly with viewport width.

## Spacing

- Page content padding: `32px 28px` minimum on mobile
- Card padding: `16px-22px`
- Minimum touch target: `44px`
- Cards use `8px` border radius or less

## Photo Rules

During development, use placeholders only. Production photos should be optimized before committing:

- Prefer WebP or AVIF.
- Target `100-300KB` per common photo when practical.
- Remove EXIF metadata.
- Use non-descriptive filenames such as `memory-01.webp`.
- Only load images for the current page and immediately adjacent pages (preload ±1).
- Use thumbnails for in-page display; larger versions can open in an HTML overlay.

## Motion Rules

Motion should feel tactile and gentle:

- Prefer CSS transitions for box opening, page flip, flower bloom, and card reveal.
- Use GSAP only if sequencing becomes difficult with CSS.
- Page flip: `0.6-0.8s` transition with ease or cubic-bezier for physical feel.
- Gift box lid: spring-like cubic-bezier easing.
- Avoid autoplay audio.
- Support `prefers-reduced-motion`; reduced mode replaces all movement with simple fades or instant state changes.

## 3D Usage Boundaries

Do not use Three.js in the first production pass. CSS 3D is sufficient for the gift box lid and page flip.

Page flip approach (Safari-safe):
- Single-sided stacked pages
- `rotateY(-180deg)` with `transform-origin: left center`
- `perspective: 1200px` on container
- Use `backface-visibility: hidden` and `-webkit-backface-visibility: hidden` during rotation to prevent back-face exposure
- After flip completes: remove flipped page from render layer (`visibility: hidden`) and interaction targets (`pointer-events: none`)
- Do NOT rely solely on `backface-visibility` for content visibility logic
- Minimal GPU layers (2-3 active at a time)
- Avoid deeply nested `transform-style: preserve-3d`

If Three.js is later approved:
- Use it only for selected high-impact scenes.
- Keep one animation loop.
- Cap renderer pixel ratio at `1.5`.
- Provide non-WebGL fallback content.

## Responsive Behavior

Primary test sizes:

- `375 x 667`
- `390 x 844`
- `430 x 932`

Requirements:

- Page size adapts to viewport height (`100dvh` with fallback).
- No horizontal scrolling.
- No page internal vertical scrolling — split content into more pages instead.
- Respect safe-area insets.
- Touch interactions must not depend on hover.
- Text must remain readable in Korean, Traditional Chinese, and English.
- Wide screens (tablet+): may show spread view (two pages) in the future, but 1st production targets single-page mobile view only.

## Accessibility Rules

- Use semantic HTML sections, headings, buttons, and dialogs.
- Every interactive control needs a descriptive label.
- Provide visible focus states.
- Do not communicate important information only through animation or color.
- Maintain sufficient contrast between ink text and paper backgrounds.
- Provide text alternatives for all meaningful images and media.
- Page navigation must be operable via keyboard (arrow keys).

## Privacy Rules

GitHub Pages is publicly accessible and does not provide real access control. Do not add fake frontend-only authentication.

Production should include:

- `noindex`, `nofollow`, `noarchive`
- restrictive `robots.txt`
- optimized media with EXIF removed
- no real addresses
- no private chat screenshots unless explicitly approved

## Performance Budget

Mobile stability is more important than visual complexity.

| Metric | Target |
|--------|--------|
| Initial download (HTML + CSS + JS + critical fonts) | ≤ 2–3 MB |
| Total image assets (all photos combined) | 15–25 MB recommended |
| Absolute asset ceiling | 50 MB (hard limit) |
| Simultaneously loaded images | Current page ± 1 adjacent pages only |

Additional rules:
- Lazy load all images not on the current or adjacent pages.
- Stop or reduce animation when the page/tab is hidden.
- Keep all production phases buildable and testable.
- Limit simultaneously active CSS 3D layers to 2-3.

## Content Architecture

Keep content out of Vue components. Use typed data files:

```text
src/content/timeline.ts
src/content/memories.ts
src/content/futurePlans.ts
src/content/letter.ts          (fixed page IDs, full approved text, not auto-split)
src/content/features.ts        (feature flags for deferred sections)
src/content/localization.ts    (Locale type + getLocalizedText utility)
src/content/anniversary.ts     (start date, 100th day)
```

### Locale Type

```ts
export type Locale = 'zh-TW' | 'ko' | 'en'

export type LocalizedText = {
  'zh-TW': string
  ko: string
  en: string
}

export function getLocalizedText(text: LocalizedText, locale: Locale): string {
  return text[locale] || text['zh-TW']
}
```

### Letter Data Structure

```ts
export interface LetterPage {
  id: string  // stable page ID: 'letter-1', 'letter-2', etc.
  content: LocalizedText
}

export const letterPages: LetterPage[] = [
  // Each entry = 1 rendered page
  // Same page IDs and count across zh-TW, ko, en
  // Full approved Korean text included — no summarization
]
```

### Memory Data Structure

```ts
export interface MemoryImage {
  id: string
  src: string           // production image path
  thumbnailSrc?: string // smaller version for in-page display
  alt: LocalizedText    // accessible alt text per language
}

export interface MemoryItem {
  id: string
  enabled: boolean           // only render if true
  title: LocalizedText
  description: LocalizedText
  images: MemoryImage[]      // 1–3 images per memory
  date?: string              // optional, e.g., '2026-05-10'
  location?: LocalizedText   // optional place name
  layout?: 'single' | 'stacked' | 'collage'  // visual arrangement
  placeholderHint?: string   // dev-only hint for placeholder images
}
```

### Page Array Generation

```ts
interface BookPage {
  id: string
  section: string
  // ... render data
}

function buildPageArray(features: Features, content: Content): BookPage[] {
  const pages: BookPage[] = []
  pages.push(introPage)
  pages.push(...timelinePages)  // always 6 (unless overflow-split)
  pages.push(...content.memories.filter(m => m.enabled).map(toPage))
  pages.push(...koreaAndTaiwanPages)  // always 2
  pages.push(...futureWishesPages)    // always 2
  pages.push(...content.letterPages.map(toPage))  // fixed page IDs
  pages.push(sunflowerEndingPage)
  return pages
}

// locale is NOT a parameter
// Changing language does not change page IDs, order, or count
// locale is used only at render time: getLocalizedText(page.content, locale)
```
