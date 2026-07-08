// src/components/offers/editor/MobileSimpleBlockEditorPanel.tsx
// Side panel for editing blocks in the "Aplikacja mobilna - domyślny" template.

'use client'

import React from 'react'
import { X, ArrowUp, ArrowDown, EyeOff, Eye } from 'lucide-react'
import type { PanelView } from './MobileAppBlockEditorPanel'
import type { MobileSimpleBlocks, MobileSimplePageBreakKey, MobileSimpleSectionKey } from '@/lib/pdf/mobile-simple-blocks'
import {
    CoverEditor,
    ChecklistEditor,
    TechEditor,
    ProcessEditor,
    FooterEditor,
} from './mobile-simple-block-editors'
import type { OfferContext } from './block-editors'

export type EditableMobileSimpleBlockKey = MobileSimpleSectionKey | 'cover' | 'footer'

const ALL_SECTION_KEYS: MobileSimpleSectionKey[] = ['checklist', 'tech', 'process']

const SECTION_LABELS: Record<MobileSimpleSectionKey, string> = {
    checklist: 'Co znajdziesz w aplikacji',
    tech: 'Technologia',
    process: 'Proces i cena',
}

const BLOCK_LABELS: Record<EditableMobileSimpleBlockKey, string> = {
    cover: 'Okładka',
    checklist: 'Co znajdziesz w aplikacji',
    tech: 'Technologia',
    process: 'Proces i cena',
    footer: 'Stopka',
}

// ── Section manager ───────────────────────────────────────────────────────────

function MobileSimpleSectionManagerPanel({
    blocks,
    onChange,
    onClose,
}: {
    blocks: MobileSimpleBlocks
    onChange: (b: MobileSimpleBlocks) => void
    onClose: () => void
}) {
    const active = blocks.sections
    const deleted = ALL_SECTION_KEYS.filter(k => !active.includes(k))
    const pageBreakAfter = blocks.pageBreakAfter ?? []

    const move = (i: number, dir: -1 | 1) => {
        const next = [...active]
        const j = i + dir
        if (j < 0 || j >= next.length) return
        ;[next[i], next[j]] = [next[j], next[i]]
        onChange({ ...blocks, sections: next })
    }

    const remove = (key: MobileSimpleSectionKey) => {
        onChange({
            ...blocks,
            sections: active.filter(k => k !== key),
            pageBreakAfter: pageBreakAfter.filter(k => k !== key),
        })
    }

    const restore = (key: MobileSimpleSectionKey) => {
        onChange({ ...blocks, sections: [...active, key] })
    }

    const togglePageBreakAfter = (key: MobileSimplePageBreakKey) => {
        onChange({
            ...blocks,
            pageBreakAfter: pageBreakAfter.includes(key)
                ? pageBreakAfter.filter(k => k !== key)
                : [...pageBreakAfter, key],
        })
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-semibold text-sm">Zarządzaj sekcjami</span>
                <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                    <X size={16} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                <p className="text-xs text-muted-foreground mb-2">Przeciągaj sekcje w górę/dół, ukryj lub przywróć.</p>
                <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-background">
                    <span className="text-sm font-medium flex-1">{BLOCK_LABELS.cover}</span>
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
                    <div key={key} className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-background">
                        <span className="text-sm font-medium flex-1">{SECTION_LABELS[key]}</span>
                        <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                            <ArrowUp size={14} />
                        </button>
                        <button type="button" onClick={() => move(i, 1)} disabled={i === active.length - 1}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                            <ArrowDown size={14} />
                        </button>
                        <button type="button" onClick={() => remove(key)}
                            className="text-muted-foreground hover:text-destructive">
                            <EyeOff size={14} />
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
                {deleted.length > 0 && (
                    <>
                        <p className="text-xs text-muted-foreground mt-4 mb-2 font-semibold uppercase tracking-wide">Usunięte</p>
                        {deleted.map(key => (
                            <div key={key} className="flex items-center gap-2 border border-dashed border-border rounded-lg px-3 py-2 opacity-60">
                                <span className="text-sm flex-1">{SECTION_LABELS[key]}</span>
                                <button type="button" onClick={() => restore(key)}
                                    className="text-muted-foreground hover:text-primary">
                                    <Eye size={14} />
                                </button>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    )
}

// ── Main panel ────────────────────────────────────────────────────────────────

function renderEditor(
    key: EditableMobileSimpleBlockKey,
    blocks: MobileSimpleBlocks,
    onChange: (b: MobileSimpleBlocks) => void,
    offerContext?: OfferContext,
) {
    switch (key) {
        case 'cover': return <CoverEditor blocks={blocks} onChange={onChange} offerContext={offerContext} />
        case 'checklist': return <ChecklistEditor blocks={blocks} onChange={onChange} offerContext={offerContext} />
        case 'tech': return <TechEditor blocks={blocks} onChange={onChange} offerContext={offerContext} />
        case 'process': return <ProcessEditor blocks={blocks} onChange={onChange} offerContext={offerContext} />
        case 'footer': return <FooterEditor blocks={blocks} onChange={onChange} />
    }
}

interface MobileSimpleBlockEditorPanelProps {
    view: PanelView
    blocks: MobileSimpleBlocks
    onChange: (b: MobileSimpleBlocks) => void
    onClose: () => void
    onOpenSections?: () => void
    offerContext?: OfferContext
}

export function MobileSimpleBlockEditorPanel({
    view,
    blocks,
    onChange,
    onClose,
    offerContext,
}: MobileSimpleBlockEditorPanelProps) {
    if (!view) return null

    if (view.kind === 'sections') {
        return (
            <MobileSimpleSectionManagerPanel
                blocks={blocks}
                onChange={onChange}
                onClose={onClose}
            />
        )
    }

    const key = view.key as EditableMobileSimpleBlockKey
    const label = BLOCK_LABELS[key] ?? key

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-semibold text-sm">{label}</span>
                <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                    <X size={16} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {renderEditor(key, blocks, onChange, offerContext)}
            </div>
        </div>
    )
}
