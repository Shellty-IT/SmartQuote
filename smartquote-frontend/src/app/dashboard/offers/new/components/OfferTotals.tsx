// src/app/dashboard/offers/new/components/OfferTotals.tsx

import { formatCurrency } from '@/lib/utils';
import type { OfferTotalsData } from '../types';

interface OfferTotalsProps {
    totals: OfferTotalsData;
}

export default function OfferTotals({ totals }: OfferTotalsProps) {
    return (
        <div className="p-4 bg-blue-600 dark:bg-slate-800 rounded-xl text-white">
            <div className="flex justify-between items-center">
                <span className="text-blue-100 dark:text-slate-400">Suma netto:</span>
                <span className="text-lg font-semibold">{formatCurrency(totals.totalNet)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
                <span className="text-blue-100 dark:text-slate-400">VAT:</span>
                <span className="text-lg font-semibold">{formatCurrency(totals.totalVat)}</span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-500 dark:border-slate-600">
                <span className="text-white font-medium">Suma brutto:</span>
                <span className="text-2xl font-bold text-white">{formatCurrency(totals.totalGross)}</span>
            </div>
        </div>
    );
}