import { describe, expect, it } from 'vitest'

import {
  starIntroPhotoSlots,
  starIntroVideoSlot,
} from '@/content/starIntroMedia'

describe('starIntroMedia', () => {
  it('defines 12 ordered photo slots with non-descriptive WebP filenames', () => {
    expect(starIntroPhotoSlots).toHaveLength(12)

    const fileNames = starIntroPhotoSlots.map(slot => slot.fileName)
    expect(new Set(fileNames).size).toBe(fileNames.length)
    expect(fileNames).toEqual(
      Array.from({ length: 12 }, (_, index) => {
        return `media-${String(index + 1).padStart(2, '0')}.webp`
      }),
    )
  })

  it('defines the optional intro video slot', () => {
    expect(starIntroVideoSlot.fileName).toBe('media-13.mp4')
    expect(starIntroVideoSlot.caption['zh-TW']).toBeTruthy()
    expect(starIntroVideoSlot.caption.ko).toBeTruthy()
    expect(starIntroVideoSlot.caption.en).toBeTruthy()
  })
})
