import type { LocalizedText } from './localization'

export interface LetterPage {
  id: string
  content: LocalizedText
}

export const letterPages: LetterPage[] = [
  {
    id: 'letter-1',
    content: {
      ko: '사랑하는 苙綺에게.\n\n우리가 처음 서로를 알게 되었을 때는, 苙綺가 내 하루에서 이렇게 큰 존재가 될 거라고는 생각하지 못했어.\n\n처음에는 서로 다른 나라에서 살아가는 두 사람이었고, 사용하는 언어도 익숙한 문화도 조금씩 달랐지. 하지만 이상하게도 苙綺와 대화하는 시간은 늘 편안했고, 대화가 끝난 뒤에도 네 생각이 계속 남았어.\n\n그렇게 조금씩 너를 궁금해하고 기다리게 되면서, 어느 순간부터 너는 내가 가장 만나고 싶은 사람이 되어 있었어.',
      'zh-TW': '親愛的苙綺：\n\n我們剛認識的時候，我從沒想過苙綺會成為我生活中這麼重要的存在。\n\n一開始我們只是住在不同國家的兩個人，說的語言不同，熟悉的文化也有些不一樣。但奇怪的是，和苙綺聊天的時光總是很自在，每次對話結束後，腦海裡還是一直想著妳。\n\n就這樣一點一滴地開始對妳好奇、開始期待，不知不覺間，妳已經成了我最想見到的人。',
      en: 'Dear 苙綺,\n\nWhen we first got to know each other, I never imagined you would become such a big part of my life.\n\nAt first, we were just two people living in different countries, speaking different languages, familiar with slightly different cultures. But strangely, the time I spent talking with you always felt comfortable, and even after our conversations ended, thoughts of you lingered.\n\nLittle by little, I grew curious about you, started looking forward to seeing you, and before I knew it, you had become the person I wanted to see most.',
    },
  },
  {
    id: 'letter-2',
    content: {
      ko: '처음 실제로 만났던 날도 아직 선명하게 기억나. 하늘색 셔츠 안에 흰 티를 입고, 청치마와 검은색 신발을 신은 苙綺가 내 앞에 나타났을 때, 화면으로만 보던 너를 정말 만났다는 사실이 신기했어.\n\n처음에는 조금 긴장했지만, 잘 웃고 밝은 네 모습을 보면서 금방 편안해졌어. 밝게 웃다가도 가끔 수줍어하는 모습이 있었고, 생각하지 못했던 엉뚱한 제안을 할 때는 귀엽고 재미있었어. 무엇보다 내가 좋아하는 귀여운 얼굴로 웃는 네 모습이 정말 좋았어. 함께 걷고 이야기하고 밥을 먹는 동안, 처음 만난 사람이라는 것이 이상할 정도로 자연스럽고 편안했어.',
      'zh-TW': '第一次見面的那天，我到現在都還記得很清楚。穿著淺藍色襯衫搭白色上衣，配牛仔裙和黑色鞋子的苙綺出現在我面前時，覺得螢幕裡才看過的妳竟然真的站在眼前，好不可思議。\n\n一開始有點緊張，但看到妳開朗愛笑的樣子，很快就放鬆了。笑得很開心的時候偶爾又會害羞，提出意想不到的建議時既可愛又有趣。最重要的是，妳用我最喜歡的那張可愛的臉微笑的樣子，真的讓我好心動。一起散步、聊天、吃飯的時候，明明是第一次見面，卻自然得不可思議。',
      en: 'I still vividly remember the day we first met in person. When you appeared before me wearing a light blue shirt over a white top, a denim skirt, and black shoes, I was amazed that the person I had only seen through a screen was actually standing right there.\n\nI was a little nervous at first, but seeing your bright, cheerful smile quickly put me at ease. You would laugh happily, then sometimes show a shy side, and when you made unexpected suggestions, it was cute and fun. Most of all, I loved seeing you smile with that adorable face I like so much. Walking, talking, and eating together — it felt impossibly natural for a first meeting.',
    },
  },
  {
    id: 'letter-3',
    content: {
      ko: '첫 만남을 마치고 네가 다시 대만으로 돌아간 뒤에도 나는 자주 그날을 떠올렸어. 그리고 얼마 후 네가 다시 한국에 놀러 왔을 때, 우리는 또 함께 시간을 보냈지.\n\n처음 만났을 때도 좋았지만, 다시 만났을 때는 내 마음이 전보다 더 분명해지고 있다는 걸 느꼈어. 함께 있는 시간은 늘 빠르게 지나갔고, 네가 돌아갈 시간이 가까워질수록 아쉬운 마음도 점점 커졌어.\n\n네가 다시 대만으로 떠나던 날, 나는 이상하게도 한 가지를 확실히 알 수 있었어.\n\n앞으로 내가 苙綺를 정말 많이 그리워하게 될 거라는 것.',
      'zh-TW': '第一次見面結束，妳回到台灣之後，我還是常常回想那一天。不久後妳又來韓國玩的時候，我們又一起度過了一段時光。\n\n第一次見面就已經很美好了，但再次相見時，我感覺到自己的心意比之前更加清晰了。在一起的時間總是過得好快，而妳要回去的日子越來越近，心裡的不捨也越來越強烈。\n\n妳再次飛回台灣的那天，我奇怪地有一件事變得非常確定。\n\n那就是——我一定會非常非常想念苙綺。',
      en: 'Even after our first meeting ended and you returned to Taiwan, I often thought back to that day. And when you came to Korea again not long after, we spent more time together.\n\nOur first meeting was wonderful, but when we met again, I realized my feelings had become clearer than before. Time together always passed quickly, and as the day you had to leave drew closer, the feeling of longing only grew.\n\nThe day you flew back to Taiwan, I somehow knew one thing for certain.\n\nThat I would miss 苙綺 — so very much.',
    },
  },
  {
    id: 'letter-4',
    content: {
      ko: '그때는 아직 내 마음을 제대로 말하지 못했지만, 네가 대만으로 돌아간 뒤 빈자리가 생각보다 크게 느껴졌어. 평소처럼 하루를 보내고 있어도 계속 네가 생각났고, 함께했던 시간들을 다시 떠올리게 되었어. 그제야 나는 이 마음을 그냥 지나가게 두고 싶지 않다는 걸 알았어.\n\n그리고 2026년 4월 28일, 대만에 있는 너에게 내 마음을 고백했지.\n\n직접 네 앞에서 말하지 못했다는 아쉬움은 있었지만, 더 늦기 전에 솔직하게 이야기하고 싶었어. 네가 좋고, 앞으로도 계속 만나고 싶고, 멀리 떨어져 있더라도 함께해보고 싶다고.\n\n그렇게 우리는 서로의 마음을 확인하고 연인이 되었어.',
      'zh-TW': '那時候我還沒能好好表達自己的心意，但妳回到台灣後，妳留下的空缺比我想像中大得多。即使照常過著每一天，我還是不斷想起妳，一次又一次回憶我們在一起的時光。那時我才明白，我不想讓這份心意就這樣過去。\n\n然後在2026年4月28日，我向在台灣的妳告白了。\n\n沒能當面對妳說，心裡多少有些遺憾，但我想趁還來得及的時候坦誠地告訴妳。我喜歡妳，以後也想繼續見面，即使相隔遙遠也想一起走下去。\n\n就這樣，我們確認了彼此的心意，成為了戀人。',
      en: 'I hadn\'t been able to express my feelings properly back then, but after you returned to Taiwan, the emptiness you left behind felt bigger than I expected. Even going through my days as usual, I kept thinking of you, kept revisiting the time we spent together. That was when I realized I didn\'t want to let these feelings pass by.\n\nAnd on April 28, 2026, I confessed my feelings to you in Taiwan.\n\nI was a little sorry I couldn\'t say it face to face, but I wanted to be honest before it was too late. That I like you, that I want to keep seeing you, and that even if we\'re far apart, I want to be together.\n\nAnd so, we confirmed each other\'s feelings and became a couple.',
    },
  },
  {
    id: 'letter-5',
    content: {
      ko: '기쁘면서도 동시에 우리가 다시 먼 거리에서 시작해야 한다는 사실이 걱정되기도 했어. 그래도 그때부터 나는 분명하게 알게 되었어. 거리가 멀다는 이유로 포기하고 싶은 사람이 아니라, 그 거리를 견디면서도 계속 함께하고 싶은 사람이 바로 苙綺라는 것을.\n\n장거리 연애는 생각보다 쉽지 않았어.\n\n보고 싶을 때 바로 볼 수 없고, 안아주고 싶을 때 안아줄 수 없고, 서로에게 힘든 일이 있어도 화면 너머에서 위로해야 할 때가 있었지. 때로는 서로 다른 언어 때문에 내 마음을 충분히 전달하지 못한 것 같아 답답하기도 했어.\n\n하지만 그런 시간 덕분에 오히려 내 마음은 더 분명해졌어.\n\n처음 苙綺를 좋아했던 마음도 소중하지만, 기다리고 그리워하고 다시 만나면서 지금의 마음은 그때보다 훨씬 깊어졌어. 가까이 있을 때만 좋은 사람이 아니라, 멀리 떨어져 있어도 계속 생각나고 하루를 나누고 싶은 사람이라는 것을 알게 되었어.',
      'zh-TW': '開心的同時，也擔心我們又要從遙遠的距離重新開始。但從那時起，我很確定地知道了一件事——苙綺不是因為距離遠就想放棄的人，而是即使承受著這段距離，也想一直在一起的人。\n\n遠距離戀愛比想像中困難。\n\n想見面的時候不能馬上見到，想擁抱的時候不能擁抱，彼此遇到難過的事，也只能隔著螢幕安慰。有時候因為語言不同，覺得自己的心意沒能好好傳達而感到著急。\n\n但正是因為經歷了那些日子，我的心反而變得更加堅定。\n\n最初喜歡苙綺的心情固然珍貴，但經過等待、思念、再次相見，現在的心意已經比那時候深了好多。妳不是只有在身邊才覺得好的人，而是即使相隔遙遠，也會不斷想起、想要分享每一天的人。',
      en: 'I was happy, but at the same time, I worried that we would have to start again from a long distance. Still, from that moment on, I knew one thing clearly — you are not someone I would give up on because of distance. You are the person I want to be with even through that distance.\n\nLong-distance love was harder than I imagined.\n\nWe couldn\'t see each other when we wanted to, couldn\'t hold each other when we wanted to, and when one of us was struggling, we could only comfort each other through a screen. Sometimes the difference in our languages made me anxious, feeling like I couldn\'t fully convey my heart.\n\nBut because of those times, my feelings only became more certain.\n\nThe heart that first liked you is precious, but through waiting, missing you, and meeting again, my feelings now are so much deeper than before. You are not someone I only appreciate when you\'re near — you are the person I think about constantly, the person I want to share every day with, even from far away.',
    },
  },
  {
    id: 'letter-6',
    content: {
      ko: '우리의 첫 100일 동안 나에게 많은 행복을 줘서 고마워.\n\n내 이야기를 들어줘서 고맙고, 멀리서도 나를 믿어줘서 고맙고, 매일 보고 싶다고 말할 수 있는 사람이 되어줘서 고마워. 苙綺와 직접 함께한 기억들은 물론이고, 다시 만날 날을 기다리며 나눈 수많은 통화와 메시지까지 모두 나에게는 소중한 추억이야.\n\n나는 앞으로 더 좋은 남자친구가 되고 싶어.\n\n내 마음을 표현하는 데 익숙해졌다고 소홀해지지 않고, 익숙함 때문에 苙綺의 소중함을 잊지 않을게. 서로 생각이 다를 때도 내 입장만 앞세우지 않고, 네 마음을 먼저 이해하려고 노력할게. 멀리 떨어져 있는 시간에도 苙綺가 혼자라고 느끼지 않도록 더 자주 표현하고 더 많이 안심시켜줄게.',
      'zh-TW': '謝謝妳在我們的前100天裡帶給我這麼多幸福。\n\n謝謝妳聽我說話，謝謝妳即使相隔遙遠仍然相信我，謝謝妳成為那個讓我每天都能說「好想見妳」的人。和苙綺一起親身經歷的回憶自不用說，等待下次見面時交換的無數通話和訊息，對我來說都是珍貴的回憶。\n\n我想成為更好的男朋友。\n\n不會因為習慣了表達心意就變得怠慢，不會因為習以為常就忘記苙綺的珍貴。即使想法不同的時候，也不會只顧著自己的立場，會先試著理解妳的心情。在我們分隔兩地的日子裡，我會更常表達、更多地讓妳安心，不讓苙綺感到孤單。',
      en: 'Thank you for giving me so much happiness during our first 100 days.\n\nThank you for listening to me, thank you for believing in me even from far away, and thank you for being the person I can say "I miss you" to every day. The memories we\'ve made together in person are precious, of course, but so are the countless calls and messages we shared while waiting for our next meeting.\n\nI want to become a better boyfriend.\n\nI won\'t grow careless just because expressing my feelings has become familiar, and I won\'t forget how precious you are just because it\'s become routine. Even when we see things differently, I won\'t put my perspective first — I\'ll try to understand your feelings first. During the times we\'re apart, I\'ll express my feelings more often and reassure you more, so you never feel alone.',
    },
  },
  {
    id: 'letter-7',
    content: {
      ko: '우리에게는 앞으로 함께 만들고 싶은 기억이 정말 많아.\n\n한국에서 함께 평범한 하루를 보내고 싶고, 대만의 새로운 장소도 같이 여행하고 싶어. 같이 요리하고, 벚꽃을 보고, 크리스마스를 보내고, 200일과 1주년을 함께 축하하고 싶어.\n\n그리고 언젠가는 보고 싶다는 말을 한 뒤, 다음 만남을 오래 기다리지 않아도 되는 날이 왔으면 좋겠어.\n\n해바라기가 언제나 해를 바라보듯, 내 마음도 언제나 苙綺를 향하고 있어.\n\n100일 동안 함께해줘서 고마워. 우리의 첫 100일을 진심으로 축하해.\n\n지금도 많이 사랑하고, 앞으로는 지금보다 더 많이 사랑할게.\n\n사랑해, 苙綺.\n\nJay',
      'zh-TW': '我們還有好多好多想一起創造的回憶。\n\n想在韓國一起度過平凡的一天，也想一起去台灣的新地方旅行。想一起做料理、看櫻花、過聖誕節，一起慶祝200天和一週年。\n\n還有，希望有一天在說完「好想見妳」之後，不用再等很久就能見到彼此。\n\n就像向日葵總是朝著太陽一樣，我的心也總是朝著苙綺。\n\n謝謝妳陪我走過這100天。真心祝賀我們的第一個100天。\n\n現在就已經很愛妳了，以後會比現在更加愛妳。\n\n愛妳，苙綺。\n\nJay',
      en: 'There are so many memories we still want to create together.\n\nI want to spend an ordinary day together in Korea, and travel to new places in Taiwan together. I want to cook together, see the cherry blossoms, spend Christmas together, and celebrate 200 days and our first anniversary.\n\nAnd someday, I hope the day comes when after saying "I miss you," we don\'t have to wait long to see each other again.\n\nJust as sunflowers always face the sun, my heart always faces you.\n\nThank you for being with me these 100 days. I sincerely celebrate our first 100 days.\n\nI love you so much already, and I will love you even more in the days to come.\n\nI love you, 苙綺.\n\nJay',
    },
  },
]
