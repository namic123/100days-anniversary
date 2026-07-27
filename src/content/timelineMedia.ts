import { timeline } from './timeline'

export type TimelineMediaKind = 'photo' | 'video'

export interface TimelineMediaSlot {
  id: string
  fileName: string
  kind: TimelineMediaKind
}

/**
 * 2–3 photo/video slots per timeline entry. Real media is not provided yet, so
 * every slot renders a fauxPhoto() placeholder (see DiaryReader) until a real
 * file is dropped into `src/assets/timeline-media/photos|video/`.
 *
 * Non-descriptive filenames keyed to the entry id (privacy: no descriptive
 * names / EXIF). Photos are `.webp`, videos are `.mp4`.
 */
export const timelineMedia: Record<string, TimelineMediaSlot[]> = {
  'first-known': [
    { id: 'first-known-01', fileName: 'timeline-first-known-01.webp', kind: 'photo' },
    { id: 'first-known-02', fileName: 'timeline-first-known-02.webp', kind: 'photo' },
  ],
  'first-meeting': [
    { id: 'first-meeting-01', fileName: 'timeline-first-meeting-01.webp', kind: 'photo' },
    { id: 'first-meeting-02', fileName: 'timeline-first-meeting-02.webp', kind: 'photo' },
    { id: 'first-meeting-03', fileName: 'timeline-first-meeting-03.webp', kind: 'photo' },
  ],
  'became-couple': [
    { id: 'became-couple-01', fileName: 'timeline-became-couple-01.webp', kind: 'photo' },
    { id: 'became-couple-02', fileName: 'timeline-became-couple-02.webp', kind: 'photo' },
    { id: 'became-couple-03', fileName: 'timeline-became-couple-03.webp', kind: 'photo' },
  ],
  reunion: [
    { id: 'reunion-01', fileName: 'timeline-reunion-01.webp', kind: 'photo' },
    { id: 'reunion-02', fileName: 'timeline-reunion-02.webp', kind: 'photo' },
  ],
  'visited-taiwan': [
    { id: 'visited-taiwan-01', fileName: 'timeline-visited-taiwan-01.webp', kind: 'photo' },
    { id: 'visited-taiwan-02', fileName: 'timeline-visited-taiwan-02.webp', kind: 'photo' },
    { id: 'visited-taiwan-03', fileName: 'timeline-visited-taiwan-03.mp4', kind: 'video' },
  ],
  '100th-day': [
    { id: '100th-day-01', fileName: 'timeline-100th-day-01.webp', kind: 'photo' },
    { id: '100th-day-02', fileName: 'timeline-100th-day-02.webp', kind: 'photo' },
    { id: '100th-day-03', fileName: 'timeline-100th-day-03.mp4', kind: 'video' },
  ],
}

/** Ordered slot list matching the timeline entry order (handy for tests/iteration). */
export const timelineMediaSlots: TimelineMediaSlot[] = timeline.flatMap(
  (entry) => timelineMedia[entry.id] ?? [],
)
