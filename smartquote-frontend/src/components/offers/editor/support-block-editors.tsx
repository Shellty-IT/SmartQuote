// src/components/offers/editor/support-block-editors.tsx
// Per-block editor panels for the "Wsparcie" (IT Support / SLA) template.
'use client'

import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
    SupportCoverBlock,
    SupportBenefitsBlock,
    SupportPackagesBlock,
    SupportScopeBlock,
    SupportSlaBlock,
    SupportProcessBlock,
    SupportPricingBlock,
    SupportFooterBlock,
    SupportPlan,
    SupportSlaRow,
} from '@/lib/pdf/support-blocks'
import { AiGenerateButton, type OfferContext } from './block-editors'

// ── Shared primitives ─────────────────────────────────────────────────────────

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

function Row2({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-2 gap-2 mb-3">{children}</div>
}

function SectionDivider({ label }: { label: string }) {
    return (
        <div className="mt-4 mb-3 border-t border-border pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        </div>
    )
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="mt-2 flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/60 hover:text-primary transition-colors"
        >
            <Plus className="h-3.5 w-3.5" />{label}
        </button>
    )
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="mt-1 self-start rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
            <Trash2 className="h-3.5 w-3.5" />
        </button>
    )
}

// ── Cover editor ──────────────────────────────────────────────────────────────

export function CoverEditorSupport({
    block,
    onChange,
}: {
    block: SupportCoverBlock
    onChange: (b: SupportCoverBlock) => void
}) {
    const upd = (patch: Partial<SupportCoverBlock>) => onChange({ ...block, ...patch })
    return (
        <div>
            <Field label="Tagline (mały napis nad tytułem)">
                <input className={inputCls} value={block.heroTagline} onChange={(e) => upd({ heroTagline: e.target.value })} />
            </Field>
            <Field label="Tytuł (H1, pierwsza linia)">
                <input className={inputCls} value={block.heroTitle} onChange={(e) => upd({ heroTitle: e.target.value })} />
            </Field>
            <Field label="Podtytuł">
                <textarea className={textareaCls} value={block.heroSubtitle} onChange={(e) => upd({ heroSubtitle: e.target.value })} />
            </Field>
            <Field label="Strona www (np. www.firma.pl)">
                <input className={inputCls} value={block.websiteUrl} onChange={(e) => upd({ websiteUrl: e.target.value })} />
            </Field>
            <Field label="Ważność oferty (dni)">
                <input
                    type="number"
                    min={1}
                    className={inputCls}
                    value={block.validityDays}
                    onChange={(e) => upd({ validityDays: Number(e.target.value) })}
                />
            </Field>

            <SectionDivider label="Pillsy (tagi pod monitorem)" />
            {block.pills.map((pill, i) => (
                <div key={i} className="mb-2 flex gap-2">
                    <input
                        className={cn(inputCls, 'flex-1')}
                        value={pill}
                        onChange={(e) => {
                            const next = [...block.pills]
                            next[i] = e.target.value
                            upd({ pills: next })
                        }}
                    />
                    <RemoveBtn onClick={() => upd({ pills: block.pills.filter((_, j) => j !== i) })} />
                </div>
            ))}
            <AddBtn onClick={() => upd({ pills: [...block.pills, ''] })} label="Dodaj pill" />

            <SectionDivider label="Monitor — wiersze statusu" />
            {block.monitorRows.map((row, i) => (
                <div key={i} className="mb-2 flex gap-2">
                    <input
                        className={cn(inputCls, 'flex-1')}
                        value={row.label}
                        placeholder="Etykieta"
                        onChange={(e) => {
                            const next = [...block.monitorRows]
                            next[i] = { ...next[i], label: e.target.value }
                            upd({ monitorRows: next })
                        }}
                    />
                    <input
                        className={cn(inputCls, 'w-28')}
                        value={row.status}
                        placeholder="Status"
                        onChange={(e) => {
                            const next = [...block.monitorRows]
                            next[i] = { ...next[i], status: e.target.value }
                            upd({ monitorRows: next })
                        }}
                    />
                    <RemoveBtn onClick={() => upd({ monitorRows: block.monitorRows.filter((_, j) => j !== i) })} />
                </div>
            ))}
            <AddBtn onClick={() => upd({ monitorRows: [...block.monitorRows, { label: '', status: 'ONLINE' }] })} label="Dodaj wiersz" />

            <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
                💡 <strong>Logo</strong> pochodzi z <em>Ustawień firmy</em>. <strong>Numer oferty</strong> i <strong>data</strong> generowane automatycznie.
            </div>
        </div>
    )
}

// ── Benefits editor ───────────────────────────────────────────────────────────

export function BenefitsEditor({
    block,
    onChange,
    offerContext,
}: {
    block: SupportBenefitsBlock
    onChange: (b: SupportBenefitsBlock) => void
    offerContext?: OfferContext
}) {
    const upd = (patch: Partial<SupportBenefitsBlock>) => onChange({ ...block, ...patch })
    return (
        <div>
            <AiGenerateButton
                sectionKey="support.benefits"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...block,
                    withoutItems: Array.isArray(data.withoutItems) ? data.withoutItems as SupportBenefitsBlock['withoutItems'] : block.withoutItems,
                    withItems: Array.isArray(data.withItems) ? data.withItems as SupportBenefitsBlock['withItems'] : block.withItems,
                    quote: (data.quote as string) || block.quote,
                })}
            />
            <Field label="Tytuł sekcji">
                <input className={inputCls} value={block.sectionTitle} onChange={(e) => upd({ sectionTitle: e.target.value })} />
            </Field>
            <Field label="Lead">
                <input className={inputCls} value={block.sectionLead} onChange={(e) => upd({ sectionLead: e.target.value })} />
            </Field>
            <Field label="Cytat (box na dole)">
                <textarea className={textareaCls} value={block.quote} onChange={(e) => upd({ quote: e.target.value })} />
            </Field>

            <SectionDivider label="Lewa kolumna (bez opieki)" />
            <Field label="Nagłówek kolumny">
                <input className={inputCls} value={block.withoutTitle} onChange={(e) => upd({ withoutTitle: e.target.value })} />
            </Field>
            {block.withoutItems.map((item, i) => (
                <div key={i} className="mb-3 rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Problem {i + 1}</span>
                        <RemoveBtn onClick={() => upd({ withoutItems: block.withoutItems.filter((_, j) => j !== i) })} />
                    </div>
                    <Field label="Tytuł">
                        <input
                            className={inputCls}
                            value={item.title}
                            onChange={(e) => {
                                const next = [...block.withoutItems]
                                next[i] = { ...next[i], title: e.target.value }
                                upd({ withoutItems: next })
                            }}
                        />
                    </Field>
                    <Field label="Opis">
                        <textarea
                            className={textareaCls}
                            value={item.description}
                            onChange={(e) => {
                                const next = [...block.withoutItems]
                                next[i] = { ...next[i], description: e.target.value }
                                upd({ withoutItems: next })
                            }}
                        />
                    </Field>
                </div>
            ))}
            <AddBtn onClick={() => upd({ withoutItems: [...block.withoutItems, { title: '', description: '' }] })} label="Dodaj problem" />

            <SectionDivider label="Prawa kolumna (z opieką)" />
            <Field label="Nagłówek kolumny">
                <input className={inputCls} value={block.withTitle} onChange={(e) => upd({ withTitle: e.target.value })} />
            </Field>
            {block.withItems.map((item, i) => (
                <div key={i} className="mb-3 rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Korzyść {i + 1}</span>
                        <RemoveBtn onClick={() => upd({ withItems: block.withItems.filter((_, j) => j !== i) })} />
                    </div>
                    <Field label="Tytuł">
                        <input
                            className={inputCls}
                            value={item.title}
                            onChange={(e) => {
                                const next = [...block.withItems]
                                next[i] = { ...next[i], title: e.target.value }
                                upd({ withItems: next })
                            }}
                        />
                    </Field>
                    <Field label="Opis">
                        <textarea
                            className={textareaCls}
                            value={item.description}
                            onChange={(e) => {
                                const next = [...block.withItems]
                                next[i] = { ...next[i], description: e.target.value }
                                upd({ withItems: next })
                            }}
                        />
                    </Field>
                </div>
            ))}
            <AddBtn onClick={() => upd({ withItems: [...block.withItems, { title: '', description: '' }] })} label="Dodaj korzyść" />
        </div>
    )
}

// ── Packages editor ───────────────────────────────────────────────────────────

function PlanEditor({
    plan,
    onChange,
    onRemove,
    index,
}: {
    plan: SupportPlan
    onChange: (p: SupportPlan) => void
    onRemove?: () => void
    index: number
}) {
    const upd = (patch: Partial<SupportPlan>) => onChange({ ...plan, ...patch })
    return (
        <div className="mb-4 rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Pakiet {index + 1}</span>
                <div className="flex items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                        <input
                            type="checkbox"
                            checked={plan.highlighted}
                            onChange={(e) => upd({ highlighted: e.target.checked })}
                            className="rounded"
                        />
                        Wyróżniony
                    </label>
                    {onRemove && <RemoveBtn onClick={onRemove} />}
                </div>
            </div>
            <Row2>
                <Field label="Nazwa">
                    <input className={inputCls} value={plan.name} onChange={(e) => upd({ name: e.target.value })} />
                </Field>
                <Field label="Cena">
                    <input className={inputCls} value={plan.price} placeholder="XXX zł / mies." onChange={(e) => upd({ price: e.target.value })} />
                </Field>
            </Row2>
            <Field label="Tagline">
                <input className={inputCls} value={plan.tagline} onChange={(e) => upd({ tagline: e.target.value })} />
            </Field>
            <Field label="Etykieta przycisku CTA">
                <input className={inputCls} value={plan.ctaLabel} onChange={(e) => upd({ ctaLabel: e.target.value })} />
            </Field>

            <p className={labelCls}>Funkcje (lista)</p>
            {plan.features.map((feat, fi) => (
                <div key={fi} className="mb-1.5 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            const next = [...plan.features]
                            next[fi] = { ...next[fi], included: !next[fi].included }
                            upd({ features: next })
                        }}
                        className={cn(
                            'flex-none rounded px-1.5 py-0.5 text-xs font-semibold',
                            feat.included ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground',
                        )}
                    >
                        {feat.included ? '✓' : '—'}
                    </button>
                    <input
                        className={cn(inputCls, 'flex-1 py-1.5')}
                        value={feat.label}
                        onChange={(e) => {
                            const next = [...plan.features]
                            next[fi] = { ...next[fi], label: e.target.value }
                            upd({ features: next })
                        }}
                    />
                    <RemoveBtn onClick={() => upd({ features: plan.features.filter((_, j) => j !== fi) })} />
                </div>
            ))}
            <AddBtn onClick={() => upd({ features: [...plan.features, { label: '', included: true }] })} label="Dodaj funkcję" />
        </div>
    )
}

export function PackagesEditor({
    block,
    onChange,
}: {
    block: SupportPackagesBlock
    onChange: (b: SupportPackagesBlock) => void
}) {
    const upd = (patch: Partial<SupportPackagesBlock>) => onChange({ ...block, ...patch })
    return (
        <div>
            <Field label="Tytuł sekcji">
                <input className={inputCls} value={block.sectionTitle} onChange={(e) => upd({ sectionTitle: e.target.value })} />
            </Field>
            <Field label="Lead">
                <input className={inputCls} value={block.sectionLead} onChange={(e) => upd({ sectionLead: e.target.value })} />
            </Field>
            <Field label="Email kontaktowy (pod tabelą pakietów)">
                <input className={inputCls} value={block.contactEmail} onChange={(e) => upd({ contactEmail: e.target.value })} />
            </Field>

            <SectionDivider label="Pakiety" />
            {block.plans.map((plan, i) => (
                <PlanEditor
                    key={i}
                    index={i}
                    plan={plan}
                    onChange={(p) => {
                        const next = [...block.plans]
                        next[i] = p
                        upd({ plans: next })
                    }}
                    onRemove={block.plans.length > 1 ? () => upd({ plans: block.plans.filter((_, j) => j !== i) }) : undefined}
                />
            ))}
            <AddBtn
                onClick={() =>
                    upd({
                        plans: [
                            ...block.plans,
                            { name: 'NOWY', tagline: '', price: '', ctaLabel: 'Wybierz', highlighted: false, features: [] },
                        ],
                    })
                }
                label="Dodaj pakiet"
            />
        </div>
    )
}

// ── Scope editor ──────────────────────────────────────────────────────────────

export function ScopeEditor({
    block,
    onChange,
    offerContext,
}: {
    block: SupportScopeBlock
    onChange: (b: SupportScopeBlock) => void
    offerContext?: OfferContext
}) {
    const upd = (patch: Partial<SupportScopeBlock>) => onChange({ ...block, ...patch })
    return (
        <div>
            <AiGenerateButton
                sectionKey="support.scope"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...block,
                    included: Array.isArray(data.included) ? data.included as SupportScopeBlock['included'] : block.included,
                    excluded: Array.isArray(data.excluded) ? data.excluded as SupportScopeBlock['excluded'] : block.excluded,
                })}
            />
            <Field label="Tytuł sekcji">
                <input className={inputCls} value={block.sectionTitle} onChange={(e) => upd({ sectionTitle: e.target.value })} />
            </Field>
            <Field label="Lead">
                <input className={inputCls} value={block.sectionLead} onChange={(e) => upd({ sectionLead: e.target.value })} />
            </Field>

            <SectionDivider label="Objęte opieką" />
            <Field label="Nagłówek kolumny">
                <input className={inputCls} value={block.includedTitle} onChange={(e) => upd({ includedTitle: e.target.value })} />
            </Field>
            {block.included.map((item, i) => (
                <div key={i} className="mb-3 rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Usługa {i + 1}</span>
                        <RemoveBtn onClick={() => upd({ included: block.included.filter((_, j) => j !== i) })} />
                    </div>
                    <Field label="Tytuł">
                        <input
                            className={inputCls}
                            value={item.title}
                            onChange={(e) => {
                                const next = [...block.included]; next[i] = { ...next[i], title: e.target.value }
                                upd({ included: next })
                            }}
                        />
                    </Field>
                    <Field label="Opis">
                        <input
                            className={inputCls}
                            value={item.description}
                            onChange={(e) => {
                                const next = [...block.included]; next[i] = { ...next[i], description: e.target.value }
                                upd({ included: next })
                            }}
                        />
                    </Field>
                </div>
            ))}
            <AddBtn onClick={() => upd({ included: [...block.included, { title: '', description: '' }] })} label="Dodaj usługę" />

            <SectionDivider label="Poza zakresem" />
            <Field label="Nagłówek kolumny">
                <input className={inputCls} value={block.excludedTitle} onChange={(e) => upd({ excludedTitle: e.target.value })} />
            </Field>
            {block.excluded.map((item, i) => (
                <div key={i} className="mb-3 rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Pozycja {i + 1}</span>
                        <RemoveBtn onClick={() => upd({ excluded: block.excluded.filter((_, j) => j !== i) })} />
                    </div>
                    <Field label="Tytuł">
                        <input
                            className={inputCls}
                            value={item.title}
                            onChange={(e) => {
                                const next = [...block.excluded]; next[i] = { ...next[i], title: e.target.value }
                                upd({ excluded: next })
                            }}
                        />
                    </Field>
                    <Field label="Opis">
                        <input
                            className={inputCls}
                            value={item.description}
                            onChange={(e) => {
                                const next = [...block.excluded]; next[i] = { ...next[i], description: e.target.value }
                                upd({ excluded: next })
                            }}
                        />
                    </Field>
                </div>
            ))}
            <AddBtn onClick={() => upd({ excluded: [...block.excluded, { title: '', description: '' }] })} label="Dodaj pozycję" />

            <SectionDivider label="Nota dodatkowa" />
            <Field label="Tekst noty (żółty box)">
                <textarea className={textareaCls} value={block.extraNote} onChange={(e) => upd({ extraNote: e.target.value })} />
            </Field>
        </div>
    )
}

// ── SLA editor ────────────────────────────────────────────────────────────────

const SLA_COLOR_OPTIONS = [
    { value: 'critical', label: '🔴 Krytyczny' },
    { value: 'high', label: '🟠 Wysoki' },
    { value: 'medium', label: '🟡 Średni' },
    { value: 'low', label: '🟢 Niski' },
] as const

export function SlaEditor({
    block,
    onChange,
}: {
    block: SupportSlaBlock
    onChange: (b: SupportSlaBlock) => void
}) {
    const upd = (patch: Partial<SupportSlaBlock>) => onChange({ ...block, ...patch })

    const updateRow = (i: number, patch: Partial<SupportSlaRow>) => {
        const next = [...block.rows]
        next[i] = { ...next[i], ...patch }
        upd({ rows: next })
    }

    return (
        <div>
            <Field label="Tytuł sekcji">
                <input className={inputCls} value={block.sectionTitle} onChange={(e) => upd({ sectionTitle: e.target.value })} />
            </Field>
            <Field label="Lead">
                <textarea className={textareaCls} value={block.sectionLead} onChange={(e) => upd({ sectionLead: e.target.value })} />
            </Field>

            <SectionDivider label="Priorytety (karty + tabela)" />
            {block.rows.map((row, i) => (
                <div key={i} className="mb-4 rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">{row.icon} {row.priority}</span>
                        {block.rows.length > 1 && <RemoveBtn onClick={() => upd({ rows: block.rows.filter((_, j) => j !== i) })} />}
                    </div>
                    <Row2>
                        <Field label="Emoji">
                            <input className={inputCls} value={row.icon} onChange={(e) => updateRow(i, { icon: e.target.value })} />
                        </Field>
                        <Field label="Nazwa">
                            <input className={inputCls} value={row.priority} onChange={(e) => updateRow(i, { priority: e.target.value })} />
                        </Field>
                    </Row2>
                    <Field label="Kolor (klasa)">
                        <select className={inputCls} value={row.colorClass} onChange={(e) => updateRow(i, { colorClass: e.target.value as SupportSlaRow['colorClass'] })}>
                            {SLA_COLOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </Field>
                    <Field label="Opis">
                        <textarea className={textareaCls} value={row.description} onChange={(e) => updateRow(i, { description: e.target.value })} />
                    </Field>
                    <Field label="Przykłady">
                        <input className={inputCls} value={row.examples} onChange={(e) => updateRow(i, { examples: e.target.value })} />
                    </Field>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Czasy reakcji</p>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        {(['basic', 'standard', 'premium'] as const).map(pkg => (
                            <div key={pkg}>
                                <label className={labelCls}>{pkg.charAt(0).toUpperCase() + pkg.slice(1)}</label>
                                <input
                                    className={inputCls}
                                    value={row[pkg]}
                                    placeholder="4 godz."
                                    onChange={(e) => updateRow(i, { [pkg]: e.target.value })}
                                />
                            </div>
                        ))}
                    </div>
                    <Field label="Cel rozwiązania">
                        <input className={inputCls} value={row.resolution} onChange={(e) => updateRow(i, { resolution: e.target.value })} />
                    </Field>
                </div>
            ))}
            <AddBtn
                onClick={() =>
                    upd({
                        rows: [...block.rows, {
                            priority: 'Nowy', icon: '🔵', colorClass: 'low',
                            description: '', examples: '',
                            basic: '', standard: '', premium: '', resolution: '',
                        }],
                    })
                }
                label="Dodaj priorytet"
            />

            <SectionDivider label="Noty" />
            <Field label="Nota pod tabelą (szary tekst)">
                <input className={inputCls} value={block.footnote} onChange={(e) => upd({ footnote: e.target.value })} />
            </Field>
            <Field label="Nota godzin pracy (niebieski box)">
                <textarea className={textareaCls} value={block.workingHoursNote} onChange={(e) => upd({ workingHoursNote: e.target.value })} />
            </Field>
        </div>
    )
}

// ── Process editor ────────────────────────────────────────────────────────────

export function ProcessEditor({
    block,
    onChange,
    offerContext,
}: {
    block: SupportProcessBlock
    onChange: (b: SupportProcessBlock) => void
    offerContext?: OfferContext
}) {
    const upd = (patch: Partial<SupportProcessBlock>) => onChange({ ...block, ...patch })
    return (
        <div>
            <AiGenerateButton
                sectionKey="support.process"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...block,
                    steps: Array.isArray(data.steps) ? data.steps as SupportProcessBlock['steps'] : block.steps,
                })}
            />
            <Field label="Tytuł sekcji">
                <input className={inputCls} value={block.sectionTitle} onChange={(e) => upd({ sectionTitle: e.target.value })} />
            </Field>

            <SectionDivider label="Kroki procesu" />
            {block.steps.map((step, i) => (
                <div key={i} className="mb-3 rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Krok {i + 1}</span>
                        {block.steps.length > 1 && <RemoveBtn onClick={() => upd({ steps: block.steps.filter((_, j) => j !== i) })} />}
                    </div>
                    <Row2>
                        <Field label="Emoji">
                            <input
                                className={inputCls}
                                value={step.emoji}
                                onChange={(e) => {
                                    const next = [...block.steps]; next[i] = { ...next[i], emoji: e.target.value }
                                    upd({ steps: next })
                                }}
                            />
                        </Field>
                        <Field label="Tytuł">
                            <input
                                className={inputCls}
                                value={step.title}
                                onChange={(e) => {
                                    const next = [...block.steps]; next[i] = { ...next[i], title: e.target.value }
                                    upd({ steps: next })
                                }}
                            />
                        </Field>
                    </Row2>
                    <Field label="Opis">
                        <textarea
                            className={textareaCls}
                            value={step.description}
                            onChange={(e) => {
                                const next = [...block.steps]; next[i] = { ...next[i], description: e.target.value }
                                upd({ steps: next })
                            }}
                        />
                    </Field>
                </div>
            ))}
            <AddBtn onClick={() => upd({ steps: [...block.steps, { emoji: '📌', title: '', description: '' }] })} label="Dodaj krok" />

            <SectionDivider label="Dane kontaktowe (krok 1)" />
            <Field label="Email zgłoszeń">
                <input className={inputCls} value={block.contactEmail} onChange={(e) => upd({ contactEmail: e.target.value })} />
            </Field>
            <Field label="Telefon">
                <input className={inputCls} value={block.contactPhone} onChange={(e) => upd({ contactPhone: e.target.value })} />
            </Field>
            <Field label="Link do formularza">
                <input className={inputCls} value={block.contactFormUrl} onChange={(e) => upd({ contactFormUrl: e.target.value })} />
            </Field>

            <SectionDivider label="Kanały zgłoszeń (tabela)" />
            {block.channels.map((ch, i) => (
                <div key={i} className="mb-2 flex gap-2">
                    <input
                        className={cn(inputCls, 'flex-1')}
                        value={ch.name}
                        placeholder="Kanał"
                        onChange={(e) => {
                            const next = [...block.channels]; next[i] = { ...next[i], name: e.target.value }
                            upd({ channels: next })
                        }}
                    />
                    <input
                        className={cn(inputCls, 'w-20')}
                        value={ch.availability}
                        placeholder="24/7"
                        onChange={(e) => {
                            const next = [...block.channels]; next[i] = { ...next[i], availability: e.target.value }
                            upd({ channels: next })
                        }}
                    />
                    <input
                        className={cn(inputCls, 'w-24')}
                        value={ch.priority}
                        placeholder="Wszystkie"
                        onChange={(e) => {
                            const next = [...block.channels]; next[i] = { ...next[i], priority: e.target.value }
                            upd({ channels: next })
                        }}
                    />
                    <RemoveBtn onClick={() => upd({ channels: block.channels.filter((_, j) => j !== i) })} />
                </div>
            ))}
            <AddBtn onClick={() => upd({ channels: [...block.channels, { name: '', availability: '', priority: '' }] })} label="Dodaj kanał" />
            <Field label="Nota pod tabelą kanałów">
                <textarea className={textareaCls} value={block.channelsNote} onChange={(e) => upd({ channelsNote: e.target.value })} />
            </Field>
        </div>
    )
}

// ── Pricing editor ────────────────────────────────────────────────────────────

export function PricingEditor({
    block,
    onChange,
}: {
    block: SupportPricingBlock
    onChange: (b: SupportPricingBlock) => void
}) {
    const upd = (patch: Partial<SupportPricingBlock>) => onChange({ ...block, ...patch })
    const pkgKeys = ['basicPricing', 'standardPricing', 'premiumPricing'] as const
    const pkgLabels = ['Basic', 'Standard', 'Premium']

    return (
        <div>
            <Field label="Tytuł sekcji">
                <input className={inputCls} value={block.sectionTitle} onChange={(e) => upd({ sectionTitle: e.target.value })} />
            </Field>
            <Field label="Dzień wystawienia faktury">
                <input className={inputCls} value={block.invoiceDay} placeholder="1" onChange={(e) => upd({ invoiceDay: e.target.value })} />
            </Field>

            <SectionDivider label="7A — Zestawienie cen" />
            {pkgKeys.map((key, ki) => (
                <div key={key} className="mb-4 rounded-lg border border-border p-3">
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">{pkgLabels[ki]}</p>
                    <Row2>
                        <Field label="Cena miesięczna">
                            <input className={inputCls} value={block[key].monthlyPrice} placeholder="XXX zł" onChange={(e) => upd({ [key]: { ...block[key], monthlyPrice: e.target.value } })} />
                        </Field>
                        <Field label="Godziny w puli">
                            <input className={inputCls} value={block[key].hours} placeholder="X h" onChange={(e) => upd({ [key]: { ...block[key], hours: e.target.value } })} />
                        </Field>
                    </Row2>
                    <Row2>
                        <Field label="Dodatkowa godzina">
                            <input className={inputCls} value={block[key].extraHourRate} placeholder="XX zł" onChange={(e) => upd({ [key]: { ...block[key], extraHourRate: e.target.value } })} />
                        </Field>
                        <Field label="Okres wypowiedzenia">
                            <input className={inputCls} value={block[key].noticePeriod} placeholder="30 dni" onChange={(e) => upd({ [key]: { ...block[key], noticePeriod: e.target.value } })} />
                        </Field>
                    </Row2>
                    <label className="flex cursor-pointer items-center gap-2 text-xs">
                        <input
                            type="checkbox"
                            checked={block[key].weekendAvailability}
                            onChange={(e) => upd({ [key]: { ...block[key], weekendAvailability: e.target.checked } })}
                            className="rounded"
                        />
                        Dostępność weekendowa
                    </label>
                </div>
            ))}

            <SectionDivider label="7B — Warunki umowy" />
            {block.terms.map((term, i) => (
                <div key={i} className="mb-2 flex gap-2">
                    <input
                        className={cn(inputCls, 'w-10 text-center')}
                        value={term.icon}
                        onChange={(e) => {
                            const next = [...block.terms]; next[i] = { ...next[i], icon: e.target.value }
                            upd({ terms: next })
                        }}
                    />
                    <input
                        className={cn(inputCls, 'w-36')}
                        value={term.title}
                        placeholder="Tytuł"
                        onChange={(e) => {
                            const next = [...block.terms]; next[i] = { ...next[i], title: e.target.value }
                            upd({ terms: next })
                        }}
                    />
                    <input
                        className={cn(inputCls, 'flex-1')}
                        value={term.value}
                        placeholder="Wartość"
                        onChange={(e) => {
                            const next = [...block.terms]; next[i] = { ...next[i], value: e.target.value }
                            upd({ terms: next })
                        }}
                    />
                    <RemoveBtn onClick={() => upd({ terms: block.terms.filter((_, j) => j !== i) })} />
                </div>
            ))}
            <AddBtn onClick={() => upd({ terms: [...block.terms, { icon: '📋', title: '', value: '' }] })} label="Dodaj warunek" />

            <SectionDivider label="7C — Raport miesięczny" />
            {block.reportItems.map((item, i) => (
                <div key={i} className="mb-2 flex gap-2">
                    <input
                        className={cn(inputCls, 'flex-1')}
                        value={item}
                        onChange={(e) => {
                            const next = [...block.reportItems]; next[i] = e.target.value
                            upd({ reportItems: next })
                        }}
                    />
                    <RemoveBtn onClick={() => upd({ reportItems: block.reportItems.filter((_, j) => j !== i) })} />
                </div>
            ))}
            <AddBtn onClick={() => upd({ reportItems: [...block.reportItems, ''] })} label="Dodaj pozycję" />
            <Row2>
                <Field label="Dzień wysyłki raportu">
                    <input className={inputCls} value={block.reportDay} onChange={(e) => upd({ reportDay: e.target.value })} />
                </Field>
                <Field label="Email raportu">
                    <input className={inputCls} value={block.reportEmail} onChange={(e) => upd({ reportEmail: e.target.value })} />
                </Field>
            </Row2>
        </div>
    )
}

// ── Footer editor ─────────────────────────────────────────────────────────────

export function FooterEditorSupport({
    block,
    onChange,
}: {
    block: SupportFooterBlock
    onChange: (b: SupportFooterBlock) => void
}) {
    const upd = (patch: Partial<SupportFooterBlock>) => onChange({ ...block, ...patch })
    return (
        <div>
            <Field label="Nagłówek CTA">
                <textarea className={textareaCls} value={block.ctaHeadline} onChange={(e) => upd({ ctaHeadline: e.target.value })} />
            </Field>
            <Field label="Tekst pod nagłówkiem">
                <textarea className={textareaCls} value={block.ctaLead} onChange={(e) => upd({ ctaLead: e.target.value })} />
            </Field>
            <Field label="Etykieta przycisku">
                <input className={inputCls} value={block.ctaButtonLabel} onChange={(e) => upd({ ctaButtonLabel: e.target.value })} />
            </Field>
            <Row2>
                <Field label="Data startu">
                    <input className={inputCls} value={block.startDate} placeholder="np. 2026-07-01" onChange={(e) => upd({ startDate: e.target.value })} />
                </Field>
                <Field label="Data ważności oferty">
                    <input className={inputCls} value={block.validityDate ?? ''} placeholder="np. 2026-07-13" onChange={(e) => upd({ validityDate: e.target.value })} />
                </Field>
            </Row2>

            <SectionDivider label="Kontakt (stopka)" />
            <Field label="Email kontaktowy">
                <input className={inputCls} value={block.contactEmail} onChange={(e) => upd({ contactEmail: e.target.value })} />
            </Field>
            <Field label="Telefon">
                <input className={inputCls} value={block.contactPhone} onChange={(e) => upd({ contactPhone: e.target.value })} />
            </Field>
            <Field label="Strona www">
                <input className={inputCls} value={block.websiteUrl} onChange={(e) => upd({ websiteUrl: e.target.value })} />
            </Field>
            <Field label="Tagline firmy">
                <textarea className={textareaCls} value={block.companyTagline} onChange={(e) => upd({ companyTagline: e.target.value })} />
            </Field>

            <SectionDivider label="Wybrany pakiet" />
            <Row2>
                <Field label="Nazwa pakietu">
                    <input className={inputCls} value={block.selectedPackageName} onChange={(e) => upd({ selectedPackageName: e.target.value })} />
                </Field>
                <Field label="Cena">
                    <input className={inputCls} value={block.selectedPackagePrice} placeholder="XXX zł" onChange={(e) => upd({ selectedPackagePrice: e.target.value })} />
                </Field>
            </Row2>
        </div>
    )
}
