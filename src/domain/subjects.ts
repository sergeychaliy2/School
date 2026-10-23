import type Ionicons from '@expo/vector-icons/Ionicons';

import type { AccentName } from '@/theme/tokens';

/**
 * Maps the free-text subject names printed on the school's scans onto an icon
 * and an accent family. The scans are inconsistent ("Англ. яз." vs "Английский
 * язык", "Физкультура" vs "Физическая культура"), so matching is by normalised
 * prefix rather than exact equality.
 *
 * Icon names are typed against the Ionicons glyph map, so a typo fails the build
 * instead of rendering an empty square.
 */

export type IconName = keyof typeof Ionicons.glyphMap;

type Rule = { match: string[]; accent: AccentName; icon: IconName; short?: string };

const RULES: Rule[] = [
  { match: ['русский язык'], accent: 'language', icon: 'text' },
  { match: ['литературное чтение'], accent: 'language', icon: 'book', short: 'Лит. чтение' },
  { match: ['литература'], accent: 'language', icon: 'book' },
  { match: ['анализ текста'], accent: 'language', icon: 'document-text' },
  { match: ['секреты рус'], accent: 'language', icon: 'document-text', short: 'Секреты рус. яз.' },
  { match: ['основы рус'], accent: 'language', icon: 'document-text', short: 'Основы рус. слов.' },

  { match: ['математика'], accent: 'math', icon: 'calculator' },
  { match: ['алгебра'], accent: 'math', icon: 'calculator' },
  { match: ['геометрия'], accent: 'math', icon: 'triangle' },
  { match: ['вероят'], accent: 'math', icon: 'stats-chart', short: 'Вероятность и статистика' },
  { match: ['занимат'], accent: 'math', icon: 'extension-puzzle', short: 'Занимат. математика' },
  { match: ['черчение'], accent: 'math', icon: 'pencil', short: 'Черчение и графика' },

  { match: ['физика'], accent: 'physics', icon: 'magnet' },
  { match: ['химия'], accent: 'chemistry', icon: 'flask' },

  { match: ['биология'], accent: 'biology', icon: 'leaf' },
  { match: ['за стран'], accent: 'biology', icon: 'leaf', short: 'За страницами биологии' },
  { match: ['окружающий мир'], accent: 'biology', icon: 'earth' },

  { match: ['география'], accent: 'geography', icon: 'map' },
  { match: ['страноведение'], accent: 'geography', icon: 'compass' },

  { match: ['история'], accent: 'history', icon: 'hourglass' },
  { match: ['обществозн'], accent: 'history', icon: 'people', short: 'Обществознание' },
  { match: ['путь к истории'], accent: 'history', icon: 'hourglass' },
  { match: ['орксэ'], accent: 'history', icon: 'heart' },

  { match: ['англ'], accent: 'foreign', icon: 'language', short: 'Английский язык' },
  { match: ['нем'], accent: 'foreign', icon: 'language', short: 'Немецкий язык' },

  { match: ['информатика'], accent: 'computing', icon: 'code-slash' },
  { match: ['шаги в информат'], accent: 'computing', icon: 'code-slash', short: 'Шаги в информатику' },
  { match: ['проект'], accent: 'computing', icon: 'bulb' },

  { match: ['физкультура', 'физическая культура'], accent: 'sport', icon: 'basketball', short: 'Физкультура' },
  { match: ['утренняя зарядка'], accent: 'sport', icon: 'fitness' },

  { match: ['труд'], accent: 'craft', icon: 'hammer' },

  { match: ['изо'], accent: 'art', icon: 'color-palette', short: 'ИЗО' },
  { match: ['музыка'], accent: 'art', icon: 'musical-notes' },

  { match: ['обизр'], accent: 'safety', icon: 'shield-checkmark', short: 'ОБиЗР' },
  { match: ['гвардейская смена'], accent: 'safety', icon: 'ribbon' },

  { match: ['профориентация'], accent: 'neutral', icon: 'briefcase' },
  { match: ['разговоры о важном'], accent: 'neutral', icon: 'chatbubble-ellipses' },
];

export type SubjectMeta = { accent: AccentName; icon: IconName; label: string };

const FALLBACK: Omit<SubjectMeta, 'label'> = { accent: 'neutral', icon: 'ellipse' };

const cache = new Map<string, SubjectMeta>();

export function subjectMeta(subject: string): SubjectMeta {
  const hit = cache.get(subject);
  if (hit) return hit;

  const needle = subject.trim().toLowerCase();
  const rule = RULES.find((candidate) => candidate.match.some((m) => needle.startsWith(m)));

  const meta: SubjectMeta = rule
    ? { accent: rule.accent, icon: rule.icon, label: rule.short ?? subject.trim() }
    : { ...FALLBACK, label: subject.trim() };

  cache.set(subject, meta);
  return meta;
}
