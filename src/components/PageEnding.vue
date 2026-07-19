<script setup lang="ts">
import type { Locale, LocalizedText } from '@/content/localization'
import { getLocalizedText } from '@/content/localization'
import type { BookPage } from '@/composables/useBookEngine'

defineProps<{
  page: BookPage
  locale: Locale
  isFirstInSection: boolean
}>()

defineEmits<{
  restart: []
}>()

const chapterLabel: LocalizedText = {
  'zh-TW': '向日葵結尾',
  ko: '해바라기 엔딩',
  en: 'Sunflower Ending',
}

const finalMessage: LocalizedText = {
  'zh-TW': '向日葵總是朝著太陽，\n我的心也總是朝著苙綺。\n\n真心祝賀我們的第一個100天。\n愛妳。',
  ko: '해바라기가 언제나 해를 바라보듯,\n내 마음도 언제나 苙綺를 향하고 있어.\n\n우리의 첫 100일을 진심으로 축하해.\n사랑해.',
  en: 'Just as sunflowers always face the sun,\nmy heart always faces you.\n\nHappy 100 days.\nI love you.',
}

const restartLabel: LocalizedText = {
  'zh-TW': '重新閱讀',
  ko: '다시 읽기',
  en: 'Read Again',
}
</script>

<template>
  <div class="page-ending">
    <h2 v-if="isFirstInSection">
      {{ getLocalizedText(chapterLabel, locale) }}
    </h2>

    <div class="sunflower-bloom" />

    <p
      class="ending-message"
      style="white-space: pre-line;"
    >
      {{ getLocalizedText(finalMessage, locale) }}
    </p>

    <button
      class="ending-restart-btn"
      @click="$emit('restart')"
    >
      {{ getLocalizedText(restartLabel, locale) }}
    </button>
  </div>
</template>
