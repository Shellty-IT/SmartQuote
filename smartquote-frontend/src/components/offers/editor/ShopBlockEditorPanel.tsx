// src/components/offers/editor/ShopBlockEditorPanel.tsx
// Side-panel editor for a specific block of the "Sklep internetowy" template.
// Also exports ShopSectionManagerPanel for reorder / show-hide / move / restore sections.
'use client'

import { useState, useCallback } from 'react'
import { X, ArrowUp, ArrowDown, Eye, EyeOff, Trash2, Plus } from 'lucide-react'
import type { ShopBlocks, ShopPageBreakKey, ShopSectionKey } from '@/lib/pdf/shop-blocks'
import { ALL_SHOP_SECTION_KEYS } from '@/lib/pdf/shop-blocks'
import {
    CoverEditor,
    FooterEditor,
    SummaryEditor,
    ShopScopeEditor,
    PlatformsEditor,
    TimelineEditor,
    ShopPricingEditor,
    TechStackEditor,
    WarrantyEditor,
    ShopAboutEditor,
} from './shop-block-editors'
import type { OfferContext } from './block-editors'

// ── Key types + meta ──────────────────────────────────────────────────────────

export type EditableShopBlockKey =
    | 'cover' | 'footer'
    | 'summary' | 'scope' | 'platforms' | 'timeline'
    | 'pricing' | 'techStack' | 'warranty' | 'about'

const BLOCK_LABELS: Record<EditableShopBlockKey, string> = {
    cover: 'Strona tytułowa',
    footer: 'Stopka',
    summary: 'Streszczenie projektu',
    scope: 'Zakres prac',
    platforms: 'Opcje platformy',
    timeline: 'Harmonogram realizacji',
    pricing: 'Wycena',
    techStack: 'Stack technologiczny',
    warranty: 'Gwarancja i wsparcie',
    about: 'O wykonawcy',
}

const SECTION_LABELS: Record<ShopSectionKey, string> = {
    summary: 'Streszczenie projektu',
    scope: 'Zakres prac',
    platforms: 'Opcje platformy',
    timeline: 'Harmonogram realizacji',
    pricing: 'Wycena',
    techStack: 'Stack technologiczny',
    warranty: 'Gwarancja i wsparcie',
    about: 'O wykonawcy',
}

// ── Block editor panel ────────────────────────────────────────────────────────

interface ShopBlockEditorPanelProps {
    blockKey: EditableShopBlockKey
    blocks: ShopBlocks
    onSave: (blocks: ShopBlocks) => void
    onClose: () => void
    offerContext?: OfferContext
}

export function ShopBlockEditorPanel({
    blockKey,
    blocks,
    onSave,
    onClose,
    offerContext,
}: ShopBlockEditorPanelProps) {
    const [draft, setDraft] = useState<ShopBlocks>(blocks)

    const handleSave = useCallback(() => onSave(draft), [draft, onSave])

    const renderEditor = () => {
        switch (blockKey) {
            case 'cover': return <CoverEditor blocks={draft} onChange={setDraft} />
            case 'footer': return <FooterEditor blocks={draft} onChange={setDraft} />
            case 'summary': return <SummaryEditor blocks={draft} onChange={setDraft} offerContext={offerContext} />
            case 'scope': return <ShopScopeEditor blocks={draft} onChange={setDraft} offerContext={offerContext} />
            case 'platforms': return <PlatformsEditor blocks={draft} onChange={setDraft} />
            case 'timeline': return <TimelineEditor blocks={draft} onChange={setDraft} offerContext={offerContext} />
            case 'pricing': return <ShopPricingEditor blocks={draft} onChange={setDraft} />
            case 'techStack': return <TechStackEditor blocks={draft} onChange={setDraft} offerContext={offerContext} />
            case 'warranty': return <WarrantyEditor blocks={draft} onChange={setDraft} offerContext={offerContext} />
            case 'about': return <ShopAboutEditor blocks={draft} onChange={setDraft} offerContext={offerContext} />
            default: return null
        }
    }

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card">
                <p className="text-sm font-semibold text-foreground truncate">
                    {BLOCK_LABELS[blockKey] ?? blockKey}
                </p>
                <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Editor body */}
            <div className="flex-1 overflow-y-auto p-4">
                {renderEditor()}
            </div>

            {/* Footer actions */}
            <div className="border-t border-border px-4 py-3 bg-card">
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                        Zapisz
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/60 transition-colors"
                    >
                        Anuluj
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Section manager panel ─────────────────────────────────────────────────────

interface ShopSectionManagerPanelProps {
    blocks: ShopBlocks
    onSave: (blocks: ShopBlocks) => void
    onClose: () => void
}

export function ShopSectionManagerPanel({ blocks, onSave, onClose }: ShopSectionManagerPanelProps) {
    const [draft, setDraft] = useState<ShopBlocks>(blocks)

    const activeSections = draft.sections
    const removedSections = ALL_SHOP_SECTION_KEYS.filter((k) => !activeSections.includes(k))
    const pageBreakAfter = draft.pageBreakAfter ?? []

    const move = (idx: number, dir: -1 | 1) => {
        const arr = [...activeSections]
        const target = idx + dir
        if (target < 0 || target >= arr.length) return
        ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
        setDraft({ ...draft, sections: arr })
    }

    const toggleEnabled = (key: ShopSectionKey) => {
        const section = draft[key] as { enabled: boolean }
        setDraft({ ...draft, [key]: { ...section, enabled: !section.enabled } })
    }

    const togglePageBreakAfter = (key: ShopPageBreakKey) => {
        setDraft({
            ...draft,
            pageBreakAfter: pageBreakAfter.includes(key)
                ? pageBreakAfter.filter((k) => k !== key)
                : [...pageBreakAfter, key],
        })
    }

    const removeSection = (key: ShopSectionKey) => {
        setDraft({
            ...draft,
            sections: activeSections.filter((k) => k !== key),
            pageBreakAfter: pageBreakAfter.filter((k) => k !== key),
        })
    }

    const addSection = (key: ShopSectionKey) => {
        setDraft({ ...draft, sections: [...activeSections, key] })
    }

    const isEnabled = (key: ShopSectionKey) => {
        return (draft[key] as { enabled: boolean }).enabled
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card">
                <p className="text-sm font-semibold text-foreground">Zarządzaj sekcjami</p>
                <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <p className="text-xs text-muted-foreground">Przeciągnij, ukryj lub usuń sekcje. Ukryte sekcje są wyszarzone w podglądzie.</p>

                {/* Active sections */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/30" />
                        <span className="flex-1 text-sm font-medium text-foreground truncate">
                            {BLOCK_LABELS.cover}
                        </span>
                        <span className="text-[10px] text-muted-foreground">pierwsza sekcja</span>
                        <label className="flex cursor-pointer items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                            <input
                                type="checkbox"
                                checked={pageBreakAfter.includes('cover')}
                                onChange={() => togglePageBreakAfter('cover')}
                                className="h-3 w-3 rounded border-border text-primary focus:ring-ring"
                            />
                            nowa str.
                        </label>
                    </div>
                    {activeSections.map((key, idx) => {
                        const breaksAfter = pageBreakAfter.includes(key)
                        return (
                        <div
                            key={key}
                            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
                        >
                            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                            <span className="flex-1 text-sm font-medium text-foreground truncate">
                                {SECTION_LABELS[key]}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => move(idx, -1)}
                                    disabled={idx === 0}
                                    title="Przesuń wyżej"
                                    className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                                >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => move(idx, 1)}
                                    disabled={idx === activeSections.length - 1}
                                    title="Przesuń niżej"
                                    className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                                >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toggleEnabled(key)}
                                    title={isEnabled(key) ? 'Ukryj sekcję' : 'Pokaż sekcję'}
                                    className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                                >
                                    {isEnabled(key) ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 opacity-40" />}
                                </button>
                                <label className="flex cursor-pointer items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={breaksAfter}
                                        onChange={() => togglePageBreakAfter(key)}
                                        className="h-3 w-3 rounded border-border text-primary focus:ring-ring"
                                    />
                                    nowa str.
                                </label>
                                <button
                                    type="button"
                                    onClick={() => removeSection(key)}
                                    title="Usuń z dokumentu"
                                    className="rounded p-0.5 text-destructive hover:opacity-70"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                        )
                    })}
                </div>

                {/* Removed sections restore */}
                {removedSections.length > 0 && (
                    <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Usunięte z dokumentu</p>
                        {removedSections.map((key) => (
                            <div
                                key={key}
                                className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2"
                            >
                                <span className="flex-1 text-sm text-muted-foreground truncate">
                                    {SECTION_LABELS[key]}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => addSection(key)}
                                    title="Przywróć sekcję"
                                    className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                                >
                                    <Plus className="h-3 w-3" /> Dodaj
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-t border-border px-4 py-3 bg-card">
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => onSave(draft)}
                        className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                        Zapisz układ
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/60 transition-colors"
                    >
                        Anuluj
                    </button>
                </div>
            </div>
        </div>
    )
}

// needed for GripVertical in section manager
function GripVertical({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="5" r="1" fill="currentColor" stroke="none" />
            <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="9" cy="19" r="1" fill="currentColor" stroke="none" />
            <circle cx="15" cy="5" r="1" fill="currentColor" stroke="none" />
            <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="15" cy="19" r="1" fill="currentColor" stroke="none" />
        </svg>
    )
}
