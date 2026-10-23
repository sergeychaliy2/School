import raw from '@/data/schedule.json';
import type { DayKey, GradeSchedule, Lesson, ScheduleDoc } from './types';

export const scheduleDoc = raw as unknown as ScheduleDoc;

export const GRADES = scheduleDoc.grades;

export function gradeLabel(grade: string): string {
  return `${grade} класс`;
}

export function hasGrade(grade: string | null | undefined): grade is string {
  return !!grade && Object.prototype.hasOwnProperty.call(scheduleDoc.schedule, grade);
}

export function gradeSchedule(grade: string): GradeSchedule | null {
  return scheduleDoc.schedule[grade] ?? null;
}

export function lessonsFor(grade: string, day: DayKey): Lesson[] {
  return scheduleDoc.schedule[grade]?.[day] ?? [];
}

/** Rituals the scans print above the numbered lessons. */
export function ritualsFor(day: DayKey): string[] {
  const daily = scheduleDoc.rituals.daily ?? [];
  const extra = day === 'mon' ? scheduleDoc.rituals.mon ?? [] : [];
  return [...daily, ...extra];
}

export function noteForGrade(grade: string): string | undefined {
  const isPrimary = Number.parseInt(grade, 10) <= 4;
  return scheduleDoc.notes[isPrimary ? '1-4' : '5-10'];
}

export function sourceForGrade(grade: string) {
  return scheduleDoc.sources.find((source) => source.grades.includes(grade)) ?? scheduleDoc.sources[0];
}

/** Total numbered lessons in a grade's week — used for the profile summary. */
export function weeklyLessonCount(grade: string): number {
  const week = gradeSchedule(grade);
  if (!week) return 0;
  return Object.values(week).reduce((sum, day) => sum + day.length, 0);
}
