// SmartQuote-AI/src/components/publicOffer/OfferItemRow.tsx

'use client';

import type { PublicOfferItem } from '@/types';

interface OfferItemRowProps {
    item: PublicOfferItem;
    isSelected: boolean;
    quantity: number;
    onToggle: (id: string, selected: boolean) => void;
    onQuantityChange: (id: string, quantity: number) => void;
    disabled: boolean;
}

function formatPLN(amount: number): string {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function OfferItemRow({
                                         item,
                                         isSelected,
                                         quantity,
                                         onToggle,
                                         onQuantityChange,
                                         disabled,
                                     }: OfferItemRowProps) {
    const unitPrice = Number(item.unitPrice);
    const vatRate = Number(item.vatRate);
    const discount = Number(item.discount) || 0;

    const discountMultiplier = 1 - discount / 100;
    const lineNet = isSelected ? quantity * unitPrice * discountMultiplier : 0;
    const lineVat = lineNet * (vatRate / 100);
    const lineGross = lineNet + lineVat;

    const canDecrease = quantity > item.minQuantity;
    const canIncrease = quantity < item.maxQuantity;

    return (
        <div
            className={`p-4 md:p-5 rounded-xl border-2 transition-all ${
                !item.isOptional
                    ? 'border-slate-200 bg-white'
                    : isSelected
                        ? 'border-cyan-200 bg-cyan-50/30'
                        : 'border-dashed border-slate-200 bg-slate-50/50 opacity-60'
            }`}
        >
            <div className="flex items-start gap-3">
                {item.isOptional ? (
                    <button
                        onClick={() => !disabled && onToggle(item.id, !isSelected)}
                        disabled={disabled}
                        className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                        } ${
                            isSelected
                                ? 'bg-cyan-500 border-cyan-500 text-white'
                                : 'bg-white border-slate-300 hover:border-cyan-400'
                        }`}
                    >
                        {isSelected && (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </button>
                ) : (
                    <div className="mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center bg-slate-200 text-slate-500">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3
                                    className={`font-medium ${
                                        isSelected ? 'text-slate-900' : 'text-slate-400 line-through'
                                    }`}
                                >
                                    {item.name}
                                </h3>
                                {item.isOptional && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                                        Opcjonalna
                                    </span>
                                )}
                                {discount > 0 && isSelected && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
                                        -{discount}%
                                    </span>
                                )}
                            </div>
                            {item.description && (
                                <p
                                    className={`text-sm mt-1 ${
                                        isSelected ? 'text-slate-500' : 'text-slate-300'
                                    }`}
                                >
                                    {item.description}
                                </p>
                            )}
                        </div>

                        <div className="text-left sm:text-right flex-shrink-0">
                            <p
                                className={`text-lg font-bold ${
                                    isSelected ? 'text-slate-900' : 'text-slate-300'
                                }`}
                            >
                                {formatPLN(lineGross)}
                            </p>
                            <p className={`text-xs ${isSelected ? 'text-slate-400' : 'text-slate-300'}`}>
                                netto: {formatPLN(lineNet)}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className={`text-xs ${isSelected ? 'text-slate-400' : 'text-slate-300'}`}>
                                Ilość:
                            </span>
                            {item.isOptional && isSelected && !disabled ? (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => canDecrease && onQuantityChange(item.id, quantity - 1)}
                                        disabled={!canDecrease}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" d="M20 12H4" />
                                        </svg>
                                    </button>
                                    <span className="w-10 text-center font-semibold text-slate-900 text-sm">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => canIncrease && onQuantityChange(item.id, quantity + 1)}
                                        disabled={!canIncrease}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                    <span className={`text-xs ${isSelected ? 'text-slate-400' : 'text-slate-300'}`}>
                                        {item.unit}
                                    </span>
                                </div>
                            ) : (
                                <span className={`text-sm font-medium ${isSelected ? 'text-slate-700' : 'text-slate-300'}`}>
                                    {quantity} {item.unit}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            <span className={`text-xs ${isSelected ? 'text-slate-400' : 'text-slate-300'}`}>
                                Cena:
                            </span>
                            <span className={`text-sm font-medium ${isSelected ? 'text-slate-700' : 'text-slate-300'}`}>
                                {formatPLN(unitPrice)}
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <span className={`text-xs ${isSelected ? 'text-slate-400' : 'text-slate-300'}`}>
                                VAT:
                            </span>
                            <span className={`text-sm font-medium ${isSelected ? 'text-slate-700' : 'text-slate-300'}`}>
                                {vatRate}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}