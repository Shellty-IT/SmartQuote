// src/app/dashboard/offers/components/OfferTableRow.tsx

import { Badge } from '@/components/ui';
import { formatDate, formatCurrency, getStatusConfig, getInitials } from '@/lib/utils';
import type { Offer } from '@/types';

interface OfferTableRowProps {
    offer: Offer;
    onView: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onCopyLink: () => void;
}

export function OfferTableRow({ offer, onView, onEdit, onDuplicate, onDelete, onCopyLink }: OfferTableRowProps) {
    const statusConfig = getStatusConfig(offer.status);
    const isExpired =
        offer.validUntil &&
        new Date(offer.validUntil) < new Date() &&
        offer.status !== 'EXPIRED' &&
        offer.status !== 'ACCEPTED' &&
        offer.status !== 'REJECTED';

    return (
        <tr
            className="hover-themed transition-colors cursor-pointer"
            onClick={onView}
        >
            <td className="px-6 py-4">
                <div>
                    <p className="font-medium text-themed">{offer.title}</p>
                    <p className="text-sm text-themed-muted">{offer.number}</p>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-xs font-semibold">
                        {getInitials(offer.client?.name || '?')}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-themed">
                            {offer.client?.name || 'Nieznany'}
                        </p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.label}
                    </Badge>
                    {isExpired && (
                        <Badge variant="danger" size="sm">Wygasła</Badge>
                    )}
                </div>
            </td>
            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                {offer.publicToken ? (
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                            Link aktywny
                        </span>
                        <button
                            onClick={onCopyLink}
                            className="p-1 text-themed-muted hover:text-cyan-600 dark:hover:text-cyan-400 rounded transition-colors"
                            title="Kopiuj link"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <span className="text-xs text-themed-muted">—</span>
                )}
            </td>
            <td className="px-6 py-4 text-right">
                <p className="font-semibold text-themed">
                    {formatCurrency(Number(offer.totalGross))}
                </p>
                <p className="text-xs text-themed-muted">
                    netto: {formatCurrency(Number(offer.totalNet))}
                </p>
            </td>
            <td className="px-6 py-4">
                <span className={isExpired ? 'text-red-600 dark:text-red-400 font-medium' : 'text-themed-muted'}>
                    {offer.validUntil ? formatDate(offer.validUntil) : '-'}
                </span>
            </td>
            <td className="px-6 py-4 text-right">
                <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onView}
                        className="p-2 text-themed-muted hover:text-themed hover-themed rounded-lg transition-colors"
                        title="Szczegóły"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                    <button
                        onClick={onEdit}
                        className="p-2 text-themed-muted hover:text-themed hover-themed rounded-lg transition-colors"
                        title="Edytuj"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                    <button
                        onClick={onDuplicate}
                        className="p-2 text-themed-muted hover:text-themed hover-themed rounded-lg transition-colors"
                        title="Duplikuj"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 text-themed-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Usuń"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    );
}