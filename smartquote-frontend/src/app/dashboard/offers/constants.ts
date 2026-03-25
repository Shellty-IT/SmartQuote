// src/app/dashboard/offers/constants.ts

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