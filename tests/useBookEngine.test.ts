import { describe, expect, it } from 'vitest'

import { useBookEngine } from '@/composables/useBookEngine'

describe('useBookEngine', () => {
  it('builds a page array with correct section order', () => {
    const { pages } = useBookEngine()
    expect(pages.value.length).toBeGreaterThanOrEqual(12)
    expect(pages.value[0].section).toBe('intro')
    expect(pages.value[1].section).toBe('timeline')
    expect(pages.value[pages.value.length - 1].section).toBe('ending')
  })

  it('starts at page index 0', () => {
    const { currentIndex } = useBookEngine()
    expect(currentIndex.value).toBe(0)
  })

  it('computes progress as 1-indexed fraction', () => {
    const { progress, totalPages } = useBookEngine()
    expect(progress.value).toBe(`1 / ${totalPages.value}`)
  })

  it('only includes enabled memories', () => {
    const { pages } = useBookEngine()
    const memoryPages = pages.value.filter(p => p.section === 'memory')
    // All memories start disabled, so 0 memory pages
    expect(memoryPages).toHaveLength(0)
  })

  it('flipForward increments index', () => {
    const engine = useBookEngine()
    expect(engine.canGoForward.value).toBe(true)
    engine.flipForward()
    expect(engine.currentIndex.value).toBe(1)
  })

  it('flipBack decrements index', () => {
    const engine = useBookEngine()
    engine.flipForward()
    engine.flipForward()
    engine.flipBack()
    expect(engine.currentIndex.value).toBe(1)
  })

  it('cannot go back from first page', () => {
    const { canGoBack } = useBookEngine()
    expect(canGoBack.value).toBe(false)
  })

  it('resetBook returns to page 0', () => {
    const engine = useBookEngine()
    engine.flipForward()
    engine.flipForward()
    engine.resetBook()
    expect(engine.currentIndex.value).toBe(0)
  })

  // Chapter/TOC support tests
  it('computes chapters with correct start pages', () => {
    const { chapters } = useBookEngine()
    expect(chapters.value.length).toBe(7)
    expect(chapters.value[0].id).toBe('intro')
    expect(chapters.value[0].startPage).toBe(0)
    expect(chapters.value[1].id).toBe('story')
    expect(chapters.value[1].startPage).toBe(1) // after intro
  })

  it('currentChapter reflects currentIndex', () => {
    const engine = useBookEngine()
    expect(engine.currentChapter.value.id).toBe('intro')
    engine.flipForward()
    expect(engine.currentChapter.value.id).toBe('story')
  })

  it('jumpToChapter sets currentIndex to chapter start', () => {
    const engine = useBookEngine()
    engine.jumpToChapter('letter')
    const letterChapter = engine.chapters.value.find(c => c.id === 'letter')!
    expect(engine.currentIndex.value).toBe(letterChapter.startPage)
  })
})
