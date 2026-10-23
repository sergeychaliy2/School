const MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

/** "25 сентября" — written out rather than via Intl so it cannot vary by device ICU. */
export function formatDay(date: Date): string {
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}`;
}

export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 5) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}

/**
 * Russian plural agreement: 1 урок, 2 урока, 5 уроков — with the 11–14
 * exception, where everything takes the genitive plural.
 */
export function plural(count: number, forms: [string, string, string]): string {
  const abs = Math.abs(count) % 100;
  if (abs >= 11 && abs <= 14) return forms[2];
  const last = abs % 10;
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}

/** "7 уроков" — count plus the correctly agreeing noun. */
export function lessonsCount(count: number): string {
  return `${count} ${plural(count, ['урок', 'урока', 'уроков'])}`;
}

/** First name from a free-text "Фамилия Имя" / "Имя Фамилия" entry. */
export function shortName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  // Most students type "Имя Фамилия"; greet with whichever token is first.
  return parts[0];
}
