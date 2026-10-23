/** Public contact details, taken from the school's own site. */
export const SCHOOL = {
  name: 'МАОУ «Новоселицкая СОШ»',
  shortName: 'Новоселицкая СОШ',
  site: 'https://sh-novoselickaya-r49.gosweb.gosuslugi.ru/',
  schedulePage: 'https://sh-novoselickaya-r49.gosweb.gosuslugi.ru/glavnoe/raspisanie/',
  phone: '+78162740522',
  phoneLabel: '+7 (816) 274-05-22',
  email: 'novosels@yandex.ru',
  director: 'Мисюля Галина Владимировна',
  directorHours: '15:00–17:00',
  library: 'Библиотека: 9:00–17:00',
  links: [
    { label: 'Электронный дневник', url: 'https://dnevnik.ru/' },
    { label: 'ФГИС «Моя школа»', url: 'https://myschool.edu.ru/' },
    { label: 'Сайт школы', url: 'https://sh-novoselickaya-r49.gosweb.gosuslugi.ru/' },
    {
      label: 'Секции и кружки',
      url: 'https://sh-novoselickaya-r49.gosweb.gosuslugi.ru/roditelyam-i-uchenikam/sektsii-i-kruzhki/raspisanie-sektsiy-i-kruzhkov/',
    },
  ],
} as const;
