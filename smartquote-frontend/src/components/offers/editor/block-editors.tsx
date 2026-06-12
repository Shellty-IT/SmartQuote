// Primitive shared styles, Field wrapper, AiGenerateButton, and all section editors.
// Imported by BlockEditorPanel.tsx — do not import directly from other modules.
'use client'

import { useState } from 'react'
import { Plus, Trash2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ai } from '@/lib/api'
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
    StructureItem,
    ScopeItem,
    TestingCard,
    TechOption,
    DemoUrl,
} from '@/lib/pdf/proposal-blocks'

// ── Shared primitives ─────────────────────────────────────────────────────────

export const inputCls =
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30'
export const textareaCls = `${inputCls} resize-y min-h-[72px]`
export const labelCls = 'block text-xs font-medium text-muted-foreground mb-1'

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="mb-3">
            <label className={labelCls}>{label}</label>
            {children}
        </div>
    )
}

// ── Offer context type ────────────────────────────────────────────────────────

export interface OfferContext {
    title: string
    clientName: string
    totalGross: number
    currency: string
}

// ── AI Generate button ────────────────────────────────────────────────────────

interface AiGenerateButtonProps {
    sectionKey: string
    offerContext?: OfferContext
    onResult: (data: Record<string, unknown>) => void
}

export function AiGenerateButton({ sectionKey, offerContext, onResult }: AiGenerateButtonProps) {
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

// ── Section editors ───────────────────────────────────────────────────────────

export function HeaderEditor({ block, onChange }: { block: HeaderBlock; onChange: (b: HeaderBlock) => void }) {
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

export function FooterEditor({ block, onChange }: { block: FooterBlock; onChange: (b: FooterBlock) => void }) {
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

export function IntroEditor({
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

export function DemoEditor({
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

export function StructureEditor({
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

export function ScopeEditor({
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

export function TestingEditor({
    block, onChange, offerContext,
}: { block: TestingBlock; onChange: (b: TestingBlock) => void; offerContext?: OfferContext }) {
    const s = (p: Partial<TestingBlock>) => onChange({ ...block, ...p })
    const upCard = (i: number, p: Partial<TestingCard>) =>
        s({ cards: block.cards.map((c, j) => (j === i ? { ...c, ...p } : c)) })
    const removeCard = (i: number) => s({ cards: block.cards.filter((_, j) => j !== i) })
    const addCard = () => s({ cards: [...block.cards, { icon: '✅', title: 'Nowa karta', description: 'Opis' }] })
    return (
        <div>
            <AiGenerateButton
                sectionKey="testing"
                offerContext={offerContext}
                onResult={(data) => {
                    if (typeof data.intro === 'string') s({ intro: data.intro })
                    if (typeof data.note === 'string') s({ note: data.note })
                    if (Array.isArray(data.cards)) s({ cards: data.cards as TestingCard[] })
                }}
            />
            <Field label="Tekst wstępny">
                <textarea className={textareaCls} value={block.intro} onChange={(e) => s({ intro: e.target.value })} />
            </Field>
            <label className={labelCls}>Karty</label>
            <div className="mb-2 space-y-2">
                {block.cards.map((card, i) => (
                    <div key={i} className="rounded-lg border border-border p-3">
                        <div className="flex items-start gap-2">
                            <div className="flex-1 grid grid-cols-[48px_1fr] gap-2 mb-1">
                                <Field label="Ikona">
                                    <input className={inputCls} value={card.icon} onChange={(e) => upCard(i, { icon: e.target.value })} />
                                </Field>
                                <Field label="Tytuł">
                                    <input className={inputCls} value={card.title} onChange={(e) => upCard(i, { title: e.target.value })} />
                                </Field>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeCard(i)}
                                className="mt-5 shrink-0 rounded-md border border-border p-1.5 text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <Field label="Opis">
                            <input className={inputCls} value={card.description} onChange={(e) => upCard(i, { description: e.target.value })} />
                        </Field>
                    </div>
                ))}
            </div>
            <button
                type="button"
                onClick={addCard}
                className="mb-3 flex items-center gap-1 text-xs text-primary hover:underline"
            >
                <Plus className="h-3 w-3" /> Dodaj kartę
            </button>
            <Field label="Nota (opcjonalnie)">
                <input className={inputCls} value={block.note ?? ''} onChange={(e) => s({ note: e.target.value })} />
            </Field>
        </div>
    )
}

export function TechnologyEditor({
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

export function PricingEditor({
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
    const priceType = block.priceType ?? 'gross'

    const calculatedCounterpart = block.priceOverride != null
        ? priceType === 'gross'
            ? `= ${(Math.round((block.priceOverride / 1.23) * 100) / 100).toFixed(2)} ${currency} netto`
            : `= ${(Math.round(block.priceOverride * 1.23 * 100) / 100).toFixed(2)} ${currency} brutto`
        : null

    return (
        <div className="space-y-3">
            <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                💡 Cena pobierana automatycznie z pozycji oferty. Wpisz wartość poniżej, aby ją nadpisać w dokumencie.
            </p>
            <Field label="Typ ceny">
                <select
                    className={inputCls}
                    value={priceType}
                    onChange={(e) => s({ priceType: e.target.value as 'net' | 'gross' })}
                >
                    <option value="gross">Brutto (z VAT)</option>
                    <option value="net">Netto (bez VAT)</option>
                </select>
            </Field>
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
                {calculatedCounterpart && (
                    <p className="mt-1 text-xs text-muted-foreground">{calculatedCounterpart} (VAT 23%)</p>
                )}
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

export function AboutEditor({
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
            <Field label='Tytuł sekcji "O nas"'>
                <input
                    className={inputCls}
                    value={block.aboutBoxTitle ?? 'Więcej o nas i naszych realizacjach'}
                    onChange={(e) => onChange({ ...block, aboutBoxTitle: e.target.value })}
                />
            </Field>
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
