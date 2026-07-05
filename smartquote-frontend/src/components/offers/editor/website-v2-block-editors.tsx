// src/components/offers/editor/website-v2-block-editors.tsx
// Individual editors for each "Strona internetowa v2" block section.
'use client'

import { useState } from 'react'
import { ImagePlus, Plus, Trash2 } from 'lucide-react'
import type {
    WebsiteV2Blocks,
    WV2PainPoint,
    WV2StatItem,
    WV2FeatureItem,
    WV2PortfolioItem,
    WV2Testimonial,
    WV2ProcessStep,
    WV2Guarantee,
    WV2FaqItem,
} from '@/lib/pdf/website-v2-blocks'
import { AiGenerateButton, type OfferContext } from './block-editors'
import { compressImage } from '@/lib/imageUtils'

// ── Shared helpers ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            {children}
        </div>
    )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
    )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            rows={3}
            {...props}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
        />
    )
}

function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            type="number"
            {...props}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
    )
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
    return (
        <button type="button" onClick={onClick} className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
            <Plus className="h-3 w-3" />{label}
        </button>
    )
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
    return (
        <button type="button" onClick={onClick} className="flex-shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
        </button>
    )
}

// ── Cover ─────────────────────────────────────────────────────────────────────

export function CoverEditorV2({ blocks, onChange, offerContext }: { blocks: WebsiteV2Blocks; onChange: (b: WebsiteV2Blocks) => void; offerContext?: OfferContext }) {
    const c = blocks.cover
    return (
        <div className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">Logo i dane firmy są uzupełniane automatycznie z Ustawień → Firma.</p>
            <Field label="Tytuł główny">
                <Input value={c.title ?? ''} onChange={e => onChange({ ...blocks, cover: { ...c, title: e.target.value } })} />
            </Field>
            <Field label="Nazwa odbiorcy">
                <Input value={c.recipientName || offerContext?.clientName || ''} onChange={e => onChange({ ...blocks, cover: { ...c, recipientName: e.target.value } })} placeholder="Nazwa klienta lub leada" />
            </Field>
            <Field label="Podtytuł (opis pod nagłówkiem)">
                <Textarea value={c.subtitle} onChange={e => onChange({ ...blocks, cover: { ...c, subtitle: e.target.value } })} />
            </Field>
            <Field label="Pill / obietnica">
                <Input value={c.knowledgePill ?? ''} onChange={e => onChange({ ...blocks, cover: { ...c, knowledgePill: e.target.value } })} />
            </Field>
            <Field label="Cena brutto (widoczna na okładce i w sekcji „Ile to kosztuje”)">
                <NumberInput
                    value={blocks.pricing.priceOverride ?? ''}
                    placeholder="Pozostaw puste = „do wyceny”"
                    onChange={e => onChange({ ...blocks, pricing: { ...blocks.pricing, priceOverride: e.target.value ? Number(e.target.value) : null } })}
                />
            </Field>
            <Field label="Realizacja do X dni">
                <NumberInput value={c.deadlineDays} onChange={e => onChange({ ...blocks, cover: { ...c, deadlineDays: Number(e.target.value) } })} />
            </Field>
            <Field label="Ważność oferty (dni)">
                <NumberInput value={c.validityDays} onChange={e => onChange({ ...blocks, cover: { ...c, validityDays: Number(e.target.value) } })} />
            </Field>
        </div>
    )
}

// ── Footer ────────────────────────────────────────────────────────────────────

export function FooterEditorV2({ blocks, onChange }: { blocks: WebsiteV2Blocks; onChange: (b: WebsiteV2Blocks) => void }) {
    const f = blocks.footer
    return (
        <div className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">Kontakt (email, telefon, www) pochodzi z Ustawień → Firma.</p>
            <Field label="Krótki opis / tagline">
                <Textarea value={f.tagline} onChange={e => onChange({ ...blocks, footer: { ...f, tagline: e.target.value } })} />
            </Field>
        </div>
    )
}

// ── Problem ───────────────────────────────────────────────────────────────────

export function ProblemEditor({ blocks, onChange, offerContext }: { blocks: WebsiteV2Blocks; onChange: (b: WebsiteV2Blocks) => void; offerContext?: OfferContext }) {
    const b = blocks.problem
    const update = (patch: Partial<typeof b>) => onChange({ ...blocks, problem: { ...b, ...patch } })
    const updatePoint = (i: number, patch: Partial<WV2PainPoint>) => {
        const pts = [...b.painPoints]; pts[i] = { ...pts[i], ...patch }; update({ painPoints: pts })
    }
    return (
        <div className="flex flex-col gap-4">
            <AiGenerateButton
                sectionKey="website_v2.problem"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    problem: {
                        ...blocks.problem,
                        painPoints: Array.isArray(data.painPoints) ? data.painPoints as WV2PainPoint[] : blocks.problem.painPoints,
                        punchline: (data.punchline as string) || blocks.problem.punchline,
                    },
                })}
            />
            <Field label="Tytuł sekcji"><Input value={b.title} onChange={e => update({ title: e.target.value })} /></Field>
            <div className="flex flex-col gap-3">
                <span className="text-xs font-medium text-muted-foreground">Punkty bólowe</span>
                {b.painPoints.map((p, i) => (
                    <div key={i} className="flex gap-2 items-start">
                        <Input className="w-10 flex-shrink-0" value={p.emoji} onChange={e => updatePoint(i, { emoji: e.target.value })} placeholder="😟" style={{ width: 48 }} />
                        <input value={p.text} onChange={e => updatePoint(i, { text: e.target.value })} placeholder="Opis problemu..." className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                        <RemoveBtn onClick={() => { const pts = b.painPoints.filter((_, j) => j !== i); update({ painPoints: pts }) }} />
                    </div>
                ))}
                <AddBtn onClick={() => update({ painPoints: [...b.painPoints, { emoji: '💡', text: 'Nowy problem...' }] })} label="Dodaj punkt" />
            </div>
            <Field label="Podsumowanie (kicker)"><Input value={b.punchline} onChange={e => update({ punchline: e.target.value })} /></Field>
        </div>
    )
}

// ── About ─────────────────────────────────────────────────────────────────────

export function AboutEditorV2({ blocks, onChange, offerContext }: { blocks: WebsiteV2Blocks; onChange: (b: WebsiteV2Blocks) => void; offerContext?: OfferContext }) {
    const b = blocks.about
    const update = (patch: Partial<typeof b>) => onChange({ ...blocks, about: { ...b, ...patch } })
    const updateStat = (i: number, patch: Partial<WV2StatItem>) => {
        const stats = [...b.stats]; stats[i] = { ...stats[i], ...patch }; update({ stats })
    }
    return (
        <div className="flex flex-col gap-4">
            <AiGenerateButton
                sectionKey="website_v2.about"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    about: {
                        ...blocks.about,
                        bio: (data.bio as string) || blocks.about.bio,
                        role: (data.role as string) || blocks.about.role,
                        stats: Array.isArray(data.stats) ? data.stats as WV2StatItem[] : blocks.about.stats,
                    },
                })}
            />
            <Field label="Tytuł sekcji"><Input value={b.title} onChange={e => update({ title: e.target.value })} /></Field>
            <Field label="Imię i nazwisko"><Input value={b.name} onChange={e => update({ name: e.target.value })} /></Field>
            <Field label="Rola / specjalizacja"><Input value={b.role} onChange={e => update({ role: e.target.value })} /></Field>
            <Field label="Opis bio"><Textarea value={b.bio} onChange={e => update({ bio: e.target.value })} /></Field>
            <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">Statystyki</span>
                {b.stats.map((s, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <Input value={s.value} onChange={e => updateStat(i, { value: e.target.value })} placeholder="50+" />
                        <Input value={s.label} onChange={e => updateStat(i, { label: e.target.value })} placeholder="zrobionych stron" />
                        <RemoveBtn onClick={() => update({ stats: b.stats.filter((_, j) => j !== i) })} />
                    </div>
                ))}
                <AddBtn onClick={() => update({ stats: [...b.stats, { value: '—', label: 'opis' }] })} label="Dodaj statystykę" />
            </div>
        </div>
    )
}

// ── Features ──────────────────────────────────────────────────────────────────

export function FeaturesEditor({ blocks, onChange, offerContext }: { blocks: WebsiteV2Blocks; onChange: (b: WebsiteV2Blocks) => void; offerContext?: OfferContext }) {
    const b = blocks.features
    const update = (patch: Partial<typeof b>) => onChange({ ...blocks, features: { ...b, ...patch } })
    const updateItem = (i: number, patch: Partial<WV2FeatureItem>) => {
        const items = [...b.items]; items[i] = { ...items[i], ...patch }; update({ items })
    }
    const [newExtra, setNewExtra] = useState('')
    return (
        <div className="flex flex-col gap-4">
            <AiGenerateButton
                sectionKey="website_v2.features"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    features: {
                        ...blocks.features,
                        items: Array.isArray(data.items) ? data.items as WV2FeatureItem[] : blocks.features.items,
                        extras: Array.isArray(data.extras) ? data.extras as string[] : blocks.features.extras,
                    },
                })}
            />
            <Field label="Tytuł"><Input value={b.title} onChange={e => update({ title: e.target.value })} /></Field>
            <Field label="Podtytuł"><Textarea rows={2} value={b.subtitle} onChange={e => update({ subtitle: e.target.value })} /></Field>
            <div className="flex flex-col gap-3">
                <span className="text-xs font-medium text-muted-foreground">Pozycje listy</span>
                {b.items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-start border border-border rounded-lg p-2.5">
                        <div className="flex-1 flex flex-col gap-1.5">
                            <input value={item.title} onChange={e => updateItem(i, { title: e.target.value })} placeholder="Tytuł..." className="w-full rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
                            <input value={item.description} onChange={e => updateItem(i, { description: e.target.value })} placeholder="Opis..." className="w-full rounded border border-input bg-background px-2 py-1 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                        </div>
                        <RemoveBtn onClick={() => update({ items: b.items.filter((_, j) => j !== i) })} />
                    </div>
                ))}
                <AddBtn onClick={() => update({ items: [...b.items, { title: 'Nowa pozycja', description: 'Opis...' }] })} label="Dodaj pozycję" />
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">Dostępne za dopłatą</span>
                {b.extras.map((e, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <input value={e} onChange={ev => { const ex = [...b.extras]; ex[i] = ev.target.value; update({ extras: ex }) }} className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                        <RemoveBtn onClick={() => update({ extras: b.extras.filter((_, j) => j !== i) })} />
                    </div>
                ))}
                <div className="flex gap-2">
                    <input value={newExtra} onChange={ev => setNewExtra(ev.target.value)} onKeyDown={ev => { if (ev.key === 'Enter' && newExtra.trim()) { update({ extras: [...b.extras, newExtra.trim()] }); setNewExtra('') } }} placeholder="Wpisz i naciśnij Enter..." className="flex-1 rounded-md border border-dashed border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    <button type="button" onClick={() => { if (newExtra.trim()) { update({ extras: [...b.extras, newExtra.trim()] }); setNewExtra('') } }} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary transition-colors"><Plus className="h-3 w-3" /></button>
                </div>
            </div>
        </div>
    )
}

// ── Portfolio ─────────────────────────────────────────────────────────────────

export function PortfolioEditor({ blocks, onChange }: { blocks: WebsiteV2Blocks; onChange: (b: WebsiteV2Blocks) => void }) {
    const b = blocks.portfolio
    const [imageError, setImageError] = useState('')
    const update = (patch: Partial<typeof b>) => onChange({ ...blocks, portfolio: { ...b, ...patch } })
    const updateWork = (i: number, patch: Partial<WV2PortfolioItem>) => {
        const works = [...b.works]; works[i] = { ...works[i], ...patch }; update({ works })
    }
    const updateTestimonial = (i: number, patch: Partial<WV2Testimonial>) => {
        const ts = [...b.testimonials]; ts[i] = { ...ts[i], ...patch }; update({ testimonials: ts })
    }
    const uploadWorkImage = async (i: number, file?: File) => {
        if (!file) return
        if (!file.type.startsWith('image/')) { setImageError('Wybierz plik graficzny.'); return }
        if (file.size > 5 * 1024 * 1024) { setImageError('Plik jest za duży (maks. 5 MB).'); return }
        try {
            setImageError('')
            updateWork(i, { imageUrl: await compressImage(file, 1400, 900, 0.82) })
        } catch {
            setImageError('Nie udało się przetworzyć obrazu.')
        }
    }
    return (
        <div className="flex flex-col gap-4">
            <Field label="Tytuł"><Input value={b.title} onChange={e => update({ title: e.target.value })} /></Field>
            <Field label="Podtytuł"><Textarea rows={2} value={b.subtitle} onChange={e => update({ subtitle: e.target.value })} /></Field>
            <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">Realizacje</span>
                {b.works.map((w, i) => (
                    <div key={i} className="rounded-lg border border-border p-2.5">
                        <div className="flex gap-2 items-center">
                            <Input value={w.name} onChange={e => updateWork(i, { name: e.target.value })} placeholder="Nazwa firmy / branża" />
                            <Input value={w.url} onChange={e => updateWork(i, { url: e.target.value })} placeholder="https://..." />
                            <RemoveBtn onClick={() => update({ works: b.works.filter((_, j) => j !== i) })} />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            {w.imageUrl && <div aria-label="Podgląd screenshotu" className="h-12 w-20 rounded border border-border bg-cover bg-center" style={{ backgroundImage: `url(${w.imageUrl})` }} />}
                            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-secondary">
                                <ImagePlus className="h-3.5 w-3.5" />
                                {w.imageUrl ? 'Zmień screenshot' : 'Dodaj screenshot'}
                                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={e => { void uploadWorkImage(i, e.target.files?.[0]); e.currentTarget.value = '' }} />
                            </label>
                            {w.imageUrl && <button type="button" onClick={() => updateWork(i, { imageUrl: '' })} className="text-xs text-destructive hover:underline">Usuń obraz</button>}
                        </div>
                    </div>
                ))}
                {imageError && <p className="text-xs text-destructive">{imageError}</p>}
                <AddBtn onClick={() => update({ works: [...b.works, { name: 'Nowa realizacja', url: '#', imageUrl: '' }] })} label="Dodaj realizację" />
            </div>
            <div className="flex flex-col gap-3">
                <span className="text-xs font-medium text-muted-foreground">Opinie klientów</span>
                {b.testimonials.map((t, i) => (
                    <div key={i} className="flex flex-col gap-1.5 border border-border rounded-lg p-2.5">
                        <div className="flex gap-2 items-center">
                            <Input value={t.name} onChange={e => updateTestimonial(i, { name: e.target.value })} placeholder="Imię" />
                            <Input value={t.company} onChange={e => updateTestimonial(i, { company: e.target.value })} placeholder="Firma" />
                            <RemoveBtn onClick={() => update({ testimonials: b.testimonials.filter((_, j) => j !== i) })} />
                        </div>
                        <textarea value={t.text} onChange={e => updateTestimonial(i, { text: e.target.value })} rows={2} placeholder="Treść opinii..." className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y" />
                    </div>
                ))}
                <AddBtn onClick={() => update({ testimonials: [...b.testimonials, { stars: 5, text: 'Nowa opinia...', name: 'Jan K.', company: 'Firma XYZ' }] })} label="Dodaj opinię" />
            </div>
        </div>
    )
}

// ── Process ───────────────────────────────────────────────────────────────────

export function ProcessEditorV2({ blocks, onChange, offerContext }: { blocks: WebsiteV2Blocks; onChange: (b: WebsiteV2Blocks) => void; offerContext?: OfferContext }) {
    const b = blocks.process
    const update = (patch: Partial<typeof b>) => onChange({ ...blocks, process: { ...b, ...patch } })
    const updateStep = (i: number, patch: Partial<WV2ProcessStep>) => {
        const steps = [...b.steps]; steps[i] = { ...steps[i], ...patch }; update({ steps })
    }
    return (
        <div className="flex flex-col gap-4">
            <AiGenerateButton
                sectionKey="website_v2.process"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    process: {
                        ...blocks.process,
                        steps: Array.isArray(data.steps) ? data.steps as WV2ProcessStep[] : blocks.process.steps,
                        timelineNote: (data.timelineNote as string) || blocks.process.timelineNote,
                    },
                })}
            />
            <Field label="Tytuł"><Input value={b.title} onChange={e => update({ title: e.target.value })} /></Field>
            <div className="flex flex-col gap-3">
                <span className="text-xs font-medium text-muted-foreground">Kroki</span>
                {b.steps.map((s, i) => (
                    <div key={i} className="flex gap-2 items-start border border-border rounded-lg p-2.5">
                        <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-1">{i + 1}</span>
                        <div className="flex-1 flex flex-col gap-1.5">
                            <Input value={s.title} onChange={e => updateStep(i, { title: e.target.value })} placeholder="Tytuł kroku" />
                            <Textarea rows={2} value={s.description} onChange={e => updateStep(i, { description: e.target.value })} placeholder="Opis..." />
                        </div>
                        <RemoveBtn onClick={() => update({ steps: b.steps.filter((_, j) => j !== i) })} />
                    </div>
                ))}
                <AddBtn onClick={() => update({ steps: [...b.steps, { title: 'Nowy krok', description: 'Opis...' }] })} label="Dodaj krok" />
            </div>
            <Field label="Informacja o czasie realizacji"><Input value={b.timelineNote} onChange={e => update({ timelineNote: e.target.value })} placeholder="Całość zajmuje zazwyczaj od X do Y dni..." /></Field>
        </div>
    )
}

// ── Technology ────────────────────────────────────────────────────────────────

export function TechnologyEditorV2({ blocks, onChange }: { blocks: WebsiteV2Blocks; onChange: (b: WebsiteV2Blocks) => void }) {
    const b = blocks.technology
    const update = (patch: Partial<typeof b>) => onChange({ ...blocks, technology: { ...b, ...patch } })
    const r = b.recommended
    const updateRec = (patch: Partial<typeof r>) => update({ recommended: { ...r, ...patch } })
    const [newPro, setNewPro] = useState('')
    return (
        <div className="flex flex-col gap-5">
            <Field label="Tytuł"><Input value={b.title} onChange={e => update({ title: e.target.value })} /></Field>
            <Field label="Podtytuł"><Textarea rows={2} value={b.subtitle} onChange={e => update({ subtitle: e.target.value })} /></Field>

            <div className="border border-primary/30 rounded-lg p-3 flex flex-col gap-3">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Rekomendacja</span>
                <div className="flex gap-2">
                    <Field label="Inicjał ikony"><Input value={r.iconChar} onChange={e => updateRec({ iconChar: e.target.value })} style={{ width: 48 }} /></Field>
                    <Field label="Kolor ikony"><Input type="color" value={r.iconBg} onChange={e => updateRec({ iconBg: e.target.value })} style={{ width: 48 }} /></Field>
                    <div className="flex-1"><Field label="Nazwa technologii"><Input value={r.name} onChange={e => updateRec({ name: e.target.value })} /></Field></div>
                </div>
                <Field label="Opis"><Textarea value={r.description} onChange={e => updateRec({ description: e.target.value })} /></Field>
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Zalety (✓)</span>
                    {r.pros.map((pro, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <Input value={pro} onChange={ev => { const pros = [...r.pros]; pros[i] = ev.target.value; updateRec({ pros }) }} />
                            <RemoveBtn onClick={() => updateRec({ pros: r.pros.filter((_, j) => j !== i) })} />
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <input value={newPro} onChange={e => setNewPro(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newPro.trim()) { updateRec({ pros: [...r.pros, newPro.trim()] }); setNewPro('') } }} placeholder="Dodaj zaletę..." className="flex-1 rounded-md border border-dashed border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none" />
                        <button type="button" onClick={() => { if (newPro.trim()) { updateRec({ pros: [...r.pros, newPro.trim()] }); setNewPro('') } }} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"><Plus className="h-3 w-3" /></button>
                    </div>
                </div>
            </div>

            <Field label="Stopka sekcji (kursywa)"><Textarea rows={2} value={b.footer} onChange={e => update({ footer: e.target.value })} /></Field>
        </div>
    )
}

// ── Pricing ───────────────────────────────────────────────────────────────────

export function PricingEditorV2({ blocks, onChange }: { blocks: WebsiteV2Blocks; onChange: (b: WebsiteV2Blocks) => void }) {
    const b = blocks.pricing
    const update = (patch: Partial<typeof b>) => onChange({ ...blocks, pricing: { ...b, ...patch } })
    const updateGuarantee = (i: number, patch: Partial<WV2Guarantee>) => {
        const gs = [...b.guarantees]; gs[i] = { ...gs[i], ...patch }; update({ guarantees: gs })
    }
    const updateCost = (i: number, field: string, value: string) => {
        const costs = [...b.costs]; costs[i] = { ...costs[i], [field]: value }; update({ costs })
    }
    return (
        <div className="flex flex-col gap-4">
            <Field label="Cena brutto (nadpisuje sumę pozycji)">
                <NumberInput
                    value={b.priceOverride ?? ''}
                    placeholder="Pozostaw puste = z pozycji oferty"
                    onChange={e => update({ priceOverride: e.target.value ? Number(e.target.value) : null })}
                />
            </Field>
            <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">Zawiera w cenie</span>
                {b.includes.map((inc, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <input value={inc} onChange={e => { const arr = [...b.includes]; arr[i] = e.target.value; update({ includes: arr }) }} className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                        <RemoveBtn onClick={() => update({ includes: b.includes.filter((_, j) => j !== i) })} />
                    </div>
                ))}
                <AddBtn onClick={() => update({ includes: [...b.includes, 'Nowa pozycja'] })} label="Dodaj pozycję" />
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">Harmonogram płatności</span>
                {b.paymentSchedule.map((ps, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <NumberInput value={ps.percent} onChange={e => { const arr = [...b.paymentSchedule]; arr[i] = { ...ps, percent: Number(e.target.value) }; update({ paymentSchedule: arr }) }} style={{ width: 64 }} />
                        <span className="text-sm text-muted-foreground">%</span>
                        <input value={ps.label} onChange={e => { const arr = [...b.paymentSchedule]; arr[i] = { ...ps, label: e.target.value }; update({ paymentSchedule: arr }) }} className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                        <RemoveBtn onClick={() => update({ paymentSchedule: b.paymentSchedule.filter((_, j) => j !== i) })} />
                    </div>
                ))}
                <AddBtn onClick={() => update({ paymentSchedule: [...b.paymentSchedule, { percent: 50, label: 'nowa rata' }] })} label="Dodaj ratę" />
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">Gwarancje / wyróżniki</span>
                {b.guarantees.map((g, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <Input value={g.emoji} style={{ width: 48 }} onChange={e => updateGuarantee(i, { emoji: e.target.value })} />
                        <input value={g.text} onChange={e => updateGuarantee(i, { text: e.target.value })} className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                        <RemoveBtn onClick={() => update({ guarantees: b.guarantees.filter((_, j) => j !== i) })} />
                    </div>
                ))}
                <AddBtn onClick={() => update({ guarantees: [...b.guarantees, { emoji: '✅', text: 'Nowa gwarancja' }] })} label="Dodaj gwarancję" />
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">Koszty (jednorazowe / cykliczne)</span>
                {b.costs.map((cost, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 items-center border border-border rounded-lg p-2">
                        <input value={cost.type} onChange={e => updateCost(i, 'type', e.target.value)} placeholder="Jednorazowo" className="rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none" />
                        <input value={cost.amount} onChange={e => updateCost(i, 'amount', e.target.value)} placeholder="Kwota" className="rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none" />
                        <div className="flex gap-1">
                            <input value={cost.description} onChange={e => updateCost(i, 'description', e.target.value)} placeholder="Opis" className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none" />
                            <RemoveBtn onClick={() => update({ costs: b.costs.filter((_, j) => j !== i) })} />
                        </div>
                    </div>
                ))}
                <AddBtn onClick={() => update({ costs: [...b.costs, { type: 'Jednorazowo', amount: '—', description: 'opis kosztu' }] })} label="Dodaj koszt" />
            </div>
        </div>
    )
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

export function FaqEditor({ blocks, onChange, offerContext }: { blocks: WebsiteV2Blocks; onChange: (b: WebsiteV2Blocks) => void; offerContext?: OfferContext }) {
    const b = blocks.faq
    const update = (patch: Partial<typeof b>) => onChange({ ...blocks, faq: { ...b, ...patch } })
    const updateItem = (i: number, patch: Partial<WV2FaqItem>) => {
        const items = [...b.items]; items[i] = { ...items[i], ...patch }; update({ items })
    }
    return (
        <div className="flex flex-col gap-4">
            <AiGenerateButton
                sectionKey="website_v2.faq"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    faq: {
                        ...blocks.faq,
                        items: Array.isArray(data.items) ? data.items as WV2FaqItem[] : blocks.faq.items,
                    },
                })}
            />
            <Field label="Tytuł"><Input value={b.title} onChange={e => update({ title: e.target.value })} /></Field>
            <Field label="Podtytuł"><Textarea rows={2} value={b.subtitle} onChange={e => update({ subtitle: e.target.value })} /></Field>
            <div className="flex flex-col gap-3">
                {b.items.map((item, i) => (
                    <div key={i} className="flex flex-col gap-1.5 border border-border rounded-lg p-2.5">
                        <div className="flex gap-2 items-start">
                            <input value={item.question} onChange={e => updateItem(i, { question: e.target.value })} placeholder="Pytanie..." className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring" />
                            <RemoveBtn onClick={() => update({ items: b.items.filter((_, j) => j !== i) })} />
                        </div>
                        <textarea value={item.answer} onChange={e => updateItem(i, { answer: e.target.value })} rows={2} placeholder="Odpowiedź..." className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y" />
                    </div>
                ))}
                <AddBtn onClick={() => update({ items: [...b.items, { question: 'Nowe pytanie?', answer: 'Odpowiedź...' }] })} label="Dodaj pytanie" />
            </div>
        </div>
    )
}
