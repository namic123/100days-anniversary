export type Locale = 'zhTW' | 'ko' | 'en'

export type LocalizedText = {
  ko: string
  zhTW: string
  en: string
}

export function getLocalizedText(text: LocalizedText, locale: Locale): string {
  return text[locale] || text.zhTW
}
