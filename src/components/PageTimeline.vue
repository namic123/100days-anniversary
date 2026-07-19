<script setup lang="ts">
import type { Locale, LocalizedText } from '@/content/localization'
import { getLocalizedText } from '@/content/localization'
import type { BookPage } from '@/composables/useBookEngine'
import type { TimelineItem } from '@/content/timeline'

const props = defineProps<{
  page: BookPage
  locale: Locale
  isFirstInSection: boolean
}>()

const chapterLabel: LocalizedText = {
  'zh-TW': '我們的故事',
  ko: '우리의 이야기',
  en: 'Our Story',
}

const item = props.page.data as TimelineItem

// Format date as YYYY.MM.DD
function formatDate(dateStr: string): string {
  return dateStr.replace(/-/g, '.')
}
</script>

<template>
  <div class="page-timeline">
    <h2 v-if="isFirstInSection">
      {{ getLocalizedText(chapterLabel, locale) }}
    </h2>

    <div class="timeline-entry">
      <div class="timeline-date">
        {{ formatDate(item.date) }}
      </div>
      <h3 class="timeline-event">
        {{ getLocalizedText(item.title, locale) }}
      </h3>
      <p>{{ getLocalizedText(item.description, locale) }}</p>
    </div>
  </div>
</template>
