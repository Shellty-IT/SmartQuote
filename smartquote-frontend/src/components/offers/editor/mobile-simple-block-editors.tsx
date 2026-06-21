// src/components/offers/editor/mobile-simple-block-editors.tsx
// Per-block editors for the "Aplikacja mobilna - domyślny" offer template.

'use client'

import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type {
    MobileSimpleBlocks,
    MobileSimpleChecklistItem,
    MobileSimpleOption,
    MobileSimpleStep,
    MobileSimpleGuarantee,
} from '@/lib/pdf/mobile-simple-blocks'
import { AiGenerateButton, type OfferContext } from './block-editors'

// ── Shared primitives ─────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
            {children}
        </div>
    )
}

function TextInput({
    value,
    onChange,
    placeholder,
}: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
}) {
    return (
        <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="border border-border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary w-full"
        />
    )
}

function TextArea({
    value,
    onChange,
    placeholder,
    rows = 3,
}: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
    rows?: number
}) {
    return (
        <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="border border-border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary w-full resize-y"
        />
    )
}

function NumberInput({
    value,
    onChange,
    placeholder,
}: {
    value: number | null
    onChange: (v: number | null) => void
    placeholder?: string
}) {
    return (
        <input
            type="number"
            value={value ?? ''}
            onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
            placeholder={placeholder}
            className="border border-border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary w-full"
        />
    )
}

function SectionHeader({ title }: { title: string }) {
    return <h3 className="text-sm font-bold text-foreground border-b border-border pb-2 mb-3">{title}</h3>
}

// ── Cover editor ──────────────────────────────────────────────────────────────

export function CoverEditor({
    blocks,
    onChange,
    offerContext,
}: {
    blocks: MobileSimpleBlocks
    onChange: (b: MobileSimpleBlocks) => void
    offerContext?: OfferContext
}) {
    const b = blocks.cover
    const set = (patch: Partial<typeof b>) => onChange({ ...blocks, cover: { ...b, ...patch } })

    return (
        <div className="flex flex-col gap-4">
            <SectionHeader title="Okładka" />
            <AiGenerateButton
                sectionKey="mobile_simple.cover"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    cover: {
                        ...blocks.cover,
                        projectName: (data.projectName as string) || blocks.cover.projectName,
                        subtitlePrefix: (data.subtitlePrefix as string) || blocks.cover.subtitlePrefix,
                        promises: Array.isArray(data.promises) ? data.promises as string[] : blocks.cover.promises,
                    },
                })}
            />
            <Field label="Etykieta nad tytułem">
                <TextInput value={b.coverTag ?? ''} onChange={v => set({ coverTag: v })} placeholder="Oferta handlowa" />
            </Field>
            <Field label="Nazwa projektu (w telefonie)">
                <TextInput value={b.projectName} onChange={v => set({ projectName: v })} placeholder="MyApp" />
            </Field>
            <Field label="Tekst przed nazwą klienta">
                <TextInput value={b.subtitlePrefix ?? ''} onChange={v => set({ subtitlePrefix: v })} placeholder="Aplikacja mobilna dla" />
            </Field>
            <Field label="Nazwa klienta">
                <TextInput value={b.clientName} onChange={v => set({ clientName: v })} placeholder="Nazwa Firmy" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Czas realizacji (tygodnie)">
                    <TextInput value={b.readyWeeks} onChange={v => set({ readyWeeks: v })} placeholder="8" />
                </Field>
                <Field label="Cena (netto, tekst)">
                    <TextInput value={b.priceText} onChange={v => set({ priceText: v })} placeholder="12 000" />
                </Field>
            </div>
            <SectionHeader title="Etykiety kart" />
            <Field label="Etykieta czasu realizacji">
                <TextInput value={b.deliveryLabel ?? ''} onChange={v => set({ deliveryLabel: v })} placeholder="Czas realizacji" />
            </Field>
            <Field label="Etykieta ceny">
                <TextInput value={b.priceLabel ?? ''} onChange={v => set({ priceLabel: v })} placeholder="Cena netto" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Liczba platform">
                    <TextInput value={b.platformCount ?? ''} onChange={v => set({ platformCount: v })} placeholder="2" />
                </Field>
                <Field label="Etykieta platform">
                    <TextInput value={b.platformLabel ?? ''} onChange={v => set({ platformLabel: v })} placeholder="Platformy" />
                </Field>
            </div>
            <SectionHeader title="Obietnice (pasek dolny)" />
            {b.promises.map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                    <TextInput value={p} onChange={v => {
                        const next = [...b.promises]; next[i] = v; set({ promises: next })
                    }} placeholder={`Obietnica ${i + 1}`} />
                    <button type="button" onClick={() => {
                        const next = b.promises.filter((_, j) => j !== i); set({ promises: next })
                    }} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            <button type="button" onClick={() => set({ promises: [...b.promises, ''] })}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                <Plus size={13} /> Dodaj obietnicę
            </button>
        </div>
    )
}

// ── Checklist editor ──────────────────────────────────────────────────────────

export function ChecklistEditor({
    blocks,
    onChange,
    offerContext,
}: {
    blocks: MobileSimpleBlocks
    onChange: (b: MobileSimpleBlocks) => void
    offerContext?: OfferContext
}) {
    const b = blocks.checklist
    const set = (patch: Partial<typeof b>) => onChange({ ...blocks, checklist: { ...b, ...patch } })

    const updateItem = (i: number, patch: Partial<MobileSimpleChecklistItem>) => {
        const items = [...b.items]; items[i] = { ...items[i], ...patch }; set({ items })
    }
    const removeItem = (i: number) => set({ items: b.items.filter((_, j) => j !== i) })
    const addItem = () => set({ items: [...b.items, { title: '', description: '' }] })

    const updateOption = (i: number, patch: Partial<MobileSimpleOption>) => {
        const options = [...b.options]; options[i] = { ...options[i], ...patch }; set({ options })
    }
    const removeOption = (i: number) => set({ options: b.options.filter((_, j) => j !== i) })
    const addOption = () => set({ options: [...b.options, { emoji: '⭐', label: '', price: '' }] })

    return (
        <div className="flex flex-col gap-4">
            <SectionHeader title="Sekcja: Co znajdziesz w aplikacji" />
            <AiGenerateButton
                sectionKey="mobile_simple.checklist"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    checklist: {
                        ...blocks.checklist,
                        items: Array.isArray(data.items) ? data.items as MobileSimpleChecklistItem[] : blocks.checklist.items,
                        options: Array.isArray(data.options) ? data.options as MobileSimpleOption[] : blocks.checklist.options,
                    },
                })}
            />
            <Field label="Tytuł sekcji">
                <TextInput value={b.sectionTitle} onChange={v => set({ sectionTitle: v })} />
            </Field>
            <Field label="Lead sekcji">
                <TextArea value={b.sectionLead} onChange={v => set({ sectionLead: v })} rows={2} />
            </Field>

            <SectionHeader title="Lista funkcji" />
            {b.items.map((item, i) => (
                <div key={i} className="border border-border rounded-md p-3 flex flex-col gap-2 bg-muted/30">
                    <div className="flex gap-2 items-start">
                        <div className="flex-1 flex flex-col gap-2">
                            <TextInput value={item.title} onChange={v => updateItem(i, { title: v })} placeholder="Tytuł funkcji" />
                            <TextArea value={item.description} onChange={v => updateItem(i, { description: v })} rows={2} placeholder="Opis funkcji" />
                        </div>
                        <button type="button" onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive mt-1 flex-shrink-0">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            ))}
            <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                <Plus size={13} /> Dodaj funkcję
            </button>

            <Field label="Tekst info-box">
                <TextArea value={b.infoBoxText} onChange={v => set({ infoBoxText: v })} rows={2} />
            </Field>

            <SectionHeader title="Opcje dodatkowe" />
            <Field label="Tytuł opcji">
                <TextInput value={b.optionsTitle} onChange={v => set({ optionsTitle: v })} />
            </Field>
            <Field label="Lead opcji">
                <TextArea value={b.optionsLead} onChange={v => set({ optionsLead: v })} rows={2} />
            </Field>
            {b.options.map((opt, i) => (
                <div key={i} className="border border-border rounded-md p-3 flex gap-2 items-center bg-muted/30">
                    <TextInput value={opt.emoji} onChange={v => updateOption(i, { emoji: v })} placeholder="😊" />
                    <div className="flex-1">
                        <TextInput value={opt.label} onChange={v => updateOption(i, { label: v })} placeholder="Nazwa opcji" />
                    </div>
                    <div className="w-28">
                        <TextInput value={opt.price} onChange={v => updateOption(i, { price: v })} placeholder="3 000" />
                    </div>
                    <button type="button" onClick={() => removeOption(i)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            <button type="button" onClick={addOption} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                <Plus size={13} /> Dodaj opcję
            </button>
        </div>
    )
}

// ── Tech editor ───────────────────────────────────────────────────────────────

function TechCardEditor({
    label,
    card,
    onChange,
}: {
    label: string
    card: MobileSimpleBlocks['tech']['cardA']
    onChange: (patch: Partial<typeof card>) => void
}) {
    const updatePro = (i: number, v: string) => {
        const pros = [...card.pros]; pros[i] = v; onChange({ pros })
    }
    const removePro = (i: number) => onChange({ pros: card.pros.filter((_, j) => j !== i) })
    const addPro = () => onChange({ pros: [...card.pros, ''] })

    return (
        <div className="border border-border rounded-md p-3 flex flex-col gap-3 bg-muted/20">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{label}</p>
            <div className="grid grid-cols-2 gap-2">
                <Field label="Ikona (emoji)">
                    <TextInput value={card.icon} onChange={v => onChange({ icon: v })} />
                </Field>
                <Field label="Tytuł karty">
                    <TextInput value={card.title} onChange={v => onChange({ title: v })} />
                </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Field label="Badge tekst">
                    <TextInput value={card.badge} onChange={v => onChange({ badge: v })} />
                </Field>
                <Field label="Badge styl">
                    <select
                        value={card.badgeVariant}
                        onChange={e => onChange({ badgeVariant: e.target.value as 'primary' | 'accent' })}
                        className="border border-border rounded-md px-3 py-1.5 text-sm bg-background"
                    >
                        <option value="primary">Teal (primary)</option>
                        <option value="accent">Orange (accent)</option>
                    </select>
                </Field>
            </div>
            <Field label="Tagline">
                <TextInput value={card.tagline} onChange={v => onChange({ tagline: v })} />
            </Field>
            <Field label="Opis">
                <TextArea value={card.description} onChange={v => onChange({ description: v })} rows={3} />
            </Field>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mt-1">Zalety</p>
            {card.pros.map((pro, i) => (
                <div key={i} className="flex gap-2 items-center">
                    <TextInput value={pro} onChange={v => updatePro(i, v)} placeholder="Zaleta" />
                    <button type="button" onClick={() => removePro(i)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            <button type="button" onClick={addPro} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                <Plus size={13} /> Dodaj zaletę
            </button>
        </div>
    )
}

export function TechEditor({
    blocks,
    onChange,
    offerContext,
}: {
    blocks: MobileSimpleBlocks
    onChange: (b: MobileSimpleBlocks) => void
    offerContext?: OfferContext
}) {
    const b = blocks.tech
    const set = (patch: Partial<typeof b>) => onChange({ ...blocks, tech: { ...b, ...patch } })

    return (
        <div className="flex flex-col gap-4">
            <SectionHeader title="Sekcja: Technologia" />
            <AiGenerateButton
                sectionKey="mobile_simple.tech"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    tech: {
                        ...blocks.tech,
                        cardA: {
                            ...blocks.tech.cardA,
                            tagline: (data.cardATagline as string) || blocks.tech.cardA.tagline,
                            description: (data.cardADescription as string) || blocks.tech.cardA.description,
                            pros: Array.isArray(data.cardAPros) ? data.cardAPros as string[] : blocks.tech.cardA.pros,
                        },
                        cardB: {
                            ...blocks.tech.cardB,
                            tagline: (data.cardBTagline as string) || blocks.tech.cardB.tagline,
                            description: (data.cardBDescription as string) || blocks.tech.cardB.description,
                            pros: Array.isArray(data.cardBPros) ? data.cardBPros as string[] : blocks.tech.cardB.pros,
                        },
                        alternativeText: (data.alternativeText as string) || blocks.tech.alternativeText,
                    },
                })}
            />
            <Field label="Tytuł sekcji">
                <TextInput value={b.sectionTitle} onChange={v => set({ sectionTitle: v })} />
            </Field>
            <Field label="Lead sekcji">
                <TextArea value={b.sectionLead} onChange={v => set({ sectionLead: v })} rows={2} />
            </Field>
            <TechCardEditor
                label="Karta A (np. React Native)"
                card={b.cardA}
                onChange={patch => set({ cardA: { ...b.cardA, ...patch } })}
            />
            <TechCardEditor
                label="Karta B (np. Flutter)"
                card={b.cardB}
                onChange={patch => set({ cardB: { ...b.cardB, ...patch } })}
            />
            <Field label="Tekst alternatywy / CTA">
                <TextArea value={b.alternativeText} onChange={v => set({ alternativeText: v })} rows={3} />
            </Field>
        </div>
    )
}

// ── Process + Pricing editor ──────────────────────────────────────────────────

export function ProcessEditor({
    blocks,
    onChange,
    offerContext,
}: {
    blocks: MobileSimpleBlocks
    onChange: (b: MobileSimpleBlocks) => void
    offerContext?: OfferContext
}) {
    const b = blocks.process
    const set = (patch: Partial<typeof b>) => onChange({ ...blocks, process: { ...b, ...patch } })

    const updateStep = (i: number, patch: Partial<MobileSimpleStep>) => {
        const steps = [...b.steps]; steps[i] = { ...steps[i], ...patch }; set({ steps })
    }
    const removeStep = (i: number) => set({ steps: b.steps.filter((_, j) => j !== i) })
    const addStep = () => set({ steps: [...b.steps, { title: '', description: '' }] })

    const updateInclude = (i: number, v: string) => {
        const priceIncludes = [...b.priceIncludes]; priceIncludes[i] = v; set({ priceIncludes })
    }
    const removeInclude = (i: number) => set({ priceIncludes: b.priceIncludes.filter((_, j) => j !== i) })
    const addInclude = () => set({ priceIncludes: [...b.priceIncludes, ''] })

    const updateGuarantee = (i: number, patch: Partial<MobileSimpleGuarantee>) => {
        const guarantees = [...b.guarantees]; guarantees[i] = { ...guarantees[i], ...patch }; set({ guarantees })
    }
    const removeGuarantee = (i: number) => set({ guarantees: b.guarantees.filter((_, j) => j !== i) })
    const addGuarantee = () => set({ guarantees: [...b.guarantees, { emoji: '✅', label: '' }] })

    return (
        <div className="flex flex-col gap-4">
            <SectionHeader title="Sekcja: Proces współpracy" />
            <AiGenerateButton
                sectionKey="mobile_simple.process"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    process: {
                        ...blocks.process,
                        steps: Array.isArray(data.steps) ? data.steps as MobileSimpleStep[] : blocks.process.steps,
                        timelineNote: (data.timelineNote as string) || blocks.process.timelineNote,
                        priceIncludes: Array.isArray(data.priceIncludes) ? data.priceIncludes as string[] : blocks.process.priceIncludes,
                        guarantees: Array.isArray(data.guarantees) ? data.guarantees as MobileSimpleGuarantee[] : blocks.process.guarantees,
                    },
                })}
            />
            <Field label="Tytuł sekcji">
                <TextInput value={b.processTitle} onChange={v => set({ processTitle: v })} />
            </Field>

            {b.steps.map((step, i) => (
                <div key={i} className="border border-border rounded-md p-3 flex gap-2 items-start bg-muted/30">
                    <span className="text-xs font-bold text-primary mt-1 w-5 text-center flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 flex flex-col gap-2">
                        <TextInput value={step.title} onChange={v => updateStep(i, { title: v })} placeholder="Tytuł kroku" />
                        <TextArea value={step.description} onChange={v => updateStep(i, { description: v })} rows={2} placeholder="Opis kroku" />
                    </div>
                    <button type="button" onClick={() => removeStep(i)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            <button type="button" onClick={addStep} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                <Plus size={13} /> Dodaj krok
            </button>

            <Field label="Notatka o czasie (np. ⏱ Cały proces...)">
                <TextInput value={b.timelineNote} onChange={v => set({ timelineNote: v })} />
            </Field>

            <SectionHeader title="Karta cenowa" />
            <Field label="Cena netto (tekst, wyświetlana gdy nie ma nadpisania)">
                <TextInput value={b.priceNet} onChange={v => set({ priceNet: v })} placeholder="12 000" />
            </Field>
            <Field label="Nadpisanie ceny (liczba, puste = brak)">
                <NumberInput value={b.priceOverride} onChange={v => set({ priceOverride: v })} placeholder="np. 15000" />
            </Field>

            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Co zawiera cena</p>
            {b.priceIncludes.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                    <TextInput value={item} onChange={v => updateInclude(i, v)} placeholder="Element wyceny" />
                    <button type="button" onClick={() => removeInclude(i)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            <button type="button" onClick={addInclude} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                <Plus size={13} /> Dodaj pozycję
            </button>

            <SectionHeader title="Harmonogram płatności" />
            <div className="grid grid-cols-2 gap-3">
                <Field label="Transza 1 (%)"><TextInput value={b.payment1Percent} onChange={v => set({ payment1Percent: v })} placeholder="50" /></Field>
                <Field label="Transza 1 (kwota)"><TextInput value={b.payment1Amount} onChange={v => set({ payment1Amount: v })} placeholder="6 000" /></Field>
                <Field label="Transza 2 (%)"><TextInput value={b.payment2Percent} onChange={v => set({ payment2Percent: v })} placeholder="50" /></Field>
                <Field label="Transza 2 (kwota)"><TextInput value={b.payment2Amount} onChange={v => set({ payment2Amount: v })} placeholder="6 000" /></Field>
            </div>
            <Field label="Oferta ważna do">
                <TextInput value={b.validUntil} onChange={v => set({ validUntil: v })} placeholder="31.12.2025" />
            </Field>

            <SectionHeader title="Gwarancje (3 karty)" />
            {b.guarantees.map((g, i) => (
                <div key={i} className="flex gap-2 items-center">
                    <div className="w-16">
                        <TextInput value={g.emoji} onChange={v => updateGuarantee(i, { emoji: v })} placeholder="🛡️" />
                    </div>
                    <div className="flex-1">
                        <TextInput value={g.label} onChange={v => updateGuarantee(i, { label: v })} placeholder="Treść gwarancji" />
                    </div>
                    <button type="button" onClick={() => removeGuarantee(i)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            <button type="button" onClick={addGuarantee} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                <Plus size={13} /> Dodaj gwarancję
            </button>
        </div>
    )
}

// ── Footer editor ─────────────────────────────────────────────────────────────

export function FooterEditor({
    blocks,
    onChange,
}: {
    blocks: MobileSimpleBlocks
    onChange: (b: MobileSimpleBlocks) => void
}) {
    const b = blocks.footer
    const set = (patch: Partial<typeof b>) => onChange({ ...blocks, footer: { ...b, ...patch } })

    return (
        <div className="flex flex-col gap-4">
            <SectionHeader title="Stopka" />
            <Field label="Tagline firmy">
                <TextArea value={b.tagline} onChange={v => set({ tagline: v })} rows={2} />
            </Field>
            <Field label="Email kontaktowy">
                <TextInput value={b.contactEmail} onChange={v => set({ contactEmail: v })} placeholder="kontakt@firma.pl" />
            </Field>
            <Field label="Telefon">
                <TextInput value={b.contactPhone} onChange={v => set({ contactPhone: v })} placeholder="+48 000 000 000" />
            </Field>
            <Field label="Strona WWW">
                <TextInput value={b.websiteUrl} onChange={v => set({ websiteUrl: v })} placeholder="www.firma.pl" />
            </Field>
            <Field label="LinkedIn URL">
                <TextInput value={b.linkedinUrl} onChange={v => set({ linkedinUrl: v })} placeholder="https://linkedin.com/in/..." />
            </Field>
            <Field label="GitHub URL">
                <TextInput value={b.githubUrl} onChange={v => set({ githubUrl: v })} placeholder="https://github.com/..." />
            </Field>
        </div>
    )
}
