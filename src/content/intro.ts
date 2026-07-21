import type { LocalizedText } from './localization'

// Integrated 5-act intro ("One Moon, One Journey").
// Korean is the approved source copy; zh-TW and en are reviewed translations.
// Keep the name 苙綺 verbatim in every language.

export const introUi: Record<string, LocalizedText> = {
  title: {
    ko: '같은 달, 하나의 여정',
    'zh-TW': '同一輪月亮，一段旅程',
    en: 'One Moon, One Journey',
  },
  subtitle: {
    ko: '우리의 100일',
    'zh-TW': '我們的100天',
    en: 'Our 100 Days',
  },
  tapToBegin: {
    ko: '가볍게 터치　시작',
    'zh-TW': '輕觸開始',
    en: 'Tap to begin',
  },
  skip: {
    ko: '건너뛰기',
    'zh-TW': '跳過',
    en: 'Skip',
  },
  act3Title: {
    ko: '천등에 새기는 우리',
    'zh-TW': '寫在天燈上的我們',
    en: 'Our Story on a Sky Lantern',
  },
}

export const introCopy: {
  a1: LocalizedText[]
  a2: LocalizedText[]
  faces: LocalizedText[]
  finalWish: LocalizedText
  a4: LocalizedText[]
  a5: LocalizedText[]
} = {
  // ACT 1 — the same night, in different places
  a1: [
    {
      ko: '한국과 대만에서\n서로 다른 하루를 보내고 있었지만,',
      'zh-TW': '我們在韓國和台灣，\n過著各自的日子，',
      en: 'In Korea and Taiwan,\nwe were each living our own days,',
    },
    {
      ko: '하루의 끝에는\n늘 네가 있었어.',
      'zh-TW': '但每天結束以前，\n總有你在。',
      en: 'but at the end of each day,\nyou were always there.',
    },
    {
      ko: '통화가 끝난 뒤에도\n조금만 더 같이 있고 싶었고,',
      'zh-TW': '就算通話結束了，\n還是想再陪你久一點，',
      en: 'Even after our calls ended,\nI still wished we could stay together a little longer,',
    },
    {
      ko: '함께한 시간이 쌓일수록\n다음에 만날 날이 더 기다려졌어.',
      'zh-TW': '一起度過的時間越多，\n就越期待下一次見面的日子。',
      en: 'The more time we shared,\nthe more I looked forward to seeing you again.',
    },
    {
      ko: '서로 다른 곳에서 같은 달을 보는 것도\n어느새 우리에게 익숙한 일이 되었어.',
      'zh-TW': '即使在不同的地方看著同一輪月亮，\n也不知不覺成了我們習慣的日常。',
      en: 'Watching the same moon from different places\nhad quietly become part of our everyday life.',
    },
  ],
  // ACT 2 — the heart that looks at the distance changes
  a2: [
    {
      ko: '처음에는 솔직히\n한국과 대만이라는 거리가 걱정됐어.',
      'zh-TW': '一開始，老實說，\n我很擔心韓國和台灣之間的距離。',
      en: 'Honestly, at first,\nthe distance between Korea and Taiwan worried me.',
    },
    {
      ko: '보고 싶을 때 바로 만날 수 없다는 게\n우리에게 벽이 될까 봐.',
      'zh-TW': '我怕想見面的時候不能馬上見到彼此，\n會成為我們之間的一道牆。',
      en: 'I feared that not being able to meet the moment we missed each other\nmight become a wall between us.',
    },
    {
      ko: '그런데 이제는\n네가 어디에 있든 괜찮아.',
      'zh-TW': '但現在，\n無論你在哪裡，我都不再覺得那是問題。',
      en: 'But now,\nwherever you are, I no longer see it as a problem.',
    },
    {
      ko: '한국이든 대만이든,\n서로 만나고 싶은 마음만 있다면\n우리는 언제든 다시 만날 수 있으니까.',
      'zh-TW': '不管是在韓國還是台灣，\n只要我們都想見彼此，\n就總有辦法再見面。',
      en: "Whether we're in Korea or Taiwan,\nas long as we both want to see each other,\nwe'll always find a way to meet again.",
    },
    {
      ko: '거리는 그대로지만,\n그 거리를 바라보는 내 마음은 달라졌어.',
      'zh-TW': '距離沒有改變，\n但我看待它的心情已經不一樣了。',
      en: "The distance hasn't changed,\nbut the way I feel about it has.",
    },
    {
      ko: '이제는 네가 어디에 있든\n우리가 멀다고 느껴지지 않아.',
      'zh-TW': '現在，不管你在哪裡，\n我都不再覺得我們離得很遠。',
      en: "Now, wherever you are,\nI no longer feel we're far apart.",
    },
  ],
  // ACT 3 — us, written on a sky lantern
  faces: [
    {
      ko: '처음엔\n서로를 알아가는 대화였고,',
      'zh-TW': '一開始，\n是讓我們慢慢了解彼此的對話，',
      en: 'At first,\nthey were conversations that helped us get to know each other,',
    },
    {
      ko: '만날수록\n함께 있는 시간이 자연스러워졌고,',
      'zh-TW': '隨著一次次見面，\n待在一起也變得越來越自然，',
      en: 'The more we met,\nthe more natural it felt to be together,',
    },
    {
      ko: '어느새 서로의 하루에\n꼭 필요한 사람이 되었어.',
      'zh-TW': '不知不覺，\n我們都成了彼此每天少不了的人。',
      en: "and before we knew it,\nwe'd become an important part of each other's everyday lives.",
    },
    {
      ko: '지금은 서로 다른 곳에서\n같은 달을 보는 날이 많지만,',
      'zh-TW': '雖然現在，我們常常在不同的地方\n看著同一輪月亮，',
      en: 'Now, though we often watch the same moon\nfrom different places,',
    },
  ],
  finalWish: {
    ko: '앞으로는 같은 곳에서\n나란히 달을 보는 날이\n더 많아지기를.',
    'zh-TW': '希望以後，\n我們能在同一個地方，\n並肩看月亮的日子越來越多。',
    en: 'I hope there will be more and more nights\nwhen we can watch the moon side by side,\nin the same place.',
  },
  // ACT 4 — watching the same moon together, in the same place
  a4: [
    {
      ko: '그리고 오늘은\n같은 곳에서\n같은 달을 보고 있어.',
      'zh-TW': '而今天，\n我們在同一個地方，\n看著同一輪月亮。',
      en: 'And today,\nin the same place,\nwe\'re watching the same moon.',
    },
    {
      ko: '앞으로도 이런 밤을\n많이 만들어가자.',
      'zh-TW': '以後也一起\n度過更多這樣的夜晚吧。',
      en: "Let's spend many more nights\nlike this together.",
    },
  ],
  // ACT 5 — our first 100 days
  a5: [
    {
      ko: '서로 다른 곳에서 시작한 우리가\n벌써 첫 100일을 맞았어.',
      'zh-TW': '從不同地方開始的我們，\n不知不覺已經一起走到第100天了。',
      en: "We began in different places,\nand before we knew it, we'd reached our first 100 days.",
    },
    {
      ko: '苙綺, 사랑해.',
      'zh-TW': '苙綺，我愛你。',
      en: '苙綺, I love you.',
    },
    {
      ko: '우리의 첫 100일을\n함께 축하하고,',
      'zh-TW': '一起慶祝\n我們的第一個100天，',
      en: "Let's celebrate our first 100 days together,",
    },
    {
      ko: '앞으로 200일도,\n1년도, 10년도\n하나씩 같이 기념하자.',
      'zh-TW': '接下來的200天、\n1年、10年，\n也都一起好好紀念吧。',
      en: 'And for the 200 days,\nthe year, and the ten years ahead,\nlet\'s celebrate each one together.',
    },
    {
      ko: '우리의 첫 100일과\n앞으로 이어질 이야기를\n이 안에 담았어.',
      'zh-TW': '我把我們的第一個100天，\n和接下來要繼續寫下去的故事，\n都放進這裡了。',
      en: 'I put our first 100 days,\nand all the stories still ahead of us,\nin here.',
    },
  ],
}
