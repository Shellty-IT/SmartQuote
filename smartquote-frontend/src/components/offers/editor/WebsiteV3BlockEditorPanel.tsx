// src/components/offers/editor/WebsiteV3BlockEditorPanel.tsx
// Side panel for editing individual blocks and managing sections in the v3 template.
'use client'

import { ArrowUp, ArrowDown, Eye, EyeOff, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui'
import type { WebsiteV3Blocks, WebsiteV3SectionKey } from '@/lib/pdf/website-v3-blocks'
import { DEFAULT_WV3_SECTIONS } from '@/lib/pdf/website-v3-blocks'
import {
    CoverEditorV3, FooterEditorV3,
    NeedsEditor, PackagesEditor, ProcessEditorV3, ScopeEditorV3,
    TimelineEditorV3, PricingEditorV3, PortfolioEditorV3,
    TestimonialsEditor, AboutEditorV3, StackEditor, TermsEditor,
} from './website-v3-block-editors'
import type { OfferContext } from './block-editors'

export type EditableWV3BlockKey =
    | 'cover' | 'footer'
    | 'needs' | 'packages' | 'process' | 'scope'
    | 'timeline' | 'pricing' | 'portfolio'
    | 'testimonials' | 'about' | 'stack' | 'terms'

const SECTION_LABELS: Record<EditableWV3BlockKey, string> = {
    cover: 'Okładka',
    footer: 'Stopka / CTA',
    needs: 'Rozumienie potrzeb',
    packages: 'Pakiety',
    process: 'Proces realizacji',
    scope: 'Zakres prac',
    timeline: 'Harmonogram',
    pricing: 'Wycena',
    portfolio: 'Portfolio',
    testimonials: 'Referencje',
    about: 'O wykonawcy',
    stack: 'Technologie',
    terms: 'Warunki',
}

// ── Block editor panel ────────────────────────────────────────────────────────

interface WebsiteV3BlockEditorPanelProps {
    blockKey: EditableWV3BlockKey
    blocks: WebsiteV3Blocks
    onSave: (blocks: WebsiteV3Blocks) => void
    onClose: () => void
    offerContext?: OfferContext
}

export function WebsiteV3BlockEditorPanel({ blockKey, blocks, onSave, onClose, offerContext }: WebsiteV3BlockEditorPanelProps) {
    const label = SECTION_LABELS[blockKey]

    function renderEditor() {
        switch (blockKey) {
            case 'cover':        return <CoverEditorV3 blocks={blocks} onChange={onSave} />
            case 'footer':       return <FooterEditorV3 blocks={blocks} onChange={onSave} />
            case 'needs':        return <NeedsEditor blocks={blocks} onChange={onSave} offerContext={offerContext} />
            case 'packages':     return <PackagesEditor blocks={blocks} onChange={onSave} />
            case 'process':      return <ProcessEditorV3 blocks={blocks} onChange={onSave} offerContext={offerContext} />
            case 'scope':        return <ScopeEditorV3 blocks={blocks} onChange={onSave} />
            case 'timeline':     return <TimelineEditorV3 blocks={blocks} onChange={onSave} />
            case 'pricing':      return <PricingEditorV3 blocks={blocks} onChange={onSave} />
            case 'portfolio':    return <PortfolioEditorV3 blocks={blocks} onChange={onSave} />
            case 'testimonials': return <TestimonialsEditor blocks={blocks} onChange={onSave} offerContext={offerContext} />
            case 'about':        return <AboutEditorV3 blocks={blocks} onChange={onSave} offerContext={offerContext} />
            case 'stack':        return <StackEditor blocks={blocks} onChange={onSave} />
            case 'terms':        return <TermsEditor blocks={blocks} onChange={onSave} offerContext={offerContext} />
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-sm">{label}</h3>
                <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {renderEditor()}
            </div>
        </div>
    )
}

// ── Section manager panel ─────────────────────────────────────────────────────

interface WebsiteV3SectionManagerPanelProps {
    blocks: WebsiteV3Blocks
    onSave: (blocks: WebsiteV3Blocks) => void
    onClose: () => void
}

export function WebsiteV3SectionManagerPanel({ blocks, onSave, onClose }: WebsiteV3SectionManagerPanelProps) {
    const active = blocks.sections
    const removed = DEFAULT_WV3_SECTIONS.filter((k) => !active.includes(k))

    const update = (sections: WebsiteV3SectionKey[]) => onSave({ ...blocks, sections })

    const move = (i: number, dir: -1 | 1) => {
        const next = [...active]
        const j = i + dir
        if (j < 0 || j >= next.length) return
        ;[next[i], next[j]] = [next[j], next[i]]
        update(next)
    }

    const toggle = (key: WebsiteV3SectionKey) => {
        const section = blocks[key] as { enabled?: boolean }
        onSave({ ...blocks, [key]: { ...section, enabled: !(section.enabled !== false) } })
    }

    const remove = (key: WebsiteV3SectionKey) => update(active.filter((k) => k !== key))
    const restore = (key: WebsiteV3SectionKey) => update([...active, key])

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-sm">Sekcje dokumentu</h3>
                <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    {active.map((key, i) => {
                        const section = blocks[key] as { enabled?: boolean }
                        const enabled = section.enabled !== false
                        return (
                            <div key={key} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                                <span className="flex-1 text-sm font-medium">{SECTION_LABELS[key as EditableWV3BlockKey] ?? key}</span>
                                <button type="button" title="W górę" onClick={() => move(i, -1)} disabled={i === 0}>
                                    <ArrowUp className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                </button>
                                <button type="button" title="W dół" onClick={() => move(i, 1)} disabled={i === active.length - 1}>
                                    <ArrowDown className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                </button>
                                <button type="button" title={enabled ? 'Ukryj' : 'Pokaż'} onClick={() => toggle(key)}>
                                    {enabled
                                        ? <Eye className="w-4 h-4 text-primary" />
                                        : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                                </button>
                                <button type="button" title="Usuń z dokumentu" onClick={() => remove(key)}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </button>
                            </div>
                        )
                    })}
                </div>
                {removed.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Usunięte z dokumentu</p>
                        {removed.map((key) => (
                            <div key={key} className="flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 opacity-60">
                                <span className="flex-1 text-sm">{SECTION_LABELS[key as EditableWV3BlockKey] ?? key}</span>
                                <button type="button" title="Przywróć" onClick={() => restore(key)}>
                                    <Plus className="w-4 h-4 text-primary" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
