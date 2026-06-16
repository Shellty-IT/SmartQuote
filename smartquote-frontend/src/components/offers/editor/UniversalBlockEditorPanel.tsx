// src/components/offers/editor/UniversalBlockEditorPanel.tsx
// Side panel for editing blocks in "Szablon uniwersalny" offer template.
'use client'

import React from 'react'
import { Layers, X, ChevronUp, ChevronDown, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui'
import type { PanelView } from './MobileAppBlockEditorPanel'
import type { UniversalBlocks, UniversalSectionKey } from '@/lib/pdf/universal-blocks'
import {
    CoverEditor, SummaryEditor, NeedsEditor, ScopeEditor,
    TimelineEditor, PricingEditor, TermsEditor, FooterEditor,
} from './universal-block-editors'
import type { OfferContext } from './block-editors'

export type EditableUniversalBlockKey = UniversalSectionKey | 'cover' | 'footer'

const ALL_SECTION_KEYS: UniversalSectionKey[] = ['summary', 'needs', 'scope', 'timeline', 'pricing', 'terms']

const SECTION_LABELS: Record<UniversalSectionKey, string> = {
    summary:  'Streszczenie',
    needs:    'Potrzeby klienta',
    scope:    'Zakres prac',
    timeline: 'Harmonogram',
    pricing:  'Wycena',
    terms:    'Warunki współpracy',
}

const BLOCK_LABELS: Record<EditableUniversalBlockKey, string> = {
    cover:    'Okładka',
    footer:   'Stopka / CTA',
    ...SECTION_LABELS,
}

// ── Section manager ───────────────────────────────────────────────────────────

function UniversalSectionManagerPanel({
    blocks,
    onChange,
    onClose,
}: {
    blocks: UniversalBlocks
    onChange: (b: UniversalBlocks) => void
    onClose: () => void
}) {
    const active = blocks.sections
    const deleted = ALL_SECTION_KEYS.filter(k => !active.includes(k))

    const move = (i: number, dir: -1 | 1) => {
        const next = [...active]
        const j = i + dir
        if (j < 0 || j >= next.length) return
        ;[next[i], next[j]] = [next[j], next[i]]
        onChange({ ...blocks, sections: next })
    }

    const remove = (key: UniversalSectionKey) =>
        onChange({ ...blocks, sections: active.filter(k => k !== key) })

    const restore = (key: UniversalSectionKey) =>
        onChange({ ...blocks, sections: [...active, key] })

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2 font-semibold text-sm">
                    <Layers className="w-4 h-4" />
                    Zarządzaj sekcjami
                </div>
                <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {active.map((key, i) => (
                    <div key={key} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card">
                        <span className="flex-1 text-sm font-medium">{SECTION_LABELS[key]}</span>
                        <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                            className="p-1 hover:bg-muted rounded disabled:opacity-30">
                            <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => move(i, 1)} disabled={i === active.length - 1}
                            className="p-1 hover:bg-muted rounded disabled:opacity-30">
                            <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => remove(key)}
                            className="p-1 hover:bg-destructive/10 text-destructive rounded">
                            <EyeOff className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
                {deleted.length > 0 && (
                    <>
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-1">
                            Usunięte z dokumentu
                        </div>
                        {deleted.map(key => (
                            <div key={key} className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-muted bg-muted/30 opacity-60">
                                <span className="flex-1 text-sm">{SECTION_LABELS[key]}</span>
                                <button type="button" onClick={() => restore(key)}
                                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
                                    <Eye className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    )
}

// ── Editor dispatcher ─────────────────────────────────────────────────────────

function renderEditor(key: EditableUniversalBlockKey, blocks: UniversalBlocks, onChange: (b: UniversalBlocks) => void, offerContext?: OfferContext) {
    switch (key) {
        case 'cover':    return <CoverEditor blocks={blocks} onChange={onChange} />
        case 'footer':   return <FooterEditor blocks={blocks} onChange={onChange} />
        case 'summary':  return <SummaryEditor blocks={blocks} onChange={onChange} offerContext={offerContext} />
        case 'needs':    return <NeedsEditor blocks={blocks} onChange={onChange} offerContext={offerContext} />
        case 'scope':    return <ScopeEditor blocks={blocks} onChange={onChange} offerContext={offerContext} />
        case 'timeline': return <TimelineEditor blocks={blocks} onChange={onChange} offerContext={offerContext} />
        case 'pricing':  return <PricingEditor blocks={blocks} onChange={onChange} />
        case 'terms':    return <TermsEditor blocks={blocks} onChange={onChange} offerContext={offerContext} />
        default:         return null
    }
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface UniversalBlockEditorPanelProps {
    view: PanelView
    blocks: UniversalBlocks
    onChange: (b: UniversalBlocks) => void
    onClose: () => void
    onOpenSections: () => void
    offerContext?: OfferContext
}

export function UniversalBlockEditorPanel({
    view, blocks, onChange, onClose, onOpenSections, offerContext,
}: UniversalBlockEditorPanelProps) {
    if (view?.kind === 'sections') {
        return (
            <UniversalSectionManagerPanel
                blocks={blocks}
                onChange={onChange}
                onClose={onClose}
            />
        )
    }

    const activeKey = view?.kind === 'block' ? (view.key as EditableUniversalBlockKey) : null

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border gap-2">
                <span className="font-semibold text-sm truncate">
                    {activeKey ? BLOCK_LABELS[activeKey] : 'Edytor'}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onOpenSections}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Zarządzaj sekcjami"
                    >
                        <Layers className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={onClose}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {!activeKey && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground gap-2">
                    <ArrowRight className="w-8 h-8 opacity-30" />
                    <p className="text-sm">Kliknij sekcję w podglądzie, aby ją edytować.</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={onOpenSections}>
                        <Layers className="w-4 h-4" /> Zarządzaj sekcjami
                    </Button>
                </div>
            )}

            {activeKey && (
                <div className="flex-1 overflow-y-auto p-4">
                    {renderEditor(activeKey, blocks, onChange, offerContext)}
                </div>
            )}
        </div>
    )
}
