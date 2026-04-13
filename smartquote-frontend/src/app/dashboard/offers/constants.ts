// src/app/dashboard/offers/constants.ts

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

export const STATUS_OPTIONS = [
    { value: '', label: 'Wszystkie statusy' },
    { value: 'DRAFT', label: 'Szkic' },
    { value: 'SENT', label: 'Wysłana' },
    { value: 'VIEWED', label: 'Wyświetlona' },
    { value: 'NEGOTIATION', label: 'Negocjacje' },
    { value: 'ACCEPTED', label: 'Zaakceptowana' },
    { value: 'REJECTED', label: 'Odrzucona' },
    { value: 'EXPIRED', label: 'Wygasła' },
];

export const SORT_OPTIONS = [
    { value: 'createdAt:desc', label: 'Najnowsze' },
    { value: 'createdAt:asc', label: 'Najstarsze' },
    { value: 'totalGross:desc', label: 'Wartość malejąco' },
    { value: 'totalGross:asc', label: 'Wartość rosnąco' },
    { value: 'validUntil:asc', label: 'Termin ważności' },
];

export const TABLE_HEADERS = [
    { label: 'Oferta', align: 'left' as const },
    { label: 'Klient', align: 'left' as const },
    { label: 'Status', align: 'left' as const },
    { label: 'Dystrybucja', align: 'left' as const },
    { label: 'Wartość', align: 'right' as const },
    { label: 'Ważna do', align: 'left' as const },
    { label: 'Akcje', align: 'right' as const },
];