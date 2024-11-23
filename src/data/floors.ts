export const floors = [
  {
    id: 'eg',
    name: 'EG Schlosspark',
    rooms: [
      ...Array.from({ length: 27 }, (_, i) => `1${String(i + 1).padStart(2, '0')}`),
      'Gäste-WC',
      'Mitarbeiter-WC',
      'Behinderten-WC',
      'Pflegebad',
    ],
  },
  {
    id: '1og',
    name: '1.OG Ebertpark',
    rooms: [
      ...Array.from({ length: 27 }, (_, i) => `2${String(i + 1).padStart(2, '0')}`),
      'Gäste-WC',
      'Mitarbeiter-WC',
      'Behinderten-WC',
      'Pflegebad',
    ],
  },
  {
    id: '2og',
    name: '2.OG Rheinufer',
    rooms: [
      ...Array.from({ length: 27 }, (_, i) => `3${String(i + 1).padStart(2, '0')}`),
      'Gäste-WC',
      'Mitarbeiter-WC',
      'Behinderten-WC',
      'Pflegebad',
    ],
  },
  {
    id: '3og',
    name: '3.OG An den Seen',
    rooms: [
      ...Array.from({ length: 27 }, (_, i) => `4${String(i + 1).padStart(2, '0')}`),
      'Gäste-WC',
      'Mitarbeiter-WC',
      'Behinderten-WC',
      'Pflegebad',
    ],
  },
];