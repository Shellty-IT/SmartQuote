// src/app/dashboard/offers/[id]/constants.ts

import type { OfferStatus } from '@/types';

export type Tab = 'details' | 'analytics' | 'comments' | 'emails' | 'template';

export const TAB_IDS: Tab[] = ['details', 'analytics', 'comments', 'emails', 'template'];

export const STATUS_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
    DRAFT: ['SENT'],
    SENT: ['VIEWED', 'NEGOTIATION', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
    VIEWED: ['NEGOTIATION', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
    NEGOTIATION: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
    ACCEPTED: [],
    REJECTED: ['DRAFT'],
    EXPIRED: ['DRAFT'],
};

export const INTERACTION_TYPE_CONFIG: Record<string, { icon: string; color: string; eventKey: string }> = {
    VIEW:            { icon: '👁️', color: 'text-blue-600 dark:text-blue-400',   eventKey: 'OFFER_VIEWED' },
    ACCEPT:          { icon: '✅', color: 'text-status-accepted',               eventKey: 'OFFER_ACCEPTED' },
    REJECT:          { icon: '❌', color: 'text-status-rejected',               eventKey: 'OFFER_REJECTED' },
    COMMENT:         { icon: '💬', color: 'text-primary',                       eventKey: 'OFFER_COMMENT' },
    DOWNLOAD:        { icon: '📄', color: 'text-violet-600 dark:text-violet-400', eventKey: 'PDF_DOWNLOADED' },
    VARIANT_SWITCH:  { icon: '🔄', color: 'text-[oklch(0.55_0.14_60)]',         eventKey: 'VARIANT_CHANGED' },
    QUANTITY_CHANGE: { icon: '🔢', color: 'text-orange-600 dark:text-orange-400', eventKey: 'QUANTITY_CHANGED' },
};

export const INTENT_CONFIG: Record<string, { emoji: string; intentKey: string; color: string }> = {
    high_interest:  { emoji: '🔥', intentKey: 'high',        color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
    medium_interest:{ emoji: '👀', intentKey: 'medium',      color: 'bg-primary/10 text-cyan-700 dark:text-cyan-300' },
    low_interest:   { emoji: '😐', intentKey: 'low',         color: 'bg-slate-500/15 text-slate-600 dark:text-slate-400' },
    negotiating:    { emoji: '🤝', intentKey: 'negotiating', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
    ready_to_buy:   { emoji: '💰', intentKey: 'ready',       color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
    hesitating:     { emoji: '🤔', intentKey: 'hesitant',    color: 'bg-orange-500/15 text-orange-700 dark:text-orange-300' },
    unknown:        { emoji: '❓', intentKey: 'noData',      color: 'bg-slate-500/15 text-slate-600 dark:text-slate-400' },
};
