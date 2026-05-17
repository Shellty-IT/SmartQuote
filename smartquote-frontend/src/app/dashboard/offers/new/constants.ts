// src/app/dashboard/offers/new/constants.ts

export type Step = 'client' | 'details' | 'items' | 'summary';

export const STEPS: { id: Step; label: string }[] = [
    { id: 'client', label: 'Klient' },
    { id: 'details', label: 'Szczegóły' },
    { id: 'items', label: 'Pozycje' },
    { id: 'summary', label: 'Podsumowanie' },
];

export const VAT_RATES = [
    { value: '23', label: '23%' },
    { value: '8', label: '8%' },
    { value: '5', label: '5%' },
    { value: '0', label: '0%' },
];

export const UNITS = [
    { value: 'szt.', label: 'szt.' },
    { value: 'godz.', label: 'godz.' },
    { value: 'dni', label: 'dni' },
    { value: 'kg', label: 'kg' },
    { value: 'm', label: 'm' },
    { value: 'm²', label: 'm²' },
    { value: 'kpl.', label: 'kpl.' },
    { value: 'usł.', label: 'usł.' },
];