<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'
import { getLocalizedText, type Locale } from '@/content/localization'
import { uiText } from '@/content/ui'

const props = defineProps<{ locale: Locale }>()
const emit = defineEmits<{ completed: [] }>()

const containerRef = ref<HTMLDivElement>()
const canvas2dRef = ref<HTMLCanvasElement>()
const showInstruction = ref(true)
const instructionPulse = ref(false)

// ---- lifecycle guards ----
let disposed = false
let completedEmitted = false
const timeouts: number[] = []

function later(fn: () => void, ms: number) {
  timeouts.push(window.setTimeout(() => {
    if (!disposed) fn()
  }, ms))
}

function finish() {
  if (completedEmitted) return
  completedEmitted = true
  emit('completed')
}

function skip() {
  finish()
}

// =========================================
// ACT 1 — Three.js sunflower growth
// =========================================
type FlowerRefs = {
  petals: THREE.Mesh[]
  center: THREE.Mesh | null
  group: THREE.Group | null
}

const A1 = {
  scene: null as THREE.Scene | null,
  camera: null as THREE.PerspectiveCamera | null,
  renderer: null as THREE.WebGLRenderer | null,
  seed: null as THREE.Mesh | null,
  seedGlow: null as THREE.Mesh | null,
  seedHitArea: null as THREE.Mesh | null,
  stem: null as THREE.Group | null,
  leaves: [] as THREE.Mesh[],
  flower: { petals: [], center: null, group: null } as FlowerRefs,
  pointLight: null as THREE.PointLight | null,
  burstParticles: [] as THREE.Mesh[],
  started: false,
  cameraTargetY: -3,
  cameraCurrentY: 0,
  active: true,
}

const SEED_Y = -3
const STEM_HEIGHT = 6
const FLOWER_Y = SEED_Y + STEM_HEIGHT

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number) {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function animateValue(
  from: number,
  to: number,
  duration: number,
  onUpdate: (v: number) => void,
  onComplete?: () => void,
) {
  const startTime = Date.now()
  function update() {
    if (disposed) return
    const progress = Math.min((Date.now() - startTime) / duration, 1)
    onUpdate(from + (to - from) * easeOutCubic(progress))
    if (progress < 1) requestAnimationFrame(update)
    else onComplete?.()
  }
  update()
}

function initAct1(): boolean {
  const container = containerRef.value
  if (!container) return false

  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true })
  } catch {
    // WebGL unavailable — skip the intro gracefully
    return false
  }

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1410)

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(0, 0, 5)
  camera.lookAt(0, SEED_Y, 0)

  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x1a1410)
  container.appendChild(renderer.domElement)

  scene.add(new THREE.AmbientLight(0xffe8c8, 0.4))
  const directional = new THREE.DirectionalLight(0xfff5e0, 0.8)
  directional.position.set(5, 10, 5)
  scene.add(directional)
  const pointLight = new THREE.PointLight(0xdbb84e, 0.5, 10)
  pointLight.position.set(0, SEED_Y, 0)
  scene.add(pointLight)

  // Seed
  const seed = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.7, metalness: 0.1 }),
  )
  seed.position.y = SEED_Y
  scene.add(seed)

  // Large invisible hit area for forgiving touch
  const seedHitArea = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 16, 16),
    new THREE.MeshBasicMaterial({ visible: false }),
  )
  seedHitArea.position.copy(seed.position)
  scene.add(seedHitArea)

  // Glow ring
  const seedGlow = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.225, 32),
    new THREE.MeshBasicMaterial({ color: 0xdbb84e, transparent: true, opacity: 0, side: THREE.DoubleSide }),
  )
  seedGlow.position.copy(seed.position)
  seedGlow.rotation.x = Math.PI / 2
  scene.add(seedGlow)

  A1.scene = scene
  A1.camera = camera
  A1.renderer = renderer
  A1.seed = seed
  A1.seedGlow = seedGlow
  A1.seedHitArea = seedHitArea
  A1.pointLight = pointLight
  A1.cameraTargetY = SEED_Y

  // Interaction
  const canvas = renderer.domElement
  const onPointer = (e: TouchEvent | MouseEvent) => {
    if (A1.started || disposed) return
    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    const rect = canvas.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, camera)
    if (raycaster.intersectObject(seedHitArea).length > 0) {
      activateSeed()
    }
  }
  canvas.addEventListener('touchstart', onPointer, { passive: true })
  canvas.addEventListener('click', onPointer)

  window.addEventListener('resize', onResizeAct1)

  // Idle helpers: pulse at 5s, auto-start at 10s
  later(() => {
    if (!A1.started) {
      instructionPulse.value = true
      animateValue(0, 0.3, 1000, (v) => {
        if (A1.seedGlow && !A1.started) {
          ;(A1.seedGlow.material as THREE.MeshBasicMaterial).opacity = v
        }
      })
    }
  }, 5000)
  later(() => {
    if (!A1.started) activateSeed()
  }, 10000)

  renderLoopAct1()
  return true
}

function onResizeAct1() {
  if (!A1.active || !A1.camera || !A1.renderer) return
  A1.camera.aspect = window.innerWidth / window.innerHeight
  A1.camera.updateProjectionMatrix()
  A1.renderer.setSize(window.innerWidth, window.innerHeight)
}

function renderLoopAct1() {
  if (disposed || !A1.active) return
  requestAnimationFrame(renderLoopAct1)
  const { seed, camera, renderer, scene } = A1
  if (!camera || !renderer || !scene) return

  if (seed && !A1.started) {
    const t = Date.now() * 0.002
    seed.scale.setScalar(1 + ((Math.sin(t) + 1) / 2) * 0.05)
  }

  A1.cameraCurrentY = THREE.MathUtils.lerp(A1.cameraCurrentY, A1.cameraTargetY, 0.02)
  camera.position.y = A1.cameraCurrentY
  camera.lookAt(0, A1.cameraCurrentY, 0)
  renderer.render(scene, camera)
}

function activateSeed() {
  if (A1.started || disposed) return
  A1.started = true
  showInstruction.value = false

  const glowMat = A1.seedGlow!.material as THREE.MeshBasicMaterial
  animateValue(0, 0.8, 500, (v) => {
    glowMat.opacity = v
    A1.seedGlow!.scale.setScalar(1 + v * 2)
  }, () => {
    animateValue(0.8, 0, 800, (v) => {
      glowMat.opacity = v
    })
  })

  later(() => {
    createStem()
    createLeaves()
    growStem()
  }, 600)
}

function createStem() {
  const scene = A1.scene!
  const group = new THREE.Group()
  const segments = 20
  const segH = STEM_HEIGHT / segments
  for (let i = 0; i < segments; i++) {
    const t = i / segments
    const color = new THREE.Color(0x5a7a3a).lerp(new THREE.Color(0x6a8a4a), t)
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, segH, 8),
      new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.1 }),
    )
    seg.position.set(Math.sin(i * 0.3) * 0.5 * t, SEED_Y + i * segH + segH / 2, 0)
    seg.scale.y = 0
    group.add(seg)
  }
  A1.stem = group
  scene.add(group)
}

function growStem() {
  const startTime = Date.now()
  const duration = 3000
  function update() {
    if (disposed) return
    const progress = Math.min((Date.now() - startTime) / duration, 1)

    A1.stem!.children.forEach((seg, i) => {
      const segStart = i / A1.stem!.children.length
      const segEnd = (i + 1) / A1.stem!.children.length
      if (progress >= segStart) {
        const p = Math.min((progress - segStart) / (segEnd - segStart), 1)
        ;(seg as THREE.Mesh).scale.y = easeOutCubic(p)
      }
    })

    const stemTipY = SEED_Y + STEM_HEIGHT * progress
    A1.cameraTargetY = stemTipY
    A1.pointLight!.position.y = stemTipY

    A1.leaves.forEach((leaf) => {
      if (stemTipY >= leaf.userData.height && !leaf.userData.unfurled) {
        unfurlLeaf(leaf)
      }
    })

    if (progress < 1) requestAnimationFrame(update)
    else later(() => startBloom(), 500)
  }
  update()
}

function createLeaves() {
  const scene = A1.scene!
  const positions = [
    SEED_Y + STEM_HEIGHT * 0.25,
    SEED_Y + STEM_HEIGHT * 0.5,
    SEED_Y + STEM_HEIGHT * 0.7,
  ]
  positions.forEach((yPos, i) => {
    const isLeft = i % 2 === 0
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.quadraticCurveTo(0.4, 0.12, 0.8, 0)
    shape.quadraticCurveTo(0.56, -0.08, 0, 0)
    const leaf = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshStandardMaterial({ color: 0x6a8a4a, side: THREE.DoubleSide, roughness: 0.7 }),
    )
    leaf.position.set((isLeft ? -1 : 1) * 0.3, yPos, 0)
    leaf.userData.height = yPos
    leaf.userData.unfurled = false
    leaf.scale.setScalar(0.1)
    leaf.rotation.z = isLeft ? Math.PI / 2 : -Math.PI / 2
    scene.add(leaf)
    A1.leaves.push(leaf)
  })
}

function unfurlLeaf(leaf: THREE.Mesh) {
  leaf.userData.unfurled = true
  const isLeft = leaf.position.x < 0
  const targetRot = isLeft ? -Math.PI / 6 : Math.PI / 6
  const fromRot = leaf.rotation.z
  animateValue(0, 1, 500, (v) => {
    const s = 0.1 + 0.9 * v
    leaf.scale.setScalar(s)
    leaf.rotation.z = fromRot + (targetRot - fromRot) * v
  })
}

function startBloom() {
  createFlower()
  bloomFlower()
}

function createFlower() {
  const scene = A1.scene!
  const group = new THREE.Group()
  group.position.y = FLOWER_Y
  // Flower faces the camera (+Z) so it is fully visible from the front

  const centerRadius = 0.5
  const center = new THREE.Mesh(
    new THREE.CircleGeometry(centerRadius, 32),
    new THREE.MeshStandardMaterial({
      color: 0x3a2a15, roughness: 0.9,
      emissive: 0x3a2a15, emissiveIntensity: 0.15,
    }),
  )
  center.position.z = 0.06
  group.add(center)
  A1.flower.center = center

  const rim = new THREE.Mesh(
    new THREE.CircleGeometry(centerRadius * 0.68, 32),
    new THREE.MeshStandardMaterial({
      color: 0x5a3a20, roughness: 0.85,
      emissive: 0x5a3a20, emissiveIntensity: 0.15,
    }),
  )
  rim.position.z = 0.07
  group.add(rim)

  // Seed dots in golden-angle spiral
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  const dotMat = new THREE.MeshBasicMaterial({ color: 0x8a6a3a })
  for (let i = 0; i < 40; i++) {
    const theta = i * goldenAngle
    const r = Math.sqrt(i / 40) * centerRadius * 0.6
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.02, 6), dotMat)
    dot.position.set(Math.cos(theta) * r, Math.sin(theta) * r, 0.08)
    group.add(dot)
  }

  // Elongated pointed petal along +Y, base at origin
  const petalLen = 0.9
  const petalShape = new THREE.Shape()
  petalShape.moveTo(0, 0)
  petalShape.quadraticCurveTo(0.16, petalLen * 0.4, 0, petalLen)
  petalShape.quadraticCurveTo(-0.16, petalLen * 0.4, 0, 0)
  const petalGeo = new THREE.ShapeGeometry(petalShape)
  const petalColors = [0xdbb84e, 0xe8c960, 0xd4a843]

  const addPetalRing = (count: number, layer: number, radius: number, targetScale: number, angleOffset: number, z: number) => {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + angleOffset
      const color = petalColors[(i + layer) % petalColors.length]
      const petal = new THREE.Mesh(
        petalGeo,
        new THREE.MeshStandardMaterial({
          color, side: THREE.DoubleSide, roughness: 0.6,
          emissive: color, emissiveIntensity: 0.3,
        }),
      )
      petal.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, z)
      petal.rotation.z = angle - Math.PI / 2
      petal.scale.set(0.01, 0.01, 1)
      petal.userData.layer = layer
      petal.userData.index = i
      petal.userData.targetScale = targetScale
      group.add(petal)
      A1.flower.petals.push(petal)
    }
  }
  addPetalRing(14, 0, 0.4, 1, 0, 0.02)
  addPetalRing(12, 1, 0.375, 0.78, Math.PI / 12, 0.04)

  scene.add(group)
  A1.flower.group = group

  // Light the flower face from the front
  A1.pointLight!.position.set(0, FLOWER_Y, 2)
  A1.pointLight!.intensity = 1.2
}

function bloomFlower() {
  const startTime = Date.now()
  const duration = 3500
  function update() {
    if (disposed) return
    const progress = Math.min((Date.now() - startTime) / duration, 1)
    A1.flower.petals.forEach((petal) => {
      const layerStart = (petal.userData.layer as number) * 0.35
      const petalStart = layerStart + (petal.userData.index as number) * 0.03
      const petalEnd = petalStart + 0.35
      if (progress >= petalStart) {
        const p = Math.min((progress - petalStart) / (petalEnd - petalStart), 1)
        const scale = easeOutBack(p) * (petal.userData.targetScale as number)
        petal.scale.set(scale, scale, 1)
      }
    })
    if (progress < 1) requestAnimationFrame(update)
    else later(() => burstFlower(), 1000)
  }
  update()
}

function burstFlower() {
  const scene = A1.scene!

  // Shared geometry per size and material per color — all burst particles
  // fade in lockstep, so they can share GPU resources
  const geoBySize = new Map<number, THREE.SphereGeometry>()
  const matByColor = new Map<number, THREE.MeshBasicMaterial>()
  const getGeo = (size: number) => {
    let g = geoBySize.get(size)
    if (!g) {
      g = new THREE.SphereGeometry(size, 6, 6)
      geoBySize.set(size, g)
    }
    return g
  }
  const getMat = (color: number) => {
    let m = matByColor.get(color)
    if (!m) {
      m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
      matByColor.set(color, m)
    }
    return m
  }

  const spawnBurst = (position: THREE.Vector3, color: number, count: number, size: number) => {
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(getGeo(size), getMat(color))
      p.position.copy(position)
      p.position.x += (Math.random() - 0.5) * 0.2
      p.position.z += (Math.random() - 0.5) * 0.2
      const angle = Math.random() * Math.PI * 2
      const elev = (Math.random() - 0.5) * Math.PI * 0.6
      const speed = 0.03 + Math.random() * 0.06
      p.userData.vel = new THREE.Vector3(
        Math.cos(angle) * Math.cos(elev) * speed,
        Math.sin(elev) * speed * 0.5 + 0.02,
        Math.sin(angle) * Math.cos(elev) * speed,
      )
      scene.add(p)
      A1.burstParticles.push(p)
    }
  }

  const wp = new THREE.Vector3()
  A1.flower.petals.forEach((petal) => {
    petal.getWorldPosition(wp)
    spawnBurst(wp, 0xdbb84e, 8, 0.04)
  })
  if (A1.flower.center) {
    A1.flower.center.getWorldPosition(wp)
    spawnBurst(wp, 0x8a6a3a, 25, 0.03)
  }
  A1.stem!.children.forEach((seg) => {
    seg.getWorldPosition(wp)
    spawnBurst(wp, 0x5a7a3a, 3, 0.03)
  })
  A1.leaves.forEach((leaf) => {
    leaf.getWorldPosition(wp)
    spawnBurst(wp, 0x6a8a4a, 6, 0.03)
  })

  A1.flower.group!.visible = false
  A1.stem!.visible = false
  A1.leaves.forEach((l) => { l.visible = false })
  A1.seed!.visible = false
  A1.seedGlow!.visible = false

  const startTime = Date.now()
  function updateBurst() {
    if (disposed) return
    const progress = Math.min((Date.now() - startTime) / 1200, 1)
    const opacity = 1 - easeOutCubic(progress)
    matByColor.forEach((m) => { m.opacity = opacity })
    A1.burstParticles.forEach((p) => {
      p.position.add(p.userData.vel as THREE.Vector3)
      ;(p.userData.vel as THREE.Vector3).multiplyScalar(0.97)
    })
    if (progress < 1) requestAnimationFrame(updateBurst)
    else transitionToAct2()
  }
  updateBurst()
}

function disposeAct1() {
  A1.active = false
  window.removeEventListener('resize', onResizeAct1)
  if (A1.scene) {
    A1.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(material)) material.forEach((m) => m.dispose())
      else material?.dispose()
    })
  }
  A1.renderer?.dispose()
}

function transitionToAct2() {
  const container = containerRef.value
  if (container) container.style.opacity = '0'
  const canvas2d = canvas2dRef.value
  if (canvas2d) canvas2d.style.opacity = '1'

  document.fonts.ready.then(() => {
    if (!disposed) initAct2()
  })

  later(() => {
    disposeAct1()
    if (container) container.style.display = 'none'
  }, 1000)
}

// =========================================
// ACT 2 — Canvas 2D particle text morphing
// =========================================
const A2_COLORS = [
  { hex: '#dbb84e', weight: 0.5 },
  { hex: '#e8c960', weight: 0.25 },
  { hex: '#f5e6c8', weight: 0.15 },
  { hex: '#c9a030', weight: 0.1 },
]
const ROSE_GOLD = '#e8a070'
const DARK_CENTER = '#8a6a3a'
const PARTICLE_COUNT = 750

const PHASES: Array<{ name: string; duration: number }> = [
  { name: 'scatter', duration: 1500 },
  { name: 'jay', duration: 2000 },
  { name: 'heart', duration: 1800 },
  { name: 'lichi', duration: 2200 },
  { name: 'anniversary', duration: 2200 },
  { name: 'combined', duration: 2800 },
  { name: 'sunflower', duration: 1800 },
  { name: 'gather', duration: 1200 },
  { name: 'transition', duration: 1000 },
]

type Target = { x: number; y: number; isDark?: boolean }

class Particle2D {
  x: number
  y: number
  targetX: number
  targetY: number
  vx = 0
  vy = 0
  size = 1.8 + Math.random() * 2.6
  opacity = 0.4 + Math.random() * 0.6
  lerpSpeed = 0.03 + (Math.random() - 0.5) * 0.015
  color: string
  originalColor: string

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.targetX = x
    this.targetY = y
    const rand = Math.random()
    let cum = 0
    let hex = A2_COLORS[0].hex
    for (const c of A2_COLORS) {
      cum += c.weight
      if (rand <= cum) {
        hex = c.hex
        break
      }
    }
    this.color = hex
    this.originalColor = hex
  }

  setTarget(x: number, y: number) {
    this.targetX = x
    this.targetY = y
  }

  update() {
    this.vx += (this.targetX - this.x) * this.lerpSpeed
    this.vy += (this.targetY - this.y) * this.lerpSpeed
    this.vx *= 0.85
    this.vy *= 0.85
    this.x += this.vx
    this.y += this.vy
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Pre-rendered glow sprite instead of a per-frame radial gradient
    ctx.globalAlpha = this.opacity
    const d = this.size * 2
    ctx.drawImage(getGlowSprite(this.color), this.x - this.size, this.y - this.size, d, d)
  }
}

// One cached glow sprite per color — drawing 750 gradients per frame is the
// single most expensive part of the particle render loop
const spriteCache = new Map<string, HTMLCanvasElement>()

function getGlowSprite(color: string): HTMLCanvasElement {
  let sprite = spriteCache.get(color)
  if (!sprite) {
    const R = 16
    sprite = document.createElement('canvas')
    sprite.width = R * 2
    sprite.height = R * 2
    const c = sprite.getContext('2d')!
    const gradient = c.createRadialGradient(R, R, 0, R, R, R)
    gradient.addColorStop(0, hexToRGBA(color, 1))
    gradient.addColorStop(0.5, hexToRGBA(color, 0.4))
    gradient.addColorStop(1, hexToRGBA(color, 0))
    c.fillStyle = gradient
    c.fillRect(0, 0, R * 2, R * 2)
    spriteCache.set(color, sprite)
  }
  return sprite
}

function hexToRGBA(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const A2 = {
  ctx: null as CanvasRenderingContext2D | null,
  particles: [] as Particle2D[],
  phaseIndex: 0,
  phaseStart: 0,
  running: false,
  w: 0,
  h: 0,
}

function sampleTextPixels(text: string, fontSize: number, fontFamily: string, offsetY = 0): Target[] {
  const off = document.createElement('canvas')
  off.width = A2.w
  off.height = A2.h
  const c = off.getContext('2d')
  if (!c) return []
  c.font = `bold ${fontSize}px ${fontFamily}`
  c.fillStyle = 'white'
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText(text, A2.w / 2, A2.h / 2 + offsetY)

  const data = c.getImageData(0, 0, A2.w, A2.h).data
  const points: Target[] = []
  const step = 2
  for (let y = 0; y < A2.h; y += step) {
    for (let x = 0; x < A2.w; x += step) {
      if (data[(y * A2.w + x) * 4 + 3] > 128) {
        points.push({ x, y })
      }
    }
  }
  return points
}

function generateHeartTargets(): Target[] {
  const points: Target[] = []
  const cx = A2.w / 2
  const cy = A2.h / 2
  const scale = Math.min(A2.w, A2.h) * 0.035
  for (let t = 0; t < Math.PI * 2; t += 0.015) {
    const x = 16 * Math.pow(Math.sin(t), 3)
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    points.push({ x: cx + x * scale, y: cy - y * scale })
  }
  for (let i = 0; i < 250; i++) {
    const t = Math.random() * Math.PI * 2
    const r = Math.random() * 0.8
    const x = 16 * Math.pow(Math.sin(t), 3) * r
    const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * r
    points.push({ x: cx + x * scale, y: cy - y * scale })
  }
  return points
}

function generateCombinedTargets(): Target[] {
  const gap = A2.h * 0.06
  const line1 = sampleTextPixels('Jay ♥ 苙綺', Math.min(60, A2.w * 0.14), "'Noto Serif TC', serif", -gap)
  const line2 = sampleTextPixels('100天紀念日', Math.min(55, A2.w * 0.13), "'Noto Serif TC', serif", gap)
  return [...line1, ...line2]
}

function generateSunflowerTargets(): Target[] {
  const points: Target[] = []
  const cx = A2.w / 2
  const cy = A2.h / 2
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < 50; i++) {
    const theta = i * goldenAngle
    const r = Math.sqrt(i) * 4
    points.push({ x: cx + Math.cos(theta) * r, y: cy + Math.sin(theta) * r, isDark: true })
  }
  const petalR = Math.min(A2.w, A2.h) * 0.12
  for (let p = 0; p < 12; p++) {
    const angle = (p / 12) * Math.PI * 2
    const pcx = cx + Math.cos(angle) * petalR
    const pcy = cy + Math.sin(angle) * petalR
    for (let i = 0; i < 18; i++) {
      const t = Math.random()
      const spread = petalR * 0.35 * Math.sin(t * Math.PI)
      const along = (Math.random() - 0.5) * spread
      points.push({
        x: pcx + Math.cos(angle) * t * petalR * 0.5 + Math.cos(angle + Math.PI / 2) * along,
        y: pcy + Math.sin(angle) * t * petalR * 0.5 + Math.sin(angle + Math.PI / 2) * along,
      })
    }
  }
  return points
}

function generateGatherTargets(): Target[] {
  const points: Target[] = []
  const cx = A2.w / 2
  const cy = A2.h / 2
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 * 3
    const dist = (i / PARTICLE_COUNT) * 50
    points.push({ x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist })
  }
  return points
}

function assignTargets(targets: Target[]) {
  // Evenly downsample so the whole shape is covered, not just the first rows
  let pts = targets
  if (targets.length > A2.particles.length) {
    pts = []
    const ratio = targets.length / A2.particles.length
    for (let i = 0; i < A2.particles.length; i++) {
      pts.push(targets[Math.floor(i * ratio)])
    }
  }
  A2.particles.forEach((p, i) => {
    if (i < pts.length) {
      p.setTarget(pts[i].x, pts[i].y)
      p.color = pts[i].isDark ? DARK_CENTER : p.originalColor
    } else {
      const ref = pts[Math.floor(Math.random() * pts.length)]
      p.setTarget(ref.x + (Math.random() - 0.5) * 12, ref.y + (Math.random() - 0.5) * 12)
      p.color = p.originalColor
    }
  })
}

function applyPhaseTargets(phase: string) {
  switch (phase) {
    case 'jay':
      assignTargets(sampleTextPixels('Jay', Math.min(120, A2.w * 0.28), "'Noto Serif TC', serif"))
      break
    case 'heart':
      assignTargets(generateHeartTargets())
      A2.particles.forEach((p) => {
        if (Math.random() < 0.3) p.color = ROSE_GOLD
      })
      break
    case 'lichi':
      A2.particles.forEach((p) => { p.color = p.originalColor })
      assignTargets(sampleTextPixels('苙綺', Math.min(120, A2.w * 0.28), "'Noto Serif TC', serif"))
      break
    case 'anniversary':
      assignTargets(sampleTextPixels('100天紀念日', Math.min(80, A2.w * 0.19), "'Noto Serif TC', serif"))
      break
    case 'combined':
      assignTargets(generateCombinedTargets())
      break
    case 'sunflower':
      A2.particles.forEach((p) => { p.color = p.originalColor })
      assignTargets(generateSunflowerTargets())
      break
    case 'gather':
      A2.particles.forEach((p) => { p.color = p.originalColor })
      assignTargets(generateGatherTargets())
      break
  }
}

function advancePhase() {
  A2.phaseIndex++
  A2.phaseStart = Date.now()
  const phase = PHASES[A2.phaseIndex]
  if (!phase) {
    finish()
    return
  }
  applyPhaseTargets(phase.name)
}

function onResizeAct2() {
  if (!A2.running) return
  const canvas = canvas2dRef.value
  if (!canvas || !A2.ctx) return
  const dpr = Math.min(window.devicePixelRatio, 2)
  A2.w = window.innerWidth
  A2.h = window.innerHeight
  canvas.width = A2.w * dpr
  canvas.height = A2.h * dpr
  A2.ctx.scale(dpr, dpr)
  // Recompute targets so shapes stay centered (mobile address bar resize)
  applyPhaseTargets(PHASES[A2.phaseIndex]?.name ?? '')
}

function initAct2() {
  const canvas = canvas2dRef.value
  if (!canvas) {
    finish()
    return
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    finish()
    return
  }
  const dpr = Math.min(window.devicePixelRatio, 2)
  A2.w = window.innerWidth
  A2.h = window.innerHeight
  canvas.width = A2.w * dpr
  canvas.height = A2.h * dpr
  ctx.scale(dpr, dpr)
  A2.ctx = ctx

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    A2.particles.push(new Particle2D(Math.random() * A2.w, Math.random() * A2.h))
  }

  A2.phaseIndex = 0
  A2.phaseStart = Date.now()
  A2.running = true
  window.addEventListener('resize', onResizeAct2)
  renderLoopAct2()
}

function renderLoopAct2() {
  if (disposed || !A2.running || !A2.ctx) return
  const ctx = A2.ctx

  // Trail effect (higher alpha = crisper text)
  ctx.fillStyle = 'rgba(26, 22, 18, 0.22)'
  ctx.fillRect(0, 0, A2.w, A2.h)

  const phase = PHASES[A2.phaseIndex]
  if (phase && Date.now() - A2.phaseStart > phase.duration) {
    advancePhase()
  }

  const current = PHASES[A2.phaseIndex]?.name
  if (current === 'gather' || current === 'transition') {
    const cx = A2.w / 2
    const cy = A2.h / 2
    const glowR = current === 'transition' ? 140 : 90
    const glowA = current === 'transition' ? 0.5 : 0.25
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR)
    glow.addColorStop(0, `rgba(219,184,78,${glowA})`)
    glow.addColorStop(0.5, `rgba(232,201,96,${glowA * 0.5})`)
    glow.addColorStop(1, 'rgba(219,184,78,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, A2.w, A2.h)
  }

  // Final fade to the gift scene's ivory background for a seamless handoff
  if (current === 'transition') {
    const progress = Math.min((Date.now() - A2.phaseStart) / 1000, 1)
    ctx.fillStyle = `rgba(255, 249, 237, ${easeOutCubic(progress)})`
    ctx.fillRect(0, 0, A2.w, A2.h)
  }

  A2.particles.forEach((p) => {
    p.update()
    p.draw(ctx)
  })
  ctx.globalAlpha = 1

  requestAnimationFrame(renderLoopAct2)
}

// =========================================
// Lifecycle
// =========================================
onMounted(() => {
  // Reduced motion or WebGL failure: skip the intro entirely
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finish()
    return
  }
  if (!initAct1()) {
    finish()
  }
})

onBeforeUnmount(() => {
  disposed = true
  A2.running = false
  timeouts.forEach(clearTimeout)
  window.removeEventListener('resize', onResizeAct2)
  disposeAct1()
})
</script>

<template>
  <div class="pre-intro">
    <div
      ref="containerRef"
      class="pi-canvas-container"
    />
    <canvas
      ref="canvas2dRef"
      class="pi-canvas-2d"
    />
    <div
      class="pi-vignette"
      aria-hidden="true"
    />
    <button
      type="button"
      class="pi-skip"
      :aria-label="getLocalizedText(uiText.skipIntro, props.locale)"
      @click="skip"
    >
      {{ getLocalizedText(uiText.skipIntro, props.locale) }}
    </button>
    <div
      v-if="showInstruction"
      class="pi-instruction"
      :class="{ 'is-pulsing': instructionPulse }"
    >
      {{ getLocalizedText(uiText.touchSeed, props.locale) }}
    </div>
  </div>
</template>
