/**
 * Staff roster, taken from the school's own «Педагогический состав» page
 * (three pages, verified name→role pairs — the summary on the home page
 * interleaves them differently and is not reliable).
 *
 * The site publishes what each teacher teaches, but not which classes they
 * take. Several subjects therefore have more than one candidate, and primary
 * school has six teachers for four classes. So this file is the roster, and the
 * actual per-class assignment is something the student pins in the app
 * (Settings → «Учителя»), stored on the device.
 */

export type Teacher = {
  name: string;
  role: string;
  /** Subjects as they appear on the timetable scans. */
  subjects: string[];
  /** true when the role only says "начальных классов" — grades 1–4, any subject. */
  primary?: boolean;
};

export const TEACHERS: Teacher[] = [
  { name: 'Мисюля Галина Владимировна', role: 'Директор', subjects: [] },
  {
    name: 'Каминская Римма Дмитриевна',
    role: 'Заместитель директора по учебно-воспитательной работе',
    subjects: [],
  },
  {
    name: 'Абрамова Елена Владимировна',
    role: 'Заместитель директора по учебно-воспитательной работе',
    subjects: [],
  },
  { name: 'Жирова Жанна Алексеевна', role: 'Заведующая филиалом', subjects: [] },

  {
    name: 'Яковлева Наталья Петровна',
    role: 'Учитель биологии и химии',
    subjects: ['Биология', 'Химия', 'За стран. биолог'],
  },
  {
    name: 'Бутаков Сергей Владимирович',
    role: 'Учитель биологии и химии',
    subjects: ['Биология', 'Химия', 'За стран. биолог'],
  },
  {
    name: 'Антонова Наталья Владимировна',
    role: 'Учитель физики и информатики',
    subjects: ['Физика', 'Информатика', 'Шаги в информат', 'Проект'],
  },
  {
    name: 'Максимова Марина Николаевна',
    role: 'Учитель математики',
    subjects: ['Математика', 'Алгебра', 'Геометрия', 'Вероятн. и стат', 'Вероят. и стат.', 'Занимат. матем.', 'Черчение и граф'],
  },
  {
    name: 'Дмитриева Елена Викторовна',
    role: 'Учитель русского языка и литературы',
    subjects: ['Русский язык', 'Литература', 'Анализ текста', 'Секреты рус.яз.', 'Основы рус. слов.'],
  },
  {
    name: 'Балакина Оксана Михайловна',
    role: 'Учитель русского языка и литературы',
    subjects: ['Русский язык', 'Литература', 'Анализ текста', 'Секреты рус.яз.', 'Основы рус. слов.'],
  },
  {
    name: 'Калягина Ольга Александровна',
    role: 'Учитель английского языка',
    subjects: ['Англ. яз.', 'Английский язык', 'Страноведение'],
  },
  {
    name: 'Большакова Ольга Викторовна',
    role: 'Учитель немецкого языка',
    subjects: ['Нем. яз.'],
  },
  { name: 'Бан Ольга Юрьевна', role: 'Учитель технологии', subjects: ['Труд', 'Труд (технология)'] },
  {
    name: 'Кудряшов Шамиль Рафикович',
    role: 'Учитель физической культуры и трудового обучения',
    subjects: ['Физкультура', 'Физическая культура', 'Труд', 'Труд (технология)', 'Утренняя зарядка'],
  },
  { name: 'Сидорова Елена Васильевна', role: 'Учитель музыки', subjects: ['Музыка'] },
  {
    name: 'Кузьмина Светлана Сергеевна',
    role: 'Учитель музыки, учитель-логопед',
    subjects: ['Музыка'],
  },
  { name: 'Долгова Дарья Антоновна', role: 'Учитель-логопед', subjects: [] },

  { name: 'Мельникова Анжелла Александровна', role: 'Учитель начальных классов', subjects: [], primary: true },
  { name: 'Омецинская Маргарита Николаевна', role: 'Учитель начальных классов', subjects: [], primary: true },
  { name: 'Башкина Светлана Евтихиевна', role: 'Учитель начальных классов', subjects: [], primary: true },
  { name: 'Алексеева Людмила Викторовна', role: 'Учитель начальных классов', subjects: [], primary: true },
  { name: 'Киселёва Оксана Валериевна', role: 'Учитель начальных классов', subjects: [], primary: true },
  { name: 'Гончарова Татьяна Сергеевна', role: 'Учитель начальных классов', subjects: [], primary: true },
];

/** "Иванова Мария Петровна" → "Иванова М. П." for tight rows. */
export function shortTeacher(name: string): string {
  const [last, first, middle] = name.split(/\s+/);
  const initials = [first, middle]
    .filter(Boolean)
    .map((part) => `${part[0]}.`)
    .join(' ');
  return initials ? `${last} ${initials}` : last;
}
