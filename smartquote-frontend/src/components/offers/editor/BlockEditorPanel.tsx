// src/components/offers/editor/BlockEditorPanel.tsx
// Slide-in side panel for editing one proposal block at a time.
// Also exports SectionManagerPanel for managing section order / visibility.
'use client'

import { useState, useEffect } from 'react'
import { X, Save, Eye, EyeOff, Plus, Trash2, ChevronUp, ChevronDown, Sparkles, Layers } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { ai } from '@/lib/api'
import type {
    ProposalBlocks,
    SectionKey,
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
    StructureItem,
    ScopeItem,
    TestingCard,
    TechOption,
    DemoUrl,
} from '@/lib/pdf/proposal-blocks'
import { ALL_SECTION_KEYS } from '@/lib/pdf/proposal-blocks'

// ── Shared input styles ───────────────────────────────────────────────────────

const inputCls =
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30'
const textareaCls = `${inputCls} resize-y min-h-[72px]`
const labelCls = 'block text-xs font-medium text-muted-foreground mb-1'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="mb-3">
            <label className={labelCls}>{label}</label>
            {children}
        </div>
    )
}

// ── AI Generate button ────────────────────────────────────────────────────────

interface AiGenerateButtonProps {
    sectionKey: string
    offerContext?: OfferContext
    onResult: (data: Record<string, unknown>) => void
}

function AiGenerateButton({ sectionKey, offerContext, onResult }: AiGenerateButtonProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!offerContext) return null

    const handleGenerate = async () => {
        setLoading(true)
        setError(null)
        try {
            const result = await ai.generateSection({
                sectionKey,
                offerTitle: offerContext.title,
                clientName: offerContext.clientName,
                totalGross: offerContext.totalGross,
                currency: offerContext.currency,
            })
            if (Object.keys(result).length === 0) {
                setError('AI nie zwróciło danych — spróbuj ponownie.')
            } else {
                onResult(result)
            }
        } catch {
            setError('Błąd połączenia z AI.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="mb-4">
            <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
                <Sparkles className="h-3.5 w-3.5" />
                {loading ? 'Generowanie…' : '✨ Generuj z AI'}
            </button>
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
    )
}

// ── Block-specific editors ────────────────────────────────────────────────────

function HeaderEditor({ block, onChange }: { block: HeaderBlock; onChange: (b: HeaderBlock) => void }) {
    return (
        <div>
            <Field label="Tekst etykiety (tag)">
                <input
                    className={inputCls}
                    value={block.tag}
                    placeholder="Oferta handlowa"
                    onChange={(e) => onChange({ ...block, tag: e.target.value })}
                />
            </Field>
            <div className="rounded-lg bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
                💡 <strong>Tytuł oferty</strong> i <strong>nazwa klienta</strong> pobierane są automatycznie z danych oferty.<br />
                <strong>Logo</strong> pochodzi z <em>Ustawienia → Firma → Logo</em>.<br />
                <strong>Strona firmowa</strong> pochodzi z <em>Ustawienia → Firma → Witryna</em>.
            </div>
        </div>
    )
}

function FooterEditor({ block, onChange }: { block: FooterBlock; onChange: (b: FooterBlock) => void }) {
    return (
        <div>
            <Field label='Tekst po "przygotowana"'>
                <input
                    className={inputCls}
                    value={block.customNote}
                    placeholder="indywidualnie"
                    onChange={(e) => onChange({ ...block, customNote: e.target.value })}
                />
            </Field>
            <p className="mb-3 text-xs text-muted-foreground">
                Efekt: <em>„Oferta przygotowana <strong>{block.customNote || '…'}</strong> dla Klient · Strona 1 / 2&rdquo;</em>
            </p>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-xs text-muted-foreground">Pokaż imię i nazwisko autora w stopce</span>
                <button
                    type="button"
                    onClick={() => onChange({ ...block, showAuthor: !block.showAuthor })}
                    className={cn(
                        'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                        block.showAuthor
                            ? 'bg-primary/10 text-primary hover:bg-primary/20'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                >
                    {block.showAuthor ? '✓ Widoczny' : '✗ Ukryty'}
                </button>
            </div>
            <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                💡 Strona firmowa pobierana automatycznie z <em>Ustawienia → Firma</em>.
            </div>
        </div>
    )
}

function IntroEditor({
    block, onChange, offerContext,
}: { block: IntroBlock; onChange: (b: IntroBlock) => void; offerContext?: OfferContext }) {
    const upd = (paragraphs: string[]) => onChange({ ...block, paragraphs })
    return (
        <div>
            <AiGenerateButton
                sectionKey="intro"
                offerContext={offerContext}
                onResult={(data) => {
                    const paragraphs = data.paragraphs
                    if (Array.isArray(paragraphs)) upd(paragraphs as string[])
                }}
            />
            {block.paragraphs.map((p, i) => (
                <Field key={i} label={`Akapit ${i + 1}`}>
                    <div className="flex gap-2">
                        <textarea
                            className={textareaCls}
                            value={p}
                            onChange={(e) => {
                                const next = [...block.paragraphs]
                                next[i] = e.target.value
                                upd(next)
                            }}
                        />
                        {block.paragraphs.length > 1 && (
                            <button
                                type="button"
                                onClick={() => upd(block.paragraphs.filter((_, j) => j !== i))}
                                className="self-start rounded-md border border-border p-1.5 text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </Field>
            ))}
            <button
                type="button"
                onClick={() => upd([...block.paragraphs, ''])}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
                <Plus className="h-3 w-3" /> Dodaj akapit
            </button>
        </div>
    )
}

function DemoEditor({
    block, onChange, offerContext,
}: { block: DemoBlock; onChange: (b: DemoBlock) => void; offerContext?: OfferContext }) {
    const s = (p: Partial<DemoBlock>) => onChange({ ...block, ...p })
    const upUrl = (i: number, p: Partial<DemoUrl>) =>
        s({ urls: block.urls.map((u, j) => (j === i ? { ...u, ...p } : u)) })
    return (
        <div>
            <AiGenerateButton
                sectionKey="demo"
                offerContext={offerContext}
                onResult={(data) => {
                    if (typeof data.title === 'string') s({ title: data.title })
                    if (typeof data.body === 'string') s({ body: data.body })
                    if (typeof data.note === 'string') s({ note: data.note })
                }}
            />
            <Field label="Tytuł sekcji">
                <input className={inputCls} value={block.title} onChange={(e) => s({ title: e.target.value })} />
            </Field>
            <Field label="Treść wprowadzająca">
                <textarea className={textareaCls} value={block.body} onChange={(e) => s({ body: e.target.value })} />
            </Field>
            <label className={labelCls}>Linki do demo</label>
            {block.urls.map((u, i) => (
                <div key={i} className="mb-2 rounded-lg border border-border p-3">
                    <Field label={`URL ${i + 1}`}>
                        <input
                            className={inputCls}
                            value={u.href}
                            placeholder="https://"
                            onChange={(e) => upUrl(i, { href: e.target.value })}
                        />
                    </Field>
                    <Field label="Etykieta">
                        <input
                            className={inputCls}
                            value={u.label}
                            onChange={(e) => upUrl(i, { label: e.target.value })}
                        />
                    </Field>
                </div>
            ))}
            <button
                type="button"
                onClick={() => s({ urls: [...block.urls, { href: 'https://', label: '' }] })}
                className="mb-3 flex items-center gap-1 text-xs text-primary hover:underline"
            >
                <Plus className="h-3 w-3" /> Dodaj link
            </button>
            <Field label="Ostrzeżenie (opcjonalnie)">
                <input
                    className={inputCls}
                    value={block.warning ?? ''}
                    placeholder="np. środowisko testowe"
                    onChange={(e) => s({ warning: e.target.value })}
                />
            </Field>
            <Field label="Nota (opcjonalnie)">
                <input
                    className={inputCls}
                    value={block.note ?? ''}
                    placeholder="dodatkowe info w kursywie"
                    onChange={(e) => s({ note: e.target.value })}
                />
            </Field>
        </div>
    )
}

function StructureEditor({
    block, onChange, offerContext,
}: { block: StructureBlock; onChange: (b: StructureBlock) => void; offerContext?: OfferContext }) {
    const s = (p: Partial<StructureBlock>) => onChange({ ...block, ...p })
    const upItem = (i: number, p: Partial<StructureItem>) =>
        s({ items: block.items.map((it, j) => (j === i ? { ...it, ...p } : it)) })
    return (
        <div>
            <AiGenerateButton
                sectionKey="structure"
                offerContext={offerContext}
                onResult={(data) => {
                    if (typeof data.title === 'string') s({ title: data.title })
                    if (Array.isArray(data.items)) s({ items: data.items as StructureItem[] })
                }}
            />
            <Field label="Tytuł sekcji">
                <input className={inputCls} value={block.title} onChange={(e) => s({ title: e.target.value })} />
            </Field>
            {block.items.map((item, i) => (
                <div key={i} className="mb-2 rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Element #{i + 1}</span>
                        <button
                            type="button"
                            onClick={() => s({ items: block.items.filter((_, j) => j !== i) })}
                            className="rounded-md p-1 text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div className="grid grid-cols-[56px_1fr] gap-2">
                        <Field label="Ikona">
                            <input className={inputCls} value={item.icon} onChange={(e) => upItem(i, { icon: e.target.value })} />
                        </Field>
                        <Field label="Nazwa">
                            <input className={inputCls} value={item.name} onChange={(e) => upItem(i, { name: e.target.value })} />
                        </Field>
                    </div>
                    <Field label="Opis">
                        <input className={inputCls} value={item.description} onChange={(e) => upItem(i, { description: e.target.value })} />
                    </Field>
                </div>
            ))}
            <button
                type="button"
                onClick={() => s({ items: [...block.items, { icon: '📋', name: '', description: '' }] })}
                className="mb-3 flex items-center gap-1 text-xs text-primary hover:underline"
            >
                <Plus className="h-3 w-3" /> Dodaj element
            </button>
            <Field label="Nota (opcjonalnie)">
                <input className={inputCls} value={block.note ?? ''} onChange={(e) => s({ note: e.target.value })} />
            </Field>
        </div>
    )
}

function ScopeEditor({
    block, onChange, offerContext,
}: { block: ScopeBlock; onChange: (b: ScopeBlock) => void; offerContext?: OfferContext }) {
    const s = (p: Partial<ScopeBlock>) => onChange({ ...block, ...p })
    const upItem = (i: number, p: Partial<ScopeItem>) =>
        s({ items: block.items.map((it, j) => (j === i ? { ...it, ...p } : it)) })
    return (
        <div>
            <AiGenerateButton
                sectionKey="scope"
                offerContext={offerContext}
                onResult={(data) => {
                    if (typeof data.title === 'string') s({ title: data.title })
                    if (Array.isArray(data.items)) s({ items: data.items as ScopeItem[] })
                }}
            />
            <Field label="Tytuł sekcji">
                <input className={inputCls} value={block.title} onChange={(e) => s({ title: e.target.value })} />
            </Field>
            {block.items.map((item, i) => (
                <div key={i} className="mb-2 flex gap-2">
                    <textarea
                        className={textareaCls}
                        value={item.html}
                        placeholder="Opis pozycji (HTML dozwolony)"
                        onChange={(e) => upItem(i, { html: e.target.value })}
                    />
                    <button
                        type="button"
                        onClick={() => s({ items: block.items.filter((_, j) => j !== i) })}
                        className="self-start rounded-md border border-border p-1.5 text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={() => s({ items: [...block.items, { html: '' }] })}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
                <Plus className="h-3 w-3" /> Dodaj pozycję
            </button>
        </div>
    )
}

function TestingEditor({
    block, onChange, offerContext,
}: { block: TestingBlock; onChange: (b: TestingBlock) => void; offerContext?: OfferContext }) {
    const s = (p: Partial<TestingBlock>) => onChange({ ...block, ...p })
    const upCard = (i: number, p: Partial<TestingCard>) =>
        s({ cards: block.cards.map((c, j) => (j === i ? { ...c, ...p } : c)) })
    return (
        <div>
            <AiGenerateButton
                sectionKey="testing"
                offerContext={offerContext}
                onResult={(data) => {
                    if (typeof data.intro === 'string') s({ intro: data.intro })
                    if (typeof data.note === 'string') s({ note: data.note })
                }}
            />
            <Field label="Tekst wstępny">
                <textarea className={textareaCls} value={block.intro} onChange={(e) => s({ intro: e.target.value })} />
            </Field>
            <label className={labelCls}>Karty</label>
            <div className="mb-3 grid grid-cols-2 gap-2">
                {block.cards.map((card, i) => (
                    <div key={i} className="rounded-lg border border-border p-3">
                        <div className="grid grid-cols-[48px_1fr] gap-2 mb-1">
                            <Field label="Ikona">
                                <input className={inputCls} value={card.icon} onChange={(e) => upCard(i, { icon: e.target.value })} />
                            </Field>
                            <Field label="Tytuł">
                                <input className={inputCls} value={card.title} onChange={(e) => upCard(i, { title: e.target.value })} />
                            </Field>
                        </div>
                        <Field label="Opis">
                            <input className={inputCls} value={card.description} onChange={(e) => upCard(i, { description: e.target.value })} />
                        </Field>
                    </div>
                ))}
            </div>
            <Field label="Nota (opcjonalnie)">
                <input className={inputCls} value={block.note ?? ''} onChange={(e) => s({ note: e.target.value })} />
            </Field>
        </div>
    )
}

function TechnologyEditor({
    block, onChange, offerContext,
}: { block: TechnologyBlock; onChange: (b: TechnologyBlock) => void; offerContext?: OfferContext }) {
    const s = (p: Partial<TechnologyBlock>) => onChange({ ...block, ...p })
    const upOpt = (i: number, p: Partial<TechOption>) =>
        s({ options: block.options.map((o, j) => (j === i ? { ...o, ...p } : o)) })
    const upUrl = (oi: number, ui: number, p: Partial<DemoUrl>) =>
        s({
            options: block.options.map((o, j) =>
                j !== oi ? o : { ...o, urls: o.urls.map((u, k) => (k === ui ? { ...u, ...p } : u)) },
            ),
        })
    return (
        <div>
            <AiGenerateButton
                sectionKey="technology"
                offerContext={offerContext}
                onResult={(data) => {
                    if (typeof data.body === 'string') s({ body: data.body })
                    if (typeof data.note === 'string') s({ note: data.note })
                }}
            />
            <Field label="Tekst wstępny">
                <textarea className={textareaCls} value={block.body} onChange={(e) => s({ body: e.target.value })} />
            </Field>
            {block.options.map((opt, i) => (
                <div key={i} className="mb-2 rounded-lg border border-border p-3">
                    <div className="grid grid-cols-[48px_1fr] gap-2 mb-2">
                        <Field label="Ikona">
                            <input className={inputCls} value={opt.icon} onChange={(e) => upOpt(i, { icon: e.target.value })} />
                        </Field>
                        <Field label={`Opcja ${i + 1} — tytuł`}>
                            <input className={inputCls} value={opt.title} onChange={(e) => upOpt(i, { title: e.target.value })} />
                        </Field>
                    </div>
                    {opt.urls.map((u, j) => (
                        <div key={j} className="grid grid-cols-2 gap-2">
                            <Field label="URL">
                                <input
                                    className={inputCls}
                                    value={u.href}
                                    placeholder="https://"
                                    onChange={(e) => upUrl(i, j, { href: e.target.value })}
                                />
                            </Field>
                            <Field label="Etykieta">
                                <input
                                    className={inputCls}
                                    value={u.label}
                                    onChange={(e) => upUrl(i, j, { label: e.target.value })}
                                />
                            </Field>
                        </div>
                    ))}
                </div>
            ))}
            <Field label="Nota (opcjonalnie)">
                <input className={inputCls} value={block.note ?? ''} onChange={(e) => s({ note: e.target.value })} />
            </Field>
        </div>
    )
}

function PricingEditor({
    block,
    onChange,
    offerContext,
}: {
    block: PricingExtraBlock
    onChange: (b: PricingExtraBlock) => void
    offerContext?: OfferContext
}) {
    const s = (p: Partial<PricingExtraBlock>) => onChange({ ...block, ...p })
    const currency = offerContext?.currency ?? 'PLN'
    const autoPrice = offerContext ? offerContext.totalGross.toFixed(2) : null

    return (
        <div className="space-y-3">
            <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                💡 Cena pobierana automatycznie z pozycji oferty. Wpisz wartość poniżej, aby ją nadpisać w dokumencie.
            </p>
            <Field label={`Nadpisz cenę (${currency})`}>
                <div className="flex items-center gap-2">
                    <input
                        className={inputCls}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={autoPrice != null ? `Automatycznie: ${autoPrice}` : 'Wartość z pozycji oferty'}
                        value={block.priceOverride ?? ''}
                        onChange={(e) => {
                            const val = e.target.value
                            s({ priceOverride: val === '' ? null : Number(val) })
                        }}
                    />
                    {block.priceOverride != null && (
                        <button
                            type="button"
                            onClick={() => s({ priceOverride: null })}
                            title="Przywróć automatyczną cenę"
                            className="shrink-0 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            Wyczyść
                        </button>
                    )}
                </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Czas realizacji">
                    <input className={inputCls} value={block.timeline} onChange={(e) => s({ timeline: e.target.value })} />
                </Field>
                <Field label="Podtytuł czasu">
                    <input className={inputCls} value={block.timelineSub} onChange={(e) => s({ timelineSub: e.target.value })} />
                </Field>
                <Field label="Forma współpracy">
                    <input className={inputCls} value={block.contractType} onChange={(e) => s({ contractType: e.target.value })} />
                </Field>
                <Field label="Podtytuł formy">
                    <input className={inputCls} value={block.contractSub} onChange={(e) => s({ contractSub: e.target.value })} />
                </Field>
            </div>
        </div>
    )
}

function AboutEditor({
    block, onChange, offerContext,
}: { block: AboutBlock; onChange: (b: AboutBlock) => void; offerContext?: OfferContext }) {
    return (
        <div>
            <AiGenerateButton
                sectionKey="about"
                offerContext={offerContext}
                onResult={(data) => {
                    if (typeof data.ctaText === 'string') onChange({ ...block, ctaText: data.ctaText })
                }}
            />
            <Field label="Tekst CTA (wezwanie do działania)">
                <textarea
                    className={textareaCls}
                    style={{ minHeight: 100 }}
                    value={block.ctaText}
                    onChange={(e) => onChange({ ...block, ctaText: e.target.value })}
                />
            </Field>
        </div>
    )
}

// ── Block metadata ────────────────────────────────────────────────────────────

const BLOCK_META: Record<
    keyof Omit<ProposalBlocks, 'version' | 'page1Sections' | 'page2Sections'>,
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

export type EditableBlockKey = keyof Omit<ProposalBlocks, 'version' | 'page1Sections' | 'page2Sections'>

export interface OfferContext {
    title: string
    clientName: string
    totalGross: number
    currency: string
}

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
            case 'pricingExtra': return <PricingEditor block={draft.pricingExtra} onChange={updateBlock as (b: PricingExtraBlock) => void} offerContext={offerContext} />
            case 'about':        return <AboutEditor block={draft.about} onChange={updateBlock as (b: AboutBlock) => void} offerContext={offerContext} />
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
