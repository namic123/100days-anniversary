<script setup lang="ts">
import type { Locale, LocalizedText } from '@/content/localization'
import { getLocalizedText } from '@/content/localization'
import type { BookPage } from '@/composables/useBookEngine'
import type { MemoryItem } from '@/content/memories'

const props = defineProps<{
  page: BookPage
  locale: Locale
  isFirstInSection: boolean
}>()

const chapterLabel: LocalizedText = {
  'zh-TW': '我們的回憶',
  ko: '우리의 추억',
  en: 'Our Memories',
}

const item = props.page.data as MemoryItem
</script>

<template>
  <div class="page-memory">
    <h2 v-if="isFirstInSection">
      {{ getLocalizedText(chapterLabel, locale) }}
    </h2>

    <div class="memory-photo" />
    <h3>{{ getLocalizedText(item.title, locale) }}</h3>
    <p class="memory-caption">
      {{ getLocalizedText(item.description, locale) }}
    </p>
  </div>
</template>
