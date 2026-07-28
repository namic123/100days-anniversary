import { timeline } from './timeline'

export type TimelineMediaKind = 'photo' | 'video'

export interface TimelineMediaSlot {
  id: string
  fileName: string
  kind: TimelineMediaKind
  /** Video only: a poster-frame `.webp` used for the thumbnail + hero poster. */
  poster?: string
}

/**
 * Real photo/video slots per timeline entry, in capture order. Files live in
 * `src/assets/timeline-media/photos|video/` and are glob-imported by
 * DiaryReader. Photos are `.webp`; videos are `.mp4` and autoplay MUTED, so each
 * video carries a `poster` `.webp` (a frame grab) for its thumbnail + hero
 * poster. Non-descriptive filenames keyed to the entry id (privacy: no
 * descriptive names / EXIF).
 *
 * Moments with no media (`first-known`, `100th-day`) are intentionally absent —
 * the book engine skips the media page when an entry has no slots.
 */
export const timelineMedia: Record<string, TimelineMediaSlot[]> = {
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
    { id: 'reunion-01', fileName: 'timeline-reunion-01.mp4', kind: 'video', poster: 'timeline-reunion-01-poster.webp' },
    { id: 'reunion-02', fileName: 'timeline-reunion-02.mp4', kind: 'video', poster: 'timeline-reunion-02-poster.webp' },
    { id: 'reunion-03', fileName: 'timeline-reunion-03.mp4', kind: 'video', poster: 'timeline-reunion-03-poster.webp' },
    { id: 'reunion-04', fileName: 'timeline-reunion-04.webp', kind: 'photo' },
    { id: 'reunion-05', fileName: 'timeline-reunion-05.webp', kind: 'photo' },
    { id: 'reunion-06', fileName: 'timeline-reunion-06.webp', kind: 'photo' },
    { id: 'reunion-07', fileName: 'timeline-reunion-07.webp', kind: 'photo' },
    { id: 'reunion-08', fileName: 'timeline-reunion-08.webp', kind: 'photo' },
    { id: 'reunion-09', fileName: 'timeline-reunion-09.webp', kind: 'photo' },
    { id: 'reunion-10', fileName: 'timeline-reunion-10.webp', kind: 'photo' },
    { id: 'reunion-11', fileName: 'timeline-reunion-11.mp4', kind: 'video', poster: 'timeline-reunion-11-poster.webp' },
    { id: 'reunion-12', fileName: 'timeline-reunion-12.mp4', kind: 'video', poster: 'timeline-reunion-12-poster.webp' },
    { id: 'reunion-13', fileName: 'timeline-reunion-13.mp4', kind: 'video', poster: 'timeline-reunion-13-poster.webp' },
    { id: 'reunion-14', fileName: 'timeline-reunion-14.mp4', kind: 'video', poster: 'timeline-reunion-14-poster.webp' },
    { id: 'reunion-15', fileName: 'timeline-reunion-15.webp', kind: 'photo' },
    { id: 'reunion-16', fileName: 'timeline-reunion-16.webp', kind: 'photo' },
    { id: 'reunion-17', fileName: 'timeline-reunion-17.webp', kind: 'photo' },
    { id: 'reunion-18', fileName: 'timeline-reunion-18.webp', kind: 'photo' },
    { id: 'reunion-19', fileName: 'timeline-reunion-19.mp4', kind: 'video', poster: 'timeline-reunion-19-poster.webp' },
    { id: 'reunion-20', fileName: 'timeline-reunion-20.mp4', kind: 'video', poster: 'timeline-reunion-20-poster.webp' },
  ],
  'visited-taiwan': [
    { id: 'visited-taiwan-01', fileName: 'timeline-visited-taiwan-01.webp', kind: 'photo' },
    { id: 'visited-taiwan-02', fileName: 'timeline-visited-taiwan-02.webp', kind: 'photo' },
    { id: 'visited-taiwan-03', fileName: 'timeline-visited-taiwan-03.webp', kind: 'photo' },
    { id: 'visited-taiwan-04', fileName: 'timeline-visited-taiwan-04.webp', kind: 'photo' },
    { id: 'visited-taiwan-05', fileName: 'timeline-visited-taiwan-05.webp', kind: 'photo' },
    { id: 'visited-taiwan-06', fileName: 'timeline-visited-taiwan-06.webp', kind: 'photo' },
    { id: 'visited-taiwan-07', fileName: 'timeline-visited-taiwan-07.webp', kind: 'photo' },
    { id: 'visited-taiwan-08', fileName: 'timeline-visited-taiwan-08.webp', kind: 'photo' },
    { id: 'visited-taiwan-09', fileName: 'timeline-visited-taiwan-09.mp4', kind: 'video', poster: 'timeline-visited-taiwan-09-poster.webp' },
    { id: 'visited-taiwan-10', fileName: 'timeline-visited-taiwan-10.webp', kind: 'photo' },
    { id: 'visited-taiwan-11', fileName: 'timeline-visited-taiwan-11.webp', kind: 'photo' },
    { id: 'visited-taiwan-12', fileName: 'timeline-visited-taiwan-12.webp', kind: 'photo' },
    { id: 'visited-taiwan-13', fileName: 'timeline-visited-taiwan-13.webp', kind: 'photo' },
    { id: 'visited-taiwan-14', fileName: 'timeline-visited-taiwan-14.webp', kind: 'photo' },
    { id: 'visited-taiwan-15', fileName: 'timeline-visited-taiwan-15.webp', kind: 'photo' },
    { id: 'visited-taiwan-16', fileName: 'timeline-visited-taiwan-16.webp', kind: 'photo' },
    { id: 'visited-taiwan-17', fileName: 'timeline-visited-taiwan-17.webp', kind: 'photo' },
    { id: 'visited-taiwan-18', fileName: 'timeline-visited-taiwan-18.webp', kind: 'photo' },
    { id: 'visited-taiwan-19', fileName: 'timeline-visited-taiwan-19.webp', kind: 'photo' },
    { id: 'visited-taiwan-20', fileName: 'timeline-visited-taiwan-20.webp', kind: 'photo' },
    { id: 'visited-taiwan-21', fileName: 'timeline-visited-taiwan-21.mp4', kind: 'video', poster: 'timeline-visited-taiwan-21-poster.webp' },
    { id: 'visited-taiwan-22', fileName: 'timeline-visited-taiwan-22.mp4', kind: 'video', poster: 'timeline-visited-taiwan-22-poster.webp' },
    { id: 'visited-taiwan-23', fileName: 'timeline-visited-taiwan-23.mp4', kind: 'video', poster: 'timeline-visited-taiwan-23-poster.webp' },
    { id: 'visited-taiwan-24', fileName: 'timeline-visited-taiwan-24.webp', kind: 'photo' },
    { id: 'visited-taiwan-25', fileName: 'timeline-visited-taiwan-25.webp', kind: 'photo' },
    { id: 'visited-taiwan-26', fileName: 'timeline-visited-taiwan-26.webp', kind: 'photo' },
    { id: 'visited-taiwan-27', fileName: 'timeline-visited-taiwan-27.webp', kind: 'photo' },
    { id: 'visited-taiwan-28', fileName: 'timeline-visited-taiwan-28.webp', kind: 'photo' },
  ],
}

/** Ordered slot list matching the timeline entry order (handy for tests/iteration). */
export const timelineMediaSlots: TimelineMediaSlot[] = timeline.flatMap(
  (entry) => timelineMedia[entry.id] ?? [],
)
