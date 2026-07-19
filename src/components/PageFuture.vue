<script setup lang="ts">
import type { Locale, LocalizedText } from '@/content/localization'
import { getLocalizedText } from '@/content/localization'
import type { BookPage } from '@/composables/useBookEngine'
import type { FutureWish } from '@/content/futurePlans'

const props = defineProps<{
  page: BookPage
  locale: Locale
  isFirstInSection: boolean
}>()

const chapterLabel: LocalizedText = {
  'zh-TW': '想一起創造的未來',
  ko: '함께하고 싶은 미래',
  en: 'Our Future Together',
}

const wishes = props.page.data as FutureWish[]
</script>

<template>
  <div class="page-wishes">
    <h2 v-if="isFirstInSection">
      {{ getLocalizedText(chapterLabel, locale) }}
    </h2>

    <ul class="wishes-list">
      <li
        v-for="wish in wishes"
        :key="wish.id"
        class="wish-item"
      >
        <span style="font-size: 16px; color: var(--sunflower);">☐</span>
        <span>{{ getLocalizedText(wish.text, locale) }}</span>
      </li>
    </ul>
  </div>
</template>
