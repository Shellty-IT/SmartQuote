// src/components/offers/editor/ClassicBlockEditorPanel.tsx
// Side panel for editing the "Uniwersalny - systemowy" (classic) offer via the
// document-as-editor. Unlike the block templates, classic edits the offer's real
// fields (title/description/terms + line items), not a `blocks` JSONB object.
'use client'

import { X, ArrowRight } from 'lucide-react'
import StepItems from '@/app/dashboard/offers/new/components/StepItems'
import { inputCls, textareaCls, labelCls } from './block-editors'
import type { OfferDetails, ExtendedOfferItem, OfferTotalsData } from '@/app/dashboard/offers/new/types'
import type { PanelView } from './MobileAppBlockEditorPanel'

export type EditableClassicKey = 'info' | 'description' | 'items' | 'terms'

const KEY_LABELS: Record<EditableClassicKey, string> = {
    info:        'Dane oferty',
    description: 'Opis oferty',
    items:       'Pozycje i wycena',
    terms:       'Warunki płatności',
}

interface ClassicBlockEditorPanelProps {
    view: PanelView
    details: OfferDetails
    onUpdate: <K extends keyof OfferDetails>(field: K, value: OfferDetails[K]) => void
    items: ExtendedOfferItem[]
    totals: OfferTotalsData
    uniqueVariants: string[]
    onAddItem: () => void
    onRemoveItem: (index: number) => void
    onUpdateItem: (index: number, field: keyof ExtendedOfferItem, value: string | number | boolean) => void
    onClose: () => void
}

export function ClassicBlockEditorPanel({
    view,
    details,
    onUpdate,
    items,
    totals,
    uniqueVariants,
    onAddItem,
    onRemoveItem,
    onUpdateItem,
    onClose,
}: ClassicBlockEditorPanelProps) {
    const activeKey = view?.kind === 'block' ? (view.key as EditableClassicKey) : null

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border gap-2">
                <span className="font-semibold text-sm truncate">
                    {activeKey ? KEY_LABELS[activeKey] : 'Edytor'}
                </span>
                <button type="button" onClick={onClose}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {!activeKey && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground gap-2">
                    <ArrowRight className="w-8 h-8 opacity-30" />
                    <p className="text-sm">Kliknij sekcję w podglądzie, aby ją edytować.</p>
                </div>
            )}

            {activeKey === 'info' && (
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="mb-3">
                        <label className={labelCls}>Nazwa oferty</label>
                        <input
                            className={inputCls}
                            value={details.title}
                            onChange={(e) => onUpdate('title', e.target.value)}
                            placeholder="np. Oferta — Nazwa Firmy…"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="mb-3">
                            <label className={labelCls}>Ważna do</label>
                            <input
                                type="date"
                                className={inputCls}
                                value={details.validUntil}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => onUpdate('validUntil', e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <label className={labelCls}>Termin płatności (dni)</label>
                            <input
                                type="number"
                                min={0}
                                max={365}
                                className={inputCls}
                                value={details.paymentDays}
                                onChange={(e) => onUpdate('paymentDays', parseInt(e.target.value) || 14)}
                            />
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className={labelCls}>Notatki wewnętrzne (widoczne tylko dla Ciebie)</label>
                        <textarea
                            className={textareaCls}
                            value={details.notes}
                            onChange={(e) => onUpdate('notes', e.target.value)}
                            placeholder="Prywatne notatki — nie trafiają do dokumentu."
                        />
                    </div>
                    <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg border border-border bg-card">
                        <input
                            type="checkbox"
                            checked={details.requireAuditTrail}
                            onChange={(e) => onUpdate('requireAuditTrail', e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-xs text-foreground">
                            Wymagaj śladu audytowego przy akceptacji oferty
                        </span>
                    </label>
                </div>
            )}

            {activeKey === 'description' && (
                <div className="flex-1 overflow-y-auto p-4">
                    <label className={labelCls}>Opis oferty (widoczny dla klienta)</label>
                    <textarea
                        className={`${inputCls} resize-y`}
                        style={{ minHeight: 320 }}
                        value={details.description}
                        onChange={(e) => onUpdate('description', e.target.value)}
                        placeholder="Wstęp, kontekst, opis proponowanego rozwiązania…"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                        Tekst pojawi się nad tabelą pozycji. Nowe linie są zachowane.
                    </p>
                </div>
            )}

            {activeKey === 'items' && (
                <div className="flex-1 overflow-y-auto p-4">
                    <StepItems
                        items={items}
                        totals={totals}
                        uniqueVariants={uniqueVariants}
                        onAddItem={onAddItem}
                        onRemoveItem={onRemoveItem}
                        onUpdateItem={onUpdateItem}
                    />
                </div>
            )}

            {activeKey === 'terms' && (
                <div className="flex-1 overflow-y-auto p-4">
                    <label className={labelCls}>Warunki płatności i współpracy (widoczne dla klienta)</label>
                    <textarea
                        className={`${inputCls} resize-y`}
                        style={{ minHeight: 320 }}
                        value={details.terms}
                        onChange={(e) => onUpdate('terms', e.target.value)}
                        placeholder="np. Płatność w dwóch transzach: 50% zaliczki, 50% po odbiorze…"
                    />
                </div>
            )}
        </div>
    )
}
