// src/app/dashboard/offers/components/OfferTableRow.tsx

import { Eye, Pencil, Copy, Trash2, Link as LinkIcon } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, formatCurrency, getInitials, cn } from '@/lib/utils';
import { useTranslations } from '@/i18n';
import type { Offer } from '@/types';
import { resolveTemplatePrice } from '@/lib/offer-template-price';

interface OfferTableRowProps {
    offer: Offer;
    onView: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onCopyLink: () => void;
}

export function OfferTableRow({ offer, onView, onEdit, onDuplicate, onDelete, onCopyLink }: OfferTableRowProps) {
    const tr = useTranslations('offerDetail');
    const commonTr = useTranslations('common');
    const templatePrice = resolveTemplatePrice(offer.blocks, offer.templateType);
    const totalGross = templatePrice?.gross ?? Number(offer.totalGross);
    const totalNet = templatePrice?.net ?? Number(offer.totalNet);
    const recipient = offer.client ?? offer.lead;

    const isExpired =
        offer.validUntil &&
        new Date(offer.validUntil) < new Date() &&
        !['EXPIRED', 'ACCEPTED', 'REJECTED'].includes(offer.status);

    const hasInvoice = !!offer.invoiceSentAt;

    const actions = [
        { Icon: Eye,    fn: onView,      title: tr.details.title, hover: 'hover:text-primary' },
        { Icon: Pencil, fn: onEdit,      title: tr.edit,          hover: 'hover:text-primary' },
        { Icon: Copy,   fn: onDuplicate, title: tr.duplicate,     hover: 'hover:text-primary' },
        { Icon: Trash2, fn: onDelete,    title: commonTr.delete,  hover: 'hover:text-destructive hover:bg-destructive/10' },
    ];

    return (
        <tr
            className="cursor-pointer border-b border-border transition-colors hover:bg-secondary/40"
            onClick={onView}
        >
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div>
                        <p className="font-semibold leading-tight">{offer.title}</p>
                        <p className="font-mono text-xs text-muted-foreground">{offer.number}</p>
                    </div>
                    {hasInvoice && (
                        <span className="shrink-0 rounded bg-[oklch(0.72_0.16_60)/15%] p-0.5" title={tr.invoiceSent}>
                            <svg className="h-3 w-3 text-[oklch(0.55_0.14_60)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </span>
                    )}
                </div>
            </td>

            <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-primary text-[10px] font-bold text-white">
                        {getInitials(recipient?.name || '?')}
                    </div>
                    <span className="text-sm font-medium">{recipient?.name || commonTr.unknown}</span>
                </div>
            </td>

            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <StatusBadge status={offer.status} />
                    {isExpired && <StatusBadge status="EXPIRED" />}
                </div>
            </td>

            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                {offer.publicToken ? (
                    <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full border border-status-open/25 bg-[color-mix(in_oklab,var(--status-open)_12%,transparent)] px-2 py-0.5 text-[11px] font-semibold text-status-open">
                            <span className="h-1.5 w-1.5 rounded-full bg-status-open" />
                            {commonTr.active}
                        </span>
                        <button onClick={onCopyLink} className="rounded p-1 text-muted-foreground transition hover:text-primary" title={commonTr.copyLink}>
                            <LinkIcon className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                )}
            </td>

            <td className="px-4 py-3 text-right">
                <p className="font-semibold tabular-nums">{formatCurrency(totalGross)}</p>
                <p className="text-xs text-muted-foreground tabular-nums">{tr.details.subtotal.replace(':', '')} {formatCurrency(totalNet)}</p>
            </td>

            <td className="px-4 py-3">
                <span className={cn('text-sm', isExpired ? 'font-semibold text-status-rejected' : 'text-muted-foreground')}>
                    {offer.validUntil ? formatDate(offer.validUntil) : '—'}
                </span>
            </td>

            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-0.5">
                    {actions.map(({ Icon, fn, title, hover }) => (
                        <button key={title} onClick={fn} title={title} className={cn('rounded-lg p-2 text-muted-foreground transition-colors', hover)}>
                            <Icon className="h-4 w-4" />
                        </button>
                    ))}
                </div>
            </td>
        </tr>
    );
}
