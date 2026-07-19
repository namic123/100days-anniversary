<script setup lang="ts">
import type { Locale, LocalizedText } from '@/content/localization'
import { getLocalizedText } from '@/content/localization'
import type { BookPage } from '@/composables/useBookEngine'

const props = defineProps<{
  page: BookPage
  locale: Locale
  isFirstInSection: boolean
}>()

const chapterLabel: LocalizedText = {
  'zh-TW': '最後一封信',
  ko: '마지막 편지',
  en: 'Final Letter',
}

const content = props.page.content as LocalizedText
</script>

<template>
  <div class="page-letter">
    <h2 v-if="isFirstInSection">
      {{ getLocalizedText(chapterLabel, locale) }}
    </h2>

    <div class="letter-body">
      <p
        v-for="(paragraph, index) in getLocalizedText(content, locale).split('\n\n')"
        :key="index"
      >
        {{ paragraph }}
      </p>
    </div>
  </div>
</template>
