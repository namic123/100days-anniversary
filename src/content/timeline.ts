import type { LocalizedText } from './localization'

export type TimelineItem = {
  id: string
  date: string
  title: LocalizedText
  description: LocalizedText
  imageHint: string
}

export const timeline: TimelineItem[] = [
  {
    id: 'first-known',
    date: '2026-01-31',
    title: {
      zhTW: '我們故事開始的那一天',
      ko: '우리의 이야기가 시작된 날',
      en: 'The day our story began',
    },
    description: {
      zhTW: '那時我們還是彼此陌生的人，但現在回頭看，那是故事安靜開始的瞬間。',
      ko: '서로에게 아직 낯선 사람이었지만, 지금 돌아보면 우리의 이야기가 조용히 시작된 순간이었다.',
      en: 'We were still strangers, but looking back, it was the quiet beginning of our story.',
    },
    imageHint: 'early-conversation-placeholder',
  },
  {
    id: 'first-meeting',
    date: '2026-02-21',
    title: {
      zhTW: '螢幕裡的妳出現在我面前',
      ko: '화면 속 네가 내 앞에 나타난 날',
      en: 'The day you stepped out of the screen',
    },
    description: {
      zhTW: '第一次真正見到苙綺。見面前很緊張，但在一起時卻比想像中更自然、更安心。',
      ko: '화면으로만 보던 苙綺를 처음 실제로 만난 날. 긴장했지만 함께 있으니 훨씬 편안했어.',
      en: 'The first day I met 苙綺 in person. I was nervous, but being together felt warmer and easier than expected.',
    },
    imageHint: 'first-meeting-placeholder',
  },
  {
    id: 'became-couple',
    date: '2026-04-28',
    title: {
      zhTW: '確認彼此心意的那一天',
      ko: '서로의 마음을 확인한 날',
      en: 'The day we chose each other',
    },
    description: {
      zhTW: '妳結束韓國的時間回台灣那天，我們確認了彼此的心意，也讓關係變得更清楚。',
      ko: '苙綺가 한국에서의 시간을 마치고 대만으로 돌아가던 날, 우리는 서로의 마음을 확인하고 연인이 되었다.',
      en: 'On the day you returned to Taiwan from Korea, we confirmed our feelings and became a couple.',
    },
    imageHint: 'airport-placeholder',
  },
]
