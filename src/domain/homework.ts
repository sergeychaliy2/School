import { DAY_KEYS, type DayKey } from './types';

/**
 * Homework is stored against a calendar date rather than a weekday, so a task
 * set for "next Tuesday" stays on that Tuesday instead of reappearing every
 * week. The schedule supplies the lessons for that date, so the student never
 * types a subject by hand.
 */

export type Homework = {
  id: string;
  /** Class the task belongs to — switching class must not mix tasks up. */
  grade: string;
  /** Local date, YYYY-MM-DD: the day the work is due. */
  date: string;
  subject: string;
  /** Lesson number that day, or null for something not tied to a slot. */
  lessonN: number | null;
  text: string;
  done: boolean;
  createdAt: number;
  /** Local file URIs of attached photos (camera or gallery). */
  photos?: string[];
};

/** Local date key. Built by hand so a timezone never shifts it a day. */
export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map((part) => Number.parseInt(part, 10));
  return new Date(y, m - 1, d);
}

/** Mon–Fri key for a date key, or null on the weekend. */
export function dayKeyForDate(key: string): DayKey | null {
  const index = parseDateKey(key).getDay();
  if (index === 0 || index === 6) return null;
  return DAY_KEYS[index - 1];
}

export function addDays(key: string, delta: number): string {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + delta);
  return dateKey(date);
}

export function startOfMonth(key: string): Date {
  const date = parseDateKey(key);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(key: string, delta: number): string {
  const date = parseDateKey(key);
  return dateKey(new Date(date.getFullYear(), date.getMonth() + delta, 1));
}

const MONTHS_NOMINATIVE = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

export function monthLabel(key: string): string {
  const date = parseDateKey(key);
  return `${MONTHS_NOMINATIVE[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Six weeks of dates covering the month `key` falls in, starting on Monday.
 * Fixed height keeps the grid from jumping as months change.
 */
export function monthGrid(key: string): string[] {
  const first = startOfMonth(key);
  const offset = (first.getDay() + 6) % 7; // Monday = 0
  const start = new Date(first);
  start.setDate(start.getDate() - offset);

  const cells: string[] = [];
  for (let i = 0; i < 42; i += 1) {
    const cell = new Date(start);
    cell.setDate(cell.getDate() + i);
    cells.push(dateKey(cell));
  }
  return cells;
}

/** The same 42 cells, grouped into six weeks. */
export function monthRows(key: string): string[][] {
  const cells = monthGrid(key);
  const rows: string[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

/**
 * Which week rows to draw when the calendar is collapsed.
 *
 * Drops weeks that are entirely in the past, and the trailing week that belongs
 * wholly to the next month — that is the padding making the grid look so tall.
 * The row holding the selected day is always kept, otherwise selecting an older
 * date would hide it.
 */
export function visibleRows(
  month: string,
  today: string,
  selected: string,
  expanded: boolean,
): { from: number; to: number } {
  const rows = monthRows(month);
  const last = rows.length - 1;
  if (expanded) return { from: 0, to: last };

  const rowWith = (date: string) => rows.findIndex((row) => row.includes(date));

  let from = 0;
  const todayRow = rowWith(today);
  if (todayRow > 0) from = todayRow;

  // Trim trailing weeks that hold no day of this month.
  let to = last;
  while (to > from && !rows[to].some((d) => isSameMonth(d, month))) to -= 1;

  const selectedRow = rowWith(selected);
  if (selectedRow >= 0) {
    if (selectedRow < from) from = selectedRow;
    if (selectedRow > to) to = selectedRow;
  }

  return { from, to };
}

export function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Tasks for one class on one date, newest-but-stable order (by lesson). */
export function tasksFor(all: Homework[], grade: string, date: string): Homework[] {
  return all
    .filter((task) => task.grade === grade && task.date === date)
    .sort((a, b) => (a.lessonN ?? 99) - (b.lessonN ?? 99) || a.createdAt - b.createdAt);
}

export function countsByDate(all: Homework[], grade: string): Map<string, { total: number; open: number }> {
  const map = new Map<string, { total: number; open: number }>();
  for (const task of all) {
    if (task.grade !== grade) continue;
    const entry = map.get(task.date) ?? { total: 0, open: 0 };
    entry.total += 1;
    if (!task.done) entry.open += 1;
    map.set(task.date, entry);
  }
  return map;
}

/** Tasks for one lesson on one date, in the order they were written. */
export function tasksForLesson(
  all: Homework[],
  grade: string,
  date: string,
  lessonN: number,
  subject: string,
): Homework[] {
  return all
    .filter(
      (task) =>
        task.grade === grade &&
        task.date === date &&
        task.lessonN === lessonN &&
        task.subject === subject,
    )
    .sort((a, b) => a.createdAt - b.createdAt);
}

export type Urgency = 'overdue' | 'today' | 'soon' | 'later' | 'done';

/**
 * How close a day's work is, for colouring the calendar. Anything still open
 * today or in the past is red; tomorrow is amber; further out stays calm.
 */
export function urgencyOf(date: string, open: number, total: number, today: string): Urgency {
  if (total === 0) return 'done';
  if (open === 0) return 'done';
  if (date < today) return 'overdue';
  if (date === today) return 'today';
  const daysAway = Math.round(
    (parseDateKey(date).getTime() - parseDateKey(today).getTime()) / 86_400_000,
  );
  return daysAway <= 1 ? 'soon' : 'later';
}

/** First and last day of the month a date falls in, as date keys. */
export function monthRange(key: string): { from: string; to: string } {
  const date = parseDateKey(key);
  const from = new Date(date.getFullYear(), date.getMonth(), 1);
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 0); // day 0 = last of previous
  return { from: dateKey(from), to: dateKey(to) };
}

/** Dates within an inclusive range, used by the bulk-clear actions. */
export function inRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}
