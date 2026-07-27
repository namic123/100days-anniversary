import type { LocalizedText } from './localization'

// Copy for the "constellation tour → gift box" intro (StarIntro.vue),
// ported from design-lab/constellation-lab/11-tour-to-giftbox.html.
// Korean is the approved source copy; zh-TW and en are reviewed translations.
// Dates ("2026.04.28", "2026.05.11") and the distance ("1,478km") are NOT
// localized — they render as literals in the component.

export const starIntro: Record<string, LocalizedText> = {
  eyebrow: {
    'zh-TW': '像偶然般開始的我們',
    ko: '우연처럼 시작된 우리가',
    en: 'We who began by chance,',
  },
  title: {
    'zh-TW': '直到成為彼此\n最珍貴的每一天',
    ko: '서로의 가장 소중한\n하루가 되기까지',
    en: "until we became each other's\nmost precious day",
  },
  tapPrompt: {
    'zh-TW': '輕觸畫面，一起慶祝100天',
    ko: '화면을 탭하면 100일을 축하해요',
    en: 'Tap to celebrate our 100 days',
  },
  celebrateTitle: {
    'zh-TW': '我們的第一個100天，恭喜！',
    ko: '우리의 첫 100일, 축하해!',
    en: 'Happy first 100 days!',
  },
  giftDropPrompt: {
    'zh-TW': '輕觸畫面，禮物就會送到',
    ko: '화면을 탭하면 선물이 도착해요',
    en: 'Tap and your gift arrives',
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
  photoAlt: {
    'zh-TW': '我們的回憶照片',
    ko: '우리의 추억 사진',
    en: 'Our memory photo',
  },
}
