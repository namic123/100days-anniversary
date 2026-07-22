<script setup lang="ts">
import { ref, computed, nextTick, defineAsyncComponent } from 'vue'
import { type Locale } from '@/content/localization'
import { getLocalizedText } from '@/content/localization'
import { useBookEngine } from '@/composables/useBookEngine'

import BookPageRenderer from '@/components/BookPageRenderer.vue'

const locale = ref<Locale>('zh-TW')
const phase = ref<'preintro' | 'giftscene' | 'reading'>('preintro')
// Controls mounting of the WebGL gift scene independently of `phase` so it can
// stay mounted (rendering) during the crossfade into reading mode.
const showGiftScene = ref(false)
// Drives the reading-mode opacity crossfade over the gift scene.
const readingRevealed = ref(false)

// Code-split: keeps the canvas intro out of the main bundle; if the chunk
// fails to load, fall through to the gift scene directly
const PreIntro = defineAsyncComponent({
  loader: () => import('@/components/PreIntro.vue'),
  onError(_error, _retry, fail) {
    onPreIntroCompleted()
    fail()
  },
})

// Code-split: keeps three.js out of the main bundle. If the chunk fails to
// load, fall straight through to reading mode so the app never dead-ends.
const GiftScene = defineAsyncComponent({
  loader: () => import('@/components/GiftScene.vue'),
  onError(_error, _retry, fail) {
    onGiftOpened()
    fail()
  },
})

const engine = useBookEngine()

// Background music — preload once, play on first user gesture
const bgMusic = new Audio(import.meta.env.BASE_URL + 'background-music.mp3')
bgMusic.loop = true
bgMusic.volume = 0.3
bgMusic.preload = 'auto'

const isMuted = ref(false)
const musicPlaying = ref(false)
let musicStarting = false

function startMusicOnce() {
  if (musicPlaying.value || musicStarting) return
  musicStarting = true
  bgMusic.play().then(() => {
    musicPlaying.value = true
  }).catch(() => {
    // Will retry on next user gesture
  }).finally(() => {
    musicStarting = false
  })
}

function toggleMute() {
  if (!musicPlaying.value) {
    startMusicOnce()
    return
  }
  isMuted.value = !isMuted.value
  bgMusic.muted = isMuted.value
}

const languageOptions: Array<{ value: Locale; label: string }> = [
  { value: 'zh-TW', label: '繁中' },
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'EN' },
]

// Locale menu state
const localeMenuOpen = ref(false)
const currentLocaleLabel = computed(() => {
  return languageOptions.find(o => o.value === locale.value)?.label ?? 'EN'
})

function toggleLocaleMenu() {
  localeMenuOpen.value = !localeMenuOpen.value
}

function selectLocale(value: Locale) {
  locale.value = value
  localeMenuOpen.value = false
}

// TOC state
const tocOpen = ref(false)
const isJumping = ref(false)
const tocBtnRef = ref<HTMLButtonElement>()
const readerRef = ref<HTMLDivElement>()
const pageRefs = ref<HTMLDivElement[]>([])

const tocHeading = {
  'zh-TW': '目錄',
  ko: '목차',
  en: 'Contents',
}

function onPreIntroCompleted() {
  // Hand off to the WebGL gift scene, which fades in from its own warm veil to
  // continue the intro's warm-glow handoff.
  phase.value = 'giftscene'
  showGiftScene.value = true
}

async function onGiftOpened() {
  // The 3D book has finished opening — crossfade reading mode in over the
  // still-rendering gift scene, then unmount the scene (triggers its teardown).
  if (phase.value === 'reading') return
  phase.value = 'reading'
  readingRevealed.value = false
  await nextTick()

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      readingRevealed.value = true
    })
  })

  // After the opacity crossfade completes, unmount the gift scene.
  setTimeout(() => {
    showGiftScene.value = false
  }, 1100)
}

function restart() {
  // Read again: reset the book and return to the gift scene. Selected language
  // is preserved (we never touch `locale`).
  engine.resetBook()
  readingRevealed.value = false
  showGiftScene.value = false
  phase.value = 'giftscene'
  // Remount fresh on the next tick so the scene replays from the box.
  nextTick(() => {
    showGiftScene.value = true
  })
}

// Progress display with chapter awareness
const progressText = computed(() => {
  const chapterLabel = getLocalizedText(engine.currentChapter.value.label, locale.value)
  const currentPage = engine.currentIndex.value + 1
  const total = engine.totalPages.value
  return `${chapterLabel} · ${currentPage} / ${total}`
})

// Page virtualization — render only nearby pages to reduce GPU layers
const VISIBLE_RANGE = 2

const visiblePages = computed(() => {
  const current = engine.currentIndex.value
  const all = engine.pages.value
  const start = Math.max(0, current - VISIBLE_RANGE)
  const end = Math.min(all.length - 1, current + VISIBLE_RANGE)
  return all.slice(start, end + 1).map((page, i) => ({ page, index: start + i }))
})

function getPageElement(pageIndex: number): HTMLDivElement | undefined {
  return pageRefs.value.find(el => el?.dataset.pageIndex === String(pageIndex))
}

// Navigation lock
const isNavigationLocked = computed(() => {
  return tocOpen.value || isJumping.value || engine.isFlipping.value
})

// Swipe handling for reading mode
let touchStartX = 0
function onTouchStart(e: TouchEvent) {
  if (isNavigationLocked.value) return
  touchStartX = e.touches[0].clientX
}

function onTouchEnd(e: TouchEvent) {
  if (isNavigationLocked.value) return
  const diff = touchStartX - e.changedTouches[0].clientX
  if (Math.abs(diff) > 50) {
    if (diff > 0) flipForward()
    else flipBack()
  }
}

// Tap zone handling
function onTapLeft() {
  if (isNavigationLocked.value) return
  flipBack()
}

function onTapRight() {
  if (isNavigationLocked.value) return
  flipForward()
}

// Keyboard nav
function onKeydown(e: KeyboardEvent) {
  if (phase.value !== 'reading') return

  if (e.key === 'Escape' && tocOpen.value) {
    closeToc()
    return
  }

  if (isNavigationLocked.value) return

  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') flipForward()
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') flipBack()
}

// Page flip — listen on the correct (transitioning) page element
async function flipForward() {
  if (!engine.canGoForward.value || isNavigationLocked.value) return

  const flippingIndex = engine.currentIndex.value
  engine.isFlipping.value = true
  engine.flipForward()

  await waitForTransitionOrTimeout(flippingIndex)
  engine.isFlipping.value = false
}

async function flipBack() {
  if (!engine.canGoBack.value || isNavigationLocked.value) return

  engine.isFlipping.value = true
  engine.flipBack()
  const revealedIndex = engine.currentIndex.value

  await waitForTransitionOrTimeout(revealedIndex)
  engine.isFlipping.value = false
}

async function waitForTransitionOrTimeout(pageIndex: number) {
  return new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 900)
    const pageElement = getPageElement(pageIndex)

    if (pageElement) {
      const onEnd = (e: TransitionEvent) => {
        if (e.target !== pageElement) return
        clearTimeout(timeout)
        pageElement.removeEventListener('transitionend', onEnd)
        resolve()
      }
      pageElement.addEventListener('transitionend', onEnd)
    }
  })
}

// TOC functions
function toggleToc() {
  if (tocOpen.value) {
    closeToc()
  } else {
    tocOpen.value = true
  }
}

function closeToc() {
  tocOpen.value = false
  nextTick(() => {
    tocBtnRef.value?.focus()
  })
}

async function jumpToChapter(chapterId: string) {
  if (isJumping.value || engine.isFlipping.value) return

  isJumping.value = true
  tocOpen.value = false

  if (readerRef.value) {
    readerRef.value.style.opacity = '0'
  }

  await new Promise(resolve => setTimeout(resolve, 250))

  engine.jumpToChapter(chapterId)
  await nextTick()

  if (readerRef.value) {
    readerRef.value.style.opacity = '1'
  }

  await new Promise(resolve => setTimeout(resolve, 250))

  isJumping.value = false
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
    @click="localeMenuOpen = false; startMusicOnce()"
  >
    <!-- Bottom-right FAB stack -->
    <div
      class="fab-stack"
      @click.stop
    >
      <button
        type="button"
        class="fab-btn music-fab"
        :class="{ 'is-muted': isMuted }"
        :aria-label="isMuted ? 'Unmute' : 'Mute'"
        @click="toggleMute"
      >
        ♪
      </button>
      <button
        type="button"
        class="fab-btn locale-fab"
        aria-label="Language"
        @click="toggleLocaleMenu"
      >
        {{ currentLocaleLabel }}
      </button>
      <div
        v-if="localeMenuOpen"
        class="locale-menu"
      >
        <button
          v-for="option in languageOptions"
          :key="option.value"
          type="button"
          class="locale-menu-item"
          :aria-pressed="locale === option.value"
          @click="selectLocale(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- Phase 0: Pre-intro (sunflower growth + particle morphing) -->
    <PreIntro
      v-if="phase === 'preintro'"
      :locale="locale"
      @completed="onPreIntroCompleted"
    />

    <!-- Phase 1: WebGL gift scene (box → open → diary rises → cover → open) -->
    <GiftScene
      v-if="showGiftScene"
      :locale="locale"
      @opened="onGiftOpened"
    />

    <!-- Phase 2: Reading Mode (crossfades in over the opened 3D book) -->
    <div
      v-if="phase === 'reading'"
      class="reading-container reading-crossfade"
      :class="{ 'is-revealed': readingRevealed }"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <!-- TOC bookmark button -->
      <button
        ref="tocBtnRef"
        class="toc-bookmark-btn"
        :aria-label="getLocalizedText(tocHeading, locale)"
        @click="toggleToc"
      >
        ☰
      </button>

      <div
        ref="readerRef"
        class="book-reader"
        style="transition: opacity 0.25s ease"
      >
        <div
          v-for="{ page, index } in visiblePages"
          :key="page.id"
          ref="pageRefs"
          class="book-page"
          :data-page-index="index"
          :class="{
            flipped: index < engine.currentIndex.value,
            jumping: isJumping,
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
        {{ progressText }}
      </div>

      <!-- TOC Overlay -->
      <div
        v-if="tocOpen"
        class="toc-overlay"
        role="dialog"
        aria-modal="true"
        @click.self="closeToc"
      >
        <div class="toc-card">
          <button
            type="button"
            class="toc-close-btn"
            @click="closeToc"
          >
            ×
          </button>
          <h2>{{ getLocalizedText(tocHeading, locale) }}</h2>
          <ul class="toc-chapter-list">
            <li
              v-for="ch in engine.chapters.value"
              :key="ch.id"
              class="toc-chapter-item"
              :aria-current="ch.id === engine.currentChapter.value.id ? 'true' : undefined"
              @click="jumpToChapter(ch.id)"
            >
              {{ getLocalizedText(ch.label, locale) }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
