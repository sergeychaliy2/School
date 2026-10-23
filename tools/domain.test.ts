/**
 * Checks on the bell/now engine. Run with: npm run test:domain
 *
 * These matter because the timing logic is invisible until it is wrong — a bad
 * boundary means a student sees "перемена" while sitting in a lesson.
 */
import {
  DEFAULT_BELLS,
  attachBells,
  breakAfter,
  formatDuration,
  isValidTime,
  mealForBreak,
  rebuildFromStart,
} from '../src/domain/bells';
import { dayKeyOf, nextSchoolDay, resolveNow } from '../src/domain/day';
import { lessonsCount, shortName } from '../src/domain/format';
import { addDays, dateKey, monthRange, monthRows, urgencyOf, visibleRows } from '../src/domain/homework';
import type { Lesson } from '../src/domain/types';

let failures = 0;
let checks = 0;

function check(label: string, actual: unknown, expected: unknown) {
  checks += 1;
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures += 1;
    console.error(`  FAIL  ${label}\n        ожидалось ${e}\n        получено  ${a}`);
  }
}

// A grade-5 Monday: warm-up plus five lessons.
const MONDAY: Lesson[] = [
  { n: 0, subject: 'Утренняя зарядка', room: null },
  { n: 1, subject: 'Труд', room: '4' },
  { n: 2, subject: 'Русский язык', room: '8' },
  { n: 3, subject: 'Математика', room: '10' },
  { n: 4, subject: 'Литература', room: '4' },
  { n: 5, subject: 'История', room: '5' },
];

const timed = attachBells(MONDAY, DEFAULT_BELLS);
// 2026-09-28 is a Monday; 2026-09-26 a Saturday.
const monday = (h: number, m: number) => new Date(2026, 8, 28, h, m, 0);

console.log('bells');
check('warm-up is 08:20–08:30', [timed[0].startMin, timed[0].endMin], [500, 510]);
check('lesson 1 is 08:30–09:10', [timed[1].startMin, timed[1].endMin], [510, 550]);
check('lessons run 40 minutes', timed[3].endMin! - timed[3].startMin!, 40);
check('break after lesson 1 is 15 min', breakAfter(DEFAULT_BELLS, 1), 15);
check('break after lesson 3 is 10 min', breakAfter(DEFAULT_BELLS, 3), 10);
check('no break after the last slot', breakAfter(DEFAULT_BELLS, 8), null);

console.log('meals');
check('1–4 eat breakfast after lesson 1', mealForBreak(1, '3'), 'Завтрак');
check('5–10 do not eat after lesson 1', mealForBreak(1, '7'), null);
check('5–10 eat breakfast after lesson 2', mealForBreak(2, '7'), 'Завтрак');
check('1–4 eat lunch after lesson 4', mealForBreak(4, '2'), 'Обед');
check('5–10 eat lunch after lesson 5', mealForBreak(5, '10'), 'Обед');

console.log('calendar');
check('Monday resolves', dayKeyOf(monday(9, 0)), 'mon');
check('Saturday is weekend', dayKeyOf(new Date(2026, 8, 26, 9, 0)), null);
check('after Friday comes Monday', nextSchoolDay(new Date(2026, 8, 25, 9, 0)), 'mon');

console.log('now/next');
{
  const s = resolveNow(timed, monday(7, 10));
  check('07:10 is before school', s.kind, 'before');
  if (s.kind === 'before') {
    check('  next up is the warm-up', s.next.n, 0);
    check('  70 minutes to go', Math.round(s.minutesUntil), 70);
  }
}
{
  const s = resolveNow(timed, monday(8, 25));
  check('08:25 is the warm-up', s.kind, 'lesson');
  if (s.kind === 'lesson') {
    check('  warm-up is half done', Math.round(s.progress * 100), 50);
    check('  lesson 1 is next', s.next?.n, 1);
  }
}
{
  const s = resolveNow(timed, monday(8, 50));
  check('08:50 is lesson 1', s.kind, 'lesson');
  if (s.kind === 'lesson') {
    check('  lesson 1 is half done', Math.round(s.progress * 100), 50);
    check('  20 minutes left', Math.round(s.minutesLeft), 20);
  }
}
{
  const s = resolveNow(timed, monday(9, 15));
  check('09:15 is a break', s.kind, 'break');
  if (s.kind === 'break') {
    check('  break follows lesson 1', s.prev.n, 1);
    check('  lesson 2 is next', s.next.n, 2);
    check('  10 minutes of break left', Math.round(s.minutesLeft), 10);
  }
}
{
  const s = resolveNow(timed, monday(9, 10));
  check('09:10 sharp is already the break', s.kind, 'break');
}
{
  const s = resolveNow(timed, monday(8, 30));
  check('08:30 sharp is lesson 1, not the warm-up', s.kind === 'lesson' && s.current.n, 1);
}
{
  const s = resolveNow(timed, monday(14, 0));
  check('14:00 is after school', s.kind, 'after');
  if (s.kind === 'after') check('  last lesson was 5th', s.last.n, 5);
}
{
  const s = resolveNow(timed, new Date(2026, 8, 26, 10, 0));
  check('Saturday is a weekend', s.kind, 'weekend');
}
{
  const s = resolveNow([], monday(10, 0));
  check('a day with no lessons is free', s.kind, 'free');
}

console.log('helpers');
check('shifting keeps gaps', rebuildFromStart(DEFAULT_BELLS, '09:20')[1].start, '09:30');
check('shifting moves the whole grid', rebuildFromStart(DEFAULT_BELLS, '09:20')[0].start, '09:20');
check('duration under an hour', formatDuration(42), '42 мин');
check('duration over an hour', formatDuration(95), '1 ч 35 мин');
check('duration on the hour', formatDuration(120), '2 ч');
check('25:00 is not a time', isValidTime('25:00'), false);
check('08:30 is a time', isValidTime('08:30'), true);

console.log('russian plurals');
check('1 урок', lessonsCount(1), '1 урок');
check('2 урока', lessonsCount(2), '2 урока');
check('4 урока', lessonsCount(4), '4 урока');
check('5 уроков', lessonsCount(5), '5 уроков');
check('7 уроков', lessonsCount(7), '7 уроков');
check('11 уроков, not 11 урок', lessonsCount(11), '11 уроков');
check('12 уроков', lessonsCount(12), '12 уроков');
check('14 уроков', lessonsCount(14), '14 уроков');
check('21 урок', lessonsCount(21), '21 урок');
check('23 урока', lessonsCount(23), '23 урока');
check('0 уроков', lessonsCount(0), '0 уроков');
check('greets by first token', shortName('Сергей Виарович'), 'Сергей');
check('handles stray spacing', shortName('  Аня   '), 'Аня');

console.log('homework dates');
check('date key is local, not UTC', dateKey(new Date(2026, 8, 25, 23, 30)), '2026-09-25');
check('adding days crosses a month', addDays('2026-09-30', 1), '2026-10-01');
check('subtracting days crosses back', addDays('2026-10-01', -1), '2026-09-30');
check('september ends on the 30th', monthRange('2026-09-15'), { from: '2026-09-01', to: '2026-09-30' });
check('february 2028 is a leap month', monthRange('2028-02-10'), { from: '2028-02-01', to: '2028-02-29' });

console.log('homework urgency');
const today = '2026-09-25';
check('nothing set is calm', urgencyOf(today, 0, 0, today), 'done');
check('all done is calm', urgencyOf(today, 0, 3, today), 'done');
check('due today is urgent', urgencyOf(today, 1, 2, today), 'today');
check('missed is urgent', urgencyOf('2026-09-24', 1, 1, today), 'overdue');
check('tomorrow is a warning', urgencyOf('2026-09-26', 1, 1, today), 'soon');
check('next week is calm', urgencyOf('2026-10-02', 1, 1, today), 'later');

console.log('calendar collapsing');
// September 2026: the 1st is a Tuesday, so the grid starts on Aug 31.
check('grid is six weeks', monthRows('2026-09-15').length, 6);
check('each week has seven days', monthRows('2026-09-15')[0].length, 7);
check('expanded shows everything', visibleRows('2026-09-15', '2026-09-25', '2026-09-25', true), {
  from: 0,
  to: 5,
});
{
  // Collapsed on the 25th: weeks before it go, and the all-October tail goes.
  const r = visibleRows('2026-09-15', '2026-09-25', '2026-09-25', false);
  check('collapsed starts at the current week', r.from, 3);
  check('collapsed drops the padding week', r.to, 4);
}
{
  // Selecting an earlier date must not hide it.
  const r = visibleRows('2026-09-15', '2026-09-25', '2026-09-03', false);
  check('a selected past week is kept', r.from, 0);
}
{
  // A month that does not hold today collapses only its trailing padding.
  const r = visibleRows('2026-11-10', '2026-09-25', '2026-11-10', false);
  check('other month starts at the top', r.from, 0);
  check('other month still drops padding', r.to <= 5, true);
}

console.log(
  failures === 0
    ? `\nOK — ${checks} проверок прошли\n`
    : `\n${failures} из ${checks} проверок упали\n`,
);
process.exit(failures === 0 ? 0 : 1);
