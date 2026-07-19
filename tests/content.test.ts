import { describe, expect, it } from 'vitest'

import { features } from '@/content/features'
import { letterPages } from '@/content/letter'
import { memories } from '@/content/memories'
import { futureWishes } from '@/content/futurePlans'
import { uiText } from '@/content/ui'

describe('features', () => {
  it('has all deferred features set to false', () => {
    expect(features.reasonsSection).toBe(false)
    expect(features.situationalMessages).toBe(false)
    expect(features.backgroundMusic).toBe(false)
    expect(features.voiceLetter).toBe(false)
  })
})

describe('letterPages', () => {
  it('has at least 6 pages with unique IDs', () => {
    expect(letterPages.length).toBeGreaterThanOrEqual(6)
    const ids = letterPages.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every page has all three language keys', () => {
    for (const page of letterPages) {
      expect(page.content['zh-TW']).toBeTruthy()
      expect(page.content.ko).toBeTruthy()
      expect(page.content.en).toBeTruthy()
    }
  })
})

describe('memories', () => {
  it('has 10 items each with an enabled field', () => {
    expect(memories).toHaveLength(10)
    for (const m of memories) {
      expect(typeof m.enabled).toBe('boolean')
      expect(m.images).toBeDefined()
    }
  })
})

describe('futureWishes', () => {
  it('has 10 items', () => {
    expect(futureWishes).toHaveLength(10)
  })
})

describe('uiText', () => {
  it('has localized restart button text', () => {
    expect(uiText.restart.ko).toBe('처음부터 다시 보기')
    expect(uiText.restart['zh-TW']).toBe('從頭再看一次')
    expect(uiText.restart.en).toBe('Read Again')
  })
})
