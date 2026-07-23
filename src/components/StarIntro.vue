<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { getLocalizedText, type Locale, type LocalizedText } from '@/content/localization'
import { starIntro } from '@/content/starIntro'
import { uiText } from '@/content/ui'

// Constellation tour → meteor shower → cream gift box, ported from
// design-lab/constellation-lab/11-tour-to-giftbox.html to a Vue SFC.
//
// Flow: (1) full constellation tour (establishing wide shot + title, camera
// pans through 4 clusters blooming photo-stars + drawing lines, then pulls out
// to reveal the whole constellation); (2) a tap prompt; (3) on tap the whole
// constellation falls as a meteor shower while night → golden-hour; (4) the
// stardust forms a cream gift box under a god-ray, then "tap to open".
//
// All copy renders live from L() so switching language mid-intro updates
// everything (title, prompt, star captions, name tag, skip, ready prompt).

const props = defineProps<{ locale: Locale }>()
const emit = defineEmits<{ completed: [] }>()

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
// A star's caption is a literal string (dates / distance) OR a LocalizedText
// key from starIntro (rendered live via L). Empty caption = no label.
type StarCap = string | LocalizedText | null
interface RawStar { x: number; y: number; seed: number; cap: StarCap }

const rawStars: RawStar[] = [
  { x: 170, y: 250, seed: 0, cap: '2026.04.28' },
  { x: 270, y: 340, seed: 1, cap: null },
  { x: 190, y: 440, seed: 2, cap: starIntro.capFirstMeeting },
  { x: 540, y: 320, seed: 3, cap: null },
  { x: 620, y: 420, seed: 4, cap: '2026.05.11' },
  { x: 555, y: 520, seed: 5, cap: starIntro.capVideoCall },
  { x: 360, y: 640, seed: 6, cap: starIntro.capSameSky },
  { x: 220, y: 840, seed: 7, cap: null },
  { x: 320, y: 920, seed: 8, cap: starIntro.capInTaiwan },
  { x: 180, y: 980, seed: 9, cap: null },
  { x: 480, y: 880, seed: 10, cap: '1,478km' },
  { x: 570, y: 970, seed: 11, cap: null },
]
const clusters = [
  { ids: [0, 1, 2], fx: 210, fy: 350, s: 1.14 },
  { ids: [3, 4, 5], fx: 575, fy: 420, s: 1.14 },
  { ids: [6, 7, 8, 9], fx: 300, fy: 800, s: 1.06 },
  { ids: [10, 11], fx: 520, fy: 920, s: 1.14 },
]
const edges = [[0, 1], [1, 2], [3, 4], [4, 5], [7, 8], [8, 9], [10, 11], [6, 3], [6, 7], [1, 6]]

// Reactive star list (lit flag drives the bloom); src precomputed once.
const stars = reactive(
  rawStars.map(s => ({ x: s.x, y: s.y, cap: s.cap, src: fauxPhoto(s.seed, 180, 228), lit: false })),
)
// Reactive line list (drawn flag drives the stroke-dashoffset draw-on).
const lines = reactive(
  edges.map(([a, b]) => {
    const len = Math.hypot(rawStars[a].x - rawStars[b].x, rawStars[a].y - rawStars[b].y)
    return { x1: rawStars[a].x, y1: rawStars[a].y, x2: rawStars[b].x, y2: rawStars[b].y, len, a, b, drawn: false }
  }),
)

// caption text — literal string passes through, LocalizedText goes through L()
function capText(cap: StarCap): string {
  if (!cap) return ''
  return typeof cap === 'string' ? cap : L(cap)
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
const sparkles = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2, r = 40 + Math.random() * 40
  return { sx: Math.cos(a) * r, sy: Math.sin(a) * r }
})
const moonSrc = fauxPhoto(1, 300, 300)

// ---------------- reactive scene state (drives class bindings) --------------
const stageGolden = ref(false)
const stageFalling = ref(false)
const stageReady = ref(false)
const titleShow = ref(false)
const fallLineShow = ref(false)
const promptShow = ref(false)
const readyShow = ref(false)
const boxAssembled = ref(false)
const boxReady = ref(false)

// ---------------- element refs ----------------
const stageRef = ref<HTMLDivElement>()
const universeRef = ref<HTMLDivElement>()
const linesRef = ref<SVGSVGElement>()
const meteorLayerRef = ref<HTMLDivElement>()
const moonRef = ref<HTMLDivElement>()
const starEls: HTMLElement[] = []
function setStarEl(el: Element | null, i: number) {
  if (el) starEls[i] = el as HTMLElement
}

// ---------------- timers / lifecycle guards ----------------
const timers: number[] = []
let cancelled = false
let phase: 'idle' | 'tour' | 'invite' | 'fall' | 'ready' = 'idle'
const meteorEls: HTMLElement[] = []

const wait = (ms: number) => new Promise<void>((r) => { timers.push(window.setTimeout(r, ms)) })
const at = (ms: number, fn: () => void) => { timers.push(window.setTimeout(() => { if (!cancelled) fn() }, ms)) }
function clearTimers() { timers.forEach(t => window.clearTimeout(t)); timers.length = 0 }

let completedEmitted = false
function finish() {
  if (completedEmitted) return
  completedEmitted = true
  cancelled = true
  clearTimers()
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

// ===== PHASE 1 + 2 — the COMPLETE tour, then invite the tap =====
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
  // auto-fallback if no tap within 7s
  at(7000, () => { if (phase === 'invite') triggerFall() })
}

// ===== PHASE 3 + 4 — meteor handoff then gift box =====
const LX = 0.5, LY = 0.62 // shared landing point (fraction of stage)

function triggerFall() {
  if (phase !== 'invite') return
  phase = 'fall'
  promptShow.value = false

  const stage = stageRef.value
  const uni = universeRef.value
  const linesSvg = linesRef.value
  const meteorLayer = meteorLayerRef.value
  if (!stage || !uni || !linesSvg || !meteorLayer) return

  // COORDINATE HANDOFF: snapshot each tour tile's on-screen center vs #stage
  const sr = stage.getBoundingClientRect()
  const W = sr.width, H = sr.height
  const LXp = LX * W, LYp = LY * H
  const tiles = [...starEls]
  if (moonRef.value) tiles.push(moonRef.value)
  const snaps = tiles.map((el) => {
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2 - sr.left, y: r.top + r.height / 2 - sr.top }
  })

  // fade the constellation lines and hide the transformed universe
  linesSvg.style.opacity = '0'
  uni.style.opacity = '0'

  // night -> golden hour, grow the landing glow, fade dust/horizon
  stageFalling.value = true
  at(300, () => { stageGolden.value = true })
  at(500, () => { fallLineShow.value = true })

  // spawn stage-level meteors at the snapshotted positions and streak them down
  snaps.forEach((p, i) => {
    const m = document.createElement('div'); m.className = 'su-meteor'
    m.style.left = p.x + 'px'; m.style.top = p.y + 'px'
    const trail = document.createElement('div'); trail.className = 'su-trail'
    const dot = document.createElement('div'); dot.className = 'su-mdot'
    m.appendChild(trail); m.appendChild(dot)
    meteorLayer.appendChild(m); meteorEls.push(m)

    const dx = LXp - p.x, dy = LYp - p.y
    const dist = Math.hypot(dx, dy)
    const backAng = Math.atan2(-dy, -dx) * 180 / Math.PI
    const tlen = Math.min(150, dist * 0.5)
    at(80 + i * 95, () => {
      trail.style.width = tlen + 'px'
      trail.style.transform = `rotate(${backAng}deg)`
      m.classList.add('fall')
      m.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.4)`
    })
    at(80 + i * 95 + 1000, () => m.classList.add('arrived')) // trail fades on arrival
    at(80 + i * 95 + 1150, () => m.classList.add('converged')) // dot melts into the glow
  })

  // gather into the gift box
  at(2500, () => { fallLineShow.value = false })
  at(2600, () => { boxAssembled.value = true }) // body -> ribbon -> bow -> tag -> sparkle
  at(4400, goReady)
}

function goReady() {
  phase = 'ready'
  stageReady.value = true
  boxReady.value = true
  readyShow.value = true
}

// static golden-hour READY state (reduced motion)
function endStatic() {
  cancelled = false
  const uni = universeRef.value
  const linesSvg = linesRef.value
  if (uni) { uni.style.transition = 'none'; uni.style.opacity = '0' }
  if (linesSvg) linesSvg.style.opacity = '0'
  stageGolden.value = true
  stageReady.value = true
  boxAssembled.value = true
  boxReady.value = true
  titleShow.value = false
  promptShow.value = false
  fallLineShow.value = false
  readyShow.value = true
  phase = 'ready'
}

// ---------------- interactions ----------------
function onStageClick() {
  if (phase === 'invite') triggerFall()
  else if (phase === 'ready') finish()
}
function onSkip() {
  finish()
}

onMounted(() => {
  if (reduced) { endStatic(); return }
  run()
})

onBeforeUnmount(() => {
  cancelled = true
  clearTimers()
  meteorEls.forEach(m => m.remove())
  meteorEls.length = 0
})
</script>

<template>
  <div
    ref="stageRef"
    class="su-stage"
    :class="{ golden: stageGolden, falling: stageFalling, ready: stageReady }"
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
    >
      <svg
        ref="linesRef"
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
        :ref="(el) => setStarEl(el as Element | null, i)"
        class="su-star"
        :class="{ lit: s.lit }"
        :style="{ left: s.x + 'px', top: s.y + 'px' }"
        data-media="photo"
      >
        <div class="su-card">
          <img
            :src="s.src"
            alt=""
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
        ref="moonRef"
        class="su-moon"
        data-media="video"
        role="img"
        :aria-label="L(starIntro.capMoon)"
      >
        <div class="su-face">
          <img
            :src="moonSrc"
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
          {{ L(starIntro.capMoon) }}
        </div>
      </div>
    </div>

    <div
      ref="meteorLayerRef"
      class="su-meteor-layer"
      aria-hidden="true"
    />
    <div
      class="su-glow"
      aria-hidden="true"
    />

    <!-- gift box (matches the site's gift scene) -->
    <div
      class="su-box"
      :class="{ assembled: boxAssembled, ready: boxReady }"
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
    <div
      class="su-sparkle"
      :class="{ show: boxAssembled }"
      aria-hidden="true"
    >
      <span
        v-for="(sp, i) in sparkles"
        :key="i"
        :style="{ '--sx': sp.sx + 'px', '--sy': sp.sy + 'px' }"
      />
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

    <div
      class="su-fallline"
      :class="{ show: fallLineShow }"
      aria-hidden="true"
    >
      <template
        v-for="(ln, j) in L(starIntro.fallLine).split('\n')"
        :key="j"
      >
        <br v-if="j > 0">
        {{ ln }}
      </template>
    </div>

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

    <div
      class="su-readyp"
      :class="{ show: readyShow }"
      aria-hidden="true"
    >
      <div class="su-rmain">
        {{ L(uiText.tapToOpen) }}
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

/* twinkle dust (night) */
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

/* ===== Golden-hour scene furniture (revealed in phase 4) ===== */
.su-godray {
  position: absolute; top: -8%; left: 50%; transform: translateX(-50%); width: 78%; height: 82%;
  pointer-events: none; opacity: 0; transition: opacity 1.4s ease .3s; mix-blend-mode: screen;
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
  position: absolute; left: 0; right: 0; bottom: 0; height: 34%; pointer-events: none; opacity: 0;
  transition: opacity 1.4s ease .2s;
  background: linear-gradient(180deg, transparent, rgba(196, 146, 84, .55) 42%, #a9713f 100%);
}
.su-ground::before {
  content: ""; position: absolute; left: 0; right: 0; top: 0; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 240, 200, .55), transparent);
}
.su-stage.golden .su-ground { opacity: 1; }

/* soft floating golden dust in the warm scene */
.su-gdust { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity 1.4s ease .4s; }
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
.su-face img {
  position: absolute; inset: -10%; width: 120%; height: 120%; object-fit: cover;
  filter: brightness(1.12) saturate(1.02);
  animation: su-moondrift 9s ease-in-out infinite alternate;
}
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

/* ===== PHASE 3 — stage-level meteors spawned from the snapshot ===== */
.su-meteor-layer { position: absolute; inset: 0; pointer-events: none; z-index: 8; }
:deep(.su-meteor) {
  position: absolute; transform: translate(-50%, -50%); will-change: transform;
  transition: transform 1.05s cubic-bezier(.34, .42, .2, 1);
}
:deep(.su-meteor .su-trail) {
  position: absolute; left: 50%; top: 50%; height: 3px; width: 0; transform-origin: 0 50%;
  background: linear-gradient(90deg, rgba(244, 190, 58, 0), rgba(255, 238, 180, .95));
  border-radius: 3px; opacity: 0; transition: opacity .45s ease; filter: blur(.4px);
}
:deep(.su-meteor .su-mdot) {
  position: absolute; left: 50%; top: 50%; width: 7px; height: 7px; margin: -3.5px 0 0 -3.5px;
  border-radius: 50%; background: var(--star);
  box-shadow: 0 0 9px 3px rgba(255, 246, 214, 1), 0 0 22px 8px rgba(244, 190, 58, .75);
  transition: opacity .5s ease, transform .5s ease;
}
:deep(.su-meteor.fall .su-trail) { opacity: .95; }
:deep(.su-meteor.arrived .su-trail) { opacity: 0; }
:deep(.su-meteor.converged .su-mdot) { opacity: 0; transform: scale(.2); }

/* landing glow at the gift point */
.su-glow {
  position: absolute; left: 50%; top: 62%; width: 230px; height: 230px; z-index: 5;
  transform: translate(-50%, -50%) scale(.2); opacity: 0; pointer-events: none;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 236, 180, .9) 0%, rgba(244, 190, 58, .4) 34%, transparent 68%);
  transition: opacity 1s ease, transform 1.1s ease;
}
.su-stage.falling .su-glow { opacity: .95; transform: translate(-50%, -50%) scale(1); }
.su-stage.ready .su-glow { opacity: .6; transform: translate(-50%, -50%) scale(.92); animation: su-glowbreathe 4.5s ease-in-out 1s infinite; }
@keyframes su-glowbreathe {
  0%, 100% { opacity: .45; transform: translate(-50%, -50%) scale(.86); }
  50% { opacity: .72; transform: translate(-50%, -50%) scale(.98); }
}

/* ===== Gift box (matches the site's gift scene) ===== */
.su-box {
  position: absolute; left: 50%; top: 62%; width: 170px; height: 150px; z-index: 7;
  transform: translate(-50%, -46%); pointer-events: none;
}
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
.su-box.ready .su-shimmer { opacity: 1; animation: su-boxshimmer 6s ease-in-out 1.2s infinite; }
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

/* assembly sparkle burst */
.su-sparkle {
  position: absolute; left: 50%; top: 62%; z-index: 8; transform: translate(-50%, -50%);
  width: 0; height: 0; pointer-events: none;
}
.su-sparkle span {
  position: absolute; left: 0; top: 0; width: 6px; height: 6px; margin: -3px 0 0 -3px;
  border-radius: 50%; background: radial-gradient(circle, #fff8e2, rgba(244, 190, 58, 0)); opacity: 0;
}
.su-sparkle.show span { animation: su-spark .9s ease-out 1.15s; }
@keyframes su-spark {
  0% { opacity: 0; transform: translate(0, 0) scale(.3); }
  30% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--sx), var(--sy)) scale(1); }
}

/* ===== Copy overlays ===== */
.su-title {
  position: absolute; left: 0; right: 0; top: 16%; text-align: center; padding: 0 26px; z-index: 9;
  opacity: 0; transition: opacity 1s ease; pointer-events: none;
}
.su-title.show { opacity: 1; }
.su-tk { font-family: Gaegu, cursive; font-size: 17px; color: var(--amber); text-shadow: 0 1px 8px rgba(0, 0, 0, .7); }
.su-tm {
  font-family: "Noto Serif KR", serif; font-weight: 500; font-size: 21px; margin-top: 6px;
  color: var(--cream); line-height: 1.6; text-shadow: 0 2px 12px rgba(0, 0, 0, .6);
}

.su-fallline {
  position: absolute; left: 0; right: 0; top: 11%; text-align: center; padding: 0 30px; z-index: 9;
  font-family: "Noto Serif KR", serif; font-weight: 500; font-size: 18px; line-height: 1.7; color: var(--cream);
  text-shadow: 0 2px 14px rgba(60, 30, 10, .6); opacity: 0; transition: opacity 1s ease; pointer-events: none;
}
.su-fallline.show { opacity: 1; }

/* tap prompt (phase 2) */
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

/* ready prompt (phase 4) */
.su-readyp {
  position: absolute; left: 50%; bottom: 16%; transform: translateX(-50%); z-index: 12;
  text-align: center; opacity: 0; transition: opacity .8s ease; pointer-events: none; padding: 0 24px;
}
.su-readyp.show { opacity: 1; }
.su-rmain {
  font-family: "Noto Serif KR", serif; font-weight: 500; font-size: 20px; color: var(--brown);
  text-shadow: 0 1px 0 rgba(255, 252, 244, .7); white-space: nowrap;
}
.su-rmain::after {
  content: ""; display: block; width: 30px; height: 2px; margin: 11px auto 0;
  background: linear-gradient(90deg, transparent, var(--brass), transparent);
}

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
  .su-glow, .su-lines, .su-star, .su-card, .su-sdot, .su-cap,
  .su-top, .su-front, .su-r-v, .su-r-h, .su-r-top, .su-bow, .su-tag, .su-contact,
  .su-title, .su-fallline, .su-prompt, .su-readyp, .su-skip { transition: none !important; }
  .su-d, .su-gd, .su-sdot, .su-sweep, .su-face img, .su-bar i,
  .su-godray::after, .su-glow, .su-shimmer, .su-ripple::before, .su-ripple::after,
  .su-ptext, .su-sparkle.show span { animation: none !important; }
}
</style>
