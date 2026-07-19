<script setup lang="ts">
import { computed, ref } from 'vue'

import { anniversary } from '@/content/anniversary'
import { timeline } from '@/content/timeline'
import { getLocalizedText, type Locale } from '@/content/localization'

const locale = ref<Locale>('zh-TW')
const opened = ref(false)

const languageOptions: Array<{ value: Locale; label: string }> = [
  { value: 'zh-TW', label: '繁中' },
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'EN' },
]

const heroTitle = computed(() =>
  getLocalizedText(
    {
      'zh-TW': '寫給苙綺的100天紀錄',
      ko: '苙綺에게 보내는 100일의 기록',
      en: 'A 100-day record for 苙綺',
    },
    locale.value,
  ),
)
</script>

<template>
  <main class="site-shell">
    <section
      class="hero-section"
      aria-labelledby="hero-title"
    >
      <div
        class="language-switcher"
        aria-label="Language"
      >
        <button
          v-for="option in languageOptions"
          :key="option.value"
          type="button"
          :aria-pressed="locale === option.value"
          @click="locale = option.value"
        >
          {{ option.label }}
        </button>
      </div>

      <button
        class="envelope"
        type="button"
        :class="{ 'is-open': opened }"
        aria-label="Open anniversary letter"
        @click="opened = !opened"
      >
        <span
          class="letter-paper"
          aria-hidden="true"
        />
        <span class="recipient">苙綺</span>
      </button>

      <p class="eyebrow">
        100 Days Scrapbook
      </p>
      <h1 id="hero-title">
        {{ heroTitle }}
      </h1>
      <p class="lead">
        {{
          getLocalizedText(
            {
              'zh-TW': '這是正式製作前的最小佔位版本，用來確認部署、語言與版面基礎。',
              ko: '정식 제작 전 배포, 언어, 레이아웃 기반을 확인하기 위한 최소 placeholder 버전입니다.',
              en: 'This is a minimal placeholder used to verify deployment, language, and layout foundations.',
            },
            locale,
          )
        }}
      </p>
    </section>

    <section
      class="paper-section"
      aria-labelledby="stats-title"
    >
      <p class="eyebrow">
        {{ anniversary.startDate }} - {{ anniversary.hundredthDay }}
      </p>
      <h2 id="stats-title">
        {{
          getLocalizedText(
            {
              'zh-TW': '我們的第一個100天',
              ko: '우리의 첫 100일',
              en: 'Our first 100 days',
            },
            locale,
          )
        }}
      </h2>
      <div
        class="stats-grid"
        aria-label="Anniversary facts"
      >
        <article>
          <strong>100</strong>
          <span>{{ getLocalizedText({ 'zh-TW': '一起走過的日子', ko: '함께한 날', en: 'days together' }, locale) }}</span>
        </article>
        <article>
          <strong>3</strong>
          <span>{{ getLocalizedText({ 'zh-TW': '支援語言', ko: '지원 언어', en: 'languages' }, locale) }}</span>
        </article>
      </div>
    </section>

    <section
      class="paper-section"
      aria-labelledby="timeline-title"
    >
      <p class="eyebrow">
        Timeline
      </p>
      <h2 id="timeline-title">
        {{
          getLocalizedText(
            {
              'zh-TW': '故事開始的方式',
              ko: '우리 이야기가 시작된 방식',
              en: 'How our story began',
            },
            locale,
          )
        }}
      </h2>
      <ol class="timeline-list">
        <li
          v-for="item in timeline"
          :key="item.id"
        >
          <time :datetime="item.date">{{ item.date }}</time>
          <h3>{{ getLocalizedText(item.title, locale) }}</h3>
          <p>{{ getLocalizedText(item.description, locale) }}</p>
        </li>
      </ol>
    </section>
  </main>
</template>
