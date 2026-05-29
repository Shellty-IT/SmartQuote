// src/app/dashboard/offers/components/OffersFilters.tsx

import { Search } from 'lucide-react';
import { STATUS_OPTIONS, SORT_OPTIONS } from '../constants';

interface OffersFiltersProps {
    search: string;
    status: string;
    sort: string;
    onSearchChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onSortChange: (value: string) => void;
}

export function OffersFilters({
    search,
    status,
    sort,
    onSearchChange,
    onStatusChange,
    onSortChange,
}: OffersFiltersProps) {
    return (
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex flex-col gap-3 md:flex-row md:gap-4">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        placeholder="Szukaj po numerze, tytule lub kliencie..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="h-10 w-full rounded-lg border border-border bg-secondary/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                </div>
                <div className="flex gap-3">
                    <select
                        value={status}
                        onChange={(e) => onStatusChange(e.target.value)}
                        className="h-10 flex-1 rounded-lg border border-border bg-card px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30 md:w-44 md:flex-none"
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <select
                        value={sort}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="h-10 flex-1 rounded-lg border border-border bg-card px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30 md:w-44 md:flex-none"
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
