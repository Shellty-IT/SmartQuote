// src/app/dashboard/offers/components/OffersPagination.tsx

import { Button } from '@/components/ui';

interface OffersPaginationProps {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
}

function getVisiblePages(page: number, totalPages: number): number[] {
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 3) {
        return Array.from({ length: maxVisible }, (_, i) => i + 1);
    }
    if (page >= totalPages - 2) {
        return Array.from({ length: maxVisible }, (_, i) => totalPages - 4 + i);
    }
    return Array.from({ length: maxVisible }, (_, i) => page - 2 + i);
}

export function OffersDesktopPagination({ page, totalPages, total, onPageChange }: OffersPaginationProps) {
    if (totalPages <= 1) return null;

    const visiblePages = getVisiblePages(page, totalPages);

    return (
        <div className="px-6 py-4 border-t divider-themed flex items-center justify-between">
            <p className="text-sm text-themed-muted">
                {((page - 1) * 10) + 1}–{Math.min(page * 10, total)} z {total}
            </p>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Button>
                <div className="flex items-center gap-1">
                    {visiblePages.map((pageNum) => (
                        <button
                            key={pageNum}
                            onClick={() => onPageChange(pageNum)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                page === pageNum
                                    ? 'bg-cyan-600 text-white'
                                    : 'text-themed-muted hover-themed'
                            }`}
                        >
                            {pageNum}
                        </button>
                    ))}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Button>
            </div>
        </div>
    );
}

export function OffersMobilePagination({ page, totalPages, total, onPageChange }: OffersPaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-themed-muted">
                {((page - 1) * 10) + 1}–{Math.min(page * 10, total)} z {total}
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border card-themed disabled:opacity-40 hover-themed transition-colors"
                >
                    ←
                </button>
                <span className="text-sm text-themed-muted font-medium">
                    {page}/{totalPages}
                </span>
                <button
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border card-themed disabled:opacity-40 hover-themed transition-colors"
                >
                    →
                </button>
            </div>
        </div>
    );
}