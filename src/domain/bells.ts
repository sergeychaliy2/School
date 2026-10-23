/**
 * Bell schedule.
 *
 * Transcribed from the printed sheet on the school wall — the school publishes
 * it nowhere online, so this is the only machine-readable copy. Lessons run 40
 * minutes; slot 0 is the morning warm-up the timetable scans print above the
 * numbered lessons.
 *
 * Still editable in Settings, because a school can re-time its bells at any point
 * and nobody wants to wait for a new build.
 */
import type { Lesson, TimedLesson } from './types';

export type Bell = { n: number; start: string; end: string };

export const LESSON_MINUTES = 40;

/** n = 0 is «Утренняя зарядка»; 1..8 are the numbered lessons. */
export const DEFAULT_BELLS: Bell[] = [
  { n: 0, start: '08:20', end: '08:30' },
  { n: 1, start: '08:30', end: '09:10' },
  { n: 2, start: '09:25', end: '10:05' },
  { n: 3, start: '10:20', end: '11:00' },
  { n: 4, start: '11:10', end: '11:50' },
  { n: 5, start: '12:05', end: '12:45' },
  { n: 6, start: '13:00', end: '13:40' },
  { n: 7, start: '13:50', end: '14:30' },
  { n: 8, start: '14:40', end: '15:20' },
];

export const WARMUP_SLOT = 0;

/**
 * The long breaks are meal breaks, and the sheet splits them by school:
 * «начальная» is grades 1–4, «основная» is 5 and up.
 */
const MEALS: { afterLesson: number; meal: string; primary: boolean }[] = [
  { afterLesson: 1, meal: 'Завтрак', primary: true },
  { afterLesson: 2, meal: 'Завтрак', primary: false },
  { afterLesson: 4, meal: 'Обед', primary: true },
  { afterLesson: 5, meal: 'Обед', primary: false },
];

export function isPrimaryGrade(grade: string): boolean {
  return Number.parseInt(grade, 10) <= 4;
}

/** "Завтрак" when this break is the student's meal break, else null. */
export function mealForBreak(afterLesson: number, grade: string): string | null {
  const primary = isPrimaryGrade(grade);
  return MEALS.find((m) => m.afterLesson === afterLesson && m.primary === primary)?.meal ?? null;
}

/** Every meal break, for the bells reference screen. */
export function mealLabelFor(afterLesson: number): string | null {
  const hits = MEALS.filter((m) => m.afterLesson === afterLesson);
  if (hits.length === 0) return null;
  return hits
    .map((m) => `${m.meal} · ${m.primary ? '1–4 кл.' : '5–10 кл.'}`)
    .join(' · ');
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((part) => Number.parseInt(part, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const wrapped = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** "1 ч 20 мин" / "12 мин" — short human duration for countdowns. */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  if (total < 1) return 'меньше минуты';
  if (total < 60) return `${total} мин`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h} ч` : `${h} ч ${m} мин`;
}

export function isValidTime(hhmm: string): boolean {
  if (!/^\d{1,2}:\d{2}$/.test(hhmm)) return false;
  const [h, m] = hhmm.split(':').map((part) => Number.parseInt(part, 10));
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

/** Break length after a given lesson, in minutes, or null if it is the last one. */
export function breakAfter(bells: Bell[], n: number): number | null {
  const current = bells.find((b) => b.n === n);
  const next = bells.find((b) => b.n === n + 1);
  if (!current || !next) return null;
  return toMinutes(next.start) - toMinutes(current.end);
}

/** Shifts the whole grid so it starts at `start`, preserving every gap. */
export function rebuildFromStart(bells: Bell[], start: string): Bell[] {
  if (bells.length === 0) return bells;
  const delta = toMinutes(start) - toMinutes(bells[0].start);
  return bells.map((bell) => ({
    n: bell.n,
    start: fromMinutes(toMinutes(bell.start) + delta),
    end: fromMinutes(toMinutes(bell.end) + delta),
  }));
}

export function bellFor(bells: Bell[], n: number): Bell | undefined {
  return bells.find((bell) => bell.n === n);
}

export function attachBells(lessons: Lesson[], bells: Bell[]): TimedLesson[] {
  const byNumber = new Map(bells.map((bell) => [bell.n, bell]));
  return lessons.map((lesson) => {
    const bell = byNumber.get(lesson.n);
    return {
      ...lesson,
      startMin: bell ? toMinutes(bell.start) : null,
      endMin: bell ? toMinutes(bell.end) : null,
    };
  });
}
