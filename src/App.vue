<script setup lang="ts">
import { ref, computed, nextTick, defineAsyncComponent } from 'vue'
import { type Locale } from '@/content/localization'

import DiaryReader from '@/components/DiaryReader.vue'

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
  // Read again: return to the gift scene. The DiaryReader unmounts here and
  // remounts fresh (its book engine resets to page 0) when reading resumes.
  // Selected language is preserved (we never touch `locale`).
  readingRevealed.value = false
  showGiftScene.value = false
  phase.value = 'giftscene'
  // Remount fresh on the next tick so the scene replays from the box.
  nextTick(() => {
    showGiftScene.value = true
  })
}
</script>

<template>
  <div
    class="app-shell"
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

    <!-- Phase 2: Reading Mode — the cute two-character page-flip diary -->
    <div
      v-if="phase === 'reading'"
      class="reading-container reading-crossfade"
      :class="{ 'is-revealed': readingRevealed }"
    >
      <DiaryReader
        :locale="locale"
        @restart="restart"
      />
    </div>
  </div>
</template>
