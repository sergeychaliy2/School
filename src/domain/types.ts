export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export const DAY_NAMES: Record<DayKey, string> = {
  mon: 'Понедельник',
  tue: 'Вторник',
  wed: 'Среда',
  thu: 'Четверг',
  fri: 'Пятница',
};

export const DAY_SHORT: Record<DayKey, string> = {
  mon: 'Пн',
  tue: 'Вт',
  wed: 'Ср',
  thu: 'Чт',
  fri: 'Пт',
};

export type Lesson = {
  /** Lesson number as printed in the timetable (1-based, may skip). */
  n: number;
  subject: string;
  room: string | null;
  note?: string;
};

export type GradeSchedule = Record<DayKey, Lesson[]>;

export type ScheduleSource = {
  grades: string[];
  url: string;
  etag: string;
  lastModified: string;
  bytes: number;
};

export type ScheduleDoc = {
  version: number;
  approvedOn: string;
  approvedBy: string;
  sources: ScheduleSource[];
  rituals: { daily: string[]; mon: string[] };
  notes: Record<string, string>;
  grades: string[];
  days: DayKey[];
  schedule: Record<string, GradeSchedule>;
};

/** A lesson resolved against the bell schedule. */
export type TimedLesson = Lesson & {
  /** Minutes from midnight; null when the bell grid has no slot for this number. */
  startMin: number | null;
  endMin: number | null;
};
