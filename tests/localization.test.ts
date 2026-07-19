import { describe, expect, it } from 'vitest'

import { getLocalizedText } from '@/content/localization'

describe('getLocalizedText', () => {
  it('returns text for the selected locale', () => {
    expect(
      getLocalizedText(
        {
          'zh-TW': '繁體中文',
          ko: '한국어',
          en: 'English',
        },
        'ko',
      ),
    ).toBe('한국어')
  })

  it('falls back to zh-TW for unknown locale', () => {
    expect(
      getLocalizedText(
        {
          'zh-TW': '繁體中文',
          ko: '한국어',
          en: 'English',
        },
        'zh-TW',
      ),
    ).toBe('繁體中文')
  })
})
