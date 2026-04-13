// src/app/dashboard/offers/[id]/constants.ts

import type { OfferStatus } from '@/types';

export type Tab = 'details' | 'analytics' | 'comments' | 'emails';

export const TABS_CONFIG: { id: Tab; label: string }[] = [
    { id: 'details', label: 'Szczegóły' },
    { id: 'analytics', label: 'Analityka' },
    { id: 'comments', label: 'Komentarze' },
    { id: 'emails', label: 'Emaile' },
];

export const STATUS_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
    DRAFT: ['SENT'],
    SENT: ['VIEWED', 'NEGOTIATION', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
    VIEWED: ['NEGOTIATION', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
    NEGOTIATION: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
    ACCEPTED: [],
    REJECTED: ['DRAFT'],
    EXPIRED: ['DRAFT'],
};

export const INTERACTION_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    VIEW: { label: 'Wyświetlenie oferty', icon: '👁️', color: 'text-blue-600 dark:text-blue-400' },
    ACCEPT: { label: 'Akceptacja oferty', icon: '✅', color: 'text-emerald-600 dark:text-emerald-400' },
    REJECT: { label: 'Odrzucenie oferty', icon: '❌', color: 'text-red-600 dark:text-red-400' },
    COMMENT: { label: 'Komentarz klienta', icon: '💬', color: 'text-cyan-600 dark:text-cyan-400' },
    DOWNLOAD: { label: 'Pobranie PDF', icon: '📄', color: 'text-violet-600 dark:text-violet-400' },
    VARIANT_SWITCH: { label: 'Zmiana wariantu', icon: '🔄', color: 'text-amber-600 dark:text-amber-400' },
    QUANTITY_CHANGE: { label: 'Zmiana ilości', icon: '🔢', color: 'text-orange-600 dark:text-orange-400' },
};

export const INTENT_CONFIG: Record<string, { label: string; color: string }> = {
    high_interest: { label: '🔥 Wysokie zainteresowanie', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
    medium_interest: { label: '👀 Średnie zainteresowanie', color: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300' },
    low_interest: { label: '😐 Niskie zainteresowanie', color: 'bg-slate-500/15 text-slate-600 dark:text-slate-400' },
    negotiating: { label: '🤝 Negocjuje', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
    ready_to_buy: { label: '💰 Gotowy do zakupu', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
    hesitating: { label: '🤔 Waha się', color: 'bg-orange-500/15 text-orange-700 dark:text-orange-300' },
    unknown: { label: '❓ Brak danych', color: 'bg-slate-500/15 text-slate-600 dark:text-slate-400' },
};