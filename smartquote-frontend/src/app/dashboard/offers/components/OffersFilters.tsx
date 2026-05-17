// src/app/dashboard/offers/components/OffersFilters.tsx

import { Card, Input } from '@/components/ui';
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
        <Card className="mb-6">
            <div className="p-3 md:p-4 flex flex-col gap-3 md:flex-row md:gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Szukaj po numerze, tytule lub kliencie..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        icon={
                            <svg className="w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        }
                    />
                </div>
                <div className="flex gap-3">
                    <select
                        value={status}
                        onChange={(e) => onStatusChange(e.target.value)}
                        className="flex-1 md:w-48 px-3 py-2 text-sm border rounded-lg input-themed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <select
                        value={sort}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="flex-1 md:w-48 px-3 py-2 text-sm border rounded-lg input-themed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </Card>
    );
}