<script setup lang="ts">
import { ref } from 'vue'
import { getLocalizedText, type Locale } from '@/content/localization'
import { uiText } from '@/content/ui'

const props = defineProps<{ locale: Locale; isUnboxing?: boolean }>()
const emit = defineEmits<{ opened: []; interact: [] }>()

const isFlipping = ref(false)

function openBook() {
  emit('interact')
  if (isFlipping.value) return
  isFlipping.value = true
  // Emit early so App can show the first page behind the fading cover
  setTimeout(() => emit('opened'), 100)
}
</script>

<template>
  <div
    class="book-container"
    :class="{ 'is-unboxing': props.isUnboxing }"
  >
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
