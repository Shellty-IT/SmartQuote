// src/components/offers/editor/universal-block-editors.tsx
// Per-block editors for "Szablon uniwersalny" offer template.
'use client'

import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { UniversalBlocks, UniversalScopeItem, UniversalTimelineStep, UniversalPricingCategory, UniversalPricingItem, UniversalPaymentRow, UniversalTermCard } from '@/lib/pdf/universal-blocks'
import { AiGenerateButton, type OfferContext } from './block-editors'

// ── Shared primitives ─────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
    return <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 mt-6 first:mt-0">{children}</h3>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1 mb-3">
            <label className="text-xs text-muted-foreground font-medium">{label}</label>
            {children}
        </div>
    )
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
        />
    )
}

function TextArea({ value, onChange, rows = 3, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
    return (
        <textarea
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={rows}
            placeholder={placeholder}
        />
    )
}

function NumberInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <input
            type="text"
            inputMode="decimal"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
        />
    )
}

function SelectField({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
    return (
        <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            value={value}
            onChange={e => onChange(e.target.value)}
        >
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    )
}

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
                type="checkbox"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                className="rounded border-border accent-primary"
            />
            {label}
        </label>
    )
}

// ── CoverEditor ───────────────────────────────────────────────────────────────

export function CoverEditor({ blocks, onChange }: { blocks: UniversalBlocks; onChange: (b: UniversalBlocks) => void }) {
    const c = blocks.cover
    const set = (patch: Partial<typeof c>) => onChange({ ...blocks, cover: { ...c, ...patch } })

    return (
        <div>
            <SectionHeader>Oferta</SectionHeader>
            <Field label="Tytuł usługi / projektu"><TextInput value={c.serviceTitle} onChange={v => set({ serviceTitle: v })} /></Field>
            <Field label="Klient (dla kogo)"><TextInput value={c.clientName} onChange={v => set({ clientName: v })} /></Field>
            <Field label="Data oferty"><TextInput value={c.offerDate} onChange={v => set({ offerDate: v })} placeholder="np. 15 czerwca 2026" /></Field>
            <Field label="Ważna do"><TextInput value={c.validUntil} onChange={v => set({ validUntil: v })} placeholder="np. 30 czerwca 2026" /></Field>
            <SectionHeader>Wystawca</SectionHeader>
            <Field label="Imię i nazwisko"><TextInput value={c.contractorName} onChange={v => set({ contractorName: v })} /></Field>
            <Field label="Stanowisko / rola"><TextInput value={c.contractorRole} onChange={v => set({ contractorRole: v })} /></Field>
            <Field label="E-mail"><TextInput value={c.contractorEmail} onChange={v => set({ contractorEmail: v })} /></Field>
            <Field label="Telefon"><TextInput value={c.contractorPhone} onChange={v => set({ contractorPhone: v })} /></Field>
            <Field label="Strona www"><TextInput value={c.websiteUrl} onChange={v => set({ websiteUrl: v })} /></Field>
        </div>
    )
}

// ── SummaryEditor ─────────────────────────────────────────────────────────────

export function SummaryEditor({ blocks, onChange, offerContext }: { blocks: UniversalBlocks; onChange: (b: UniversalBlocks) => void; offerContext?: OfferContext }) {
    const s = blocks.summary
    const set = (patch: Partial<typeof s>) => onChange({ ...blocks, summary: { ...s, ...patch } })

    return (
        <div>
            <AiGenerateButton
                sectionKey="universal.summary"
                offerContext={offerContext}
                onResult={(data) => onChange({ ...blocks, summary: { ...blocks.summary, ...data as Partial<typeof s> } })}
            />
            <SectionHeader>Nagłówek</SectionHeader>
            <Field label="Eyebrow (nad tytułem)"><TextInput value={s.eyebrow} onChange={v => set({ eyebrow: v })} /></Field>
            <Field label="Tytuł sekcji"><TextInput value={s.title} onChange={v => set({ title: v })} /></Field>
            <SectionHeader>Tekst wiodący</SectionHeader>
            <Field label="Lead paragraph">
                <TextArea value={s.leadText} onChange={v => set({ leadText: v })} rows={5} />
            </Field>
            <SectionHeader>Fakty (karty po prawej)</SectionHeader>
            <Field label="Zakres projektu"><TextInput value={s.scopeFact} onChange={v => set({ scopeFact: v })} /></Field>
            <Field label="Szacowany czas"><TextInput value={s.timelineFact} onChange={v => set({ timelineFact: v })} /></Field>
            <Field label="Wartość (PLN netto)"><TextInput value={s.valueFact} onChange={v => set({ valueFact: v })} /></Field>
        </div>
    )
}

// ── NeedsEditor ───────────────────────────────────────────────────────────────

export function NeedsEditor({ blocks, onChange, offerContext }: { blocks: UniversalBlocks; onChange: (b: UniversalBlocks) => void; offerContext?: OfferContext }) {
    const n = blocks.needs
    const set = (patch: Partial<typeof n>) => onChange({ ...blocks, needs: { ...n, ...patch } })

    return (
        <div>
            <AiGenerateButton
                sectionKey="universal.needs"
                offerContext={offerContext}
                onResult={(data) => onChange({ ...blocks, needs: { ...blocks.needs, ...data as Partial<typeof n> } })}
            />
            <Field label="Źródło informacji (np. briefing z dnia…)">
                <TextInput value={n.sourceNote} onChange={v => set({ sourceNote: v })} />
            </Field>
            <SectionHeader>Karty potrzeb</SectionHeader>
            <Field label="🔥 Wyzwanie (opis problemu)">
                <TextArea value={n.challengeText} onChange={v => set({ challengeText: v })} rows={4} />
            </Field>
            <Field label="🎯 Cel (czego chce klient)">
                <TextArea value={n.goalText} onChange={v => set({ goalText: v })} rows={4} />
            </Field>
            <Field label="✅ Oczekiwany rezultat (KPI)">
                <TextArea value={n.resultText} onChange={v => set({ resultText: v })} rows={4} />
            </Field>
        </div>
    )
}

// ── ScopeEditor ───────────────────────────────────────────────────────────────

export function ScopeEditor({ blocks, onChange, offerContext }: { blocks: UniversalBlocks; onChange: (b: UniversalBlocks) => void; offerContext?: OfferContext }) {
    const s = blocks.scope

    const updateItem = (i: number, patch: Partial<UniversalScopeItem>) => {
        const items = s.items.map((it, idx) => idx === i ? { ...it, ...patch } : it)
        onChange({ ...blocks, scope: { ...s, items } })
    }

    const addItem = () => {
        onChange({ ...blocks, scope: { ...s, items: [...s.items, { name: 'Nowy element', description: '', optional: false }] } })
    }

    const removeItem = (i: number) => {
        onChange({ ...blocks, scope: { ...s, items: s.items.filter((_, idx) => idx !== i) } })
    }

    const updateExclude = (i: number, v: string) => {
        const excludes = s.excludes.map((e, idx) => idx === i ? v : e)
        onChange({ ...blocks, scope: { ...s, excludes } })
    }

    const addExclude = () => {
        onChange({ ...blocks, scope: { ...s, excludes: [...s.excludes, ''] } })
    }

    const removeExclude = (i: number) => {
        onChange({ ...blocks, scope: { ...s, excludes: s.excludes.filter((_, idx) => idx !== i) } })
    }

    return (
        <div>
            <AiGenerateButton
                sectionKey="universal.scope"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    scope: {
                        ...blocks.scope,
                        items: Array.isArray(data.items) ? data.items as UniversalScopeItem[] : blocks.scope.items,
                        excludes: Array.isArray(data.excludes) ? data.excludes as string[] : blocks.scope.excludes,
                        assumptionText: (data.assumptionText as string) || blocks.scope.assumptionText,
                    },
                })}
            />
            <SectionHeader>Elementy zakresu</SectionHeader>
            {s.items.map((item, i) => (
                <div key={i} className="border border-border rounded-lg p-3 mb-2">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                        <button type="button" onClick={() => removeItem(i)} className="text-destructive hover:opacity-70">
                            <Trash2 size={13} />
                        </button>
                    </div>
                    <Field label="Nazwa"><TextInput value={item.name} onChange={v => updateItem(i, { name: v })} /></Field>
                    <Field label="Opis"><TextArea value={item.description} onChange={v => updateItem(i, { description: v })} rows={2} /></Field>
                    <CheckboxField label="Opcjonalny (badge OPT)" checked={item.optional} onChange={v => updateItem(i, { optional: v })} />
                </div>
            ))}
            <button type="button" onClick={addItem}
                className="flex items-center gap-1 text-xs text-primary hover:opacity-70 mt-1 mb-4">
                <Plus size={13} /> Dodaj element
            </button>

            <SectionHeader>Poza zakresem</SectionHeader>
            {s.excludes.map((ex, i) => (
                <div key={i} className="flex gap-2 mb-2">
                    <TextInput value={ex} onChange={v => updateExclude(i, v)} placeholder="Element wykluczony" />
                    <button type="button" onClick={() => removeExclude(i)} className="text-destructive flex-shrink-0">
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            <button type="button" onClick={addExclude}
                className="flex items-center gap-1 text-xs text-primary hover:opacity-70 mt-1 mb-4">
                <Plus size={13} /> Dodaj wykluczenie
            </button>

            <SectionHeader>Założenia</SectionHeader>
            <Field label="Tekst w żółtym infoboxie">
                <TextArea value={s.assumptionText} onChange={v => onChange({ ...blocks, scope: { ...s, assumptionText: v } })} rows={4} />
            </Field>
        </div>
    )
}

// ── TimelineEditor ────────────────────────────────────────────────────────────

export function TimelineEditor({ blocks, onChange, offerContext }: { blocks: UniversalBlocks; onChange: (b: UniversalBlocks) => void; offerContext?: OfferContext }) {
    const t = blocks.timeline

    const updateStep = (i: number, patch: Partial<UniversalTimelineStep>) => {
        const steps = t.steps.map((s, idx) => idx === i ? { ...s, ...patch } : s)
        onChange({ ...blocks, timeline: { ...t, steps } })
    }

    const addStep = () => {
        onChange({ ...blocks, timeline: { ...t, steps: [...t.steps, { name: 'Nowy krok', duration: '', description: '', active: false }] } })
    }

    const removeStep = (i: number) => {
        onChange({ ...blocks, timeline: { ...t, steps: t.steps.filter((_, idx) => idx !== i) } })
    }

    return (
        <div>
            <AiGenerateButton
                sectionKey="universal.timeline"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    timeline: {
                        ...blocks.timeline,
                        steps: Array.isArray(data.steps) ? data.steps as UniversalTimelineStep[] : blocks.timeline.steps,
                        startDate: (data.startDate as string) || blocks.timeline.startDate,
                        endDate: (data.endDate as string) || blocks.timeline.endDate,
                    },
                })}
            />
            <SectionHeader>Kroki harmonogramu</SectionHeader>
            {t.steps.map((step, i) => (
                <div key={i} className="border border-border rounded-lg p-3 mb-2">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground">Krok {i + 1}</span>
                        <button type="button" onClick={() => removeStep(i)} className="text-destructive hover:opacity-70">
                            <Trash2 size={13} />
                        </button>
                    </div>
                    <Field label="Nazwa kroku"><TextInput value={step.name} onChange={v => updateStep(i, { name: v })} /></Field>
                    <Field label="Czas trwania"><TextInput value={step.duration} onChange={v => updateStep(i, { duration: v })} placeholder="np. 3–5 dni" /></Field>
                    <Field label="Opis"><TextArea value={step.description} onChange={v => updateStep(i, { description: v })} rows={2} /></Field>
                    <CheckboxField label="Wyróżniony (złoty krok aktywny)" checked={step.active} onChange={v => updateStep(i, { active: v })} />
                </div>
            ))}
            <button type="button" onClick={addStep}
                className="flex items-center gap-1 text-xs text-primary hover:opacity-70 mt-1 mb-4">
                <Plus size={13} /> Dodaj krok
            </button>

            <SectionHeader>Daty</SectionHeader>
            <Field label="Planowany start"><TextInput value={t.startDate} onChange={v => onChange({ ...blocks, timeline: { ...t, startDate: v } })} placeholder="np. 1 lipca 2026" /></Field>
            <Field label="Planowane zakończenie"><TextInput value={t.endDate} onChange={v => onChange({ ...blocks, timeline: { ...t, endDate: v } })} placeholder="np. 15 września 2026" /></Field>
        </div>
    )
}

// ── PricingEditor ─────────────────────────────────────────────────────────────

export function PricingEditor({ blocks, onChange }: { blocks: UniversalBlocks; onChange: (b: UniversalBlocks) => void }) {
    const p = blocks.pricing
    const set = (patch: Partial<typeof p>) => onChange({ ...blocks, pricing: { ...p, ...patch } })

    const updatePayment = (i: number, patch: Partial<UniversalPaymentRow>) => {
        const payments = p.payments.map((row, idx) => idx === i ? { ...row, ...patch } : row)
        set({ payments })
    }

    const addPayment = () => set({ payments: [...p.payments, { percent: '0', amount: '0', when: '' }] })
    const removePayment = (i: number) => set({ payments: p.payments.filter((_, idx) => idx !== i) })

    const updateCategory = (ci: number, patch: Partial<UniversalPricingCategory>) => {
        const categories = p.categories.map((cat, i) => i === ci ? { ...cat, ...patch } : cat)
        set({ categories })
    }

    const addCategory = () => set({ categories: [...p.categories, { name: 'Nowa kategoria', items: [] }] })
    const removeCategory = (ci: number) => set({ categories: p.categories.filter((_, i) => i !== ci) })

    const updateItem = (ci: number, ii: number, patch: Partial<UniversalPricingItem>) => {
        const categories = p.categories.map((cat, i) => {
            if (i !== ci) return cat
            return { ...cat, items: cat.items.map((it, j) => j === ii ? { ...it, ...patch } : it) }
        })
        set({ categories })
    }

    const addItem = (ci: number) => {
        const categories = p.categories.map((cat, i) => {
            if (i !== ci) return cat
            return { ...cat, items: [...cat.items, { name: '', description: '', qty: '1', unit: 'szt.', unitPrice: '0', value: '0', optional: false }] }
        })
        set({ categories })
    }

    const removeItem = (ci: number, ii: number) => {
        const categories = p.categories.map((cat, i) => {
            if (i !== ci) return cat
            return { ...cat, items: cat.items.filter((_, j) => j !== ii) }
        })
        set({ categories })
    }

    const updateSimpleInclude = (i: number, v: string) => {
        const simpleIncludes = p.simpleIncludes.map((s, idx) => idx === i ? v : s)
        set({ simpleIncludes })
    }

    return (
        <div>
            <SectionHeader>Tryb wyceny</SectionHeader>
            <Field label="Tryb">
                <SelectField
                    value={p.pricingMode}
                    onChange={v => set({ pricingMode: v as 'simple' | 'detailed' })}
                    options={[
                        { value: 'simple', label: 'Prosta (jedna kwota + co jest w cenie)' },
                        { value: 'detailed', label: 'Szczegółowa (tabela kategorii i pozycji)' },
                    ]}
                />
            </Field>

            <Field label="Cena nadpisana (priceOverride, PLN brutto — puste = auto z pozycji oferty)">
                <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    value={p.priceOverride ?? ''}
                    onChange={e => set({ priceOverride: e.target.value === '' ? null : Number(e.target.value) })}
                    placeholder="np. 12300 — zostaw puste by użyć sumy z listy pozycji"
                />
            </Field>

            {p.pricingMode === 'simple' && (
                <>
                    <SectionHeader>Prosta wycena</SectionHeader>
                    <Field label={'Cena (wyświetlana, np. "12 000")'}><TextInput value={p.simplePrice} onChange={v => set({ simplePrice: v })} /></Field>
                    <SectionHeader>Co zawiera cena</SectionHeader>
                    {p.simpleIncludes.map((inc, i) => (
                        <div key={i} className="flex gap-2 mb-2">
                            <TextInput value={inc} onChange={v => updateSimpleInclude(i, v)} />
                            <button type="button" onClick={() => set({ simpleIncludes: p.simpleIncludes.filter((_, idx) => idx !== i) })}
                                className="text-destructive flex-shrink-0"><Trash2 size={14} /></button>
                        </div>
                    ))}
                    <button type="button" onClick={() => set({ simpleIncludes: [...p.simpleIncludes, ''] })}
                        className="flex items-center gap-1 text-xs text-primary hover:opacity-70 mt-1 mb-4">
                        <Plus size={13} /> Dodaj punkt
                    </button>
                </>
            )}

            {p.pricingMode === 'detailed' && (
                <>
                    <SectionHeader>Kategorie i pozycje</SectionHeader>
                    {p.categories.map((cat, ci) => (
                        <div key={ci} className="border border-border rounded-lg p-3 mb-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-muted-foreground">Kategoria {ci + 1}</span>
                                <button type="button" onClick={() => removeCategory(ci)} className="text-destructive"><Trash2 size={13} /></button>
                            </div>
                            <Field label="Nazwa kategorii">
                                <TextInput value={cat.name} onChange={v => updateCategory(ci, { name: v })} />
                            </Field>
                            {cat.items.map((item, ii) => (
                                <div key={ii} className="bg-muted/30 rounded-lg p-2 mb-2">
                                    <div className="flex justify-end mb-1">
                                        <button type="button" onClick={() => removeItem(ci, ii)} className="text-destructive"><Trash2 size={12} /></button>
                                    </div>
                                    <Field label="Nazwa"><TextInput value={item.name} onChange={v => updateItem(ci, ii, { name: v })} /></Field>
                                    <Field label="Opis"><TextInput value={item.description} onChange={v => updateItem(ci, ii, { description: v })} /></Field>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Field label="Ilość"><NumberInput value={item.qty} onChange={v => updateItem(ci, ii, { qty: v })} /></Field>
                                        <Field label="Jedn."><TextInput value={item.unit} onChange={v => updateItem(ci, ii, { unit: v })} /></Field>
                                        <Field label="Cena jedn."><NumberInput value={item.unitPrice} onChange={v => updateItem(ci, ii, { unitPrice: v })} /></Field>
                                        <Field label="Wartość"><NumberInput value={item.value} onChange={v => updateItem(ci, ii, { value: v })} /></Field>
                                    </div>
                                    <CheckboxField label="Opcjonalny (badge OPT)" checked={item.optional} onChange={v => updateItem(ci, ii, { optional: v })} />
                                </div>
                            ))}
                            <button type="button" onClick={() => addItem(ci)}
                                className="flex items-center gap-1 text-xs text-primary hover:opacity-70 mt-1">
                                <Plus size={12} /> Dodaj pozycję
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={addCategory}
                        className="flex items-center gap-1 text-xs text-primary hover:opacity-70 mt-1 mb-4">
                        <Plus size={13} /> Dodaj kategorię
                    </button>
                </>
            )}

            <SectionHeader>Harmonogram płatności</SectionHeader>
            {p.payments.map((row, i) => (
                <div key={i} className="border border-border rounded-lg p-3 mb-2">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground">Rata {i + 1}</span>
                        <button type="button" onClick={() => removePayment(i)} className="text-destructive"><Trash2 size={13} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Field label="Procent (%)"><NumberInput value={row.percent} onChange={v => updatePayment(i, { percent: v })} /></Field>
                        <Field label="Kwota (PLN)"><NumberInput value={row.amount} onChange={v => updatePayment(i, { amount: v })} /></Field>
                    </div>
                    <Field label="Kiedy / warunek"><TextInput value={row.when} onChange={v => updatePayment(i, { when: v })} /></Field>
                </div>
            ))}
            <button type="button" onClick={addPayment}
                className="flex items-center gap-1 text-xs text-primary hover:opacity-70 mt-1 mb-4">
                <Plus size={13} /> Dodaj ratę
            </button>
            <Field label="Uwagi do płatności">
                <TextArea value={p.paymentNote} onChange={v => set({ paymentNote: v })} rows={3} />
            </Field>
        </div>
    )
}

// ── TermsEditor ───────────────────────────────────────────────────────────────

export function TermsEditor({ blocks, onChange, offerContext }: { blocks: UniversalBlocks; onChange: (b: UniversalBlocks) => void; offerContext?: OfferContext }) {
    const t = blocks.terms

    const updateCard = (i: number, patch: Partial<UniversalTermCard>) => {
        const cards = t.cards.map((c, idx) => idx === i ? { ...c, ...patch } : c)
        onChange({ ...blocks, terms: { ...t, cards } })
    }

    const addCard = () => onChange({ ...blocks, terms: { ...t, cards: [...t.cards, { icon: '📌', title: 'Nowy warunek', text: '' }] } })
    const removeCard = (i: number) => onChange({ ...blocks, terms: { ...t, cards: t.cards.filter((_, idx) => idx !== i) } })

    return (
        <div>
            <AiGenerateButton
                sectionKey="universal.terms"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    terms: {
                        ...blocks.terms,
                        cards: Array.isArray(data.cards) ? data.cards as UniversalTermCard[] : blocks.terms.cards,
                    },
                })}
            />
            <SectionHeader>Karty warunków (3×2 siatka)</SectionHeader>
            {t.cards.map((card, i) => (
                <div key={i} className="border border-border rounded-lg p-3 mb-2">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground">Karta {i + 1}</span>
                        <button type="button" onClick={() => removeCard(i)} className="text-destructive hover:opacity-70">
                            <Trash2 size={13} />
                        </button>
                    </div>
                    <Field label="Emoji / ikona"><TextInput value={card.icon} onChange={v => updateCard(i, { icon: v })} /></Field>
                    <Field label="Tytuł"><TextInput value={card.title} onChange={v => updateCard(i, { title: v })} /></Field>
                    <Field label="Opis">
                        <TextArea value={card.text} onChange={v => updateCard(i, { text: v })} rows={3} />
                    </Field>
                </div>
            ))}
            <button type="button" onClick={addCard}
                className="flex items-center gap-1 text-xs text-primary hover:opacity-70 mt-1">
                <Plus size={13} /> Dodaj kartę
            </button>
        </div>
    )
}

// ── FooterEditor ──────────────────────────────────────────────────────────────

export function FooterEditor({ blocks, onChange }: { blocks: UniversalBlocks; onChange: (b: UniversalBlocks) => void }) {
    const f = blocks.footer
    const set = (patch: Partial<typeof f>) => onChange({ ...blocks, footer: { ...f, ...patch } })

    return (
        <div>
            <SectionHeader>CTA (złoty baner)</SectionHeader>
            <Field label="Nagłówek CTA"><TextInput value={f.ctaTitle} onChange={v => set({ ctaTitle: v })} /></Field>
            <Field label="Podtytuł CTA"><TextInput value={f.ctaSubtitle} onChange={v => set({ ctaSubtitle: v })} /></Field>
            <Field label="Czas odpowiedzi (godz.)"><TextInput value={f.responseHours} onChange={v => set({ responseHours: v })} /></Field>
            <SectionHeader>Kontakt (stopka)</SectionHeader>
            <Field label="E-mail"><TextInput value={f.footerEmail} onChange={v => set({ footerEmail: v })} /></Field>
            <Field label="Telefon"><TextInput value={f.footerPhone} onChange={v => set({ footerPhone: v })} /></Field>
            <Field label="Strona www"><TextInput value={f.footerWebsite} onChange={v => set({ footerWebsite: v })} /></Field>
            <SectionHeader>Inne</SectionHeader>
            <Field label="Tagline (pod logo)"><TextArea value={f.tagline} onChange={v => set({ tagline: v })} rows={2} /></Field>
            <Field label="LinkedIn URL"><TextInput value={f.linkedinUrl} onChange={v => set({ linkedinUrl: v })} /></Field>
            <Field label="GitHub URL"><TextInput value={f.githubUrl} onChange={v => set({ githubUrl: v })} /></Field>
        </div>
    )
}
