import { computed, ref } from 'vue'

import { letterPages } from '@/content/letter'
import type { LocalizedText } from '@/content/localization'
import { memories } from '@/content/memories'
import { futureWishes } from '@/content/futurePlans'
import { timeline } from '@/content/timeline'

export interface BookPage {
  id: string
  section: 'intro' | 'timeline' | 'memory' | 'korea-taiwan' | 'future' | 'letter' | 'ending'
  content?: LocalizedText
  data?: unknown
}

export interface Chapter {
  id: string
  label: LocalizedText
  startPage: number
}

function buildPageArray(): BookPage[] {
  const pages: BookPage[] = []

  pages.push({
    id: 'intro',
    section: 'intro',
  })

  for (const item of timeline) {
    pages.push({
      id: `timeline-${item.id}`,
      section: 'timeline',
      data: item,
    })
  }

  for (const item of memories.filter(m => m.enabled)) {
    pages.push({
      id: `memory-${item.id}`,
      section: 'memory',
      data: item,
    })
  }

  pages.push({ id: 'korea-taiwan-1', section: 'korea-taiwan' })
  pages.push({ id: 'korea-taiwan-2', section: 'korea-taiwan' })

  const wishesPerPage = Math.ceil(futureWishes.length / 2)
  pages.push({
    id: 'future-1',
    section: 'future',
    data: futureWishes.slice(0, wishesPerPage),
  })
  pages.push({
    id: 'future-2',
    section: 'future',
    data: futureWishes.slice(wishesPerPage),
  })

  for (const lp of letterPages) {
    pages.push({
      id: lp.id,
      section: 'letter',
      content: lp.content,
    })
  }

  pages.push({ id: 'ending', section: 'ending' })

  return pages
}

export function useBookEngine() {
  const pages = computed(() => buildPageArray())
  const currentIndex = ref(0)
  const isFlipping = ref(false)

  const totalPages = computed(() => pages.value.length)
  const canGoForward = computed(() => currentIndex.value < totalPages.value - 1)
  const canGoBack = computed(() => currentIndex.value > 0)
  const progress = computed(() => `${currentIndex.value + 1} / ${totalPages.value}`)

  // Chapter support
  const chapters = computed<Chapter[]>(() => {
    const chapterDefs: Array<{
      id: string
      label: LocalizedText
      section: BookPage['section'] | BookPage['section'][]
    }> = [
      {
        id: 'intro',
        label: {
          'zh-TW': '我們的第一個100天',
          ko: '우리의 첫 100일',
          en: 'Our First 100 Days',
        },
        section: 'intro',
      },
      {
        id: 'story',
        label: {
          'zh-TW': '我們的故事',
          ko: '우리의 이야기',
          en: 'Our Story',
        },
        section: 'timeline',
      },
      {
        id: 'memories',
        label: {
          'zh-TW': '我們的回憶',
          ko: '우리의 추억',
          en: 'Our Memories',
        },
        section: 'memory',
      },
      {
        id: 'korea-taiwan',
        label: {
          'zh-TW': '韓國與台灣',
          ko: '한국과 대만',
          en: 'Korea and Taiwan',
        },
        section: 'korea-taiwan',
      },
      {
        id: 'future',
        label: {
          'zh-TW': '想一起創造的未來',
          ko: '함께하고 싶은 미래',
          en: 'Our Future Together',
        },
        section: 'future',
      },
      {
        id: 'letter',
        label: {
          'zh-TW': '最後一封信',
          ko: '마지막 편지',
          en: 'Final Letter',
        },
        section: 'letter',
      },
      {
        id: 'ending',
        label: {
          'zh-TW': '向日葵結尾',
          ko: '해바라기 엔딩',
          en: 'Sunflower Ending',
        },
        section: 'ending',
      },
    ]

    const result: Chapter[] = []

    for (let i = 0; i < chapterDefs.length; i++) {
      const def = chapterDefs[i]
      const sections = Array.isArray(def.section) ? def.section : [def.section]
      let startPage = pages.value.findIndex(p => sections.includes(p.section))

      // If section not found (e.g., no enabled memories),
      // find the next available section's start page
      if (startPage === -1) {
        // Look for the next chapter's section in the page array
        for (let j = i + 1; j < chapterDefs.length; j++) {
          const nextSections = Array.isArray(chapterDefs[j].section)
            ? chapterDefs[j].section
            : [chapterDefs[j].section]
          const nextPage = pages.value.findIndex(p => nextSections.includes(p.section))
          if (nextPage !== -1) {
            startPage = nextPage
            break
          }
        }
      }

      result.push({
        id: def.id,
        label: def.label,
        startPage: startPage !== -1 ? startPage : pages.value.length - 1,
      })
    }

    return result
  })

  const currentChapter = computed<Chapter>(() => {
    const idx = currentIndex.value
    // Find the chapter whose startPage is <= currentIndex
    for (let i = chapters.value.length - 1; i >= 0; i--) {
      if (chapters.value[i].startPage <= idx) {
        return chapters.value[i]
      }
    }
    return chapters.value[0]
  })

  function flipForward() {
    if (!canGoForward.value || isFlipping.value) return
    currentIndex.value++
  }

  function flipBack() {
    if (!canGoBack.value || isFlipping.value) return
    currentIndex.value--
  }

  function goToPage(index: number) {
    if (index >= 0 && index < totalPages.value) {
      currentIndex.value = index
    }
  }

  function jumpToChapter(chapterId: string) {
    const chapter = chapters.value.find(c => c.id === chapterId)
    if (chapter) {
      currentIndex.value = chapter.startPage
    }
  }

  function resetBook() {
    currentIndex.value = 0
    isFlipping.value = false
  }

  return {
    pages,
    currentIndex,
    totalPages,
    progress,
    isFlipping,
    canGoForward,
    canGoBack,
    flipForward,
    flipBack,
    goToPage,
    resetBook,
    chapters,
    currentChapter,
    jumpToChapter,
  }
}
