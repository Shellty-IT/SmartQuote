// src/components/offers/editor/BlockEditorPanel.tsx
// Slide-in side panel for editing one proposal block at a time.
// Also exports SectionManagerPanel for managing section order / visibility.
'use client'

import { useState, useEffect } from 'react'
import { X, Save, Eye, EyeOff, Trash2, ChevronUp, ChevronDown, Layers } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { ProposalBlocks, SectionKey } from '@/lib/pdf/proposal-blocks'
import { ALL_SECTION_KEYS } from '@/lib/pdf/proposal-blocks'
import {
    type OfferContext,
    HeaderEditor,
    FooterEditor,
    IntroEditor,
    DemoEditor,
    StructureEditor,
    ScopeEditor,
    TestingEditor,
    TechnologyEditor,
    PricingEditor,
    AboutEditor,
    BenefitsEditor,
    ProcessEditor,
    StatsEditor,
} from './block-editors'
import type {
    HeaderBlock,
    FooterBlock,
    IntroBlock,
    DemoBlock,
    StructureBlock,
    ScopeBlock,
    TestingBlock,
    TechnologyBlock,
    PricingExtraBlock,
    AboutBlock,
    BenefitsBlock,
    ProcessBlock,
    StatsBlock,
} from '@/lib/pdf/proposal-blocks'

export type { OfferContext }

// Build a plain-text summary of what the offer covers — fed to the AI price suggester.
function stripHtmlText(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function buildScopeSummary(blocks: ProposalBlocks): string {
    const lines: string[] = []
    if (blocks.structure.enabled && blocks.structure.items.length) {
        lines.push('Struktura:')
        blocks.structure.items.forEach((it) => {
            const name = stripHtmlText(it.name)
            const desc = stripHtmlText(it.description)
            if (name || desc) lines.push(`- ${name}${desc ? ` — ${desc}` : ''}`)
        })
    }
    if (blocks.scope.enabled && blocks.scope.items.length) {
        lines.push('Zakres:')
        blocks.scope.items.forEach((it) => {
            const t = stripHtmlText(it.html)
            if (t) lines.push(`- ${t}`)
        })
    }
    return lines.join('\n').slice(0, 3500)
}

// ── Block metadata ────────────────────────────────────────────────────────────

const BLOCK_META: Record<
    keyof Omit<ProposalBlocks, 'version' | 'page1Sections' | 'page2Sections' | 'pageBreakAfter'>,
    { label: string; icon: string; alwaysEnabled?: boolean }
> = {
    header:       { label: 'Nagłówek dokumentu', icon: '🏷️', alwaysEnabled: true },
    footer:       { label: 'Stopka dokumentu',   icon: '📄', alwaysEnabled: true },
    intro:        { label: 'Wprowadzenie',        icon: '📝' },
    demo:         { label: 'Demo / Podgląd',      icon: '💻' },
    structure:    { label: 'Struktura strony',    icon: '🗂️' },
    scope:        { label: 'Zakres realizacji',   icon: '📦' },
    testing:      { label: 'Środowisko testowe',  icon: '🔬' },
    technology:   { label: 'Technologia',         icon: '⚙️' },
    pricingExtra: { label: 'Wycena i termin',     icon: '💰' },
    about:        { label: 'CTA / O nas',         icon: '🙋' },
    benefits:     { label: 'Korzyści / Dlaczego my', icon: '⭐' },
    process:      { label: 'Etapy współpracy',    icon: '🧭' },
    stats:        { label: 'Statystyki',          icon: '📊' },
}

// ── Section manager ───────────────────────────────────────────────────────────

const SECTION_META: Record<SectionKey, { label: string; icon: string }> = {
    intro:        { label: 'Wprowadzenie',       icon: '📝' },
    demo:         { label: 'Demo / Podgląd',     icon: '💻' },
    structure:    { label: 'Struktura strony',   icon: '🗂️' },
    scope:        { label: 'Zakres realizacji',  icon: '📦' },
    testing:      { label: 'Środowisko testowe', icon: '🔬' },
    technology:   { label: 'Technologia',        icon: '⚙️' },
    pricingExtra: { label: 'Wycena i termin',    icon: '💰' },
    about:        { label: 'CTA / O nas',        icon: '🙋' },
    benefits:     { label: 'Korzyści / Dlaczego my', icon: '⭐' },
    process:      { label: 'Etapy współpracy',   icon: '🧭' },
    stats:        { label: 'Statystyki',         icon: '📊' },
}

export interface SectionManagerPanelProps {
    blocks: ProposalBlocks
    onSave: (updatedBlocks: ProposalBlocks) => void
    onClose: () => void
}

export function SectionManagerPanel({ blocks, onSave, onClose }: SectionManagerPanelProps) {
    const [draft, setDraft] = useState<ProposalBlocks>(blocks)

    useEffect(() => { setDraft(blocks) }, [blocks])

    const removedKeys = ALL_SECTION_KEYS.filter(
        (k) => !draft.page1Sections.includes(k) && !draft.page2Sections.includes(k),
    )
    const pageBreakAfter = draft.pageBreakAfter ?? []

    const moveUp = (page: 1 | 2, idx: number) => {
        if (idx === 0) return
        const key = page === 1 ? 'page1Sections' : 'page2Sections'
        const arr = [...draft[key]]
        ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
        setDraft((prev) => ({ ...prev, [key]: arr }))
    }

    const moveDown = (page: 1 | 2, idx: number) => {
        const key = page === 1 ? 'page1Sections' : 'page2Sections'
        const arr = [...draft[key]]
        if (idx >= arr.length - 1) return
        ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
        setDraft((prev) => ({ ...prev, [key]: arr }))
    }

    const movePage = (sectionKey: SectionKey, from: 1 | 2) => {
        const fromKey = from === 1 ? 'page1Sections' : 'page2Sections'
        const toKey = from === 1 ? 'page2Sections' : 'page1Sections'
        setDraft((prev) => ({
            ...prev,
            [fromKey]: prev[fromKey].filter((k) => k !== sectionKey),
            [toKey]: [...prev[toKey], sectionKey],
        }))
    }

    const removeSection = (sectionKey: SectionKey) => {
        setDraft((prev) => ({
            ...prev,
            page1Sections: prev.page1Sections.filter((k) => k !== sectionKey),
            page2Sections: prev.page2Sections.filter((k) => k !== sectionKey),
            pageBreakAfter: (prev.pageBreakAfter ?? []).filter((k) => k !== sectionKey),
        }))
    }

    const addToPage = (sectionKey: SectionKey, page: 1 | 2) => {
        const key = page === 1 ? 'page1Sections' : 'page2Sections'
        setDraft((prev) => ({ ...prev, [key]: [...prev[key], sectionKey] }))
    }

    const toggleEnabled = (sectionKey: SectionKey) => {
        const block = draft[sectionKey] as { enabled: boolean }
        setDraft((prev) => ({
            ...prev,
            [sectionKey]: { ...block, enabled: !block.enabled },
        }))
    }

    const togglePageBreakAfter = (sectionKey: SectionKey) => {
        setDraft((prev) => {
            const current = prev.pageBreakAfter ?? []
            return {
                ...prev,
                pageBreakAfter: current.includes(sectionKey)
                    ? current.filter((k) => k !== sectionKey)
                    : [...current, sectionKey],
            }
        })
    }

    const renderPageGroup = (page: 1 | 2) => {
        const sections = page === 1 ? draft.page1Sections : draft.page2Sections
        return (
            <div className="mb-4">
                <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Strona {page}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                </div>
                {sections.length === 0 && (
                    <p className="text-xs text-muted-foreground italic px-1 py-2">Brak sekcji na tej stronie</p>
                )}
                <div className="space-y-1">
                    {sections.map((key, idx) => {
                        const meta = SECTION_META[key]
                        const blockEnabled = (draft[key] as { enabled: boolean }).enabled
                        const breaksAfter = pageBreakAfter.includes(key)
                        return (
                            <div
                                key={key}
                                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1.5 shadow-sm"
                            >
                                {/* Up/down */}
                                <div className="flex flex-col gap-0.5">
                                    <button
                                        type="button"
                                        onClick={() => moveUp(page, idx)}
                                        disabled={idx === 0}
                                        className="rounded p-0.5 text-muted-foreground hover:bg-secondary/60 disabled:opacity-25"
                                        title="Przesuń w górę"
                                    >
                                        <ChevronUp className="h-3 w-3" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => moveDown(page, idx)}
                                        disabled={idx === sections.length - 1}
                                        className="rounded p-0.5 text-muted-foreground hover:bg-secondary/60 disabled:opacity-25"
                                        title="Przesuń w dół"
                                    >
                                        <ChevronDown className="h-3 w-3" />
                                    </button>
                                </div>

                                {/* Icon + label */}
                                <span className="text-sm leading-none">{meta.icon}</span>
                                <span className="flex-1 min-w-0 text-xs font-medium text-foreground truncate">
                                    {meta.label}
                                </span>

                                {/* Visibility toggle */}
                                <button
                                    type="button"
                                    onClick={() => toggleEnabled(key)}
                                    title={blockEnabled ? 'Ukryj w PDF' : 'Pokaż w PDF'}
                                    className={cn(
                                        'rounded p-1 transition-colors',
                                        blockEnabled
                                            ? 'text-primary hover:bg-primary/10'
                                            : 'text-muted-foreground hover:bg-secondary/60',
                                    )}
                                >
                                    {blockEnabled
                                        ? <Eye className="h-3.5 w-3.5" />
                                        : <EyeOff className="h-3.5 w-3.5" />}
                                </button>

                                {/* Move to other page */}
                                <button
                                    type="button"
                                    onClick={() => movePage(key, page)}
                                    title={`Przenieś na stronę ${page === 1 ? 2 : 1}`}
                                    className="rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border hover:bg-secondary/60 whitespace-nowrap"
                                >
                                    → str.{page === 1 ? 2 : 1}
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

                                {/* Remove */}
                                <button
                                    type="button"
                                    onClick={() => removeSection(key)}
                                    title="Usuń z dokumentu"
                                    className="rounded p-1 text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col bg-card">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <Layers className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Zarządzaj sekcjami</p>
                    <p className="text-xs text-muted-foreground">Kolejność, widoczność, przenoszenie między stronami</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                {renderPageGroup(1)}
                {renderPageGroup(2)}

                {/* Removed sections pool */}
                {removedKeys.length > 0 && (
                    <div>
                        <div className="mb-1.5 flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Usunięte z dokumentu
                            </span>
                            <div className="flex-1 h-px bg-border" />
                        </div>
                        <div className="space-y-1">
                            {removedKeys.map((key) => {
                                const meta = SECTION_META[key]
                                return (
                                    <div
                                        key={key}
                                        className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-2 py-1.5"
                                    >
                                        <span className="text-sm leading-none opacity-50">{meta.icon}</span>
                                        <span className="flex-1 min-w-0 text-xs text-muted-foreground truncate">{meta.label}</span>
                                        <button
                                            type="button"
                                            onClick={() => addToPage(key, 1)}
                                            className="rounded px-1.5 py-0.5 text-[10px] font-medium text-primary border border-primary/30 hover:bg-primary/10 whitespace-nowrap"
                                        >
                                            + str.1
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => addToPage(key, 2)}
                                            className="rounded px-1.5 py-0.5 text-[10px] font-medium text-primary border border-primary/30 hover:bg-primary/10 whitespace-nowrap"
                                        >
                                            + str.2
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                <div className="mt-4 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground leading-relaxed">
                    💡 <strong>Nagłówek</strong> i <strong>stopka</strong> są zawsze widoczne na każdej stronie.<br />
                    👁️ ikona kontroluje widoczność sekcji w wygenerowanym PDF.<br />
                    W podglądzie sekcje ukryte są przyciemnione.
                </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-2 border-t border-border px-4 py-3">
                <Button onClick={() => onSave(draft)} size="sm" className="flex-1">
                    <Save className="h-3.5 w-3.5" />
                    Zastosuj zmiany
                </Button>
                <Button variant="outline" size="sm" onClick={onClose}>
                    Anuluj
                </Button>
            </div>
        </div>
    )
}

// ── Main block editor panel ───────────────────────────────────────────────────

export type EditableBlockKey = keyof Omit<ProposalBlocks, 'version' | 'page1Sections' | 'page2Sections' | 'pageBreakAfter'>

export interface BlockEditorPanelProps {
    blockKey: EditableBlockKey
    blocks: ProposalBlocks
    onSave: (updatedBlocks: ProposalBlocks) => void
    onClose: () => void
    /** Passed for AI section generation */
    offerContext?: OfferContext
}

export function BlockEditorPanel({ blockKey, blocks, onSave, onClose, offerContext }: BlockEditorPanelProps) {
    const [draft, setDraft] = useState<ProposalBlocks>(blocks)
    const meta = BLOCK_META[blockKey]

    useEffect(() => {
        setDraft(blocks)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blockKey])

    const isEnabled = (draft[blockKey] as { enabled: boolean }).enabled
    const isAlwaysEnabled = meta.alwaysEnabled === true

    const toggleEnabled = () => {
        if (isAlwaysEnabled) return
        setDraft((prev) => ({
            ...prev,
            [blockKey]: { ...(prev[blockKey] as object), enabled: !isEnabled },
        }))
    }

    const handleSave = () => { onSave(draft) }

    const updateBlock = (updated: ProposalBlocks[typeof blockKey]) => {
        setDraft((prev) => ({ ...prev, [blockKey]: updated }))
    }

    function renderEditor() {
        switch (blockKey) {
            case 'header':       return <HeaderEditor block={draft.header} onChange={updateBlock as (b: HeaderBlock) => void} />
            case 'footer':       return <FooterEditor block={draft.footer} onChange={updateBlock as (b: FooterBlock) => void} />
            case 'intro':        return <IntroEditor block={draft.intro} onChange={updateBlock as (b: IntroBlock) => void} offerContext={offerContext} />
            case 'demo':         return <DemoEditor block={draft.demo} onChange={updateBlock as (b: DemoBlock) => void} offerContext={offerContext} />
            case 'structure':    return <StructureEditor block={draft.structure} onChange={updateBlock as (b: StructureBlock) => void} offerContext={offerContext} />
            case 'scope':        return <ScopeEditor block={draft.scope} onChange={updateBlock as (b: ScopeBlock) => void} offerContext={offerContext} />
            case 'testing':      return <TestingEditor block={draft.testing} onChange={updateBlock as (b: TestingBlock) => void} offerContext={offerContext} />
            case 'technology':   return <TechnologyEditor block={draft.technology} onChange={updateBlock as (b: TechnologyBlock) => void} offerContext={offerContext} />
            case 'pricingExtra': return <PricingEditor block={draft.pricingExtra} onChange={updateBlock as (b: PricingExtraBlock) => void} offerContext={offerContext} scopeSummary={buildScopeSummary(draft)} />
            case 'about':        return <AboutEditor block={draft.about} onChange={updateBlock as (b: AboutBlock) => void} offerContext={offerContext} />
            case 'benefits':     return <BenefitsEditor block={draft.benefits} onChange={updateBlock as (b: BenefitsBlock) => void} offerContext={offerContext} />
            case 'process':      return <ProcessEditor block={draft.process} onChange={updateBlock as (b: ProcessBlock) => void} offerContext={offerContext} />
            case 'stats':        return <StatsEditor block={draft.stats} onChange={updateBlock as (b: StatsBlock) => void} offerContext={offerContext} />
            default:             return null
        }
    }

    return (
        <div className="flex h-full flex-col bg-card">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <span className="text-lg leading-none">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{meta.label}</p>
                    <p className="text-xs text-muted-foreground">Edytuj treść sekcji</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Enable/disable toggle — hidden for always-enabled blocks like header/footer */}
            {!isAlwaysEnabled && (
                <div className="flex items-center justify-between border-b border-border px-4 py-2">
                    <span className="text-xs text-muted-foreground">Sekcja widoczna w dokumencie</span>
                    <button
                        type="button"
                        onClick={toggleEnabled}
                        className={cn(
                            'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                            isEnabled
                                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80',
                        )}
                    >
                        {isEnabled ? (
                            <><Eye className="h-3.5 w-3.5" /> Widoczna</>
                        ) : (
                            <><EyeOff className="h-3.5 w-3.5" /> Ukryta</>
                        )}
                    </button>
                </div>
            )}

            {/* Editor content */}
            <div
                className={cn(
                    'flex-1 overflow-y-auto px-4 py-4 transition-opacity',
                    !isEnabled && !isAlwaysEnabled && 'pointer-events-none opacity-40',
                )}
            >
                {renderEditor()}
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-2 border-t border-border px-4 py-3">
                <Button onClick={handleSave} size="sm" className="flex-1">
                    <Save className="h-3.5 w-3.5" />
                    Zapisz zmiany
                </Button>
                <Button variant="outline" size="sm" onClick={onClose}>
                    Anuluj
                </Button>
            </div>
        </div>
    )
}
