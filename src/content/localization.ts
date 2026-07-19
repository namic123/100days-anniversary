export type Locale = 'zh-TW' | 'ko' | 'en'

export type LocalizedText = {
  'zh-TW': string
  ko: string
  en: string
}

export function getLocalizedText(text: LocalizedText, locale: Locale): string {
  return text[locale] || text['zh-TW']
}
