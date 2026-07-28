import type { LocalizedText } from './localization'
import { starIntro } from './starIntro'

export type StarIntroCaption = string | LocalizedText | null

export type StarIntroMediaKind = 'photo' | 'video'

export interface StarIntroSlot {
  id: string
  kind: StarIntroMediaKind
  fileName: string
  caption: StarIntroCaption
}

export interface StarIntroVideoSlot {
  id: string
  fileName: string
  caption: LocalizedText
}

// Group captions for the constellation tour. A caption sits ONLY on the first
// star of each themed group; every other star has `caption: null`.
const capGroup1: LocalizedText = { 'zh-TW': '初次見面', ko: '첫 만남', en: 'First meeting' }
const capGroup2: LocalizedText = {
  'zh-TW': '等待後再相見的那天',
  ko: '기다림 끝에 다시 만난 날',
  en: 'Reunited after the wait',
}
const capGroup3: LocalizedText = {
  'zh-TW': '以戀人相見的那天',
  ko: '연인으로 마주한 날',
  en: 'The day we met as a couple',
}
const capGroup4: LocalizedText = { 'zh-TW': '在台灣', ko: '대만에서', en: 'In Taiwan' }

// 19 stars in tour order (media-01 → media-19), grouped 2 / 3 / 6 / 8.
export const starIntroSlots: StarIntroSlot[] = [
  // Group 1 「첫 만남」 — 2 photos
  { id: 'intro-01', kind: 'photo', fileName: 'media-01.webp', caption: capGroup1 },
  { id: 'intro-02', kind: 'photo', fileName: 'media-02.webp', caption: null },
  // Group 2 「기다림 끝에 다시 만난 날」 — 3 photos
  { id: 'intro-03', kind: 'photo', fileName: 'media-03.webp', caption: capGroup2 },
  { id: 'intro-04', kind: 'photo', fileName: 'media-04.webp', caption: null },
  { id: 'intro-05', kind: 'photo', fileName: 'media-05.webp', caption: null },
  // Group 3 「연인으로 마주한 날」 — 4 photos + 2 videos
  { id: 'intro-06', kind: 'photo', fileName: 'media-06.webp', caption: capGroup3 },
  { id: 'intro-07', kind: 'photo', fileName: 'media-07.webp', caption: null },
  { id: 'intro-08', kind: 'photo', fileName: 'media-08.webp', caption: null },
  { id: 'intro-09', kind: 'photo', fileName: 'media-09.webp', caption: null },
  { id: 'intro-10', kind: 'video', fileName: 'media-10.mp4', caption: null },
  { id: 'intro-11', kind: 'video', fileName: 'media-11.mp4', caption: null },
  // Group 4 「대만에서」 — 3 videos + 5 photos
  { id: 'intro-12', kind: 'video', fileName: 'media-12.mp4', caption: capGroup4 },
  { id: 'intro-13', kind: 'video', fileName: 'media-13.mp4', caption: null },
  { id: 'intro-14', kind: 'video', fileName: 'media-14.mp4', caption: null },
  { id: 'intro-15', kind: 'photo', fileName: 'media-15.webp', caption: null },
  { id: 'intro-16', kind: 'photo', fileName: 'media-16.webp', caption: null },
  { id: 'intro-17', kind: 'photo', fileName: 'media-17.webp', caption: null },
  { id: 'intro-18', kind: 'photo', fileName: 'media-18.webp', caption: null },
  { id: 'intro-19', kind: 'photo', fileName: 'media-19.webp', caption: null },
]

// The tour's MOON video is separate from the ordered star tour. Its fileName is
// intentionally a name no real file matches (`moon-call.mp4`), so the moon falls
// back to its placeholder and never picks up any group-4 `media-NN.mp4`.
export const starIntroVideoSlot: StarIntroVideoSlot = {
  id: 'intro-video-moon',
  fileName: 'moon-call.mp4',
  caption: starIntro.capMoon,
}
