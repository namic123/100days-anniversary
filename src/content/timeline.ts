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
      'zh-TW': '我們故事開始的那一天',
      ko: '우리의 이야기가 시작된 날',
      en: 'The day our story began',
    },
    description: {
      'zh-TW': '那時我們還是彼此陌生的人，但現在回頭看，那是故事安靜開始的瞬間。',
      ko: '서로에게 아직 낯선 사람이었지만, 지금 돌아보면 우리의 이야기가 조용히 시작된 순간이었다.',
      en: 'We were still strangers, but looking back, it was the quiet beginning of our story.',
    },
    imageHint: 'early-conversation-placeholder',
  },
  {
    id: 'first-meeting',
    date: '2026-02-21',
    title: {
      'zh-TW': '螢幕裡的妳出現在我面前',
      ko: '화면 속 네가 내 앞에 나타난 날',
      en: 'The day you stepped out of the screen',
    },
    description: {
      'zh-TW': '第一次真正見到苙綺。見面前很緊張，但在一起時卻比想像中更自然、更安心。',
      ko: '화면으로만 보던 苙綺를 처음 실제로 만난 날. 긴장했지만 함께 있으니 훨씬 편안했어.',
      en: 'The first day I met 苙綺 in person. I was nervous, but being together felt warmer and easier than expected.',
    },
    imageHint: 'first-meeting-placeholder',
  },
  {
    id: 'became-couple',
    date: '2026-04-28',
    title: {
      'zh-TW': '確認彼此心意的那一天',
      ko: '서로의 마음을 확인한 날',
      en: 'The day we chose each other',
    },
    description: {
      'zh-TW': '苙綺結束在韓國的時間回到台灣後，在分開的日子裡，我的心意變得更加清晰，於是我坦誠地告訴了她，我們成為了戀人。',
      ko: '苙綺가 한국에서의 시간을 마치고 대만으로 돌아간 뒤, 떨어져 있는 동안 더 선명해진 마음을 솔직하게 전했고 우리는 연인이 되었어.',
      en: 'After 苙綺 finished her time in Korea and returned to Taiwan, the distance only made my feelings clearer. I honestly shared my heart, and we became a couple.',
    },
    imageHint: 'airport-placeholder',
  },
  {
    id: 'reunion',
    date: '2026-05-22',
    title: {
      'zh-TW': '等待結束，再次相見',
      ko: '기다림 끝에 다시 만난 우리',
      en: 'Together again after the wait',
    },
    description: {
      'zh-TW': '遠距離中越來越確定的心意，終於能再次面對面傳達。等待的時間有多長，重逢的喜悅就有多大。',
      ko: '멀리 떨어져 지내는 동안 더욱 분명해진 마음을 직접 마주 보고 다시 전했던 순간. 기다렸던 시간만큼 반가움과 사랑이 더 크게 느껴졌어.',
      en: 'The moment I expressed my deepened feelings face to face. The longer the wait, the greater the joy of reunion.',
    },
    imageHint: 'reunion-placeholder',
  },
  {
    id: 'visited-taiwan',
    date: '2026-06-26',
    title: {
      'zh-TW': '這次換我去找妳',
      ko: '이번에는 내가 너에게로 간 날',
      en: 'This time, I came to you',
    },
    description: {
      'zh-TW': '只在螢幕那頭聽過、想像過的苙綺的國家——台灣，我親自去了。陌生的街道和風景，因為有苙綺在身邊而變得特別。能更靠近妳生活的世界，讓我既興奮又開心。就像妳曾經來韓國找我一樣，這次換我能去找妳，我真的很幸福。',
      ko: '그동안 화면 너머로만 듣고 상상했던 苙綺의 나라인 대만에 내가 직접 찾아간 날. 낯선 거리와 풍경도 苙綺와 함께 있으니 특별하게 느껴졌고, 네가 살아온 곳과 일상을 조금 더 가까이 알게 되어 기뻤어. 한국에서 나를 만나러 와준 너처럼, 이번에는 내가 너에게 갈 수 있다는 사실이 정말 설레고 행복했어.',
      en: 'The day I visited Taiwan — the country I had only heard about and imagined through the screen. The unfamiliar streets and scenery felt special with you by my side. I was thrilled to see your world up close. Just as you came to Korea for me, this time I could go to you.',
    },
    imageHint: 'taiwan-visit-placeholder',
  },
  {
    id: '100th-day',
    date: '2026-08-05',
    title: {
      'zh-TW': '我們的第一個紀念日',
      ko: '우리의 첫 번째 기념일',
      en: 'Our first milestone',
    },
    description: {
      'zh-TW': '在無法隨時見面的距離中，依然互相信任、互相等待，走到了第一個100天。回顧至今的回憶，並約定未來要一起走的路。',
      ko: '보고 싶을 때 바로 만날 수 없는 거리 속에서도 서로를 믿고 기다리며 도착한 첫 100일. 지금까지의 추억을 돌아보고 앞으로 함께할 시간을 약속하는 날.',
      en: 'Our first 100 days — reached by trusting and waiting for each other across the distance. A day to look back on memories and promise more time together.',
    },
    imageHint: 'milestone-placeholder',
  },
]
