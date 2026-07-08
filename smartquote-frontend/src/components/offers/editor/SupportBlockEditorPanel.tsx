// src/components/offers/editor/SupportBlockEditorPanel.tsx
// Side panel: per-block editor + section manager for the "Wsparcie" template.
'use client'

import { useState } from 'react'
import { X, ChevronUp, ChevronDown, Eye, EyeOff, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SupportBlocks, SupportPageBreakKey, SupportSectionKey } from '@/lib/pdf/support-blocks'
import type { OfferContext } from './block-editors'
import {
    CoverEditorSupport,
    BenefitsEditor,
    PackagesEditor,
    ScopeEditor,
    SlaEditor,
    ProcessEditor,
    PricingEditor,
    FooterEditorSupport,
} from './support-block-editors'

export type EditableSupportBlockKey =
    | 'cover'
    | 'footer'
    | 'benefits'
    | 'packages'
    | 'scope'
    | 'sla'
    | 'process'
    | 'pricing'

const BLOCK_LABELS: Record<EditableSupportBlockKey, string> = {
    cover: 'Strona tytułowa',
    footer: 'Stopka / CTA',
    benefits: 'Dlaczego warto',
    packages: 'Pakiety wsparcia',
    scope: 'Zakres usług',
    sla: 'Gwarantowane czasy',
    process: 'Obsługa zgłoszenia',
    pricing: 'Cena i warunki',
}

const SECTION_LABELS: Record<SupportSectionKey, string> = {
    benefits: 'Dlaczego warto',
    packages: 'Pakiety wsparcia',
    scope: 'Zakres usług',
    sla: 'Gwarantowane czasy',
    process: 'Obsługa zgłoszenia',
    pricing: 'Cena i warunki',
}

const ALL_SECTIONS: SupportSectionKey[] = ['benefits', 'packages', 'scope', 'sla', 'process', 'pricing']

// ── Section manager panel ─────────────────────────────────────────────────────

interface SupportSectionManagerPanelProps {
    blocks: SupportBlocks
    onChange: (b: SupportBlocks) => void
    onClose: () => void
}

export function SupportSectionManagerPanel({ blocks, onChange, onClose }: SupportSectionManagerPanelProps) {
    const active = blocks.sections
    const removed = ALL_SECTIONS.filter(s => !active.includes(s))
    const pageBreakAfter = blocks.pageBreakAfter ?? []

    const move = (i: number, dir: -1 | 1) => {
        const next = [...active]
        const j = i + dir
        if (j < 0 || j >= next.length) return
        ;[next[i], next[j]] = [next[j], next[i]]
        onChange({ ...blocks, sections: next })
    }

    const remove = (key: SupportSectionKey) => {
        onChange({
            ...blocks,
            sections: active.filter(s => s !== key),
            pageBreakAfter: pageBreakAfter.filter(s => s !== key),
        })
    }

    const restore = (key: SupportSectionKey) => {
        onChange({ ...blocks, sections: [...active, key] })
    }

    const togglePageBreakAfter = (key: SupportPageBreakKey) => {
        onChange({
            ...blocks,
            pageBreakAfter: pageBreakAfter.includes(key)
                ? pageBreakAfter.filter(s => s !== key)
                : [...pageBreakAfter, key],
        })
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm font-semibold">Zarządzaj sekcjami</span>
                <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-muted transition-colors">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <p className="mb-3 text-xs text-muted-foreground">
                    Strona tytułowa i stopka są zawsze widoczne. Pozostałe sekcje możesz ukryć lub przestawić.
                </p>

                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aktywne sekcje</p>
                <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                        <span className="flex-1 text-sm">{BLOCK_LABELS.cover}</span>
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
                    {active.map((key, i) => {
                        const breaksAfter = pageBreakAfter.includes(key)
                        return (
                        <div key={key} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                            <span className="flex-1 text-sm">{SECTION_LABELS[key]}</span>
                            <button
                                type="button"
                                onClick={() => move(i, -1)}
                                disabled={i === 0}
                                className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                            >
                                <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => move(i, 1)}
                                disabled={i === active.length - 1}
                                className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                            >
                                <ChevronDown className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => remove(key)}
                                className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                title="Usuń z dokumentu"
                            >
                                <EyeOff className="h-4 w-4" />
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
                        </div>
                        )
                    })}
                </div>

                {removed.length > 0 && (
                    <>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Usunięte</p>
                        <div className="space-y-2">
                            {removed.map(key => (
                                <div key={key} className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 opacity-60">
                                    <span className="flex-1 text-sm">{SECTION_LABELS[key]}</span>
                                    <button
                                        type="button"
                                        onClick={() => restore(key)}
                                        className="rounded p-0.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                                        title="Przywróć"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

// ── Block editor panel ────────────────────────────────────────────────────────

type PanelView = { kind: 'block'; key: EditableSupportBlockKey } | { kind: 'sections' } | null

interface SupportBlockEditorPanelProps {
    activeBlock: EditableSupportBlockKey | null
    blocks: SupportBlocks
    onChange: (b: SupportBlocks) => void
    onClose: () => void
    offerContext?: OfferContext
}

export function SupportBlockEditorPanel({ activeBlock, blocks, onChange, onClose, offerContext }: SupportBlockEditorPanelProps) {
    const [view, setView] = useState<PanelView>(activeBlock ? { kind: 'block', key: activeBlock } : null)

    // sync when parent selects a block via iframe click
    if (activeBlock && (view?.kind !== 'block' || view.key !== activeBlock)) {
        setView({ kind: 'block', key: activeBlock })
    }

    // extract before narrowing so the JSX can use it without a TS impossible-comparison error
    const isSectionsView = view?.kind === 'sections'

    const renderEditor = (key: EditableSupportBlockKey) => {
        switch (key) {
            case 'cover':
                return <CoverEditorSupport block={blocks.cover} onChange={(b) => onChange({ ...blocks, cover: b })} />
            case 'benefits':
                return <BenefitsEditor block={blocks.benefits} onChange={(b) => onChange({ ...blocks, benefits: b })} offerContext={offerContext} />
            case 'packages':
                return <PackagesEditor block={blocks.packages} onChange={(b) => onChange({ ...blocks, packages: b })} />
            case 'scope':
                return <ScopeEditor block={blocks.scope} onChange={(b) => onChange({ ...blocks, scope: b })} offerContext={offerContext} />
            case 'sla':
                return <SlaEditor block={blocks.sla} onChange={(b) => onChange({ ...blocks, sla: b })} />
            case 'process':
                return <ProcessEditor block={blocks.process} onChange={(b) => onChange({ ...blocks, process: b })} offerContext={offerContext} />
            case 'pricing':
                return <PricingEditor block={blocks.pricing} onChange={(b) => onChange({ ...blocks, pricing: b })} />
            case 'footer':
                return <FooterEditorSupport block={blocks.footer} onChange={(b) => onChange({ ...blocks, footer: b })} />
        }
    }

    if (isSectionsView) {
        return (
            <SupportSectionManagerPanel
                blocks={blocks}
                onChange={onChange}
                onClose={() => setView(null)}
            />
        )
    }

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm font-semibold">
                    {view?.kind === 'block' ? BLOCK_LABELS[view.key] : 'Edytor sekcji'}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setView({ kind: 'sections' })}
                        className={cn(
                            'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                            isSectionsView
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted',
                        )}
                        title="Zarządzaj sekcjami"
                    >
                        <Layers className="h-3.5 w-3.5" />
                        Sekcje
                    </button>
                    <button type="button" onClick={onClose} className="ml-1 rounded-md p-1 hover:bg-muted transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Block tabs */}
            <div className="flex gap-1 overflow-x-auto border-b border-border px-3 pt-2 pb-0">
                {(Object.keys(BLOCK_LABELS) as EditableSupportBlockKey[]).map(key => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setView({ kind: 'block', key })}
                        className={cn(
                            'flex-none rounded-t-md px-2.5 py-1.5 text-xs font-medium transition-colors border border-transparent border-b-0',
                            view?.kind === 'block' && view.key === key
                                ? 'border-border bg-background text-foreground -mb-px'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {BLOCK_LABELS[key]}
                    </button>
                ))}
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto p-4">
                {view?.kind === 'block' ? (
                    renderEditor(view.key)
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Kliknij na sekcję w podglądzie lub wybierz zakładkę powyżej.
                    </p>
                )}
            </div>
        </div>
    )
}
