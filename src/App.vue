<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { type Locale } from '@/content/localization'
import { getLocalizedText } from '@/content/localization'
import { useBookEngine } from '@/composables/useBookEngine'

import GiftBox from '@/components/GiftBox.vue'
import BookCover from '@/components/BookCover.vue'
import BookPageRenderer from '@/components/BookPageRenderer.vue'

const locale = ref<Locale>('zh-TW')
const phase = ref<'gift' | 'book' | 'reading'>('gift')

const engine = useBookEngine()

// Background music
const bgMusic = ref<HTMLAudioElement | null>(null)
const isMuted = ref(false)

function startMusicOnce() {
  if (bgMusic.value) return
  const audio = new Audio(import.meta.env.BASE_URL + 'background-music.mp3')
  audio.loop = true
  audio.volume = 0.3
  bgMusic.value = audio
  audio.play().catch(() => {
    bgMusic.value = null
  })
}

function toggleMute() {
  if (!bgMusic.value) {
    startMusicOnce()
    return
  }
  isMuted.value = !isMuted.value
  bgMusic.value.muted = isMuted.value
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

function onGiftOpened() {
  phase.value = 'book'
}

function onBookOpened() {
  phase.value = 'reading'
}

function restart() {
  engine.resetBook()
  phase.value = 'gift'
  // Preserve locale - do NOT reset
}

// Progress display with chapter awareness
const progressText = computed(() => {
  const chapterLabel = getLocalizedText(engine.currentChapter.value.label, locale.value)
  const currentPage = engine.currentIndex.value + 1
  const total = engine.totalPages.value
  return `${chapterLabel} · ${currentPage} / ${total}`
})

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

  // ESC key closes TOC
  if (e.key === 'Escape' && tocOpen.value) {
    closeToc()
    return
  }

  if (isNavigationLocked.value) return

  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') flipForward()
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') flipBack()
}

// Page flip with transition management and timeout
async function flipForward() {
  if (!engine.canGoForward.value || isNavigationLocked.value) return

  engine.isFlipping.value = true
  engine.flipForward()

  await waitForTransitionOrTimeout()
  engine.isFlipping.value = false
}

async function flipBack() {
  if (!engine.canGoBack.value || isNavigationLocked.value) return

  engine.isFlipping.value = true
  engine.flipBack()

  await waitForTransitionOrTimeout()
  engine.isFlipping.value = false
}

async function waitForTransitionOrTimeout() {
  return new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      resolve()
    }, 900)

    const currentPageIndex = engine.currentIndex.value
    const pageElement = pageRefs.value[currentPageIndex]

    if (pageElement) {
      const onTransitionEnd = () => {
        clearTimeout(timeout)
        pageElement.removeEventListener('transitionend', onTransitionEnd)
        resolve()
      }
      pageElement.addEventListener('transitionend', onTransitionEnd)
    } else {
      // If no page element, just wait for timeout
      setTimeout(() => resolve(), 600)
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
  // Restore focus to bookmark button
  nextTick(() => {
    tocBtnRef.value?.focus()
  })
}

async function jumpToChapter(chapterId: string) {
  if (isJumping.value || engine.isFlipping.value) return

  isJumping.value = true
  tocOpen.value = false

  // Add .jumping class to all pages (disables CSS transitions)
  for (const pageEl of pageRefs.value) {
    pageEl?.classList.add('jumping')
  }

  // Fade out reader
  if (readerRef.value) {
    readerRef.value.style.opacity = '0'
  }

  // Wait for fade out
  await new Promise(resolve => setTimeout(resolve, 250))

  // Jump to chapter
  engine.jumpToChapter(chapterId)

  // Wait for state to settle
  await nextTick()

  // Remove .jumping class
  for (const pageEl of pageRefs.value) {
    pageEl?.classList.remove('jumping')
  }

  // Fade in reader
  if (readerRef.value) {
    readerRef.value.style.opacity = '1'
  }

  // Wait for fade in to complete
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
    @click="localeMenuOpen = false"
    @click.capture="startMusicOnce"
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
          v-for="(page, index) in engine.pages.value"
          :key="page.id"
          ref="pageRefs"
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
