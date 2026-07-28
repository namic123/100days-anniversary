<script setup lang="ts">
import type { Locale } from '@/content/localization'
import type { BookPage } from '@/composables/useBookEngine'

import PageIntro from './PageIntro.vue'
import PageTimeline from './PageTimeline.vue'
import PageMemory from './PageMemory.vue'
import PageMap from './PageMap.vue'
import PageFuture from './PageFuture.vue'
import PageLetter from './PageLetter.vue'
import PageEnding from './PageEnding.vue'

defineProps<{
  page: BookPage
  locale: Locale
  isFirstInSection: boolean
}>()

defineEmits<{ restart: [] }>()

const componentMap = {
  intro: PageIntro,
  timeline: PageTimeline,
  'timeline-media': PageTimeline,
  memory: PageMemory,
  'korea-taiwan': PageMap,
  future: PageFuture,
  letter: PageLetter,
  ending: PageEnding,
} as const
</script>

<template>
  <component
    :is="componentMap[page.section]"
    :page="page"
    :locale="locale"
    :is-first-in-section="isFirstInSection"
    @restart="$emit('restart')"
  />
</template>
