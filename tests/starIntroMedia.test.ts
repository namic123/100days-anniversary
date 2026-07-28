import { describe, expect, it } from 'vitest'

import {
  starIntroSlots,
  starIntroVideoSlot,
} from '@/content/starIntroMedia'

describe('starIntroMedia', () => {
  it('defines 19 ordered star slots (media-01 → media-19) with correct kinds', () => {
    expect(starIntroSlots).toHaveLength(19)

    const fileNames = starIntroSlots.map(slot => slot.fileName)
    expect(new Set(fileNames).size).toBe(fileNames.length)

    // media-10..14 are videos (.mp4); the rest are photos (.webp).
    const videoIndexes = new Set([10, 11, 12, 13, 14])
    starIntroSlots.forEach((slot, index) => {
      const n = index + 1
      const nn = String(n).padStart(2, '0')
      if (videoIndexes.has(n)) {
        expect(slot.kind).toBe('video')
        expect(slot.fileName).toBe(`media-${nn}.mp4`)
      } else {
        expect(slot.kind).toBe('photo')
        expect(slot.fileName).toBe(`media-${nn}.webp`)
      }
    })
  })

  it('places a caption only on the first star of each of the 4 groups', () => {
    const captioned = starIntroSlots
      .map((slot, index) => (slot.caption ? index : -1))
      .filter(index => index >= 0)
    // group-first stars: media-01, media-03, media-06, media-12
    expect(captioned).toEqual([0, 2, 5, 11])
  })

  it('gives the moon a fileName that no media-NN.mp4 collides with', () => {
    expect(starIntroVideoSlot.fileName).toBe('moon-call.mp4')
    expect(starIntroVideoSlot.fileName).not.toMatch(/^media-\d+\.mp4$/)
    expect(starIntroVideoSlot.caption['zh-TW']).toBeTruthy()
    expect(starIntroVideoSlot.caption.ko).toBeTruthy()
    expect(starIntroVideoSlot.caption.en).toBeTruthy()
  })
})
