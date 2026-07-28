<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { type Locale, type LocalizedText, getLocalizedText } from '@/content/localization'

const props = defineProps<{ active: boolean; locale: Locale }>()
const emit = defineEmits<{ restart: [] }>()

/* ---------- localized copy ---------- */
const eyebrow: LocalizedText = {
  'zh-TW': '我們的100天',
  ko: '우리의 100일',
  en: 'Our 100 Days',
}
const leadIn: LocalizedText = {
  'zh-TW': '慶祝我們的第一個100天，',
  ko: '우리의 첫 100일을 축하하며,',
  en: 'Celebrating our first 100 days,',
}
const finalMessage: LocalizedText = {
  ko: '우리의 첫 100일,\n이렇게 한 권의 이야기가 되었어.\n\n앞으로의 수많은 날들도\n너와 함께 써 내려가고 싶어.\n\n사랑해, 苙綺.',
  'zh-TW': '我們的第一個100天，\n就這樣成了一本故事。\n\n往後無數的日子，\n也想和妳一起寫下去。\n\n我愛妳，苙綺。',
  en: 'Our first 100 days\nhave become a story of their own.\n\nAnd all the many days ahead —\nI want to write them with you.\n\nI love you, Lichi.',
}
const rereadLabel: LocalizedText = {
  'zh-TW': '重新閱讀',
  ko: '다시 읽기',
  en: 'Read Again',
}
const replayLabel: LocalizedText = {
  'zh-TW': '重新播放',
  ko: '다시 보기',
  en: 'Replay',
}
function t(text: LocalizedText): string {
  return getLocalizedText(text, props.locale)
}
const messageParas = computed(() => t(finalMessage).split('\n\n'))

/* ---------- SVG scene (injected once via v-html; static, developer-authored) ----------
   Ported verbatim from design-lab/final-page-lab/07-cake-celebration.html; ids
   were converted to classes (jay/lily/flames/field/field-front/clip-petals) so
   the scene can live inside one component without global id collisions, and the
   gradient ids are prefixed (ck*) for the same reason. */
const sceneSvg = `
<svg class="cake-svg" viewBox="0 0 340 440" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
  <defs>
    <linearGradient id="ckCakeTop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff3d8"/><stop offset="1" stop-color="#ffe6bf"/>
    </linearGradient>
    <linearGradient id="ckCakeBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f7d9a6"/><stop offset="1" stop-color="#e8bd7f"/>
    </linearGradient>
    <linearGradient id="ckCakeBody2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe7bd"/><stop offset="1" stop-color="#f2cf95"/>
    </linearGradient>
    <linearGradient id="ckFlameG" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#ff9b3d"/><stop offset=".55" stop-color="#ffcf5a"/><stop offset="1" stop-color="#fff3c4"/>
    </linearGradient>
    <radialGradient id="ckFlameGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="rgba(255,214,120,.9)"/><stop offset="1" stop-color="rgba(255,214,120,0)"/>
    </radialGradient>
  </defs>

  <!-- Jay (amber) — behind cake, left -->
  <g transform="translate(114 300)">
    <g class="char jay">
      <rect x="-12" y="-20" width="9" height="24" rx="4.5" fill="#8a6a3e"/>
      <rect x="3" y="-20" width="9" height="24" rx="4.5" fill="#8a6a3e"/>
      <path d="M-27 -22 C -29 -66 29 -66 27 -22 C 27 -12 -27 -12 -27 -22 Z" fill="#ffb85c" stroke="#e79a45" stroke-width="1.5"/>
      <path d="M-15 -30 C -6 -22 6 -22 15 -30 C 10 -18 -10 -18 -15 -30 Z" fill="#ffcf8a" opacity=".7"/>
      <path d="M23 -50 C 36 -44 44 -34 46 -22" fill="none" stroke="#ffb85c" stroke-width="9" stroke-linecap="round"/>
      <circle cx="47" cy="-20" r="6" fill="#ffe6cf" stroke="#eecba6" stroke-width="1"/>
      <path d="M-23 -50 C -35 -44 -40 -33 -40 -22" fill="none" stroke="#ffb85c" stroke-width="9" stroke-linecap="round"/>
      <g transform="translate(0 -80)">
        <circle cx="0" cy="0" r="24" fill="#ffe6cf" stroke="#eecba6" stroke-width="1"/>
        <path d="M-24.5 4 C -30 -36 30 -36 24.5 4 C 23 -3 20 -8 15 -11 C 9 -14 4 -15 0 -15 C -4 -15 -9 -14 -15 -11 C -20 -8 -23 -3 -24.5 4 Z" fill="#4a3524"/>
        <circle cx="-9" cy="1" r="3" fill="#3d2b1f"/>
        <circle cx="9" cy="1" r="3" fill="#3d2b1f"/>
        <circle cx="-14" cy="8" r="4.6" fill="#f0907a" opacity=".5"/>
        <circle cx="14" cy="8" r="4.6" fill="#f0907a" opacity=".5"/>
        <path class="mouth-smile" d="M-7 8 Q0 15 7 8" fill="none" stroke="#3d2b1f" stroke-width="2.4" stroke-linecap="round"/>
        <ellipse class="mouth-blow" cx="0" cy="10" rx="3.4" ry="4.4" fill="#7a3b2a"/>
      </g>
    </g>
  </g>

  <!-- 苙綺 (rose) — behind cake, right -->
  <g transform="translate(226 300)">
    <g class="char lily">
      <rect x="-12" y="-20" width="9" height="24" rx="4.5" fill="#b56a6a"/>
      <rect x="3" y="-20" width="9" height="24" rx="4.5" fill="#b56a6a"/>
      <path d="M-27 -22 C -29 -66 29 -66 27 -22 C 27 -12 -27 -12 -27 -22 Z" fill="#f0907a" stroke="#dd7a63" stroke-width="1.5"/>
      <path d="M-15 -30 C -6 -22 6 -22 15 -30 C 10 -18 -10 -18 -15 -30 Z" fill="#f7b0a0" opacity=".7"/>
      <path d="M-23 -50 C -36 -44 -44 -34 -46 -22" fill="none" stroke="#f0907a" stroke-width="9" stroke-linecap="round"/>
      <circle cx="-47" cy="-20" r="6" fill="#ffe6cf" stroke="#eecba6" stroke-width="1"/>
      <path d="M23 -50 C 35 -44 40 -33 40 -22" fill="none" stroke="#f0907a" stroke-width="9" stroke-linecap="round"/>
      <g transform="translate(0 -80)">
        <path d="M-29 12 C -36 -42 36 -42 29 12 C 22 3 -22 3 -29 12 Z" fill="#4a2f22"/>
        <circle cx="0" cy="0" r="24" fill="#ffe6cf" stroke="#eecba6" stroke-width="1"/>
        <path d="M-26 -1 C -27 -30 27 -30 26 -1 C 20 -12 12 -14 4 -12 C 0 -11 -1 -11 -4 -12 C -12 -14 -20 -12 -26 -1 Z" fill="#4a2f22"/>
        <path d="M-26 -5 C -32 8 -32 24 -27 33 C -20 26 -21 8 -19 -3 Z" fill="#4a2f22"/>
        <path d="M26 -5 C 32 8 32 24 27 33 C 20 26 21 8 19 -3 Z" fill="#4a2f22"/>
        <circle cx="-9" cy="1" r="3" fill="#3d2b1f"/>
        <circle cx="9" cy="1" r="3" fill="#3d2b1f"/>
        <circle cx="-14" cy="8" r="4.6" fill="#f0907a" opacity=".6"/>
        <circle cx="14" cy="8" r="4.6" fill="#f0907a" opacity=".6"/>
        <path class="mouth-smile" d="M-7 8 Q0 15 7 8" fill="none" stroke="#3d2b1f" stroke-width="2.4" stroke-linecap="round"/>
        <ellipse class="mouth-blow" cx="0" cy="10" rx="3.4" ry="4.4" fill="#7a3b2a"/>
        <g transform="translate(19 -17)">
          <g class="clip-petals"></g>
          <circle r="5" fill="#3d2b1f"/>
        </g>
      </g>
    </g>
  </g>

  <!-- Sunflower field (grows from ground, behind cake) -->
  <g class="sfield field" aria-hidden="true"></g>

  <!-- Cake (in front) -->
  <g class="cake">
    <ellipse cx="170" cy="392" rx="140" ry="17" fill="#e7d3a3" opacity=".55"/>
    <ellipse cx="170" cy="378" rx="128" ry="20" fill="#f5e7c6" stroke="#e2caa0" stroke-width="2"/>
    <ellipse cx="170" cy="374" rx="112" ry="15" fill="#fff7e4"/>
    <rect x="78" y="300" width="184" height="74" rx="12" fill="url(#ckCakeBody)" stroke="#d9ab72" stroke-width="1.5"/>
    <path d="M78 314 q23 16 46 0 t46 0 t46 0 t46 0 v-14 h-184 Z" fill="#fff3d8"/>
    <text x="170" y="352" text-anchor="middle" font-family="'Noto Serif KR',serif" font-weight="700" font-size="30" fill="#c9772e" opacity=".92" letter-spacing="2">100</text>
    <rect x="104" y="258" width="132" height="52" rx="10" fill="url(#ckCakeBody2)" stroke="#e2b782" stroke-width="1.5"/>
    <path d="M104 270 q16.5 14 33 0 t33 0 t33 0 t33 0 v-12 h-132 Z" fill="#fff6e0"/>
    <circle cx="124" cy="266" r="3.4" fill="#f0907a"/>
    <circle cx="150" cy="264" r="3" fill="#e8734f"/>
    <circle cx="196" cy="264" r="3" fill="#f0907a"/>
    <circle cx="216" cy="266" r="3.4" fill="#e8734f"/>
    <g>
      <rect x="147" y="228" width="6" height="30" rx="2" fill="#fff3d8" stroke="#eccf9c" stroke-width="1"/>
      <rect x="167" y="222" width="6" height="36" rx="2" fill="#ffe6c2" stroke="#eccf9c" stroke-width="1"/>
      <rect x="187" y="228" width="6" height="30" rx="2" fill="#fff3d8" stroke="#eccf9c" stroke-width="1"/>
      <rect x="148.4" y="230" width="3.2" height="30" rx="1.6" fill="#f0907a" opacity=".5"/>
      <rect x="168.4" y="224" width="3.2" height="36" rx="1.6" fill="#f0907a" opacity=".5"/>
      <rect x="188.4" y="230" width="3.2" height="30" rx="1.6" fill="#f0907a" opacity=".5"/>
    </g>
    <g class="flames">
      <g transform="translate(150 226)">
        <ellipse class="flameGlow" cx="0" cy="-2" rx="11" ry="13" fill="url(#ckFlameGlow)"/>
        <path class="flame f1" d="M0 4 C -5 0 -5 -8 0 -14 C 5 -8 5 0 0 4 Z" fill="url(#ckFlameG)"/>
      </g>
      <g transform="translate(170 220)">
        <ellipse class="flameGlow" cx="0" cy="-2" rx="12" ry="14" fill="url(#ckFlameGlow)"/>
        <path class="flame f2" d="M0 4 C -5.5 0 -5.5 -9 0 -15 C 5.5 -9 5.5 0 0 4 Z" fill="url(#ckFlameG)"/>
      </g>
      <g transform="translate(190 226)">
        <ellipse class="flameGlow" cx="0" cy="-2" rx="11" ry="13" fill="url(#ckFlameGlow)"/>
        <path class="flame f3" d="M0 4 C -5 0 -5 -8 0 -14 C 5 -8 5 0 0 4 Z" fill="url(#ckFlameG)"/>
      </g>
    </g>
    <text class="huff hl" x="137" y="214" text-anchor="middle" font-size="19" stroke="#fffdf6" stroke-width="3" paint-order="stroke" style="--hx:-10px">후~</text>
    <text class="huff hr" x="203" y="214" text-anchor="middle" font-size="19" stroke="#fffdf6" stroke-width="3" paint-order="stroke" style="--hx:10px">후~</text>
  </g>

  <!-- Foreground sunflowers (in FRONT of the cake) -->
  <g class="sfield field-front" aria-hidden="true"></g>
</svg>`

/* =========================================================
   Celebration engine (canvas particles + SVG scene choreography).
   Ported from the mockup, adapted to: gate on `active`, size to this
   component's root, and tear down completely when inactive/unmounted.
   ========================================================= */
const SVGNS = 'http://www.w3.org/2000/svg'
const reduce =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const rootRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

interface Handles {
  stage: HTMLElement
  jay: Element
  lily: Element
  flames: Element
  field: Element
  fieldFront: Element
  glow: HTMLElement
  motes: HTMLElement
  flash: HTMLElement
  hint: HTMLElement
  message: HTMLElement
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
}
let h: Handles | null = null
let ro: ResizeObserver | null = null
let ctx: CanvasRenderingContext2D | null = null

let W = 0
let H = 0
let DPR = 1

/* ---------- particle types ---------- */
interface Rocket { x: number; y: number; px: number; py: number; vx: number; vy: number; ty: number; color: string }
interface Spark { x: number; y: number; px: number; py: number; vx: number; vy: number; life: number; decay: number; color: string; size: number }
interface Confetto { x: number; y: number; vx: number; vy: number; w: number; h: number; rot: number; rotSpd: number; wob: number; wobSpd: number; swayPh: number; swayAmp: number; grav: number; drag: number; base: string; hi: string }
interface Smoke { x: number; y: number; vx: number; vy: number; r: number; grow: number; life: number; decay: number }
interface Faller { x: number; y: number; vy: number; vx: number; rot: number; rotSpd: number; sc: number; swayPh: number; swayAmp: number }

const FX = ['#ffd873', '#ffb85c', '#f0907a', '#fff3d0', '#f4be3a', '#ffcf5a']
const CONF = [
  { base: '#f4be3a', hi: '#fff2c4' }, { base: '#ffb85c', hi: '#ffe6c2' },
  { base: '#f0907a', hi: '#ffd0c4' }, { base: '#c99a2e', hi: '#f4d98a' },
  { base: '#fff3d0', hi: '#ffffff' }, { base: '#ffcf5a', hi: '#fff6df' },
]
const MAX_SPARK = 700, MAX_CONF = 230, MAX_FALL = 20

let rockets: Rocket[] = []
let sparks: Spark[] = []
let confetti: Confetto[] = []
let smoke: Smoke[] = []
let fallers: Faller[] = []

let rafId: number | null = null
let running = false
let lastT = 0
let spawnDone = false

let phase: 'idle' | 'lit' | 'blow' | 'celebrate' | 'done' = 'idle'
let autoTimer: ReturnType<typeof setTimeout> | null = null

const timers = new Set<ReturnType<typeof setTimeout>>()
function addTimer(fn: () => void, ms: number) {
  const id = setTimeout(() => { timers.delete(id); fn() }, ms)
  timers.add(id)
  return id
}
function clearTimers() {
  timers.forEach(clearTimeout)
  timers.clear()
  autoTimer = null
}

function rand(a: number, b: number) { return a + Math.random() * (b - a) }
function pick<T>(a: T[]): T { return a[(Math.random() * a.length) | 0] }

/* ---------- glow / sunflower sprite caches ---------- */
const sprites: Record<string, HTMLCanvasElement> = {}
function sprite(color: string): HTMLCanvasElement {
  const cached = sprites[color]
  if (cached) return cached
  const c = document.createElement('canvas')
  c.width = c.height = 32
  const g = c.getContext('2d')
  if (g) {
    const rg = g.createRadialGradient(16, 16, 0, 16, 16, 16)
    rg.addColorStop(0, color); rg.addColorStop(0.4, color); rg.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = rg
    g.beginPath(); g.arc(16, 16, 16, 0, 7); g.fill()
  }
  sprites[color] = c
  return c
}
let sunSprite: HTMLCanvasElement | null = null
function sunflowerSprite(): HTMLCanvasElement {
  if (sunSprite) return sunSprite
  const s = 52
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')
  if (g) {
    g.translate(s / 2, s / 2)
    for (let i = 0; i < 12; i++) {
      g.save(); g.rotate(i * Math.PI / 6)
      g.fillStyle = (i % 2 ? '#ffcf5a' : '#ffc63f'); g.strokeStyle = '#e79a24'; g.lineWidth = 0.8
      g.beginPath(); g.ellipse(0, -15, 4.4, 8.4, 0, 0, Math.PI * 2); g.fill(); g.stroke()
      g.restore()
    }
    g.fillStyle = '#c9772e'; g.beginPath(); g.arc(0, 0, 9.5, 0, Math.PI * 2); g.fill()
    g.fillStyle = '#7a4a1e'; g.beginPath(); g.arc(0, 0, 6.6, 0, Math.PI * 2); g.fill()
  }
  sunSprite = c
  return c
}

/* ---------- canvas sizing (measures this component's own root) ---------- */
function sizeCanvas() {
  if (!h) return
  DPR = Math.min(window.devicePixelRatio || 1, 2)
  W = h.stage.clientWidth
  H = h.stage.clientHeight
  h.canvas.width = Math.round(W * DPR)
  h.canvas.height = Math.round(H * DPR)
  h.canvas.style.width = W + 'px'
  h.canvas.style.height = H + 'px'
  h.ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
  if (reduce && phase === 'done') drawStaticCelebration()
}

/* ---------- build the SVG decorations once (motes, hair-clip, ground field) ---------- */
function el(name: string, attrs: Record<string, string | number>): SVGElement {
  const e = document.createElementNS(SVGNS, name)
  for (const k in attrs) e.setAttribute(k, String(attrs[k]))
  return e
}
function buildClip(clip: Element) {
  for (let i = 0; i < 10; i++) {
    const p = document.createElementNS(SVGNS, 'path')
    p.setAttribute('d', 'M0 -4.6 C 1.8 -5.6 1.8 -10 0 -11 C -1.8 -10 -1.8 -5.6 0 -4.6 Z')
    p.setAttribute('fill', '#ffcf5a'); p.setAttribute('stroke', '#e79a24'); p.setAttribute('stroke-width', '0.4')
    p.setAttribute('transform', 'rotate(' + (i * 36) + ')')
    clip.appendChild(p)
  }
}
function buildMotes(motes: HTMLElement) {
  for (let i = 0; i < 12; i++) {
    const d = document.createElement('div')
    d.className = 'm'
    const sz = 5 + Math.random() * 5
    d.style.left = (8 + Math.random() * 84) + '%'
    d.style.width = d.style.height = sz + 'px'
    d.style.setProperty('--dur', (8 + Math.random() * 6).toFixed(2) + 's')
    d.style.setProperty('--delay', (Math.random() * 7).toFixed(2) + 's')
    motes.appendChild(d)
  }
}

interface FlowerOpts {
  target: Element; x: number; groundY: number; stemH: number; headR: number
  pA: string; pB: string; stemCol: string; leafSide: number; face: boolean; delay: number
}
function buildField(field: Element, fieldFront: Element) {
  const delayFor = (x: number) => Math.abs(x - 170) / 170 * 820 + rand(0, 170)
  function makeFlower(o: FlowerOpts) {
    const stemH = o.stemH, headR = o.headR
    const g = el('g', { class: 'gflower' })
    g.setAttribute('transform', 'translate(' + o.x.toFixed(1) + ' ' + o.groundY.toFixed(1) + ')')
    g.style.setProperty('--d', o.delay.toFixed(0))

    const stem = el('g', { class: 'gstem' })
    stem.appendChild(el('rect', {
      x: -1.7, y: (-stemH).toFixed(1), width: 3.4, height: stemH.toFixed(1), rx: 1.7, fill: o.stemCol,
    }))
    const ly = -stemH * rand(0.42, 0.6), side = o.leafSide
    stem.appendChild(el('path', {
      class: 'gleaf',
      d: 'M0 ' + ly.toFixed(1) + ' q ' + (side * 9) + ' -5 ' + (side * 14) + ' 3 q ' + (-side * 8) + ' 3 ' + (-side * 14) + ' -3 Z',
      fill: '#7e8a56',
    }))
    g.appendChild(stem)

    const headWrap = el('g', { transform: 'translate(0 ' + (-stemH).toFixed(1) + ')' })
    const head = el('g', { class: 'ghead' })
    const petalRy = (headR * 0.9).toFixed(2), petalRx = (headR * 0.42).toFixed(2), pcy = (-headR * 1.05).toFixed(2)
    for (let j = 0; j < 12; j++) {
      head.appendChild(el('ellipse', {
        cx: 0, cy: pcy, rx: petalRx, ry: petalRy,
        fill: (j % 2 ? o.pA : o.pB), stroke: '#e79a24', 'stroke-width': 0.5,
        transform: 'rotate(' + (j * 30) + ')',
      }))
    }
    head.appendChild(el('circle', { r: (headR * 0.66).toFixed(2), fill: '#c9772e' }))
    head.appendChild(el('circle', { r: (headR * 0.5).toFixed(2), fill: '#7a4a1e' }))
    if (o.face) {
      const er = (headR * 0.09).toFixed(2), eo = (headR * 0.2).toFixed(2), ey = (-headR * 0.1).toFixed(2)
      head.appendChild(el('circle', { cx: -Number(eo), cy: ey, r: er, fill: '#2c1c0e' }))
      head.appendChild(el('circle', { cx: eo, cy: ey, r: er, fill: '#2c1c0e' }))
      head.appendChild(el('path', {
        d: 'M' + (-headR * 0.22) + ' ' + (headR * 0.16) + ' Q0 ' + (headR * 0.42) + ' ' + (headR * 0.22) + ' ' + (headR * 0.16),
        fill: 'none', stroke: '#2c1c0e', 'stroke-width': (headR * 0.11).toFixed(2), 'stroke-linecap': 'round',
      }))
    }
    headWrap.appendChild(head)
    g.appendChild(headWrap)
    o.target.appendChild(g)
  }

  const back = 22
  for (let i = 0; i < back; i++) {
    const bx = 2 + i * (336 / (back - 1)) + rand(-6, 6)
    makeFlower({
      target: field, x: bx, groundY: 390 + rand(-4, 6), stemH: rand(18, 42), headR: rand(6.5, 11),
      pA: '#ffdd84', pB: '#f7d066', stemCol: '#7c8a52', leafSide: (i % 2 ? 1 : -1), face: false, delay: delayFor(bx),
    })
  }
  const mid = 17
  for (let k = 0; k < mid; k++) {
    const fx = 14 + k * (312 / (mid - 1)) + rand(-7, 7)
    makeFlower({
      target: field, x: fx, groundY: 407 + rand(-3, 8), stemH: rand(34, 74), headR: rand(11, 16.5),
      pA: '#ffcf5a', pB: '#ffc33c', stemCol: '#6f7d45', leafSide: (k % 2 ? 1 : -1), face: (k % 4 === 1), delay: delayFor(fx) + 130,
    })
  }
  const fore = 16
  for (let m = 0; m < fore; m++) {
    const mx = 6 + m * (330 / (fore - 1)) + rand(-8, 8)
    makeFlower({
      target: fieldFront, x: mx, groundY: 430 + rand(-2, 9), stemH: rand(13, 40), headR: rand(12, 18.5),
      pA: '#ffd257', pB: '#ffc23a', stemCol: '#657439', leafSide: (m % 2 ? 1 : -1), face: (m % 5 === 2), delay: delayFor(mx) + 60,
    })
  }
}

/* ---------- particle spawners ---------- */
function launchRocket(txf: number, tyf: number, color?: string) {
  const tx = W * txf, ty = H * tyf, sx = W * (0.3 + Math.random() * 0.4)
  const col = color || pick(FX)
  rockets.push({
    x: sx, y: H * 0.86, px: sx, py: H * 0.86, vx: (tx - sx) * 0.02,
    vy: -(Math.sqrt(Math.max(1, H * 0.86 - ty)) * 0.86 + 3), ty, color: col,
  })
}
function burst(x: number, y: number, color: string, power: number) {
  const n = Math.min(power, MAX_SPARK - sparks.length)
  if (n <= 0) return
  const spread = rand(3.4, 5.6)
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + rand(-0.1, 0.1)
    const sp = spread * rand(0.4, 1) + rand(0, 2.1)
    sparks.push({
      x, y, px: x, py: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: 1, decay: rand(0.006, 0.011), color: (Math.random() < 0.2 ? '#fff3d0' : color), size: rand(2.1, 4.4),
    })
  }
}
function spawnConfetti(count: number, burstMode?: boolean, cx?: number, cy?: number) {
  const room = MAX_CONF - confetti.length
  const n = Math.min(count, room)
  for (let i = 0; i < n; i++) {
    const c = pick(CONF)
    const streamer = Math.random() < 0.22
    let x: number, y: number, vx: number, vy: number
    if (burstMode) {
      const a = rand(-Math.PI, 0), sp = rand(2.4, 6.5)
      x = cx ?? W * 0.5; y = cy ?? H * 0.4
      vx = Math.cos(a) * sp; vy = Math.sin(a) * sp - rand(1, 3)
    } else {
      x = rand(-10, W + 10); y = rand(-46, -6); vx = rand(-0.6, 0.6); vy = rand(1, 2.6)
    }
    confetti.push({
      x, y, vx, vy,
      w: streamer ? rand(3, 4.5) : rand(6, 10), h: streamer ? rand(13, 22) : rand(6, 11),
      rot: rand(0, Math.PI * 2), rotSpd: rand(-0.16, 0.16),
      wob: rand(0, Math.PI * 2), wobSpd: rand(0.06, 0.14),
      swayPh: rand(0, Math.PI * 2), swayAmp: rand(0.4, 1.4),
      grav: rand(0.03, 0.055), drag: rand(0.982, 0.992), base: c.base, hi: c.hi,
    })
  }
}
function spawnFaller() {
  if (fallers.length >= MAX_FALL) return
  fallers.push({
    x: rand(12, W - 12), y: rand(-70, -20), vy: rand(1.1, 2.0), vx: rand(-0.3, 0.3),
    rot: rand(0, Math.PI * 2), rotSpd: rand(-0.03, 0.03), sc: rand(0.42, 0.9),
    swayPh: rand(0, Math.PI * 2), swayAmp: rand(0.25, 0.85),
  })
}
function spawnSmoke(x: number, y: number) {
  for (let i = 0; i < 4; i++) {
    smoke.push({
      x: x + rand(-2, 2), y, vx: rand(-0.25, 0.25), vy: rand(-0.7, -1.2),
      r: rand(2, 4), grow: rand(0.05, 0.12), life: 1, decay: rand(0.012, 0.02),
    })
  }
}
function doFlash(a: number) {
  if (!h) return
  const f = h.flash
  f.style.transition = 'none'
  f.style.opacity = String(a)
  requestAnimationFrame(() => { f.style.transition = 'opacity .55s ease'; f.style.opacity = '0' })
}

/* ---------- rAF loop (self-stops when the celebration drains) ---------- */
function step(t: number) {
  if (!running || !ctx) { return }
  const c = ctx
  if (!lastT) lastT = t
  const dt = Math.min((t - lastT) / 16.67, 2.2)
  lastT = t
  c.clearRect(0, 0, W, H)

  c.globalCompositeOperation = 'lighter'
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i]
    r.px = r.x; r.py = r.y; r.x += r.vx * dt; r.y += r.vy * dt; r.vy += 0.05 * dt
    c.strokeStyle = r.color; c.lineWidth = 2; c.lineCap = 'round'; c.globalAlpha = 0.9
    c.beginPath(); c.moveTo(r.px, r.py); c.lineTo(r.x, r.y); c.stroke()
    if (r.y <= r.ty || r.vy >= -0.4) {
      burst(r.x, r.y, r.color, 110 + (Math.random() * 70 | 0))
      if (Math.random() < 0.55) burst(r.x, r.y, pick(FX), 52 + (Math.random() * 30 | 0))
      if (Math.random() < 0.8) doFlash(rand(0.44, 0.72))
      rockets.splice(i, 1)
    }
  }
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i]
    s.px = s.x; s.py = s.y; s.vx *= 0.985; s.vy = s.vy * 0.985 + 0.04 * dt
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= s.decay * dt
    if (s.life <= 0) { sparks.splice(i, 1); continue }
    const d = s.size * 2 * (0.5 + s.life * 0.7)
    c.globalAlpha = Math.max(0, s.life)
    c.drawImage(sprite(s.color), s.x - d / 2, s.y - d / 2, d, d)
  }
  c.globalAlpha = 1

  c.globalCompositeOperation = 'source-over'
  for (let i = smoke.length - 1; i >= 0; i--) {
    const sm = smoke[i]
    sm.x += sm.vx * dt; sm.y += sm.vy * dt; sm.r += sm.grow * dt; sm.life -= sm.decay * dt
    if (sm.life <= 0) { smoke.splice(i, 1); continue }
    c.globalAlpha = Math.max(0, sm.life) * 0.28
    c.fillStyle = 'rgba(150,140,130,1)'
    c.beginPath(); c.arc(sm.x, sm.y, sm.r, 0, 7); c.fill()
  }
  c.globalAlpha = 1

  for (let i = confetti.length - 1; i >= 0; i--) {
    const cf = confetti[i]
    cf.vy = cf.vy + cf.grav * dt; cf.vx *= cf.drag; cf.swayPh += 0.05 * dt
    cf.x += cf.vx * dt + Math.sin(cf.swayPh) * cf.swayAmp; cf.y += cf.vy * dt
    cf.rot += cf.rotSpd * dt; cf.wob += cf.wobSpd * dt
    if (cf.y > H + 26) { confetti.splice(i, 1); continue }
    const flip = Math.cos(cf.wob)
    c.save(); c.translate(cf.x, cf.y); c.rotate(cf.rot)
    c.scale(1, Math.abs(flip) * 0.9 + 0.1)
    c.fillStyle = Math.abs(flip) < 0.32 ? cf.hi : cf.base; c.globalAlpha = 0.94
    c.fillRect(-cf.w / 2, -cf.h / 2, cf.w, cf.h); c.restore()
  }
  c.globalAlpha = 1

  if (fallers.length) {
    const spr = sunflowerSprite()
    for (let i = fallers.length - 1; i >= 0; i--) {
      const f = fallers[i]
      f.swayPh += 0.02 * dt; f.vy = Math.min(f.vy + 0.006 * dt, 2.8)
      f.x += f.vx * dt + Math.sin(f.swayPh) * f.swayAmp * 0.3; f.y += f.vy * dt; f.rot += f.rotSpd * dt
      if (f.y > H + 44) { fallers.splice(i, 1); continue }
      const sz = 52 * f.sc
      c.save(); c.translate(f.x, f.y); c.rotate(f.rot); c.globalAlpha = 0.97
      c.drawImage(spr, -sz / 2, -sz / 2, sz, sz); c.restore()
    }
    c.globalAlpha = 1
  }

  if (spawnDone && !rockets.length && !sparks.length && !confetti.length && !smoke.length && !fallers.length) {
    stopEngine()
    return
  }
  rafId = requestAnimationFrame(step)
}
function startEngine() {
  if (running) return
  running = true; lastT = 0; spawnDone = false
  rafId = requestAnimationFrame(step)
}
function stopEngine() {
  running = false
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
  rockets = []; sparks = []; confetti = []; smoke = []; fallers = []
  if (ctx) ctx.clearRect(0, 0, W, H)
}

/* ---------- choreography ---------- */
function enter() {
  if (!h) return
  h.stage.classList.add('enter')
  phase = 'lit'
  addTimer(() => { if (h && phase === 'lit') h.hint.classList.add('show') }, 500)
  // AUTO-blow (no tap-to-blow: the reader owns the side tap zones).
  autoTimer = addTimer(() => { if (phase === 'lit') blow() }, 1800)
}
function blow() {
  if (!h || phase !== 'lit') return
  phase = 'blow'
  if (autoTimer) { clearTimeout(autoTimer); autoTimer = null }
  h.hint.classList.remove('show')
  h.jay.classList.add('blow'); h.lily.classList.add('blow')
  addTimer(() => {
    if (!h) return
    h.flames.classList.add('out')
    h.stage.classList.add('blowing')
    startEngine()
    spawnSmoke(150, 224); spawnSmoke(170, 218); spawnSmoke(190, 224)
  }, 360)
  addTimer(celebrate, 950)
  addTimer(() => { if (!h) return; h.jay.classList.remove('blow'); h.lily.classList.remove('blow') }, 1200)
}
function celebrate() {
  if (!h) return
  phase = 'celebrate'
  h.stage.classList.add('blown')
  doFlash(0.98)
  launchRocket(0.5, 0.14); launchRocket(0.3, 0.24); launchRocket(0.7, 0.2); launchRocket(0.18, 0.3)
  addTimer(() => { launchRocket(0.2, 0.18); launchRocket(0.82, 0.26); launchRocket(0.5, 0.3) }, 260)
  addTimer(() => { launchRocket(0.42, 0.11); launchRocket(0.62, 0.29); launchRocket(0.86, 0.16) }, 560)
  addTimer(() => { launchRocket(0.14, 0.2); launchRocket(0.5, 0.24); launchRocket(0.74, 0.13) }, 900)
  addTimer(() => { launchRocket(0.34, 0.16); launchRocket(0.66, 0.22); launchRocket(0.24, 0.28) }, 1300)
  addTimer(() => {
    doFlash(1)
    for (let k = 0; k < 14; k++) {
      const kk = k
      addTimer(() => { launchRocket(0.1 + kk * 0.058, 0.1 + (kk % 4) * 0.055, pick(FX)) }, kk * 70)
    }
  }, 1880)
  addTimer(() => {
    doFlash(0.9)
    for (let k = 0; k < 8; k++) {
      const kk = k
      addTimer(() => { launchRocket(0.2 + kk * 0.08, 0.13 + (kk % 3) * 0.05) }, kk * 80)
    }
  }, 2560)
  addTimer(() => { burst(W * 0.5, H * 0.24, '#ffd873', 230); doFlash(0.8) }, 2380)
  addTimer(() => { burst(W * 0.3, H * 0.21, '#f0907a', 150); burst(W * 0.7, H * 0.23, '#ffcf5a', 150) }, 2660)
  addTimer(() => { burst(W * 0.5, H * 0.3, '#ffb85c', 180); doFlash(0.7) }, 3060)
  spawnConfetti(74); spawnConfetti(42, true, W * 0.5, H * 0.4)
  addTimer(() => { spawnConfetti(58) }, 300)
  addTimer(() => { spawnConfetti(52, true, W * 0.5, H * 0.44) }, 760)
  addTimer(() => { spawnConfetti(50) }, 1320)
  addTimer(() => { spawnConfetti(46, true, W * 0.5, H * 0.42) }, 2000)
  addTimer(() => { spawnConfetti(40) }, 2700)
  startFinale(3500)
  addTimer(() => { if (h) h.message.classList.add('show') }, 5200)
}
function startFinale(t0: number) {
  addTimer(() => { if (h) { h.field.classList.add('bloom'); h.fieldFront.classList.add('bloom') } }, t0)
  const total = 16
  for (let n = 0; n < total; n++) {
    const nn = n
    addTimer(spawnFaller, t0 + 200 + nn * 150 + (nn % 3) * 40)
  }
  addTimer(() => { spawnDone = true }, t0 + 200 + total * 150 + 600)
}

/* ---------- reduced-motion / final held state ---------- */
function drawStaticCelebration() {
  if (!ctx) return
  const c = ctx
  c.clearRect(0, 0, W, H)
  c.globalCompositeOperation = 'lighter'
  const drawBurst = (cx: number, cy: number, color: string, rad: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count, r2 = rad * rand(0.7, 1)
      const col = (Math.random() < 0.2 ? '#fff3d0' : color)
      const d = 6
      c.globalAlpha = 0.9
      c.drawImage(sprite(col), cx + Math.cos(a) * r2 - d / 2, cy + Math.sin(a) * r2 - d / 2, d, d)
    }
  }
  drawBurst(W * 0.28, H * 0.2, '#ffb85c', 92, 50)
  drawBurst(W * 0.72, H * 0.16, '#f0907a', 78, 44)
  drawBurst(W * 0.52, H * 0.28, '#f4be3a', 110, 64)
  drawBurst(W * 0.16, H * 0.34, '#ffcf5a', 60, 34)
  drawBurst(W * 0.86, H * 0.33, '#ffd873', 60, 34)
  c.globalAlpha = 1
  c.globalCompositeOperation = 'source-over'
  for (let i = 0; i < 96; i++) {
    const cc = pick(CONF), x = rand(0, W), y = rand(0, H * 0.86), w = rand(5, 10), hh = rand(6, 13), rot = rand(0, Math.PI * 2)
    c.save(); c.translate(x, y); c.rotate(rot)
    c.fillStyle = Math.random() < 0.3 ? cc.hi : cc.base; c.globalAlpha = 0.9
    c.fillRect(-w / 2, -hh / 2, w, hh); c.restore()
  }
  c.globalAlpha = 1
  const spr = sunflowerSprite()
  for (let i = 0; i < 6; i++) {
    const fx = rand(W * 0.08, W * 0.92), fy = rand(H * 0.12, H * 0.6), fsc = rand(0.5, 0.9), frot = rand(-0.5, 0.5), fsz = 52 * fsc
    c.save(); c.translate(fx, fy); c.rotate(frot); c.globalAlpha = 0.96
    c.drawImage(spr, -fsz / 2, -fsz / 2, fsz, fsz); c.restore()
  }
  c.globalAlpha = 1
}
function finalState() {
  if (!h) return
  clearTimers(); stopEngine()
  h.stage.classList.add('enter', 'blown')
  h.flames.classList.add('out')
  h.field.classList.add('bloom'); h.fieldFront.classList.add('bloom')
  h.jay.classList.remove('blow'); h.lily.classList.remove('blow')
  drawStaticCelebration()
  h.message.classList.add('show')
  phase = 'done'
}

/* ---------- run / teardown, gated by the `active` prop ---------- */
function runSequence() {
  if (!h) return
  clearTimers(); stopEngine()
  h.stage.classList.remove('blown', 'blowing', 'enter')
  h.flames.classList.remove('out')
  h.field.classList.remove('bloom'); h.fieldFront.classList.remove('bloom')
  h.jay.classList.remove('blow'); h.lily.classList.remove('blow')
  h.hint.classList.remove('show')
  h.message.classList.remove('show')
  h.flash.style.transition = 'none'; h.flash.style.opacity = '0'
  void h.stage.offsetWidth // force reflow so the entrance transition replays
  phase = 'idle'
  if (reduce) { finalState(); return }
  h.motes.classList.add('run')
  addTimer(enter, 220)
}
function teardown() {
  clearTimers(); stopEngine()
  if (!h) return
  h.stage.classList.remove('enter', 'blowing', 'blown')
  h.flames.classList.remove('out')
  h.field.classList.remove('bloom'); h.fieldFront.classList.remove('bloom')
  h.jay.classList.remove('blow'); h.lily.classList.remove('blow')
  h.hint.classList.remove('show')
  h.message.classList.remove('show')
  h.motes.classList.remove('run')
  h.flash.style.transition = 'none'; h.flash.style.opacity = '0'
  phase = 'idle'
}

/* ---------- lifecycle listeners ---------- */
function onResize() { sizeCanvas() }
function onHide() { clearTimers(); stopEngine() }
function onVis() { if (document.hidden) { clearTimers(); stopEngine() } }

function onReplay() { runSequence() }
function onReread() { emit('restart') }

onMounted(() => {
  const root = rootRef.value
  const canvas = canvasRef.value
  if (!root || !canvas) return
  const context = canvas.getContext('2d')
  if (!context) return
  ctx = context
  const q = (sel: string) => root.querySelector(sel)
  const jay = q('.jay'), lily = q('.lily'), flames = q('.flames')
  const field = q('.field'), fieldFront = q('.field-front')
  const glow = q('.cake-glow'), motes = q('.cake-motes')
  const flash = q('.cake-flash'), hint = q('.cake-hint'), message = q('.cake-message')
  const clip = q('.clip-petals')
  if (!(jay && lily && flames && field && fieldFront && glow && motes && flash && hint && message && clip)) return
  h = {
    stage: root, jay, lily, flames, field, fieldFront,
    glow: glow as HTMLElement, motes: motes as HTMLElement,
    flash: flash as HTMLElement, hint: hint as HTMLElement, message: message as HTMLElement,
    canvas, ctx: context,
  }
  buildClip(clip)
  buildMotes(motes as HTMLElement)
  buildField(field, fieldFront)
  sizeCanvas()
  ro = new ResizeObserver(() => sizeCanvas())
  ro.observe(root)
  window.addEventListener('resize', onResize)
  window.addEventListener('pagehide', onHide)
  document.addEventListener('visibilitychange', onVis)
  if (props.active) runSequence()
})

watch(() => props.active, (isActive) => {
  if (isActive) runSequence()
  else teardown()
})

onBeforeUnmount(() => {
  teardown()
  if (ro) { ro.disconnect(); ro = null }
  window.removeEventListener('resize', onResize)
  window.removeEventListener('pagehide', onHide)
  document.removeEventListener('visibilitychange', onVis)
})
</script>

<template>
  <div
    ref="rootRef"
    class="cake-ending"
    aria-label="100일 케이크 축하"
  >
    <div
      class="cake-glow"
      aria-hidden="true"
    />
    <div
      class="cake-motes"
      aria-hidden="true"
    />

    <!-- eslint-disable vue/no-v-html -- static developer-authored SVG scene (no user input) -->
    <div
      class="cake-scene-wrap"
      aria-hidden="true"
      v-html="sceneSvg"
    />
    <!-- eslint-enable vue/no-v-html -->

    <canvas
      ref="canvasRef"
      class="cake-fx"
      aria-hidden="true"
    />
    <div
      class="cake-flash"
      aria-hidden="true"
    />
    <div class="cake-hint">
      {{ t(leadIn) }}
    </div>

    <section class="cake-message">
      <div class="cake-eyebrow">
        {{ t(eyebrow) }}
      </div>
      <template
        v-for="(para, i) in messageParas"
        :key="i"
      >
        <p
          class="cake-msg"
          :class="{ love: i === messageParas.length - 1 }"
        >
          {{ para }}
        </p>
        <div
          v-if="i === 0"
          class="cake-rule"
        />
      </template>
      <div class="cake-btns">
        <button
          type="button"
          class="cake-btn primary"
          @click="onReread"
        >
          {{ t(rereadLabel) }} ↺
        </button>
        <button
          type="button"
          class="cake-btn"
          @click="onReplay"
        >
          {{ t(replayLabel) }} ↺
        </button>
      </div>
    </section>

    <div
      class="cake-grain"
      aria-hidden="true"
    />
  </div>
</template>

<!-- Not scoped: the scene lives partly in v-html and partly in JS-injected SVG
     nodes, neither of which carry Vue's scoped data-attribute. Every selector is
     prefixed with `.cake-ending` (a class unique to this component) so the rules
     behave as if scoped without depending on the attribute. Keyframes are
     `cake*`-prefixed to avoid colliding with global animations. -->
<style>
.cake-ending {
  --cream: #fff9ed;
  --paper: #f3e6c8;
  --gold: #f4be3a;
  --brass: #c99a2e;
  --amber: #ffb85c;
  --sun: #ffcf5a;
  --rose: #f0907a;
  --leaf: #7e8a56;
  --brown: #3d2b1f;
  --ink: #4a3626;
  --serif-kr: "Noto Serif KR", "Noto Serif TC", serif;
  --hand: "Gaegu", "Gowun Dodum", cursive;
  --round: "Gowun Dodum", Pretendard, system-ui, sans-serif;

  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  color: var(--ink);
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
}

/* warm radial glow that swells on the blow-out */
.cake-ending .cake-glow {
  position: absolute;
  left: 50%;
  top: 30%;
  width: 170%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(255, 206, 90, 0.55) 0%, rgba(255, 206, 90, 0.14) 42%, transparent 66%);
  opacity: 0.28;
  pointer-events: none;
  z-index: 1;
  transition: opacity 1s ease;
}
.cake-ending.blown .cake-glow {
  opacity: 0.9;
}

/* ambient warm motes */
.cake-ending .cake-motes {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
}
.cake-ending .cake-motes .m {
  position: absolute;
  bottom: -6%;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fff2c0, #ffcf5a 60%, rgba(255, 207, 90, 0) 72%);
  opacity: 0;
  will-change: transform, opacity;
}
@keyframes cakeFloatUp {
  0% { transform: translateY(0) scale(0.6); opacity: 0; }
  14% { opacity: 0.8; }
  86% { opacity: 0.5; }
  100% { transform: translateY(-116%) scale(1); opacity: 0; }
}
.cake-ending .cake-motes.run .m {
  animation: cakeFloatUp var(--dur) linear var(--delay) infinite;
}

.cake-ending .cake-scene-wrap {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  z-index: 3;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.cake-ending .cake-svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* character entrance + lean */
.cake-ending .char {
  opacity: 0;
  transform: translateY(74px);
  transform-box: fill-box;
  transform-origin: 50% 100%;
  transition: transform 0.95s cubic-bezier(0.2, 0.9, 0.25, 1), opacity 0.7s ease;
}
.cake-ending.enter .char {
  opacity: 1;
  transform: translateY(0);
}
.cake-ending.enter .jay.blow {
  transform: rotate(7deg);
}
.cake-ending.enter .lily.blow {
  transform: rotate(-7deg);
}
.cake-ending .mouth-blow {
  opacity: 0;
}
.cake-ending .jay.blow .mouth-smile,
.cake-ending .lily.blow .mouth-smile {
  opacity: 0;
}
.cake-ending .jay.blow .mouth-blow,
.cake-ending .lily.blow .mouth-blow {
  opacity: 1;
}

/* cake pop-in */
.cake-ending .cake {
  opacity: 0;
  transform: translateY(30px) scale(0.86);
  transform-box: fill-box;
  transform-origin: 50% 100%;
  transition: transform 0.8s cubic-bezier(0.34, 1.4, 0.5, 1) 0.12s, opacity 0.55s ease 0.12s;
}
.cake-ending.enter .cake {
  opacity: 1;
  transform: none;
}

/* candle flames — flicker, then puff out */
.cake-ending .flame {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: cakeFlick 1.1s ease-in-out infinite;
}
.cake-ending .flame.f2 { animation-duration: 0.9s; animation-delay: -0.3s; }
.cake-ending .flame.f3 { animation-duration: 1.25s; animation-delay: -0.6s; }
@keyframes cakeFlick {
  0%, 100% { transform: scaleY(1) scaleX(1); }
  50% { transform: scaleY(1.12) scaleX(0.9) translateX(0.5px); }
}
.cake-ending .cake .flames.out .flame {
  transform: scaleY(0.02) scaleX(0.3);
  opacity: 0;
  transition: transform 0.28s ease, opacity 0.3s ease;
  animation: none;
}
.cake-ending .flameGlow { transition: opacity 0.3s ease; }
.cake-ending .cake .flames.out .flameGlow { opacity: 0 !important; }

/* sunflower field — grows from the ground line */
.cake-ending .sfield .gstem {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  transform: scaleY(0);
  transition: transform 0.55s cubic-bezier(0.3, 0.9, 0.4, 1);
}
.cake-ending .sfield .ghead {
  transform-box: fill-box;
  transform-origin: 50% 50%;
  transform: scale(0);
  opacity: 0;
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.5, 1), opacity 0.34s ease;
}
.cake-ending .sfield.bloom .gstem {
  transform: scaleY(1);
  transition-delay: calc(var(--d, 0) * 1ms);
}
.cake-ending .sfield.bloom .ghead {
  transform: scale(1);
  opacity: 1;
  transition-delay: calc(var(--d, 0) * 1ms + 0.4s);
}

/* canvas celebration + flash */
.cake-ending .cake-fx {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
}
.cake-ending .cake-flash {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(70% 55% at 50% 32%, rgba(255, 244, 205, 0.9), rgba(255, 206, 120, 0.25) 46%, transparent 72%);
  transition: opacity 0.5s ease;
}

/* lead-in caption */
.cake-ending .cake-hint {
  position: absolute;
  left: 0;
  right: 0;
  top: 14%;
  z-index: 6;
  text-align: center;
  pointer-events: none;
  font-family: var(--hand);
  font-weight: 700;
  font-size: 19px;
  color: var(--brass);
  opacity: 0;
  transition: opacity 0.5s ease;
  text-shadow: 0 1px 0 rgba(255, 249, 237, 0.8);
  padding: 0 16px;
}
.cake-ending .cake-hint.show { opacity: 1; }

/* "후~" breath puffs */
.cake-ending .huff {
  font-family: var(--hand);
  font-weight: 700;
  fill: #c9772e;
  opacity: 0;
  transform-box: fill-box;
  transform-origin: 50% 100%;
}
.cake-ending.blowing .huff { animation: cakeHuff 0.9s ease-out both; }
.cake-ending.blowing .huff.hr { animation-delay: 0.05s; }
@keyframes cakeHuff {
  0% { opacity: 0; transform: translate(0, 3px) scale(0.6); }
  30% { opacity: 0.95; }
  100% { opacity: 0; transform: translate(var(--hx, 0px), -20px) scale(1.15); }
}

/* message card */
.cake-ending .cake-message {
  position: relative;
  z-index: 7;
  flex: 0 0 auto;
  margin: 0 6px calc(6px + env(safe-area-inset-bottom, 0px));
  padding: 14px 20px 16px;
  text-align: center;
  opacity: 0;
  transform: translateY(16px);
  border-radius: 20px 20px 18px 18px;
  background: linear-gradient(180deg, rgba(255, 252, 244, 0.94), rgba(255, 247, 228, 0.97));
  box-shadow: 0 -2px 0 rgba(255, 255, 255, 0.6) inset, 0 8px 26px rgba(122, 82, 40, 0.16), 0 0 0 1px rgba(201, 154, 46, 0.16);
  transition: opacity 1.1s cubic-bezier(0.22, 0.61, 0.36, 1), transform 1.1s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.cake-ending .cake-message.show { opacity: 1; transform: none; }
.cake-ending .cake-eyebrow {
  font-family: var(--hand);
  font-weight: 700;
  font-size: 18px;
  color: var(--brass);
  letter-spacing: 0.06em;
  margin-bottom: 9px;
}
.cake-ending .cake-eyebrow::before,
.cake-ending .cake-eyebrow::after {
  content: "✦";
  margin: 0 9px;
  color: var(--gold);
  font-size: 0.72em;
  opacity: 0.85;
}
.cake-ending .cake-msg {
  font-family: var(--serif-kr);
  font-weight: 500;
  font-size: clamp(15px, 4.3vw, 18px);
  line-height: 1.78;
  color: var(--ink);
  letter-spacing: 0.01em;
  text-shadow: 0 1px 0 rgba(255, 249, 237, 0.7);
  white-space: pre-line;
  margin: 0;
}
.cake-ending .cake-msg.love {
  font-weight: 700;
  color: #d8663f;
  margin-top: 0.35em;
}
.cake-ending .cake-rule {
  width: 52px;
  height: 2px;
  margin: 12px auto;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, var(--rose), transparent);
  opacity: 0.85;
}
.cake-ending .cake-btns {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 14px;
}
.cake-ending .cake-btn {
  font-family: var(--round);
  font-size: 14.5px;
  font-weight: 700;
  color: var(--ink);
  min-height: 44px;
  padding: 0 17px;
  border-radius: 999px;
  cursor: pointer;
  background: var(--cream);
  border: 1.5px solid var(--brass);
  box-shadow: 0 3px 10px rgba(122, 82, 40, 0.14);
  transition: transform 0.18s;
}
.cake-ending .cake-btn:active { transform: translateY(1px) scale(0.98); }
.cake-ending .cake-btn.primary {
  color: #5a3a1e;
  background: linear-gradient(180deg, #ffe08a, #f4be3a);
  border-color: var(--brass);
  box-shadow: 0 4px 14px rgba(201, 154, 46, 0.34);
}

.cake-ending .cake-grain {
  position: absolute;
  inset: 0;
  z-index: 9;
  pointer-events: none;
  opacity: 0.08;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

@media (prefers-reduced-motion: reduce) {
  .cake-ending .char,
  .cake-ending .cake,
  .cake-ending .cake-message,
  .cake-ending .cake-glow,
  .cake-ending .cake-flash { transition: none !important; }
  .cake-ending .sfield .gstem,
  .cake-ending .sfield .ghead { transition: none !important; }
  .cake-ending .flame,
  .cake-ending .cake-motes.run .m { animation: none !important; }
}
</style>
