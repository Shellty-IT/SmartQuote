// src/app/dashboard/offers/[id]/constants.ts
import type { OfferStatus } from '@/types';

export type Tab = 'details' | 'analytics' | 'comments';

export const STATUS_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
    DRAFT: ['SENT'],
    SENT: ['VIEWED', 'NEGOTIATION', 'ACCEPTED', 'REJECTED'],
    VIEWED: ['NEGOTIATION', 'ACCEPTED', 'REJECTED'],
    NEGOTIATION: ['ACCEPTED', 'REJECTED', 'SENT'],
    ACCEPTED: [],
    REJECTED: ['DRAFT'],
    EXPIRED: ['DRAFT'],
};

export const INTENT_CONFIG: Record<string, { label: string; color: string }> = {
    likely_accept: { label: 'Prawdopodobna akceptacja', color: 'badge-success' },
    undecided: { label: 'Niezdecydowany', color: 'badge-warning' },
    likely_reject: { label: 'Prawdopodobne odrzucenie', color: 'badge-danger' },
    unknown: { label: 'Brak danych', color: 'badge-themed' },
};

export const INTERACTION_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    VIEW: { label: 'Otworzył ofertę', icon: '👁', color: 'text-blue-600 dark:text-blue-400' },
    ITEM_SELECT: { label: 'Zmienił wybór pozycji', icon: '☑', color: 'text-cyan-600 dark:text-cyan-400' },
    ACCEPT: { label: 'Zaakceptował ofertę', icon: '✅', color: 'text-emerald-600 dark:text-emerald-400' },
    REJECT: { label: 'Odrzucił ofertę', icon: '❌', color: 'text-red-600 dark:text-red-400' },
    COMMENT: { label: 'Dodał komentarz', icon: '💬', color: 'text-purple-600 dark:text-purple-400' },
    PDF_DOWNLOAD: { label: 'Pobrał PDF', icon: '📄', color: 'text-orange-600 dark:text-orange-400' },
    VARIANT_SWITCH: { label: 'Zmienił wariant', icon: '🔀', color: 'text-cyan-600 dark:text-cyan-400' },
};

export const TABS_CONFIG: { id: Tab; label: string }[] = [
    { id: 'details', label: 'Szczegóły' },
    { id: 'analytics', label: 'Analityka' },
    { id: 'comments', label: 'Komentarze' },
];