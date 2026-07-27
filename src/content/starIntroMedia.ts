import type { LocalizedText } from './localization'
import { starIntro } from './starIntro'

export type StarIntroCaption = string | LocalizedText | null

export interface StarIntroPhotoSlot {
  id: string
  fileName: string
  caption: StarIntroCaption
}

export interface StarIntroVideoSlot {
  id: string
  fileName: string
  caption: LocalizedText
}

export const starIntroPhotoSlots: StarIntroPhotoSlot[] = [
  { id: 'intro-photo-01', fileName: 'media-01.webp', caption: '2026.04.28' },
  { id: 'intro-photo-02', fileName: 'media-02.webp', caption: null },
  { id: 'intro-photo-03', fileName: 'media-03.webp', caption: starIntro.capFirstMeeting },
  { id: 'intro-photo-04', fileName: 'media-04.webp', caption: null },
  { id: 'intro-photo-05', fileName: 'media-05.webp', caption: '2026.05.11' },
  { id: 'intro-photo-06', fileName: 'media-06.webp', caption: starIntro.capVideoCall },
  { id: 'intro-photo-07', fileName: 'media-07.webp', caption: starIntro.capSameSky },
  { id: 'intro-photo-08', fileName: 'media-08.webp', caption: null },
  { id: 'intro-photo-09', fileName: 'media-09.webp', caption: starIntro.capInTaiwan },
  { id: 'intro-photo-10', fileName: 'media-10.webp', caption: null },
  { id: 'intro-photo-11', fileName: 'media-11.webp', caption: '1,478km' },
  { id: 'intro-photo-12', fileName: 'media-12.webp', caption: null },
]

export const starIntroVideoSlot: StarIntroVideoSlot = {
  id: 'intro-video-01',
  fileName: 'media-13.mp4',
  caption: starIntro.capMoon,
}
