import type { LocalizedText } from './localization'

export interface MemoryImage {
  id: string
  src: string
  thumbnailSrc?: string
  alt: LocalizedText
}

export interface MemoryItem {
  id: string
  enabled: boolean
  title: LocalizedText
  description: LocalizedText
  images: MemoryImage[]
  date?: string
  location?: LocalizedText
  layout?: 'single' | 'stacked' | 'collage'
  placeholderHint?: string
}

export const memories: MemoryItem[] = [
  {
    id: 'memory-01',
    enabled: false,
    title: { 'zh-TW': '第一張合照', ko: '처음 함께 찍은 사진', en: 'Our first photo together' },
    description: {
      'zh-TW': '只在螢幕裡見過的我們，第一次被收進同一張照片的瞬間。每次看到這張照片，都會想起初次見面那天的緊張和心動。',
      ko: '화면 속에서만 보던 우리가 처음 같은 사진 안에 담긴 순간. 사진을 볼 때마다 처음 만났던 날의 긴장과 설렘이 다시 생각나.',
      en: 'The moment we were captured in the same photo for the first time. Every time I see it, the nervousness and excitement of that first meeting come back.',
    },
    images: [],
    placeholderHint: 'first-photo-together',
  },
  {
    id: 'memory-02',
    enabled: false,
    title: { 'zh-TW': '第一頓飯', ko: '처음 함께 먹었던 식사', en: 'Our first meal together' },
    description: {
      'zh-TW': '比起吃了什麼，和苙綺面對面坐著、共度同一段時光，這件事本身更讓我覺得特別。',
      ko: '무엇을 먹었는지보다 苙綺와 마주 앉아 같은 시간을 보내고 있다는 사실이 더 특별했던 기억.',
      en: 'More than what we ate, just sitting across from each other sharing the same moment felt special.',
    },
    images: [],
    placeholderHint: 'first-meal',
  },
  {
    id: 'memory-03',
    enabled: false,
    title: { 'zh-TW': '一起走過的第一條街', ko: '함께 걸었던 첫 번째 거리', en: 'The first street we walked together' },
    description: {
      'zh-TW': '即使沒有特別的目的地，光是一起走路、一起聊天，時間就過得飛快的瞬間。',
      ko: '특별한 목적지가 없어도, 함께 걷고 이야기하는 것만으로 시간이 빠르게 지나갔던 순간.',
      en: 'Even without a destination, just walking and talking together made time fly by.',
    },
    images: [],
    placeholderHint: 'first-walk',
  },
  {
    id: 'memory-04',
    enabled: false,
    title: { 'zh-TW': '你燦爛的笑容', ko: '환하게 웃던 너의 모습', en: 'Your bright smile' },
    description: {
      'zh-TW': '連周圍的氣氛都被照亮的苙綺的笑容，是我久久難以忘懷的瞬間。',
      ko: '주변 분위기까지 밝게 만드는 苙綺의 웃는 모습이 오래도록 기억에 남았던 순간.',
      en: 'Your smile that brightened everything around you — a moment I will remember for a long time.',
    },
    images: [],
    placeholderHint: 'bright-smile',
  },
  {
    id: 'memory-05',
    enabled: false,
    title: { 'zh-TW': '在韓國一起度過的平凡日子', ko: '한국에서 함께 보낸 평범한 하루', en: 'An ordinary day together in Korea' },
    description: {
      'zh-TW': '沒有盛大的活動，只是一起吃飯、散步、聊天，就讓我知道平凡的一天可以有多幸福。',
      ko: '거창한 이벤트가 없어도 함께 밥을 먹고, 걷고, 이야기하는 평범한 하루가 얼마나 행복한지 알게 된 시간.',
      en: 'No grand plans — just eating, walking, and talking together showed me how happy an ordinary day can be.',
    },
    images: [],
    placeholderHint: 'ordinary-day-korea',
  },
  {
    id: 'memory-06',
    enabled: false,
    title: { 'zh-TW': '遠隔兩地卻在一起的夜晚', ko: '멀리 있어도 함께했던 밤', en: 'Nights together despite the distance' },
    description: {
      'zh-TW': '雖然分隔在韓國和台灣，但透過電話和視訊分享彼此的一天，是我們感覺最靠近彼此的夜晚。',
      ko: '한국과 대만에 떨어져 있었지만, 전화와 영상통화로 서로의 하루를 나누며 가장 가까이 있다고 느꼈던 밤들.',
      en: 'Separated between Korea and Taiwan, but sharing our days through calls and video — the nights we felt closest.',
    },
    images: [],
    placeholderHint: 'video-call-nights',
  },
  {
    id: 'memory-07',
    enabled: false,
    title: { 'zh-TW': '重逢那天的喜悅', ko: '다시 만난 날의 반가움', en: 'The joy of reunion' },
    description: {
      'zh-TW': '等待了那麼久，再次看到彼此時，那份喜悅比想像中更加強烈的一天。',
      ko: '기다렸던 시간만큼 서로를 다시 마주한 순간의 반가움이 더 크게 느껴졌던 날.',
      en: 'After all the waiting, the joy of seeing each other again felt even greater than I imagined.',
    },
    images: [],
    placeholderHint: 'reunion-joy',
  },
  {
    id: 'memory-08',
    enabled: false,
    title: { 'zh-TW': '在台灣一起走過的街道', ko: '대만에서 함께 걸었던 거리', en: 'Streets we walked in Taiwan' },
    description: {
      'zh-TW': '對我來說是陌生的地方，但因為有苙綺在身邊而感到安心，也覺得自己離你的世界更近了一步。',
      ko: '나에게는 낯선 장소였지만 苙綺와 함께여서 편안했고, 네가 살아가는 세상에 조금 더 가까워졌다고 느꼈던 순간.',
      en: 'An unfamiliar place to me, but being with you made it feel like home — a moment I felt closer to your world.',
    },
    images: [],
    placeholderHint: 'taiwan-streets',
  },
  {
    id: 'memory-09',
    enabled: false,
    title: { 'zh-TW': '在台灣一起吃飯聊天的時光', ko: '대만에서 함께 먹고 웃었던 시간', en: 'Eating and laughing in Taiwan' },
    description: {
      'zh-TW': '比起新奇的食物和風景，在同一張桌子上一起笑著聊天的時光更讓我印象深刻。',
      ko: '새로운 음식과 풍경보다, 같은 테이블에서 함께 웃고 이야기했던 시간이 더 기억에 남은 순간.',
      en: 'More than the new food and scenery, the time we spent laughing and talking at the same table is what I remember most.',
    },
    images: [],
    placeholderHint: 'taiwan-dining',
  },
  {
    id: 'memory-10',
    enabled: false,
    title: { 'zh-TW': '約定下次見面的瞬間', ko: '다음 만남을 약속했던 순간', en: 'The moment we promised to meet again' },
    description: {
      'zh-TW': '在又要分開的不捨中，聊著下次要去哪裡、要一起做什麼，把等待變成了約定的瞬間。',
      ko: '다시 멀어져야 하는 아쉬움 속에서도, 다음에는 어디에서 무엇을 함께할지 이야기하며 기다림을 약속했던 순간.',
      en: 'Even as we faced separation again, we talked about where to go next and what to do — turning waiting into a promise.',
    },
    images: [],
    placeholderHint: 'next-promise',
  },
]
