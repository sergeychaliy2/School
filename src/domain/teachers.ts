import { TEACHERS, type Teacher } from '@/data/teachers';
import { isPrimaryGrade } from './bells';

/**
 * Who teaches a subject.
 *
 * The school publishes subject areas, not class assignments, so most lookups
 * return candidates rather than an answer. A student can pin the real one per
 * class+subject; that pin lives on the device and always wins.
 */

export type TeacherMatch = {
  /** The pinned teacher, when the student has chosen one. */
  pinned: Teacher | null;
  /** Everyone the roster says could teach this. */
  candidates: Teacher[];
};

export type TeacherPins = Record<string, string>;

/** Key for a pin: one subject in one class. */
export function pinKey(grade: string, subject: string): string {
  return `${grade}::${subject.trim().toLowerCase()}`;
}

export function findTeachers(grade: string, subject: string, pins: TeacherPins): TeacherMatch {
  const pinnedName = pins[pinKey(grade, subject)];
  const pinned = pinnedName ? TEACHERS.find((t) => t.name === pinnedName) ?? null : null;

  const needle = subject.trim().toLowerCase();
  const bySubject = TEACHERS.filter((teacher) =>
    teacher.subjects.some((s) => s.trim().toLowerCase() === needle),
  );

  // Grades 1–4 are taught almost everything by their own class teacher, so the
  // primary-school staff are candidates there even for named subjects.
  const candidates =
    bySubject.length > 0 && !isPrimaryGrade(grade)
      ? bySubject
      : isPrimaryGrade(grade)
        ? [...bySubject, ...TEACHERS.filter((t) => t.primary)]
        : bySubject;

  return { pinned, candidates };
}

/** Everyone who could plausibly be pinned for this subject, for the picker. */
export function pickableFor(grade: string, subject: string): Teacher[] {
  const { candidates } = findTeachers(grade, subject, {});
  if (candidates.length > 0) return candidates;
  // Nothing matched (an unusual elective) — offer the whole teaching staff.
  return TEACHERS.filter((t) => t.subjects.length > 0 || t.primary);
}
