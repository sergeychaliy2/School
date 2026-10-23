import { useMemo } from 'react';

import { WARMUP_SLOT, attachBells } from '@/domain/bells';
import { lessonsFor } from '@/domain/schedule';
import type { DayKey, Lesson, TimedLesson } from '@/domain/types';
import { useApp } from '@/store/app';

const WARMUP: Lesson = { n: WARMUP_SLOT, subject: 'Утренняя зарядка', room: null };

/**
 * A day's lessons resolved against the current bell grid, with the morning
 * warm-up prepended — the scans print it above the numbered lessons every day,
 * and the bell sheet gives it a real 08:20–08:30 slot.
 *
 * Returns an empty list for a day with no lessons, so the warm-up never appears
 * on its own.
 */
export function useTimedDay(grade: string | null, day: DayKey | null): TimedLesson[] {
  const { bells } = useApp();

  return useMemo(() => {
    if (!grade || !day) return [];
    const lessons = lessonsFor(grade, day);
    if (lessons.length === 0) return [];
    return attachBells([WARMUP, ...lessons], bells);
  }, [grade, day, bells]);
}
