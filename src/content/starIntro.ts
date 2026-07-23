import type { LocalizedText } from './localization'

// Copy for the "constellation tour → gift box" intro (StarIntro.vue),
// ported from design-lab/constellation-lab/11-tour-to-giftbox.html.
// Korean is the approved source copy; zh-TW and en are reviewed translations.
// Dates ("2026.04.28", "2026.05.11") and the distance ("1,478km") are NOT
// localized — they render as literals in the component.

export const starIntro: Record<string, LocalizedText> = {
  eyebrow: {
    'zh-TW': '在同一片天空下',
    ko: '같은 하늘 아래',
    en: 'Under the same sky',
  },
  title: {
    'zh-TW': '我們的回憶\n化作星星閃爍',
    ko: '우리의 기억이\n별이 되어 반짝였어',
    en: 'Our memories\nbecame shining stars',
  },
  tapPrompt: {
    'zh-TW': '輕觸畫面，星星就會落下',
    ko: '화면을 탭하면 별이 내려와요',
    en: 'Tap the screen to bring the stars down',
  },
  fallLine: {
    'zh-TW': '我們的星星，\n化作送給妳的禮物落下。',
    ko: '우리의 별들이,\n너에게 줄 선물이 되어 내려와.',
    en: 'Our stars fall,\nas a gift for you.',
  },
  capFirstMeeting: {
    'zh-TW': '初次見面',
    ko: '첫 만남',
    en: 'First meeting',
  },
  capVideoCall: {
    'zh-TW': '第一次視訊',
    ko: '첫 영상통화',
    en: 'First video call',
  },
  capSameSky: {
    'zh-TW': '同一片天空',
    ko: '같은 하늘 아래',
    en: 'Same sky',
  },
  capInTaiwan: {
    'zh-TW': '在台灣',
    ko: '대만에서',
    en: 'In Taiwan',
  },
  capMoon: {
    'zh-TW': '我們的第一次視訊',
    ko: '우리의 첫 영상통화',
    en: 'Our first video call',
  },
}
