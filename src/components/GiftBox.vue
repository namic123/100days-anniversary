<script setup lang="ts">
import { ref } from 'vue'
import { getLocalizedText, type Locale } from '@/content/localization'
import { uiText } from '@/content/ui'

const props = defineProps<{ locale: Locale }>()
const emit = defineEmits<{ opened: [] }>()

const isOpening = ref(false)

function openBox() {
  if (isOpening.value) return
  isOpening.value = true
  setTimeout(() => emit('opened'), 1800)
}
</script>

<template>
  <div class="gift-scene">
    <div
      class="gift-box"
      role="button"
      tabindex="0"
      :aria-label="getLocalizedText(uiText.tapToOpen, props.locale)"
      @click="openBox"
      @keydown.enter="openBox"
      @keydown.space.prevent="openBox"
    >
      <div
        class="box-lid"
        :class="{ 'is-open': isOpening }"
      />
      <div class="box-body" />
      <div class="box-ribbon" />
      <div class="name-tag">
        {{ getLocalizedText(uiText.nameTag, props.locale) }}
      </div>
      <div
        class="sunflower-decoration"
        aria-hidden="true"
      >
        <div
          v-for="i in 8"
          :key="i"
          class="sunflower-petal"
        />
        <div class="sunflower-center" />
      </div>
    </div>
    <p
      v-if="!isOpening"
      class="tap-hint"
    >
      {{ getLocalizedText(uiText.tapToOpen, props.locale) }}
    </p>
  </div>
</template>
