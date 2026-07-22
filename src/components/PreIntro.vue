<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getLocalizedText, type Locale, type LocalizedText } from '@/content/localization'
import { introCopy, introUi } from '@/content/intro'

const props = defineProps<{ locale: Locale }>()
const emit = defineEmits<{ completed: [] }>()

// One continuous 5-act intro ("One Moon, One Journey") ported from
// design-lab/mockup-25. Canvas 2D + DOM/CSS, no three.js. All narrative copy
// is read live from src/content/intro.ts via L(), so switching language mid
// intro updates subsequent beats.

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const rootRef = ref<HTMLDivElement>()
const skyRef = ref<HTMLCanvasElement>()
const copyRef = ref<HTMLDivElement>()
const act3Ref = ref<HTMLDivElement>()
const act2Ref = ref<HTMLElement>()
const winLayerRef = ref<HTMLElement>()
const flashRef = ref<HTMLDivElement>()
const boardRef = ref<HTMLDivElement>()
const passRef = ref<HTMLDivElement>()
const wstarsRef = ref<HTMLDivElement>()
const wcityambRef = ref<HTMLDivElement>()

const titleHidden = ref(false)
const skipVisible = ref(false)

let completedEmitted = false
function finish() {
  if (completedEmitted) return
  completedEmitted = true
  emit('completed')
}

function L(text: LocalizedText): string {
  return getLocalizedText(text, props.locale)
}

// Reduced-motion static storyboard — a calm set of localized key beats.
const rmItems = computed(() => [
  { text: introCopy.a1[0], name: false },
  { text: introCopy.finalWish, name: false },
  { text: introCopy.a4[0], name: false },
  { text: introCopy.a5[1], name: true },
  { text: introCopy.a5[4], name: false },
] as { text: LocalizedText; name: boolean }[])

// The imperative copy layer, so a language switch re-renders whatever line is
// currently on screen (subsequent beats read the new locale automatically).
let shownCopy: LocalizedText | null = null
let act3Shown = false

function renderCopyDom(str: string) {
  const el = copyRef.value
  if (!el) return
  let html = ''
  str.split('\n').forEach((raw) => {
    const l = raw.replace('苙綺', '<span class="pi-name">苙綺</span>')
    html += '<span class="pi-line">' + l + '</span>'
  })
  el.innerHTML = html
}

watch(() => props.locale, () => {
  if (shownCopy) renderCopyDom(L(shownCopy))
  const a3 = act3Ref.value
  if (a3 && act3Shown) a3.textContent = L(introUi.act3Title)
})

// Handles wired up by the engine once it has mounted.
let engineBegin: () => void = () => {}
let engineSkip: () => void = () => finish()
let teardown: () => void = () => {}

function onTitleTap() {
  engineBegin()
}
function onSkip() {
  engineSkip()
}

onMounted(() => {
  if (reduced) return

  const root = rootRef.value
  const cv = skyRef.value!
  if (!root || !cv) {
    finish()
    return
  }
  const context = cv.getContext('2d')
  if (!context) {
    finish()
    return
  }
  const ctx = context

  const copyEl = copyRef.value as HTMLDivElement
  const act3TitleEl = act3Ref.value as HTMLDivElement
  const act2El = act2Ref.value as HTMLElement
  const winLayer = winLayerRef.value as HTMLElement
  const flashEl = flashRef.value as HTMLDivElement
  const boardEl = boardRef.value as HTMLDivElement
  const passEl = passRef.value as HTMLDivElement

  // ---------------- shared scene state ----------------
  let W = 0
  let H = 0
  let DPR = 1
  let tNow = 0
  let running = false
  let loopRaf = 0
  let lastT = performance.now()
  let canvasScene: 'room' | 'ember' | 'lantern' = 'room'
  let lantActive = false

  let lantHolding = false
  let lantReleased = false
  const lantFaceText = ''

  const room: Record<string, number> = {
    merge: 0, warm: 0, litL: 0, litR: 0, figures: 0, look: 0,
    gift: 0, giftApproach: 0, dim: 0, alpha: 0,
  }
  const ember: Record<string, number> = { grow: 0, alpha: 0 }
  const lant: Record<string, number> = {
    x: 0, y: 0, h: 0, rot: 0, charge: 0, wish: 0, rise: 0,
    moonEclipse: 0, handsAlpha: 1, faceReveal: 0, faceSquash: 1,
  }

  interface Star { x: number; y: number; r: number; ph: number; sp: number; a: number }
  interface Building { x: number; w: number; top: number; ph: number }
  interface Runner { x: number; y: number; v: number; r: number; len: number; ph: number }
  interface Ridge { pts: number[]; base: number; amp: number; par: number; color: string }
  interface CrowdItem { sx: number; sy: number; ex: number; ey: number; z: number; t: number; dur: number; ph: number; tw: number }
  interface Ember { x: number; y: number; vx: number; vy: number; life: number; age: number; s: number }
  interface Mist { x: number; y: number; r: number; a: number; sp: number; par: number }
  interface Hole { x: number; y: number; w: number; h: number }
  interface LanternOpts { squash?: number; faceText?: string; faceReveal?: number; litLevel?: number }
  interface Sprite { c: HTMLCanvasElement; ox: number; oy: number; h: number }

  let crowd: CrowdItem[] = []
  let embers: Ember[] = []
  let lanternSprite: Sprite | null = null

  const COLS = 11
  const boardRows: Flap[][] = []

  // ---------------- math helpers ----------------
  function clamp(v: number, a: number, b: number) { return v < a ? a : (v > b ? b : v) }
  function clamp01(v: number) { return v < 0 ? 0 : (v > 1 ? 1 : v) }
  function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
  function eio(t: number) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2 }
  function eo(t: number) { return 1 - Math.pow(1 - t, 3) }
  function ei(t: number) { return t * t * t }
  function ss(a: number, b: number, t: number) { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x) }
  function mulberry32(seed: number) {
    let a = seed
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0
      let t = Math.imul(a ^ a >>> 15, 1 | a)
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
      return ((t ^ t >>> 14) >>> 0) / 4294967296
    }
  }
  function vibrate(p: number | number[]) { try { if (navigator.vibrate) navigator.vibrate(p) } catch { /* ignore */ } }

  // ---------------- color helpers ----------------
  function hexToRgb(h: string): number[] {
    if (h.charAt(0) !== '#') { const g = h.match(/\d+/g) || ['0', '0', '0']; return [+g[0] || 0, +g[1] || 0, +g[2] || 0] }
    const s = h.replace('#', '')
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]
  }
  function mix(a: string, b: string, t: number) {
    const A = hexToRgb(a), B = hexToRgb(b)
    return 'rgb(' + Math.round(lerp(A[0], B[0], t)) + ',' + Math.round(lerp(A[1], B[1], t)) + ',' + Math.round(lerp(A[2], B[2], t)) + ')'
  }
  function rgbaMix(rgbStr: string, alpha: number, mul?: number) {
    const m = rgbStr.match(/\d+/g) || ['0', '0', '0']
    return 'rgba(' + m[0] + ',' + m[1] + ',' + m[2] + ',' + (alpha * (mul === undefined ? 1 : mul)) + ')'
  }

  // ---------------- procedural scene data ----------------
  const rngS = mulberry32(20260626)
  const stars: Star[] = []
  for (let i = 0; i < 130; i++) stars.push({ x: rngS(), y: rngS() * 0.6, r: 0.4 + rngS() * 1.0, ph: rngS() * 7, sp: 0.4 + rngS() * 1.3, a: 0.25 + rngS() * 0.55 })
  const buildings: Building[] = []
  for (let b = 0; b < 26; b++) buildings.push({ x: rngS(), w: 0.02 + rngS() * 0.03, top: 0.6 + rngS() * 0.09, ph: rngS() * 7 })
  const runners: Runner[] = []
  for (let i2 = 0; i2 < 24; i2++) runners.push({ x: rngS(), y: rngS() * 1.2 - 0.2, v: 0.16 + rngS() * 0.32, r: 1.0 + rngS() * 1.1, len: 0.05 + rngS() * 0.06, ph: rngS() * 7 })

  function makeRidge(seed: number, segs: number): number[] {
    const r = mulberry32(seed)
    const p1 = r() * 10, p2 = r() * 10, p3 = r() * 10, pts: number[] = []
    for (let i = 0; i <= segs; i++) { const t = i / segs; pts.push(Math.sin(t * 3.1 + p1) * 0.5 + Math.sin(t * 7.3 + p2) * 0.3 + Math.sin(t * 13.7 + p3) * 0.2) }
    return pts
  }
  const ridges: Ridge[] = [
    { pts: makeRidge(11, 46), base: 0.66, amp: 0.05, par: 0.12, color: '#2b2118' },
    { pts: makeRidge(22, 42), base: 0.74, amp: 0.07, par: 0.26, color: '#221a12' },
    { pts: makeRidge(33, 38), base: 0.83, amp: 0.09, par: 0.45, color: '#1a140d' },
    { pts: makeRidge(44, 34), base: 0.92, amp: 0.10, par: 0.68, color: '#120d08' },
  ]
  const mistRng = mulberry32(99)
  const lantMist: Mist[] = []
  for (let mi = 0; mi < 6; mi++) lantMist.push({ x: mistRng(), y: 0.5 + mistRng() * 0.32, r: 120 + mistRng() * 160, a: 0.035 + mistRng() * 0.03, sp: (0.006 + mistRng() * 0.01) * (mistRng() > 0.5 ? 1 : -1), par: 0.2 + mistRng() * 0.3 })

  // ---------------- timers / abortable gates ----------------
  const timers = new Set<number>()
  function sto(fn: () => void, ms: number) {
    const id = window.setTimeout(() => { timers.delete(id); fn() }, ms)
    timers.add(id)
    return id
  }
  function cto(id: number) { timers.delete(id); window.clearTimeout(id) }

  let pending: Array<() => void> = []
  const SKIP = 'SKIP'
  function sleep(ms: number) {
    return new Promise<void>((res, rej) => {
      let done = false
      const id = sto(() => { if (done) return; done = true; res() }, ms)
      pending.push(() => { if (done) return; done = true; cto(id); rej(SKIP) })
    })
  }
  function doSkip() {
    const p = pending
    pending = []
    for (const fn of p) { try { fn() } catch { /* ignore */ } }
  }
  function tween(obj: Record<string, number>, prop: string, to: number, ms: number, ease: (t: number) => number = eio) {
    return new Promise<void>((res, rej) => {
      const from = obj[prop], t0 = performance.now()
      let done = false
      pending.push(() => { if (!done) { done = true; obj[prop] = to; rej(SKIP) } })
      const step = (now: number) => {
        if (done) return
        const k = clamp01((now - t0) / ms)
        obj[prop] = lerp(from, to, ease(k))
        if (k >= 1) { done = true; res() } else requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    })
  }

  // ---------------- copy layer ----------------
  function showCopy(text: LocalizedText, warm: boolean) {
    shownCopy = text
    copyEl.classList.toggle('pi-warm', warm)
    renderCopyDom(L(text))
  }
  function copy(text: LocalizedText, holdMs: number, warm = false) {
    showCopy(text, warm)
    void copyEl.offsetWidth
    copyEl.classList.add('pi-show')
    return sleep(holdMs)
      .then(() => { copyEl.classList.remove('pi-show'); shownCopy = null })
      .then(() => sleep(560))
  }

  // ---------------- canvas ----------------
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1)
    W = window.innerWidth; H = window.innerHeight
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR)
    cv.style.width = W + 'px'; cv.style.height = H + 'px'
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
  }

  function moonPos() { return { r: Math.min(W, H) * 0.085, y: 0.30 * H } }

  function drawRoom() {
    const warm = room.warm
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, mix('#161320', '#241a16', warm))
    g.addColorStop(0.55, mix('#221b2a', '#3a2820', warm))
    g.addColorStop(0.85, mix('#2a2028', '#5a3b24', warm))
    g.addColorStop(1, '#1a1612')
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)

    const starFade = (1 - room.dim * 0.6) * room.alpha
    ctx.fillStyle = '#fff6e2'
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i]; const tw = 0.6 + 0.4 * Math.sin(tNow * s.sp + s.ph)
      ctx.globalAlpha = s.a * tw * starFade; ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, 7); ctx.fill()
    }
    ctx.globalAlpha = 1

    const mp = moonPos()
    const m = room.merge
    const mxL = lerp(0.2675, 0.5, m) * W
    const mxR = lerp(0.7325, 0.5, m) * W
    const mAlpha = room.alpha
    drawMoon(mxL, mp.y, mp.r, warm, mAlpha)
    const gap = Math.abs(mxR - mxL)
    if (gap > 1) drawMoon(mxR, mp.y, mp.r, warm, mAlpha * clamp01(gap / (mp.r * 1.6)))

    drawSkyline(warm)

    const holesArr: Hole[] = m < 0.5
      ? [{ x: 0.05 * W, y: 0.11 * H, w: 0.42 * W, h: 0.66 * H }, { x: 0.53 * W, y: 0.11 * H, w: 0.42 * W, h: 0.66 * H }]
      : [{ x: 0.06 * W, y: 0.11 * H, w: 0.88 * W, h: 0.66 * H }]
    drawWindowGlow(0.26 * W, 0.44 * H, room.litL * (1 - m))
    drawWindowGlow(0.74 * W, 0.44 * H, room.litR * (1 - m))

    drawRain(m < 0.5 ? { x: 0.53 * W, y: 0.11 * H, w: 0.42 * W, h: 0.66 * H } : holesArr[0], (1 - m) * room.alpha)

    drawWall(holesArr, warm)

    const fy = 0.77 * H
    const lx = lerp(lerp(0.26, 0.44, m), 0.455, room.figures) * W
    const rx = lerp(lerp(0.74, 0.56, m), 0.545, room.figures) * W
    drawFigure(lx, fy, 1.0, room.look, warm, room.alpha)
    drawFigure(rx, fy, 0.94, room.look, warm, room.alpha)

    if (room.gift > 0) drawGiftInHand(rx, fy, room.gift, room.giftApproach)

    if (room.dim > 0) { ctx.fillStyle = 'rgba(12,9,7,' + (room.dim * 0.5) + ')'; ctx.fillRect(0, 0, W, H) }
  }

  function drawMoon(mx: number, my: number, r: number, warm: number, alpha: number) {
    if (alpha <= 0.003) return
    const col = mix('#fcfaf4', '#ffd884', warm)
    ctx.save()
    const halo = ctx.createRadialGradient(mx, my, r * 0.6, mx, my, r * (4 + warm * 1.4))
    halo.addColorStop(0, rgbaMix(col, 0.20 + warm * 0.1 * alpha, alpha))
    halo.addColorStop(1, rgbaMix(col, 0, 0))
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(mx, my, r * (4 + warm * 1.4), 0, 7); ctx.fill()
    const disc = ctx.createRadialGradient(mx - r * 0.28, my - r * 0.3, r * 0.1, mx, my, r)
    disc.addColorStop(0, rgbaMix(mix(col, '#fffffa', 0.5), 1, alpha))
    disc.addColorStop(0.78, rgbaMix(col, 1, alpha))
    disc.addColorStop(1, rgbaMix(mix(col, '#b6b0a0', 0.35), 1, alpha))
    ctx.fillStyle = disc; ctx.beginPath(); ctx.arc(mx, my, r, 0, 7); ctx.fill()
    ctx.globalAlpha = 0.06 * alpha; ctx.fillStyle = '#8a8272'
    ctx.beginPath(); ctx.arc(mx + r * 0.32, my - r * 0.1, r * 0.18, 0, 7); ctx.fill()
    ctx.beginPath(); ctx.arc(mx - r * 0.15, my + r * 0.35, r * 0.13, 0, 7); ctx.fill()
    ctx.restore(); ctx.globalAlpha = 1
  }

  function drawSkyline(warm: number) {
    ctx.fillStyle = mix('#12101a', '#1c130d', warm)
    for (let i = 0; i < buildings.length; i++) { const b = buildings[i]; ctx.fillRect(b.x * W, b.top * H, b.w * W, (0.81 - b.top) * H) }
    ctx.fillStyle = '#ffb85c'
    for (let i2 = 0; i2 < buildings.length; i2++) {
      const b2 = buildings[i2]; const fl = 0.6 + 0.4 * Math.sin(tNow * 0.6 + b2.ph); ctx.globalAlpha = 0.4 * fl * room.alpha
      ctx.fillRect(b2.x * W + b2.w * W * 0.4, (b2.top + 0.03) * H, 1.6, 1.6)
    }
    ctx.globalAlpha = 1
  }

  function drawWindowGlow(cx: number, cy: number, amt: number) {
    if (amt <= 0.01) return
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 0.26 * W)
    g.addColorStop(0, 'rgba(255,190,110,' + (0.16 * amt) + ')'); g.addColorStop(1, 'rgba(255,190,110,0)')
    ctx.fillStyle = g; ctx.fillRect(cx - 0.3 * W, cy - 0.3 * H, 0.6 * W, 0.6 * H)
  }

  function drawRain(hole: Hole, alpha: number) {
    if (alpha <= 0.02) return
    ctx.save(); ctx.beginPath(); ctx.rect(hole.x, hole.y, hole.w, hole.h); ctx.clip()
    ctx.fillStyle = 'rgba(96,124,164,' + (0.05 * alpha) + ')'; ctx.fillRect(hole.x, hole.y, hole.w, hole.h)
    for (let i = 0; i < runners.length; i++) {
      const rr = runners[i]
      rr.y += rr.v * 0.016 * (0.85 + 0.3 * Math.sin(tNow * 2 + rr.ph))
      if (rr.y > 1.05) { rr.y = -0.15 - Math.random() * 0.25; rr.x = Math.random() }
      const px = hole.x + rr.x * hole.w, py = hole.y + rr.y * hole.h, tail = rr.len * hole.h
      const g = ctx.createLinearGradient(px, py - tail, px, py)
      g.addColorStop(0, 'rgba(205,224,255,0)'); g.addColorStop(1, 'rgba(215,232,255,' + (0.28 * alpha) + ')')
      ctx.strokeStyle = g; ctx.lineWidth = rr.r * 0.85; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(px, py - tail); ctx.lineTo(px, py); ctx.stroke()
      ctx.fillStyle = 'rgba(255,249,237,' + (0.4 * alpha) + ')'
      ctx.beginPath(); ctx.arc(px - rr.r * 0.3, py - rr.r * 0.35, rr.r * 0.36, 0, 7); ctx.fill()
    }
    ctx.restore()
  }

  function drawWall(holesArr: Hole[], warm: number) {
    ctx.save(); ctx.globalAlpha = room.alpha
    ctx.fillStyle = mix('#0a070a', '#120c07', warm)
    ctx.beginPath(); ctx.rect(-20, -20, W + 40, H + 40)
    for (let i = 0; i < holesArr.length; i++) { const h = holesArr[i]; ctx.rect(h.x, h.y, h.w, h.h) }
    ctx.fill('evenodd')
    for (let j = 0; j < holesArr.length; j++) {
      const h2 = holesArr[j]
      ctx.strokeStyle = 'rgba(255,240,210,0.10)'; ctx.lineWidth = 2; ctx.strokeRect(h2.x, h2.y, h2.w, h2.h)
      ctx.fillStyle = mix('#171017', '#231710', warm); ctx.fillRect(h2.x - 8, h2.y + h2.h, h2.w + 16, 0.014 * H)
    }
    ctx.restore(); ctx.globalAlpha = 1
  }

  function drawFigure(cx: number, shY: number, scale: number, look: number, warm: number, alpha: number) {
    if (alpha <= 0.02) return
    const sw = 0.058 * W * scale * (W > 600 ? 0.62 : 1)
    const headR = 0.028 * H * scale
    const hx = cx, hy = shY - 0.016 * H - headR * 1.12 - look * 0.006 * H
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#0a0709'
    ctx.beginPath()
    ctx.moveTo(cx - sw, H + 6); ctx.lineTo(cx - sw, shY + 0.03 * H)
    ctx.quadraticCurveTo(cx - sw, shY, cx - sw * 0.48, shY - 0.009 * H)
    ctx.quadraticCurveTo(cx, shY - 0.017 * H, cx + sw * 0.48, shY - 0.009 * H)
    ctx.quadraticCurveTo(cx + sw, shY, cx + sw, shY + 0.03 * H)
    ctx.lineTo(cx + sw, H + 6); ctx.closePath(); ctx.fill()
    ctx.beginPath(); ctx.arc(hx, hy, headR, 0, 7); ctx.fill()
    const col = mix('#fcfaf4', '#ffd884', warm)
    ctx.strokeStyle = rgbaMix(col, (0.13 + 0.2 * look), alpha); ctx.lineWidth = 1.6
    ctx.beginPath(); ctx.arc(hx, hy, headR + 0.6, -2.55, -0.55); ctx.stroke()
    ctx.restore(); ctx.globalAlpha = 1
  }

  function drawGiftInHand(cx: number, shY: number, amt: number, approach: number) {
    const hy = shY - 0.02 * H
    const hx = cx - 0.05 * W
    ctx.save(); ctx.globalCompositeOperation = 'screen'
    const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, 60 * amt + approach * W)
    glow.addColorStop(0, 'rgba(255,224,150,' + (0.6 * amt) + ')')
    glow.addColorStop(0.5, 'rgba(255,184,92,' + (0.3 * amt) + ')')
    glow.addColorStop(1, 'rgba(255,184,92,0)')
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(hx, hy, 60 * amt + approach * W, 0, 7); ctx.fill()
    ctx.restore()
    if (amt < 0.5) return
    const boxAmt = clamp01((amt - 0.5) / 0.5)
    const size = (0.10 + approach * 1.6) * Math.min(W, H)
    const bx = lerp(hx, 0.5 * W, approach)
    const by = lerp(hy, 0.5 * H, approach)
    ctx.save(); ctx.translate(bx, by)
    const s = size * boxAmt
    const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 1.6)
    gg.addColorStop(0, 'rgba(255,200,110,.5)'); gg.addColorStop(1, 'rgba(255,200,110,0)')
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, 0, s * 1.6, 0, 7); ctx.fill()
    const bg = ctx.createLinearGradient(-s, -s, s, s)
    bg.addColorStop(0, '#ffe6a8'); bg.addColorStop(0.5, '#f4be3a'); bg.addColorStop(1, '#c8892a')
    ctx.fillStyle = bg; roundRect(-s * 0.55, -s * 0.35, s * 1.1, s * 0.85, s * 0.08); ctx.fill()
    ctx.fillStyle = '#ffe6a8'; roundRect(-s * 0.62, -s * 0.5, s * 1.24, s * 0.24, s * 0.06); ctx.fill()
    ctx.fillStyle = '#fff1cd'; ctx.fillRect(-s * 0.09, -s * 0.5, s * 0.18, s * 0.85)
    ctx.restore()
  }
  function roundRect(x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
  }

  // ---------------- ember bridge ----------------
  function drawEmber() {
    ctx.fillStyle = '#140f0a'; ctx.fillRect(0, 0, W, H)
    const cx = 0.5 * W, cy = 0.5 * H, g = ember.grow
    ctx.save(); ctx.globalCompositeOperation = 'screen'
    const R = lerp(6, 0.16 * Math.min(W, H), g)
    const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 3)
    gr.addColorStop(0, 'rgba(255,240,200,' + (0.9 * ember.alpha) + ')')
    gr.addColorStop(0.4, 'rgba(255,180,80,' + (0.55 * ember.alpha) + ')')
    gr.addColorStop(1, 'rgba(255,150,60,0)')
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R * 3, 0, 7); ctx.fill()
    ctx.restore()
  }

  // ---------------- lantern scene ----------------
  function lanternPath(g: CanvasRenderingContext2D, h: number) {
    const tw = h * 0.34, bw = h * 0.185
    g.beginPath(); g.moveTo(-bw, 0)
    g.bezierCurveTo(-tw * 1.06, -h * 0.24, -tw * 1.04, -h * 0.60, -tw * 0.82, -h * 0.86)
    g.quadraticCurveTo(0, -h * 1.06, tw * 0.82, -h * 0.86)
    g.bezierCurveTo(tw * 1.04, -h * 0.60, tw * 1.06, -h * 0.24, bw, 0); g.closePath()
  }
  function drawLanternShape(g: CanvasRenderingContext2D, x: number, y: number, h: number, c: number, rot: number, opts?: LanternOpts) {
    g.save(); g.translate(x, y); if (rot) g.rotate(rot)
    if (opts && opts.squash != null) g.scale(Math.max(0.001, opts.squash), 1)
    if (c > 0.02) {
      const gr = g.createRadialGradient(0, -h * 0.5, h * 0.05, 0, -h * 0.5, h * (0.9 + 1.1 * c))
      gr.addColorStop(0, 'rgba(255,190,100,' + (0.34 * c) + ')'); gr.addColorStop(0.5, 'rgba(244,160,58,' + (0.13 * c) + ')'); gr.addColorStop(1, 'rgba(244,160,58,0)')
      g.fillStyle = gr; g.fillRect(-h * 2.2, -h * 2.7, h * 4.4, h * 4.6)
    }
    lanternPath(g, h)
    const pg = g.createLinearGradient(0, -h * 1.06, 0, 0); pg.addColorStop(0, '#3b332a'); pg.addColorStop(1, '#4c4134')
    g.fillStyle = pg; g.fill()
    g.save(); lanternPath(g, h); g.clip()
    if (c > 0.01) {
      const lr = g.createRadialGradient(0, -h * 0.10, h * 0.02, 0, -h * 0.18, h * (0.18 + 1.15 * c))
      lr.addColorStop(0, 'rgba(255,236,190,' + (0.95 * c) + ')'); lr.addColorStop(0.35, 'rgba(255,196,110,' + (0.88 * c) + ')')
      lr.addColorStop(0.75, 'rgba(244,190,58,' + (0.5 * c) + ')'); lr.addColorStop(1, 'rgba(210,140,40,0)')
      g.fillStyle = lr; g.fillRect(-h, -h * 1.1, h * 2, h * 1.2)
    }
    g.strokeStyle = 'rgba(70,38,14,' + (0.1 + 0.12 * c) + ')'; g.lineWidth = Math.max(0.5, h * 0.006)
    for (let i = -2; i <= 2; i++) { if (!i) continue; g.beginPath(); g.moveTo(i * h * 0.09, 0); g.quadraticCurveTo(i * h * 0.155, -h * 0.5, i * h * 0.10, -h * 0.98); g.stroke() }
    if (opts && opts.faceText) drawFaceInk(g, h, opts.faceText, opts.faceReveal || 0, (opts.litLevel != null ? opts.litLevel : c), (opts.squash != null ? opts.squash : 1))
    g.restore()
    g.strokeStyle = 'rgba(30,18,8,.9)'; g.lineWidth = Math.max(1, h * 0.014)
    g.beginPath(); g.moveTo(-h * 0.185, 0); g.lineTo(h * 0.185, 0); g.stroke()
    if (c > 0.02) {
      const fr = h * 0.05 * (0.5 + 0.7 * c) * (1 + 0.15 * Math.sin(tNow * 21 + Math.sin(tNow * 9) * 2))
      const fg = g.createRadialGradient(0, -fr * 0.9, 0, 0, -fr * 0.9, fr * 3)
      fg.addColorStop(0, 'rgba(255,240,200,' + (0.9 * c) + ')'); fg.addColorStop(0.4, 'rgba(255,180,80,' + (0.55 * c) + ')'); fg.addColorStop(1, 'rgba(255,150,60,0)')
      g.fillStyle = fg; g.beginPath(); g.arc(0, -fr * 0.9, fr * 3, 0, 7); g.fill()
    }
    g.restore()
  }
  function drawFaceInk(g: CanvasRenderingContext2D, h: number, str: string, alpha: number, lit: number, squash: number) {
    const a = alpha * clamp01((squash - 0.35) / 0.35)
    if (a <= 0.01 || !str) return
    const ls = str.split('\n'), fs = h * 0.072, lh = fs * 1.6
    const col = mix('#ffedcf', '#5c3012', clamp01(lit))
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'
    g.font = '500 ' + fs + "px 'Noto Serif KR', serif"
    const cy = -h * 0.60, startY = cy - (ls.length - 1) * lh / 2
    for (let i = 0; i < ls.length; i++) {
      const y = startY + i * lh + (1 - alpha) * h * 0.022
      const haloA = (1 - clamp01(lit)) * 0.55 * a
      if (haloA > 0.01) { g.fillStyle = 'rgba(16,9,4,' + haloA + ')'; g.fillText(ls[i], h * 0.006, y + h * 0.006) }
      g.fillStyle = rgbaMix(col, 0.95 * a); g.fillText(ls[i], 0, y)
    }
    g.restore()
  }
  function makeSprite() {
    try {
      const h = 100, c = document.createElement('canvas'); c.width = Math.ceil(h * 3); c.height = Math.ceil(h * 3.4)
      const g = c.getContext('2d'); if (!g) { lanternSprite = null; return }
      drawLanternShape(g, c.width / 2, h * 2.5, h, 1, 0)
      lanternSprite = { c: c, ox: c.width / 2, oy: h * 2.5, h: h }
    } catch { lanternSprite = null }
  }
  function spawnCrowd(side: string) {
    if (crowd.length > 40) return
    const r = Math.random
    let sx = 0, sy = 0, ex = 0, ey = 0, dur = 0, z = 0.35 + r() * 0.6
    if (side === 'L') { sx = -W * 0.15; sy = H * (0.6 + r() * 0.3); ex = W * (0.16 + r() * 0.3); ey = H * (0.1 + r() * 0.24); dur = 6 + r() * 3 }
    else if (side === 'R') { sx = W * 1.15; sy = H * (0.6 + r() * 0.3); ex = W * (0.52 + r() * 0.3); ey = H * (0.1 + r() * 0.24); dur = 6 + r() * 3 }
    else { sx = W * (0.1 + r() * 0.8); sy = H * (1.1 + r() * 0.15); ex = clamp(sx + (r() - 0.5) * W * 0.2, W * 0.08, W * 0.92); ey = H * (0.08 + r() * 0.5); dur = 7 + r() * 3; z = 0.3 + r() * 0.5 }
    crowd.push({ sx, sy, ex, ey, z, t: 0, dur, ph: r() * 7, tw: 1 + r() * 1.5 })
  }
  function spawnSpark(x: number, y: number, spread: number) {
    const r = Math.random
    embers.push({ x: x + (r() - 0.5) * spread, y: y, vx: (r() - 0.5) * 26, vy: -(28 + r() * 55), life: 1 + r() * 1.6, age: 0, s: 0.8 + r() * 1.4 })
    if (embers.length > 80) embers.splice(0, embers.length - 80)
  }
  function drawSceneMoon(mx: number, my: number, r: number) {
    ctx.save()
    const halo = ctx.createRadialGradient(mx, my, r * 0.6, mx, my, r * 4)
    halo.addColorStop(0, 'rgba(255,230,176,.22)'); halo.addColorStop(1, 'rgba(255,230,176,0)')
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(mx, my, r * 4, 0, 7); ctx.fill()
    const disc = ctx.createRadialGradient(mx - r * 0.3, my - r * 0.3, r * 0.1, mx, my, r)
    disc.addColorStop(0, '#fff6df'); disc.addColorStop(1, '#ffcf86')
    ctx.fillStyle = disc; ctx.beginPath(); ctx.arc(mx, my, r, 0, 7); ctx.fill()
    ctx.restore()
  }
  function drawLanternScene() {
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#14100d'); sky.addColorStop(0.55, '#1a1612'); sky.addColorStop(1, '#221a12')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
    const cam = lant.rise * H * 0.85
    ctx.fillStyle = '#ffeecb'
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i]; const y = ((s.y * H + cam * 0.06) % (H * 1.15))
      ctx.globalAlpha = s.a * (0.55 + 0.45 * Math.sin(tNow * s.sp + s.ph)); ctx.fillRect(s.x * W, y, s.r, s.r)
    }
    ctx.globalAlpha = 1
    const mmy = 0.16 * H + cam * 0.05
    drawSceneMoon(0.68 * W, mmy, Math.min(W, H) * 0.06)
    const hy = H * ridges[0].base + cam * ridges[0].par
    const hg = ctx.createLinearGradient(0, hy - H * 0.18, 0, hy + H * 0.05); hg.addColorStop(0, 'rgba(244,190,58,0)'); hg.addColorStop(1, 'rgba(244,170,80,.07)')
    ctx.fillStyle = hg; ctx.fillRect(0, hy - H * 0.18, W, H * 0.23)
    for (let li = 0; li < ridges.length; li++) {
      const Lr = ridges[li]; const baseY = H * Lr.base + cam * Lr.par
      ctx.fillStyle = Lr.color; ctx.beginPath(); ctx.moveTo(-2, H + 10)
      const n = Lr.pts.length - 1; for (let k = 0; k <= n; k++) ctx.lineTo(k / n * W, baseY + Lr.pts[k] * Lr.amp * H)
      ctx.lineTo(W + 2, H + 10); ctx.closePath(); ctx.fill()
      if (li === 1) {
        for (let mq = 0; mq < lantMist.length; mq++) {
          const mb = lantMist[mq]
          const bx = (((mb.x + tNow * mb.sp) % 1.4 + 1.4) % 1.4 - 0.2) * W, by = H * mb.y + cam * mb.par
          ctx.save(); ctx.translate(bx, by); ctx.scale(1, 0.35)
          const mg = ctx.createRadialGradient(0, 0, 0, 0, 0, mb.r); mg.addColorStop(0, 'rgba(210,190,160,' + mb.a + ')'); mg.addColorStop(1, 'rgba(210,190,160,0)')
          ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(0, 0, mb.r, 0, 7); ctx.fill(); ctx.restore()
        }
      }
    }
    if (lanternSprite && crowd.length) {
      const sorted = crowd.slice().sort((a, b) => a.z - b.z)
      for (let c = 0; c < sorted.length; c++) {
        const Lc = sorted[c]; const p = eio(Math.min(1, Lc.t / Lc.dur))
        const x = lerp(Lc.sx, Lc.ex, p) + Math.sin(tNow * 0.6 + Lc.ph) * 10 * Lc.z
        const y = lerp(Lc.sy, Lc.ey, p) - Math.max(0, Lc.t - Lc.dur) * 5 * Lc.z
        const a = Math.min(1, Lc.t / 1.5) * (0.5 + 0.5 * Lc.z)
        const sc = (Lc.z * H * 0.07) / lanternSprite.h; ctx.globalAlpha = a
        ctx.drawImage(lanternSprite.c, x - lanternSprite.ox * sc, y - lanternSprite.oy * sc, lanternSprite.c.width * sc, lanternSprite.c.height * sc)
      }
      ctx.globalAlpha = 1
    }
    if (lant.h > 1) {
      const lit = Math.max(lant.charge, lant.wish > 0 ? 1 : 0)
      drawLanternShape(ctx, lant.x, lant.y, lant.h, lit, lant.rot, { squash: lant.faceSquash, faceText: lantFaceText, faceReveal: lant.faceReveal, litLevel: lit })
    }
    for (let e = 0; e < embers.length; e++) {
      const em = embers[e]; const f = 1 - em.age / em.life
      ctx.globalAlpha = f * 0.9; ctx.fillStyle = '#ffcf7a'; ctx.beginPath(); ctx.arc(em.x, em.y, em.s, 0, 7); ctx.fill()
    }
    ctx.globalAlpha = 1
    if (lant.handsAlpha > 0.01) {
      ctx.save(); ctx.globalAlpha = lant.handsAlpha
      const drop = (1 - lant.handsAlpha) * H * 0.35; ctx.fillStyle = '#0b0805'
      ctx.beginPath(); ctx.moveTo(-2, H + 2); ctx.lineTo(-2, H * 0.94 + drop)
      ctx.quadraticCurveTo(W * 0.5, H * 0.845 + drop, W + 2, H * 0.94 + drop); ctx.lineTo(W + 2, H + 2); ctx.closePath(); ctx.fill()
      if (lant.charge > 0.03) {
        const sp = ctx.createRadialGradient(lant.x, H * 0.88 + drop, 0, lant.x, H * 0.88 + drop, H * 0.22)
        sp.addColorStop(0, 'rgba(244,170,70,' + (0.16 * lant.charge) + ')'); sp.addColorStop(1, 'rgba(244,170,70,0)')
        ctx.fillStyle = sp; ctx.fillRect(0, H * 0.7, W, H * 0.35)
      }
      ctx.restore()
    }
  }

  function renderFrame() {
    ctx.clearRect(0, 0, W, H)
    if (canvasScene === 'room') drawRoom()
    else if (canvasScene === 'ember') drawEmber()
    else if (canvasScene === 'lantern') drawLanternScene()
  }

  function update(dt: number) {
    if (lantActive) {
      if (lantHolding) { lant.charge = Math.min(1, lant.charge + dt / 2.0); lant.wish = Math.min(1, lant.wish + dt / 2.0) }
      else if (!lantReleased) { lant.charge = Math.max(0, lant.charge - dt / 1.4) }
      const swayT = (Math.sin(tNow * 0.7) * 0.02 * Math.max(lant.charge, lant.wish > 0 ? 1 : 0))
      lant.rot += (swayT - lant.rot) * clamp01(dt * 3)
      const lit = lant.charge > 0.15 || lant.wish > 0
      if (lit && Math.random() < (lantHolding ? lant.charge * 0.4 : 0.25)) spawnSpark(lant.x, lant.y - lant.h * 0.12, lant.h * 0.3)
      for (let i = embers.length - 1; i >= 0; i--) { const e = embers[i]; e.age += dt; e.x += e.vx * dt + Math.sin(tNow * 3 + e.y * 0.02) * 12 * dt; e.y += e.vy * dt; if (e.age >= e.life) embers.splice(i, 1) }
      for (let c = 0; c < crowd.length; c++) crowd[c].t += dt
    }
  }

  function loop(now: number) {
    if (!running) return
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; tNow += dt
    update(dt); renderFrame()
    loopRaf = requestAnimationFrame(loop)
  }

  // ---------------- split-flap departure board ----------------
  const LATIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ- '
  class Flap {
    cur = ' '
    el: HTMLDivElement
    sT: HTMLElement; sB: HTMLElement; fT: HTMLElement; fB: HTMLElement
    constructor(parent: HTMLElement) {
      const el = document.createElement('div'); el.className = 'pi-cell'
      el.innerHTML = '<div class="pi-half pi-top"><span> </span></div><div class="pi-half pi-bottom"><span> </span></div><div class="pi-half pi-top pi-flip pi-ft"><span> </span></div><div class="pi-half pi-bottom pi-flip pi-fb"><span> </span></div>'
      parent.appendChild(el); this.el = el
      this.sT = el.children[0].firstElementChild as HTMLElement
      this.sB = el.children[1].firstElementChild as HTMLElement
      this.fT = el.children[2].firstElementChild as HTMLElement
      this.fB = el.children[3].firstElementChild as HTMLElement
    }
    set(ch: string) { this.cur = ch; const t = ch === ' ' ? ' ' : ch; this.sT.textContent = t; this.sB.textContent = t }
    step(next: string, fd: number) {
      return new Promise<void>((res) => {
        const nt = next === ' ' ? ' ' : next, ct = this.cur === ' ' ? ' ' : this.cur
        this.fT.textContent = ct; this.fB.textContent = nt; this.sT.textContent = nt
        const el = this.el; el.style.setProperty('--fd', fd + 'ms'); el.classList.remove('pi-go'); void el.offsetWidth; el.classList.add('pi-go')
        sto(() => { this.sB.textContent = nt; this.cur = next; el.classList.remove('pi-go'); res() }, fd * 2 + 18)
      })
    }
    flipTo(target: string, fd = 54) {
      const steps = target === ' ' ? 1 : (3 + Math.floor(Math.random() * 4))
      const seq: string[] = []
      let last = this.cur, c: string
      for (let i = 0; i < steps; i++) { do { c = LATIN[Math.floor(Math.random() * LATIN.length)] } while (c === target || c === last); seq.push(c); last = c }
      seq.push(target)
      return seq.reduce((p, ch) => p.then(() => this.step(ch, fd)), Promise.resolve())
    }
  }
  function buildBoard() {
    for (let r = 0; r < 2; r++) {
      const row = document.createElement('div'); row.className = 'pi-frow pi-hero'; boardEl.appendChild(row)
      const cells: Flap[] = []; for (let c = 0; c < COLS; c++) cells.push(new Flap(row)); boardRows.push(cells)
    }
    setRow(0, 'FROM  -----'); setRow(1, 'TO   ------')
  }
  function setRow(idx: number, str: string) {
    const a = Array.from(str); while (a.length < COLS) a.push(' ')
    for (let i = 0; i < COLS; i++) boardRows[idx][i].set(a[i])
  }
  function spellRow(idx: number, str: string) {
    const a = Array.from(str); while (a.length < COLS) a.push(' ')
    return Promise.all(boardRows[idx].map((cell, i) => new Promise<void>((res) => { sto(() => { cell.flipTo(a[i]).then(res) }, i * 60) })))
  }
  function buildWinSky() {
    const st = wstarsRef.value
    if (st) {
      for (let i = 0; i < 40; i++) {
        const s = document.createElement('i'); const sz = (Math.random() * 1.4 + 0.8).toFixed(1)
        s.style.width = sz + 'px'; s.style.height = sz + 'px'; s.style.left = (Math.random() * 100) + '%'; s.style.top = (Math.random() * 86) + '%'
        s.style.animationDelay = (Math.random() * 3.2).toFixed(2) + 's'; s.style.opacity = (Math.random() * 0.5 + 0.3).toFixed(2); st.appendChild(s)
      }
    }
    const amb = wcityambRef.value
    if (amb) {
      for (let j = 0; j < 80; j++) {
        const d = document.createElement('i'); const sz2 = (Math.random() * 2 + 1).toFixed(1)
        d.style.width = sz2 + 'px'; d.style.height = sz2 + 'px'; d.style.left = (Math.random() * 100) + '%'; d.style.top = (Math.random() * 100) + '%'
        d.style.opacity = (Math.random() * 0.5 + 0.12).toFixed(2); d.style.animationDelay = (Math.random() * 4).toFixed(2) + 's'; amb.appendChild(d)
      }
    }
  }

  // ---------------- choreography helpers ----------------
  function animateLanternRise() {
    return new Promise<void>((res, rej) => {
      const t0 = performance.now(), dur = 3200
      let done = false
      pending.push(() => { if (!done) { done = true; rej(SKIP) } })
      const step = (now: number) => {
        if (done) return
        const k = clamp01((now - t0) / dur); const e = eio(k)
        lant.y = lerp(H * 0.78, H * 0.16, e); lant.x = W * 0.5 + (0.68 * W - 0.5 * W) * e; lant.h = lerp(H * 0.30, H * 0.10, e)
        lant.moonEclipse = ss(0.6, 0.9, k) * (1 - ss(0.9, 1, k))
        if (k >= 1) { done = true; res() } else requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    })
  }
  function flashPulse(peak: number, ms: number) {
    return new Promise<void>((res, rej) => {
      let done = false
      pending.push(() => { if (!done) { done = true; flashEl.style.opacity = '0'; rej(SKIP) } })
      flashEl.style.transition = 'opacity ' + (ms * 0.4) + 'ms ease'; flashEl.style.opacity = String(peak)
      sto(() => {
        if (done) return
        flashEl.style.transition = 'opacity ' + (ms * 0.6) + 'ms ease'; flashEl.style.opacity = '0'
        sto(() => { if (done) return; done = true; res() }, ms * 0.6)
      }, ms * 0.4)
    })
  }
  async function finaleHandoff() {
    // Warm gold floods the frame, then hand off to the REAL gift box, which
    // fades in from the same warm glow (App sets giftEntering + phase='gift').
    flashEl.style.transition = 'opacity 640ms ease'
    flashEl.style.opacity = '1'
    await sleep(560)
    finish()
  }

  // ---------------- the 5-act director ----------------
  async function runShow() {
    skipVisible.value = true

    // ACT 1 — the same night, in different places
    canvasScene = 'room'
    room.merge = 0; room.warm = 0; room.litL = 0; room.litR = 0; room.figures = 0; room.look = 0; room.dim = 0; room.alpha = 0
    await tween(room, 'alpha', 1, 1600)
    await tween(room, 'look', 1, 1400)
    await copy(introCopy.a1[0], 3000)

    tween(room, 'litL', 1, 1100).catch(() => {})
    await sleep(360)
    await tween(room, 'litR', 1, 1100)
    room.litL = 1; room.litR = 1
    await copy(introCopy.a1[1], 3000)
    await copy(introCopy.a1[2], 3000)
    await copy(introCopy.a1[3], 3000)
    await copy(introCopy.a1[4], 3200)

    // soft bloom into Act 2 (the two moons are NOT joined by a line)
    await sleep(900)
    vibrate([12, 40, 16])
    await flashPulse(0.7, 900)

    // ACT 2 — the distance becomes the path to you
    canvasScene = 'room'; room.alpha = 0.0
    act2El.classList.add('pi-on')
    await sleep(700)
    copy(introCopy.a2[0], 3200).catch(() => {})
    await sleep(1600)
    vibrate(10)
    await Promise.all([spellRow(0, 'FROM  KOREA'), sleep(320).then(() => spellRow(1, 'TO   TAIWAN'))])
    await sleep(500)
    await copy(introCopy.a2[1], 3000)

    passEl.classList.add('pi-in')
    copy(introCopy.a2[2], 3400).catch(() => {})
    await sleep(2600)
    passEl.style.transition = 'transform 1s cubic-bezier(.5,0,.3,1), opacity .8s ease'; passEl.style.transform = 'translateY(-170%)'; passEl.style.opacity = '0'
    await sleep(1000)

    // airplane night window — inside the dim cabin
    act2El.classList.add('pi-dim')
    winLayer.classList.add('pi-on')
    await sleep(600)
    await copy(introCopy.a2[3], 3600)

    winLayer.classList.add('pi-descend')
    await sleep(3400)
    await copy(introCopy.a2[4], 3200)
    await copy(introCopy.a2[5], 3200)

    // one city light grows -> ember -> lantern flame
    winLayer.classList.add('pi-grow')
    await sleep(2200)
    canvasScene = 'ember'; ember.grow = 0; ember.alpha = 1
    await tween(ember, 'grow', 0, 10)
    winLayer.classList.remove('pi-on', 'pi-descend', 'pi-grow', 'pi-dim'); winLayer.classList.add('pi-dim')
    act2El.classList.remove('pi-on'); act2El.classList.add('pi-dim')
    await tween(ember, 'grow', 1, 1600)

    // ACT 3 — us, written on a sky lantern
    makeSprite()
    canvasScene = 'lantern'
    lant.x = W / 2; lant.y = H * 0.80; lant.h = H * 0.30; lant.rot = 0; lant.charge = 0; lant.wish = 0
    lantReleased = false; lant.rise = 0; lant.handsAlpha = 1; lant.moonEclipse = 0; lantHolding = false
    lant.faceReveal = 0; lant.faceSquash = 1
    crowd = []; embers = []
    lantActive = true
    await sleep(700)

    act3TitleEl.textContent = L(introUi.act3Title); act3Shown = true; act3TitleEl.classList.add('pi-show')
    await sleep(600)

    // the four feelings appear as overlay copy (separated from the lantern)
    await copy(introCopy.faces[0], 3000)
    await copy(introCopy.faces[1], 3000)
    await copy(introCopy.faces[2], 3000)
    await copy(introCopy.faces[3], 3200)

    // the lantern kindles on its own, then the final wish shows (as overlay copy,
    // NOT inscribed on the paper) and it launches
    lantHolding = true
    await sleep(2300)
    lantHolding = false; lant.charge = 1; lant.wish = 1; lantReleased = true
    vibrate([14, 60, 20])
    showCopy(introCopy.finalWish, true); void copyEl.offsetWidth; copyEl.classList.add('pi-show')
    await sleep(2800)
    copyEl.classList.remove('pi-show'); shownCopy = null
    act3TitleEl.classList.remove('pi-show'); act3Shown = false
    await sleep(500)

    // launch: rise, converging lantern streams fill the sky, cross the moon
    crowd = []
    for (let cq = 0; cq < 20; cq++) { spawnCrowd(cq % 2 ? 'L' : 'R'); crowd[crowd.length - 1].t = -cq * 0.22 }
    const riseP = tween(lant, 'rise', 1, 3200, eio)
    tween(lant, 'handsAlpha', 0, 1400).catch(() => {})
    await animateLanternRise()
    await riseP.catch(() => {})

    lantActive = false

    // ACT 4 — the same moon together, in the same place
    await flashPulse(0.55, 800)
    canvasScene = 'room'
    room.alpha = 1; room.warm = 0.4; room.merge = 0; room.figures = 0; room.litL = 1; room.litR = 1; room.look = 1; room.dim = 0
    await Promise.all([tween(room, 'merge', 1, 2600, eio), tween(room, 'warm', 1, 3000), tween(room, 'figures', 1, 2600, eio)])
    await sleep(400)
    await copy(introCopy.a4[0], 3200, true)
    await copy(introCopy.a4[1], 3600, true)
    await sleep(1800)

    // ACT 5 — our first 100 days -> hand over the gift
    await copy(introCopy.a5[0], 3400, true)
    await copy(introCopy.a5[1], 3200, true)
    await copy(introCopy.a5[2], 3200, true)
    await copy(introCopy.a5[3], 3600, true)
    await copy(introCopy.a5[4], 3600, true)
    await tween(room, 'gift', 1, 2200, eo)
    await sleep(500)
    await tween(room, 'giftApproach', 1, 2400, ei)
    await finaleHandoff()
  }

  function begin() {
    if (titleHidden.value) return
    titleHidden.value = true
    sto(() => { runShow().catch((e) => { if (e !== SKIP) { /* swallow */ } }) }, 600)
  }
  function skip() {
    doSkip()
    lantActive = false
    running = false
    finish()
  }

  // ---------------- global listeners / boot ----------------
  function onCtx(e: Event) { e.preventDefault() }
  function onTouchMove(e: Event) { e.preventDefault() }
  window.addEventListener('contextmenu', onCtx)
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('resize', resize)

  teardown = () => {
    running = false
    lantActive = false
    if (loopRaf) cancelAnimationFrame(loopRaf)
    doSkip()
    timers.forEach((id) => window.clearTimeout(id)); timers.clear()
    window.removeEventListener('contextmenu', onCtx)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('resize', resize)
  }

  resize()
  buildBoard()
  buildWinSky()
  skipVisible.value = true
  running = true; lastT = performance.now(); loopRaf = requestAnimationFrame(loop)
  engineBegin = begin
  engineSkip = skip
})

onBeforeUnmount(() => { teardown() })
</script>

<template>
  <div
    ref="rootRef"
    class="pi-root"
    :class="{ 'pi-reduced': reduced }"
  >
    <!-- animated stage -->
    <div
      v-show="!reduced"
      class="pi-stage"
    >
      <canvas
        ref="skyRef"
        class="pi-sky"
      />

      <!-- ACT 2 · departure board + boarding pass -->
      <section
        ref="act2Ref"
        class="pi-act2"
      >
        <div class="pi-board-wrap">
          <div class="pi-bhead">
            <b>DEPARTURES</b><span>탑승 정보</span>
          </div>
          <div
            ref="boardRef"
            class="pi-board"
          />
          <div class="pi-bdate">
            DATE&nbsp;&nbsp;<b>2026.06.26</b>
          </div>
          <div
            ref="passRef"
            class="pi-pass"
          >
            <div class="pi-phead">
              <b>BOARDING PASS</b><span>탑승권</span>
            </div>
            <div class="pi-proute">
              <div class="pi-pcity">
                <b>KOREA</b><i>FROM</i>
              </div>
              <div class="pi-pplane">
                <b>✈</b><em>2026.06.26</em>
              </div>
              <div class="pi-pcity">
                <b>TAIWAN</b><i>TO</i>
              </div>
            </div>
            <div class="pi-pgrid">
              <div><i>PASSENGER</i><b>JAY</b></div>
              <div><i>FLIGHT</i><b>LOVE·100</b></div>
              <div><i>TO / 도착</i><b>苙綺</b></div>
              <div><i>SEAT</i><b>네 곁</b></div>
            </div>
          </div>
        </div>
      </section>

      <!-- ACT 2 · airplane night window -->
      <section
        ref="winLayerRef"
        class="pi-winlayer"
      >
        <div class="pi-winframe">
          <div class="pi-winglass">
            <div class="pi-winscene">
              <div class="pi-wsky">
                <div
                  ref="wstarsRef"
                  class="pi-wstars"
                />
                <div class="pi-wmoon" />
                <div class="pi-wcloud pi-wc1" />
                <div class="pi-wcloud pi-wc2" />
              </div>
              <div class="pi-wcity">
                <div
                  ref="wcityambRef"
                  class="pi-wcityamb"
                />
                <div class="pi-citylight" />
              </div>
            </div>
            <div class="pi-wing">
              <span class="pi-navlight" />
            </div>
          </div>
        </div>
      </section>

      <!-- narrative overlays -->
      <div
        ref="act3Ref"
        class="pi-act3title"
      />
      <div
        ref="copyRef"
        class="pi-copy"
        aria-live="polite"
      />

      <!-- flash / handoff -->
      <div
        ref="flashRef"
        class="pi-flash"
      />

      <!-- film overlays -->
      <div
        class="pi-vignette"
        aria-hidden="true"
      />
      <div
        class="pi-grain"
        aria-hidden="true"
      />
    </div>

    <!-- skip -->
    <button
      v-show="!reduced"
      type="button"
      class="pi-skip"
      :class="{ 'pi-show': skipVisible }"
      @click="onSkip"
    >
      {{ L(introUi.skip) }}
    </button>

    <!-- title -->
    <section
      v-show="!reduced"
      class="pi-title"
      :class="{ 'pi-hide': titleHidden }"
      @click="onTitleTap"
    >
      <div class="pi-tmoon" />
      <h1 class="pi-th1">
        {{ L(introUi.title) }}
      </h1>
      <p class="pi-tsub">
        {{ L(introUi.subtitle) }}
      </p>
      <p class="pi-thint">
        {{ L(introUi.tapToBegin) }}
      </p>
    </section>

    <!-- reduced-motion static storyboard -->
    <section
      v-if="reduced"
      class="pi-rm"
      @click="onSkip"
    >
      <div class="pi-rm-moon" />
      <div
        v-for="(item, i) in rmItems"
        :key="i"
        class="pi-rm-line"
        :class="{ 'pi-name': item.name }"
      >
        <template
          v-for="(ln, j) in L(item.text).split('\n')"
          :key="j"
        >
          <br v-if="j > 0">
          {{ ln }}
        </template>
      </div>
      <p class="pi-rm-hint">
        {{ L(introUi.tapToBegin) }}
      </p>
    </section>
  </div>
</template>

<style>
/* One Moon, One Journey — intro (ported from mockup-25).
   All selectors are pi- prefixed and rules apply only within .pi-root, so
   nothing leaks into the rest of the app. Non-scoped on purpose: the board /
   stars / sparks are created imperatively and would not receive a scoped
   data-attribute. */
.pi-root {
  --cream: #fff9ed;
  --paper: #f3e6c8;
  --gold: #f4be3a;
  --brass: #c99a2e;
  --amber: #ffb85c;
  --brown: #3d2b1f;
  --night: #1a1612;
  --serif: 'Noto Serif KR', 'Noto Serif TC', serif;
  --sans: 'Pretendard Variable', Pretendard, sans-serif;
  --cw: clamp(22px, 6.8vw, 30px);
  --ch: calc(var(--cw) * 1.42);
  position: fixed;
  inset: 0;
  z-index: 60;
  height: 100vh;
  height: 100dvh;
  width: 100%;
  overflow: hidden;
  background: #120f0c;
  color: var(--cream);
  font-family: var(--serif);
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.pi-root * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

.pi-stage { position: absolute; inset: 0; }
.pi-sky { position: absolute; inset: 0; display: block; z-index: 1; }

/* film overlays */
.pi-vignette {
  position: absolute; inset: 0; z-index: 6; pointer-events: none;
  background: radial-gradient(120% 95% at 50% 44%, transparent 52%, rgba(8, 5, 3, 0.55) 100%);
}
.pi-grain {
  position: absolute; inset: -60px; z-index: 7; pointer-events: none; opacity: 0.05;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E");
  animation: pi-grain 1.1s steps(3) infinite;
}
@keyframes pi-grain { 0% { transform: translate(0, 0); } 50% { transform: translate(-18px, 12px); } 100% { transform: translate(12px, -16px); } }

/* narrative copy */
.pi-copy {
  position: absolute; left: 7%; right: 7%; top: 16%;
  z-index: 30; text-align: center; pointer-events: none;
  opacity: 0; transform: translateY(14px);
  transition: opacity 1.3s ease, transform 1.5s cubic-bezier(0.22, 0.8, 0.3, 1);
}
.pi-copy.pi-show { opacity: 1; transform: none; }
/* soft dark scrim behind the copy so white text stays readable over the bright moon */
.pi-copy::before {
  content: "";
  position: absolute;
  left: -6%; right: -6%; top: -16%; bottom: -16%;
  z-index: -1;
  background: radial-gradient(ellipse 80% 62% at 50% 50%, rgba(8, 5, 3, 0.62) 0%, rgba(8, 5, 3, 0.46) 44%, rgba(8, 5, 3, 0.2) 68%, transparent 82%);
  filter: blur(10px);
  pointer-events: none;
}
.pi-copy .pi-line {
  display: block;
  font-family: var(--serif); font-weight: 500;
  font-size: clamp(19px, 5.4vw, 27px);
  line-height: 1.85; letter-spacing: 0.06em;
  color: var(--cream);
  text-shadow: 0 0 2px rgba(16, 10, 5, 0.95), 0 0 9px rgba(16, 10, 5, 0.9), 0 1px 3px rgba(0, 0, 0, 0.85), 0 2px 22px rgba(0, 0, 0, 0.55), 0 0 34px rgba(255, 184, 92, 0.16);
  -webkit-text-stroke: 0.9px rgba(18, 11, 5, 0.9);
  paint-order: stroke fill;
}
.pi-copy.pi-warm .pi-line { color: #ffe8bf; text-shadow: 0 0 2px rgba(16, 10, 5, 0.95), 0 0 9px rgba(16, 10, 5, 0.85), 0 1px 3px rgba(0, 0, 0, 0.8), 0 2px 20px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 184, 92, 0.2); }
.pi-copy .pi-name { color: var(--gold); text-shadow: 0 0 28px rgba(244, 190, 58, 0.6); }

/* Act 3 scene heading */
.pi-act3title {
  position: absolute; left: 0; right: 0; top: 11%;
  z-index: 29; text-align: center; pointer-events: none;
  font-family: var(--serif); font-weight: 600;
  font-size: clamp(18px, 5vw, 25px);
  letter-spacing: 0.16em; text-indent: 0.16em;
  color: #ffe8bf;
  text-shadow: 0 0 2px rgba(16, 10, 5, 0.95), 0 0 10px rgba(16, 10, 5, 0.85), 0 2px 22px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 184, 92, 0.22);
  opacity: 0; transform: translateY(-8px);
  transition: opacity 1s ease, transform 1.1s cubic-bezier(0.22, 0.8, 0.3, 1);
}
.pi-act3title.pi-show { opacity: 1; transform: none; }

/* skip — stays clickable from the very start (above the title) */
.pi-skip {
  position: absolute; z-index: 85;
  top: calc(14px + env(safe-area-inset-top)); right: 16px;
  min-width: 44px; min-height: 44px; padding: 0 20px;
  border-radius: 999px; border: 1px solid rgba(255, 249, 237, 0.22);
  background: rgba(255, 249, 237, 0.08);
  -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
  color: rgba(255, 249, 237, 0.82);
  font-family: var(--sans); font-size: 13px; letter-spacing: 0.22em; text-indent: 0.22em;
  cursor: pointer; opacity: 0; pointer-events: none;
  transition: opacity 0.8s ease, background 0.3s ease;
}
.pi-skip.pi-show { opacity: 1; pointer-events: auto; }
.pi-skip:active { background: rgba(255, 249, 237, 0.16); }

/* TITLE */
.pi-title {
  position: absolute; inset: 0; z-index: 80;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; cursor: pointer;
  background: radial-gradient(90% 60% at 50% 32%, rgba(38, 30, 22, 0.96), rgba(20, 16, 12, 0.99) 72%), #16110c;
  transition: opacity 1.4s ease;
}
.pi-title.pi-hide { opacity: 0; pointer-events: none; }
.pi-tmoon {
  width: 56px; height: 56px; border-radius: 50%;
  background: radial-gradient(circle at 42% 38%, #fffdf6, #fff2d4 52%, #ecd9ad);
  box-shadow: 0 0 44px rgba(255, 240, 205, 0.5), 0 0 120px rgba(255, 224, 160, 0.22);
  margin-bottom: 40px; animation: pi-moonBreathe 4.6s ease-in-out infinite;
}
@keyframes pi-moonBreathe { 0%, 100% { box-shadow: 0 0 38px rgba(255, 240, 205, 0.42), 0 0 100px rgba(255, 224, 160, 0.18); } 50% { box-shadow: 0 0 58px rgba(255, 240, 205, 0.6), 0 0 150px rgba(255, 224, 160, 0.28); } }
.pi-th1 {
  font-family: var(--serif); font-weight: 600;
  font-size: clamp(26px, 8vw, 38px);
  letter-spacing: 0.22em; text-indent: 0.22em;
  color: var(--cream); text-shadow: 0 0 32px rgba(255, 230, 180, 0.3);
  line-height: 1.5;
}
.pi-tsub {
  margin-top: 22px; font-family: var(--sans); font-weight: 300;
  font-size: 13px; letter-spacing: 0.28em; text-indent: 0.28em;
  color: rgba(255, 249, 237, 0.5);
}
.pi-thint {
  position: absolute; left: 0; right: 0; bottom: calc(11% + env(safe-area-inset-bottom));
  font-family: var(--serif); font-size: 14px; letter-spacing: 0.34em; text-indent: 0.34em;
  color: rgba(244, 190, 58, 0.85); animation: pi-hintPulse 2.4s ease-in-out infinite;
}
@keyframes pi-hintPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.9; } }

/* ACT 2 · departure board + boarding pass */
.pi-act2 {
  position: absolute; inset: 0; z-index: 20;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: calc(66px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom));
  opacity: 0; pointer-events: none;
  background:
    radial-gradient(120% 80% at 50% 108%, rgba(255, 184, 92, 0.12), transparent 60%),
    linear-gradient(180deg, #120c07 0%, #1b130b 55%, #221709 100%);
  transition: opacity 1.1s ease;
}
.pi-act2.pi-on { opacity: 1; pointer-events: auto; }
.pi-act2.pi-dim { opacity: 0; pointer-events: none; }
.pi-board-wrap { width: 100%; max-width: 440px; }
.pi-bhead { display: flex; align-items: baseline; justify-content: space-between; padding: 0 6px 10px; font-family: var(--sans); }
.pi-bhead b { font-size: 12px; font-weight: 600; letter-spacing: 0.34em; color: var(--gold); }
.pi-bhead span { font-size: 11px; letter-spacing: 0.2em; color: rgba(255, 249, 237, 0.4); }
.pi-board {
  background: linear-gradient(180deg, #1d1610, #171009);
  border: 1px solid rgba(244, 190, 58, 0.16); border-radius: 16px;
  padding: 16px 8px 12px; cursor: pointer;
  box-shadow: inset 0 2px 12px rgba(0, 0, 0, 0.65), 0 18px 50px rgba(0, 0, 0, 0.5), 0 0 60px rgba(255, 184, 92, 0.05);
}
.pi-frow { display: flex; justify-content: center; gap: 3px; padding: 4px 0; }
.pi-cell { position: relative; width: var(--cw); height: var(--ch); perspective: calc(var(--cw) * 11); border-radius: 4px; }
.pi-cell::after { content: ""; position: absolute; left: 0; right: 0; top: calc(50% - 1px); height: 2px; background: rgba(0, 0, 0, 0.6); z-index: 5; border-radius: 1px; }
.pi-half { position: absolute; left: 0; width: 100%; height: 50%; overflow: hidden; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.pi-half.pi-top { top: 0; border-radius: 4px 4px 1px 1px; background: linear-gradient(180deg, #382b1b 0%, #2e241a 85%); box-shadow: inset 0 1px 0 rgba(255, 235, 190, 0.09); }
.pi-half.pi-bottom { bottom: 0; border-radius: 1px 1px 4px 4px; background: linear-gradient(180deg, #2a2015 0%, #241c14 100%); box-shadow: inset 0 -2px 3px rgba(0, 0, 0, 0.5); }
.pi-half span { position: absolute; left: 0; width: 100%; height: var(--ch); line-height: var(--ch); text-align: center; font-family: var(--sans); font-size: calc(var(--cw) * 0.6); font-weight: 600; color: var(--gold); text-shadow: 0 0 10px rgba(244, 190, 58, 0.22); }
.pi-half.pi-top span { top: 0; }
.pi-half.pi-bottom span { top: -100%; }
.pi-frow.pi-hero .pi-half span { color: #ffd98a; text-shadow: 0 0 16px rgba(255, 184, 92, 0.6); }
.pi-half.pi-flip { display: none; z-index: 6; }
.pi-cell.pi-go .pi-half.pi-flip { display: block; }
.pi-half.pi-ft { transform-origin: 50% 100%; }
.pi-half.pi-fb { transform: rotateX(90deg); transform-origin: 50% 0%; }
.pi-cell.pi-go .pi-ft { animation: pi-flipTop var(--fd, 54ms) ease-in both; }
.pi-cell.pi-go .pi-fb { animation: pi-flipBot var(--fd, 54ms) ease-out both; animation-delay: var(--fd, 54ms); }
@keyframes pi-flipTop { from { transform: rotateX(0); filter: brightness(1); } to { transform: rotateX(-89deg); filter: brightness(0.55); } }
@keyframes pi-flipBot { from { transform: rotateX(89deg); filter: brightness(1.35); } to { transform: rotateX(0); filter: brightness(1); } }
.pi-bdate { margin-top: 12px; text-align: center; font-family: var(--sans); font-size: 12px; letter-spacing: 0.34em; color: rgba(255, 240, 210, 0.62); }
.pi-bdate b { color: var(--gold); font-weight: 600; }

.pi-pass {
  margin: 24px auto 0; width: min(100%, 352px);
  background: linear-gradient(168deg, #fffdf6 0%, var(--cream) 55%, #f6ead0 100%);
  color: #20160c; border-radius: 14px; padding: 15px 18px 13px;
  font-family: var(--sans);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55), 0 4px 14px rgba(0, 0, 0, 0.35);
  transform: translateY(140%) rotate(2deg); opacity: 0;
  transition: transform 1s cubic-bezier(0.22, 0.9, 0.24, 1), opacity 0.8s ease;
  touch-action: none;
}
.pi-pass.pi-in { transform: none; opacity: 1; }
.pi-phead { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid rgba(20, 16, 9, 0.14); padding-bottom: 8px; }
.pi-phead b { font-size: 11px; letter-spacing: 0.3em; color: #8a6420; font-weight: 700; }
.pi-phead span { font-size: 11px; letter-spacing: 0.26em; color: rgba(20, 16, 9, 0.45); }
.pi-proute { display: flex; align-items: center; justify-content: space-between; padding: 12px 2px 10px; }
.pi-pcity b { display: block; font-size: 23px; font-weight: 700; letter-spacing: 0.02em; }
.pi-pcity i { display: block; font-style: normal; font-size: 10px; letter-spacing: 0.28em; color: rgba(20, 16, 9, 0.5); margin-top: 2px; }
.pi-pcity:last-child { text-align: right; }
.pi-pplane { flex: 1; text-align: center; color: #b98a2a; position: relative; }
.pi-pplane b { font-size: 16px; }
.pi-pplane em { display: block; font-style: normal; font-size: 10px; letter-spacing: 0.12em; color: rgba(20, 16, 9, 0.5); margin-top: 3px; }
.pi-pgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; border-top: 1px dashed rgba(20, 16, 9, 0.22); padding-top: 10px; }
.pi-pgrid i { display: block; font-style: normal; font-size: 9.5px; letter-spacing: 0.22em; color: rgba(20, 16, 9, 0.45); }
.pi-pgrid b { font-size: 13px; font-weight: 700; margin-top: 2px; display: block; }

/* ACT 2 · airplane night window */
.pi-winlayer {
  position: absolute; inset: 0; z-index: 22;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none;
  transition: opacity 1.2s ease;
  background:
    radial-gradient(92% 55% at 50% 24%, rgba(74, 54, 34, 0.34), transparent 62%),
    radial-gradient(120% 82% at 50% 118%, rgba(255, 176, 88, 0.1), transparent 60%),
    linear-gradient(180deg, #1d150d 0%, #241a10 46%, #140f09 100%);
}
.pi-winlayer.pi-on { opacity: 1; pointer-events: auto; }
.pi-winframe {
  position: relative; width: min(70vw, 300px); aspect-ratio: 0.74;
  border-radius: 44% / 38%;
  background: linear-gradient(160deg, #3d2f1f, #2a1f13);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(255, 235, 190, 0.16), 0 0 90px rgba(255, 184, 92, 0.08);
  padding: 12px;
}
.pi-winglass {
  position: relative; width: 100%; height: 100%;
  border-radius: 42% / 36%; overflow: hidden; background: #0c0810;
  box-shadow: inset 0 0 0 3px rgba(20, 14, 8, 0.9), inset 0 6px 22px rgba(0, 0, 0, 0.7), inset 0 -4px 26px rgba(255, 184, 92, 0.08);
}
.pi-winscene { position: absolute; left: 0; top: 0; width: 100%; height: 200%; transition: transform 4s cubic-bezier(0.55, 0.06, 0.28, 0.99); }
.pi-winlayer.pi-descend .pi-winscene { transform: translateY(-50%); }
.pi-wsky {
  position: absolute; left: 0; top: 0; width: 100%; height: 50%;
  background: radial-gradient(80% 40% at 72% 16%, rgba(255, 224, 170, 0.1), transparent 65%),
    linear-gradient(180deg, #150e18 0%, #1d1319 46%, #33201a 78%, #4a2c1a 100%);
}
.pi-wcity {
  position: absolute; left: 0; top: 50%; width: 100%; height: 50%;
  background: radial-gradient(58% 40% at 50% 58%, rgba(255, 184, 92, 0.16), transparent 70%),
    linear-gradient(180deg, #2c1c12 0%, #201408 55%, #170e05 100%);
}
.pi-wstars i { position: absolute; border-radius: 50%; background: #ffe9c4; animation: pi-tw 3.2s ease-in-out infinite both; }
@keyframes pi-tw { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.9; } }
.pi-wmoon {
  position: absolute; right: 15%; top: 10%; width: 30px; height: 30px; border-radius: 50%;
  background: radial-gradient(circle at 38% 34%, #fff3da, #ffd9a0 58%, rgba(255, 217, 160, 0) 72%);
  box-shadow: 0 0 40px 12px rgba(255, 217, 160, 0.22);
}
.pi-wcloud {
  position: absolute; border-radius: 50%; filter: blur(10px);
  background: radial-gradient(closest-side, rgba(255, 236, 205, 0.3), rgba(122, 84, 54, 0.15) 62%, transparent 74%);
}
.pi-wc1 { width: 80%; height: 17%; left: -12%; top: 66%; animation: pi-drift 17s ease-in-out infinite alternate; }
.pi-wc2 { width: 92%; height: 19%; left: 26%; top: 76%; animation: pi-drift 22s ease-in-out infinite alternate-reverse; }
@keyframes pi-drift { from { transform: translateX(0); } to { transform: translateX(7%); } }
.pi-wcityamb i { position: absolute; border-radius: 50%; background: #ffcf8a; animation: pi-tw 4s ease-in-out infinite both; }
.pi-citylight {
  position: absolute; left: 50%; top: 74%; width: 8px; height: 8px; border-radius: 50%;
  transform: translate(-50%, -50%); background: #ffe0a0;
  box-shadow: 0 0 10px 3px rgba(255, 200, 110, 0.7);
  transition: width 2.4s cubic-bezier(0.5, 0, 0.3, 1), height 2.4s cubic-bezier(0.5, 0, 0.3, 1), box-shadow 2.4s ease, top 2.4s ease, left 2.4s ease;
}
.pi-winlayer.pi-grow .pi-citylight { width: 64px; height: 64px; top: 50%; box-shadow: 0 0 90px 40px rgba(255, 200, 110, 0.9); }
.pi-wing {
  position: absolute; left: -8%; bottom: -3%; width: 86%; height: 48%; z-index: 8; pointer-events: none;
  background: linear-gradient(158deg, #2c2117 0%, #1b140d 52%, #0f0a06 100%);
  clip-path: polygon(0 100%, 0 66%, 82% 6%, 100% 20%, 100% 100%);
  transform: rotate(-2deg);
  box-shadow: inset 0 2px 0 rgba(255, 214, 150, 0.09), inset 0 -14px 30px rgba(0, 0, 0, 0.55);
}
.pi-wing::after {
  content: ""; position: absolute; right: 12%; top: 15%; width: 36%; height: 5%;
  background: linear-gradient(90deg, rgba(255, 214, 150, 0.16), transparent);
  transform: rotate(-30deg); border-radius: 50%;
}
.pi-navlight {
  position: absolute; right: 9%; top: 8%; width: 7px; height: 7px; border-radius: 50%;
  background: #ff5c48; box-shadow: 0 0 12px 5px rgba(255, 72, 54, 0.85); z-index: 9;
  animation: pi-navblink 2.4s ease-in-out infinite;
}
@keyframes pi-navblink { 0%, 42% { opacity: 0.12; } 50%, 58% { opacity: 1; } 66%, 100% { opacity: 0.12; } }

/* flash / handoff */
.pi-flash {
  position: absolute; inset: 0; z-index: 45; pointer-events: none; opacity: 0;
  background: radial-gradient(circle at 50% 54%, #fff0cf 0%, #f7c96a 42%, rgba(193, 137, 33, 0.5) 100%);
}

/* reduced-motion static storyboard */
.pi-rm {
  position: absolute; inset: 0; z-index: 90;
  display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
  gap: 26px; overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding: calc(40px + env(safe-area-inset-top)) 22px calc(48px + env(safe-area-inset-bottom));
  background: radial-gradient(90% 60% at 50% 20%, rgba(38, 30, 22, 0.96), rgba(20, 16, 12, 0.99) 72%), #16110c;
  text-align: center; cursor: pointer;
}
.pi-rm-moon {
  width: 60px; height: 60px; border-radius: 50%; margin-top: 10px; flex: 0 0 auto;
  background: radial-gradient(circle at 42% 38%, #fffdf6, #fff2d4 52%, #ecd9ad);
  box-shadow: 0 0 40px rgba(255, 240, 205, 0.4);
}
.pi-rm-line {
  font-family: var(--serif); font-weight: 500; font-size: clamp(16px, 4.6vw, 20px);
  line-height: 1.9; letter-spacing: 0.05em; color: #ffe8bf; max-width: 520px;
  text-shadow: 0 0 20px rgba(255, 184, 92, 0.3);
}
.pi-rm-line.pi-name { color: var(--gold); }
.pi-rm-hint { margin-top: 8px; flex: 0 0 auto; font-family: var(--sans); font-size: 13px; letter-spacing: 0.28em; color: rgba(244, 190, 58, 0.85); }

@media (prefers-reduced-motion: reduce) {
  .pi-grain, .pi-tmoon, .pi-thint { animation: none !important; }
  .pi-copy, .pi-title { transition: none !important; animation: none !important; }
}
</style>
