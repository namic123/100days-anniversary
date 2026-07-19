import type { LocalizedText } from './localization'

export interface FutureWish {
  id: string
  text: LocalizedText
}

export const futureWishes: FutureWish[] = [
  { id: 'wish-01', text: { 'zh-TW': '在韓國一起生活一個月', ko: '한국에서 한 달 동안 함께 살아보기', en: 'Live together in Korea for a month' } },
  { id: 'wish-02', text: { 'zh-TW': '一起去愛寶樂園', ko: '에버랜드 함께 가기', en: 'Visit Everland together' } },
  { id: 'wish-03', text: { 'zh-TW': '一起去台灣的新城市旅行', ko: '대만의 새로운 도시 여행하기', en: 'Travel to a new city in Taiwan' } },
  { id: 'wish-04', text: { 'zh-TW': '一起做料理', ko: '함께 요리하기', en: 'Cook together' } },
  { id: 'wish-05', text: { 'zh-TW': '一起看櫻花', ko: '벚꽃 함께 보기', en: 'See cherry blossoms together' } },
  { id: 'wish-06', text: { 'zh-TW': '一起過聖誕節', ko: '크리스마스 함께 보내기', en: 'Spend Christmas together' } },
  { id: 'wish-07', text: { 'zh-TW': '一起慶祝200天', ko: '200일 함께 축하하기', en: 'Celebrate 200 days together' } },
  { id: 'wish-08', text: { 'zh-TW': '一起慶祝第一個週年', ko: '첫 번째 1주년 함께 축하하기', en: 'Celebrate our first anniversary' } },
  { id: 'wish-09', text: { 'zh-TW': '沒有特別計畫，一起度過平凡的一天', ko: '특별한 계획 없이 평범한 하루 함께 보내기', en: 'Spend an ordinary day together with no plans' } },
  { id: 'wish-10', text: { 'zh-TW': '打造一個不用再久等下次見面的未來', ko: '더 이상 다음 만남을 오래 기다리지 않아도 되는 미래 만들기', en: 'Build a future where we no longer wait long to meet again' } },
]
