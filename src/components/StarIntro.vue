<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { getLocalizedText, type Locale, type LocalizedText } from '@/content/localization'
import { starIntro } from '@/content/starIntro'
import {
  starIntroPhotoSlots,
  starIntroVideoSlot,
  type StarIntroCaption,
} from '@/content/starIntroMedia'
import { uiText } from '@/content/ui'

// Constellation tour → grand fireworks → star-drop gift box, ported from
// design-lab/grand-celebration-lab/03-grand-heart-classic.html (which derives
// its box + golden-hour landing from constellation-lab/11-tour-to-giftbox.html).
//
// Flow:
//   Phase 1 (tour, unchanged) — full constellation tour: establishing wide
//     shot + title, camera pans through 4 clusters blooming photo-stars and
//     drawing lines, then pulls out to reveal the whole constellation.
//   Phase 2 (invite) — a tap prompt; the tap starts the CELEBRATION.
//   Phase A (fireworks) — a canvas particle engine plays waves of classic
//     multi-ring + heart bursts building to a dual finale (giant heart + full
//     -sky barrage + screen flash) over the dimmed night sky, then resolves a
//     celebration message (gold 100 hero + title + sub + footer).
//   Phase B (star → box → meteor → golden) — one bright star flares, morphs
//     into a compact gift-box "meteor" and plummets on an eased arc while the
//     sky cross-fades night → golden hour; on impact a warm flash + spark ring
//     lands the full cream gift box under the god-ray.
//   Handoff — ~900ms after the box settles it auto-finishes (emits `completed`)
//     so the App swaps to the real WebGL gift scene, which fades in from the
//     same golden hour.
//
// All copy renders live from L() so switching language mid-intro updates
// everything (title, prompts, celebration message, star captions, name tag).

const props = defineProps<{ locale: Locale }>()
const emit = defineEmits<{ completed: [] }>()

const importedPhotos = import.meta.glob<string>(
  '/src/assets/intro-media/photos/*.webp',
  { eager: true, import: 'default', query: '?url' },
)
const importedVideos = import.meta.glob<string>(
  '/src/assets/intro-media/video/*.mp4',
  { eager: true, import: 'default', query: '?url' },
)

function importedMediaUrl(
  modules: Record<string, string>,
  fileName: string,
): string | null {
  const entry = Object.entries(modules).find(([path]) => path.endsWith(`/${fileName}`))
  return entry?.[1] ?? null
}

function L(text: LocalizedText): string {
  return getLocalizedText(text, props.locale)
}

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ---------------- placeholder photo generator (verbatim from mockup) --------
// Real media isn't provided yet; every photo/video slot is a faux SVG.
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
<g transform='translate(${110 + (seed % 2) * 8} 250)'>
<ellipse cx='0' cy='96' rx='60' ry='8' fill='rgba(40,25,15,.18)'/>
<path d='M-34 96 Q-34 54 -14 54 Q6 54 6 96 Z' fill='#3d2b1f' opacity='.82'/>
<circle cx='-14' cy='44' r='15' fill='#3d2b1f' opacity='.82'/>
<path d='M6 96 Q6 50 30 50 Q54 50 54 96 Z' fill='#5a3a26' opacity='.82'/>
<circle cx='30' cy='40' r='15' fill='#5a3a26' opacity='.82'/></g>
<rect width='300' height='400' fill='rgba(40,25,15,0.06)'/>
<rect x='4' y='4' width='292' height='392' rx='4' fill='none' stroke='rgba(255,255,255,.10)'/>
</svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}

// ---------------- constellation data (verbatim from mockup) -----------------
interface StarPosition { x: number; y: number }
interface RawStar extends StarPosition {
  seed: number
  cap: StarIntroCaption
  fileName: string
}

const starPositions: StarPosition[] = [
  { x: 170, y: 250 },
  { x: 270, y: 340 },
  { x: 190, y: 440 },
  { x: 540, y: 320 },
  { x: 620, y: 420 },
  { x: 555, y: 520 },
  { x: 360, y: 640 },
  { x: 220, y: 840 },
  { x: 320, y: 920 },
  { x: 180, y: 980 },
  { x: 480, y: 880 },
  { x: 570, y: 970 },
]
const rawStars: RawStar[] = starPositions.map((position, index) => ({
  ...position,
  seed: index,
  cap: starIntroPhotoSlots[index].caption,
  fileName: starIntroPhotoSlots[index].fileName,
}))
const clusters = [
  { ids: [0, 1, 2], fx: 210, fy: 350, s: 1.14 },
  { ids: [3, 4, 5], fx: 575, fy: 420, s: 1.14 },
  { ids: [6, 7, 8, 9], fx: 300, fy: 800, s: 1.06 },
  { ids: [10, 11], fx: 520, fy: 920, s: 1.14 },
]
const edges = [[0, 1], [1, 2], [3, 4], [4, 5], [7, 8], [8, 9], [10, 11], [6, 3], [6, 7], [1, 6]]

// Reactive star list (lit flag drives the bloom); src precomputed once.
const stars = reactive(
  rawStars.map((s) => {
    const placeholderSrc = fauxPhoto(s.seed, 180, 228)
    const customSrc = importedMediaUrl(importedPhotos, s.fileName)
    return {
      x: s.x,
      y: s.y,
      cap: s.cap,
      fileName: s.fileName,
      src: customSrc ?? placeholderSrc,
      placeholderSrc,
      hasCustomMedia: Boolean(customSrc),
      lit: false,
    }
  }),
)
// Reactive line list (drawn flag drives the stroke-dashoffset draw-on).
const lines = reactive(
  edges.map(([a, b]) => {
    const len = Math.hypot(rawStars[a].x - rawStars[b].x, rawStars[a].y - rawStars[b].y)
    return { x1: rawStars[a].x, y1: rawStars[a].y, x2: rawStars[b].x, y2: rawStars[b].y, len, a, b, drawn: false }
  }),
)

// caption text — literal string passes through, LocalizedText goes through L()
function capText(cap: StarIntroCaption): string {
  if (!cap) return ''
  return typeof cap === 'string' ? cap : L(cap)
}

function photoAlt(cap: StarIntroCaption): string {
  const caption = capText(cap)
  return caption ? `${L(starIntro.photoAlt)}: ${caption}` : L(starIntro.photoAlt)
}

function restorePhotoPlaceholder(index: number) {
  const star = stars[index]
  star.src = star.placeholderSrc
  star.hasCustomMedia = false
}

// ---------------- decorative particle fields (generated once) ---------------
const dustParticles = Array.from({ length: 64 }, () => ({
  left: Math.random() * 100, top: Math.random() * 90,
  size: Math.random() * 1.6 + 1, delay: Math.random() * 4,
}))
const goldenDust = Array.from({ length: 14 }, () => ({
  left: Math.random() * 100, top: 55 + Math.random() * 40,
  size: Math.random() * 3 + 2, delay: Math.random() * 8, dur: 7 + Math.random() * 4,
}))
const moonPlaceholderSrc = fauxPhoto(1, 300, 300)
const moonVideoSrc = ref<string | null>(
  importedMediaUrl(importedVideos, starIntroVideoSlot.fileName),
)

function restoreVideoPlaceholder() {
  moonVideoSrc.value = null
}

// ---------------- reactive scene state (drives class bindings) --------------
const stageGolden = ref(false)      // night -> golden-hour cross-fade
const stageFalling = ref(false)     // landing glow at the impact point
const universeDim = ref(false)      // dim the tour constellation to a faint remnant
const titleShow = ref(false)        // tour title
const promptShow = ref(false)       // phase 2 "tap to celebrate" prompt
const prompt2Show = ref(false)      // "tap and your gift arrives" prompt
const msgShow = ref(false)          // celebration message (100 hero)
const boxAssembled = ref(false)     // the landed gift box assembles

// ---------------- element refs ----------------
const stageRef = ref<HTMLDivElement>()
const universeRef = ref<HTMLDivElement>()
const fxRef = ref<HTMLCanvasElement>()
const flashRef = ref<HTMLDivElement>()

// ---------------- timers / lifecycle guards ----------------
const timers: number[] = []
let cancelled = false
type Phase = 'idle' | 'tour' | 'invite' | 'aFire' | 'message' | 'bFall' | 'impact' | 'ready'
let phase: Phase = 'idle'

const wait = (ms: number) => new Promise<void>((r) => { timers.push(window.setTimeout(r, ms)) })
const at = (ms: number, fn: () => void) => { timers.push(window.setTimeout(() => { if (!cancelled) fn() }, ms)) }
function clearTimers() { timers.forEach(t => window.clearTimeout(t)); timers.length = 0 }

let completedEmitted = false
function finish() {
  if (completedEmitted) return
  completedEmitted = true
  cancelled = true
  clearTimers()
  stopLoop()
  emit('completed')
}

// ---------------- camera / draw helpers ----------------
function panTo(fx: number, fy: number, scale: number) {
  const stage = stageRef.value
  const uni = universeRef.value
  if (!stage || !uni) return
  const w = stage.clientWidth, h = stage.clientHeight
  uni.style.transform = `translate(${w / 2 - fx * scale}px,${h / 2 - fy * scale}px) scale(${scale})`
}
function drawEdgesFor(litIds: number[]) {
  lines.forEach((l) => { if (litIds.includes(l.a) && litIds.includes(l.b)) l.drawn = true })
}

// ===== PHASE 1 + 2 — the COMPLETE tour, then invite the tap (unchanged) =====
async function run() {
  cancelled = false
  phase = 'tour'

  // 1. establishing wide shot + title
  panTo(360, 500, 0.58)
  titleShow.value = true
  await wait(1500); if (cancelled) return
  titleShow.value = false
  await wait(500); if (cancelled) return

  // 2. visit all 4 clusters in order — bloom + draw lines
  let lit: number[] = []
  for (const c of clusters) {
    panTo(c.fx, c.fy, c.s)
    await wait(680); if (cancelled) return
    c.ids.forEach((i, k) => { timers.push(window.setTimeout(() => { if (!cancelled) stars[i].lit = true }, k * 140)) })
    await wait(c.ids.length * 140 + 260); if (cancelled) return
    lit = lit.concat(c.ids)
    drawEdgesFor(lit)
    await wait(760); if (cancelled) return
  }

  // 3. pull out and reveal the whole constellation
  panTo(360, 580, 0.55)
  lines.forEach((l) => { l.drawn = true })
  await wait(1250); if (cancelled) return

  // hold, then invite the tap (phase 2)
  await wait(800); if (cancelled) return
  phase = 'invite'
  promptShow.value = true
  // auto-fallback if no tap within 7s: begin the celebration anyway
  at(7000, () => { if (phase === 'invite') beginA() })
}

// ============================================================================
// Canvas fireworks + gift-meteor engine (ported from mockup 03)
// ============================================================================
const LX = 0.5, LY = 0.62 // shared landing point (fraction of stage) — box + glow

interface Particle {
  x: number; y: number; vx: number; vy: number; drag: number; grav: number
  size: number; life: number; decay: number; color: string; isFlash?: boolean
}
interface Rocket {
  x: number; y: number; tx: number; ty: number; reach: number; cols: string[]
  type: 'ring' | 'heart'; big: boolean; vx: number; vy: number; trail: string
}
interface Meteor {
  sx: number; sy: number; lx: number; ly: number; x: number; y: number
  start: number; dur: number; rot: number; scale: number; bow: number
  emit: number; done: boolean
}

let ctx: CanvasRenderingContext2D | null = null
let W = 0, H = 0, DPR = 1
const CSTAR = { x: 0, y: 0, on: false } // the bright celebration star (Phase B seed)

function resize() {
  const canvas = fxRef.value, stage = stageRef.value
  if (!canvas || !stage) return
  if (!ctx) ctx = canvas.getContext('2d')
  DPR = Math.min(window.devicePixelRatio || 1, 2)
  W = stage.clientWidth; H = stage.clientHeight
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR)
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
  ctx?.setTransform(DPR, 0, 0, DPR, 0, 0)
  CSTAR.x = W * 0.30; CSTAR.y = H * 0.155
}

// cached radial-glow sprites (additive; no per-particle gradients)
const sprites: Record<string, HTMLCanvasElement> = {}
function sprite(color: string): HTMLCanvasElement {
  const cached = sprites[color]
  if (cached) return cached
  const c = document.createElement('canvas'); c.width = c.height = 32
  const g = c.getContext('2d')
  if (g) {
    const rg = g.createRadialGradient(16, 16, 0, 16, 16, 16)
    rg.addColorStop(0, color); rg.addColorStop(.35, color); rg.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = rg; g.beginPath(); g.arc(16, 16, 16, 0, 7); g.fill()
  }
  sprites[color] = c; return c
}
const GOLD = ['#f4be3a', '#ffd77a', '#ffb85c']
const ROSE = ['#ff6f91', '#f0907a', '#ffb0a0']
const ROSEGOLD = ['#ff8fa3', '#f4be3a', '#ffd77a']
const MIX = ['#ff6f91', '#f4be3a', '#ffb85c', '#fff3d0']
const VIOLETMIX = ['#b79cf0', '#f4be3a', '#fff3d0']
const TEALMIX = ['#8fe3d8', '#ffd77a', '#fff3d0']
const WHITE = ['#fff3d0', '#fff9ed']
const TRAIL = ['#ffd77a', '#f4be3a', '#ffb85c', '#fff3d0']

const particles: Particle[] = []
let rockets: Rocket[] = []
const MAX = 880

function heartXY(t: number): [number, number] {
  const x = 16 * Math.pow(Math.sin(t), 3)
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
  return [x, y]
}
function heartBurst(cx: number, cy: number, reach: number, colors: string[], count: number) {
  const drag = 0.915, k = reach / 16 * (1 - drag)
  for (let i = 0; i < count && particles.length < MAX; i++) {
    const t = (i / count) * Math.PI * 2 + Math.random() * 0.05, [hx, hy] = heartXY(t), j = 0.9 + Math.random() * 0.2
    particles.push({ x: cx, y: cy, vx: hx * k * j, vy: hy * k * j, drag, grav: 0.035, size: 3.0 + Math.random() * 2.2,
      life: 1, decay: 0.007 + Math.random() * 0.006, color: colors[(Math.random() * colors.length) | 0] })
  }
  for (let i = 0; i < count * 0.22 && particles.length < MAX; i++) {
    const a = Math.random() * Math.PI * 2, sp = reach * 0.045 * (0.4 + Math.random())
    particles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 0.9, grav: 0.045,
      size: 2 + Math.random() * 1.6, life: 1, decay: 0.016 + Math.random() * 0.01, color: colors[(Math.random() * colors.length) | 0] })
  }
}
// classic multi-ring burst
function ringBurst(cx: number, cy: number, reach: number, colors: string[], big = false) {
  const rings = big ? 3 : 2
  for (let r = 0; r < rings; r++) {
    const count = big ? (50 - r * 10) : (30 - r * 8), sm = 1 - r * 0.26
    for (let i = 0; i < count && particles.length < MAX; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.05 + r * 0.12, sp = reach * 0.05 * sm * (0.88 + Math.random() * 0.24)
      particles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 0.9, grav: 0.03,
        size: 2.6 + Math.random() * 1.7, life: 1, decay: 0.006 + Math.random() * 0.006, color: colors[(Math.random() * colors.length) | 0] })
    }
  }
  for (let i = 0; i < (big ? 24 : 12) && particles.length < MAX; i++) {
    const a = Math.random() * Math.PI * 2, sp = reach * 0.03 * (0.4 + Math.random())
    particles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 0.88, grav: 0.05,
      size: 1.6 + Math.random() * 1.2, life: 1, decay: 0.02 + Math.random() * 0.012, color: WHITE[(Math.random() * WHITE.length) | 0] })
  }
}
function flashP(cx: number, cy: number, r: number, color: string) {
  particles.push({ x: cx, y: cy, vx: 0, vy: 0, drag: 1, grav: 0, size: r, life: 1, decay: 0.05, color, isFlash: true })
}
function screenFlash(op: number) {
  const f = flashRef.value; if (!f) return
  f.style.transition = 'none'; f.style.opacity = String(op)
  requestAnimationFrame(() => { f.style.transition = 'opacity .75s ease'; f.style.opacity = '0' })
}

// ---- rockets ----
function launch(tx: number, ty: number, reach: number, cols: string[], type: 'ring' | 'heart', big = false) {
  const sx = W * (0.30 + Math.random() * 0.40)
  rockets.push({ x: sx, y: H * 1.02, tx, ty, reach, cols, type, big,
    vx: (tx - sx) * 0.012, vy: -(Math.sqrt(Math.max(1, H * 1.02 - ty)) * 0.9 + 7) * 0.5, trail: cols[1] || cols[0] })
}
function stepRocket(r: Rocket): boolean {
  const g = ctx; if (!g) return false
  r.vy += 0.12; r.x += r.vx; r.y += r.vy
  const s = sprite(r.trail)
  g.globalAlpha = 0.9; g.drawImage(s, r.x - 7, r.y - 7, 14, 14)
  g.globalAlpha = 0.35; g.drawImage(s, r.x - r.vx - 5, r.y - r.vy - 5, 10, 10)
  if (r.y <= r.ty || r.vy >= 0) {
    if (r.type === 'heart') heartBurst(r.x, r.y, r.reach, r.cols, r.big ? 128 : 74)
    else ringBurst(r.x, r.y, r.reach, r.cols, r.big)
    flashP(r.x, r.y, r.big ? r.reach * 1.15 : r.reach * 0.7, '#fff3d0')
    return false
  }
  return true
}

// ---- gift-box meteor (Phase B) ----
let meteor: Meteor | null = null
function roundRectPath(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  g.beginPath()
  g.moveTo(x + rr, y)
  g.arcTo(x + w, y, x + w, y + h, rr)
  g.arcTo(x + w, y + h, x, y + h, rr)
  g.arcTo(x, y + h, x, y, rr)
  g.arcTo(x, y, x + w, y, rr)
  g.closePath()
}
function drawMiniBox(x: number, y: number, s: number, rot: number) {
  const g = ctx; if (!g) return
  g.save(); g.translate(x, y); g.rotate(rot)
  const w = 20 * s, h = 17 * s
  g.fillStyle = '#fff4d8'
  roundRectPath(g, -w / 2, -h / 2, w, h, 3 * s); g.fill()
  g.fillStyle = '#fff9ed'
  roundRectPath(g, -w / 2 - 1.5 * s, -h / 2 - 4.5 * s, w + 3 * s, 6 * s, 2 * s); g.fill()
  g.fillStyle = '#e8be4e'
  g.fillRect(-2.4 * s, -h / 2 - 4.5 * s, 4.8 * s, h + 4.5 * s)
  g.fillRect(-w / 2, -2.2 * s, w, 4.4 * s)
  g.restore()
}
function updateMeteor(now: number, dt: number) {
  const m = meteor; if (!m) return
  const g = ctx; if (!g) return
  if (!m.start) m.start = now
  const p = Math.min((now - m.start) / m.dur, 1), ez = p * p
  m.x = m.sx + (m.lx - m.sx) * (p * 0.55 + ez * 0.45) + Math.sin(p * Math.PI) * m.bow
  m.y = m.sy + (m.ly - m.sy) * ez
  m.rot += dt * 0.006; m.scale = 1 - p * 0.12
  m.emit += dt
  while (m.emit > 15) {
    m.emit -= 15
    for (let k = 0; k < 2 && particles.length < MAX; k++) {
      const ang = Math.random() * 6.283
      particles.push({ x: m.x + (Math.random() * 6 - 3), y: m.y + (Math.random() * 6 - 3),
        vx: Math.cos(ang) * 0.5, vy: Math.sin(ang) * 0.5 - 0.3, drag: 0.9, grav: 0.02,
        size: 2.2 + Math.random() * 1.7, life: 1, decay: 0.024 + Math.random() * 0.02, color: TRAIL[(Math.random() * TRAIL.length) | 0] })
    }
  }
  // hot head glow (additive)
  let s = sprite('#fff3d0'), d = 28 * m.scale; g.globalAlpha = 0.95; g.drawImage(s, m.x - d / 2, m.y - d / 2, d, d)
  s = sprite('#f4be3a'); d = 46 * m.scale; g.globalAlpha = 0.5; g.drawImage(s, m.x - d / 2, m.y - d / 2, d, d)
  g.globalAlpha = 1
  if (p >= 1 && !m.done) { m.done = true; impact() }
}
function impact() {
  phase = 'impact'
  screenFlash(0.72)
  ringBurst(W * LX, H * LY, 78, ['#ffe6b0', '#f4be3a', '#ffb85c', '#fff3d0'], true)
  flashP(W * LX, H * LY, 120, '#fff3d0')
  meteor = null
  stageFalling.value = true
  at(140, () => { boxAssembled.value = true })
  // box has landed & settled (~900ms) — hand straight off to the WebGL gift
  // scene, which fades in from the same golden hour.
  at(1040, finish)
}

function drawStar(now: number) {
  const g = ctx; if (!g) return
  const tw = 0.55 + 0.45 * Math.sin(now / 300)
  let s = sprite('#fff3d0'), d = 12 * tw + 10; g.globalAlpha = 0.9 * tw; g.drawImage(s, CSTAR.x - d / 2, CSTAR.y - d / 2, d, d)
  s = sprite('#f4be3a'); d = 28; g.globalAlpha = 0.4 * tw; g.drawImage(s, CSTAR.x - d / 2, CSTAR.y - d / 2, d, d)
  g.globalAlpha = 1
}

// ---- main loop ----
let raf = 0, last = 0, running = false
function step(now: number) {
  if (!running) return
  const g = ctx; if (!g) { running = false; return }
  if (!last) last = now
  let dt = now - last; last = now; if (dt > 50) dt = 50

  g.globalCompositeOperation = 'destination-out'
  g.globalAlpha = 1; g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, 0, W, H)

  g.globalCompositeOperation = 'lighter'
  rockets = rockets.filter(stepRocket)
  if (CSTAR.on && !meteor) drawStar(now)
  if (meteor) updateMeteor(now, dt)
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    if (p.isFlash) {
      p.life -= p.decay; p.size *= 1.12
      if (p.life <= 0) { particles.splice(i, 1); continue }
      g.globalAlpha = p.life * 0.5; const s = sprite(p.color); g.drawImage(s, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2); continue
    }
    p.vx *= p.drag; p.vy = p.vy * p.drag + p.grav; p.x += p.vx; p.y += p.vy; p.life -= p.decay
    if (p.life <= 0) { particles.splice(i, 1); continue }
    g.globalAlpha = Math.max(0, p.life); const s = sprite(p.color); const d = p.size * 2 * (0.6 + p.life * 0.6)
    g.drawImage(s, p.x - d / 2, p.y - d / 2, d, d)
  }
  g.globalAlpha = 1
  if (meteor) { g.globalCompositeOperation = 'source-over'; drawMiniBox(meteor.x, meteor.y, meteor.scale, meteor.rot) }
  g.globalCompositeOperation = 'source-over'
  raf = requestAnimationFrame(step)
}
function startLoop() { if (!running) { running = true; last = 0; raf = requestAnimationFrame(step) } }
function stopLoop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0 }

// ============================================================================
// Sequence — Phase A (fireworks) → message → Phase B (star → box → golden)
// ============================================================================
function beginA() {
  if (phase !== 'invite') return
  phase = 'aFire'
  promptShow.value = false
  universeDim.value = true // dim the tour constellation to a faint remnant
  startLoop()
  fireSequenceA()
}

function fireSequenceA() {
  const cl = (x: number, y: number, r: number, c: string[], big = false) => launch(x * W, y * H, r, c, 'ring', big)
  const ht = (x: number, y: number, r: number, c: string[], big = false) => launch(x * W, y * H, r, c, 'heart', big)
  const seq: Array<[number, () => void]> = [
    [180, () => cl(0.28, 0.30, 72, GOLD)],
    [470, () => ht(0.70, 0.26, 70, ROSE)],
    [820, () => cl(0.50, 0.19, 82, MIX, true)],
    [1150, () => ht(0.20, 0.40, 64, ROSEGOLD)],
    [1460, () => cl(0.82, 0.36, 72, VIOLETMIX)],
    [1780, () => ht(0.42, 0.29, 68, ROSE)],
    [2080, () => { cl(0.17, 0.24, 66, GOLD); cl(0.84, 0.24, 66, TEALMIX) }],
    [2420, () => ht(0.62, 0.44, 66, ROSEGOLD)],
    [2680, () => cl(0.34, 0.40, 70, MIX)],
    [2960, () => { cl(0.50, 0.50, 58, GOLD); ht(0.30, 0.50, 56, ROSE) }],
  ]
  seq.forEach(([t, fn]) => at(t, fn))
  const F = 3420
  at(F, () => { // DUAL FINALE: giant heart amid a full-sky barrage
    ht(0.50, 0.335, 152, MIX, true)
    cl(0.19, 0.27, 92, GOLD, true)
    cl(0.81, 0.27, 92, ROSE, true)
    cl(0.32, 0.50, 76, VIOLETMIX)
    cl(0.68, 0.50, 76, TEALMIX)
    screenFlash(0.62)
  })
  at(F + 340, () => { cl(0.13, 0.42, 72, GOLD); cl(0.87, 0.42, 72, ROSE); ht(0.50, 0.52, 74, ROSEGOLD) })
  at(F + 1180, showMessage)
  const amb = () => {
    if (phase !== 'message') return
    ;(Math.random() < 0.5 ? cl : ht)(0.2 + Math.random() * 0.6, 0.2 + Math.random() * 0.2, 56, MIX)
    at(1700 + Math.random() * 1300, amb)
  }
  at(F + 2500, amb)
}

function showMessage() {
  phase = 'message'
  promptShow.value = false
  msgShow.value = true
  CSTAR.on = true
  at(900, () => { if (phase === 'message') prompt2Show.value = true })
  // auto-advance to the gift drop if no tap
  at(6500, () => { if (phase === 'message') beginB() })
}

function beginB() {
  if (phase !== 'message') return
  phase = 'bFall'
  prompt2Show.value = false
  msgShow.value = false
  // flare the chosen star, then it becomes the falling gift-meteor
  flashP(CSTAR.x, CSTAR.y, 58, '#fff3d0')
  ringBurst(CSTAR.x, CSTAR.y, 42, ['#fff3d0', '#ffd77a'], false)
  meteor = { sx: CSTAR.x, sy: CSTAR.y, lx: W * LX, ly: H * LY, x: CSTAR.x, y: CSTAR.y,
    start: 0, dur: 1700, rot: 0, scale: 1, bow: W * 0.10, emit: 0, done: false }
  CSTAR.on = false
  stageGolden.value = true // begin night -> golden; ~1.7s so it's golden by impact
  startLoop()
}

// reduced motion: no rAF loops. Jump straight to the golden-hour box-landed
// state, then hand off to the gift scene shortly after.
function endStatic() {
  cancelled = false
  universeDim.value = true
  stageGolden.value = true
  stageFalling.value = true
  boxAssembled.value = true
  phase = 'ready'
  at(700, finish)
}

// ---------------- interactions ----------------
function onStageClick() {
  if (reduced) { finish(); return }
  if (phase === 'invite') beginA()
  else if (phase === 'message') beginB()
}
function onSkip() {
  finish()
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  if (reduced) { endStatic(); return }
  run()
})

onBeforeUnmount(() => {
  cancelled = true
  clearTimers()
  stopLoop()
  window.removeEventListener('resize', resize)
})
</script>

<template>
  <div
    ref="stageRef"
    class="su-stage"
    :class="{ golden: stageGolden, falling: stageFalling }"
    @click="onStageClick"
  >
    <!-- background layers (night -> golden hour cross-fade) -->
    <div
      class="su-bg su-bg-night"
      aria-hidden="true"
    />
    <div
      class="su-bg su-bg-golden"
      aria-hidden="true"
    />
    <div
      class="su-dust"
      aria-hidden="true"
    >
      <span
        v-for="(d, i) in dustParticles"
        :key="i"
        class="su-d"
        :style="{ left: d.left + '%', top: d.top + '%', width: d.size + 'px', height: d.size + 'px', animationDelay: d.delay + 's' }"
      />
    </div>
    <div
      class="su-godray"
      aria-hidden="true"
    />
    <div
      class="su-ground"
      aria-hidden="true"
    />
    <div
      class="su-gdust"
      aria-hidden="true"
    >
      <span
        v-for="(g, i) in goldenDust"
        :key="i"
        class="su-gd"
        :style="{ left: g.left + '%', top: g.top + '%', width: g.size + 'px', height: g.size + 'px', animationDelay: g.delay + 's', animationDuration: g.dur + 's' }"
      />
    </div>
    <div
      class="su-horizon"
      aria-hidden="true"
    />

    <!-- panning universe: stars + constellation lines + moon video -->
    <div
      ref="universeRef"
      class="su-universe"
      :class="{ dim: universeDim }"
    >
      <svg
        class="su-lines"
        viewBox="0 0 720 1280"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line
          v-for="(l, i) in lines"
          :key="i"
          :x1="l.x1"
          :y1="l.y1"
          :x2="l.x2"
          :y2="l.y2"
          stroke-width="1.4"
          :style="{ strokeDasharray: l.len, strokeDashoffset: l.drawn ? 0 : l.len }"
        />
      </svg>

      <div
        v-for="(s, i) in stars"
        :key="i"
        class="su-star"
        :class="{ lit: s.lit }"
        :style="{ left: s.x + 'px', top: s.y + 'px' }"
        data-media="photo"
      >
        <div class="su-card">
          <img
            :src="s.src"
            :alt="s.hasCustomMedia ? photoAlt(s.cap) : ''"
            decoding="async"
            @error="restorePhotoPlaceholder(i)"
          >
        </div>
        <div class="su-sdot" />
        <div
          v-if="capText(s.cap)"
          class="su-cap"
        >
          {{ capText(s.cap) }}
        </div>
      </div>

      <div
        class="su-moon"
        :class="{ 'has-video': moonVideoSrc }"
        data-media="video"
        role="img"
        :aria-label="L(starIntroVideoSlot.caption)"
      >
        <div class="su-face">
          <video
            v-if="moonVideoSrc"
            :src="moonVideoSrc"
            :poster="moonPlaceholderSrc"
            autoplay
            loop
            muted
            playsinline
            preload="metadata"
            aria-hidden="true"
            @error="restoreVideoPlaceholder"
          />
          <img
            v-else
            :src="moonPlaceholderSrc"
            alt=""
          >
        </div>
        <div class="su-wash" />
        <div class="su-sweep" />
        <div class="su-live">
          ▶ LIVE
        </div>
        <div class="su-play" />
        <div class="su-bar">
          <i />
        </div>
        <div class="su-mcap">
          {{ L(starIntroVideoSlot.caption) }}
        </div>
      </div>
    </div>

    <!-- fireworks + gift-meteor canvas -->
    <canvas
      ref="fxRef"
      class="su-fx"
      aria-hidden="true"
    />
    <div
      ref="flashRef"
      class="su-flash"
      aria-hidden="true"
    />
    <div
      class="su-glow"
      aria-hidden="true"
    />

    <!-- landed gift box (assembles on impact; verbatim from mockup 03/11) -->
    <div
      class="su-box"
      :class="{ assembled: boxAssembled }"
      aria-hidden="true"
    >
      <div class="su-contact" />
      <div class="su-top" />
      <div class="su-front" />
      <div class="su-ribbon su-r-top" />
      <div class="su-ribbon su-r-v" />
      <div class="su-ribbon su-r-h" />
      <div class="su-shimmer" />
      <div class="su-bow">
        <div class="su-bow-loop l" />
        <div class="su-bow-loop r" />
        <div class="su-bow-knot" />
      </div>
      <div class="su-tag">
        <div class="su-string" />
        <div class="su-card2">
          {{ L(uiText.nameTag) }}
        </div>
      </div>
    </div>

    <!-- celebration message -->
    <div
      class="su-msg"
      :class="{ show: msgShow }"
      aria-hidden="true"
    >
      <div class="su-hundred">
        100
      </div>
      <div class="su-fhead">
        {{ L(starIntro.celebrateTitle) }}
      </div>
      <div class="su-fsub">
        {{ L(starIntro.celebrateSub) }}
      </div>
      <div class="su-names">
        Jay&nbsp;·&nbsp;苙綺&nbsp;·&nbsp;2026.04.28 → 2026.08.05
      </div>
    </div>

    <!-- copy overlays -->
    <div
      class="su-title"
      :class="{ show: titleShow }"
      aria-hidden="true"
    >
      <div class="su-tk">
        {{ L(starIntro.eyebrow) }}
      </div>
      <div class="su-tm">
        <template
          v-for="(ln, j) in L(starIntro.title).split('\n')"
          :key="j"
        >
          <br v-if="j > 0">
          {{ ln }}
        </template>
      </div>
    </div>

    <!-- phase 2 "tap to celebrate" prompt -->
    <div
      class="su-prompt"
      :class="{ show: promptShow }"
      aria-hidden="true"
    >
      <div class="su-ripple">
        <div class="su-core" />
      </div>
      <div class="su-ptext">
        {{ L(starIntro.tapPrompt) }}
      </div>
    </div>

    <!-- "tap and your gift arrives" prompt -->
    <div
      class="su-prompt"
      :class="{ show: prompt2Show }"
      aria-hidden="true"
    >
      <div class="su-ripple">
        <div class="su-core" />
      </div>
      <div class="su-ptext">
        {{ L(starIntro.giftDropPrompt) }}
      </div>
    </div>

    <!-- skip — clickable from the very start, completes from any phase -->
    <button
      type="button"
      class="su-skip"
      @click.stop="onSkip"
    >
      {{ L(uiText.skipIntro) }}
    </button>
  </div>
</template>

<style scoped>
.su-stage {
  --gold: #f4be3a; --brass: #c99a2e; --amber: #ffb85c; --rose: #f0907a;
  --cream: #fff9ed; --paper: #f3e6c8;
  --night-1: #141031; --night-2: #241a44; --night-3: #3a2650;
  --horizon: #8a5a4a; --horizon-glow: #c98a5a;
  --star: #fff3d0; --star-dim: #cdbfe0; --star-gold: #f4be3a;
  --moon: #ffe9b8; --moon-ring: #f4be3a; --line: #f4be3a; --ink: #3d2b1f; --brown: #3d2b1f;
  position: fixed; inset: 0; z-index: 60;
  width: 100%; height: 100vh; height: 100dvh;
  overflow: hidden; touch-action: manipulation; cursor: pointer;
  background: #0a0720; color: var(--cream);
  font-family: Pretendard, -apple-system, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
}
.su-stage * { margin: 0; padding: 0; box-sizing: border-box; }

/* ===== Background layers (night -> golden hour cross-fade) ===== */
.su-bg { position: absolute; inset: 0; pointer-events: none; }
.su-bg-night {
  opacity: 1; transition: opacity 1.7s ease;
  background:
    radial-gradient(130% 60% at 50% 108%, rgba(201, 138, 90, .55), transparent 52%),
    radial-gradient(150% 80% at 50% 104%, rgba(138, 90, 74, .42), transparent 46%),
    linear-gradient(180deg, var(--night-1) 0%, var(--night-2) 52%, var(--night-3) 78%, #5a3a4a 100%);
}
.su-bg-golden {
  opacity: 0; transition: opacity 1.7s ease;
  background:
    radial-gradient(120% 70% at 50% 6%, rgba(255, 240, 205, .5), transparent 55%),
    radial-gradient(140% 80% at 50% 118%, rgba(120, 78, 44, .7), transparent 60%),
    linear-gradient(180deg, #ffd48a 0%, #ffb85c 34%, #d99a5a 64%, #b98a4e 100%);
}
.su-stage.golden .su-bg-night { opacity: 0; }
.su-stage.golden .su-bg-golden { opacity: 1; }

/* twinkle dust (night) — kept through the fireworks for continuity */
.su-dust { position: absolute; inset: 0; pointer-events: none; transition: opacity 1.4s ease; }
.su-stage.golden .su-dust { opacity: 0; }
.su-d {
  position: absolute; border-radius: 50%; background: var(--star);
  box-shadow: 0 0 4px rgba(255, 243, 208, .8); animation: su-tw 4s ease-in-out infinite;
}
@keyframes su-tw { 0%, 100% { opacity: .16; } 50% { opacity: .85; } }

.su-horizon {
  position: absolute; left: 0; right: 0; bottom: 0; height: 150px; pointer-events: none;
  background: linear-gradient(180deg, transparent, rgba(58, 26, 40, .5)); transition: opacity 1.2s ease;
}
.su-stage.golden .su-horizon { opacity: 0; }

/* ===== Golden-hour scene furniture (revealed in phase B) ===== */
.su-godray {
  position: absolute; top: -8%; left: 50%; transform: translateX(-50%); width: 78%; height: 82%;
  pointer-events: none; opacity: 0; transition: opacity 1.4s ease .3s; mix-blend-mode: screen; z-index: 5;
  background: linear-gradient(180deg, rgba(255, 244, 210, .42), rgba(255, 224, 158, .10) 62%, transparent);
  clip-path: polygon(37% 0, 63% 0, 90% 100%, 10% 100%);
}
.su-godray::after {
  content: ""; position: absolute; inset: 0; opacity: .6;
  background: linear-gradient(180deg, rgba(255, 255, 255, .35), transparent 55%);
  clip-path: polygon(45% 0, 55% 0, 66% 100%, 34% 100%); animation: su-raypulse 5.5s ease-in-out infinite;
}
@keyframes su-raypulse { 0%, 100% { opacity: .35; } 50% { opacity: .7; } }
.su-stage.golden .su-godray { opacity: 1; }

.su-ground {
  position: absolute; left: 0; right: 0; bottom: 0; height: 34%; pointer-events: none; opacity: 0; z-index: 5;
  transition: opacity 1.4s ease .2s;
  background: linear-gradient(180deg, transparent, rgba(196, 146, 84, .55) 42%, #a9713f 100%);
}
.su-ground::before {
  content: ""; position: absolute; left: 0; right: 0; top: 0; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 240, 200, .55), transparent);
}
.su-stage.golden .su-ground { opacity: 1; }

/* soft floating golden dust in the warm scene */
.su-gdust { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity 1.4s ease .4s; z-index: 5; }
.su-stage.golden .su-gdust { opacity: 1; }
.su-gd {
  position: absolute; border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 246, 214, .95), rgba(255, 214, 140, 0));
  animation: su-gdfloat 9s ease-in-out infinite;
}
@keyframes su-gdfloat {
  0% { transform: translateY(10px) translateX(0); opacity: 0; }
  20% { opacity: .9; } 80% { opacity: .7; }
  100% { transform: translateY(-46px) translateX(10px); opacity: 0; }
}

/* ===== PHASE 1 — the panning universe ===== */
.su-universe {
  position: absolute; left: 0; top: 0; width: 720px; height: 1280px; z-index: 4;
  transform-origin: 0 0; will-change: transform; opacity: 1;
  transition: transform 1250ms cubic-bezier(.62, .02, .24, 1), opacity .6s ease;
}
.su-universe.dim { opacity: .16; }
.su-stage.golden .su-universe { opacity: 0; }
.su-lines {
  position: absolute; left: 0; top: 0; width: 720px; height: 1280px; overflow: visible;
  transition: opacity .5s ease;
}
.su-lines line {
  stroke: var(--line); fill: none; stroke-linecap: round;
  filter: drop-shadow(0 0 3px rgba(244, 190, 58, .75)); opacity: .85;
  transition: stroke-dashoffset .9s ease;
}

.su-star { position: absolute; transform: translate(-50%, -50%); }
.su-sdot {
  position: absolute; left: 50%; top: 50%; width: 7px; height: 7px; margin: -3.5px 0 0 -3.5px;
  border-radius: 50%; background: var(--star);
  box-shadow: 0 0 6px 2px rgba(255, 243, 208, .9), 0 0 16px 6px rgba(244, 190, 58, .5);
  animation: su-tw 3.4s ease-in-out infinite;
}
.su-card {
  position: absolute; left: 50%; top: 50%; width: 0; height: 0;
  transform: translate(-50%, -50%) scale(.2); opacity: 0;
  transition: opacity .55s ease, transform .7s cubic-bezier(.2, .9, .25, 1),
              width .7s cubic-bezier(.2, .9, .25, 1), height .7s cubic-bezier(.2, .9, .25, 1);
  border-radius: 11px; overflow: hidden; background: #000;
  box-shadow: 0 6px 22px rgba(0, 0, 0, .5), 0 0 0 3px rgba(255, 249, 237, .92),
              0 0 26px 7px rgba(244, 190, 58, .45);
}
.su-card img { width: 100%; height: 100%; object-fit: cover; display: block; }
.su-cap {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, 0);
  font-family: Gaegu, cursive; font-size: 15px; color: var(--gold); white-space: nowrap;
  opacity: 0; transition: opacity .55s ease .15s, transform .55s ease .15s;
  text-shadow: 0 1px 6px rgba(0, 0, 0, .85); pointer-events: none;
}
.su-star.lit .su-sdot { opacity: 0; transform: scale(.4); }
.su-star.lit .su-card { width: 90px; height: 114px; opacity: 1; transform: translate(-50%, -50%) scale(1); }
.su-star.lit .su-cap { opacity: 1; transform: translate(-50%, 74px); }

.su-moon {
  position: absolute; left: 548px; top: 215px; transform: translate(-50%, -50%);
  width: 154px; height: 154px; border-radius: 50%; overflow: hidden;
  box-shadow: 0 0 42px 15px rgba(255, 233, 184, .35), 0 0 96px 34px rgba(244, 190, 58, .22),
              inset 0 0 40px rgba(255, 255, 255, .22), 0 0 0 2px rgba(244, 190, 58, .5);
}
.su-face { position: absolute; inset: 0; }
.su-face img,
.su-face video {
  position: absolute; inset: -10%; width: 120%; height: 120%; object-fit: cover;
  filter: brightness(1.12) saturate(1.02);
  animation: su-moondrift 9s ease-in-out infinite alternate;
}
.su-moon.has-video .su-play { display: none; }
@keyframes su-moondrift { 0% { transform: translate(-2%, -1%) scale(1.05); } 100% { transform: translate(2%, 2%) scale(1.12); } }
.su-wash {
  position: absolute; inset: 0;
  background: radial-gradient(60% 60% at 35% 30%, rgba(255, 255, 255, .32), transparent 60%),
    radial-gradient(120% 120% at 120% 120%, rgba(20, 15, 40, .55), transparent 55%);
}
.su-sweep {
  position: absolute; top: -40%; left: -60%; width: 60%; height: 180%;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, .45), transparent);
  transform: rotate(18deg); animation: su-sweep 4.4s ease-in-out infinite;
}
@keyframes su-sweep { 0% { left: -70%; } 55% { left: 130%; } 100% { left: 130%; } }
.su-play {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: 34px; height: 34px; border-radius: 50%; background: rgba(20, 14, 30, .4);
  border: 1.5px solid rgba(255, 249, 237, .85); display: flex; align-items: center; justify-content: center;
}
.su-play::after {
  content: ""; margin-left: 3px; border-style: solid;
  border-width: 7px 0 7px 12px; border-color: transparent transparent transparent var(--cream);
}
.su-live {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  font-size: 9px; font-weight: 700; letter-spacing: .12em; color: #fff;
  background: rgba(240, 144, 122, .85); padding: 2px 7px; border-radius: 20px;
}
.su-bar {
  position: absolute; left: 16%; right: 16%; bottom: 15px; height: 3px;
  background: rgba(255, 255, 255, .25); border-radius: 3px; overflow: hidden;
}
.su-bar i {
  position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px;
  background: var(--gold); animation: su-prog 4.4s linear infinite;
}
@keyframes su-prog { 0% { width: 8%; } 100% { width: 96%; } }
.su-mcap {
  position: absolute; left: 50%; bottom: -26px; transform: translateX(-50%);
  font-family: Gaegu, cursive; font-size: 15px; color: var(--gold); white-space: nowrap;
  text-shadow: 0 1px 6px rgba(0, 0, 0, .85);
}

/* ===== Fireworks + gift-meteor canvas ===== */
.su-fx { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 6; }
.su-flash {
  position: absolute; inset: 0; background: #fff6e0; opacity: 0; z-index: 7;
  pointer-events: none; mix-blend-mode: screen;
}

/* landing glow at the gift point */
.su-glow {
  position: absolute; left: 50%; top: 62%; width: 230px; height: 230px; z-index: 6;
  transform: translate(-50%, -50%) scale(.2); opacity: 0; pointer-events: none;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 236, 180, .9) 0%, rgba(244, 190, 58, .4) 34%, transparent 68%);
  transition: opacity 1s ease, transform 1.1s ease;
}
.su-stage.falling .su-glow { opacity: .95; transform: translate(-50%, -50%) scale(1); }

/* ===== Gift box (matches the site's gift scene; verbatim from mockup 03/11) ===== */
.su-box {
  position: absolute; left: 50%; top: 62%; width: 170px; height: 150px; z-index: 8;
  transform: translate(-50%, -46%) scale(.42); opacity: 0; pointer-events: none;
  transition: transform .6s cubic-bezier(.2, .9, .25, 1), opacity .45s ease;
}
.su-box.assembled { opacity: 1; transform: translate(-50%, -46%) scale(1); }
.su-contact {
  position: absolute; left: 50%; bottom: -6px; width: 186px; height: 26px;
  transform: translateX(-50%); border-radius: 50%;
  background: radial-gradient(ellipse, rgba(80, 46, 20, .42), transparent 70%);
  opacity: 0; transition: opacity .6s ease .1s;
}
.su-box.assembled .su-contact { opacity: 1; }

.su-top {
  position: absolute; left: 50%; top: 14px; width: 150px; height: 32px; transform: translateX(-50%) scale(.7);
  opacity: 0; transform-origin: center bottom;
  transition: opacity .45s ease, transform .55s cubic-bezier(.2, .9, .25, 1);
  clip-path: polygon(11% 0, 89% 0, 100% 100%, 0 100%);
  background:
    repeating-linear-gradient(93deg, transparent 0 5px, rgba(139, 115, 85, .05) 5px 6px),
    linear-gradient(150deg, #fff9ed 0%, #f6ead0 55%, #e6d3a8 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .35);
}
.su-front {
  position: absolute; left: 50%; top: 44px; width: 158px; height: 100px; transform: translateX(-50%) scale(.7);
  opacity: 0; transform-origin: center bottom; border-radius: 0 0 7px 7px;
  transition: opacity .45s ease, transform .55s cubic-bezier(.2, .9, .25, 1);
  background:
    repeating-linear-gradient(93deg, transparent 0 5px, rgba(139, 115, 85, .05) 5px 6px),
    linear-gradient(150deg, #f2e0be 0%, #ddc79d 42%, #c0a87e 78%, #a68a63 100%);
  box-shadow: 0 12px 26px rgba(61, 43, 31, .34), inset 0 1px 0 rgba(255, 255, 255, .16),
              inset 0 -5px 10px rgba(61, 43, 31, .14);
}
.su-box.assembled .su-top { opacity: 1; transform: translateX(-50%) scale(1); }
.su-box.assembled .su-front { opacity: 1; transform: translateX(-50%) scale(1); }

/* satin ribbon cross (draws on after the body) */
.su-ribbon {
  position: absolute; background: linear-gradient(var(--rg, 90deg),
      #a8841f 0%, #d4a843 18%, #f2d06a 42%, #f7dc85 50%, #f2d06a 58%, #d4a843 82%, #a8841f 100%);
  box-shadow: 0 0 5px rgba(178, 138, 40, .25); opacity: .94; z-index: 2;
}
.su-r-v {
  left: 50%; top: 44px; width: 16px; height: 100px; transform: translateX(-50%) scaleY(0);
  transform-origin: top center; transition: transform .5s cubic-bezier(.4, 0, .3, 1) .35s;
}
.su-r-h {
  left: 50%; top: 82px; width: 158px; height: 16px; --rg: 180deg; transform: translateX(-50%) scaleX(0);
  transform-origin: center; transition: transform .5s cubic-bezier(.4, 0, .3, 1) .5s;
}
.su-r-top {
  left: 50%; top: 14px; width: 16px; height: 32px; transform: translateX(-50%) scaleY(0);
  transform-origin: top center; transition: transform .45s cubic-bezier(.4, 0, .3, 1) .35s; z-index: 3;
  clip-path: polygon(8% 0, 92% 0, 100% 100%, 0 100%);
}
.su-box.assembled .su-r-v { transform: translateX(-50%) scaleY(1); }
.su-box.assembled .su-r-h { transform: translateX(-50%) scaleX(1); }
.su-box.assembled .su-r-top { transform: translateX(-50%) scaleY(1); }
.su-shimmer {
  position: absolute; left: 50%; top: 44px; width: 30px; height: 100px; transform: translateX(-50%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .16), transparent);
  z-index: 3; pointer-events: none; opacity: 0; margin-left: -90px;
}
.su-box.assembled .su-shimmer { opacity: 1; animation: su-boxshimmer 6s ease-in-out 1.2s infinite; }
@keyframes su-boxshimmer { 0%, 100% { margin-left: -90px; opacity: 0; } 12% { opacity: 1; } 50% { margin-left: 90px; opacity: 1; } 62% { opacity: 0; } }

/* bow (filled satin loops) pops on top */
.su-bow {
  position: absolute; left: 50%; top: 6px; z-index: 5; transform: translateX(-50%) scale(0);
  transform-origin: center bottom; opacity: 0;
  filter: drop-shadow(0 2px 3px rgba(120, 90, 30, .25));
  transition: transform .55s cubic-bezier(.34, 1.56, .64, 1) .72s, opacity .3s ease .72s;
}
.su-box.assembled .su-bow { transform: translateX(-50%) scale(1); opacity: 1; }
.su-bow-loop {
  position: absolute; width: 32px; height: 21px; border-radius: 52% 48% 55% 45%;
  background: radial-gradient(ellipse 60% 55% at 32% 38%, rgba(255, 240, 190, .55), transparent 65%),
    linear-gradient(135deg, #f2d06a 0%, #ddb44a 45%, #b98f28 100%);
  box-shadow: inset 0 -2px 4px rgba(140, 105, 30, .4), inset 0 1px 2px rgba(255, 245, 210, .5);
}
.su-bow-loop.l { left: -30px; top: 0; transform: rotate(-24deg); }
.su-bow-loop.r { left: 0; top: 0; transform: rotate(24deg) scaleX(-1); }
.su-bow-knot {
  position: absolute; left: -5px; top: 5px; width: 13px; height: 12px;
  background: linear-gradient(160deg, #f2d06a, #c99a30 70%, #a8841f); border-radius: 40% 40% 45% 45%;
  box-shadow: inset 0 -1px 2px rgba(120, 90, 30, .45); z-index: 2;
}

/* name tag hanging off the ribbon */
.su-tag {
  position: absolute; left: 50%; top: 70px; z-index: 6; transform: translate(6px, -14px); opacity: 0;
  transition: transform .5s cubic-bezier(.34, 1.4, .6, 1) 1s, opacity .4s ease 1s;
}
.su-box.assembled .su-tag { transform: translate(6px, 0); opacity: 1; }
.su-string {
  position: absolute; left: -2px; top: -14px; width: 1.5px; height: 20px;
  background: rgba(120, 90, 40, .6); transform: rotate(16deg); transform-origin: top;
}
.su-card2 {
  position: relative; background: linear-gradient(160deg, #fffdf6, #f6ecd8);
  padding: 5px 12px 5px 16px; border-radius: 3px; white-space: nowrap;
  font-family: "Noto Serif KR", serif; font-weight: 500; font-size: 12px; color: var(--brown); letter-spacing: .5px;
  box-shadow: 0 2px 6px rgba(61, 43, 31, .16), inset 0 0 0 1px rgba(61, 43, 31, .05);
  transform: rotate(-3deg);
}
.su-card2::before {
  content: ""; position: absolute; left: 6px; top: 50%; width: 5px; height: 5px;
  transform: translateY(-50%); border-radius: 50%; background: rgba(61, 43, 31, .18);
  box-shadow: inset 0 1px 1px rgba(61, 43, 31, .25);
}

/* ===== Celebration message ===== */
.su-msg {
  position: absolute; inset: 0; display: flex; flex-direction: column; z-index: 9;
  align-items: center; justify-content: center; text-align: center; gap: 12px;
  opacity: 0; transition: opacity 1.1s ease; pointer-events: none; padding: 0 26px;
}
.su-msg.show { opacity: 1; }
.su-hundred {
  font-family: "Noto Serif KR", serif; font-weight: 700; font-size: 88px; line-height: 1;
  color: var(--gold); text-shadow: 0 0 26px rgba(244, 190, 58, .65), 0 0 60px rgba(255, 184, 92, .35);
  transform: scale(.7); opacity: 0; transition: transform .9s cubic-bezier(.2, .9, .25, 1), opacity .8s ease;
}
.su-msg.show .su-hundred { transform: scale(1); opacity: 1; }
.su-fhead { font-family: "Noto Serif KR", serif; font-weight: 700; font-size: 24px; color: var(--cream); text-shadow: 0 2px 14px rgba(0, 0, 0, .6); }
.su-fsub { font-family: Gaegu, cursive; font-size: 17px; color: var(--amber); opacity: .95; }
.su-names { font-family: Pretendard, sans-serif; font-size: 12.5px; letter-spacing: .12em; color: rgba(255, 249, 237, .72); margin-top: 4px; }

/* ===== Copy overlays ===== */
.su-title {
  position: absolute; left: 0; right: 0; top: 16%; text-align: center; padding: 0 26px; z-index: 10;
  opacity: 0; transition: opacity 1s ease; pointer-events: none;
}
.su-title.show { opacity: 1; }
.su-tk { font-family: Gaegu, cursive; font-size: 17px; color: var(--amber); text-shadow: 0 1px 8px rgba(0, 0, 0, .7); }
.su-tm {
  font-family: "Noto Serif KR", serif; font-weight: 500; font-size: 21px; margin-top: 6px;
  color: var(--cream); line-height: 1.6; text-shadow: 0 2px 12px rgba(0, 0, 0, .6);
}

/* tap prompts (phase 2 celebrate / phase B gift drop) */
.su-prompt {
  position: absolute; left: 50%; bottom: 12%; transform: translateX(-50%); z-index: 12;
  text-align: center; opacity: 0; transition: opacity .7s ease; pointer-events: none;
}
.su-prompt.show { opacity: 1; }
.su-ripple { position: relative; width: 60px; height: 60px; margin: 0 auto 12px; }
.su-ripple::before, .su-ripple::after {
  content: ""; position: absolute; inset: 0; margin: auto;
  width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255, 243, 208, .85);
  animation: su-ripple 2.2s ease-out infinite;
}
.su-ripple::after { animation-delay: 1.1s; }
.su-core {
  position: absolute; left: 50%; top: 50%; width: 12px; height: 12px; margin: -6px 0 0 -6px;
  border-radius: 50%; background: var(--star); box-shadow: 0 0 12px 4px rgba(244, 190, 58, .7);
}
@keyframes su-ripple { 0% { width: 16px; height: 16px; opacity: .9; } 100% { width: 60px; height: 60px; opacity: 0; } }
.su-ptext {
  font-family: "Noto Serif KR", serif; font-weight: 500; font-size: 16px; color: var(--cream);
  white-space: nowrap; text-shadow: 0 2px 10px rgba(0, 0, 0, .6); animation: su-pulsetext 2.2s ease-in-out infinite;
}
@keyframes su-pulsetext { 0%, 100% { opacity: .72; } 50% { opacity: 1; } }

/* ===== Controls ===== */
.su-skip {
  position: absolute; top: calc(16px + env(safe-area-inset-top)); right: 16px; z-index: 30;
  font-family: Pretendard, sans-serif; font-size: 13px; color: rgba(255, 249, 237, .85);
  background: rgba(20, 14, 40, .4); border: 1px solid rgba(255, 249, 237, .26);
  padding: 9px 14px; border-radius: 22px; min-height: 44px; min-width: 44px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px);
  transition: color .6s, background .6s;
}
.su-stage.golden .su-skip { color: #5a4022; background: rgba(255, 250, 238, .5); border-color: rgba(120, 90, 50, .3); }

@media (prefers-reduced-motion: reduce) {
  .su-universe, .su-bg-night, .su-bg-golden, .su-dust, .su-horizon, .su-godray, .su-ground, .su-gdust,
  .su-glow, .su-lines, .su-star, .su-card, .su-sdot, .su-cap, .su-box,
  .su-top, .su-front, .su-r-v, .su-r-h, .su-r-top, .su-bow, .su-tag, .su-contact,
  .su-title, .su-prompt, .su-msg, .su-hundred, .su-flash, .su-skip { transition: none !important; }
  .su-d, .su-gd, .su-sdot, .su-sweep, .su-face img, .su-face video, .su-bar i,
  .su-godray::after, .su-glow, .su-shimmer, .su-ripple::before, .su-ripple::after,
  .su-ptext { animation: none !important; }
}
</style>
