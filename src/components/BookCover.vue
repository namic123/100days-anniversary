<script setup lang="ts">
import { ref } from 'vue'
import { getLocalizedText, type Locale } from '@/content/localization'
import { uiText } from '@/content/ui'

const props = defineProps<{ locale: Locale }>()
const emit = defineEmits<{ opened: [] }>()

const isFlipping = ref(false)

function openBook() {
  if (isFlipping.value) return
  isFlipping.value = true
  setTimeout(() => emit('opened'), 1000)
}
</script>

<template>
  <div class="book-container visible">
    <div
      class="book-cover"
      role="button"
      tabindex="0"
      :aria-label="getLocalizedText(uiText.bookTitle, props.locale)"
      :class="{ 'is-flipping': isFlipping }"
      @click="openBook"
      @keydown.enter="openBook"
      @keydown.space.prevent="openBook"
    >
      <h1 class="book-title">
        {{ getLocalizedText(uiText.bookTitle, props.locale) }}
      </h1>
      <div
        class="pressed-flower"
        aria-hidden="true"
      >
        <div
          v-for="i in 5"
          :key="i"
          class="petal"
        />
        <div class="flower-center" />
        <div class="flower-leaf flower-leaf-left" />
        <div class="flower-leaf flower-leaf-right" />
      </div>
    </div>
  </div>
</template>
