<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

import { type Locale, type LocalizedText, getLocalizedText } from '@/content/localization'
import { useBookEngine, type BookPage } from '@/composables/useBookEngine'
import { uiText } from '@/content/ui'
import PageEndingCake from '@/components/PageEndingCake.vue'
import type { TimelineItem } from '@/content/timeline'
import { timelineMedia, type TimelineMediaKind } from '@/content/timelineMedia'
import type { MemoryItem } from '@/content/memories'
import type { FutureWish } from '@/content/futurePlans'

const props = defineProps<{ locale: Locale }>()
const emit = defineEmits<{ restart: [] }>()

const engine = useBookEngine()
const current = engine.currentIndex
const total = engine.totalPages

/* Only render a small window of pages around the current one. All pages are
   opaque and stacked, so you never see more than the current page plus the one
   mid-flip — rendering all 19 as 3D-composited layers was the main source of
   page-turn jank on mobile. Radius 1 covers the outgoing/incoming flip pages. */
const windowPages = computed(() => {
  const pages = engine.pages.value
  const cur = current.value
  const res: { page: BookPage; index: number }[] = []
  for (let i = 0; i < pages.length; i++) {
    if (Math.abs(i - cur) <= 1) res.push({ page: pages[i], index: i })
  }
  return res
})

/* ---------- localized copy (exact objects harvested from the Page*.vue components) ---------- */
const introChapterLabel: LocalizedText = {
  'zh-TW': '我們的第一個100天',
  ko: '우리의 첫 100일',
  en: 'Our First 100 Days',
}
const storyChapterLabel: LocalizedText = {
  'zh-TW': '我們的故事',
  ko: '우리의 이야기',
  en: 'Our Story',
}
const memoryChapterLabel: LocalizedText = {
  'zh-TW': '我們的回憶',
  ko: '우리의 추억',
  en: 'Our Memories',
}
const ktChapterLabel: LocalizedText = {
  'zh-TW': '韓國與台灣',
  ko: '한국과 대만',
  en: 'Korea and Taiwan',
}
const mapText: LocalizedText = {
  'zh-TW': '我們之間有大海和長長的距離，但每天分享彼此生活的心，總是緊緊相連。',
  ko: '우리 사이에는 바다와 긴 거리가 있지만, 매일 서로의 하루를 나누는 마음만큼은 언제나 가까이 이어져 있어.',
  en: 'There is an ocean and a long distance between us, but the heart that shares each day is always closely connected.',
}
const koreaLabel: LocalizedText = {
  'zh-TW': '韓國',
  ko: '한국',
  en: 'Korea',
}
const taiwanLabel: LocalizedText = {
  'zh-TW': '台灣',
  ko: '대만',
  en: 'Taiwan',
}
const futureChapterLabel: LocalizedText = {
  'zh-TW': '想一起創造的未來',
  ko: '함께하고 싶은 미래',
  en: 'Our Future Together',
}
const letterChapterLabel: LocalizedText = {
  'zh-TW': '給苙綺',
  ko: '苙綺에게',
  en: 'To Lichi',
}
const introMapNote: LocalizedText = {
  'zh-TW': '雖然相隔遙遠，但分享著每天的開始與結束，我們一直都在彼此的日常裡。',
  ko: '멀리 떨어져 있었지만, 하루의 시작과 끝을 나누며 우리는 늘 서로의 일상 속에 있었어.',
  en: "Though far apart, sharing the start and end of each day, we were always part of each other's everyday.",
}
function t(text: LocalizedText): string {
  return getLocalizedText(text, props.locale)
}

/* typed accessors for the template */
function timelineItem(page: BookPage): TimelineItem { return page.data as TimelineItem }
function memoryItem(page: BookPage): MemoryItem { return page.data as MemoryItem }
function wishesOf(page: BookPage): FutureWish[] { return (page.data as FutureWish[]) ?? [] }
function letterParagraphs(page: BookPage): string[] {
  return getLocalizedText(page.content as LocalizedText, props.locale).split('\n\n')
}

/* Timeline descriptions hold \n\n-separated paragraph groups (some entries are
   long — entry 5 especially), rendered as individual <p> in a scrollable body. */
function timelineParagraphs(page: BookPage): string[] {
  return t(timelineItem(page).description).split('\n\n')
}

/* ---------- timeline media tiles (2–3 photo/video slots per entry) ----------
   Real media isn't provided yet: glob-import any dropped files from
   src/assets/timeline-media/{photos,video}, and fall back to a fauxPhoto()
   placeholder (same pattern as StarIntro) so slots always render. */
const importedTimelinePhotos = import.meta.glob<string>(
  '/src/assets/timeline-media/photos/*.webp',
  { eager: true, import: 'default', query: '?url' },
)
const importedTimelineVideos = import.meta.glob<string>(
  '/src/assets/timeline-media/video/*.mp4',
  { eager: true, import: 'default', query: '?url' },
)

function importedMediaUrl(
  modules: Record<string, string>,
  fileName: string,
): string | null {
  const entry = Object.entries(modules).find(([path]) => path.endsWith(`/${fileName}`))
  return entry?.[1] ?? null
}

/* Placeholder photo generator — verbatim from StarIntro/the mockup. Every slot
   is a warm faux SVG until a real photo/video is dropped in. */
function fauxPhoto(seed = 0, w = 300, h = 400): string {
  const P = [
    ['#ffd9a0', '#f0907a', '#fff1c9', '#caa06a'],
    ['#ffe3b0', '#f4be3a', '#fff7df', '#b98a4e'],
    ['#f7c6a0', '#e88d6d', '#ffe6bd', '#a9713f'],
    ['#cfe0f0', '#f0b98a', '#fff4d8', '#8fa06a'],
    ['#ffcf9a', '#c98a5a', '#ffe9c2', '#7e8a56'],
    ['#ffe9c8', '#ffb85c', '#fffbe9', '#c99a2e'],
  ][seed % 6]
  const cx = 150 + ((seed * 37) % 80) - 40
  const cy = 120 + ((seed * 53) % 60) - 30
  const g = `pg${seed}`
  const svg =
`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 300 400'>
<defs><linearGradient id='${g}' x1='0' y1='0' x2='0' y2='1'>
<stop offset='0' stop-color='${P[0]}'/><stop offset='1' stop-color='${P[1]}'/></linearGradient>
<radialGradient id='s${g}' cx='0.5' cy='0.5' r='0.5'>
<stop offset='0' stop-color='${P[2]}'/><stop offset='1' stop-color='${P[2]}' stop-opacity='0'/></radialGradient></defs>
<rect width='300' height='400' fill='url(#${g})'/>
<circle cx='${cx}' cy='${cy}' r='70' fill='url(#s${g})'/>
<circle cx='${cx}' cy='${cy}' r='26' fill='${P[2]}' opacity='0.9'/>
<path d='M0 300 Q150 ${250 + (seed % 3) * 20} 300 300 L300 400 L0 400 Z' fill='${P[3]}'/>
<rect width='300' height='400' fill='rgba(40,25,15,0.06)'/>
<rect x='4' y='4' width='292' height='392' rx='4' fill='none' stroke='rgba(255,255,255,.10)'/>
</svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}

interface TimelineTile {
  id: string
  kind: TimelineMediaKind
  src: string
  placeholderSrc: string
  hasCustomMedia: boolean
}

/* Built ONCE — media is static (locale-independent), so precompute the tiles per
   entry id instead of regenerating faux SVGs on every reactive render. */
const timelineTileMap = new Map<string, TimelineTile[]>()
let tileSeed = 0
for (const [entryId, slots] of Object.entries(timelineMedia)) {
  timelineTileMap.set(
    entryId,
    slots.map((slot) => {
      const placeholderSrc = fauxPhoto(tileSeed++, 210, 280)
      const modules = slot.kind === 'video' ? importedTimelineVideos : importedTimelinePhotos
      const customSrc = importedMediaUrl(modules, slot.fileName)
      return {
        id: slot.id,
        kind: slot.kind,
        src: customSrc ?? placeholderSrc,
        placeholderSrc,
        hasCustomMedia: Boolean(customSrc),
      }
    }),
  )
}
function onTileError(e: Event, tile: TimelineTile) {
  const img = e.target as HTMLImageElement
  if (!img.dataset.fallback) {
    img.dataset.fallback = '1'
    img.src = tile.placeholderSrc
  }
}

/* ---------- timeline media PAGE (hero + thumbnails) ----------
   Its own page after each story page. Video slots are surfaced first so the
   hero opens on the clip; a photo/video is selected by tapping a thumbnail. */
const mediaTilesMap = new Map<string, TimelineTile[]>()
for (const [entryId, tiles] of timelineTileMap) {
  const videos = tiles.filter((tt) => tt.kind === 'video')
  const photos = tiles.filter((tt) => tt.kind !== 'video')
  mediaTilesMap.set(entryId, [...videos, ...photos])
}
function mediaTiles(page: BookPage): TimelineTile[] {
  return mediaTilesMap.get(timelineItem(page).id) ?? []
}
/* selected index per media page id (default 0 = the video-first hero). */
const mediaSel = reactive<Record<string, number>>({})
function selIdx(page: BookPage): number {
  return mediaSel[page.id] ?? 0
}
function selectMedia(pageId: string, i: number) {
  mediaSel[pageId] = i
}
function activeTile(page: BookPage): TimelineTile | undefined {
  return mediaTiles(page)[selIdx(page)]
}
/* An <img> can't render an .mp4 (video thumbnails/hero-without-file fall back to
   the faux placeholder); real photos and real videos use their own source. */
function thumbSrc(tile: TimelineTile): string {
  return tile.kind === 'video' ? tile.placeholderSrc : tile.src
}

const clipLabel: LocalizedText = {
  'zh-TW': '我們的影片',
  ko: '우리의 영상',
  en: 'Our clip',
}
const mediaHint: LocalizedText = {
  'zh-TW': '輕觸縮圖看大圖 ✦',
  ko: '썸네일을 톡 눌러 크게 보기 ✦',
  en: 'Tap a thumbnail to enlarge ✦',
}

/* Only the media page frees the bottom tap-strip so its thumbnail rail is
   tappable across the full width (side tap-zones otherwise sit above content). */
const currentIsMedia = computed(
  () => engine.pages.value[current.value]?.section === 'timeline-media',
)

/* Auto-fit a letter's text to its page: reset to the base size, then shrink the
   font + line-height together (keeping the ruled lines aligned) until the whole
   letter fits — so long letters never get clipped on shorter viewports. */
function fitLetter(el: HTMLElement) {
  el.style.setProperty('--fs', '16px')
  el.style.setProperty('--lh', '24px')
  void el.offsetHeight
  let fs = 16
  while (el.scrollHeight > el.clientHeight + 1 && fs > 10.5) {
    fs -= 0.5
    el.style.setProperty('--fs', `${fs}px`)
    el.style.setProperty('--lh', `${(fs * 1.5).toFixed(2)}px`)
  }
}
function scheduleFit(el: HTMLElement) {
  // Defer past the current render so the page's flex layout is settled before
  // we measure scrollHeight/clientHeight.
  requestAnimationFrame(() => requestAnimationFrame(() => fitLetter(el)))
}
const vFitLetter = {
  mounted: (el: HTMLElement) => scheduleFit(el),
  updated: (el: HTMLElement) => scheduleFit(el),
}

function formatDate(dateStr: string): string {
  return dateStr.replace(/-/g, '.')
}

/* ---------- growing sunflower stage mapped to overall reading progress ---------- */
const gardenStage = computed(() => {
  if (total.value <= 1) return 6
  const s = Math.round((current.value / (total.value - 1)) * 6)
  return Math.max(0, Math.min(6, s))
})
const gardenSvg = computed(() => growSunflower(gardenStage.value))

/* =========================================================
   SVG art — ported from the approved 03-two-characters mockup
   (static, decorative; injected via v-html)
   ========================================================= */
function petals(cx: number, cy: number, r: number, n: number, color: string): string {
  let out = ''
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    out += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="2.6" ry="1.4" fill="${color}" transform="rotate(${(a * 180 / Math.PI).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`
  }
  return out
}

const armReachR = '<path d="M64 66 Q78 62 84 68" stroke="#3d2b1f" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
const armReachL = '<path d="M36 66 Q22 62 16 68" stroke="#3d2b1f" stroke-width="2.4" fill="none" stroke-linecap="round"/>'

// Jay — warm amber little figure (Korea)
function jay(size = 92, arm: 'r' | 'l' | '' = ''): string {
  const a = arm === 'r' ? armReachR : arm === 'l' ? armReachL : ''
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" aria-hidden="true">`
    + '<ellipse cx="50" cy="93" rx="22" ry="4" fill="rgba(61,43,31,.10)"/>'
    + '<path d="M32 60 Q32 50 50 50 Q68 50 68 60 L68 82 Q68 88 62 88 L38 88 Q32 88 32 82 Z" fill="#ffb85c" stroke="#3d2b1f" stroke-width="2.4" stroke-linejoin="round"/>'
    + '<path d="M38 60 Q50 66 62 60 L62 65 Q50 71 38 65 Z" fill="#f0907a" stroke="#3d2b1f" stroke-width="1.8" stroke-linejoin="round"/>'
    + '<circle cx="50" cy="34" r="21" fill="#ffe0b0" stroke="#3d2b1f" stroke-width="2.4"/>'
    + '<path d="M31 30 Q34 14 50 13 Q66 14 69 30 Q60 22 50 22 Q40 22 31 30 Z" fill="#5b4128" stroke="#3d2b1f" stroke-width="2" stroke-linejoin="round"/>'
    + '<circle cx="42" cy="35" r="2.6" fill="#3d2b1f"/><circle cx="58" cy="35" r="2.6" fill="#3d2b1f"/>'
    + '<circle cx="37" cy="41" r="3.4" fill="rgba(240,144,122,.55)"/><circle cx="63" cy="41" r="3.4" fill="rgba(240,144,122,.55)"/>'
    + '<path d="M45 42 Q50 46 55 42" stroke="#3d2b1f" stroke-width="2" fill="none" stroke-linecap="round"/>'
    + a + '</svg>'
}

// 苙綺 — soft rose figure with a tiny sunflower clip (Taiwan)
function lichi(size = 92, arm: 'r' | 'l' | '' = ''): string {
  const a = arm === 'r' ? armReachR : arm === 'l' ? armReachL : ''
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" aria-hidden="true">`
    + '<ellipse cx="50" cy="93" rx="22" ry="4" fill="rgba(61,43,31,.10)"/>'
    + '<path d="M31 60 Q31 50 50 50 Q69 50 69 60 L72 86 Q72 89 68 89 L32 89 Q28 89 28 86 Z" fill="#f0907a" stroke="#3d2b1f" stroke-width="2.4" stroke-linejoin="round"/>'
    + '<path d="M40 58 Q50 63 60 58" stroke="#fff9ed" stroke-width="3" fill="none" stroke-linecap="round"/>'
    + '<circle cx="50" cy="34" r="21" fill="#ffe0b0" stroke="#3d2b1f" stroke-width="2.4"/>'
    + '<path d="M29 34 Q28 13 50 12 Q72 13 71 34 Q71 40 68 44 L66 30 Q58 22 50 22 Q42 22 34 30 L32 44 Q29 40 29 34 Z" fill="#3d2b1f"/>'
    + '<g transform="translate(66,24)"><circle cx="0" cy="0" r="3.6" fill="#3d2b1f"/>' + petals(0, 0, 3.4, 6, '#f4be3a') + '</g>'
    + '<circle cx="42" cy="35" r="2.6" fill="#3d2b1f"/><circle cx="58" cy="35" r="2.6" fill="#3d2b1f"/>'
    + '<circle cx="37" cy="41" r="3.4" fill="rgba(240,144,122,.6)"/><circle cx="63" cy="41" r="3.4" fill="rgba(240,144,122,.6)"/>'
    + '<path d="M45 42 Q50 46 55 42" stroke="#3d2b1f" stroke-width="2" fill="none" stroke-linecap="round"/>'
    + a + '</svg>'
}

function moon(size = 66): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 60 60" fill="none" aria-hidden="true">`
    + '<circle cx="30" cy="30" r="20" fill="#ffe9b8" stroke="#f4be3a" stroke-width="2"/>'
    + '<circle cx="24" cy="26" r="3.5" fill="rgba(244,190,58,.4)"/>'
    + '<circle cx="36" cy="34" r="2.5" fill="rgba(244,190,58,.4)"/>'
    + '<circle cx="33" cy="22" r="2" fill="rgba(244,190,58,.4)"/>'
    + '<path d="M12 14 l1.5 3 3 1.5 -3 1.5 -1.5 3 -1.5 -3 -3 -1.5 3 -1.5 z" fill="#f4be3a"/>'
    + '<path d="M50 42 l1 2 2 1 -2 1 -1 2 -1 -2 -2 -1 2 -1 z" fill="#f4be3a"/>'
    + '</svg>'
}

function landMound(color: string): string {
  return `<svg width="120" height="30" viewBox="0 0 120 30" fill="none" aria-hidden="true" style="margin-top:-10px"><ellipse cx="60" cy="16" rx="50" ry="13" fill="${color}" stroke="#3d2b1f" stroke-width="2.2"/><ellipse cx="60" cy="13" rx="50" ry="10" fill="rgba(255,255,255,.16)"/></svg>`
}

function plane(): string {
  return '<svg width="46" height="30" viewBox="0 0 46 30" fill="none" aria-hidden="true">'
    + '<path d="M4 17 L34 12 L42 8 L37 15 L42 16 L34 20 L6 21 Z" fill="#fff9ed" stroke="#3d2b1f" stroke-width="1.8" stroke-linejoin="round"/>'
    + '<path d="M20 13 L26 4 L28 5 L24 14 Z" fill="#f4be3a" stroke="#3d2b1f" stroke-width="1.4"/>'
    + '</svg>'
}

function callScene(): string {
  return '<svg width="230" height="96" viewBox="0 0 230 96" fill="none" aria-hidden="true">'
    + '<rect x="8" y="20" width="70" height="58" rx="9" fill="#fffdf6" stroke="#3d2b1f" stroke-width="2.4"/>'
    + '<rect x="152" y="20" width="70" height="58" rx="9" fill="#fffdf6" stroke="#3d2b1f" stroke-width="2.4"/>'
    + '<circle cx="43" cy="46" r="13" fill="#ffe0b0" stroke="#3d2b1f" stroke-width="1.8"/>'
    + '<path d="M31 44 Q30 32 43 32 Q56 32 55 44 Z" fill="#5b4128"/>'
    + '<circle cx="39" cy="46" r="1.7" fill="#3d2b1f"/><circle cx="47" cy="46" r="1.7" fill="#3d2b1f"/>'
    + '<path d="M40 51 Q43 54 46 51" stroke="#3d2b1f" stroke-width="1.4" fill="none" stroke-linecap="round"/>'
    + '<circle cx="187" cy="46" r="13" fill="#ffe0b0" stroke="#3d2b1f" stroke-width="1.8"/>'
    + '<path d="M175 45 Q174 31 187 31 Q200 31 199 45 Z" fill="#3d2b1f"/>'
    + '<circle cx="183" cy="46" r="1.7" fill="#3d2b1f"/><circle cx="191" cy="46" r="1.7" fill="#3d2b1f"/>'
    + '<path d="M184 51 Q187 54 190 51" stroke="#3d2b1f" stroke-width="1.4" fill="none" stroke-linecap="round"/>'
    + '<path d="M108 40 Q104 42 100 46" stroke="#cbb083" stroke-width="1.6" stroke-dasharray="3 3" fill="none"/>'
    + '<path d="M122 40 Q126 42 130 46" stroke="#cbb083" stroke-width="1.6" stroke-dasharray="3 3" fill="none"/>'
    + '<path d="M115 40 c-4-6-12-2-12 4 c0 5 7 9 12 13 c5-4 12-8 12-13 c0-6-8-10-12-4 z" fill="#f0907a"/>'
    + '</svg>'
}

function handFlower(): string {
  return '<svg width="200" height="86" viewBox="0 0 200 86" fill="none" aria-hidden="true">'
    + '<ellipse cx="100" cy="82" rx="70" ry="4" fill="rgba(61,43,31,.08)"/>'
    + '<g transform="translate(6,6)">'
    + '<path d="M18 66 Q18 56 34 56 Q50 56 50 66 L50 80 L18 80 Z" fill="#ffb85c" stroke="#3d2b1f" stroke-width="2.2" stroke-linejoin="round"/>'
    + '<circle cx="34" cy="42" r="16" fill="#ffe0b0" stroke="#3d2b1f" stroke-width="2.2"/>'
    + '<path d="M19 40 Q20 26 34 26 Q48 26 49 40 Q42 33 34 33 Q26 33 19 40 Z" fill="#5b4128"/>'
    + '<circle cx="29" cy="43" r="2" fill="#3d2b1f"/><circle cx="39" cy="43" r="2" fill="#3d2b1f"/>'
    + '<path d="M30 48 Q34 51 38 48" stroke="#3d2b1f" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
    + '<path d="M48 64 Q70 55 90 61" stroke="#3d2b1f" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
    + '</g>'
    + '<g transform="translate(70,26) scale(.85)">'
    + '<path d="M30 34 L30 52" stroke="#7e8a56" stroke-width="3" stroke-linecap="round"/>'
    + '<g transform="translate(30,24)">' + petals(0, 0, 12, 12, '#f4be3a') + '<circle cx="0" cy="0" r="8" fill="#3d2b1f"/></g>'
    + '</g>'
    + '<g transform="translate(120,6)">'
    + '<path d="M18 66 Q18 56 34 56 Q50 56 50 66 L52 80 L16 80 Z" fill="#f0907a" stroke="#3d2b1f" stroke-width="2.2" stroke-linejoin="round"/>'
    + '<circle cx="34" cy="42" r="16" fill="#ffe0b0" stroke="#3d2b1f" stroke-width="2.2"/>'
    + '<path d="M18 42 Q17.2 26 34 25.2 Q50.8 26 50 42 Q50 46.6 47.7 49.6 L46.2 39 Q40.1 32.9 34 32.9 Q27.9 32.9 21.8 39 L20.3 49.6 Q18 46.6 18 42 Z" fill="#3d2b1f"/>'
    + '<g transform="translate(46,33)"><circle cx="0" cy="0" r="2.7" fill="#3d2b1f"/>' + petals(0, 0, 2.6, 6, '#f4be3a') + '</g>'
    + '<circle cx="29" cy="43" r="2" fill="#3d2b1f"/><circle cx="39" cy="43" r="2" fill="#3d2b1f"/>'
    + '<path d="M30 48 Q34 51 38 48" stroke="#3d2b1f" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
    + '<path d="M20 64 Q17 68 14 73" stroke="#3d2b1f" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
    + '</g>'
    + '</svg>'
}

/* growing sunflower — one stage 0..6 mapped to overall progress */
function growLeaf(x: number, y: number, side: number): string {
  const d = side > 0
    ? `M${x} ${y} q 13 -10 24 -2 q -8 10 -24 2 z`
    : `M${x} ${y} q -13 -10 -24 -2 q 8 10 24 2 z`
  return `<path d="${d}" fill="#7e8a56" stroke="#6f7d45" stroke-width="1"/>`
}
function growSunflower(stage: number): string {
  const baseX = 44, baseY = 134
  const h = 14 + stage * 13
  const topY = baseY - h
  const midX = baseX + (stage % 2 ? 6 : -6)
  let s = '<svg viewBox="0 0 96 140" width="60" height="88" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
  s += '<ellipse cx="44" cy="135" rx="22" ry="5" fill="#5c3620" opacity=".5"/>'
  if (stage === 0) {
    s += '<path d="M44 135 q0 -11 0 -16" stroke="#6f7d45" stroke-width="3.2" fill="none" stroke-linecap="round"/>'
    s += growLeaf(44, 120, 1) + growLeaf(44, 120, -1)
    s += '<circle cx="44" cy="109" r="5.2" fill="#9aa86b"/>'
  } else {
    s += `<path d="M${baseX} ${baseY} Q ${midX} ${(baseY + topY) / 2} ${baseX} ${topY}" stroke="#6f7d45" stroke-width="3.4" fill="none" stroke-linecap="round"/>`
    const nl = Math.min(stage, 4)
    for (let i = 0; i < nl; i++) {
      const ly = baseY - 16 - i * (h - 22) / Math.max(nl, 1)
      s += growLeaf(baseX + (i % 2 ? 2 : -2), ly, i % 2 ? 1 : -1)
    }
    const cx = baseX, cy = topY
    if (stage >= 5) {
      const np = 14, open = (stage >= 6 ? 1 : 0.72), pr = 10 + stage * 1.5
      for (let p = 0; p < np; p++) {
        const a = (p / np) * Math.PI * 2
        const ex = cx + Math.cos(a) * 5, ey = cy + Math.sin(a) * 5
        s += `<g transform="translate(${ex.toFixed(1)} ${ey.toFixed(1)}) rotate(${(a * 180 / Math.PI + 90).toFixed(1)})"><ellipse cx="0" cy="${(-pr * open).toFixed(1)}" rx="4.2" ry="${(pr * open).toFixed(1)}" fill="#f4be3a"/></g>`
      }
      s += `<circle cx="${cx}" cy="${cy}" r="10" fill="#3d2b1f"/><circle cx="${cx}" cy="${cy}" r="10" fill="none" stroke="#ffcf5a" stroke-width="2"/>`
      if (stage >= 6) {
        s += `<circle cx="${cx - 3.4}" cy="${cy - 1}" r="1.4" fill="#fff2cf"/><circle cx="${cx + 3.4}" cy="${cy - 1}" r="1.4" fill="#fff2cf"/><path d="M${cx - 3.4} ${cy + 3.4} q3.4 3.4 6.8 0" stroke="#fff2cf" stroke-width="1.3" fill="none" stroke-linecap="round"/>`
      }
    } else {
      const fill = stage >= 4 ? '#e7b64a' : '#8a9a5c'
      s += `<path d="M${cx} ${cy - 11} q 9 5 7 12 q -7 6 -14 0 q -2 -7 7 -12 z" fill="${fill}" stroke="#6f7d45" stroke-width="1.2"/>`
      if (stage >= 4) {
        s += `<path d="M${cx} ${cy - 12} q5 -3 3 -8" stroke="#f4be3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
      }
    }
  }
  s += '</svg>'
  return s
}

/* All character/scene art is static — build each variant ONCE so the template
   references a stable string. Rebuilding these on every render made Vue re-parse
   the v-html of every page on each reactive tick during a flip. */
const ART = {
  jayIntro: jay(92, 'r'),
  lichiIntro: lichi(92, 'l'),
  jayLand: jay(78),
  lichiLand: lichi(78),
  jayFut: jay(70, 'r'),
  lichiFut: lichi(70, 'l'),
  call: callScene(),
  moon64: moon(64),
  moon58: moon(58),
  plane: plane(),
  landKo: landMound('#e7d3ab'),
  landTw: landMound('#d7e0b0'),
  hand: handFlower(),
} as const

/* =========================================================
   Page-turn engine (CSS 3D rotateY around the left spine)
   ========================================================= */
const reduceMotion = typeof window !== 'undefined'
  && window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const busy = ref(false)
const flippingIndex = ref<number | null>(null)
const noAnim = ref(false)
const hintHidden = ref(false)

/* Map global page index -> its DOM element. Populated by the :ref callback so it
   stays correct even though only a windowed subset of pages is mounted. */
const pageElMap = new Map<number, HTMLElement>()
function setPageEl(index: number, el: Element | null) {
  if (el) pageElMap.set(index, el as HTMLElement)
  else pageElMap.delete(index)
}

const timers = new Set<ReturnType<typeof setTimeout>>()
function later(fn: () => void, ms: number) {
  const id = setTimeout(() => { timers.delete(id); fn() }, ms)
  timers.add(id)
  return id
}

function zFor(index: number): number {
  if (flippingIndex.value === index) return 300
  if (index < current.value) return index
  return total.value - index
}

function waitFlip(idx: number): Promise<void> {
  return new Promise((resolve) => {
    if (reduceMotion) { resolve(); return }
    const el = pageElMap.get(idx)
    let done = false
    const finish = () => {
      if (done) return
      done = true
      el?.removeEventListener('transitionend', onEnd)
      resolve()
    }
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName === 'transform') finish()
    }
    el?.addEventListener('transitionend', onEnd)
    later(finish, 800)
  })
}

async function goNext() {
  if (busy.value || !engine.canGoForward.value) return
  hideHint()
  const flipIdx = current.value
  if (reduceMotion) { engine.flipForward(); return }
  busy.value = true
  flippingIndex.value = flipIdx
  engine.flipForward()
  await waitFlip(flipIdx)
  flippingIndex.value = null
  busy.value = false
}

async function goPrev() {
  if (busy.value || !engine.canGoBack.value) return
  hideHint()
  const flipIdx = current.value - 1
  if (reduceMotion) { engine.flipBack(); return }
  busy.value = true
  flippingIndex.value = flipIdx
  engine.flipBack()
  await waitFlip(flipIdx)
  flippingIndex.value = null
  busy.value = false
}

function goToPage(idx: number) {
  if (busy.value || idx === current.value || idx < 0 || idx >= total.value) return
  if (idx === current.value + 1) { void goNext(); return }
  if (idx === current.value - 1) { void goPrev(); return }
  hideHint()
  // Multi-page jump: snap without the per-page turn to avoid a messy cascade.
  noAnim.value = true
  engine.goToPage(idx)
  requestAnimationFrame(() => requestAnimationFrame(() => { noAnim.value = false }))
}

function onRestart() {
  emit('restart')
}

/* ---------- input ---------- */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); void goNext() }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); void goPrev() }
}

let touchX = 0, touchY = 0, tracking = false
function onTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1) return
  touchX = e.touches[0].clientX
  touchY = e.touches[0].clientY
  tracking = true
}
function onTouchEnd(e: TouchEvent) {
  if (!tracking) return
  tracking = false
  const dx = e.changedTouches[0].clientX - touchX
  const dy = e.changedTouches[0].clientY - touchY
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
    if (dx < 0) void goNext()
    else void goPrev()
  }
}

let hintTimer: ReturnType<typeof setTimeout> | undefined
function hideHint() {
  hintHidden.value = true
  if (hintTimer) { clearTimeout(hintTimer); hintTimer = undefined }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  hintTimer = setTimeout(() => { hintHidden.value = true }, 4200)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  if (hintTimer) clearTimeout(hintTimer)
  timers.forEach(clearTimeout)
  timers.clear()
})
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- decorative SVG art is static, developer-authored (no user input) -->
  <div
    class="diary-stage"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <!-- progress dots -->
    <div class="diary-progress">
      <button
        v-for="(p, i) in engine.pages.value"
        :key="p.id"
        type="button"
        class="diary-dot"
        :class="{ active: i === current }"
        :aria-label="`${i + 1} / ${total}`"
        @click="goToPage(i)"
      />
    </div>

    <div class="diary-book-area">
      <div class="diary-book">
        <div
          v-for="{ page, index } in windowPages"
          :key="page.id"
          :ref="(el) => setPageEl(index, el as Element | null)"
          class="diary-page"
          :class="[
            page.section,
            {
              flipped: index < current,
              flipping: flippingIndex === index,
              'no-anim': noAnim,
            },
          ]"
          :style="{ zIndex: zFor(index) }"
        >
          <div class="page-front">
            <div class="page-inner">
              <!-- INTRO -->
              <template v-if="page.section === 'intro'">
                <div class="intro-block">
                  <div class="eyebrow">
                    ❤
                  </div>
                  <h2 class="title">
                    {{ t(introChapterLabel) }}
                  </h2>
                  <div class="rule" />
                  <div class="intro-map">
                    <div class="moon-wrap svg-slot">
                      <!-- eslint-disable-next-line vue/no-v-html -->
                      <span v-html="ART.moon64" />
                    </div>
                    <div class="plane-row svg-slot">
                      <span class="dist-badge">1,478km ✈</span>
                      <!-- eslint-disable-next-line vue/no-v-html -->
                      <span v-html="ART.plane" />
                    </div>
                    <div class="lands">
                      <div class="land">
                        <div class="svg-slot">
                          <!-- eslint-disable-next-line vue/no-v-html -->
                          <span v-html="ART.jayLand" />
                        </div>
                        <!-- eslint-disable-next-line vue/no-v-html -->
                        <span
                          class="svg-slot"
                          v-html="ART.landKo"
                        />
                        <div class="land-label">
                          {{ t(koreaLabel) }}
                        </div>
                        <div class="land-name">
                          Jay
                        </div>
                      </div>
                      <div class="land">
                        <div class="svg-slot">
                          <!-- eslint-disable-next-line vue/no-v-html -->
                          <span v-html="ART.lichiLand" />
                        </div>
                        <!-- eslint-disable-next-line vue/no-v-html -->
                        <span
                          class="svg-slot"
                          v-html="ART.landTw"
                        />
                        <div class="land-label">
                          {{ t(taiwanLabel) }}
                        </div>
                        <div class="land-name">
                          苙綺
                        </div>
                      </div>
                    </div>
                  </div>
                  <p class="intro-map-note">
                    {{ t(introMapNote) }}
                  </p>
                </div>
              </template>

              <!-- TIMELINE -->
              <template v-else-if="page.section === 'timeline'">
                <!-- fixed header: story label + title + date -->
                <div class="tl-head">
                  <div class="eyebrow">
                    {{ t(storyChapterLabel) }}
                  </div>
                  <h2 class="title small">
                    {{ t(timelineItem(page).title) }}
                  </h2>
                  <div class="rule" />
                  <div class="tl-date">
                    {{ formatDate(timelineItem(page).date) }}
                  </div>
                </div>
                <!-- scrollable body: story paragraphs (media lives on the next page) -->
                <div class="tl-body">
                  <p
                    v-for="(para, pi) in timelineParagraphs(page)"
                    :key="pi"
                    class="tl-text"
                  >
                    {{ para }}
                  </p>
                </div>
              </template>

              <!-- TIMELINE MEDIA (hero + thumbnails) -->
              <template v-else-if="page.section === 'timeline-media'">
                <div class="tlm-head">
                  <div class="eyebrow">
                    {{ t(storyChapterLabel) }}
                  </div>
                  <h2 class="title small">
                    {{ t(timelineItem(page).title) }}
                  </h2>
                  <div class="tl-date">
                    {{ formatDate(timelineItem(page).date) }}
                  </div>
                </div>

                <div class="tlm-hero-wrap">
                  <div
                    class="tlm-hero"
                    :class="{ 'is-video': activeTile(page)?.kind === 'video' }"
                  >
                    <div class="tlm-hero-inner">
                      <template
                        v-for="(tile, i) in mediaTiles(page)"
                        :key="tile.id"
                      >
                        <video
                          v-if="tile.kind === 'video' && tile.hasCustomMedia"
                          class="tlm-layer"
                          :class="{ on: i === selIdx(page) }"
                          :src="tile.src"
                          autoplay
                          loop
                          muted
                          playsinline
                          preload="metadata"
                          aria-hidden="true"
                        />
                        <img
                          v-else
                          class="tlm-layer"
                          :class="{ on: i === selIdx(page) }"
                          :src="tile.kind === 'video' ? tile.placeholderSrc : tile.src"
                          alt=""
                          decoding="async"
                          @error="(e) => onTileError(e, tile)"
                        >
                      </template>
                    </div>
                    <div
                      v-if="activeTile(page)?.kind === 'video'"
                      class="tlm-vfx"
                    >
                      <div class="tlm-scrim" />
                      <div class="tlm-live">
                        <span class="dot" />LIVE
                      </div>
                      <div class="tlm-play" />
                      <div class="tlm-shine" />
                    </div>
                  </div>
                  <div class="tlm-cap">
                    <template v-if="activeTile(page)?.kind === 'video'">
                      ▶ {{ t(clipLabel) }}
                    </template>
                    <template v-else>
                      {{ selIdx(page) + 1 }} / {{ mediaTiles(page).length }}
                    </template>
                  </div>
                </div>

                <div
                  class="tlm-thumbs"
                  role="tablist"
                >
                  <button
                    v-for="(tile, i) in mediaTiles(page)"
                    :key="tile.id"
                    type="button"
                    class="tlm-thumb"
                    :class="{ active: i === selIdx(page) }"
                    role="tab"
                    :aria-selected="i === selIdx(page) ? 'true' : 'false'"
                    :aria-label="`${i + 1} / ${mediaTiles(page).length}`"
                    @click="selectMedia(page.id, i)"
                  >
                    <img
                      :src="thumbSrc(tile)"
                      alt=""
                      decoding="async"
                    >
                    <span
                      v-if="tile.kind === 'video'"
                      class="tlm-vtag"
                      aria-hidden="true"
                    />
                  </button>
                </div>
                <div class="tlm-hint">
                  {{ t(mediaHint) }}
                </div>
              </template>

              <!-- MEMORY -->
              <template v-else-if="page.section === 'memory'">
                <div class="eyebrow">
                  {{ t(memoryChapterLabel) }}
                </div>
                <h2 class="title small">
                  {{ t(memoryItem(page).title) }}
                </h2>
                <div class="rule" />
                <div class="mem-card">
                  <div class="mem-photo">
                    <svg
                      width="40"
                      height="34"
                      viewBox="0 0 40 34"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="13"
                        cy="12"
                        r="5"
                        fill="rgba(255,255,255,.65)"
                      />
                      <path
                        d="M3 30 L15 17 L23 25 L29 19 L37 30 Z"
                        fill="rgba(255,255,255,.5)"
                      />
                    </svg>
                  </div>
                </div>
                <p class="mem-caption">
                  {{ t(memoryItem(page).description) }}
                </p>
              </template>

              <!-- KOREA & TAIWAN -->
              <template v-else-if="page.section === 'korea-taiwan'">
                <div class="eyebrow">
                  {{ t(ktChapterLabel) }}
                </div>
                <template v-if="page.id === 'korea-taiwan-1'">
                  <h2 class="title small">
                    {{ t(koreaLabel) }} · {{ t(taiwanLabel) }}
                  </h2>
                  <div class="rule" />
                  <div class="map-scene">
                    <div class="moon-wrap svg-slot">
                      <!-- eslint-disable-next-line vue/no-v-html -->
                      <span v-html="ART.moon64" />
                    </div>
                    <div class="plane-row svg-slot">
                      <span class="dist-badge">1,478km ✈</span>
                      <!-- eslint-disable-next-line vue/no-v-html -->
                      <span v-html="ART.plane" />
                    </div>
                    <div class="lands">
                      <div class="land">
                        <div class="svg-slot">
                          <!-- eslint-disable-next-line vue/no-v-html -->
                          <span v-html="ART.jayLand" />
                        </div>
                        <!-- eslint-disable-next-line vue/no-v-html -->
                        <span
                          class="svg-slot"
                          v-html="ART.landKo"
                        />
                        <div class="land-label">
                          {{ t(koreaLabel) }}
                        </div>
                        <div class="land-name">
                          Jay
                        </div>
                      </div>
                      <div class="land">
                        <div class="svg-slot">
                          <!-- eslint-disable-next-line vue/no-v-html -->
                          <span v-html="ART.lichiLand" />
                        </div>
                        <!-- eslint-disable-next-line vue/no-v-html -->
                        <span
                          class="svg-slot"
                          v-html="ART.landTw"
                        />
                        <div class="land-label">
                          {{ t(taiwanLabel) }}
                        </div>
                        <div class="land-name">
                          苙綺
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="rule" />
                  <div class="map-note-scene">
                    <div class="moon-wrap svg-slot">
                      <!-- eslint-disable-next-line vue/no-v-html -->
                      <span v-html="ART.moon58" />
                    </div>
                    <p class="map-note">
                      {{ t(mapText) }}
                    </p>
                  </div>
                </template>
              </template>

              <!-- FUTURE -->
              <template v-else-if="page.section === 'future'">
                <h2 class="title small">
                  {{ t(futureChapterLabel) }}
                </h2>
                <div class="rule" />
                <div class="fut-list">
                  <div
                    v-for="(wish, wi) in wishesOf(page)"
                    :key="wish.id"
                    class="fut-item"
                    :class="['m' + (wi % 3)]"
                  >
                    <span class="fut-check">✿</span>
                    <span>{{ t(wish.text) }}</span>
                  </div>
                </div>
                <div class="fut-scene svg-slot">
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <span v-html="ART.jayFut" />
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <span v-html="ART.lichiFut" />
                </div>
              </template>

              <!-- LETTER -->
              <template v-else-if="page.section === 'letter'">
                <div class="eyebrow">
                  {{ t(letterChapterLabel) }}
                </div>
                <div class="letter-scene svg-slot">
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <span v-html="ART.hand" />
                </div>
                <div
                  v-fit-letter
                  class="letter-body"
                >
                  <p
                    v-for="(para, pi) in letterParagraphs(page)"
                    :key="pi"
                  >
                    {{ para }}
                  </p>
                </div>
              </template>

              <!-- ENDING -->
              <template v-else-if="page.section === 'ending'">
                <PageEndingCake
                  :active="current === total - 1"
                  :locale="props.locale"
                  @restart="onRestart"
                />
              </template>
            </div>
          </div>
          <div
            class="page-back"
            aria-hidden="true"
          />
        </div>
      </div>

      <!-- tap zones -->
      <div
        class="tap-zone tap-left"
        :class="{ inset: currentIsMedia }"
        @click="goPrev"
      />
      <div
        class="tap-zone tap-right"
        :class="{ inset: currentIsMedia }"
        @click="goNext"
      />

      <!-- nav hints -->
      <div
        class="nav-hint l"
        :class="{ hide: hintHidden }"
      >
        ‹
      </div>
      <div
        class="nav-hint r"
        :class="{ hide: hintHidden }"
      >
        ›
      </div>

      <!-- swipe hint -->
      <div
        class="float-hint"
        :class="{ hide: hintHidden }"
      >
        {{ t(uiText.swipeHint) }}
      </div>

      <!-- folio -->
      <div class="diary-folio">
        {{ current + 1 }} / {{ total }}
      </div>
    </div>

    <!-- growing sunflower garden -->
    <div class="diary-garden">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div
        class="growbox"
        v-html="gardenSvg"
      />
    </div>
  </div>
</template>

<style scoped>
.diary-stage {
  --cream: #fff9ed;
  --paper: #f3e6c8;
  --gold: #f4be3a;
  --amber: #ffb85c;
  --brown: #3d2b1f;
  --brown-soft: #6b5442;
  --rose: #f0907a;
  --leaf: #7e8a56;
  --ink: #4a3626;
  --line: #cbb083;
  --serif-kr: "Noto Serif KR", "Noto Serif TC", serif;
  --serif-tc: "Noto Serif TC", serif;
  --hand: "Gaegu", "Gowun Dodum", cursive;
  --round: "Gowun Dodum", Pretendard, sans-serif;

  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  background:
    radial-gradient(120% 90% at 50% 0%, #f0dcb3 0%, #e3cb9f 55%, #d8bd8c 100%);
  color: var(--ink);
  font-family: var(--serif-kr);
  overflow: hidden;
  padding: 0 12px;
}

/* ---------- progress dots ---------- */
.diary-progress {
  position: absolute;
  top: calc(10px + var(--safe-top));
  left: 50%;
  transform: translateX(-50%);
  z-index: 60;
  display: flex;
  gap: 5px;
  max-width: calc(100% - 96px);
  flex-wrap: wrap;
  justify-content: center;
  padding: 6px 10px;
  background: rgba(255, 249, 237, 0.9);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(61, 43, 31, 0.1);
}
.diary-dot {
  width: 7px;
  height: 7px;
  min-width: 7px;
  min-height: 7px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--line);
  transition: all 0.35s ease;
  cursor: pointer;
}
.diary-dot.active {
  background: var(--gold);
  width: 16px;
  border-radius: 4px;
}

/* ---------- book area ---------- */
.diary-book-area {
  position: relative;
  width: 100%;
  max-width: 430px;
  flex: 1;
  min-height: 0;
  margin-top: 6px;
  perspective: 1500px;
  perspective-origin: 50% 45%;
}

.diary-book {
  position: absolute;
  inset: 14px 6px 6px 10px;
  transform-style: preserve-3d;
}
/* spine / binding thickness */
.diary-book::before {
  content: "";
  position: absolute;
  left: -7px;
  top: 10px;
  bottom: 10px;
  width: 16px;
  border-radius: 8px 3px 3px 8px;
  background: linear-gradient(90deg, #b98a4e, #d9b06f 40%, #c79a58);
  box-shadow: inset -2px 0 4px rgba(0, 0, 0, 0.25), -3px 4px 10px rgba(0, 0, 0, 0.22);
  z-index: 0;
}

/* Rotation container only — it carries the transform, its two faces carry the
   paper. Keeping overflow off the preserve-3d element is what lets the back face
   render as a real second side (overflow:hidden would flatten it). */
.diary-page {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform-origin: left center;
  /* Only ~3 pages are ever mounted (windowed), so promoting each to its own
     compositor layer is cheap and lets the turn stay transform-only (no repaint
     per frame) and avoids a promote-on-flip-start hitch. */
  will-change: transform;
  transition: transform 0.68s cubic-bezier(0.33, 0, 0.2, 1);
}
.diary-page.no-anim {
  transition: none !important;
}
.diary-page.flipped {
  transform: rotateY(-180deg);
}

/* the two physical sides of the leaf */
.page-front,
.page-back {
  position: absolute;
  inset: 0;
  border-radius: 6px 12px 12px 6px;
  overflow: hidden;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.page-front {
  background:
    linear-gradient(90deg, rgba(180, 150, 100, 0.18) 0, rgba(180, 150, 100, 0) 6%),
    radial-gradient(140% 120% at 100% 0%, #fffdf6 0%, var(--cream) 40%, var(--paper) 100%);
  box-shadow: inset 0 0 22px rgba(203, 176, 131, 0.22), 0 12px 26px -16px rgba(61, 43, 31, 0.42);
}
/* back of the turning page — plain cream paper, slightly shaded toward the
   spine so the sheet reads as it swings over instead of vanishing at 90deg */
.page-back {
  transform: rotateY(180deg);
  background:
    linear-gradient(270deg, rgba(120, 92, 50, 0.22) 0, rgba(120, 92, 50, 0) 22%),
    radial-gradient(130% 120% at 0% 0%, #fffdf6 0%, var(--cream) 45%, var(--paper) 100%);
  box-shadow: inset 0 0 22px rgba(203, 176, 131, 0.2);
}
/* warm vignette */
.page-front::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 60% at 50% -10%, rgba(244, 190, 58, 0.1), transparent 60%),
    radial-gradient(120% 60% at 50% 110%, rgba(126, 138, 86, 0.08), transparent 60%);
  pointer-events: none;
  z-index: 3;
}
/* binding shadow on the left edge */
.page-front::after {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 30px;
  background: linear-gradient(90deg, rgba(120, 92, 50, 0.28), rgba(120, 92, 50, 0));
  pointer-events: none;
  z-index: 4;
}

.page-inner {
  position: relative;
  z-index: 5;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 30px 24px 20px 34px;
  overflow: hidden;
}

/* ---------- shared bits ---------- */
.eyebrow {
  font-family: var(--hand);
  font-size: 16px;
  color: var(--rose);
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  flex: none;
}
.title {
  font-family: var(--serif-kr);
  font-weight: 700;
  font-size: 25px;
  color: var(--brown);
  line-height: 1.3;
  letter-spacing: -0.5px;
  flex: none;
}
.title.small {
  font-size: 20px;
}
.rule {
  width: 44px;
  height: 3px;
  border-radius: 3px;
  background: var(--gold);
  margin: 10px 0 6px;
  flex: none;
}
.svg-slot :deep(svg) {
  display: block;
}

/* ---------- intro ---------- */
.intro-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.intro-block .eyebrow {
  font-size: 20px;
}
.intro-block .rule {
  margin: 12px auto 8px;
}
.intro-map {
  margin-top: 8px;
}
.intro-map-note {
  font-family: var(--round);
  font-size: 14px;
  color: var(--brown-soft);
  line-height: 1.75;
  margin-top: 18px;
  max-width: 21em;
}
.intro-sub {
  font-family: var(--round);
  font-size: 14.5px;
  color: var(--brown-soft);
  line-height: 1.7;
  margin-top: 6px;
}
.intro-stats {
  display: flex;
  gap: 14px;
  margin-top: 20px;
}
.stat {
  border: 1.5px solid rgba(203, 176, 131, 0.7);
  border-radius: 12px;
  padding: 12px 20px;
  background: rgba(255, 253, 246, 0.6);
}
.stat-num {
  display: block;
  font-family: var(--serif-tc);
  font-weight: 700;
  font-size: 32px;
  line-height: 1;
  color: var(--gold);
}
.stat-lbl {
  display: block;
  margin-top: 6px;
  font-family: var(--round);
  font-size: 11px;
  letter-spacing: 1.5px;
  color: var(--brown-soft);
}
.intro-scene {
  display: flex;
  gap: 2px;
  align-items: flex-end;
  justify-content: center;
  margin: 18px 0 10px;
}
.intro-dates {
  font-family: var(--hand);
  font-size: 17px;
  color: var(--brown);
  letter-spacing: 0.5px;
}

/* ---------- timeline ---------- */
/* Fixed header (label + title + date) never shrinks; the body below scrolls so
   long entries (esp. 2026-06-26) are never clipped on short viewports. */
.tl-head {
  flex: none;
}
.tl-date {
  position: relative;
  padding-left: 18px;
  margin-top: 2px;
  font-family: var(--hand);
  font-size: 15px;
  color: var(--rose);
  letter-spacing: 0.5px;
}
.tl-date::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 0 3px rgba(244, 190, 58, 0.28);
}
.tl-body {
  flex: 1;
  min-height: 0;
  margin-top: 10px;
  padding-right: 4px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
.tl-text {
  font-family: var(--round);
  font-size: 13.5px;
  color: var(--ink);
  line-height: 1.7;
  margin: 0 0 0.7em;
}
.tl-text:last-child {
  margin-bottom: 0;
}
/* ---------- timeline media page (hero + thumbnails) ---------- */
.tlm-head {
  flex: none;
}
.tlm-hero-wrap {
  flex: none;
  margin-top: 12px;
}
.tlm-hero {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  max-height: 46vh;
  border-radius: 16px;
  overflow: hidden;
  background: var(--paper);
  padding: 7px; /* photo mat */
  box-shadow: 0 10px 24px rgba(120, 80, 30, 0.22), inset 0 2px 0 rgba(255, 255, 255, 0.5);
}
.tlm-hero-inner {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  overflow: hidden;
  background: var(--paper);
}
.tlm-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity 0.45s ease;
}
.tlm-layer.on {
  opacity: 1;
}
.tlm-vfx {
  position: absolute;
  inset: 7px;
  border-radius: 10px;
  overflow: hidden;
  pointer-events: none;
}
.tlm-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(30, 18, 8, 0.34), transparent 55%);
}
.tlm-live {
  position: absolute;
  top: 11px;
  left: 11px;
  font-family: var(--hand);
  font-weight: 700;
  font-size: 12.5px;
  color: #fff;
  background: var(--rose);
  padding: 3px 9px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
.tlm-live .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff;
  animation: tlm-blink 1.3s infinite ease-in-out;
}
.tlm-play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 249, 237, 0.9);
  border: 2px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 6px 18px rgba(40, 25, 15, 0.3);
}
.tlm-play::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-42%, -50%);
  border-style: solid;
  border-width: 11px 0 11px 18px;
  border-color: transparent transparent transparent var(--rose);
}
.tlm-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 40%, rgba(255, 255, 255, 0.35) 50%, transparent 60%);
  background-size: 250% 100%;
  background-position: 200% 0;
  mix-blend-mode: screen;
  animation: tlm-shimmer 2.6s linear infinite;
}
.tlm-cap {
  text-align: center;
  font-family: var(--hand);
  color: var(--ink);
  font-size: 15px;
  margin: 10px 0 2px;
  min-height: 20px;
}
.tlm-thumbs {
  margin-top: auto;
  padding-top: 10px;
  display: flex;
  gap: 8px;
  justify-content: center;
}
.tlm-thumb {
  position: relative;
  flex: 1 1 0;
  max-width: 68px;
  aspect-ratio: 1 / 1;
  border-radius: 11px;
  overflow: hidden;
  cursor: pointer;
  background: var(--paper);
  padding: 3px;
  border: 2px solid transparent;
  box-shadow: 0 3px 9px rgba(120, 80, 30, 0.18);
  transition: transform 0.2s ease, border-color 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}
.tlm-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  display: block;
}
.tlm-thumb.active {
  border-color: var(--gold);
  transform: translateY(-3px);
}
.tlm-vtag {
  position: absolute;
  inset: 3px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: rgba(30, 18, 8, 0.28);
}
.tlm-vtag::before {
  content: "";
  border-style: solid;
  border-width: 7px 0 7px 12px;
  border-color: transparent transparent transparent #fff;
  margin-left: 2px;
}
.tlm-hint {
  text-align: center;
  font-family: var(--hand);
  color: #c99a2e;
  font-size: 12.5px;
  margin-top: 9px;
  opacity: 0.85;
  flex: none;
}
@keyframes tlm-shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -100% 0;
  }
}
@keyframes tlm-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.25;
  }
}
@media (prefers-reduced-motion: reduce) {
  .tlm-layer {
    transition: none;
  }
  .tlm-shine,
  .tlm-live .dot {
    animation: none;
  }
}

/* ---------- memory ---------- */
.mem-card {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 14px;
}
.mem-photo {
  width: 62%;
  aspect-ratio: 4 / 3;
  border-radius: 4px;
  padding: 8px;
  background: linear-gradient(135deg, #fbf0d6, #f0dfb8);
  box-shadow: 0 4px 10px rgba(61, 43, 31, 0.14);
  transform: rotate(-2deg);
  display: flex;
  align-items: center;
  justify-content: center;
}
.mem-photo svg {
  opacity: 0.9;
}
.mem-caption {
  flex: none;
  margin-top: 16px;
  text-align: center;
  font-family: var(--hand);
  font-size: 15px;
  color: var(--brown);
  line-height: 1.5;
}

/* ---------- korea & taiwan ---------- */
.map-scene,
.map-note-scene {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.moon-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 6px;
}
.plane-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 4px 0 10px;
}
.dist-badge {
  font-family: var(--hand);
  font-size: 15px;
  color: var(--brown);
  background: rgba(255, 249, 237, 0.9);
  border: 1.5px solid var(--gold);
  padding: 3px 12px;
  border-radius: 14px;
  white-space: nowrap;
}
.lands {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
}
.land {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.land-label {
  font-family: var(--serif-kr);
  font-weight: 600;
  font-size: 16px;
  color: var(--brown);
  margin-top: 4px;
}
.land-name {
  font-family: var(--round);
  font-size: 12px;
  color: var(--brown-soft);
}
.map-note {
  text-align: center;
  font-family: var(--round);
  font-size: 14px;
  color: var(--brown-soft);
  line-height: 1.8;
  margin-top: 10px;
}

/* ---------- future ---------- */
.fut-list {
  margin-top: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
  overflow: hidden;
}
.fut-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--round);
  font-size: 13.5px;
  color: var(--ink);
  line-height: 1.35;
}
.fut-check {
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid var(--gold);
  background: rgba(244, 190, 58, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--gold);
}
.fut-item.m1 .fut-check {
  border-color: var(--rose);
  color: var(--rose);
  background: rgba(240, 144, 122, 0.14);
}
.fut-item.m2 .fut-check {
  border-color: var(--leaf);
  color: var(--leaf);
  background: rgba(126, 138, 86, 0.14);
}
.fut-scene {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 6px;
  flex: none;
}

/* ---------- letter ---------- */
.letter-scene {
  display: flex;
  justify-content: center;
  margin: 2px 0 4px;
  flex: none;
}
.letter-scene :deep(svg) {
  width: 138px;
  height: auto;
}
/* Ruling lives on the body itself and shares the text line-height, so the lines
   always sit under the writing instead of drifting out of alignment. */
.letter-body {
  font-family: var(--hand);
  /* --fs / --lh are auto-fitted per letter by v-fit-letter so long letters
     shrink to fit any viewport height instead of getting clipped. */
  --fs: 16px;
  --lh: 24px;
  font-size: var(--fs);
  line-height: var(--lh);
  color: var(--ink);
  flex: 1;
  min-height: 0;
  /* Auto-fit shrinks most letters to fit; on very short viewports the longest
     letters fall back to scrolling so no line is ever lost. */
  overflow: hidden auto;
  -webkit-overflow-scrolling: touch;
  background:
    repeating-linear-gradient(transparent 0 calc(var(--lh) - 1px), rgba(203, 176, 131, 0.26) calc(var(--lh) - 1px) var(--lh));
}
.letter-body p {
  margin: 0;
  color: var(--ink);
}
/* keep the letter text clear of the growing sunflower in the bottom-left */
.diary-page.letter .page-inner,
.diary-page.timeline .page-inner {
  padding-bottom: 40px;
}
.diary-page.timeline-media .page-inner {
  padding-bottom: 18px;
}

/* ---------- ending (cake celebration lives in PageEndingCake.vue) ---------- */
/* Let the cake scene reach the page edges instead of sitting inside the reading
   text padding, so the canvas fireworks fill the whole leaf. */
.diary-page.ending .page-inner {
  padding: 0;
}

/* ---------- tap zones + hints ---------- */
.tap-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 40%;
  z-index: 40;
  cursor: pointer;
}
.tap-left { left: 0; }
.tap-right { right: 0; }
/* On the media page, free the bottom rail so thumbnails are tappable full-width. */
.tap-zone.inset { bottom: 104px; }

.nav-hint {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 30;
  font-size: 26px;
  color: var(--brown);
  opacity: 0.16;
  pointer-events: none;
  transition: opacity 0.5s ease;
}
.nav-hint.l { left: 4px; }
.nav-hint.r { right: 4px; }
.nav-hint.hide { opacity: 0; }

.float-hint {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 45;
  font-family: var(--round);
  font-size: 11.5px;
  color: var(--brown-soft);
  background: rgba(255, 249, 237, 0.72);
  padding: 4px 12px;
  border-radius: 14px;
  white-space: nowrap;
  transition: opacity 0.5s ease;
}
.float-hint.hide {
  opacity: 0;
}

.diary-folio {
  position: absolute;
  bottom: 10px;
  left: 12px;
  z-index: 45;
  font-family: var(--round);
  font-size: 12px;
  color: var(--brown-soft);
  letter-spacing: 1px;
  background: rgba(255, 249, 237, 0.72);
  padding: 3px 10px;
  border-radius: 12px;
}

/* ---------- growing sunflower garden ---------- */
.diary-garden {
  position: relative;
  flex: none;
  width: 100%;
  max-width: 430px;
  height: 64px;
}
.diary-garden::before {
  content: "";
  position: absolute;
  left: -12px;
  right: -12px;
  bottom: 0;
  height: 34px;
  background: linear-gradient(#7a4a29, #6b3f24);
}
.diary-garden::after {
  content: "";
  position: absolute;
  left: -12px;
  right: -12px;
  bottom: 34px;
  height: 6px;
  background:
    radial-gradient(6px 5px at 40px 3px, #5c3620, transparent),
    radial-gradient(6px 5px at 120px 4px, #5c3620, transparent),
    radial-gradient(6px 5px at 220px 3px, #5c3620, transparent),
    radial-gradient(6px 5px at 320px 4px, #5c3620, transparent),
    linear-gradient(#8a5730, #6b3f24);
  opacity: 0.9;
}
.growbox {
  position: absolute;
  left: 22px;
  bottom: 8px;
  width: 60px;
  height: 88px;
  pointer-events: none;
  z-index: 2;
}
.growbox :deep(svg) {
  position: absolute;
  bottom: 0;
  left: 0;
}

@media (max-width: 360px) {
  .title { font-size: 22px; }
}

@media (prefers-reduced-motion: reduce) {
  .diary-page { transition: none !important; }
}
</style>
