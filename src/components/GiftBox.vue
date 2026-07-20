<script setup lang="ts">
import { ref } from 'vue'
import { getLocalizedText, type Locale } from '@/content/localization'
import { uiText } from '@/content/ui'

const props = defineProps<{ locale: Locale; isUnboxing?: boolean }>()
const emit = defineEmits<{ opened: [] }>()

const isOpening = ref(false)

function openBox() {
  if (isOpening.value) return
  isOpening.value = true
  setTimeout(() => emit('opened'), 800)
}
</script>

<template>
  <div
    class="gift-scene"
    :class="{ 'is-unboxing': isUnboxing }"
  >
    <!-- Sunlight glow -->
    <div
      class="gs-sunlight"
      aria-hidden="true"
    />

    <!-- Leaf shadows -->
    <div
      class="gs-leaf-shadow gs-leaf-tl"
      aria-hidden="true"
    />
    <div
      class="gs-leaf-shadow gs-leaf-br"
      aria-hidden="true"
    />

    <!-- Sunflower decorations -->
    <div
      class="gs-sunflower gs-sf-large"
      aria-hidden="true"
    >
      <div
        v-for="i in 12"
        :key="'lg-' + i"
        class="gs-sf-petal"
      />
      <div class="gs-sf-center" />
    </div>
    <div
      class="gs-sunflower gs-sf-medium"
      aria-hidden="true"
    >
      <div
        v-for="i in 10"
        :key="'md-' + i"
        class="gs-sf-petal"
      />
      <div class="gs-sf-center" />
    </div>
    <div
      class="gs-sunflower gs-sf-small"
      aria-hidden="true"
    >
      <div
        v-for="i in 8"
        :key="'sm-' + i"
        class="gs-sf-petal"
      />
      <div class="gs-sf-center" />
    </div>

    <!-- Loose petals on ground -->
    <div
      class="gs-loose-petal gs-lp-1"
      aria-hidden="true"
    />
    <div
      class="gs-loose-petal gs-lp-2"
      aria-hidden="true"
    />

    <!-- Falling petals -->
    <div
      v-for="i in 12"
      :key="'fp-' + i"
      class="gs-falling"
      :class="'gs-fp-' + i"
      aria-hidden="true"
    >
      <div class="gs-fall-petal" />
    </div>

    <!-- Message text — appears first -->
    <p class="gs-message">
      {{ getLocalizedText(uiText.giftMessage, props.locale) }}
    </p>

    <!-- Gift group: envelope + box + stamp -->
    <div class="gs-gift-group">
      <!-- Envelope behind box -->
      <div
        class="gs-envelope"
        aria-hidden="true"
      >
        <div class="gs-envelope-body">
          <div class="gs-envelope-flap" />
          <div class="gs-envelope-text">
            To. 苙綺<br>From. Jay
          </div>
        </div>
      </div>

      <!-- Gift box -->
      <div
        class="gift-box"
        role="button"
        tabindex="0"
        :aria-label="getLocalizedText(uiText.tapToOpen, props.locale)"
        @click="openBox"
        @keydown.enter="openBox"
        @keydown.space.prevent="openBox"
      >
        <div
          class="box-lid"
          :class="{ 'is-open': isOpening }"
        >
          <div class="gs-ribbon-lid-v" />
        </div>
        <div class="box-body">
          <div class="gs-ribbon-v" />
          <div class="gs-ribbon-h" />
          <div class="gs-ribbon-shimmer" />
          <div class="name-tag">
            {{ getLocalizedText(uiText.nameTag, props.locale) }}
          </div>
          <div class="gs-box-flower" />
        </div>
        <div class="gs-bow">
          <div class="gs-bow-loop gs-bow-loop-l" />
          <div class="gs-bow-loop gs-bow-loop-r" />
          <div class="gs-bow-knot" />
          <div class="gs-bow-tail gs-bow-tail-l" />
          <div class="gs-bow-tail gs-bow-tail-r" />
        </div>
      </div>

      <!-- Date stamp -->
      <div
        class="gs-date-stamp"
        aria-hidden="true"
      >
        <div class="gs-stamp-title">
          Our First 100 Days
        </div>
        <div class="gs-stamp-dates">
          2026.04.28 — 2026.08.05
        </div>
      </div>
    </div>

    <!-- Tap hint -->
    <div
      v-if="!isOpening"
      class="gs-tap-hint"
    >
      <span class="gs-tap-label">
        {{ getLocalizedText(uiText.tapToOpen, props.locale) }}
      </span>
    </div>
  </div>
</template>
