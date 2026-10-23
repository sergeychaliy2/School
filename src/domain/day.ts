import { DAY_KEYS, type DayKey, type TimedLesson } from './types';

/** Mon–Fri key for a date, or null on the weekend. */
export function dayKeyOf(date: Date): DayKey | null {
  const index = date.getDay(); // 0 = Sunday
  if (index === 0 || index === 6) return null;
  return DAY_KEYS[index - 1];
}

/** The next Mon–Fri key strictly after the given date. */
export function nextSchoolDay(date: Date): DayKey {
  const probe = new Date(date);
  for (let step = 0; step < 7; step += 1) {
    probe.setDate(probe.getDate() + 1);
    const key = dayKeyOf(probe);
    if (key) return key;
  }
  return 'mon';
}

export function minutesNow(date: Date): number {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

export type NowState =
  | { kind: 'weekend'; nextDay: DayKey }
  | { kind: 'free'; nextDay: DayKey }
  | { kind: 'before'; next: TimedLesson; minutesUntil: number }
  | {
      kind: 'lesson';
      current: TimedLesson;
      next: TimedLesson | null;
      progress: number;
      minutesLeft: number;
    }
  | { kind: 'break'; prev: TimedLesson; next: TimedLesson; progress: number; minutesLeft: number }
  | { kind: 'after'; last: TimedLesson; nextDay: DayKey };

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Resolves "what is happening right now" for one grade's day.
 *
 * `lessons` must already carry bell times. Entries without a bell slot (a lesson
 * number the grid does not cover) are ignored for timing but still render in the
 * list, so an unusual 8th slot never breaks the countdown.
 */
export function resolveNow(lessons: TimedLesson[], date: Date): NowState {
  const todayKey = dayKeyOf(date);
  if (!todayKey) return { kind: 'weekend', nextDay: nextSchoolDay(date) };

  const timed = lessons
    .filter((l): l is TimedLesson & { startMin: number; endMin: number } =>
      l.startMin !== null && l.endMin !== null,
    )
    .sort((a, b) => a.startMin - b.startMin);

  if (timed.length === 0) return { kind: 'free', nextDay: nextSchoolDay(date) };

  const now = minutesNow(date);
  const first = timed[0];
  const last = timed[timed.length - 1];

  if (now < first.startMin) {
    return { kind: 'before', next: first, minutesUntil: first.startMin - now };
  }

  if (now >= last.endMin) {
    return { kind: 'after', last, nextDay: nextSchoolDay(date) };
  }

  for (let i = 0; i < timed.length; i += 1) {
    const lesson = timed[i];

    if (now >= lesson.startMin && now < lesson.endMin) {
      const span = lesson.endMin - lesson.startMin;
      return {
        kind: 'lesson',
        current: lesson,
        next: timed[i + 1] ?? null,
        progress: span > 0 ? clamp01((now - lesson.startMin) / span) : 0,
        minutesLeft: lesson.endMin - now,
      };
    }

    const upcoming = timed[i + 1];
    if (upcoming && now >= lesson.endMin && now < upcoming.startMin) {
      const span = upcoming.startMin - lesson.endMin;
      return {
        kind: 'break',
        prev: lesson,
        next: upcoming,
        progress: span > 0 ? clamp01((now - lesson.endMin) / span) : 0,
        minutesLeft: upcoming.startMin - now,
      };
    }
  }

  return { kind: 'after', last, nextDay: nextSchoolDay(date) };
}

/** Index of the lesson that should be visually highlighted, or -1. */
export function activeLessonNumber(state: NowState): number {
  if (state.kind === 'lesson') return state.current.n;
  if (state.kind === 'break') return state.next.n;
  if (state.kind === 'before') return state.next.n;
  return -1;
}
