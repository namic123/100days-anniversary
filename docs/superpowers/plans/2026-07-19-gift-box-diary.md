# Gift Box Diary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing scroll-based anniversary site with a Gift Box → Book → 3D Page-Flip diary experience.

**Architecture:** Vue 3 single-page app with three interaction phases: gift box opening (CSS 3D), book reveal (transition), and page-flip reading mode (CSS `rotateY` with stacked single-sided pages). All content lives in typed data files under `src/content/`. A `useBookEngine` composable manages page array generation, navigation state, and flip transitions. Section-specific Vue components render individual page types.

**Tech Stack:** Vue 3 (Composition API), TypeScript 5.8, Vite 7, Vitest 3.2, Playwright 1.54, CSS 3D transforms, Pretendard + Noto Serif TC web fonts.

## Global Constraints

- Node >= 22, npm
- No Vue Router, no backend, no Three.js
- 2-space indentation for Vue, TypeScript, CSS, JSON, YAML
- Components: `PascalCase.vue`; composables: `useThing.ts`; content: `camelCase.ts`
- Locale keys: `'zh-TW' | 'ko' | 'en'` (BCP 47 hyphenated)
- Default language: `zh-TW`
- Korean is approved source text; zh-TW and en are translations
- Web fonts: max 2 families (Pretendard, Noto Serif TC)
- All user-facing text: `LocalizedText`
- No hardcoded page numbers/totals — dynamic from `buildPageArray()`
- Initial download ≤ 2–3 MB; total images 15–25 MB; absolute cap 50 MB
- Primary viewports: 375×667, 390×844, 430×932
- `npm run lint`, `npm run typecheck`, `npm run test` must pass after every task

---

### Task 1: Migrate Locale Keys from `zhTW` to `'zh-TW'`

**Files:**
- Modify: `src/content/localization.ts`
- Modify: `src/content/timeline.ts`
- Modify: `src/content/anniversary.ts`
- Modify: `src/App.vue`
- Modify: `tests/localization.test.ts`
- Modify: `e2e/smoke.spec.ts`

**Interfaces:**
- Produces: `Locale = 'zh-TW' | 'ko' | 'en'`, `LocalizedText = { 'zh-TW': string; ko: string; en: string }`, `getLocalizedText(text: LocalizedText, locale: Locale): string`

- [ ] **Step 1: Update the localization test**

```ts
// tests/localization.test.ts
import { describe, expect, it } from 'vitest'

import { getLocalizedText } from '@/content/localization'

describe('getLocalizedText', () => {
  it('returns text for the selected locale', () => {
    expect(
      getLocalizedText(
        {
          'zh-TW': '繁體中文',
          ko: '한국어',
          en: 'English',
        },
        'ko',
      ),
    ).toBe('한국어')
  })

  it('falls back to zh-TW for unknown locale', () => {
    expect(
      getLocalizedText(
        {
          'zh-TW': '繁體中文',
          ko: '한국어',
          en: 'English',
        },
        'zh-TW',
      ),
    ).toBe('繁體中文')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run`
Expected: FAIL — `LocalizedText` still uses `zhTW` key

- [ ] **Step 3: Update `src/content/localization.ts`**

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

- [ ] **Step 4: Update `src/content/timeline.ts` — replace all `zhTW:` keys with `'zh-TW':`**

Replace every `zhTW:` property key with `'zh-TW':` in the timeline data. Update the `description` for milestone 3 (`became-couple`) to the corrected text:

```ts
description: {
  'zh-TW': '苙綺結束在韓國的時間回到台灣後，在分開的日子裡，我的心意變得更加清晰，於是我坦誠地告訴了她，我們成為了戀人。',
  ko: '苙綺가 한국에서의 시간을 마치고 대만으로 돌아간 뒤, 떨어져 있는 동안 더 선명해진 마음을 솔직하게 전했고 우리는 연인이 되었어.',
  en: 'After 苙綺 finished her time in Korea and returned to Taiwan, the distance only made my feelings clearer. I honestly shared my heart, and we became a couple.',
},
```

Add the 3 new milestones (IDs: `reunion`, `visited-taiwan`, `100th-day`) with the approved content from DESIGN.md.

- [ ] **Step 5: Update `src/App.vue` — replace all `zhTW` with `'zh-TW'` in inline LocalizedText objects, change default locale from `'zhTW'` to `'zh-TW'`**

```ts
const locale = ref<Locale>('zh-TW')
```

And all inline objects like:
```ts
{ 'zh-TW': '寫給苙綺的100天紀錄', ko: '苙綺에게 보내는 100일의 기록', en: 'A 100-day record for 苙綺' }
```

- [ ] **Step 6: Update E2E test — the page still needs to load and show Chinese heading by default**

The E2E test references heading text that will change in later tasks. For now, just ensure it doesn't reference `zhTW` as a button value. The button labels (`繁中`, `한국어`, `EN`) in App.vue stay the same for now.

- [ ] **Step 7: Run all checks**

Run: `npm run lint && npm run typecheck && npm run test -- --run`
Expected: all pass

- [ ] **Step 8: Commit**

```bash
git add src/content/localization.ts src/content/timeline.ts src/content/anniversary.ts src/App.vue tests/localization.test.ts e2e/smoke.spec.ts
git commit -m "Migrate locale keys from zhTW to zh-TW (BCP 47)"
```

---

### Task 2: Content Data Layer — Features, Letter, Memories, Future Plans

**Files:**
- Create: `src/content/features.ts`
- Create: `src/content/letter.ts`
- Create: `src/content/memories.ts`
- Create: `src/content/futurePlans.ts`
- Create: `src/content/ui.ts`
- Create: `tests/content.test.ts`

**Interfaces:**
- Consumes: `LocalizedText`, `Locale` from `src/content/localization.ts`
- Produces: `Features` type, `features` const, `LetterPage` interface, `letterPages` array, `MemoryImage` interface, `MemoryItem` interface, `memories` array, `FutureWish` interface, `futureWishes` array, `uiText` record of `LocalizedText`

- [ ] **Step 1: Write tests for content data integrity**

```ts
// tests/content.test.ts
import { describe, expect, it } from 'vitest'

import { features } from '@/content/features'
import { letterPages } from '@/content/letter'
import { memories } from '@/content/memories'
import { futureWishes } from '@/content/futurePlans'
import { uiText } from '@/content/ui'

describe('features', () => {
  it('has all deferred features set to false', () => {
    expect(features.reasonsSection).toBe(false)
    expect(features.situationalMessages).toBe(false)
    expect(features.backgroundMusic).toBe(false)
    expect(features.voiceLetter).toBe(false)
  })
})

describe('letterPages', () => {
  it('has at least 6 pages with unique IDs', () => {
    expect(letterPages.length).toBeGreaterThanOrEqual(6)
    const ids = letterPages.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every page has all three language keys', () => {
    for (const page of letterPages) {
      expect(page.content['zh-TW']).toBeTruthy()
      expect(page.content.ko).toBeTruthy()
      expect(page.content.en).toBeTruthy()
    }
  })
})

describe('memories', () => {
  it('has 10 items each with an enabled field', () => {
    expect(memories).toHaveLength(10)
    for (const m of memories) {
      expect(typeof m.enabled).toBe('boolean')
      expect(m.images).toBeDefined()
    }
  })
})

describe('futureWishes', () => {
  it('has 10 items', () => {
    expect(futureWishes).toHaveLength(10)
  })
})

describe('uiText', () => {
  it('has localized restart button text', () => {
    expect(uiText.restart.ko).toBe('처음부터 다시 보기')
    expect(uiText.restart['zh-TW']).toBe('從頭再看一次')
    expect(uiText.restart.en).toBe('Read Again')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run`
Expected: FAIL — modules do not exist

- [ ] **Step 3: Create `src/content/features.ts`**

```ts
export const features = {
  reasonsSection: false,
  situationalMessages: false,
  backgroundMusic: false,
  voiceLetter: false,
} as const

export type Features = typeof features
```

- [ ] **Step 4: Create `src/content/ui.ts`**

```ts
import type { LocalizedText } from './localization'

export const uiText: Record<string, LocalizedText> = {
  nameTag: {
    'zh-TW': '給苙綺',
    ko: '苙綺에게',
    en: 'For Lichi',
  },
  bookTitle: {
    'zh-TW': '我們的100天日記',
    ko: '우리의 100일 일기',
    en: 'Our 100-Day Diary',
  },
  restart: {
    'zh-TW': '從頭再看一次',
    ko: '처음부터 다시 보기',
    en: 'Read Again',
  },
  tapToOpen: {
    'zh-TW': '輕觸打開',
    ko: '탭하여 열어보세요',
    en: 'Tap to open',
  },
  swipeHint: {
    'zh-TW': '左右滑動或輕觸翻頁',
    ko: '좌우를 탭하여 넘기세요',
    en: 'Swipe or tap to turn pages',
  },
}
```

- [ ] **Step 5: Create `src/content/letter.ts` with full approved Korean text**

Create the file with 7 `LetterPage` entries split by semantic paragraphs. Include the FULL approved Korean text (no summarization). zh-TW and en placeholders for now (marked with `'[Translation pending]'`).

```ts
import type { LocalizedText } from './localization'

export interface LetterPage {
  id: string
  content: LocalizedText
}

export const letterPages: LetterPage[] = [
  {
    id: 'letter-1',
    content: {
      ko: '사랑하는 苙綺에게.\n\n우리가 처음 서로를 알게 되었을 때는, 苙綺가 내 하루에서 이렇게 큰 존재가 될 거라고는 생각하지 못했어.\n\n처음에는 서로 다른 나라에서 살아가는 두 사람이었고, 사용하는 언어도 익숙한 문화도 조금씩 달랐지. 하지만 이상하게도 苙綺와 대화하는 시간은 늘 편안했고, 대화가 끝난 뒤에도 네 생각이 계속 남았어.\n\n그렇게 조금씩 너를 궁금해하고 기다리게 되면서, 어느 순간부터 너는 내가 가장 만나고 싶은 사람이 되어 있었어.',
      'zh-TW': '[Translation pending]',
      en: '[Translation pending]',
    },
  },
  {
    id: 'letter-2',
    content: {
      ko: '처음 실제로 만났던 날도 아직 선명하게 기억나. 하늘색 셔츠 안에 흰 티를 입고, 청치마와 검은색 신발을 신은 苙綺가 내 앞에 나타났을 때, 화면으로만 보던 너를 정말 만났다는 사실이 신기했어.\n\n처음에는 조금 긴장했지만, 잘 웃고 밝은 네 모습을 보면서 금방 편안해졌어. 밝게 웃다가도 가끔 수줍어하는 모습이 있었고, 생각하지 못했던 엉뚱한 제안을 할 때는 귀엽고 재미있었어. 무엇보다 내가 좋아하는 귀여운 얼굴로 웃는 네 모습이 정말 좋았어. 함께 걷고 이야기하고 밥을 먹는 동안, 처음 만난 사람이라는 것이 이상할 정도로 자연스럽고 편안했어.',
      'zh-TW': '[Translation pending]',
      en: '[Translation pending]',
    },
  },
  {
    id: 'letter-3',
    content: {
      ko: '첫 만남을 마치고 네가 다시 대만으로 돌아간 뒤에도 나는 자주 그날을 떠올렸어. 그리고 얼마 후 네가 다시 한국에 놀러 왔을 때, 우리는 또 함께 시간을 보냈지.\n\n처음 만났을 때도 좋았지만, 다시 만났을 때는 내 마음이 전보다 더 분명해지고 있다는 걸 느꼈어. 함께 있는 시간은 늘 빠르게 지나갔고, 네가 돌아갈 시간이 가까워질수록 아쉬운 마음도 점점 커졌어.\n\n네가 다시 대만으로 떠나던 날, 나는 이상하게도 한 가지를 확실히 알 수 있었어.\n\n앞으로 내가 苙綺를 정말 많이 그리워하게 될 거라는 것.',
      'zh-TW': '[Translation pending]',
      en: '[Translation pending]',
    },
  },
  {
    id: 'letter-4',
    content: {
      ko: '그때는 아직 내 마음을 제대로 말하지 못했지만, 네가 대만으로 돌아간 뒤 빈자리가 생각보다 크게 느껴졌어. 평소처럼 하루를 보내고 있어도 계속 네가 생각났고, 함께했던 시간들을 다시 떠올리게 되었어. 그제야 나는 이 마음을 그냥 지나가게 두고 싶지 않다는 걸 알았어.\n\n그리고 2026년 4월 28일, 대만에 있는 너에게 내 마음을 고백했지.\n\n직접 네 앞에서 말하지 못했다는 아쉬움은 있었지만, 더 늦기 전에 솔직하게 이야기하고 싶었어. 네가 좋고, 앞으로도 계속 만나고 싶고, 멀리 떨어져 있더라도 함께해보고 싶다고.\n\n그렇게 우리는 서로의 마음을 확인하고 연인이 되었어.',
      'zh-TW': '[Translation pending]',
      en: '[Translation pending]',
    },
  },
  {
    id: 'letter-5',
    content: {
      ko: '기쁘면서도 동시에 우리가 다시 먼 거리에서 시작해야 한다는 사실이 걱정되기도 했어. 그래도 그때부터 나는 분명하게 알게 되었어. 거리가 멀다는 이유로 포기하고 싶은 사람이 아니라, 그 거리를 견디면서도 계속 함께하고 싶은 사람이 바로 苙綺라는 것을.\n\n장거리 연애는 생각보다 쉽지 않았어.\n\n보고 싶을 때 바로 볼 수 없고, 안아주고 싶을 때 안아줄 수 없고, 서로에게 힘든 일이 있어도 화면 너머에서 위로해야 할 때가 있었지. 때로는 서로 다른 언어 때문에 내 마음을 충분히 전달하지 못한 것 같아 답답하기도 했어.\n\n하지만 그런 시간 덕분에 오히려 내 마음은 더 분명해졌어.\n\n처음 苙綺를 좋아했던 마음도 소중하지만, 기다리고 그리워하고 다시 만나면서 지금의 마음은 그때보다 훨씬 깊어졌어. 가까이 있을 때만 좋은 사람이 아니라, 멀리 떨어져 있어도 계속 생각나고 하루를 나누고 싶은 사람이라는 것을 알게 되었어.',
      'zh-TW': '[Translation pending]',
      en: '[Translation pending]',
    },
  },
  {
    id: 'letter-6',
    content: {
      ko: '우리의 첫 100일 동안 나에게 많은 행복을 줘서 고마워.\n\n내 이야기를 들어줘서 고맙고, 멀리서도 나를 믿어줘서 고맙고, 매일 보고 싶다고 말할 수 있는 사람이 되어줘서 고마워. 苙綺와 직접 함께한 기억들은 물론이고, 다시 만날 날을 기다리며 나눈 수많은 통화와 메시지까지 모두 나에게는 소중한 추억이야.\n\n나는 앞으로 더 좋은 남자친구가 되고 싶어.\n\n내 마음을 표현하는 데 익숙해졌다고 소홀해지지 않고, 익숙함 때문에 苙綺의 소중함을 잊지 않을게. 서로 생각이 다를 때도 내 입장만 앞세우지 않고, 네 마음을 먼저 이해하려고 노력할게. 멀리 떨어져 있는 시간에도 苙綺가 혼자라고 느끼지 않도록 더 자주 표현하고 더 많이 안심시켜줄게.',
      'zh-TW': '[Translation pending]',
      en: '[Translation pending]',
    },
  },
  {
    id: 'letter-7',
    content: {
      ko: '우리에게는 앞으로 함께 만들고 싶은 기억이 정말 많아.\n\n한국에서 함께 평범한 하루를 보내고 싶고, 대만의 새로운 장소도 같이 여행하고 싶어. 같이 요리하고, 벚꽃을 보고, 크리스마스를 보내고, 200일과 1주년을 함께 축하하고 싶어.\n\n그리고 언젠가는 보고 싶다는 말을 한 뒤, 다음 만남을 오래 기다리지 않아도 되는 날이 왔으면 좋겠어.\n\n해바라기가 언제나 해를 바라보듯, 내 마음도 언제나 苙綺를 향하고 있어.\n\n100일 동안 함께해줘서 고마워. 우리의 첫 100일을 진심으로 축하해.\n\n지금도 많이 사랑하고, 앞으로는 지금보다 더 많이 사랑할게.\n\n사랑해, 苙綺.\n\nJay',
      'zh-TW': '[Translation pending]',
      en: '[Translation pending]',
    },
  },
]
```

- [ ] **Step 6: Create `src/content/memories.ts`**

```ts
import type { LocalizedText } from './localization'

export interface MemoryImage {
  id: string
  src: string
  thumbnailSrc?: string
  alt: LocalizedText
}

export interface MemoryItem {
  id: string
  enabled: boolean
  title: LocalizedText
  description: LocalizedText
  images: MemoryImage[]
  date?: string
  location?: LocalizedText
  layout?: 'single' | 'stacked' | 'collage'
  placeholderHint?: string
}

export const memories: MemoryItem[] = [
  {
    id: 'memory-01',
    enabled: false,
    title: { 'zh-TW': '第一張合照', ko: '처음 함께 찍은 사진', en: 'Our first photo together' },
    description: {
      'zh-TW': '只在螢幕裡見過的我們，第一次被收進同一張照片的瞬間。每次看到這張照片，都會想起初次見面那天的緊張和心動。',
      ko: '화면 속에서만 보던 우리가 처음 같은 사진 안에 담긴 순간. 사진을 볼 때마다 처음 만났던 날의 긴장과 설렘이 다시 생각나.',
      en: 'The moment we were captured in the same photo for the first time. Every time I see it, the nervousness and excitement of that first meeting come back.',
    },
    images: [],
    placeholderHint: 'first-photo-together',
  },
  {
    id: 'memory-02',
    enabled: false,
    title: { 'zh-TW': '第一頓飯', ko: '처음 함께 먹었던 식사', en: 'Our first meal together' },
    description: {
      'zh-TW': '比起吃了什麼，和苙綺面對面坐著、共度同一段時光，這件事本身更讓我覺得特別。',
      ko: '무엇을 먹었는지보다 苙綺와 마주 앉아 같은 시간을 보내고 있다는 사실이 더 특별했던 기억.',
      en: 'More than what we ate, just sitting across from each other sharing the same moment felt special.',
    },
    images: [],
    placeholderHint: 'first-meal',
  },
  {
    id: 'memory-03',
    enabled: false,
    title: { 'zh-TW': '一起走過的第一條街', ko: '함께 걸었던 첫 번째 거리', en: 'The first street we walked together' },
    description: {
      'zh-TW': '即使沒有特別的目的地，光是一起走路、一起聊天，時間就過得飛快的瞬間。',
      ko: '특별한 목적지가 없어도, 함께 걷고 이야기하는 것만으로 시간이 빠르게 지나갔던 순간.',
      en: 'Even without a destination, just walking and talking together made time fly by.',
    },
    images: [],
    placeholderHint: 'first-walk',
  },
  {
    id: 'memory-04',
    enabled: false,
    title: { 'zh-TW': '你燦爛的笑容', ko: '환하게 웃던 너의 모습', en: 'Your bright smile' },
    description: {
      'zh-TW': '連周圍的氣氛都被照亮的苙綺的笑容，是我久久難以忘懷的瞬間。',
      ko: '주변 분위기까지 밝게 만드는 苙綺의 웃는 모습이 오래도록 기억에 남았던 순간.',
      en: 'Your smile that brightened everything around you — a moment I will remember for a long time.',
    },
    images: [],
    placeholderHint: 'bright-smile',
  },
  {
    id: 'memory-05',
    enabled: false,
    title: { 'zh-TW': '在韓國一起度過的平凡日子', ko: '한국에서 함께 보낸 평범한 하루', en: 'An ordinary day together in Korea' },
    description: {
      'zh-TW': '沒有盛大的活動，只是一起吃飯、散步、聊天，就讓我知道平凡的一天可以有多幸福。',
      ko: '거창한 이벤트가 없어도 함께 밥을 먹고, 걷고, 이야기하는 평범한 하루가 얼마나 행복한지 알게 된 시간.',
      en: 'No grand plans — just eating, walking, and talking together showed me how happy an ordinary day can be.',
    },
    images: [],
    placeholderHint: 'ordinary-day-korea',
  },
  {
    id: 'memory-06',
    enabled: false,
    title: { 'zh-TW': '遠隔兩地卻在一起的夜晚', ko: '멀리 있어도 함께했던 밤', en: 'Nights together despite the distance' },
    description: {
      'zh-TW': '雖然分隔在韓國和台灣，但透過電話和視訊分享彼此的一天，是我們感覺最靠近彼此的夜晚。',
      ko: '한국과 대만에 떨어져 있었지만, 전화와 영상통화로 서로의 하루를 나누며 가장 가까이 있다고 느꼈던 밤들.',
      en: 'Separated between Korea and Taiwan, but sharing our days through calls and video — the nights we felt closest.',
    },
    images: [],
    placeholderHint: 'video-call-nights',
  },
  {
    id: 'memory-07',
    enabled: false,
    title: { 'zh-TW': '重逢那天的喜悅', ko: '다시 만난 날의 반가움', en: 'The joy of reunion' },
    description: {
      'zh-TW': '等待了那麼久，再次看到彼此時，那份喜悅比想像中更加強烈的一天。',
      ko: '기다렸던 시간만큼 서로를 다시 마주한 순간의 반가움이 더 크게 느껴졌던 날.',
      en: 'After all the waiting, the joy of seeing each other again felt even greater than I imagined.',
    },
    images: [],
    placeholderHint: 'reunion-joy',
  },
  {
    id: 'memory-08',
    enabled: false,
    title: { 'zh-TW': '在台灣一起走過的街道', ko: '대만에서 함께 걸었던 거리', en: 'Streets we walked in Taiwan' },
    description: {
      'zh-TW': '對我來說是陌生的地方，但因為有苙綺在身邊而感到安心，也覺得自己離你的世界更近了一步。',
      ko: '나에게는 낯선 장소였지만 苙綺와 함께여서 편안했고, 네가 살아가는 세상에 조금 더 가까워졌다고 느꼈던 순간.',
      en: 'An unfamiliar place to me, but being with you made it feel like home — a moment I felt closer to your world.',
    },
    images: [],
    placeholderHint: 'taiwan-streets',
  },
  {
    id: 'memory-09',
    enabled: false,
    title: { 'zh-TW': '在台灣一起吃飯聊天的時光', ko: '대만에서 함께 먹고 웃었던 시간', en: 'Eating and laughing in Taiwan' },
    description: {
      'zh-TW': '比起新奇的食物和風景，在同一張桌子上一起笑著聊天的時光更讓我印象深刻。',
      ko: '새로운 음식과 풍경보다, 같은 테이블에서 함께 웃고 이야기했던 시간이 더 기억에 남은 순간.',
      en: 'More than the new food and scenery, the time we spent laughing and talking at the same table is what I remember most.',
    },
    images: [],
    placeholderHint: 'taiwan-dining',
  },
  {
    id: 'memory-10',
    enabled: false,
    title: { 'zh-TW': '約定下次見面的瞬間', ko: '다음 만남을 약속했던 순간', en: 'The moment we promised to meet again' },
    description: {
      'zh-TW': '在又要分開的不捨中，聊著下次要去哪裡、要一起做什麼，把等待變成了約定的瞬間。',
      ko: '다시 멀어져야 하는 아쉬움 속에서도, 다음에는 어디에서 무엇을 함께할지 이야기하며 기다림을 약속했던 순간.',
      en: 'Even as we faced separation again, we talked about where to go next and what to do — turning waiting into a promise.',
    },
    images: [],
    placeholderHint: 'next-promise',
  },
]
```

- [ ] **Step 7: Create `src/content/futurePlans.ts`**

```ts
import type { LocalizedText } from './localization'

export interface FutureWish {
  id: string
  text: LocalizedText
}

export const futureWishes: FutureWish[] = [
  { id: 'wish-01', text: { 'zh-TW': '在韓國一起生活一個月', ko: '한국에서 한 달 동안 함께 살아보기', en: 'Live together in Korea for a month' } },
  { id: 'wish-02', text: { 'zh-TW': '一起去愛寶樂園', ko: '에버랜드 함께 가기', en: 'Visit Everland together' } },
  { id: 'wish-03', text: { 'zh-TW': '一起去台灣的新城市旅行', ko: '대만의 새로운 도시 여행하기', en: 'Travel to a new city in Taiwan' } },
  { id: 'wish-04', text: { 'zh-TW': '一起做料理', ko: '함께 요리하기', en: 'Cook together' } },
  { id: 'wish-05', text: { 'zh-TW': '一起看櫻花', ko: '벚꽃 함께 보기', en: 'See cherry blossoms together' } },
  { id: 'wish-06', text: { 'zh-TW': '一起過聖誕節', ko: '크리스마스 함께 보내기', en: 'Spend Christmas together' } },
  { id: 'wish-07', text: { 'zh-TW': '一起慶祝200天', ko: '200일 함께 축하하기', en: 'Celebrate 200 days together' } },
  { id: 'wish-08', text: { 'zh-TW': '一起慶祝第一個週年', ko: '첫 번째 1주년 함께 축하하기', en: 'Celebrate our first anniversary' } },
  { id: 'wish-09', text: { 'zh-TW': '沒有特別計畫，一起度過平凡的一天', ko: '특별한 계획 없이 평범한 하루 함께 보내기', en: 'Spend an ordinary day together with no plans' } },
  { id: 'wish-10', text: { 'zh-TW': '打造一個不用再久等下次見面的未來', ko: '더 이상 다음 만남을 오래 기다리지 않아도 되는 미래 만들기', en: 'Build a future where we no longer wait long to meet again' } },
]
```

- [ ] **Step 8: Run all checks**

Run: `npm run lint && npm run typecheck && npm run test -- --run`
Expected: all pass

- [ ] **Step 9: Commit**

```bash
git add src/content/features.ts src/content/letter.ts src/content/memories.ts src/content/futurePlans.ts src/content/ui.ts tests/content.test.ts
git commit -m "Add content data layer: features, letter, memories, future plans, UI text"
```

---

### Task 3: Book Engine Composable — Page Array + Navigation State

**Files:**
- Create: `src/composables/useBookEngine.ts`
- Create: `tests/useBookEngine.test.ts`

**Interfaces:**
- Consumes: `Features` from `features.ts`, `TimelineItem[]` from `timeline.ts`, `MemoryItem[]` from `memories.ts`, `LetterPage[]` from `letter.ts`, `FutureWish[]` from `futurePlans.ts`
- Produces: `useBookEngine()` returning `{ pages, currentIndex, totalPages, progress, isFlipping, canGoForward, canGoBack, flipForward(), flipBack(), goToPage(index), resetBook() }`

- [ ] **Step 1: Write tests for the composable**

```ts
// tests/useBookEngine.test.ts
import { describe, expect, it } from 'vitest'

import { useBookEngine } from '@/composables/useBookEngine'

describe('useBookEngine', () => {
  it('builds a page array with correct section order', () => {
    const { pages } = useBookEngine()
    expect(pages.value.length).toBeGreaterThanOrEqual(12)
    expect(pages.value[0].section).toBe('intro')
    expect(pages.value[1].section).toBe('timeline')
    expect(pages.value[pages.value.length - 1].section).toBe('ending')
  })

  it('starts at page index 0', () => {
    const { currentIndex } = useBookEngine()
    expect(currentIndex.value).toBe(0)
  })

  it('computes progress as 1-indexed fraction', () => {
    const { progress, totalPages } = useBookEngine()
    expect(progress.value).toBe(`1 / ${totalPages.value}`)
  })

  it('only includes enabled memories', () => {
    const { pages } = useBookEngine()
    const memoryPages = pages.value.filter(p => p.section === 'memory')
    // All memories start disabled, so 0 memory pages
    expect(memoryPages).toHaveLength(0)
  })

  it('flipForward increments index', () => {
    const engine = useBookEngine()
    expect(engine.canGoForward.value).toBe(true)
    engine.flipForward()
    expect(engine.currentIndex.value).toBe(1)
  })

  it('flipBack decrements index', () => {
    const engine = useBookEngine()
    engine.flipForward()
    engine.flipForward()
    engine.flipBack()
    expect(engine.currentIndex.value).toBe(1)
  })

  it('cannot go back from first page', () => {
    const { canGoBack } = useBookEngine()
    expect(canGoBack.value).toBe(false)
  })

  it('resetBook returns to page 0', () => {
    const engine = useBookEngine()
    engine.flipForward()
    engine.flipForward()
    engine.resetBook()
    expect(engine.currentIndex.value).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run`
Expected: FAIL — module does not exist

- [ ] **Step 3: Implement `src/composables/useBookEngine.ts`**

```ts
import { computed, ref } from 'vue'

import { features } from '@/content/features'
import { letterPages } from '@/content/letter'
import { memories } from '@/content/memories'
import { futureWishes } from '@/content/futurePlans'
import { timeline } from '@/content/timeline'
import type { LocalizedText } from '@/content/localization'

export interface BookPage {
  id: string
  section: 'intro' | 'timeline' | 'memory' | 'korea-taiwan' | 'future' | 'letter' | 'ending'
  content?: LocalizedText
  data?: unknown
}

function buildPageArray(): BookPage[] {
  const pages: BookPage[] = []

  pages.push({
    id: 'intro',
    section: 'intro',
  })

  for (const item of timeline) {
    pages.push({
      id: `timeline-${item.id}`,
      section: 'timeline',
      data: item,
    })
  }

  for (const item of memories.filter(m => m.enabled)) {
    pages.push({
      id: `memory-${item.id}`,
      section: 'memory',
      data: item,
    })
  }

  pages.push({ id: 'korea-taiwan-1', section: 'korea-taiwan' })
  pages.push({ id: 'korea-taiwan-2', section: 'korea-taiwan' })

  const wishesPerPage = Math.ceil(futureWishes.length / 2)
  pages.push({
    id: 'future-1',
    section: 'future',
    data: futureWishes.slice(0, wishesPerPage),
  })
  pages.push({
    id: 'future-2',
    section: 'future',
    data: futureWishes.slice(wishesPerPage),
  })

  for (const lp of letterPages) {
    pages.push({
      id: lp.id,
      section: 'letter',
      content: lp.content,
    })
  }

  pages.push({ id: 'ending', section: 'ending' })

  return pages
}

export function useBookEngine() {
  const pages = computed(() => buildPageArray())
  const currentIndex = ref(0)
  const isFlipping = ref(false)

  const totalPages = computed(() => pages.value.length)
  const canGoForward = computed(() => currentIndex.value < totalPages.value - 1)
  const canGoBack = computed(() => currentIndex.value > 0)
  const progress = computed(() => `${currentIndex.value + 1} / ${totalPages.value}`)

  function flipForward() {
    if (!canGoForward.value || isFlipping.value) return
    currentIndex.value++
  }

  function flipBack() {
    if (!canGoBack.value || isFlipping.value) return
    currentIndex.value--
  }

  function goToPage(index: number) {
    if (index >= 0 && index < totalPages.value) {
      currentIndex.value = index
    }
  }

  function resetBook() {
    currentIndex.value = 0
    isFlipping.value = false
  }

  return {
    pages,
    currentIndex,
    totalPages,
    progress,
    isFlipping,
    canGoForward,
    canGoBack,
    flipForward,
    flipBack,
    goToPage,
    resetBook,
  }
}
```

- [ ] **Step 4: Run all checks**

Run: `npm run lint && npm run typecheck && npm run test -- --run`
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add src/composables/useBookEngine.ts tests/useBookEngine.test.ts
git commit -m "Add useBookEngine composable with page array and navigation"
```

---

### Task 4: CSS Foundation — Page Flip, Gift Box, Book Styles

**Files:**
- Modify: `src/styles/main.css` (replace with new design system)

**Interfaces:**
- Produces: CSS classes used by components in Tasks 5–8: `.gift-scene`, `.gift-box`, `.box-lid`, `.book-container`, `.book-cover`, `.reading-container`, `.book-page`, `.book-page.flipped`, `.page-nav-zone`, `.progress-bar`, `.language-switcher`, `.sunflower-*`

- [ ] **Step 1: Replace `src/styles/main.css` with the new design system**

Keep the existing CSS variables (`:root` block) but replace all component-specific styles. The new CSS must include:

1. **Base reset and tokens** — existing `:root` variables preserved, add `--shadow-paper`, body `overflow: hidden`, `100dvh`
2. **Gift box phase** — `.gift-scene` (full viewport flex center), `.gift-box` (220px wide, kraft paper gradient), `.box-lid` (3D rotateX transition), `.sunflower-*` CSS-only flower, `.name-tag`, `.tap-hint`
3. **Book reveal phase** — `.book-container` (centered, transition), `.book-cover` (260×360, kraft gradient, spine pseudo-element), `.pressed-flower` (CSS petals)
4. **Reading mode** — `.reading-container` (full viewport), `.book-reader` (320×auto, perspective 1200px), `.book-page` (ivory background, paper texture via gradient, `backface-visibility: hidden`, `-webkit-backface-visibility: hidden`, `transform-origin: left center`, `transition: transform 0.7s cubic-bezier(0.645, 0.045, 0.355, 1)`), `.book-page.flipped` (`rotateY(-180deg)`, after transition: `visibility: hidden`, `pointer-events: none`)
5. **Page navigation** — `.page-nav-zone` (absolute, 40% width, full height), `.progress-bar` (fixed bottom)
6. **Language switcher** — keep existing style, add `stopPropagation` note in comment
7. **Typography** — font-face for Pretendard and Noto Serif TC, body/display assignments
8. **Reduced motion** — `@media (prefers-reduced-motion: reduce)` replacing transitions with instant
9. **Page content types** — `.page-intro`, `.page-timeline`, `.page-memory`, `.page-map`, `.page-wishes`, `.page-letter`, `.page-ending`

This is a large CSS file. Write the complete file covering all the above classes. Use the color tokens from DESIGN.md. Ensure 32px 28px padding on page content, 44px min touch targets, 100dvh page height.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: pass

- [ ] **Step 3: Commit**

```bash
git add src/styles/main.css
git commit -m "Replace CSS with Gift Box Diary design system"
```

---

### Task 5: Gift Box Component (Phase 1)

**Files:**
- Create: `src/components/GiftBox.vue`

**Interfaces:**
- Consumes: `uiText` from `ui.ts`, `getLocalizedText` and `Locale` from `localization.ts`
- Produces: emits `opened` event when box animation completes

- [ ] **Step 1: Create `src/components/GiftBox.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { getLocalizedText, type Locale } from '@/content/localization'
import { uiText } from '@/content/ui'

const props = defineProps<{ locale: Locale }>()
const emit = defineEmits<{ opened: [] }>()

const isOpening = ref(false)

function openBox() {
  if (isOpening.value) return
  isOpening.value = true
  setTimeout(() => emit('opened'), 1800)
}
</script>

<template>
  <div class="gift-scene">
    <div
      class="gift-box"
      role="button"
      tabindex="0"
      :aria-label="getLocalizedText(uiText.tapToOpen, props.locale)"
      @click="openBox"
      @keydown.enter="openBox"
      @keydown.space.prevent="openBox"
    >
      <div
        class="box-lid"
        :class="{ 'is-open': isOpening }"
      />
      <div class="box-body" />
      <div class="box-ribbon" />
      <div class="name-tag">
        {{ getLocalizedText(uiText.nameTag, props.locale) }}
      </div>
      <div class="sunflower-decoration" aria-hidden="true">
        <div class="sunflower-petal" v-for="i in 8" :key="i" />
        <div class="sunflower-center" />
      </div>
    </div>
    <p
      v-if="!isOpening"
      class="tap-hint"
    >
      {{ getLocalizedText(uiText.tapToOpen, props.locale) }}
    </p>
  </div>
</template>
```

- [ ] **Step 2: Run lint + typecheck**

Run: `npm run lint && npm run typecheck`
Expected: pass

- [ ] **Step 3: Commit**

```bash
git add src/components/GiftBox.vue
git commit -m "Add GiftBox component with 3D lid animation"
```

---

### Task 6: Book Cover Component (Phase 2)

**Files:**
- Create: `src/components/BookCover.vue`

**Interfaces:**
- Consumes: `uiText` from `ui.ts`, `getLocalizedText` and `Locale` from `localization.ts`
- Produces: emits `opened` event when cover flip completes

- [ ] **Step 1: Create `src/components/BookCover.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { getLocalizedText, type Locale } from '@/content/localization'
import { uiText } from '@/content/ui'

const props = defineProps<{ locale: Locale }>()
const emit = defineEmits<{ opened: [] }>()

const isFlipping = ref(false)

function openBook() {
  if (isFlipping.value) return
  isFlipping.value = true
  setTimeout(() => emit('opened'), 1000)
}
</script>

<template>
  <div class="book-container">
    <div
      class="book-cover"
      role="button"
      tabindex="0"
      :aria-label="getLocalizedText(uiText.bookTitle, props.locale)"
      :class="{ 'is-flipping': isFlipping }"
      @click="openBook"
      @keydown.enter="openBook"
      @keydown.space.prevent="openBook"
    >
      <h1 class="book-title">
        {{ getLocalizedText(uiText.bookTitle, props.locale) }}
      </h1>
      <div
        class="pressed-flower"
        aria-hidden="true"
      >
        <div
          v-for="i in 5"
          :key="i"
          class="petal"
        />
        <div class="flower-center" />
        <div class="flower-leaf flower-leaf-left" />
        <div class="flower-leaf flower-leaf-right" />
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Run lint + typecheck**

Run: `npm run lint && npm run typecheck`
Expected: pass

- [ ] **Step 3: Commit**

```bash
git add src/components/BookCover.vue
git commit -m "Add BookCover component with flip-open transition"
```

---

### Task 7: Page Renderer Components

**Files:**
- Create: `src/components/PageIntro.vue`
- Create: `src/components/PageTimeline.vue`
- Create: `src/components/PageMemory.vue`
- Create: `src/components/PageMap.vue`
- Create: `src/components/PageFuture.vue`
- Create: `src/components/PageLetter.vue`
- Create: `src/components/PageEnding.vue`
- Create: `src/components/BookPageRenderer.vue`

**Interfaces:**
- Consumes: `BookPage` from `useBookEngine.ts`, `Locale` from `localization.ts`, all content types
- Produces: `BookPageRenderer` component that accepts `page: BookPage` and `locale: Locale` props and delegates to the correct sub-component

Each page component receives `locale` and its section-specific data as props. They render the content using `getLocalizedText()`. They are pure render components — no navigation logic.

- [ ] **Step 1: Create all 7 page components + the renderer**

`PageIntro.vue` — renders "100 DAYS / 2 COUNTRIES / date range" stats with chapter heading at top.

`PageTimeline.vue` — renders a single `TimelineItem` (date, title, description, optional image placeholder). First timeline page shows chapter heading.

`PageMemory.vue` — renders a single `MemoryItem` (photos/placeholders, title, description). First memory page shows chapter heading.

`PageMap.vue` — renders Korea-Taiwan map page (page 1) or emotional text (page 2). First map page shows chapter heading.

`PageFuture.vue` — renders a list of `FutureWish` items as a checklist. First future page shows chapter heading.

`PageLetter.vue` — renders letter text with serif font, generous line height (2.0+). First letter page shows chapter heading.

`PageEnding.vue` — renders sunflower bloom animation + final message + restart button.

`BookPageRenderer.vue` — switch on `page.section` to render the correct sub-component:

```vue
<script setup lang="ts">
import type { Locale } from '@/content/localization'
import type { BookPage } from '@/composables/useBookEngine'

import PageIntro from './PageIntro.vue'
import PageTimeline from './PageTimeline.vue'
import PageMemory from './PageMemory.vue'
import PageMap from './PageMap.vue'
import PageFuture from './PageFuture.vue'
import PageLetter from './PageLetter.vue'
import PageEnding from './PageEnding.vue'

defineProps<{
  page: BookPage
  locale: Locale
  isFirstInSection: boolean
}>()

defineEmits<{ restart: [] }>()

const componentMap = {
  intro: PageIntro,
  timeline: PageTimeline,
  memory: PageMemory,
  'korea-taiwan': PageMap,
  future: PageFuture,
  letter: PageLetter,
  ending: PageEnding,
} as const
</script>

<template>
  <component
    :is="componentMap[page.section]"
    :page="page"
    :locale="locale"
    :is-first-in-section="isFirstInSection"
    @restart="$emit('restart')"
  />
</template>
```

- [ ] **Step 2: Run lint + typecheck**

Run: `npm run lint && npm run typecheck`
Expected: pass

- [ ] **Step 3: Commit**

```bash
git add src/components/PageIntro.vue src/components/PageTimeline.vue src/components/PageMemory.vue src/components/PageMap.vue src/components/PageFuture.vue src/components/PageLetter.vue src/components/PageEnding.vue src/components/BookPageRenderer.vue
git commit -m "Add page renderer components for all sections"
```

---

### Task 8: App Shell — Wire Everything Together

**Files:**
- Modify: `src/App.vue` (complete rewrite)
- Modify: `src/main.ts` (no changes expected, but verify)
- Modify: `index.html` (update title if needed)

**Interfaces:**
- Consumes: `useBookEngine()`, `GiftBox`, `BookCover`, `BookPageRenderer`, `Locale`, `getLocalizedText`, `uiText`
- Produces: the full 3-phase app experience

- [ ] **Step 1: Rewrite `src/App.vue`**

The new App.vue manages three phases via a `phase` ref (`'gift' | 'book' | 'reading'`):

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { type Locale } from '@/content/localization'
import { getLocalizedText } from '@/content/localization'
import { uiText } from '@/content/ui'
import { useBookEngine } from '@/composables/useBookEngine'

import GiftBox from '@/components/GiftBox.vue'
import BookCover from '@/components/BookCover.vue'
import BookPageRenderer from '@/components/BookPageRenderer.vue'

const locale = ref<Locale>('zh-TW')
const phase = ref<'gift' | 'book' | 'reading'>('gift')

const engine = useBookEngine()

const languageOptions: Array<{ value: Locale; label: string }> = [
  { value: 'zh-TW', label: '繁中' },
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'EN' },
]

function onGiftOpened() {
  phase.value = 'book'
}

function onBookOpened() {
  phase.value = 'reading'
}

function restart() {
  engine.resetBook()
  phase.value = 'gift'
}

// Swipe handling for reading mode
let touchStartX = 0
function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
}
function onTouchEnd(e: TouchEvent) {
  if (engine.isFlipping.value) return
  const diff = touchStartX - e.changedTouches[0].clientX
  if (Math.abs(diff) > 50) {
    if (diff > 0) engine.flipForward()
    else engine.flipBack()
  }
}

// Tap zone handling
function onTapLeft() {
  if (!engine.isFlipping.value) engine.flipBack()
}
function onTapRight() {
  if (!engine.isFlipping.value) engine.flipForward()
}

// Keyboard nav
function onKeydown(e: KeyboardEvent) {
  if (phase.value !== 'reading' || engine.isFlipping.value) return
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') engine.flipForward()
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') engine.flipBack()
}

// Determine if a page is first in its section
function isFirstInSection(index: number): boolean {
  if (index === 0) return true
  return engine.pages.value[index].section !== engine.pages.value[index - 1].section
}
</script>

<template>
  <div
    class="app-shell"
    tabindex="0"
    @keydown="onKeydown"
  >
    <!-- Language Switcher (always visible) -->
    <div
      class="language-switcher"
      aria-label="Language"
      @click.stop
    >
      <button
        v-for="option in languageOptions"
        :key="option.value"
        type="button"
        :aria-pressed="locale === option.value"
        @click.stop="locale = option.value"
      >
        {{ option.label }}
      </button>
    </div>

    <!-- Phase 1: Gift Box -->
    <GiftBox
      v-if="phase === 'gift'"
      :locale="locale"
      @opened="onGiftOpened"
    />

    <!-- Phase 2: Book Cover -->
    <BookCover
      v-if="phase === 'book'"
      :locale="locale"
      @opened="onBookOpened"
    />

    <!-- Phase 3: Reading Mode -->
    <div
      v-if="phase === 'reading'"
      class="reading-container"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <div class="book-reader">
        <div
          v-for="(page, index) in engine.pages.value"
          :key="page.id"
          class="book-page"
          :class="{
            flipped: index < engine.currentIndex.value,
          }"
          :style="{ zIndex: engine.pages.value.length - index }"
        >
          <BookPageRenderer
            :page="page"
            :locale="locale"
            :is-first-in-section="isFirstInSection(index)"
            @restart="restart"
          />
        </div>

        <!-- Tap zones -->
        <div
          class="page-nav-zone page-nav-left"
          @click.stop="onTapLeft"
        />
        <div
          class="page-nav-zone page-nav-right"
          @click.stop="onTapRight"
        />
      </div>

      <!-- Progress -->
      <div class="progress-bar">
        {{ engine.progress.value }}
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Run all checks**

Run: `npm run lint && npm run typecheck && npm run test -- --run`
Expected: all pass

- [ ] **Step 3: Run dev server and visually verify**

Run: `npm run dev`
Verify: gift box appears → tap opens → book appears → tap opens → pages flip

- [ ] **Step 4: Commit**

```bash
git add src/App.vue
git commit -m "Wire up Gift Box Diary with 3-phase interaction flow"
```

---

### Task 9: Update E2E Test for New Flow

**Files:**
- Modify: `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: the rendered app with gift box → book → reading flow

- [ ] **Step 1: Rewrite the E2E smoke test**

```ts
import { expect, test } from '@playwright/test'
import { createServer, type Server } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'

let server: Server
let baseUrl: string

const mimeTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

test.beforeAll(async () => {
  const distRoot = resolve('dist')

  server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname
    const filePath = join(distRoot, requestedPath)

    try {
      const body = await readFile(filePath)
      response.writeHead(200, {
        'content-type': mimeTypes[extname(filePath)] ?? 'application/octet-stream',
      })
      response.end(body)
    } catch {
      response.writeHead(404)
      response.end('Not found')
    }
  })

  await new Promise<void>((resolveServer) => {
    server.listen(0, '127.0.0.1', resolveServer)
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Unable to start static test server')
  }
  baseUrl = `http://127.0.0.1:${address.port}`
})

test.afterAll(async () => {
  await new Promise<void>((resolveClose, rejectClose) => {
    server.close((error) => {
      if (error) {
        rejectClose(error)
        return
      }
      resolveClose()
    })
  })
})

test('full flow: gift box → book → reading → language switch', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  await page.goto(baseUrl)

  // Phase 1: Gift box visible with zh-TW name tag
  await expect(page.getByText('給苙綺')).toBeVisible()

  // Open gift box
  await page.getByRole('button', { name: '輕觸打開' }).click()

  // Phase 2: Book cover appears
  await expect(page.getByText('我們的100天日記')).toBeVisible({ timeout: 3000 })

  // Open book
  await page.getByRole('button', { name: '我們的100天日記' }).click()

  // Phase 3: Reading mode — first page visible
  await expect(page.getByText('100 DAYS')).toBeVisible({ timeout: 3000 })

  // Switch language to Korean
  await page.getByRole('button', { name: '한국어' }).click()

  // Verify Korean content appears (name tag would be in Korean if visible)
  // Progress bar should be visible
  await expect(page.getByText(/1 \/ \d+/)).toBeVisible()

  // No console errors
  expect(errors).toEqual([])
})
```

- [ ] **Step 2: Build and run E2E**

Run: `npm run build && npx playwright test`
Expected: pass

- [ ] **Step 3: Commit**

```bash
git add e2e/smoke.spec.ts
git commit -m "Update E2E test for gift box → book → reading flow"
```

---

### Task 10: Update CLAUDE.md and AGENTS.md References

**Files:**
- Modify: `CLAUDE.md`
- Modify: `AGENTS.md` (update design direction reference only)

**Interfaces:** none (documentation only)

- [ ] **Step 1: Update CLAUDE.md**

Update the "Architecture" section to describe the Gift Box Diary (page-flip, not scroll). Update the component listing to reflect new components. Update key constraints to mention locale key convention `'zh-TW'`.

- [ ] **Step 2: Update AGENTS.md line 88**

Change `The approved direction is **Warm Interactive Polaroid Scrapbook**.` to `The approved direction is **Gift Box Diary**. See DESIGN.md for details.`

- [ ] **Step 3: Final full verification**

Run: `npm run lint && npm run typecheck && npm run test -- --run && npm run build && npx playwright test`
Expected: all pass

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md AGENTS.md
git commit -m "Update documentation for Gift Box Diary design"
```
