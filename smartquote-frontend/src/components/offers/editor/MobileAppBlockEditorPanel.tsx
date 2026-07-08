// src/components/offers/editor/MobileAppBlockEditorPanel.tsx
// Side panel + section manager for "Aplikacja mobilna - zaawansowana".
'use client'

import { Layers, X, ChevronUp, ChevronDown, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui'
import type { MobileAppBlocks, MobileAppPageBreakKey, MobileAppSectionKey } from '@/lib/pdf/mobile-app-blocks'
import {
    CoverEditor, FooterEditor, VisionEditor, PlatformEditor, ScopeEditor,
    ArchitectureEditor, TimelineEditor, PricingEditor, PostLaunchEditor, AboutEditor,
} from './mobile-app-block-editors'
import type { OfferContext } from './block-editors'

export type EditableMobileAppBlockKey = MobileAppSectionKey | 'cover' | 'footer'

const SECTION_LABELS: Record<MobileAppSectionKey, string> = {
    vision: 'Wizja projektu',
    platform: 'Wybór technologii',
    scope: 'Zakres funkcji (MVP / Full)',
    architecture: 'Architektura techniczna',
    timeline: 'Harmonogram & Etapy',
    pricing: 'Szczegółowa wycena',
    postlaunch: 'Post-launch & Utrzymanie',
    about: 'O mnie / portfolio',
}

const BLOCK_LABELS: Record<EditableMobileAppBlockKey, string> = {
    cover: 'Okładka',
    footer: 'Stopka / CTA',
    ...SECTION_LABELS,
}

const ALL_SECTION_KEYS: MobileAppSectionKey[] = [
    'vision', 'platform', 'scope', 'architecture', 'timeline', 'pricing', 'postlaunch', 'about',
]

export type PanelView = { kind: 'block'; key: string } | { kind: 'sections' } | null

interface Props {
    view: PanelView
    blocks: MobileAppBlocks
    onChange: (b: MobileAppBlocks) => void
    onClose: () => void
    onOpenSections: () => void
    offerContext?: OfferContext
}

function renderEditor(key: EditableMobileAppBlockKey, blocks: MobileAppBlocks, onChange: (b: MobileAppBlocks) => void, offerContext?: OfferContext) {
    switch (key) {
        case 'cover':        return <CoverEditor blocks={blocks} onChange={onChange} />
        case 'footer':       return <FooterEditor blocks={blocks} onChange={onChange} />
        case 'vision':       return <VisionEditor blocks={blocks} onChange={onChange} offerContext={offerContext} />
        case 'platform':     return <PlatformEditor blocks={blocks} onChange={onChange} />
        case 'scope':        return <ScopeEditor blocks={blocks} onChange={onChange} offerContext={offerContext} />
        case 'architecture': return <ArchitectureEditor blocks={blocks} onChange={onChange} />
        case 'timeline':     return <TimelineEditor blocks={blocks} onChange={onChange} offerContext={offerContext} />
        case 'pricing':      return <PricingEditor blocks={blocks} onChange={onChange} />
        case 'postlaunch':   return <PostLaunchEditor blocks={blocks} onChange={onChange} offerContext={offerContext} />
        case 'about':        return <AboutEditor blocks={blocks} onChange={onChange} offerContext={offerContext} />
        default:             return null
    }
}

// ── Section manager ───────────────────────────────────────────────────────────

function MobileAppSectionManagerPanel({
    blocks,
    onChange,
    onClose,
}: {
    blocks: MobileAppBlocks
    onChange: (b: MobileAppBlocks) => void
    onClose: () => void
}) {
    const active = blocks.sections
    const deleted = ALL_SECTION_KEYS.filter(k => !active.includes(k))
    const pageBreakAfter = blocks.pageBreakAfter ?? []

    function move(idx: number, dir: -1 | 1) {
        const next = [...active]
        const target = idx + dir
        if (target < 0 || target >= next.length) return
        ;[next[idx], next[target]] = [next[target], next[idx]]
        onChange({ ...blocks, sections: next })
    }

    function remove(key: MobileAppSectionKey) {
        onChange({
            ...blocks,
            sections: active.filter(k => k !== key),
            pageBreakAfter: pageBreakAfter.filter(k => k !== key),
        })
    }

    function restore(key: MobileAppSectionKey) {
        onChange({ ...blocks, sections: [...active, key] })
    }

    function togglePageBreakAfter(key: MobileAppPageBreakKey) {
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
                <div className="flex items-center gap-2 font-semibold text-sm">
                    <Layers className="w-4 h-4" />
                    Zarządzaj sekcjami
                </div>
                <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card">
                    <span className="flex-1 text-sm font-medium">{BLOCK_LABELS.cover}</span>
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
                    <div key={key} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card">
                        <span className="flex-1 text-sm font-medium">{SECTION_LABELS[key]}</span>
                        <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1 hover:bg-muted rounded disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => move(i, 1)} disabled={i === active.length - 1} className="p-1 hover:bg-muted rounded disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => remove(key)} className="p-1 hover:bg-destructive/10 text-destructive rounded"><EyeOff className="w-3.5 h-3.5" /></button>
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
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-1">Usunięte z dokumentu</div>
                        {deleted.map(key => (
                            <div key={key} className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-muted bg-muted/30 opacity-60">
                                <span className="flex-1 text-sm">{SECTION_LABELS[key]}</span>
                                <button type="button" onClick={() => restore(key)} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Eye className="w-3.5 h-3.5" /></button>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function MobileAppBlockEditorPanel({ view, blocks, onChange, onClose, onOpenSections, offerContext }: Props) {
    const isSectionsView = view?.kind === 'sections'

    if (isSectionsView) {
        return (
            <MobileAppSectionManagerPanel
                blocks={blocks}
                onChange={onChange}
                onClose={onClose}
            />
        )
    }

    const activeKey = view?.kind === 'block' ? (view.key as EditableMobileAppBlockKey) : null

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
                    <button type="button" onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
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
