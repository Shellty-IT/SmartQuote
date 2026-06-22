// src/components/offers/editor/website-v3-block-editors.tsx
// Per-block editor components for the "Strona internetowa v3" template.
'use client'

import { Plus, Trash2 } from 'lucide-react'
import type {
    WebsiteV3Blocks,
    WV3Package, WV3PackageFeature,
    WV3ProcessStep,
    WV3ScopeCategory, WV3ScopeItem,
    WV3TimelineRow,
    WV3PricingItem, WV3PaymentStep,
    WV3PortfolioItem,
    WV3Testimonial,
    WV3Stat,
    WV3Guarantee,
} from '@/lib/pdf/website-v3-blocks'
import { AiGenerateButton, type OfferContext } from './block-editors'

interface FieldProps {
    label: string
    children: React.ReactNode
}
function Field({ label, children }: FieldProps) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
            {children}
        </div>
    )
}

const inputCls = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
const textareaCls = `${inputCls} resize-y min-h-[72px]`

// ── Cover ─────────────────────────────────────────────────────────────────────

export function CoverEditorV3({ blocks, onChange }: { blocks: WebsiteV3Blocks; onChange: (b: WebsiteV3Blocks) => void }) {
    const c = blocks.cover
    const set = (patch: Partial<typeof c>) => onChange({ ...blocks, cover: { ...c, ...patch } })
    return (
        <div className="flex flex-col gap-4">
            <Field label="Etykieta nad tytułem">
                <input className={inputCls} value={c.badgeLabel ?? ''} onChange={(e) => set({ badgeLabel: e.target.value })} />
            </Field>
            <Field label="Podtytuł nagłówka">
                <input className={inputCls} value={c.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
            </Field>
            <Field label="Obietnice (pills)">
                {c.promisePills.map((p, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <input className={inputCls} value={p} onChange={(e) => {
                            const pills = [...c.promisePills]; pills[i] = e.target.value; set({ promisePills: pills })
                        }} />
                        <button type="button" onClick={() => set({ promisePills: c.promisePills.filter((_, j) => j !== i) })}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => set({ promisePills: [...c.promisePills, 'Nowa cecha'] })}
                    className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Plus className="w-3 h-3" /> Dodaj
                </button>
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Termin realizacji (dni)">
                    <input type="number" className={inputCls} value={c.deadlineDays} onChange={(e) => set({ deadlineDays: Number(e.target.value) })} />
                </Field>
                <Field label="Ważność oferty (dni)">
                    <input type="number" className={inputCls} value={c.validityDays} onChange={(e) => set({ validityDays: Number(e.target.value) })} />
                </Field>
            </div>
        </div>
    )
}

// ── Footer ────────────────────────────────────────────────────────────────────

export function FooterEditorV3({ blocks, onChange }: { blocks: WebsiteV3Blocks; onChange: (b: WebsiteV3Blocks) => void }) {
    const f = blocks.footer
    const set = (patch: Partial<typeof f>) => onChange({ ...blocks, footer: { ...f, ...patch } })
    return (
        <div className="flex flex-col gap-4">
            <Field label="Nagłówek CTA">
                <input className={inputCls} value={f.ctaHeadline} onChange={(e) => set({ ctaHeadline: e.target.value })} />
            </Field>
            <Field label="Podtytuł CTA">
                <textarea className={textareaCls} value={f.ctaSubtitle} onChange={(e) => set({ ctaSubtitle: e.target.value })} />
            </Field>
        </div>
    )
}

// ── Needs ─────────────────────────────────────────────────────────────────────

export function NeedsEditor({ blocks, onChange, offerContext }: { blocks: WebsiteV3Blocks; onChange: (b: WebsiteV3Blocks) => void; offerContext?: OfferContext }) {
    const b = blocks.needs
    const set = (patch: Partial<typeof b>) => onChange({ ...blocks, needs: { ...b, ...patch } })
    return (
        <div className="flex flex-col gap-4">
            <AiGenerateButton
                sectionKey="website_v3.needs"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    needs: {
                        ...blocks.needs,
                        challengeItems: Array.isArray(data.challengeItems) ? data.challengeItems as string[] : blocks.needs.challengeItems,
                        responseItems: Array.isArray(data.responseItems) ? data.responseItems as string[] : blocks.needs.responseItems,
                        challengeTitle: (data.challengeTitle as string) || blocks.needs.challengeTitle,
                        responseTitle: (data.responseTitle as string) || blocks.needs.responseTitle,
                        intro: (data.intro as string) || blocks.needs.intro,
                    },
                })}
            />
            <Field label="Tytuł sekcji">
                <input className={inputCls} value={b.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label="Wstęp (lead)">
                <textarea className={textareaCls} value={b.intro} onChange={(e) => set({ intro: e.target.value })} />
            </Field>
            <Field label="Tytuł wyzwania">
                <input className={inputCls} value={b.challengeTitle} onChange={(e) => set({ challengeTitle: e.target.value })} />
            </Field>
            <Field label="Punkty wyzwania">
                {b.challengeItems.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <input className={inputCls} value={item} onChange={(e) => {
                            const arr = [...b.challengeItems]; arr[i] = e.target.value; set({ challengeItems: arr })
                        }} />
                        <button type="button" onClick={() => set({ challengeItems: b.challengeItems.filter((_, j) => j !== i) })}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => set({ challengeItems: [...b.challengeItems, ''] })}
                    className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Plus className="w-3 h-3" /> Dodaj punkt
                </button>
            </Field>
            <Field label="Tytuł odpowiedzi">
                <input className={inputCls} value={b.responseTitle} onChange={(e) => set({ responseTitle: e.target.value })} />
            </Field>
            <Field label="Punkty odpowiedzi">
                {b.responseItems.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <input className={inputCls} value={item} onChange={(e) => {
                            const arr = [...b.responseItems]; arr[i] = e.target.value; set({ responseItems: arr })
                        }} />
                        <button type="button" onClick={() => set({ responseItems: b.responseItems.filter((_, j) => j !== i) })}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => set({ responseItems: [...b.responseItems, ''] })}
                    className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Plus className="w-3 h-3" /> Dodaj punkt
                </button>
            </Field>
        </div>
    )
}

// ── Packages ──────────────────────────────────────────────────────────────────

export function PackagesEditor({ blocks, onChange }: { blocks: WebsiteV3Blocks; onChange: (b: WebsiteV3Blocks) => void }) {
    const b = blocks.packages
    const set = (patch: Partial<typeof b>) => onChange({ ...blocks, packages: { ...b, ...patch } })
    const setPkg = (i: number, patch: Partial<WV3Package>) => {
        const pkgs = [...b.packages]; pkgs[i] = { ...pkgs[i], ...patch }; set({ packages: pkgs })
    }
    const setFeature = (pkgIdx: number, featIdx: number, patch: Partial<WV3PackageFeature>) => {
        const pkgs = [...b.packages]
        const feats = [...pkgs[pkgIdx].features]; feats[featIdx] = { ...feats[featIdx], ...patch }
        pkgs[pkgIdx] = { ...pkgs[pkgIdx], features: feats }; set({ packages: pkgs })
    }
    return (
        <div className="flex flex-col gap-4">
            <Field label="Tytuł sekcji">
                <input className={inputCls} value={b.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label="Podtytuł (etykieta)">
                <input className={inputCls} value={b.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
            </Field>
            {b.packages.map((pkg, i) => (
                <div key={i} className="rounded-xl border border-border p-4 flex flex-col gap-3">
                    <div className="font-semibold text-sm flex items-center gap-2">
                        {pkg.highlighted && <span className="text-xs bg-violet-100 text-violet-700 rounded-full px-2 py-0.5 font-bold">★ Wyróżniony</span>}
                        Pakiet: {pkg.name}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Field label="Nazwa">
                            <input className={inputCls} value={pkg.name} onChange={(e) => setPkg(i, { name: e.target.value })} />
                        </Field>
                        <Field label="Tagline">
                            <input className={inputCls} value={pkg.tagline} onChange={(e) => setPkg(i, { tagline: e.target.value })} />
                        </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Field label="Cena (tekst)">
                            <input className={inputCls} value={pkg.price} onChange={(e) => setPkg(i, { price: e.target.value })} />
                        </Field>
                        <Field label="Etykieta przycisku">
                            <input className={inputCls} value={pkg.ctaLabel} onChange={(e) => setPkg(i, { ctaLabel: e.target.value })} />
                        </Field>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id={`pkg-highlight-${i}`} checked={pkg.highlighted}
                            onChange={(e) => setPkg(i, { highlighted: e.target.checked })} />
                        <label htmlFor={`pkg-highlight-${i}`} className="text-sm">Wyróżnij (ciemne tło)</label>
                    </div>
                    <Field label="Funkcje">
                        {pkg.features.map((f, fi) => (
                            <div key={fi} className="flex gap-2 items-center">
                                <input type="checkbox" checked={f.included} onChange={(e) => setFeature(i, fi, { included: e.target.checked })} />
                                <input className={inputCls} value={f.label} onChange={(e) => setFeature(i, fi, { label: e.target.value })} />
                                <button type="button" onClick={() => {
                                    const feats = pkg.features.filter((_, j) => j !== fi); setPkg(i, { features: feats })
                                }}><Trash2 className="w-4 h-4 text-destructive" /></button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setPkg(i, { features: [...pkg.features, { label: '', included: true }] })}
                            className="flex items-center gap-1 text-xs text-primary font-medium">
                            <Plus className="w-3 h-3" /> Dodaj funkcję
                        </button>
                    </Field>
                </div>
            ))}
        </div>
    )
}

// ── Process ───────────────────────────────────────────────────────────────────

export function ProcessEditorV3({ blocks, onChange, offerContext }: { blocks: WebsiteV3Blocks; onChange: (b: WebsiteV3Blocks) => void; offerContext?: OfferContext }) {
    const b = blocks.process
    const set = (patch: Partial<typeof b>) => onChange({ ...blocks, process: { ...b, ...patch } })
    const setStep = (i: number, patch: Partial<WV3ProcessStep>) => {
        const steps = [...b.steps]; steps[i] = { ...steps[i], ...patch }; set({ steps })
    }
    return (
        <div className="flex flex-col gap-4">
            <AiGenerateButton
                sectionKey="website_v3.process"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    process: {
                        ...blocks.process,
                        steps: Array.isArray(data.steps) ? data.steps as WV3ProcessStep[] : blocks.process.steps,
                        timelineNote: (data.timelineNote as string) || blocks.process.timelineNote,
                    },
                })}
            />
            <Field label="Tytuł sekcji">
                <input className={inputCls} value={b.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label="Etapy">
                {b.steps.map((s, i) => (
                    <div key={i} className="rounded-xl border border-border p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground">Etap {i + 1}</span>
                            <button type="button" onClick={() => set({ steps: b.steps.filter((_, j) => j !== i) })}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <input className={inputCls} placeholder="Nazwa" value={s.label} onChange={(e) => setStep(i, { label: e.target.value })} />
                            <input className={inputCls} placeholder="Czas (np. 2–3 dni)" value={s.duration} onChange={(e) => setStep(i, { duration: e.target.value })} />
                        </div>
                        <input className={inputCls} placeholder="Opis" value={s.description} onChange={(e) => setStep(i, { description: e.target.value })} />
                    </div>
                ))}
                <button type="button" onClick={() => set({ steps: [...b.steps, { label: '', duration: '', description: '' }] })}
                    className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Plus className="w-3 h-3" /> Dodaj etap
                </button>
            </Field>
            <Field label="Nota o czasie realizacji">
                <input className={inputCls} value={b.timelineNote} onChange={(e) => set({ timelineNote: e.target.value })} />
            </Field>
        </div>
    )
}

// ── Scope ─────────────────────────────────────────────────────────────────────

export function ScopeEditorV3({ blocks, onChange }: { blocks: WebsiteV3Blocks; onChange: (b: WebsiteV3Blocks) => void }) {
    const b = blocks.scope
    const set = (patch: Partial<typeof b>) => onChange({ ...blocks, scope: { ...b, ...patch } })
    const setCat = (i: number, patch: Partial<WV3ScopeCategory>) => {
        const cats = [...b.categories]; cats[i] = { ...cats[i], ...patch }; set({ categories: cats })
    }
    const setItem = (ci: number, ii: number, patch: Partial<WV3ScopeItem>) => {
        const cats = [...b.categories]
        const items = [...cats[ci].items]; items[ii] = { ...items[ii], ...patch }
        cats[ci] = { ...cats[ci], items }; set({ categories: cats })
    }
    return (
        <div className="flex flex-col gap-4">
            <Field label="Tytuł sekcji">
                <input className={inputCls} value={b.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            {b.categories.map((cat, ci) => (
                <div key={ci} className="rounded-xl border border-border p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                        <input className={inputCls} placeholder="Tytuł kategorii" value={cat.title}
                            onChange={(e) => setCat(ci, { title: e.target.value })} />
                        <button type="button" onClick={() => set({ categories: b.categories.filter((_, j) => j !== ci) })}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                    </div>
                    {cat.items.map((item, ii) => (
                        <div key={ii} className="flex gap-2 items-start pl-2">
                            <input type="checkbox" className="mt-2" checked={item.optional}
                                title="Opcjonalnie"
                                onChange={(e) => setItem(ci, ii, { optional: e.target.checked })} />
                            <div className="flex-1 flex flex-col gap-1">
                                <input className={inputCls} placeholder="Element zakresu" value={item.label}
                                    onChange={(e) => setItem(ci, ii, { label: e.target.value })} />
                                <input className={inputCls} placeholder="Opis (opcjonalny)" value={item.description ?? ''}
                                    onChange={(e) => setItem(ci, ii, { description: e.target.value || undefined })} />
                            </div>
                            <button type="button" onClick={() => {
                                const items = cat.items.filter((_, j) => j !== ii); setCat(ci, { items })
                            }}><Trash2 className="w-4 h-4 text-destructive" /></button>
                        </div>
                    ))}
                    <button type="button" onClick={() => setCat(ci, { items: [...cat.items, { label: '', optional: false }] })}
                        className="flex items-center gap-1 text-xs text-primary font-medium pl-2">
                        <Plus className="w-3 h-3" /> Dodaj element
                    </button>
                </div>
            ))}
            <button type="button" onClick={() => set({ categories: [...b.categories, { title: 'Nowa kategoria', items: [] }] })}
                className="flex items-center gap-1 text-xs text-primary font-medium">
                <Plus className="w-3 h-3" /> Dodaj kategorię
            </button>
        </div>
    )
}

// ── Timeline ──────────────────────────────────────────────────────────────────

export function TimelineEditorV3({ blocks, onChange }: { blocks: WebsiteV3Blocks; onChange: (b: WebsiteV3Blocks) => void }) {
    const b = blocks.timeline
    const set = (patch: Partial<typeof b>) => onChange({ ...blocks, timeline: { ...b, ...patch } })
    const setRow = (i: number, patch: Partial<WV3TimelineRow>) => {
        const rows = [...b.rows]; rows[i] = { ...rows[i], ...patch }; set({ rows })
    }
    const FILL_OPTIONS: Array<0 | 0.5 | 1> = [0, 0.5, 1]
    const FILL_LABELS: Record<number, string> = { 0: 'brak', 0.5: '½', 1: 'pełny' }

    return (
        <div className="flex flex-col gap-4">
            <Field label="Tytuł sekcji">
                <input className={inputCls} value={b.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label="Etykiety kolumn">
                {b.columnLabels.map((l, i) => (
                    <input key={i} className={inputCls} value={l} onChange={(e) => {
                        const cols = [...b.columnLabels]; cols[i] = e.target.value; set({ columnLabels: cols })
                    }} />
                ))}
            </Field>
            <Field label="Wiersze harmonogramu">
                {b.rows.map((row, ri) => (
                    <div key={ri} className="rounded-xl border border-border p-3 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <input className={inputCls} placeholder="Etap" value={row.label}
                                onChange={(e) => setRow(ri, { label: e.target.value })} />
                            <button type="button" onClick={() => set({ rows: b.rows.filter((_, j) => j !== ri) })}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                        </div>
                        <div className="flex gap-2">
                            {row.fills.map((fill, fi) => (
                                <div key={fi} className="flex flex-col items-center gap-1 flex-1">
                                    <span className="text-xs text-muted-foreground">{b.columnLabels[fi] ?? `Kol. ${fi + 1}`}</span>
                                    <select className="rounded border border-input bg-background px-2 py-1 text-xs w-full"
                                        value={fill}
                                        onChange={(e) => {
                                            const fills = [...row.fills] as Array<0 | 0.5 | 1>
                                            fills[fi] = Number(e.target.value) as 0 | 0.5 | 1
                                            setRow(ri, { fills })
                                        }}>
                                        {FILL_OPTIONS.map((o) => (
                                            <option key={o} value={o}>{FILL_LABELS[o]}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                <button type="button" onClick={() => set({ rows: [...b.rows, { label: '', fills: b.columnLabels.map(() => 0) as Array<0 | 0.5 | 1> }] })}
                    className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Plus className="w-3 h-3" /> Dodaj wiersz
                </button>
            </Field>
            <Field label="Szacowany termin uruchomienia">
                <input className={inputCls} placeholder="np. 15.07.2026" value={b.estimatedCompletion}
                    onChange={(e) => set({ estimatedCompletion: e.target.value })} />
            </Field>
        </div>
    )
}

// ── Pricing ───────────────────────────────────────────────────────────────────

export function PricingEditorV3({ blocks, onChange }: { blocks: WebsiteV3Blocks; onChange: (b: WebsiteV3Blocks) => void }) {
    const b = blocks.pricing
    const set = (patch: Partial<typeof b>) => onChange({ ...blocks, pricing: { ...b, ...patch } })
    const setItem = (i: number, patch: Partial<WV3PricingItem>) => {
        const items = [...b.items]; items[i] = { ...items[i], ...patch }; set({ items })
    }
    const setStep = (i: number, patch: Partial<WV3PaymentStep>) => {
        const steps = [...b.paymentSteps]; steps[i] = { ...steps[i], ...patch }; set({ paymentSteps: steps })
    }
    return (
        <div className="flex flex-col gap-4">
            <Field label="Tytuł sekcji">
                <input className={inputCls} value={b.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label="Nadpisanie ceny brutto (opcjonalne)">
                <input type="number" className={inputCls} value={b.priceOverride ?? ''} placeholder="pozostaw puste = z oferty"
                    onChange={(e) => set({ priceOverride: e.target.value ? Number(e.target.value) : null })} />
            </Field>
            <Field label="Pozycje cenowe">
                {b.items.map((item, i) => (
                    <div key={i} className="rounded-xl border border-border p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground">{item.isExtra ? 'OPCJA DODATKOWA' : 'POZYCJA GŁÓWNA'}</span>
                            <button type="button" onClick={() => set({ items: b.items.filter((_, j) => j !== i) })}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <input className={inputCls} placeholder="Nazwa pozycji" value={item.label}
                                onChange={(e) => setItem(i, { label: e.target.value })} />
                            <input className={inputCls} placeholder="Szczegóły" value={item.details}
                                onChange={(e) => setItem(i, { details: e.target.value })} />
                        </div>
                        <div className="flex gap-2 items-center">
                            <input className={inputCls} placeholder="Cena (tekst)" value={item.price}
                                onChange={(e) => setItem(i, { price: e.target.value })} />
                            <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                                <input type="checkbox" checked={item.isExtra}
                                    onChange={(e) => setItem(i, { isExtra: e.target.checked })} />
                                Opcja dodatkowa
                            </label>
                        </div>
                    </div>
                ))}
                <button type="button" onClick={() => set({ items: [...b.items, { label: '', details: '', price: '', isExtra: false }] })}
                    className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Plus className="w-3 h-3" /> Dodaj pozycję
                </button>
            </Field>
            <Field label="Etapy płatności">
                {b.paymentSteps.map((s, i) => (
                    <div key={i} className="rounded-xl border border-border p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground">Etap {i + 1}</span>
                            <button type="button" onClick={() => set({ paymentSteps: b.paymentSteps.filter((_, j) => j !== i) })}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <input type="number" className={inputCls} placeholder="%" value={s.percent}
                                onChange={(e) => setStep(i, { percent: Number(e.target.value) })} />
                            <input className={inputCls} placeholder="Etykieta" value={s.label}
                                onChange={(e) => setStep(i, { label: e.target.value })} />
                            <input className={inputCls} placeholder="Opis" value={s.description}
                                onChange={(e) => setStep(i, { description: e.target.value })} />
                        </div>
                    </div>
                ))}
                <button type="button" onClick={() => set({ paymentSteps: [...b.paymentSteps, { percent: 50, label: '', description: '' }] })}
                    className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Plus className="w-3 h-3" /> Dodaj etap płatności
                </button>
            </Field>
        </div>
    )
}

// ── Portfolio ─────────────────────────────────────────────────────────────────

export function PortfolioEditorV3({ blocks, onChange }: { blocks: WebsiteV3Blocks; onChange: (b: WebsiteV3Blocks) => void }) {
    const b = blocks.portfolio
    const set = (patch: Partial<typeof b>) => onChange({ ...blocks, portfolio: { ...b, ...patch } })
    const setItem = (i: number, patch: Partial<WV3PortfolioItem>) => {
        const items = [...b.items]; items[i] = { ...items[i], ...patch }; set({ items })
    }
    return (
        <div className="flex flex-col gap-4">
            <Field label="Tytuł sekcji">
                <input className={inputCls} value={b.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label="Link do portfolio (opcjonalny)">
                <input className={inputCls} placeholder="https://..." value={b.portfolioUrl}
                    onChange={(e) => set({ portfolioUrl: e.target.value })} />
            </Field>
            <Field label="Projekty">
                {b.items.map((item, i) => (
                    <div key={i} className="rounded-xl border border-border p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground">Projekt {i + 1}</span>
                            <button type="button" onClick={() => set({ items: b.items.filter((_, j) => j !== i) })}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <input className={inputCls} placeholder="Nazwa" value={item.name}
                                onChange={(e) => setItem(i, { name: e.target.value })} />
                            <input className={inputCls} placeholder="Branża" value={item.industry}
                                onChange={(e) => setItem(i, { industry: e.target.value })} />
                        </div>
                        <textarea className={textareaCls} placeholder="Opis" value={item.description}
                            onChange={(e) => setItem(i, { description: e.target.value })} />
                        <div className="grid grid-cols-2 gap-2">
                            <input className={inputCls} placeholder="Technologia" value={item.tech}
                                onChange={(e) => setItem(i, { tech: e.target.value })} />
                            <select className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                value={item.thumbColor}
                                onChange={(e) => setItem(i, { thumbColor: e.target.value })}>
                                <option value="violet">Fioletowy</option>
                                <option value="cyan">Niebieski</option>
                                <option value="dark">Ciemny</option>
                            </select>
                        </div>
                    </div>
                ))}
                <button type="button" onClick={() => set({ items: [...b.items, { name: '', industry: '', description: '', tech: '', thumbColor: 'violet' }] })}
                    className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Plus className="w-3 h-3" /> Dodaj projekt
                </button>
            </Field>
        </div>
    )
}

// ── Testimonials ──────────────────────────────────────────────────────────────

export function TestimonialsEditor({ blocks, onChange, offerContext }: { blocks: WebsiteV3Blocks; onChange: (b: WebsiteV3Blocks) => void; offerContext?: OfferContext }) {
    const b = blocks.testimonials
    const set = (patch: Partial<typeof b>) => onChange({ ...blocks, testimonials: { ...b, ...patch } })
    const setItem = (i: number, patch: Partial<WV3Testimonial>) => {
        const items = [...b.items]; items[i] = { ...items[i], ...patch }; set({ items })
    }
    return (
        <div className="flex flex-col gap-4">
            <AiGenerateButton
                sectionKey="website_v3.testimonials"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    testimonials: {
                        ...blocks.testimonials,
                        items: Array.isArray(data.items) ? data.items as WV3Testimonial[] : blocks.testimonials.items,
                    },
                })}
            />
            <Field label="Tytuł sekcji">
                <input className={inputCls} value={b.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            {b.items.map((t, i) => (
                <div key={i} className="rounded-xl border border-border p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground">Opinia {i + 1}</span>
                        <button type="button" onClick={() => set({ items: b.items.filter((_, j) => j !== i) })}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                    </div>
                    <textarea className={textareaCls} placeholder="Cytat" value={t.quote}
                        onChange={(e) => setItem(i, { quote: e.target.value })} />
                    <div className="grid grid-cols-3 gap-2">
                        <input className={inputCls} placeholder="Inicjały" value={t.initials}
                            onChange={(e) => setItem(i, { initials: e.target.value })} />
                        <input className={inputCls} placeholder="Imię Nazwisko" value={t.name}
                            onChange={(e) => setItem(i, { name: e.target.value })} />
                        <input className={inputCls} placeholder="Stanowisko, Firma" value={t.position}
                            onChange={(e) => setItem(i, { position: e.target.value })} />
                    </div>
                </div>
            ))}
            <button type="button" onClick={() => set({ items: [...b.items, { quote: '', initials: '', name: '', position: '' }] })}
                className="flex items-center gap-1 text-xs text-primary font-medium">
                <Plus className="w-3 h-3" /> Dodaj opinię
            </button>
        </div>
    )
}

// ── About ─────────────────────────────────────────────────────────────────────

export function AboutEditorV3({ blocks, onChange, offerContext }: { blocks: WebsiteV3Blocks; onChange: (b: WebsiteV3Blocks) => void; offerContext?: OfferContext }) {
    const b = blocks.about
    const set = (patch: Partial<typeof b>) => onChange({ ...blocks, about: { ...b, ...patch } })
    const setStat = (i: number, patch: Partial<WV3Stat>) => {
        const stats = [...b.stats]; stats[i] = { ...stats[i], ...patch }; set({ stats })
    }
    return (
        <div className="flex flex-col gap-4">
            <AiGenerateButton
                sectionKey="website_v3.about"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    about: {
                        ...blocks.about,
                        bio1: (data.bio1 as string) || blocks.about.bio1,
                        bio2: (data.bio2 as string) || blocks.about.bio2,
                        stats: Array.isArray(data.stats) ? data.stats as WV3Stat[] : blocks.about.stats,
                    },
                })}
            />
            <Field label="Tytuł sekcji">
                <input className={inputCls} value={b.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label="Bio (akapit 1)">
                <textarea className={textareaCls} value={b.bio1} onChange={(e) => set({ bio1: e.target.value })} />
            </Field>
            <Field label="Bio (akapit 2)">
                <textarea className={textareaCls} value={b.bio2} onChange={(e) => set({ bio2: e.target.value })} />
            </Field>
            <Field label="Statystyki">
                {b.stats.map((s, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <input className={inputCls} placeholder="Wartość" value={s.value}
                            onChange={(e) => setStat(i, { value: e.target.value })} />
                        <input className={inputCls} placeholder="Etykieta" value={s.label}
                            onChange={(e) => setStat(i, { label: e.target.value })} />
                        <button type="button" onClick={() => set({ stats: b.stats.filter((_, j) => j !== i) })}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => set({ stats: [...b.stats, { value: '', label: '' }] })}
                    className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Plus className="w-3 h-3" /> Dodaj statystykę
                </button>
            </Field>
        </div>
    )
}

// ── Stack ─────────────────────────────────────────────────────────────────────

export function StackEditor({ blocks, onChange }: { blocks: WebsiteV3Blocks; onChange: (b: WebsiteV3Blocks) => void }) {
    const b = blocks.stack
    const set = (patch: Partial<typeof b>) => onChange({ ...blocks, stack: { ...b, ...patch } })
    return (
        <div className="flex flex-col gap-4">
            <Field label="Tytuł sekcji">
                <input className={inputCls} value={b.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label="Technologie">
                {b.technologies.map((t, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <input className={inputCls} value={t} onChange={(e) => {
                            const techs = [...b.technologies]; techs[i] = e.target.value; set({ technologies: techs })
                        }} />
                        <button type="button" onClick={() => set({ technologies: b.technologies.filter((_, j) => j !== i) })}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => set({ technologies: [...b.technologies, ''] })}
                    className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Plus className="w-3 h-3" /> Dodaj technologię
                </button>
            </Field>
        </div>
    )
}

// ── Terms ─────────────────────────────────────────────────────────────────────

export function TermsEditor({ blocks, onChange, offerContext }: { blocks: WebsiteV3Blocks; onChange: (b: WebsiteV3Blocks) => void; offerContext?: OfferContext }) {
    const b = blocks.terms
    const set = (patch: Partial<typeof b>) => onChange({ ...blocks, terms: { ...b, ...patch } })
    const setGuarantee = (i: number, patch: Partial<WV3Guarantee>) => {
        const guarantees = [...b.guarantees]; guarantees[i] = { ...guarantees[i], ...patch }; set({ guarantees })
    }
    return (
        <div className="flex flex-col gap-4">
            <AiGenerateButton
                sectionKey="website_v3.terms"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    terms: {
                        ...blocks.terms,
                        guarantees: Array.isArray(data.guarantees) ? data.guarantees as WV3Guarantee[] : blocks.terms.guarantees,
                    },
                })}
            />
            <Field label="Tytuł sekcji">
                <input className={inputCls} value={b.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label="Gwarancje">
                {b.guarantees.map((g, i) => (
                    <div key={i} className="rounded-xl border border-border p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground">Gwarancja {i + 1}</span>
                            <button type="button" onClick={() => set({ guarantees: b.guarantees.filter((_, j) => j !== i) })}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <input className={inputCls} placeholder="Emoji" style={{ maxWidth: 72 }} value={g.emoji}
                                onChange={(e) => setGuarantee(i, { emoji: e.target.value })} />
                            <input className={inputCls} placeholder="Tytuł" value={g.title}
                                onChange={(e) => setGuarantee(i, { title: e.target.value })} />
                        </div>
                        <textarea className={textareaCls} placeholder="Opis" value={g.description}
                            onChange={(e) => setGuarantee(i, { description: e.target.value })} />
                    </div>
                ))}
                <button type="button" onClick={() => set({ guarantees: [...b.guarantees, { emoji: '✅', title: '', description: '' }] })}
                    className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Plus className="w-3 h-3" /> Dodaj gwarancję
                </button>
            </Field>
            <Field label="Warunki płatności">
                <input className={inputCls} value={b.paymentTerms} onChange={(e) => set({ paymentTerms: e.target.value })} />
            </Field>
            <Field label="Forma umowy">
                <input className={inputCls} value={b.contractForm} onChange={(e) => set({ contractForm: e.target.value })} />
            </Field>
            <Field label="Prawa autorskie">
                <textarea className={textareaCls} value={b.copyrightTerms} onChange={(e) => set({ copyrightTerms: e.target.value })} />
            </Field>
        </div>
    )
}
