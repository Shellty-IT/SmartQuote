// src/app/dashboard/offers/components/OffersPagination.tsx

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OffersPaginationProps {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
}

function getVisiblePages(page: number, totalPages: number): number[] {
    const max = 5;
    if (totalPages <= max) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return Array.from({ length: max }, (_, i) => i + 1);
    if (page >= totalPages - 2) return Array.from({ length: max }, (_, i) => totalPages - 4 + i);
    return Array.from({ length: max }, (_, i) => page - 2 + i);
}

function PageBtn({ active, disabled, onClick, children }: {
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'grid h-8 w-8 place-items-center rounded-lg text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40',
                active
                    ? 'bg-gradient-primary text-white shadow-glow'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
        >
            {children}
        </button>
    );
}

export function OffersDesktopPagination({ page, totalPages, total, onPageChange }: OffersPaginationProps) {
    if (totalPages <= 1) return null;
    const visible = getVisiblePages(page, totalPages);
    const perPage = 10;

    return (
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">
                {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} z {total} ofert
            </p>
            <div className="flex items-center gap-1">
                <PageBtn disabled={page === 1} onClick={() => onPageChange(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                </PageBtn>
                {visible.map((p) => (
                    <PageBtn key={p} active={p === page} onClick={() => onPageChange(p)}>
                        {p}
                    </PageBtn>
                ))}
                <PageBtn disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                </PageBtn>
            </div>
        </div>
    );
}

export function OffersMobilePagination({ page, totalPages, total, onPageChange }: OffersPaginationProps) {
    if (totalPages <= 1) return null;
    const perPage = 10;

    return (
        <div className="flex items-center justify-between pt-3">
            <p className="text-xs text-muted-foreground">
                {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} z {total}
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium text-muted-foreground">
                    {page}/{totalPages}
                </span>
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
