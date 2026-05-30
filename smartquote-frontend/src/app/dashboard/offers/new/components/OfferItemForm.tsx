// src/app/dashboard/offers/new/components/OfferItemForm.tsx

import { Input, Select, Textarea } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import AIPriceInsight from '@/components/ai/AIPriceInsight';
import { useTranslations } from '@/i18n';
import { VAT_RATES, UNITS } from '../constants';
import type { ExtendedOfferItem, OfferTotalsData } from '../types';

interface OfferItemFormProps {
    item: ExtendedOfferItem;
    index: number;
    itemTotals: OfferTotalsData;
    uniqueVariants: string[];
    canRemove: boolean;
    onUpdate: (index: number, field: keyof ExtendedOfferItem, value: string | number | boolean) => void;
    onRemove: (index: number) => void;
}

export default function OfferItemForm({
                                          item,
                                          index,
                                          itemTotals,
                                          uniqueVariants,
                                          canRemove,
                                          onUpdate,
                                          onRemove,
                                      }: OfferItemFormProps) {
    const tr = useTranslations('offerNew');
    const f = tr.itemForm;
    return (
        <div
            className={`p-4 rounded-xl space-y-4 ${
                item.variantName.trim()
                    ? 'bg-surface-subtle border-l-4 border-l-cyan-400'
                    : 'bg-surface-subtle'
            }`}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                        {f.title} {index + 1}
                    </span>
                    {item.variantName.trim() && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                            {item.variantName.trim()}
                        </span>
                    )}
                </div>
                {canRemove && (
                    <button
                        onClick={() => onRemove(index)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <Input
                        label={f.name}
                        value={item.name}
                        onChange={(e) => onUpdate(index, 'name', e.target.value)}
                        placeholder={f.namePlaceholder}
                        required
                    />
                </div>
                <div className="md:col-span-2">
                    <Textarea
                        label={f.description}
                        value={item.description || ''}
                        onChange={(e) => onUpdate(index, 'description', e.target.value)}
                        rows={2}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Input
                    label={f.qty}
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
                    min={0}
                    step="0.01"
                />
                <Select
                    label={f.unit}
                    value={item.unit || 'szt.'}
                    onChange={(e) => onUpdate(index, 'unit', e.target.value)}
                    options={UNITS}
                />
                <Input
                    label={f.netPrice}
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => onUpdate(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    min={0}
                    step="0.01"
                />
                <Select
                    label={f.vat}
                    value={String(item.vatRate || 23)}
                    onChange={(e) => onUpdate(index, 'vatRate', parseInt(e.target.value))}
                    options={VAT_RATES}
                />
                <Input
                    label={f.discount}
                    type="number"
                    value={item.discount || 0}
                    onChange={(e) => onUpdate(index, 'discount', parseFloat(e.target.value) || 0)}
                    min={0}
                    max={100}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label={f.variant}
                    value={item.variantName}
                    onChange={(e) => onUpdate(index, 'variantName', e.target.value)}
                    placeholder={f.variantPlaceholder}
                    list={`variant-suggestions-${index}`}
                />
                {uniqueVariants.length > 0 && (
                    <datalist id={`variant-suggestions-${index}`}>
                        {uniqueVariants.map((v) => (
                            <option key={v} value={v} />
                        ))}
                    </datalist>
                )}
            </div>

            <div className="flex items-center justify-between">
                <AIPriceInsight
                    itemName={item.name}
                    currentPrice={item.unitPrice}
                    onPriceSelect={(price) => onUpdate(index, 'unitPrice', price)}
                />
            </div>

            <div className="p-3 bg-card border-border border rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={item.isOptional}
                        onChange={(e) => onUpdate(index, 'isOptional', e.target.checked)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                        <span className="text-sm font-medium text-foreground">{f.optional}</span>
                        <p className="text-xs text-muted-foreground">{f.optionalHint}</p>
                    </div>
                </label>

                {item.isOptional && (
                    <div className="flex gap-4 mt-3 pl-7">
                        <Input
                            label={f.minQty}
                            type="number"
                            value={item.minQuantity}
                            onChange={(e) => onUpdate(index, 'minQuantity', parseInt(e.target.value) || 1)}
                            min={1}
                            className="w-32"
                        />
                        <Input
                            label={f.maxQty}
                            type="number"
                            value={item.maxQuantity}
                            onChange={(e) => onUpdate(index, 'maxQuantity', parseInt(e.target.value) || 100)}
                            min={1}
                            className="w-32"
                        />
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-4 pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">
                    {f.net} <strong>{formatCurrency(itemTotals.totalNet)}</strong>
                </span>
                <span className="text-sm text-muted-foreground">
                    {f.vat2} <strong>{formatCurrency(itemTotals.totalVat)}</strong>
                </span>
                <span className="text-sm text-foreground">
                    {f.gross} <strong>{formatCurrency(itemTotals.totalGross)}</strong>
                </span>
            </div>
        </div>
    );
}