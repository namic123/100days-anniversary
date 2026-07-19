<script setup lang="ts">
import type { Locale, LocalizedText } from '@/content/localization'
import { getLocalizedText } from '@/content/localization'
import type { BookPage } from '@/composables/useBookEngine'

defineProps<{
  page: BookPage
  locale: Locale
  isFirstInSection: boolean
}>()

const chapterLabel: LocalizedText = {
  'zh-TW': '韓國與台灣',
  ko: '한국과 대만',
  en: 'Korea and Taiwan',
}

const mapText: LocalizedText = {
  'zh-TW': '我們之間有大海和長長的距離，但每天分享彼此生活的心，總是緊緊相連。',
  ko: '우리 사이에는 바다와 긴 거리가 있지만, 매일 서로의 하루를 나누는 마음만큼은 언제나 가까이 이어져 있어.',
  en: 'There is an ocean and a long distance between us, but the heart that shares each day is always closely connected.',
}

const koreaLabel: LocalizedText = {
  'zh-TW': '韓國',
  ko: '한국',
  en: 'Korea',
}

const taiwanLabel: LocalizedText = {
  'zh-TW': '台灣',
  ko: '대만',
  en: 'Taiwan',
}
</script>

<template>
  <div class="page-map">
    <h2 v-if="isFirstInSection">
      {{ getLocalizedText(chapterLabel, locale) }}
    </h2>

    <div
      v-if="page.id === 'korea-taiwan-1'"
      style="margin: 40px 0;"
    >
      <div style="display: flex; align-items: center; justify-content: space-between; max-width: 280px; margin: 0 auto;">
        <div style="text-align: center;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: var(--rose); margin: 0 auto 8px;" />
          <div style="font-size: 13px; color: var(--ink); font-weight: 500;">
            {{ getLocalizedText(koreaLabel, locale) }}
          </div>
        </div>

        <div style="flex: 1; height: 2px; background: linear-gradient(90deg, var(--rose) 0%, var(--sunflower) 100%); margin: 0 16px; position: relative;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 18px;">
            ←→
          </div>
        </div>

        <div style="text-align: center;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: var(--sunflower); margin: 0 auto 8px;" />
          <div style="font-size: 13px; color: var(--ink); font-weight: 500;">
            {{ getLocalizedText(taiwanLabel, locale) }}
          </div>
        </div>
      </div>
    </div>

    <p
      v-if="page.id === 'korea-taiwan-2'"
      style="line-height: 2; font-size: 15px; color: var(--ink); text-align: center;"
    >
      {{ getLocalizedText(mapText, locale) }}
    </p>
  </div>
</template>
