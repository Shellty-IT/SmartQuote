// src/components/offers/editor/shop-block-editors.tsx
// Individual editors for each "Sklep internetowy" block section.
'use client'

import { useState } from 'react'
import { Plus, Trash2, Star } from 'lucide-react'
import type {
    ShopBlocks,
    ShopCoverBlock,
    ShopFooterBlock,
    SummaryColumn,
    ShopScopeItem,
    PlatformOption,
    TimelineStep,
    ShopPricingBlock,
    PricingTableItem,
    PricingExtraItem,
    PaymentScheduleItem,
    TechStackBlock,
    WarrantyBlock,
    WarrantyItem,
    ShopAboutBlock,
    ShopStat,
} from '@/lib/pdf/shop-blocks'
import { AiGenerateButton, type OfferContext } from './block-editors'

// ── Shared helpers ────────────────────────────────────────────────────────────

function Field({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            {children}
        </div>
    )
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
    )
}

function Textarea({ value, onChange, rows = 3, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            placeholder={placeholder}
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
    )
}

function SectionToggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer">
            <div
                onClick={() => onChange(!enabled)}
                className={`relative h-5 w-9 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-muted'}`}
            >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{enabled ? 'Sekcja widoczna' : 'Sekcja ukryta'}</span>
        </label>
    )
}

// ── Cover ─────────────────────────────────────────────────────────────────────

export function CoverEditor({ blocks, onChange }: { blocks: ShopBlocks; onChange: (b: ShopBlocks) => void }) {
    const cover = blocks.cover
    const set = (patch: Partial<ShopCoverBlock>) => onChange({ ...blocks, cover: { ...cover, ...patch } })
    return (
        <div className="flex flex-col gap-3">
            <Field label="Mały tag (nad nagłówkiem)">
                <Input value={cover.tag} onChange={(v) => set({ tag: v })} placeholder="Propozycja realizacji" />
            </Field>
            <Field label="Podtytuł nagłówka (wyróżnione słowo)">
                <Input value={cover.subtitle} onChange={(v) => set({ subtitle: v })} placeholder="SKLEPU INTERNETOWEGO" />
            </Field>
            <Field label="Ważność oferty (dni)">
                <input
                    type="number"
                    min={1}
                    max={365}
                    value={cover.validityDays}
                    onChange={(e) => set({ validityDays: Number(e.target.value) })}
                    className="w-24 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </Field>
            <p className="text-xs text-muted-foreground">Logo i dane firmy (adres, strona www) są automatycznie pobierane z ustawień firmy.</p>
        </div>
    )
}

// ── Footer ────────────────────────────────────────────────────────────────────

export function FooterEditor({ blocks, onChange }: { blocks: ShopBlocks; onChange: (b: ShopBlocks) => void }) {
    const f = blocks.footer
    const set = (patch: Partial<ShopFooterBlock>) => onChange({ ...blocks, footer: { ...f, ...patch } })
    return (
        <div className="flex flex-col gap-3">
            <Field label="Tytuł CTA">
                <Input value={f.ctaTitle} onChange={(v) => set({ ctaTitle: v })} />
            </Field>
            <Field label="Podtytuł CTA">
                <Textarea value={f.ctaSubtitle} onChange={(v) => set({ ctaSubtitle: v })} rows={2} />
            </Field>
            <Field label="Tekst przycisku">
                <Input value={f.ctaButtonText} onChange={(v) => set({ ctaButtonText: v })} />
            </Field>
        </div>
    )
}

// ── Summary ───────────────────────────────────────────────────────────────────

export function SummaryEditor({ blocks, onChange, offerContext }: { blocks: ShopBlocks; onChange: (b: ShopBlocks) => void; offerContext?: OfferContext }) {
    const b = blocks.summary
    const setColumns = (columns: SummaryColumn[]) => onChange({ ...blocks, summary: { ...b, columns } })

    return (
        <div className="flex flex-col gap-4">
            <AiGenerateButton
                sectionKey="shop.summary"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    summary: {
                        ...blocks.summary,
                        columns: Array.isArray(data.columns) ? data.columns as SummaryColumn[] : blocks.summary.columns,
                    },
                })}
            />
            <SectionToggle enabled={b.enabled} onChange={(v) => onChange({ ...blocks, summary: { ...b, enabled: v } })} />
            {b.columns.map((col, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">Kolumna {i + 1}</span>
                        {b.columns.length > 1 && (
                            <button type="button" onClick={() => setColumns(b.columns.filter((_, j) => j !== i))} className="text-destructive hover:opacity-70">
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <Field label="Tytuł kolumny">
                        <Input value={col.title} onChange={(v) => setColumns(b.columns.map((c, j) => j === i ? { ...c, title: v } : c))} />
                    </Field>
                    <Field label="Treść">
                        <Textarea value={col.body} onChange={(v) => setColumns(b.columns.map((c, j) => j === i ? { ...c, body: v } : c))} rows={3} />
                    </Field>
                </div>
            ))}
            <button
                type="button"
                onClick={() => setColumns([...b.columns, { title: 'Nowa kolumna', body: '' }])}
                className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80"
            >
                <Plus className="h-4 w-4" /> Dodaj kolumnę
            </button>
        </div>
    )
}

// ── Scope ─────────────────────────────────────────────────────────────────────

export function ShopScopeEditor({ blocks, onChange, offerContext }: { blocks: ShopBlocks; onChange: (b: ShopBlocks) => void; offerContext?: OfferContext }) {
    const b = blocks.scope
    const setItems = (items: ShopScopeItem[]) => onChange({ ...blocks, scope: { ...b, items } })

    return (
        <div className="flex flex-col gap-4">
            <AiGenerateButton
                sectionKey="shop.scope"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    scope: {
                        ...blocks.scope,
                        items: Array.isArray(data.items) ? data.items as ShopScopeItem[] : blocks.scope.items,
                    },
                })}
            />
            <SectionToggle enabled={b.enabled} onChange={(v) => onChange({ ...blocks, scope: { ...b, enabled: v } })} />
            <Field label="Tytuł sekcji">
                <Input value={b.title} onChange={(v) => onChange({ ...blocks, scope: { ...b, title: v } })} />
            </Field>
            {b.items.map((item, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">Karta {i + 1}</span>
                        <button type="button" onClick={() => setItems(b.items.filter((_, j) => j !== i))} className="text-destructive hover:opacity-70">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <div className="w-16">
                            <Field label="Emoji">
                                <Input value={item.icon} onChange={(v) => setItems(b.items.map((x, j) => j === i ? { ...x, icon: v } : x))} />
                            </Field>
                        </div>
                        <div className="flex-1">
                            <Field label="Tytuł">
                                <Input value={item.title} onChange={(v) => setItems(b.items.map((x, j) => j === i ? { ...x, title: v } : x))} />
                            </Field>
                        </div>
                    </div>
                    <Field label="Opis">
                        <Textarea value={item.description} onChange={(v) => setItems(b.items.map((x, j) => j === i ? { ...x, description: v } : x))} rows={2} />
                    </Field>
                </div>
            ))}
            <button
                type="button"
                onClick={() => setItems([...b.items, { icon: '🔧', title: 'Nowa pozycja', description: '' }])}
                className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80"
            >
                <Plus className="h-4 w-4" /> Dodaj kartę
            </button>
        </div>
    )
}

// ── Platforms ─────────────────────────────────────────────────────────────────

export function PlatformsEditor({ blocks, onChange }: { blocks: ShopBlocks; onChange: (b: ShopBlocks) => void }) {
    const b = blocks.platforms
    const setOptions = (options: PlatformOption[]) => onChange({ ...blocks, platforms: { ...b, options } })
    const update = (i: number, patch: Partial<PlatformOption>) =>
        setOptions(b.options.map((o, j) => j === i ? { ...o, ...patch } : o))

    return (
        <div className="flex flex-col gap-4">
            <SectionToggle enabled={b.enabled} onChange={(v) => onChange({ ...blocks, platforms: { ...b, enabled: v } })} />
            <Field label="Tytuł sekcji">
                <Input value={b.title} onChange={(v) => onChange({ ...blocks, platforms: { ...b, title: v } })} />
            </Field>
            {b.options.map((opt, i) => (
                <div key={i} className={`flex flex-col gap-2 rounded-lg border p-3 ${opt.recommended ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">Opcja {i + 1}</span>
                            {opt.recommended && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">REKOMENDOWANA</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setOptions(b.options.map((o, j) => ({ ...o, recommended: j === i })))}
                                title="Ustaw jako rekomendowaną"
                                className={`text-amber-500 hover:opacity-70 ${opt.recommended ? 'opacity-100' : 'opacity-30'}`}
                            >
                                <Star className="h-3.5 w-3.5" fill={opt.recommended ? 'currentColor' : 'none'} />
                            </button>
                            {b.options.length > 1 && (
                                <button type="button" onClick={() => setOptions(b.options.filter((_, j) => j !== i))} className="text-destructive hover:opacity-70">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                    <Field label="Nazwa platformy">
                        <Input value={opt.name} onChange={(v) => update(i, { name: v })} />
                    </Field>
                    <Field label="Zalety">
                        <Textarea value={opt.pros} onChange={(v) => update(i, { pros: v })} rows={2} />
                    </Field>
                    <Field label="Wady">
                        <Textarea value={opt.cons} onChange={(v) => update(i, { cons: v })} rows={2} />
                    </Field>
                    <Field label="Dla kogo">
                        <Input value={opt.forWho} onChange={(v) => update(i, { forWho: v })} />
                    </Field>
                    <Field label="Cena od (np. 8 000 zł)">
                        <Input value={opt.priceFrom} onChange={(v) => update(i, { priceFrom: v })} />
                    </Field>
                </div>
            ))}
            <button
                type="button"
                onClick={() => setOptions([...b.options, { name: 'Nowa opcja', recommended: false, pros: '', cons: '', forWho: '', priceFrom: '' }])}
                className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80"
            >
                <Plus className="h-4 w-4" /> Dodaj opcję
            </button>
        </div>
    )
}

// ── Timeline ──────────────────────────────────────────────────────────────────

export function TimelineEditor({ blocks, onChange, offerContext }: { blocks: ShopBlocks; onChange: (b: ShopBlocks) => void; offerContext?: OfferContext }) {
    const b = blocks.timeline
    const setSteps = (steps: TimelineStep[]) => onChange({ ...blocks, timeline: { ...b, steps } })
    const update = (i: number, patch: Partial<TimelineStep>) =>
        setSteps(b.steps.map((s, j) => j === i ? { ...s, ...patch } : s))

    return (
        <div className="flex flex-col gap-4">
            <AiGenerateButton
                sectionKey="shop.timeline"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    timeline: {
                        ...blocks.timeline,
                        steps: Array.isArray(data.steps) ? data.steps as TimelineStep[] : blocks.timeline.steps,
                    },
                })}
            />
            <SectionToggle enabled={b.enabled} onChange={(v) => onChange({ ...blocks, timeline: { ...b, enabled: v } })} />
            <Field label="Tytuł sekcji">
                <Input value={b.title} onChange={(v) => onChange({ ...blocks, timeline: { ...b, title: v } })} />
            </Field>
            {b.steps.map((step, i) => (
                <div key={i} className="flex gap-2 items-start rounded-lg border border-border p-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{i + 1}</div>
                    <div className="flex flex-1 flex-col gap-2">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Field label="Etap">
                                    <Input value={step.title} onChange={(v) => update(i, { title: v })} />
                                </Field>
                            </div>
                            <div className="w-24">
                                <Field label="Czas">
                                    <Input value={step.duration} onChange={(v) => update(i, { duration: v })} placeholder="7 dni" />
                                </Field>
                            </div>
                        </div>
                        <Field label="Opis">
                            <Input value={step.description} onChange={(v) => update(i, { description: v })} />
                        </Field>
                    </div>
                    {b.steps.length > 1 && (
                        <button type="button" onClick={() => setSteps(b.steps.filter((_, j) => j !== i))} className="mt-1 text-destructive hover:opacity-70">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            ))}
            <button
                type="button"
                onClick={() => setSteps([...b.steps, { title: 'Nowy etap', duration: '—', description: '' }])}
                className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80"
            >
                <Plus className="h-4 w-4" /> Dodaj etap
            </button>
        </div>
    )
}

// ── Pricing ───────────────────────────────────────────────────────────────────

export function ShopPricingEditor({ blocks, onChange }: { blocks: ShopBlocks; onChange: (b: ShopBlocks) => void }) {
    const b = blocks.pricing
    const set = (patch: Partial<ShopPricingBlock>) => onChange({ ...blocks, pricing: { ...b, ...patch } })
    const setItems = (items: PricingTableItem[]) => set({ items })
    const setExtras = (extras: PricingExtraItem[]) => set({ extras })
    const setSchedule = (paymentSchedule: PaymentScheduleItem[]) => set({ paymentSchedule })
    const [tab, setTab] = useState<'items' | 'extras' | 'schedule'>('items')

    return (
        <div className="flex flex-col gap-4">
            <SectionToggle enabled={b.enabled} onChange={(v) => set({ enabled: v })} />
            <Field label="Tytuł sekcji">
                <Input value={b.title} onChange={(v) => set({ title: v })} />
            </Field>

            {/* Net / gross choice */}
            <Field label="Cena netto czy brutto?">
                <select
                    value={b.priceType ?? 'gross'}
                    onChange={(e) => set({ priceType: e.target.value as 'net' | 'gross' })}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    <option value="net">Netto (kwota netto, VAT doliczany)</option>
                    <option value="gross">Brutto (kwota zawiera VAT)</option>
                </select>
            </Field>

            {/* Price override */}
            <Field label="Cena nadrzędna (opcjonalna — zgodna z wyborem netto/brutto powyżej)">
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min={0}
                        value={b.priceOverride ?? ''}
                        placeholder="Auto (z pozycji oferty)"
                        onChange={(e) => set({ priceOverride: e.target.value ? Number(e.target.value) : null })}
                        className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {b.priceOverride !== null && (
                        <button type="button" onClick={() => set({ priceOverride: null })} className="text-xs text-muted-foreground hover:text-foreground">Wyczyść</button>
                    )}
                </div>
            </Field>

            {/* Tabs */}
            <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs font-medium">
                {(['items', 'extras', 'schedule'] as const).map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={`flex-1 rounded-md py-1 transition-colors ${tab === t ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t === 'items' ? 'Pozycje' : t === 'extras' ? 'Opcje' : 'Płatności'}
                    </button>
                ))}
            </div>

            {/* Items */}
            {tab === 'items' && (
                <div className="flex flex-col gap-2">
                    {b.items.map((item, i) => (
                        <div key={i} className="flex flex-col gap-1.5 rounded-lg border border-border p-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Pozycja {i + 1}</span>
                                <button type="button" onClick={() => setItems(b.items.filter((_, j) => j !== i))} className="text-destructive hover:opacity-70"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                            <Field label="Nazwa">
                                <Input value={item.name} onChange={(v) => setItems(b.items.map((x, j) => j === i ? { ...x, name: v } : x))} />
                            </Field>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Field label="Opis">
                                        <Input value={item.description} onChange={(v) => setItems(b.items.map((x, j) => j === i ? { ...x, description: v } : x))} />
                                    </Field>
                                </div>
                                <div className="w-28">
                                    <Field label="Cena">
                                        <Input value={item.price} onChange={(v) => setItems(b.items.map((x, j) => j === i ? { ...x, price: v } : x))} placeholder="3 000 zł" />
                                    </Field>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={() => setItems([...b.items, { name: 'Nowa pozycja', description: '', price: '0 zł' }])} className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80">
                        <Plus className="h-4 w-4" /> Dodaj pozycję
                    </button>
                </div>
            )}

            {/* Extras */}
            {tab === 'extras' && (
                <div className="flex flex-col gap-2">
                    {b.extras.map((ex, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="flex-1">
                                <Input value={ex.name} onChange={(v) => setExtras(b.extras.map((x, j) => j === i ? { ...x, name: v } : x))} placeholder="Nazwa opcji" />
                            </div>
                            <div className="w-28">
                                <Input value={ex.price} onChange={(v) => setExtras(b.extras.map((x, j) => j === i ? { ...x, price: v } : x))} placeholder="+ 0 zł" />
                            </div>
                            <button type="button" onClick={() => setExtras(b.extras.filter((_, j) => j !== i))} className="text-destructive hover:opacity-70"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                    ))}
                    <button type="button" onClick={() => setExtras([...b.extras, { name: 'Opcja dodatkowa', price: '+ 0 zł' }])} className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80">
                        <Plus className="h-4 w-4" /> Dodaj opcję
                    </button>
                </div>
            )}

            {/* Payment schedule */}
            {tab === 'schedule' && (
                <div className="flex flex-col gap-2">
                    {b.paymentSchedule.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="w-16">
                                <Input value={p.percent} onChange={(v) => setSchedule(b.paymentSchedule.map((x, j) => j === i ? { ...x, percent: v } : x))} placeholder="30%" />
                            </div>
                            <div className="flex-1">
                                <Input value={p.description} onChange={(v) => setSchedule(b.paymentSchedule.map((x, j) => j === i ? { ...x, description: v } : x))} placeholder="Opis płatności" />
                            </div>
                            {b.paymentSchedule.length > 1 && (
                                <button type="button" onClick={() => setSchedule(b.paymentSchedule.filter((_, j) => j !== i))} className="text-destructive hover:opacity-70"><Trash2 className="h-3.5 w-3.5" /></button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={() => setSchedule([...b.paymentSchedule, { percent: '0%', description: '' }])} className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80">
                        <Plus className="h-4 w-4" /> Dodaj transzę
                    </button>
                </div>
            )}
        </div>
    )
}

// ── TechStack ─────────────────────────────────────────────────────────────────

export function TechStackEditor({ blocks, onChange, offerContext }: { blocks: ShopBlocks; onChange: (b: ShopBlocks) => void; offerContext?: OfferContext }) {
    const b = blocks.techStack
    const set = (patch: Partial<TechStackBlock>) => onChange({ ...blocks, techStack: { ...b, ...patch } })
    const [newTag, setNewTag] = useState('')

    return (
        <div className="flex flex-col gap-3">
            <AiGenerateButton
                sectionKey="shop.techStack"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    techStack: {
                        ...blocks.techStack,
                        tags: Array.isArray(data.tags) ? data.tags as string[] : blocks.techStack.tags,
                        description: (data.description as string) || blocks.techStack.description,
                    },
                })}
            />
            <SectionToggle enabled={b.enabled} onChange={(v) => set({ enabled: v })} />
            <Field label="Tytuł sekcji">
                <Input value={b.title} onChange={(v) => set({ title: v })} />
            </Field>
            <Field label="Technologie (tagi)">
                <div className="flex flex-wrap gap-1.5 rounded-md border border-input bg-background p-2 min-h-[40px]">
                    {b.tags.map((tag, i) => (
                        <span key={i} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            {tag}
                            <button type="button" onClick={() => set({ tags: b.tags.filter((_, j) => j !== i) })} className="hover:opacity-70">×</button>
                        </span>
                    ))}
                    <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ',') && newTag.trim()) {
                                e.preventDefault()
                                set({ tags: [...b.tags, newTag.trim()] })
                                setNewTag('')
                            }
                        }}
                        placeholder="Dodaj tag… (Enter)"
                        className="flex-1 min-w-[80px] bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                    />
                </div>
            </Field>
            <Field label="Opis">
                <Textarea value={b.description} onChange={(v) => set({ description: v })} rows={3} />
            </Field>
        </div>
    )
}

// ── Warranty ──────────────────────────────────────────────────────────────────

export function WarrantyEditor({ blocks, onChange, offerContext }: { blocks: ShopBlocks; onChange: (b: ShopBlocks) => void; offerContext?: OfferContext }) {
    const b = blocks.warranty
    const set = (patch: Partial<WarrantyBlock>) => onChange({ ...blocks, warranty: { ...b, ...patch } })
    const setItems = (items: WarrantyItem[]) => set({ items })

    return (
        <div className="flex flex-col gap-4">
            <AiGenerateButton
                sectionKey="shop.warranty"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    warranty: {
                        ...blocks.warranty,
                        items: Array.isArray(data.items) ? data.items as WarrantyItem[] : blocks.warranty.items,
                        ctaTitle: (data.ctaTitle as string) || blocks.warranty.ctaTitle,
                        ctaSubtitle: (data.ctaSubtitle as string) || blocks.warranty.ctaSubtitle,
                    },
                })}
            />
            <SectionToggle enabled={b.enabled} onChange={(v) => set({ enabled: v })} />
            <Field label="Tytuł sekcji">
                <Input value={b.title} onChange={(v) => set({ title: v })} />
            </Field>
            {b.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start rounded-lg border border-border p-3">
                    <div className="w-12">
                        <Field label="Emoji">
                            <Input value={item.icon} onChange={(v) => setItems(b.items.map((x, j) => j === i ? { ...x, icon: v } : x))} />
                        </Field>
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                        <Field label="Tytuł">
                            <Input value={item.title} onChange={(v) => setItems(b.items.map((x, j) => j === i ? { ...x, title: v } : x))} />
                        </Field>
                        <Field label="Opis">
                            <Textarea value={item.description} onChange={(v) => setItems(b.items.map((x, j) => j === i ? { ...x, description: v } : x))} rows={2} />
                        </Field>
                    </div>
                    {b.items.length > 1 && (
                        <button type="button" onClick={() => setItems(b.items.filter((_, j) => j !== i))} className="mt-1 text-destructive hover:opacity-70">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            ))}
            <button type="button" onClick={() => setItems([...b.items, { icon: '✅', title: 'Nowa pozycja', description: '' }])} className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80">
                <Plus className="h-4 w-4" /> Dodaj element
            </button>
            <div className="border-t border-border pt-3 flex flex-col gap-2">
                <p className="text-xs font-semibold text-foreground">Baner CTA</p>
                <Field label="Tytuł CTA">
                    <Input value={b.ctaTitle} onChange={(v) => set({ ctaTitle: v })} />
                </Field>
                <Field label="Podtytuł CTA">
                    <Input value={b.ctaSubtitle} onChange={(v) => set({ ctaSubtitle: v })} />
                </Field>
                <Field label="Tekst przycisku">
                    <Input value={b.ctaButtonText} onChange={(v) => set({ ctaButtonText: v })} />
                </Field>
            </div>
        </div>
    )
}

// ── About ─────────────────────────────────────────────────────────────────────

export function ShopAboutEditor({ blocks, onChange, offerContext }: { blocks: ShopBlocks; onChange: (b: ShopBlocks) => void; offerContext?: OfferContext }) {
    const b = blocks.about
    const set = (patch: Partial<ShopAboutBlock>) => onChange({ ...blocks, about: { ...b, ...patch } })
    const setStats = (stats: ShopStat[]) => set({ stats })

    return (
        <div className="flex flex-col gap-4">
            <AiGenerateButton
                sectionKey="shop.about"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    about: {
                        ...blocks.about,
                        description: (data.description as string) || blocks.about.description,
                        stats: Array.isArray(data.stats) ? data.stats as ShopStat[] : blocks.about.stats,
                    },
                })}
            />
            <SectionToggle enabled={b.enabled} onChange={(v) => set({ enabled: v })} />
            <Field label="Tytuł sekcji">
                <Input value={b.title} onChange={(v) => set({ title: v })} />
            </Field>
            <Field label="Opis (o wykonawcy)">
                <Textarea value={b.description} onChange={(v) => set({ description: v })} rows={4} />
            </Field>
            <p className="text-xs text-muted-foreground">Imię / nazwa firmy pobierana automatycznie z ustawień firmy.</p>
            <p className="text-xs font-semibold text-foreground">Statystyki</p>
            {b.stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div className="w-24">
                        <Input value={stat.value} onChange={(v) => setStats(b.stats.map((x, j) => j === i ? { ...x, value: v } : x))} placeholder="50+" />
                    </div>
                    <div className="flex-1">
                        <Input value={stat.label} onChange={(v) => setStats(b.stats.map((x, j) => j === i ? { ...x, label: v } : x))} placeholder="zrealizowanych projektów" />
                    </div>
                    {b.stats.length > 1 && (
                        <button type="button" onClick={() => setStats(b.stats.filter((_, j) => j !== i))} className="text-destructive hover:opacity-70">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            ))}
            <button type="button" onClick={() => setStats([...b.stats, { value: '—', label: '' }])} className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80">
                <Plus className="h-4 w-4" /> Dodaj statystykę
            </button>
        </div>
    )
}
