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
      'zh-TW': '什麼都還不懂，就這樣開始的我們',
      ko: '아무것도 모르고 시작한 우리',
      en: 'The two of us, who began without knowing a thing',
    },
    description: {
      'zh-TW':
        '那一天的我們，都還不知道彼此會成為對方生命裡怎樣的人。\n\n幾句隨意開始的對話，不知不覺變成了每天的習慣；那時的我們，又怎麼會知道，有一天竟會這樣想念彼此、喜歡上對方呢。\n\n現在回頭看，那天並沒有發生什麼特別的事，只是一個再平凡不過的日子，卻成了我們故事的第一句話。',
      ko: '그날의 우리는 아직 서로가 어떤 사람이 될지 몰랐다.\n\n가볍게 시작한 몇 마디 대화가 어느새 하루의 습관이 되고, 언젠가 서로를 이렇게 그리워하고 좋아하게 될 줄 누가 알았을까.\n\n돌아보면 그날은 특별한 일이 있었던 날이 아니라, 평범했던 하루가 우리 이야기의 첫 문장이 된 날이었다.',
      en: 'Back then, neither of us knew who the other would become to us.\n\nA few casual words became a daily habit before we even noticed — and who could have guessed we would one day miss each other, and fall for each other, like this.\n\nLooking back, nothing special happened that day; it was just an ordinary day that became the first sentence of our story.',
    },
    imageHint: 'early-conversation-placeholder',
  },
  {
    id: 'first-meeting',
    date: '2026-02-21',
    title: {
      'zh-TW': '妳的笑容，在我心裡留了好久的那天',
      ko: '네 웃음이 오래 남은 날',
      en: 'The day your smile stayed with me',
    },
    description: {
      'zh-TW':
        '第一次真正見到妳，原本緊張的心情很快就被妳融化了。每當妳燦爛地笑起來，好像連周圍都跟著亮了起來，我只想再多看那樣的笑容一會兒。\n\n短暫的相處過後，當妳要前往釜山時，那份「好想再多待在一起一下」的不捨，比我想像中還要深。看著妳轉身離開的背影，我心裡其實已經在期待著下一次的相見了。',
      ko: '처음 마주한 너는 긴장했던 마음을 금방 잊게 만들었다. 네가 환하게 웃을 때마다 주변까지 밝아지는 것 같았고, 나는 그 웃는 모습을 조금 더 오래 바라보고 싶었다.\n\n짧았던 시간이 지나 네가 부산으로 떠날 때, 조금만 더 함께하고 싶다는 아쉬움이 생각보다 크게 남았다. 돌아서던 네 모습을 보며, 나는 이미 다음 만남을 기다리고 있었다.',
      en: 'Meeting you in person for the first time, the nervousness I had felt melted away almost at once. Every time you smiled brightly, it was as if everything around us lit up too, and I wanted to keep looking at that smile just a little longer.\n\nAfter our short time together, when you left for Busan, the wish to stay together just a bit longer lingered far more than I expected. Watching you turn to go, I was already waiting for the next time we would meet.',
    },
    imageHint: 'first-meeting-placeholder',
  },
  {
    id: 'became-couple',
    date: '2026-04-28',
    title: {
      'zh-TW': '想念，讓我讀懂了心裡那份感情的那天',
      ko: '그리움이 마음의 이름을 알려준 날',
      en: 'The day longing told me the name of my heart',
    },
    description: {
      'zh-TW':
        '妳回到台灣之後，日子還是像平常一樣流動著。可是每當我們熟悉的對話結束，我卻比以前更加想念妳，妳不在身邊的那個位置，也變得比想像中還要清晰。\n\n那時我才明白，我心裡的那份不捨，並不是一時的寂寞，而是因為喜歡妳，才生出來的想念。\n\n我想在還來得及的時候，坦白地把這份心意告訴妳。然後就在那一天，我們為彼此心裡的感情，寫上了同樣的名字。',
      ko: '네가 대만으로 돌아간 뒤에도 하루는 평소처럼 흘러갔다. 그런데 익숙했던 대화가 끝나면 이전보다 더 네가 보고 싶었고, 네가 없는 자리가 생각보다 선명하게 느껴졌다.\n\n그때 알았다. 내가 느끼던 아쉬움은 잠깐의 외로움이 아니라, 너를 좋아해서 생긴 그리움이었다.\n\n더 늦기 전에 이 마음을 솔직하게 전하고 싶었다. 그리고 그날, 우리는 서로의 마음에 같은 이름을 붙였다.',
      en: 'After you went back to Taiwan, the days went on just as they always had. And yet, once our familiar conversations ended, I missed you more than before, and the empty space where you were not felt clearer than I had thought it would.\n\nThat was when I understood. What I had been feeling was not a passing loneliness — it was a longing born from liking you.\n\nI wanted to tell you honestly before it was too late. And on that day, we gave the feelings in each other’s hearts the very same name.',
    },
    imageHint: 'airport-placeholder',
  },
  {
    id: 'reunion',
    date: '2026-05-22',
    title: {
      'zh-TW': '在漫長等待的盡頭，以戀人的身分再次相見',
      ko: '기다림 끝에서, 연인으로 마주한 날',
      en: 'At the end of the waiting, meeting again as a couple',
    },
    description: {
      'zh-TW':
        '明明是之前見過的同一個人，可是再次面對面的妳，感覺卻有些不一樣了。因為在這段時間裡，我們確認了彼此的心意，如今站在同一個地方的我們，已經不是朋友，而是戀人了。\n\n分開的日子裡，我無數次想起的妳，如今又真真切切地站在我面前；那些曾經隔著距離傳達的心意，這一次，我終於能看著妳的眼睛親口說出來。\n\n那天的重逢，並不只是單純地再次相見而已。而是我們在分隔兩地時所確認的心意，終於也開始在現實裡真正連結起來的一天。',
      ko: '분명 전에 만났던 같은 사람이었는데, 다시 마주한 너는 조금 다르게 느껴졌다. 그사이 우리는 서로의 마음을 알게 되었고, 이제는 친구가 아닌 연인으로 같은 자리에 서 있었으니까.\n\n떨어져 있는 동안 수없이 떠올렸던 네가 다시 내 앞에 있었고, 멀리서 전했던 마음을 이번에는 네 눈을 보며 말할 수 있었다.\n\n그날의 재회는 단순히 다시 만난 순간이 아니었다. 떨어져 있는 동안 확인했던 우리의 마음이 비로소 현실에서도 이어지기 시작한 날이었다.',
      en: 'You were clearly the same person I had met before, yet seeing you again, you felt a little different to me. In the time between, we had come to know each other’s hearts, and now we stood in the same place not as friends, but as a couple.\n\nThe you I had pictured countless times while we were apart was in front of me again, and the feelings I had once sent from far away, this time I could speak while looking into your eyes.\n\nThat reunion was not simply the moment we met again. It was the day the feelings we had confirmed while apart finally began to connect in the real world too.',
    },
    imageHint: 'reunion-placeholder',
  },
  {
    id: 'visited-taiwan',
    date: '2026-06-26',
    title: {
      'zh-TW': '跨越了海洋，心意也變得更加清晰的那天',
      ko: '바다를 건너, 마음이 더 선명해진 날',
      en: 'The day I crossed the sea, and my heart grew clearer',
    },
    description: {
      'zh-TW':
        '這一次，換我跨越海洋，去到妳的身邊。台北對妳來說，是早已走過無數次的城市，但對我而言，這裡的一切都是第一次。妳帶我看那些妳熟悉的街道與風景，而我，就跟著妳為我介紹的台灣一步一步走著。\n\n那些對妳來說再熟悉不過的地方，也從那一天起，一個個有了我們一起歡笑、一起走過的全新回憶。在這座對我陌生的城市裡，看著妳自然地帶路、用熟悉的語言和人們交談，我認識了平常有些不一樣的妳，那種感覺真的很好。從韓國開始的我們的故事，如今跨越了海洋，在台灣依然繼續著——想到這裡，我忽然覺得好不可思議。\n\n然後，在又要分別的機場裡，妳終究還是沒能忍住眼淚。看著妳一邊哭、一邊轉身離開的樣子，我的心有一角疼了好久，好想立刻就把妳重新留在身邊。\n\n就在那一刻我才明白，原來喜歡一個人的心情，比起一起歡笑的時候，有時竟是在分別轉身的那一瞬間，變得更加清晰。我對妳的喜歡，遠比我自己以為的還要深得多。也是從那一天起，距離對我們來說，不再是把彼此分開的那條線，而是一條為了再次奔向對方、必須跨越的路。',
      ko: '이번에는 내가 바다를 건너 너에게 갔다. 타이베이는 너에게 이미 여러 번 지나온 도시였지만, 나에게는 모든 것이 처음인 곳이었다. 너는 익숙한 거리와 풍경을 내게 보여주었고, 나는 네가 소개해 주는 대만을 따라 걸었다.\n\n너에게는 익숙했던 장소들도 그날부터는 우리가 함께 웃고 걸었던 새로운 기억을 하나씩 갖게 되었다. 낯선 도시에서 네가 자연스럽게 길을 안내하고, 익숙한 언어로 사람들과 대화하는 모습을 바라보며 평소와는 또 다른 너를 알게 된 것도 좋았다. 한국에서 시작된 우리의 이야기가 바다를 건너 대만에서도 계속되고 있다는 사실이 문득 신기하게 느껴졌다.\n\n그리고 다시 헤어져야 했던 공항에서, 너는 끝내 눈물을 참지 못했다. 울면서 돌아서는 네 모습을 바라보는데 마음 한쪽이 오래 아팠고, 당장이라도 다시 붙잡고 싶었다.\n\n그 순간 알았다. 좋아한다는 마음은 함께 웃을 때보다, 헤어져 돌아서는 순간 더 선명해지기도 한다는 것을. 나는 내가 생각했던 것보다 훨씬 더 너를 좋아하고 있었다. 그날부터 거리는 우리를 갈라놓는 선이 아니라, 다시 서로에게 가기 위해 건너야 할 길이 되었다.',
      en: 'This time, it was my turn to cross the sea to you. Taipei was a city you had walked through many times, but to me, everything about it was new. You showed me the streets and scenery you knew so well, and I walked along the Taiwan you introduced to me.\n\nEven the places that were so familiar to you began, from that day, to hold new memories of us laughing and walking together. In that unfamiliar city, watching you guide the way so naturally and talk with people in a language you knew by heart, I came to know a different side of you, and I loved that too. It suddenly felt wondrous to me that our story, which began in Korea, was now crossing the sea and continuing on in Taiwan.\n\nAnd then, at the airport where we had to part again, you could not hold back your tears in the end. Watching you turn away in tears, one corner of my heart ached for a long time, and I wanted to reach out and hold you back right then and there.\n\nIn that moment I understood — that the feeling of loving someone can grow clearer not when you are laughing together, but in the instant you turn away to part. I liked you far more than I had ever realized. And from that day on, the distance was no longer a line dividing us, but a road I had to cross to reach you again.',
    },
    imageHint: 'taiwan-visit-placeholder',
  },
  {
    id: '100th-day',
    date: '2026-08-05',
    title: {
      'zh-TW': '第一個一百天，還有下一句話',
      ko: '첫 번째 백일, 그리고 다음 문장',
      en: 'Our first hundred days, and the next sentence',
    },
    description: {
      'zh-TW':
        '我們之間的距離並沒有消失，但我們卻一點一點地，學會了一起跨越那段距離的方法。學會了等待，學會了坦白地傳達心意，也學會了在每一次分別之後，依然相信下一次的重逢。\n\n就這樣一天一天累積起來的時光，不知不覺間，成了我們的第一個一百天。這一百天並不是我們故事的結局，而是我們一起寫下的第一個章節。\n\n我想好好地、長長久久地記住今天的我們，也想像現在這樣，把接下來要繼續寫下去的每一句話，都和妳一起，一句一句慢慢寫完。',
      ko: '우리 사이의 거리가 사라진 것은 아니지만, 그 거리를 함께 건너는 방법을 우리는 조금씩 배웠다. 기다리는 법, 솔직하게 마음을 전하는 법, 헤어진 뒤에도 다음 만남을 믿는 법.\n\n그렇게 하루씩 쌓아온 시간이 어느새 우리의 첫 백 일이 되었다. 이 백 일은 우리 이야기의 결말이 아니라, 함께 써 내려간 첫 번째 장이다.\n\n오늘의 우리를 오래 기억하면서, 앞으로 이어질 다음 문장들도 지금처럼 하나씩 함께 써 내려가고 싶다.',
      en: 'The distance between us has not disappeared, but little by little, we have learned how to cross it together. How to wait, how to share our hearts honestly, and how to keep believing in the next meeting even after we part.\n\nThe time we have gathered one day at a time has quietly become our first hundred days. These hundred days are not the ending of our story, but the first chapter we have written together.\n\nI want to remember the us of today for a long, long time, and to keep writing the sentences that come next, one by one, together with you, just like now.',
    },
    imageHint: 'milestone-placeholder',
  },
]
