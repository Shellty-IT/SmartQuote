// src/components/offers/editor/WebsiteV2BlockEditorPanel.tsx
// Side-panel editor for the "Strona internetowa v2" template.
'use client'

import { useState, useCallback } from 'react'
import { X, ArrowUp, ArrowDown, Eye, EyeOff, Trash2, Plus } from 'lucide-react'
import type { WebsiteV2Blocks, WebsiteV2SectionKey } from '@/lib/pdf/website-v2-blocks'
import { ALL_WV2_SECTION_KEYS } from '@/lib/pdf/website-v2-blocks'
import {
    CoverEditorV2,
    FooterEditorV2,
    ProblemEditor,
    AboutEditorV2,
    FeaturesEditor,
    PortfolioEditor,
    ProcessEditorV2,
    TechnologyEditorV2,
    PricingEditorV2,
    FaqEditor,
} from './website-v2-block-editors'
import type { OfferContext } from './block-editors'

export type EditableWV2BlockKey =
    | 'cover' | 'footer'
    | 'problem' | 'about' | 'features' | 'portfolio'
    | 'process' | 'technology' | 'pricing' | 'faq'

const BLOCK_LABELS: Record<EditableWV2BlockKey, string> = {
    cover: 'Okładka',
    footer: 'Stopka',
    problem: 'Problemy klienta',
    about: 'O mnie',
    features: 'Co zawiera strona',
    portfolio: 'Realizacje i opinie',
    process: 'Jak pracujemy',
    technology: 'Technologia',
    pricing: 'Cena',
    faq: 'Częste pytania',
}

const SECTION_LABELS: Record<WebsiteV2SectionKey, string> = {
    problem: 'Problemy klienta',
    about: 'O mnie',
    features: 'Co zawiera strona',
    portfolio: 'Realizacje i opinie',
    process: 'Jak pracujemy',
    technology: 'Technologia',
    pricing: 'Cena',
    faq: 'Częste pytania',
}

// ── Block editor panel ────────────────────────────────────────────────────────

interface WebsiteV2BlockEditorPanelProps {
    blockKey: EditableWV2BlockKey
    blocks: WebsiteV2Blocks
    onSave: (blocks: WebsiteV2Blocks) => void
    onClose: () => void
    offerContext?: OfferContext
}

export function WebsiteV2BlockEditorPanel({ blockKey, blocks, onSave, onClose, offerContext }: WebsiteV2BlockEditorPanelProps) {
    const [draft, setDraft] = useState<WebsiteV2Blocks>(blocks)
    const handleSave = useCallback(() => onSave(draft), [draft, onSave])

    function renderEditor() {
        switch (blockKey) {
            case 'cover':      return <CoverEditorV2 blocks={draft} onChange={setDraft} />
            case 'footer':     return <FooterEditorV2 blocks={draft} onChange={setDraft} />
            case 'problem':    return <ProblemEditor blocks={draft} onChange={setDraft} offerContext={offerContext} />
            case 'about':      return <AboutEditorV2 blocks={draft} onChange={setDraft} offerContext={offerContext} />
            case 'features':   return <FeaturesEditor blocks={draft} onChange={setDraft} offerContext={offerContext} />
            case 'portfolio':  return <PortfolioEditor blocks={draft} onChange={setDraft} />
            case 'process':    return <ProcessEditorV2 blocks={draft} onChange={setDraft} offerContext={offerContext} />
            case 'technology': return <TechnologyEditorV2 blocks={draft} onChange={setDraft} />
            case 'pricing':    return <PricingEditorV2 blocks={draft} onChange={setDraft} />
            case 'faq':        return <FaqEditor blocks={draft} onChange={setDraft} offerContext={offerContext} />
            default:           return null
        }
    }

    return (
        <div className="flex h-full flex-col bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">{BLOCK_LABELS[blockKey]}</h3>
                <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{renderEditor()}</div>
            <div className="border-t border-border p-4 flex gap-2">
                <button type="button" onClick={handleSave} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">Zapisz</button>
                <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">Anuluj</button>
            </div>
        </div>
    )
}

// ── Section manager panel ─────────────────────────────────────────────────────

interface WebsiteV2SectionManagerPanelProps {
    blocks: WebsiteV2Blocks
    onSave: (blocks: WebsiteV2Blocks) => void
    onClose: () => void
}

export function WebsiteV2SectionManagerPanel({ blocks, onSave, onClose }: WebsiteV2SectionManagerPanelProps) {
    const [draft, setDraft] = useState<WebsiteV2Blocks>(blocks)
    const sections = draft.sections
    const removed = ALL_WV2_SECTION_KEYS.filter(k => !sections.includes(k))

    const move = (i: number, dir: -1 | 1) => {
        const arr = [...sections]
        const j = i + dir
        if (j < 0 || j >= arr.length) return
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
        setDraft({ ...draft, sections: arr })
    }

    const toggle = (key: WebsiteV2SectionKey) => {
        const block = draft[key] as { enabled?: boolean }
        setDraft({ ...draft, [key]: { ...block, enabled: !(block.enabled ?? true) } })
    }

    const remove = (key: WebsiteV2SectionKey) => setDraft({ ...draft, sections: sections.filter(k => k !== key) })

    const restore = (key: WebsiteV2SectionKey) => setDraft({ ...draft, sections: [...sections, key] })

    return (
        <div className="flex h-full flex-col bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">Sekcje dokumentu</h3>
                <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {sections.map((key, i) => {
                    const block = draft[key] as { enabled?: boolean }
                    const enabled = block.enabled ?? true
                    return (
                        <div key={key} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                            <span className="flex-1 text-sm font-medium text-foreground">{SECTION_LABELS[key]}</span>
                            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => move(i, 1)} disabled={i === sections.length - 1} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => toggle(key)} className={`rounded p-1 transition-colors ${enabled ? 'text-primary hover:text-primary/70' : 'text-muted-foreground hover:text-foreground'}`}>
                                {enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </button>
                            <button type="button" onClick={() => remove(key)} className="rounded p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                    )
                })}

                {removed.length > 0 && (
                    <div className="mt-3 border-t border-border pt-3">
                        <p className="text-xs text-muted-foreground mb-2">Usunięte z dokumentu</p>
                        {removed.map(key => (
                            <div key={key} className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/30 px-3 py-2 mb-2">
                                <span className="flex-1 text-sm text-muted-foreground">{SECTION_LABELS[key]}</span>
                                <button type="button" onClick={() => restore(key)} className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs text-foreground hover:bg-secondary transition-colors">
                                    <Plus className="h-3 w-3" />Dodaj
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="border-t border-border p-4 flex gap-2">
                <button type="button" onClick={() => onSave(draft)} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">Zapisz</button>
                <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors">Anuluj</button>
            </div>
        </div>
    )
}
