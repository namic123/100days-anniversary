<script setup lang="ts">
import type { Locale, LocalizedText } from '@/content/localization'
import { getLocalizedText } from '@/content/localization'
import type { BookPage } from '@/composables/useBookEngine'
import { anniversary } from '@/content/anniversary'

defineProps<{
  page: BookPage
  locale: Locale
  isFirstInSection: boolean
}>()

const chapterLabel: LocalizedText = {
  'zh-TW': '我們的第一個100天',
  ko: '우리의 첫 100일',
  en: 'Our First 100 Days',
}

const subtext: LocalizedText = {
  'zh-TW': '在兩個不同的國家，用同一份心走過的第一個100天',
  ko: '서로 다른 두 나라에서 같은 마음으로 함께한 첫 100일',
  en: 'Our first 100 days together, with one heart across two countries',
}

// Format dates as YYYY.MM.DD
function formatDate(dateStr: string): string {
  return dateStr.replace(/-/g, '.')
}
</script>

<template>
  <div class="page-intro">
    <h2 v-if="isFirstInSection">
      {{ getLocalizedText(chapterLabel, locale) }}
    </h2>

    <p>{{ getLocalizedText(subtext, locale) }}</p>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-number">100</span>
        <span class="stat-label">DAYS</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">2</span>
        <span class="stat-label">COUNTRIES</span>
      </div>
    </div>

    <p style="margin-top: 20px; font-size: 14px;">
      {{ formatDate(anniversary.startDate) }} → {{ formatDate(anniversary.hundredthDay) }}
    </p>
  </div>
</template>
