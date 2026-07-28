<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { getLocalizedText, type Locale } from '@/content/localization'
import { uiText } from '@/content/ui'
import coverVideoUrl from '@/assets/cover-media/cover.mp4?url'

const props = defineProps<{ locale: Locale }>()
const emit = defineEmits<{ opened: [] }>()

// ---- reactive UI state (drives the DOM overlays) ----
const rootRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()
const veilHidden = ref(false)
const showGiftMsg = ref(false)
const showTapHint = ref(false)
const showTapLabel = ref(true)
const showTurnHint = ref(false)
const showSkip = ref(false)
const fallbackActive = ref(false)
// Exposed on the root as data-gs-phase for reliable e2e sequencing.
const internalPhase = ref<'intro' | 'box' | 'rise' | 'bookready' | 'open' | 'reveal' | 'ready'>('intro')

// ---- live-localized DOM strings ----
const giftMessageText = computed(() => getLocalizedText(uiText.giftMessage, props.locale))
const tapToOpenText = computed(() => getLocalizedText(uiText.tapToOpen, props.locale))
const swipeHintText = computed(() => getLocalizedText(uiText.swipeHint, props.locale))
const skipText = computed(() => getLocalizedText(uiText.skipIntro, props.locale))

let openedEmitted = false
function emitOpened() {
  if (openedEmitted) return
  openedEmitted = true
  emit('opened')
}
function onSkip() {
  // Skip → jump straight into reading mode.
  emitOpened()
}
function onFallbackContinue() {
  emitOpened()
}

// ---------------------------------------------------------------------------
// WebGL scene (ported from design-lab/giftbox-lab/01-golden-hour-study.html)
// ---------------------------------------------------------------------------
let teardown: () => void = () => {}

onMounted(() => {
  const canvas = canvasRef.value
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  function webglOK(): boolean {
    try {
      const c = document.createElement('canvas')
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
    } catch {
      return false
    }
  }

  if (!canvas || reduced || !webglOK()) {
    fallbackActive.value = true
    veilHidden.value = true
    return
  }

  /* ===== easing ===== */
  const E = {
    outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
    outBack: (t: number) => {
      const c1 = 1.70158
      const c3 = c1 + 1
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
    },
  }

  /* ===== tiny tween engine (dotted-path props) ===== */
  type NumRecord = Record<string, number>
  interface Tween {
    target: object
    props: NumRecord
    duration: number
    delay: number
    ease: (t: number) => number
    elapsed: number
    started: boolean
    start: NumRecord
    onUpdate?: (e: number) => void
    onDone?: () => void
  }
  interface TweenOpt {
    duration?: number
    delay?: number
    ease?: (t: number) => number
    onUpdate?: (e: number) => void
    onDone?: () => void
  }
  const tweens: Tween[] = []
  function resolve(target: object, path: string): [NumRecord, string] {
    const parts = path.split('.')
    let o: unknown = target
    for (let i = 0; i < parts.length - 1; i++) o = (o as Record<string, unknown>)[parts[i]]
    return [o as NumRecord, parts[parts.length - 1]]
  }
  function tweenTo(target: object, propvals: NumRecord, opt: TweenOpt = {}): Tween {
    const tw: Tween = {
      target,
      props: propvals,
      duration: opt.duration ?? 1,
      delay: opt.delay ?? 0,
      ease: opt.ease ?? E.outCubic,
      elapsed: 0,
      started: false,
      start: {},
      onUpdate: opt.onUpdate,
      onDone: opt.onDone,
    }
    tweens.push(tw)
    return tw
  }
  function updateTweens(dt: number) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i]
      if (tw.delay > 0) {
        tw.delay -= dt
        continue
      }
      if (!tw.started) {
        tw.started = true
        for (const k in tw.props) {
          const [o, p] = resolve(tw.target, k)
          tw.start[k] = o[p]
        }
      }
      tw.elapsed += dt
      const t = Math.min(tw.elapsed / tw.duration, 1)
      const e = tw.ease(t)
      for (const k in tw.props) {
        const [o, p] = resolve(tw.target, k)
        o[p] = tw.start[k] + (tw.props[k] - tw.start[k]) * e
      }
      if (tw.onUpdate) tw.onUpdate(e)
      if (t >= 1) {
        if (tw.onDone) tw.onDone()
        tweens.splice(i, 1)
      }
    }
  }
  function wait(s: number, fn: () => void) {
    tweenTo({ v: 0 }, { v: 1 }, { duration: Math.max(s, 0.0001), onDone: fn })
  }

  /* ===== canvas texture helpers ===== */
  function softSprite(inner = 'rgba(255,236,200,1)', outer = 'rgba(255,236,200,0)') {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')!
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grd.addColorStop(0, inner)
    grd.addColorStop(0.35, 'rgba(255,222,160,0.55)')
    grd.addColorStop(1, outer)
    g.fillStyle = grd
    g.fillRect(0, 0, 128, 128)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }
  function rayTexture() {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 512
    const g = c.getContext('2d')!
    const grd = g.createLinearGradient(0, 0, 0, 512)
    grd.addColorStop(0, 'rgba(255,220,150,0.0)')
    grd.addColorStop(0.5, 'rgba(255,214,140,0.42)')
    grd.addColorStop(1, 'rgba(255,190,110,0.0)')
    g.fillStyle = grd
    g.fillRect(0, 0, 64, 512)
    const h = g.createLinearGradient(0, 0, 64, 0)
    h.addColorStop(0, 'rgba(0,0,0,0.55)')
    h.addColorStop(0.5, 'rgba(0,0,0,0)')
    h.addColorStop(1, 'rgba(0,0,0,0.55)')
    g.globalCompositeOperation = 'destination-out'
    g.fillStyle = h
    g.fillRect(0, 0, 64, 512)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }
  function woodTexture() {
    const c = document.createElement('canvas')
    c.width = c.height = 512
    const g = c.getContext('2d')!
    g.fillStyle = '#5a3e26'
    g.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 70; i++) {
      g.strokeStyle = `rgba(${60 + Math.random() * 40},${40 + Math.random() * 26},${22 + Math.random() * 16},${0.1 + Math.random() * 0.18})`
      g.lineWidth = 1 + Math.random() * 3
      g.beginPath()
      let y = Math.random() * 512
      g.moveTo(0, y)
      for (let x = 0; x <= 512; x += 32) {
        y += (Math.random() - 0.5) * 10
        g.lineTo(x, y)
      }
      g.stroke()
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(2, 2)
    return t
  }

  interface TextLinePart { t: string; font?: string; color?: string }
  interface TextOpts {
    w?: number
    h?: number
    bg?: string
    border?: string
    borderW?: number
    color?: string
    font?: string
    align?: CanvasTextAlign
    padX?: number
    lh?: number
    size?: number
    offY?: number
    shadow?: string
    shadowBlur?: number
  }
  const redrawables: Array<{ texture: THREE.Texture; draw: () => void }> = []
  function textTexture(lines: Array<string | TextLinePart[]>, o: TextOpts = {}) {
    const W = o.w || 1024
    const H = o.h || 512
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const g = c.getContext('2d')!
    function draw() {
      g.clearRect(0, 0, W, H)
      if (o.bg) {
        g.fillStyle = o.bg
        g.fillRect(0, 0, W, H)
      }
      if (o.border) {
        g.strokeStyle = o.border
        g.lineWidth = o.borderW || 6
        g.strokeRect(o.borderW || 6, o.borderW || 6, W - 2 * (o.borderW || 6), H - 2 * (o.borderW || 6))
      }
      g.textAlign = o.align || 'center'
      g.textBaseline = 'middle'
      const cx = o.align === 'left' ? o.padX || 40 : W / 2
      const font = o.font || '700 90px "Noto Serif TC","Noto Serif KR",serif'
      const lh = o.lh || (o.size ? o.size * 1.4 : 120)
      const startY = H / 2 - (lines.length - 1) * lh / 2 + (o.offY || 0)
      lines.forEach((ln, i) => {
        const parts: TextLinePart[] = Array.isArray(ln) ? ln : [{ t: ln }]
        parts.forEach((pt) => {
          g.font = pt.font || font
          g.fillStyle = pt.color || o.color || '#3d2b1f'
          if (o.shadow) {
            g.shadowColor = o.shadow
            g.shadowBlur = o.shadowBlur || 18
          } else {
            g.shadowBlur = 0
          }
          g.fillText(pt.t, cx, startY + i * lh)
        })
      })
    }
    draw()
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    redrawables.push({ texture: t, draw })
    return t
  }

  // Localized canvas textures (box name tag + book title) — redrawn on locale change.
  const SERIF = '"Noto Serif TC","Noto Serif KR",serif'
  const localizedTextures: Array<{ texture: THREE.Texture; draw: () => void }> = []

  const tagCanvas = document.createElement('canvas')
  tagCanvas.width = 512
  tagCanvas.height = 300
  const tagG = tagCanvas.getContext('2d')!
  function drawTag() {
    const W = 512
    const H = 300
    tagG.clearRect(0, 0, W, H)
    tagG.fillStyle = '#fff9ed'
    tagG.fillRect(0, 0, W, H)
    tagG.strokeStyle = '#c99a2e'
    tagG.lineWidth = 10
    tagG.strokeRect(10, 10, W - 20, H - 20)
    tagG.textAlign = 'center'
    tagG.textBaseline = 'middle'
    const txt = getLocalizedText(uiText.nameTag, props.locale)
    let size = 120
    tagG.font = `700 ${size}px ${SERIF}`
    while (tagG.measureText(txt).width > W - 70 && size > 34) {
      size -= 6
      tagG.font = `700 ${size}px ${SERIF}`
    }
    tagG.fillStyle = '#5a3f22'
    tagG.shadowColor = 'rgba(0,0,0,0.12)'
    tagG.shadowBlur = 8
    tagG.fillText(txt, W / 2, H / 2)
    tagG.shadowBlur = 0
  }
  const tagTex = new THREE.CanvasTexture(tagCanvas)
  tagTex.colorSpace = THREE.SRGBColorSpace
  tagTex.anisotropy = 8
  localizedTextures.push({ texture: tagTex, draw: drawTag })

  const titleCanvas = document.createElement('canvas')
  titleCanvas.width = 1024
  titleCanvas.height = 560
  const titleG = titleCanvas.getContext('2d')!
  function drawTitle() {
    const W = 1024
    const H = 560
    titleG.clearRect(0, 0, W, H)
    const txt = getLocalizedText(uiText.bookTitle, props.locale)
    titleG.textAlign = 'center'
    titleG.textBaseline = 'middle'
    let lines: string[]
    if (txt.includes(' ')) {
      const parts = txt.split(' ')
      const mid = Math.ceil(parts.length / 2)
      lines = [parts.slice(0, mid).join(' '), parts.slice(mid).join(' ')]
    } else if (txt.length > 6) {
      const mid = Math.ceil(txt.length / 2)
      lines = [txt.slice(0, mid), txt.slice(mid)]
    } else {
      lines = [txt]
    }
    let size = 150
    const widest = () => {
      titleG.font = `700 ${size}px ${SERIF}`
      return Math.max(...lines.map((l) => titleG.measureText(l).width))
    }
    while (widest() > W - 120 && size > 46) size -= 8
    const lh = size * 1.32
    titleG.fillStyle = '#f4be3a'
    titleG.shadowColor = 'rgba(0,0,0,0.35)'
    titleG.shadowBlur = 16
    const startY = H / 2 - (lines.length - 1) * lh / 2
    lines.forEach((l, i) => titleG.fillText(l, W / 2, startY + i * lh))
    titleG.shadowBlur = 0
  }
  const titleTex = new THREE.CanvasTexture(titleCanvas)
  titleTex.colorSpace = THREE.SRGBColorSpace
  titleTex.anisotropy = 8
  localizedTextures.push({ texture: titleTex, draw: drawTitle })
  drawTag()
  drawTitle()

  /* ===== scene / renderer ===== */
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
  } catch (err) {
    fallbackActive.value = true
    veilHidden.value = true
    console.warn('GiftScene: WebGL init failed, using fallback', err)
    return
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.06
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1310)
  scene.fog = new THREE.FogExp2(0x1a1310, 0.045)

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100)
  const camBase = new THREE.Vector3(0, 2.35, 7.4)
  camera.position.copy(camBase)
  const camTarget = new THREE.Vector3(0, 1.35, 0)
  camera.lookAt(camTarget)

  function envTexture() {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 128
    const g = c.getContext('2d')!
    const grd = g.createLinearGradient(0, 0, 0, 128)
    grd.addColorStop(0, '#efc98f')
    grd.addColorStop(0.45, '#c99a2e')
    grd.addColorStop(0.7, '#4a3826')
    grd.addColorStop(1, '#161009')
    g.fillStyle = grd
    g.fillRect(0, 0, 256, 128)
    const w = g.createRadialGradient(70, 34, 2, 70, 34, 60)
    w.addColorStop(0, 'rgba(255,240,200,0.95)')
    w.addColorStop(1, 'rgba(255,240,200,0)')
    g.fillStyle = w
    g.fillRect(0, 0, 256, 128)
    const t = new THREE.CanvasTexture(c)
    t.mapping = THREE.EquirectangularReflectionMapping
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envSrc = envTexture()
  const envRT = pmrem.fromEquirectangular(envSrc)
  scene.environment = envRT.texture

  /* ===== lights ===== */
  const amb = new THREE.AmbientLight(0xffdca8, 0.35)
  scene.add(amb)
  const keyLight = new THREE.DirectionalLight(0xffcf88, 2.5)
  keyLight.position.set(-6.5, 7.5, 4.5)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(2048, 2048)
  keyLight.shadow.camera.near = 1
  keyLight.shadow.camera.far = 30
  keyLight.shadow.camera.left = -8
  keyLight.shadow.camera.right = 8
  keyLight.shadow.camera.top = 8
  keyLight.shadow.camera.bottom = -8
  keyLight.shadow.bias = -0.0008
  keyLight.shadow.radius = 6
  keyLight.shadow.blurSamples = 18
  scene.add(keyLight)
  const fill = new THREE.PointLight(0xffb85c, 6, 18, 2.0)
  fill.position.set(3.2, 2.2, 3.0)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffe0a8, 0.5)
  rim.position.set(3, 2, -5)
  scene.add(rim)

  /* ===== desk ===== */
  const deskMat = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.78, metalness: 0.0, color: 0x8a5f38 })
  const desk = new THREE.Mesh(new THREE.BoxGeometry(30, 0.6, 18), deskMat)
  desk.position.set(0, -0.3, -1)
  desk.receiveShadow = true
  scene.add(desk)

  const wallGrad = (() => {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 256
    const g = c.getContext('2d')!
    const grd = g.createLinearGradient(0, 0, 0, 256)
    grd.addColorStop(0, '#c79a52')
    grd.addColorStop(0.5, '#4d3823')
    grd.addColorStop(1, '#211710')
    g.fillStyle = grd
    g.fillRect(0, 0, 64, 256)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  })()
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(46, 26), new THREE.MeshBasicMaterial({ map: wallGrad, fog: true }))
  wall.position.set(0, 6, -13)
  scene.add(wall)

  const patch = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 7),
    new THREE.MeshBasicMaterial({ map: softSprite('rgba(255,214,140,0.9)', 'rgba(255,214,140,0)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
  )
  patch.rotation.x = -Math.PI / 2
  patch.position.set(-1.6, 0.02, 0.6)
  scene.add(patch)

  /* ===== god-ray light shafts ===== */
  const godGroup = new THREE.Group()
  scene.add(godGroup)
  const rayTex = rayTexture()
  interface RayUD { baseOp: number; ph: number; sp: number }
  const rays: THREE.Mesh[] = []
  for (let i = 0; i < 7; i++) {
    const w = 1.1 + Math.random() * 2.0
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, 20),
      new THREE.MeshBasicMaterial({ map: rayTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.0, fog: false }),
    )
    m.position.set(-4.5 + i * 1.35 + (Math.random() - 0.5), 5.2, -1.5 - Math.random() * 3)
    m.rotation.z = 0.34
    m.userData = { baseOp: 0.1 + Math.random() * 0.14, ph: Math.random() * Math.PI * 2, sp: 0.5 + Math.random() * 0.5 } as RayUD
    godGroup.add(m)
    rays.push(m)
  }
  godGroup.rotation.y = 0.06

  /* ===== dust motes ===== */
  const dustCount = 260
  const dustGeo = new THREE.BufferGeometry()
  const dPos = new Float32Array(dustCount * 3)
  const dPhase = new Float32Array(dustCount)
  for (let i = 0; i < dustCount; i++) {
    dPos[i * 3] = -6 + Math.random() * 10
    dPos[i * 3 + 1] = Math.random() * 8
    dPos[i * 3 + 2] = -4 + Math.random() * 8
    dPhase[i] = Math.random() * Math.PI * 2
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3))
  const dustMat = new THREE.PointsMaterial({
    size: 0.05,
    map: softSprite('rgba(255,232,180,1)', 'rgba(255,232,180,0)'),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.55,
    sizeAttenuation: true,
    fog: false,
  })
  const dust = new THREE.Points(dustGeo, dustMat)
  scene.add(dust)

  /* ===== falling sunflower petals (instanced) ===== */
  const petalDummy = new THREE.Object3D()
  const PETAL_COUNT = 56
  const _ps = new THREE.Shape()
  _ps.moveTo(0, -0.16)
  _ps.bezierCurveTo(0.1, -0.05, 0.09, 0.14, 0.0, 0.2)
  _ps.bezierCurveTo(-0.09, 0.14, -0.1, -0.05, 0.0, -0.16)
  const petalGeo2 = new THREE.ShapeGeometry(_ps, 10)
  const petalMat2 = new THREE.MeshStandardMaterial({ color: 0xf4be3a, roughness: 0.5, metalness: 0.0, side: THREE.DoubleSide, emissive: 0x6a4a0c, emissiveIntensity: 0.3 })
  const fallPetals = new THREE.InstancedMesh(petalGeo2, petalMat2, PETAL_COUNT)
  fallPetals.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  fallPetals.frustumCulled = false
  scene.add(fallPetals)
  interface PetalDatum {
    x: number; y: number; z: number
    rx: number; ry: number; rz: number
    vrx: number; vry: number; vrz: number
    fall: number; swayA: number; swayF: number; swayP: number; sc: number
  }
  const petalData: PetalDatum[] = []
  for (let i = 0; i < PETAL_COUNT; i++) {
    petalData.push({
      x: -7.5 + Math.random() * 15,
      y: -1 + Math.random() * 12,
      z: -3.5 + Math.random() * 8,
      rx: Math.random() * 6.28,
      ry: Math.random() * 6.28,
      rz: Math.random() * 6.28,
      vrx: (Math.random() - 0.5) * 1.1,
      vry: (Math.random() - 0.5) * 1.5,
      vrz: (Math.random() - 0.5) * 0.9,
      fall: 0.45 + Math.random() * 0.55,
      swayA: 0.4 + Math.random() * 0.6,
      swayF: 0.35 + Math.random() * 0.5,
      swayP: Math.random() * 6.28,
      sc: 0.7 + Math.random() * 0.8,
    })
  }

  /* ===== GIFT BOX ===== */
  const giftGroup = new THREE.Group()
  giftGroup.position.set(0, 0, 0)
  scene.add(giftGroup)
  const BOX_W = 2.0
  const BOX_H = 1.15
  const BOX_D = 2.0
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xf3e6c8, roughness: 0.72, metalness: 0.02 })
  const boxBase = new THREE.Mesh(new THREE.BoxGeometry(BOX_W, BOX_H, BOX_D), boxMat)
  boxBase.position.y = BOX_H / 2
  boxBase.castShadow = true
  boxBase.receiveShadow = true
  giftGroup.add(boxBase)

  const burst = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 1.7),
    new THREE.MeshBasicMaterial({ map: softSprite('rgba(255,235,180,1)', 'rgba(255,235,180,0)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }),
  )
  burst.position.set(0, BOX_H, 0)
  burst.rotation.x = -Math.PI / 2
  giftGroup.add(burst)
  const burstBeam = new THREE.Mesh(
    new THREE.ConeGeometry(1.0, 3.2, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffe6b0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }),
  )
  burstBeam.position.set(0, BOX_H + 1.6, 0)
  giftGroup.add(burstBeam)

  const lidPivot = new THREE.Group()
  lidPivot.position.set(0, BOX_H, 0)
  giftGroup.add(lidPivot)
  const LID_H = 0.28
  const lid = new THREE.Mesh(new THREE.BoxGeometry(BOX_W + 0.14, LID_H, BOX_D + 0.14), boxMat)
  lid.position.y = LID_H / 2
  lid.castShadow = true
  lid.receiveShadow = true
  lidPivot.add(lid)

  const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xf4be3a, roughness: 0.24, metalness: 0.55, emissive: 0x3a2a08, emissiveIntensity: 0.25 })
  const RB = 0.34
  const strapX = new THREE.Mesh(new THREE.BoxGeometry(BOX_W + 0.16, BOX_H + 0.02, RB), ribbonMat)
  strapX.position.set(0, BOX_H / 2, 0)
  strapX.castShadow = true
  giftGroup.add(strapX)
  const strapZ = new THREE.Mesh(new THREE.BoxGeometry(RB, BOX_H + 0.02, BOX_D + 0.16), ribbonMat)
  strapZ.position.set(0, BOX_H / 2, 0)
  strapZ.castShadow = true
  giftGroup.add(strapZ)
  const lidStrapX = new THREE.Mesh(new THREE.BoxGeometry(BOX_W + 0.3, LID_H + 0.03, RB), ribbonMat)
  lidStrapX.position.set(0, LID_H / 2, 0)
  lidStrapX.castShadow = true
  lidPivot.add(lidStrapX)
  const lidStrapZ = new THREE.Mesh(new THREE.BoxGeometry(RB, LID_H + 0.03, BOX_D + 0.3), ribbonMat)
  lidStrapZ.position.set(0, LID_H / 2, 0)
  lidStrapZ.castShadow = true
  lidPivot.add(lidStrapZ)

  const bow = new THREE.Group()
  bow.position.set(0, LID_H + 0.04, 0)
  lidPivot.add(bow)
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20), ribbonMat)
  knot.castShadow = true
  bow.add(knot)
  function bowLoop(sx: number, rot: number) {
    const torus = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.075, 16, 40), ribbonMat)
    torus.scale.set(1, 0.62, 0.5)
    torus.rotation.z = rot
    torus.position.set(sx, 0.05, 0)
    torus.castShadow = true
    bow.add(torus)
  }
  bowLoop(0.28, 0.35)
  bowLoop(-0.28, -0.35)
  function bowTail(rot: number) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.03), ribbonMat)
    t.position.set(Math.sin(rot) * 0.14, -0.26, 0.02)
    t.rotation.z = rot
    t.castShadow = true
    bow.add(t)
  }
  bowTail(0.3)
  bowTail(-0.3)

  // name tag (localized) hanging in FRONT of the box
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), new THREE.MeshStandardMaterial({ map: tagTex, roughness: 0.7, metalness: 0.0, side: THREE.DoubleSide }))
  tag.position.set(0.4, 0.4, BOX_D / 2 + 0.34)
  tag.rotation.set(0.14, -0.05, -0.05)
  tag.castShadow = true
  giftGroup.add(tag)
  const tagString = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0xc99a2e, roughness: 0.5, metalness: 0.3 }))
  tagString.position.set(0.34, 0.8, BOX_D / 2 + 0.26)
  tagString.rotation.z = 0.42
  giftGroup.add(tagString)

  // envelope (To./From.) — design chrome, kept verbatim
  const envTex = textTexture(
    [
      [{ t: 'To. 苙綺', font: '500 84px ' + SERIF, color: '#5a3f22' }],
      [{ t: 'From. Jay', font: '500 84px ' + SERIF, color: '#8a6a3a' }],
    ],
    { w: 1024, h: 640, bg: '#fbeecb', border: '#d8b268', borderW: 12, align: 'left', padX: 90, lh: 150, offY: 0 },
  )
  const envelope = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.95), new THREE.MeshStandardMaterial({ map: envTex, roughness: 0.78, metalness: 0.0, side: THREE.DoubleSide }))
  envelope.position.set(-1.85, 0.5, 1.1)
  envelope.rotation.set(-0.28, 0.42, 0.05)
  envelope.castShadow = true
  envelope.receiveShadow = true
  scene.add(envelope)

  // date stamp — design chrome, kept verbatim
  const stampTex = textTexture(
    [
      [{ t: 'Our First 100 Days', font: '600 66px ' + SERIF, color: '#7a5a30' }],
      [{ t: '2026.04.28 — 2026.08.05', font: '500 58px "Pretendard",sans-serif', color: '#9a7440' }],
    ],
    { w: 1024, h: 512, bg: 'rgba(0,0,0,0)', align: 'center', lh: 150 },
  )
  const stamp = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.0), new THREE.MeshStandardMaterial({ map: stampTex, transparent: true, roughness: 0.9, metalness: 0.0 }))
  stamp.rotation.x = -Math.PI / 2
  stamp.position.set(1.9, 0.021, 1.4)
  stamp.rotation.z = -0.18
  scene.add(stamp)

  /* ===== DIARY BOOK ===== */
  const bookGroup = new THREE.Group()
  bookGroup.position.set(0, 0.5, 0)
  bookGroup.scale.setScalar(0.6)
  bookGroup.visible = false
  scene.add(bookGroup)
  const BK_W = 1.7
  const BK_H = 0.34
  const BK_D = 2.25
  const coverMat = new THREE.MeshStandardMaterial({ color: 0xb8763a, roughness: 0.55, metalness: 0.08 })
  const pageMat = new THREE.MeshStandardMaterial({ color: 0xfff6e2, roughness: 0.9, metalness: 0.0 })
  const pageSideMat = new THREE.MeshStandardMaterial({ color: 0xefe0bd, roughness: 0.85 })

  const pageBlock = new THREE.Mesh(new THREE.BoxGeometry(BK_W - 0.06, BK_H - 0.1, BK_D - 0.06), [pageSideMat, pageSideMat, pageMat, pageSideMat, pageSideMat, pageSideMat])
  pageBlock.castShadow = true
  pageBlock.receiveShadow = true
  bookGroup.add(pageBlock)
  const backCover = new THREE.Mesh(new THREE.BoxGeometry(BK_W, 0.08, BK_D), coverMat)
  backCover.position.y = -BK_H / 2
  backCover.castShadow = true
  backCover.receiveShadow = true
  bookGroup.add(backCover)
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.1, BK_H + 0.04, BK_D), coverMat)
  spine.position.set(-BK_W / 2, 0, 0)
  spine.castShadow = true
  bookGroup.add(spine)

  const coverPivot = new THREE.Group()
  coverPivot.position.set(-BK_W / 2, BK_H / 2 - 0.02, 0)
  bookGroup.add(coverPivot)
  const frontCover = new THREE.Mesh(new THREE.BoxGeometry(BK_W, 0.09, BK_D), coverMat)
  frontCover.position.set(BK_W / 2, 0, 0)
  frontCover.castShadow = true
  frontCover.receiveShadow = true
  coverPivot.add(frontCover)

  // cover clip — the couple's video as a muted looping VideoTexture.
  function photoPlaceholder() {
    const c = document.createElement('canvas')
    c.width = c.height = 640
    const g = c.getContext('2d')!
    const grd = g.createLinearGradient(0, 0, 0, 640)
    grd.addColorStop(0, '#ffe6b0')
    grd.addColorStop(0.5, '#f4c979')
    grd.addColorStop(1, '#e0a95c')
    g.fillStyle = grd
    g.fillRect(0, 0, 640, 640)
    g.save()
    g.translate(320, 296)
    g.fillStyle = 'rgba(61,43,31,0.16)'
    for (let i = 0; i < 16; i++) {
      g.save()
      g.rotate((i * Math.PI) / 8)
      g.beginPath()
      g.ellipse(0, -120, 26, 70, 0, 0, Math.PI * 2)
      g.fill()
      g.restore()
    }
    g.beginPath()
    g.arc(0, 0, 64, 0, Math.PI * 2)
    g.fill()
    g.restore()
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }
  const photoMat = new THREE.MeshStandardMaterial({ map: photoPlaceholder(), roughness: 0.7, metalness: 0.0 })

  const titlePlate = new THREE.Mesh(
    new THREE.PlaneGeometry(BK_W * 0.74, BK_D * 0.34),
    new THREE.MeshStandardMaterial({ map: titleTex, transparent: true, roughness: 0.6, emissive: 0x2a1c06, emissiveIntensity: 0.35 }),
  )
  titlePlate.rotation.x = -Math.PI / 2
  titlePlate.position.set(BK_W / 2, 0.053, -0.48)
  coverPivot.add(titlePlate)

  const PHOTO_MAX_W = BK_W * 0.74
  const PHOTO_MAX_H = BK_D * 0.44
  const PHOTO_Z = 0.4
  const photoFrame = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0xfff6e2, roughness: 0.85, metalness: 0.0 }))
  photoFrame.rotation.x = -Math.PI / 2
  photoFrame.position.set(BK_W / 2, 0.052, PHOTO_Z)
  coverPivot.add(photoFrame)
  const photoPlate = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), photoMat)
  photoPlate.rotation.x = -Math.PI / 2
  photoPlate.position.set(BK_W / 2, 0.0535, PHOTO_Z)
  coverPivot.add(photoPlate)
  // Fit the framed photo to the image's real aspect ratio (no distortion).
  function fitCoverPhoto(ar: number) {
    let w = PHOTO_MAX_W
    let h = w / ar
    if (h > PHOTO_MAX_H) { h = PHOTO_MAX_H; w = h * ar }
    photoPlate.scale.set(w, h, 1)
    photoFrame.scale.set(w + 0.12, h + 0.12, 1)
  }
  fitCoverPhoto(1) // square default until the clip's metadata loads
  // Muted, looping cover video → VideoTexture (auto-updates while the scene renders).
  let coverVideoEl: HTMLVideoElement | null = document.createElement('video')
  coverVideoEl.src = coverVideoUrl
  coverVideoEl.muted = true
  coverVideoEl.loop = true
  coverVideoEl.playsInline = true
  coverVideoEl.setAttribute('muted', '')
  coverVideoEl.setAttribute('playsinline', '')
  coverVideoEl.preload = 'auto'
  coverVideoEl.addEventListener('loadedmetadata', () => {
    if (coverVideoEl && coverVideoEl.videoWidth && coverVideoEl.videoHeight) {
      fitCoverPhoto(coverVideoEl.videoWidth / coverVideoEl.videoHeight)
    }
    const vtex = new THREE.VideoTexture(coverVideoEl as HTMLVideoElement)
    vtex.colorSpace = THREE.SRGBColorSpace
    vtex.anisotropy = 8
    photoMat.map = vtex
    photoMat.needsUpdate = true
  })
  coverVideoEl.play().catch(() => {})

  const frameLineTex = (() => {
    const c = document.createElement('canvas')
    c.width = c.height = 512
    const g = c.getContext('2d')!
    g.strokeStyle = 'rgba(255,220,150,0.5)'
    g.lineWidth = 6
    g.strokeRect(24, 24, 464, 464)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  })()
  const frameLine = new THREE.Mesh(new THREE.PlaneGeometry(BK_W * 0.88, BK_D * 0.9), new THREE.MeshBasicMaterial({ map: frameLineTex, transparent: true }))
  frameLine.rotation.x = -Math.PI / 2
  frameLine.position.set(BK_W / 2, 0.0515, 0)
  coverPivot.add(frameLine)

  function ruledPage(heading: string, withFlower: boolean) {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 1024
    const g = c.getContext('2d')!
    function draw() {
      g.fillStyle = '#fff8e8'
      g.fillRect(0, 0, 1024, 1024)
      g.strokeStyle = 'rgba(160,120,60,0.18)'
      g.lineWidth = 3
      for (let y = 300; y < 960; y += 88) {
        g.beginPath()
        g.moveTo(90, y)
        g.lineTo(934, y)
        g.stroke()
      }
      if (heading) {
        g.fillStyle = '#7a5a34'
        g.font = '600 70px ' + SERIF
        g.textAlign = 'left'
        g.textBaseline = 'middle'
        g.fillText(heading, 110, 180)
      }
      if (withFlower) {
        g.save()
        g.translate(512, 720)
        g.fillStyle = 'rgba(200,150,40,0.28)'
        for (let i = 0; i < 18; i++) {
          g.save()
          g.rotate((i * Math.PI) / 9)
          g.beginPath()
          g.ellipse(0, -116, 22, 62, 0, 0, Math.PI * 2)
          g.fill()
          g.restore()
        }
        g.fillStyle = 'rgba(61,43,31,0.4)'
        g.beginPath()
        g.arc(0, 0, 56, 0, Math.PI * 2)
        g.fill()
        g.restore()
      }
    }
    draw()
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    redrawables.push({ texture: t, draw })
    return t
  }
  const PG_W = BK_W * 0.46
  const PG_D = BK_D * 0.92
  const leftPage = new THREE.Mesh(new THREE.PlaneGeometry(PG_W, PG_D), new THREE.MeshStandardMaterial({ map: ruledPage('苙綺', true), roughness: 0.92 }))
  leftPage.rotation.x = -Math.PI / 2
  leftPage.position.set(-BK_W * 0.24, BK_H / 2 - 0.045, 0)
  bookGroup.add(leftPage)
  const rightPage = new THREE.Mesh(new THREE.PlaneGeometry(PG_W, PG_D), new THREE.MeshStandardMaterial({ map: ruledPage('', false), roughness: 0.92 }))
  rightPage.rotation.x = -Math.PI / 2
  rightPage.position.set(BK_W * 0.24, BK_H / 2 - 0.045, 0)
  bookGroup.add(rightPage)
  leftPage.visible = false
  rightPage.visible = false

  /* ===== post-processing (bloom) ===== */
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.62, 0.75, 0.82)
  composer.addPass(bloomPass)

  /* ===== state machine + choreography ===== */
  const PHASE = { INTRO: 'intro', BOX: 'box', RISE: 'rise', BOOKREADY: 'bookready', OPEN: 'open', REVEAL: 'reveal', READY: 'ready' } as const
  type PhaseKey = (typeof PHASE)[keyof typeof PHASE]
  let phase: PhaseKey = PHASE.INTRO
  let interactive = true
  let bookBaseY = 1.72
  function setPhase(p: PhaseKey) {
    phase = p
    internalPhase.value = p
  }

  function showIntroUI() {
    showGiftMsg.value = true
    wait(0.6, () => (showTapHint.value = true))
    wait(1.0, () => (showSkip.value = true))
  }

  function openBox() {
    if (phase !== PHASE.INTRO) return
    setPhase(PHASE.BOX)
    interactive = false
    showGiftMsg.value = false
    showTapHint.value = false
    tweenTo(lidPivot.position, { y: BOX_H + 2.0 }, { duration: 1.5, ease: E.outCubic, delay: 0.05 })
    tweenTo(lidPivot.rotation, { z: 0.5, x: -0.25 }, { duration: 1.6, ease: E.inOutSine, delay: 0.05 })
    tweenTo(lidPivot.scale, { x: 0.9, y: 0.9, z: 0.9 }, { duration: 1.6, ease: E.outCubic, delay: 0.05 })
    tweenTo(burst.material as THREE.Material, { opacity: 0.95 }, { duration: 0.5, ease: E.outExpo, delay: 0.25, onDone: () => tweenTo(burst.material as THREE.Material, { opacity: 0.28 }, { duration: 1.4, ease: E.outCubic }) })
    tweenTo(burst.scale, { x: 2.4, y: 2.4 }, { duration: 1.6, ease: E.outCubic, delay: 0.25 })
    tweenTo(burstBeam.material as THREE.Material, { opacity: 0.5 }, { duration: 0.5, ease: E.outExpo, delay: 0.3, onDone: () => tweenTo(burstBeam.material as THREE.Material, { opacity: 0.12 }, { duration: 1.6, ease: E.outCubic }) })
    tweenTo(bloomPass, { strength: 1.6 }, { duration: 0.4, ease: E.outExpo, delay: 0.25, onDone: () => tweenTo(bloomPass, { strength: 0.72 }, { duration: 1.4, ease: E.outCubic }) })
    rays.forEach((r) => tweenTo(r.userData, { baseOp: (r.userData as RayUD).baseOp * 1.7 }, { duration: 1.2, delay: 0.3 }))
    wait(0.75, riseBook)
  }

  function riseBook() {
    setPhase(PHASE.RISE)
    bookGroup.visible = true
    bookGroup.position.set(0, 0.55, 0)
    bookGroup.scale.setScalar(0.62)
    bookGroup.rotation.set(0.9, 0.5, 0)
    tweenTo(bookGroup.position, { y: 1.85 }, { duration: 2.2, ease: E.outCubic })
    tweenTo(bookGroup.position, { z: 1.75 }, { duration: 2.2, ease: E.outCubic })
    tweenTo(bookGroup.scale, { x: 1, y: 1, z: 1 }, { duration: 2.0, ease: E.outBack })
    tweenTo(bookGroup.rotation, { x: 1.3, y: 0.0, z: 0.0 }, { duration: 2.4, ease: E.inOutCubic, onDone: bookReady })
    tweenTo(camBase, { y: 1.95, z: 7.3 }, { duration: 2.5, ease: E.inOutSine })
    tweenTo(camTarget, { y: 1.8 }, { duration: 2.5, ease: E.inOutSine })
    tweenTo(giftGroup.position, { y: -0.15 }, { duration: 2.2, ease: E.outCubic })
    tweenTo(burst.material as THREE.Material, { opacity: 0 }, { duration: 1.6, ease: E.outCubic, delay: 0.6 })
    tweenTo(burstBeam.material as THREE.Material, { opacity: 0 }, { duration: 1.4, ease: E.outCubic, delay: 0.6 })
  }

  function bookReady() {
    setPhase(PHASE.BOOKREADY)
    interactive = true
    bookBaseY = 1.85
    showTapLabel.value = false
    showTapHint.value = true
  }

  function openCover() {
    if (phase !== PHASE.BOOKREADY) return
    setPhase(PHASE.OPEN)
    interactive = false
    showTapHint.value = false
    wait(0.5, () => {
      leftPage.visible = true
      rightPage.visible = true
    })
    tweenTo(bookGroup.rotation, { x: 0.62 }, { duration: 1.9, ease: E.inOutCubic })
    tweenTo(bookGroup.position, { y: 1.62 }, { duration: 1.9, ease: E.inOutSine })
    tweenTo(coverPivot.rotation, { z: 2.55 }, { duration: 2.0, ease: E.inOutCubic, onDone: settleOpen })
    tweenTo(camBase, { y: 2.55, z: 6.9 }, { duration: 2.0, ease: E.inOutSine })
    tweenTo(camTarget, { y: 1.6 }, { duration: 2.0, ease: E.inOutSine })
  }

  function settleOpen() {
    setPhase(PHASE.REVEAL)
    bookBaseY = 1.62
    tweenTo(bloomPass, { strength: 0.85 }, { duration: 0.8, ease: E.outCubic, onDone: () => tweenTo(bloomPass, { strength: 0.7 }, { duration: 1.0, ease: E.outCubic }) })
    wait(1.0, finish)
  }

  function finish() {
    setPhase(PHASE.READY)
    interactive = false
    showTurnHint.value = true
    // Hand off to reading mode; App crossfades reading in over the open spread.
    wait(0.9, emitOpened)
  }

  /* ===== input ===== */
  function onTap() {
    if (!interactive) return
    if (phase === PHASE.INTRO) openBox()
    else if (phase === PHASE.BOOKREADY) openCover()
  }
  canvas.addEventListener('pointerdown', onTap)

  let px = 0
  let py = 0
  function onPointerMove(e: PointerEvent) {
    px = e.clientX / window.innerWidth - 0.5
    py = e.clientY / window.innerHeight - 0.5
  }
  window.addEventListener('pointermove', onPointerMove)

  /* ===== resize ===== */
  let camBaseZoom = 1.0
  function resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    const portrait = h > w
    camera.aspect = w / h
    camera.fov = portrait ? 50 : 42
    camBaseZoom = portrait ? 1.22 : 1.0
    camera.updateProjectionMatrix()
    // On narrow portrait screens the side decor (envelope left, date stamp right)
    // falls outside the frame — pull both inward (and a touch forward) so they show.
    if (portrait) {
      envelope.position.set(-0.98, 0.5, 1.6)
      envelope.scale.setScalar(0.9)
      stamp.position.set(0.66, 0.021, 2.02)
      stamp.scale.setScalar(0.82)
    } else {
      envelope.position.set(-1.85, 0.5, 1.1)
      envelope.scale.setScalar(1)
      stamp.position.set(1.9, 0.021, 1.4)
      stamp.scale.setScalar(1)
    }
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    composer.setSize(w, h)
    bloomPass.setSize(w, h)
  }
  window.addEventListener('resize', resize)
  resize()

  /* ===== render loop ===== */
  let raf = 0
  let disposed = false
  let lastTime = performance.now()
  let elapsed = 0
  function animate() {
    if (disposed) return
    raf = requestAnimationFrame(animate)
    const now = performance.now()
    const dt = Math.min((now - lastTime) / 1000, 0.05)
    lastTime = now
    elapsed += dt
    const t = elapsed
    updateTweens(dt)

    if (phase === PHASE.INTRO) {
      giftGroup.position.y = Math.sin(t * 1.3) * 0.04
      giftGroup.rotation.y = Math.sin(t * 0.5) * 0.05
    }
    if (phase === PHASE.BOOKREADY || phase === PHASE.REVEAL || phase === PHASE.READY) {
      bookGroup.position.y = bookBaseY + Math.sin(t * 1.4) * 0.02
    }

    rays.forEach((r) => {
      const ud = r.userData as RayUD
      ;(r.material as THREE.Material & { opacity: number }).opacity = ud.baseOp * (0.7 + 0.3 * Math.sin(t * ud.sp + ud.ph))
      r.position.x += Math.sin(t * 0.15 + ud.ph) * 0.0006
    })

    const dp = dustGeo.attributes.position.array as Float32Array
    for (let i = 0; i < dustCount; i++) {
      dp[i * 3 + 1] += 0.06 * dt
      dp[i * 3] += Math.sin(t * 0.3 + dPhase[i]) * 0.0016
      if (dp[i * 3 + 1] > 8) {
        dp[i * 3 + 1] = 0
        dp[i * 3] = -6 + Math.random() * 10
      }
    }
    dustGeo.attributes.position.needsUpdate = true

    for (let i = 0; i < PETAL_COUNT; i++) {
      const p = petalData[i]
      p.y -= p.fall * dt
      p.x += Math.sin(t * p.swayF + p.swayP) * p.swayA * dt
      p.rx += p.vrx * dt
      p.ry += p.vry * dt
      p.rz += p.vrz * dt
      if (p.y < -1.4) {
        p.y = 10 + Math.random() * 2.5
        p.x = -7.5 + Math.random() * 15
        p.z = -3.5 + Math.random() * 8
      }
      petalDummy.position.set(p.x, p.y, p.z)
      petalDummy.rotation.set(p.rx, p.ry, p.rz)
      petalDummy.scale.setScalar(p.sc)
      petalDummy.updateMatrix()
      fallPetals.setMatrixAt(i, petalDummy.matrix)
    }
    fallPetals.instanceMatrix.needsUpdate = true

    const targetPos = camBase.clone().multiplyScalar(camBaseZoom)
    targetPos.x += px * 0.6
    targetPos.y += -py * 0.35
    camera.position.lerp(targetPos, 0.06)
    camera.lookAt(camTarget)

    composer.render()
  }

  /* ===== boot (wait for fonts so canvas text is crisp) ===== */
  function boot() {
    veilHidden.value = true
    showIntroUI()
    animate()
  }
  let booted = false
  function doBoot() {
    if (booted || disposed) return
    booted = true
    redrawables.forEach((r) => {
      try {
        r.draw()
        r.texture.needsUpdate = true
      } catch {
        /* ignore */
      }
    })
    localizedTextures.forEach((r) => {
      try {
        r.draw()
        r.texture.needsUpdate = true
      } catch {
        /* ignore */
      }
    })
    setTimeout(boot, 60)
  }
  const fontApi = (document as Document & { fonts?: FontFaceSet }).fonts
  if (fontApi && typeof fontApi.load === 'function') {
    const fontJobs = [
      fontApi.load('700 90px "Noto Serif TC"'),
      fontApi.load('500 84px "Noto Serif TC"'),
      fontApi.load('700 130px "Noto Serif KR"'),
      fontApi.load('600 66px "Noto Serif KR"'),
    ]
    Promise.race([Promise.all(fontJobs).catch(() => {}), new Promise((r) => setTimeout(r, 2500))]).then(doBoot)
  } else {
    doBoot()
  }

  /* ===== live localization ===== */
  watch(
    () => props.locale,
    () => {
      localizedTextures.forEach((r) => {
        try {
          r.draw()
          r.texture.needsUpdate = true
        } catch {
          /* ignore */
        }
      })
    },
  )

  /* ===== teardown ===== */
  teardown = () => {
    disposed = true
    if (raf) cancelAnimationFrame(raf)
    tweens.length = 0
    if (coverVideoEl) { coverVideoEl.pause(); coverVideoEl.removeAttribute('src'); coverVideoEl.load(); coverVideoEl = null }
    canvas.removeEventListener('pointerdown', onTap)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('resize', resize)

    const disposeMaterial = (m: THREE.Material) => {
      const mm = m as unknown as Record<string, unknown>
      for (const key of ['map', 'alphaMap', 'emissiveMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap']) {
        const tx = mm[key]
        if (tx && (tx as THREE.Texture).isTexture) (tx as THREE.Texture).dispose()
      }
      m.dispose()
    }
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const mat = (mesh as THREE.Mesh).material
      if (Array.isArray(mat)) mat.forEach(disposeMaterial)
      else if (mat) disposeMaterial(mat as THREE.Material)
    })
    // standalone textures / targets not reachable via material maps
    rayTex.dispose()
    envSrc.dispose()
    envRT.dispose()
    pmrem.dispose()
    bloomPass.dispose()
    composer.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
  }
})

onBeforeUnmount(() => {
  teardown()
})
</script>

<template>
  <div
    ref="rootRef"
    class="gsx-root"
    :data-gs-phase="internalPhase"
  >
    <canvas
      ref="canvasRef"
      class="gsx-canvas"
    />

    <div
      class="gsx-vignette"
      aria-hidden="true"
    />
    <div
      class="gsx-grain"
      aria-hidden="true"
    />

    <!-- UI overlays -->
    <div class="gsx-ui">
      <div
        class="gsx-gift-message"
        :class="{ show: showGiftMsg }"
      >
        {{ giftMessageText }}
      </div>

      <div
        class="gsx-tap-hint"
        :class="{ show: showTapHint }"
      >
        <div class="gsx-tap-glyph">
          <span class="gsx-dot" />
        </div>
        <div
          v-show="showTapLabel"
          class="gsx-label"
        >
          {{ tapToOpenText }}
        </div>
      </div>

      <div
        class="gsx-turn-hint"
        :class="{ show: showTurnHint }"
      >
        <span class="gsx-chev l">‹</span>
        <span>{{ swipeHintText }}</span>
        <span class="gsx-chev r">›</span>
      </div>

      <button
        class="gsx-skip"
        :class="{ show: showSkip }"
        type="button"
        :aria-label="skipText"
        @click.stop="onSkip"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M5 4l9 8-9 8V4z" />
          <path d="M19 5v14" />
        </svg>
        {{ skipText }}
      </button>
    </div>

    <!-- CSS fallback (no WebGL / reduced motion) -->
    <div
      v-if="fallbackActive"
      class="gsx-fallback"
    >
      <div
        class="gsx-fb-rays"
        aria-hidden="true"
      >
        <span style="--x: 18%; --w: 70px; --o: 0.55" />
        <span style="--x: 34%; --w: 120px; --o: 0.4" />
        <span style="--x: 52%; --w: 60px; --o: 0.35" />
      </div>
      <button
        class="gsx-fb-stage"
        type="button"
        :aria-label="tapToOpenText"
        @click="onFallbackContinue"
      >
        <div
          class="gsx-fb-book"
          aria-hidden="true"
        >
          <div class="gsx-fb-flower">
            <div class="gsx-fb-petals">
              <b
                v-for="i in 20"
                :key="i"
                :style="{ transform: 'rotate(' + (i - 1) * 18 + 'deg)' }"
              />
            </div>
            <div class="gsx-fb-core" />
          </div>
          <div class="gsx-fb-page left">
            <div class="gsx-fb-lines">
              <i /><i /><i />
            </div>
          </div>
          <div class="gsx-fb-page right">
            <div class="gsx-fb-lines">
              <i /><i /><i />
            </div>
          </div>
        </div>
        <div class="gsx-fb-title">
          {{ giftMessageText }}
        </div>
        <div class="gsx-fb-hint">
          {{ tapToOpenText }}
        </div>
      </button>
    </div>

    <!-- Warm entrance veil (fades out on boot, matching the intro handoff) -->
    <div
      class="gsx-veil"
      :class="{ hide: veilHidden }"
      aria-hidden="true"
    >
      <div class="gsx-veil-name">
        苙綺
      </div>
    </div>
  </div>
</template>

<style scoped>
.gsx-root {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #100d0a;
  z-index: 1;
  --gsx-serif: "Noto Serif TC", "Noto Serif KR", Georgia, serif;
}

.gsx-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
}

.gsx-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  background:
    radial-gradient(120% 90% at 34% 22%, rgba(255, 206, 120, 0.1) 0%, rgba(255, 184, 92, 0.05) 24%, rgba(0, 0, 0, 0) 55%),
    radial-gradient(140% 120% at 50% 58%, rgba(0, 0, 0, 0) 42%, rgba(26, 22, 18, 0.45) 82%, rgba(15, 12, 9, 0.72) 100%);
}

.gsx-grain {
  position: absolute;
  inset: -50%;
  width: 200%;
  height: 200%;
  pointer-events: none;
  z-index: 6;
  opacity: 0.05;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: gsxGrain 0.7s steps(4) infinite;
}
@keyframes gsxGrain {
  0% { transform: translate(0, 0); }
  25% { transform: translate(-3%, 2%); }
  50% { transform: translate(2%, -3%); }
  75% { transform: translate(-2%, -1%); }
  100% { transform: translate(1%, 3%); }
}

.gsx-ui {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}
.gsx-ui > * {
  pointer-events: auto;
}

.gsx-gift-message {
  position: absolute;
  left: 50%;
  top: 12%;
  width: min(86%, 520px);
  text-align: center;
  font-family: var(--gsx-serif);
  font-weight: 500;
  font-size: clamp(16px, 4.6vw, 22px);
  line-height: 1.75;
  color: #fff9ed;
  letter-spacing: 0.01em;
  text-shadow: 0 2px 22px rgba(0, 0, 0, 0.55), 0 0 34px rgba(255, 184, 92, 0.18);
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
  transition: opacity 1.4s ease, transform 1.4s ease;
}
.gsx-gift-message.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.gsx-tap-hint {
  position: absolute;
  left: 50%;
  bottom: 13%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  opacity: 0;
  transition: opacity 1s ease;
}
.gsx-tap-hint.show {
  opacity: 1;
}
.gsx-label {
  font-family: var(--gsx-serif);
  font-weight: 400;
  font-size: clamp(14px, 3.9vw, 17px);
  color: #fdeecb;
  letter-spacing: 0.02em;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.6);
}
.gsx-tap-glyph {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 214, 140, 0.7);
  position: relative;
  display: grid;
  place-items: center;
  animation: gsxBob 2.4s ease-in-out infinite;
}
.gsx-tap-glyph::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 214, 140, 0.55);
  animation: gsxRipple 2.4s ease-out infinite;
}
.gsx-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #ffe6b0;
  box-shadow: 0 0 14px rgba(255, 206, 120, 0.9);
}
@keyframes gsxRipple {
  0% { transform: scale(1); opacity: 0.8; }
  70% { transform: scale(1.85); opacity: 0; }
  100% { opacity: 0; }
}
@keyframes gsxBob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}

.gsx-turn-hint {
  position: absolute;
  left: 50%;
  bottom: 9%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 18px;
  font-family: var(--gsx-serif);
  font-weight: 400;
  font-size: clamp(14px, 3.9vw, 17px);
  color: #fdeecb;
  letter-spacing: 0.03em;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.6);
  opacity: 0;
  transition: opacity 1.2s ease;
  text-align: center;
  white-space: nowrap;
}
.gsx-turn-hint.show {
  opacity: 1;
}
.gsx-chev {
  opacity: 0.85;
  animation: gsxChev 2.2s ease-in-out infinite;
}
.gsx-chev.r {
  animation-delay: 1.1s;
}
@keyframes gsxChev {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}

.gsx-skip {
  position: absolute;
  top: calc(env(safe-area-inset-top, 0px) + 14px);
  right: 14px;
  min-height: 44px;
  padding: 10px 18px;
  border-radius: 999px;
  background: rgba(30, 24, 18, 0.42);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 214, 140, 0.28);
  color: #fbe9c4;
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.9s ease, background 0.3s ease, transform 0.3s ease;
}
.gsx-skip.show {
  opacity: 1;
}
.gsx-skip:active {
  transform: scale(0.96);
  background: rgba(45, 36, 26, 0.6);
}
.gsx-skip svg {
  width: 15px;
  height: 15px;
  opacity: 0.9;
}

/* Warm entrance veil */
.gsx-veil {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  background: radial-gradient(120% 100% at 40% 30%, #2a2118 0%, #16110c 70%);
  transition: opacity 1.3s ease;
}
.gsx-veil.hide {
  opacity: 0;
  pointer-events: none;
}
.gsx-veil-name {
  font-family: var(--gsx-serif);
  font-size: 22px;
  color: #e9d3a2;
  letter-spacing: 0.24em;
  opacity: 0.8;
  animation: gsxPulse 2.2s ease-in-out infinite;
}
@keyframes gsxPulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 0.9; }
}

/* CSS fallback */
.gsx-fallback {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  background:
    radial-gradient(120% 80% at 30% 12%, rgba(255, 206, 120, 0.28) 0%, rgba(255, 184, 92, 0.06) 34%, rgba(0, 0, 0, 0) 60%),
    linear-gradient(160deg, #3a2c1c 0%, #241a12 52%, #17110b 100%);
  overflow: hidden;
}
.gsx-fb-rays {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.gsx-fb-rays span {
  position: absolute;
  top: -30%;
  left: var(--x);
  width: var(--w, 90px);
  height: 160%;
  background: linear-gradient(to bottom, rgba(255, 214, 140, 0.22), rgba(255, 184, 92, 0));
  transform: rotate(18deg);
  filter: blur(8px);
  opacity: var(--o, 0.5);
}
.gsx-fb-stage {
  position: relative;
  width: min(88%, 460px);
  text-align: center;
  z-index: 2;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  font: inherit;
  padding: 0;
}
.gsx-fb-book {
  position: relative;
  margin: 0 auto;
  width: min(84vw, 360px);
  height: min(56vw, 240px);
  display: flex;
  filter: drop-shadow(0 26px 40px rgba(0, 0, 0, 0.55));
}
.gsx-fb-page {
  flex: 1;
  background: linear-gradient(155deg, #fffaf0, #f0e2c2);
  border: 1px solid rgba(160, 120, 60, 0.25);
  position: relative;
  overflow: hidden;
}
.gsx-fb-page.left {
  border-right: none;
  border-radius: 8px 0 0 8px;
  transform: perspective(900px) rotateY(9deg);
  transform-origin: right center;
}
.gsx-fb-page.right {
  border-left: 1px solid rgba(120, 90, 50, 0.28);
  border-radius: 0 8px 8px 0;
  transform: perspective(900px) rotateY(-9deg);
  transform-origin: left center;
}
.gsx-fb-lines {
  position: absolute;
  left: 14%;
  right: 14%;
  top: 30%;
  display: flex;
  flex-direction: column;
  gap: 11px;
  opacity: 0.5;
}
.gsx-fb-lines i {
  display: block;
  height: 2px;
  background: rgba(120, 92, 52, 0.4);
  border-radius: 2px;
}
.gsx-fb-lines i:nth-child(2) { width: 82%; }
.gsx-fb-lines i:nth-child(3) { width: 68%; }
.gsx-fb-flower {
  position: absolute;
  left: 50%;
  top: -16%;
  transform: translateX(-50%);
  width: 150px;
  height: 150px;
}
.gsx-fb-petals {
  position: absolute;
  inset: 0;
  animation: gsxFbSpin 44s linear infinite;
}
.gsx-fb-petals b {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 26px;
  height: 60px;
  margin: -60px 0 0 -13px;
  background: linear-gradient(to top, #c99a2e, #f4be3a 55%, #ffd873);
  border-radius: 50% 50% 46% 46% / 64% 64% 36% 36%;
  transform-origin: 50% 100%;
  box-shadow: 0 0 12px rgba(244, 190, 58, 0.4);
}
.gsx-fb-core {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 56px;
  height: 56px;
  margin: -28px 0 0 -28px;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 38%, #5a3f28, #3d2b1f 70%);
  box-shadow: inset 0 0 14px rgba(0, 0, 0, 0.6), 0 0 20px rgba(61, 43, 31, 0.6);
}
@keyframes gsxFbSpin {
  to { transform: rotate(360deg); }
}
.gsx-fb-title {
  margin-top: 34px;
  font-family: var(--gsx-serif);
  font-weight: 700;
  font-size: clamp(18px, 5vw, 26px);
  color: #fff3d8;
  letter-spacing: 0.02em;
  line-height: 1.5;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5), 0 0 28px rgba(255, 184, 92, 0.25);
}
.gsx-fb-hint {
  margin-top: 16px;
  font-family: var(--gsx-serif);
  font-size: 15px;
  color: #e6cfa0;
  letter-spacing: 0.04em;
  opacity: 0.85;
}

@media (prefers-reduced-motion: reduce) {
  .gsx-grain,
  .gsx-tap-glyph,
  .gsx-tap-glyph::before,
  .gsx-chev,
  .gsx-veil-name,
  .gsx-fb-petals {
    animation: none !important;
  }
}
@media (min-width: 760px) {
  .gsx-gift-message { top: 14%; }
  .gsx-tap-hint { bottom: 15%; }
}
</style>
