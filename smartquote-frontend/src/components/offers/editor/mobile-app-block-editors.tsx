// src/components/offers/editor/mobile-app-block-editors.tsx
// Per-block editor components for the "Aplikacja mobilna - zaawansowana" template.
'use client'

import { useCallback } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui'
import type {
    MobileAppBlocks,
    MobileAppBadgeStyle,
    MobileAppFeatureComplexity,
    MobileAppFeatureStatus,
    MobileAppBackendStatus,
} from '@/lib/pdf/mobile-app-blocks'
import { AiGenerateButton, type OfferContext } from './block-editors'

// ── Shared primitives ─────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            {children}
        </div>
    )
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <input
            className="w-full rounded border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
        />
    )
}

function TextArea({ value, onChange, rows = 3, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
    return (
        <textarea
            className="w-full rounded border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-y"
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={rows}
            placeholder={placeholder}
        />
    )
}

function NumberInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
    return (
        <Field label={label}>
            <input
                type="number"
                className="w-full rounded border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={value}
                onChange={e => onChange(Number(e.target.value))}
            />
        </Field>
    )
}

function SelectField<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
    return (
        <Field label={label}>
            <select
                className="w-full rounded border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={value}
                onChange={e => onChange(e.target.value as T)}
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </Field>
    )
}

function SectionHeader({ title }: { title: string }) {
    return <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-2 border-b pb-1">{title}</div>
}

// ── Cover ─────────────────────────────────────────────────────────────────────

export function CoverEditor({
    blocks,
    onChange,
}: {
    blocks: MobileAppBlocks
    onChange: (b: MobileAppBlocks) => void
}) {
    const b = blocks.cover
    const set = useCallback((partial: Partial<typeof b>) => onChange({ ...blocks, cover: { ...b, ...partial } }), [blocks, b, onChange])

    return (
        <div className="flex flex-col gap-3">
            <Field label="Etykieta nad tytułem"><TextInput value={b.eyebrow ?? ''} onChange={v => set({ eyebrow: v })} placeholder="Propozycja realizacji" /></Field>
            <Field label="Pierwsza linia tytułu"><TextInput value={b.titlePrefix ?? ''} onChange={v => set({ titlePrefix: v })} placeholder="Twoja aplikacja" /></Field>
            <Field label="Wyróżnione słowo w tytule"><TextInput value={b.titleAccent ?? ''} onChange={v => set({ titleAccent: v })} placeholder="mobilna" /></Field>
            <Field label="Nazwa projektu"><TextInput value={b.projectName} onChange={v => set({ projectName: v })} placeholder="Nazwa aplikacji" /></Field>
            <Field label="Klient (karta okładki)"><TextInput value={b.clientName} onChange={v => set({ clientName: v })} placeholder="Nazwa klienta" /></Field>
            <Field label="Pill platformy"><TextInput value={b.platformPill ?? ''} onChange={v => set({ platformPill: v })} placeholder="iOS + Android" /></Field>
            <Field label="MVP od (tygodnie)"><TextInput value={b.mvpWeeks} onChange={v => set({ mvpWeeks: v })} placeholder="8" /></Field>
            <Field label="Cena od (zł)"><TextInput value={b.priceFrom} onChange={v => set({ priceFrom: v })} placeholder="25 000" /></Field>
            <SectionHeader title="Obietnice (promise bar)" />
            {b.promises.map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                    <TextInput value={p} onChange={v => set({ promises: b.promises.map((x, j) => j === i ? v : x) })} placeholder={`Obietnica ${i + 1}`} />
                    <button type="button" onClick={() => set({ promises: b.promises.filter((_, j) => j !== i) })} className="text-destructive hover:text-destructive/80"><Trash2 className="w-4 h-4" /></button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set({ promises: [...b.promises, 'Nowa obietnica'] })}>
                <Plus className="w-4 h-4" /> Dodaj obietnicę
            </Button>
        </div>
    )
}

// ── Footer ────────────────────────────────────────────────────────────────────

export function FooterEditor({
    blocks,
    onChange,
}: {
    blocks: MobileAppBlocks
    onChange: (b: MobileAppBlocks) => void
}) {
    const b = blocks.footer
    const set = useCallback((partial: Partial<typeof b>) => onChange({ ...blocks, footer: { ...b, ...partial } }), [blocks, b, onChange])

    return (
        <div className="flex flex-col gap-3">
            <Field label="Nagłówek CTA"><TextInput value={b.ctaHeadline} onChange={v => set({ ctaHeadline: v })} /></Field>
            <Field label="Lead pod CTA"><TextArea value={b.ctaLead} onChange={v => set({ ctaLead: v })} /></Field>
            <Field label="Tagline firmy"><TextInput value={b.companyTagline} onChange={v => set({ companyTagline: v })} /></Field>
            <Field label="E-mail kontaktowy"><TextInput value={b.contactEmail} onChange={v => set({ contactEmail: v })} /></Field>
            <Field label="Telefon"><TextInput value={b.contactPhone} onChange={v => set({ contactPhone: v })} /></Field>
            <Field label="Strona WWW"><TextInput value={b.websiteUrl} onChange={v => set({ websiteUrl: v })} /></Field>
            <Field label="Ważność oferty"><TextInput value={b.validityDate ?? ''} onChange={v => set({ validityDate: v })} /></Field>
            <SectionHeader title="Podsumowanie (footer)" />
            <Field label="Platforma"><TextInput value={b.summaryPlatform} onChange={v => set({ summaryPlatform: v })} /></Field>
            <Field label="Zakres"><TextInput value={b.summaryScope} onChange={v => set({ summaryScope: v })} /></Field>
            <Field label="Czas"><TextInput value={b.summaryTime} onChange={v => set({ summaryTime: v })} /></Field>
            <Field label="Wartość"><TextInput value={b.summaryValue} onChange={v => set({ summaryValue: v })} /></Field>
        </div>
    )
}

// ── Vision ────────────────────────────────────────────────────────────────────

export function VisionEditor({
    blocks,
    onChange,
    offerContext,
}: {
    blocks: MobileAppBlocks
    onChange: (b: MobileAppBlocks) => void
    offerContext?: OfferContext
}) {
    const b = blocks.vision
    const set = useCallback((partial: Partial<typeof b>) => onChange({ ...blocks, vision: { ...b, ...partial } }), [blocks, b, onChange])

    return (
        <div className="flex flex-col gap-3">
            <AiGenerateButton
                sectionKey="mobile_app.vision"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    vision: {
                        ...blocks.vision,
                        projectDescription: (data.projectDescription as string) || blocks.vision.projectDescription,
                        sectionTitle: (data.sectionTitle as string) || blocks.vision.sectionTitle,
                        sectionLead: (data.sectionLead as string) || blocks.vision.sectionLead,
                        cards: Array.isArray(data.cards) ? data.cards as typeof blocks.vision.cards : blocks.vision.cards,
                    },
                })}
            />
            <Field label="Tytuł sekcji"><TextInput value={b.sectionTitle} onChange={v => set({ sectionTitle: v })} /></Field>
            <Field label="Lead"><TextArea value={b.sectionLead} onChange={v => set({ sectionLead: v })} /></Field>
            <Field label="Opis projektu"><TextArea value={b.projectDescription} onChange={v => set({ projectDescription: v })} rows={4} /></Field>
            <SectionHeader title="Karty wizji" />
            {b.cards.map((card, i) => (
                <div key={i} className="border border-border rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Karta {i + 1}</span>
                        <button type="button" onClick={() => set({ cards: b.cards.filter((_, j) => j !== i) })} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <Field label="Emoji"><TextInput value={card.emoji} onChange={v => set({ cards: b.cards.map((c, j) => j === i ? { ...c, emoji: v } : c) })} /></Field>
                    <Field label="Tytuł"><TextInput value={card.title} onChange={v => set({ cards: b.cards.map((c, j) => j === i ? { ...c, title: v } : c) })} /></Field>
                    <Field label="Opis"><TextArea value={card.description} onChange={v => set({ cards: b.cards.map((c, j) => j === i ? { ...c, description: v } : c) })} /></Field>
                    <SelectField<'rose' | 'indigo' | 'green'>
                        label="Akcent"
                        value={card.accent}
                        onChange={v => set({ cards: b.cards.map((c, j) => j === i ? { ...c, accent: v } : c) })}
                        options={[{ value: 'rose', label: 'Różowy' }, { value: 'indigo', label: 'Indygo' }, { value: 'green', label: 'Zielony' }]}
                    />
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set({ cards: [...b.cards, { emoji: '🚀', title: 'Nowa wizja', description: '', accent: 'indigo' }] })}>
                <Plus className="w-4 h-4" /> Dodaj kartę
            </Button>
        </div>
    )
}

// ── Platform ──────────────────────────────────────────────────────────────────

const BADGE_OPTIONS: { value: MobileAppBadgeStyle; label: string }[] = [
    { value: 'recommended', label: 'Polecana' },
    { value: 'performance', label: 'Wydajność' },
    { value: 'premium', label: 'Premium' },
    { value: 'budget', label: 'Budżetowa' },
]

export function PlatformEditor({
    blocks,
    onChange,
}: {
    blocks: MobileAppBlocks
    onChange: (b: MobileAppBlocks) => void
}) {
    const b = blocks.platform
    const set = useCallback((partial: Partial<typeof b>) => onChange({ ...blocks, platform: { ...b, ...partial } }), [blocks, b, onChange])

    return (
        <div className="flex flex-col gap-3">
            <Field label="Tytuł sekcji"><TextInput value={b.sectionTitle} onChange={v => set({ sectionTitle: v })} /></Field>
            <Field label="Lead"><TextArea value={b.sectionLead} onChange={v => set({ sectionLead: v })} /></Field>
            <Field label="Przypis (footer)"><TextArea value={b.footerNote} onChange={v => set({ footerNote: v })} /></Field>
            <SectionHeader title="Karty technologii" />
            {b.cards.map((card, i) => (
                <div key={i} className="border border-border rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{card.title || `Karta ${i + 1}`}</span>
                    </div>
                    <Field label="Ikona"><TextInput value={card.icon} onChange={v => set({ cards: b.cards.map((c, j) => j === i ? { ...c, icon: v } : c) })} /></Field>
                    <Field label="Tytuł"><TextInput value={card.title} onChange={v => set({ cards: b.cards.map((c, j) => j === i ? { ...c, title: v } : c) })} /></Field>
                    <Field label="Etykieta (tag)"><TextInput value={card.tag} onChange={v => set({ cards: b.cards.map((c, j) => j === i ? { ...c, tag: v } : c) })} /></Field>
                    <Field label="Odznaka"><TextInput value={card.badge} onChange={v => set({ cards: b.cards.map((c, j) => j === i ? { ...c, badge: v } : c) })} /></Field>
                    <SelectField<MobileAppBadgeStyle>
                        label="Styl odznaki"
                        value={card.badgeStyle}
                        onChange={v => set({ cards: b.cards.map((c, j) => j === i ? { ...c, badgeStyle: v } : c) })}
                        options={BADGE_OPTIONS}
                    />
                    <Field label="Opis"><TextArea value={card.description} onChange={v => set({ cards: b.cards.map((c, j) => j === i ? { ...c, description: v } : c) })} /></Field>
                    <Field label="Zalety (każda w nowej linii)">
                        <TextArea
                            value={card.pros.join('\n')}
                            onChange={v => set({ cards: b.cards.map((c, j) => j === i ? { ...c, pros: v.split('\n') } : c) })}
                            rows={4}
                        />
                    </Field>
                    <Field label="Ostrzeżenia (każde w nowej linii)">
                        <TextArea
                            value={card.warnings.join('\n')}
                            onChange={v => set({ cards: b.cards.map((c, j) => j === i ? { ...c, warnings: v.split('\n') } : c) })}
                            rows={2}
                        />
                    </Field>
                </div>
            ))}
        </div>
    )
}

// ── Scope ─────────────────────────────────────────────────────────────────────

const COMPLEXITY_OPTIONS: { value: MobileAppFeatureComplexity; label: string }[] = [
    { value: 'low', label: 'Niska' },
    { value: 'medium', label: 'Średnia' },
    { value: 'high', label: 'Wysoka' },
]
const STATUS_OPTIONS: { value: MobileAppFeatureStatus; label: string }[] = [
    { value: 'included', label: 'Uwzględnione' },
    { value: 'tbd', label: 'Do ustalenia' },
    { value: 'optional', label: 'Opcja' },
]

export function ScopeEditor({
    blocks,
    onChange,
    offerContext,
}: {
    blocks: MobileAppBlocks
    onChange: (b: MobileAppBlocks) => void
    offerContext?: OfferContext
}) {
    const b = blocks.scope
    const set = useCallback((partial: Partial<typeof b>) => onChange({ ...blocks, scope: { ...b, ...partial } }), [blocks, b, onChange])

    return (
        <div className="flex flex-col gap-3">
            <AiGenerateButton
                sectionKey="mobile_app.scope"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    scope: {
                        ...blocks.scope,
                        mvpFeatures: Array.isArray(data.mvpFeatures) ? data.mvpFeatures as string[] : blocks.scope.mvpFeatures,
                        fullFeatures: Array.isArray(data.fullFeatures) ? data.fullFeatures as string[] : blocks.scope.fullFeatures,
                        recommendationNote: (data.recommendationNote as string) || blocks.scope.recommendationNote,
                    },
                })}
            />
            <Field label="Tytuł sekcji"><TextInput value={b.sectionTitle} onChange={v => set({ sectionTitle: v })} /></Field>
            <SectionHeader title="MVP" />
            <Field label="Czas MVP"><TextInput value={b.mvpTimeline} onChange={v => set({ mvpTimeline: v })} /></Field>
            <Field label="Cena od (zł)"><TextInput value={b.mvpPriceFrom} onChange={v => set({ mvpPriceFrom: v })} /></Field>
            <Field label="Uwaga MVP"><TextArea value={b.mvpNote} onChange={v => set({ mvpNote: v })} /></Field>
            <Field label="Funkcje MVP (każda w nowej linii)">
                <TextArea value={b.mvpFeatures.join('\n')} onChange={v => set({ mvpFeatures: v.split('\n') })} rows={5} />
            </Field>
            <SectionHeader title="Pełna aplikacja" />
            <Field label="Czas"><TextInput value={b.fullTimeline} onChange={v => set({ fullTimeline: v })} /></Field>
            <Field label="Cena od (zł)"><TextInput value={b.fullPriceFrom} onChange={v => set({ fullPriceFrom: v })} /></Field>
            <Field label="Uwaga"><TextArea value={b.fullNote} onChange={v => set({ fullNote: v })} /></Field>
            <Field label="Funkcje (każda w nowej linii)">
                <TextArea value={b.fullFeatures.join('\n')} onChange={v => set({ fullFeatures: v.split('\n') })} rows={5} />
            </Field>
            <Field label="Rekomendacja"><TextArea value={b.recommendationNote} onChange={v => set({ recommendationNote: v })} /></Field>
            <SectionHeader title="Karty funkcji" />
            <Field label="Tytuł tabeli funkcji"><TextInput value={b.featuresTitle} onChange={v => set({ featuresTitle: v })} /></Field>
            {b.features.map((f, i) => (
                <div key={i} className="border border-border rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{f.title || `Funkcja ${i + 1}`}</span>
                        <button type="button" onClick={() => set({ features: b.features.filter((_, j) => j !== i) })} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <Field label="Emoji"><TextInput value={f.emoji} onChange={v => set({ features: b.features.map((x, j) => j === i ? { ...x, emoji: v } : x) })} /></Field>
                    <Field label="Tytuł"><TextInput value={f.title} onChange={v => set({ features: b.features.map((x, j) => j === i ? { ...x, title: v } : x) })} /></Field>
                    <Field label="Opis"><TextArea value={f.description} onChange={v => set({ features: b.features.map((x, j) => j === i ? { ...x, description: v } : x) })} /></Field>
                    <SelectField<MobileAppFeatureComplexity> label="Złożoność" value={f.complexity} onChange={v => set({ features: b.features.map((x, j) => j === i ? { ...x, complexity: v } : x) })} options={COMPLEXITY_OPTIONS} />
                    <SelectField<MobileAppFeatureStatus> label="Status" value={f.status} onChange={v => set({ features: b.features.map((x, j) => j === i ? { ...x, status: v } : x) })} options={STATUS_OPTIONS} />
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set({ features: [...b.features, { emoji: '⚡', title: 'Nowa funkcja', description: '', complexity: 'medium', status: 'included' }] })}>
                <Plus className="w-4 h-4" /> Dodaj funkcję
            </Button>
            <Field label="Przypis"><TextArea value={b.footerNote} onChange={v => set({ footerNote: v })} /></Field>
        </div>
    )
}

// ── Architecture ──────────────────────────────────────────────────────────────

const BACKEND_STATUS_OPTIONS: { value: MobileAppBackendStatus; label: string }[] = [
    { value: 'selected', label: 'Wybrana' },
    { value: 'option', label: 'Opcja' },
    { value: 'alternative', label: 'Alternatywa' },
]

export function ArchitectureEditor({
    blocks,
    onChange,
}: {
    blocks: MobileAppBlocks
    onChange: (b: MobileAppBlocks) => void
}) {
    const b = blocks.architecture
    const set = useCallback((partial: Partial<typeof b>) => onChange({ ...blocks, architecture: { ...b, ...partial } }), [blocks, b, onChange])

    return (
        <div className="flex flex-col gap-3">
            <Field label="Tytuł sekcji"><TextInput value={b.sectionTitle} onChange={v => set({ sectionTitle: v })} /></Field>
            <Field label="Lead"><TextArea value={b.sectionLead} onChange={v => set({ sectionLead: v })} /></Field>
            <Field label="Ostrzeżenie"><TextArea value={b.warningNote} onChange={v => set({ warningNote: v })} /></Field>
            <SectionHeader title="Opcje backendu" />
            {b.backendOptions.map((opt, i) => (
                <div key={i} className="border border-border rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{opt.title || `Opcja ${i + 1}`}</span>
                        <button type="button" onClick={() => set({ backendOptions: b.backendOptions.filter((_, j) => j !== i) })} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <Field label="Ikona"><TextInput value={opt.icon} onChange={v => set({ backendOptions: b.backendOptions.map((x, j) => j === i ? { ...x, icon: v } : x) })} /></Field>
                    <Field label="Tytuł"><TextInput value={opt.title} onChange={v => set({ backendOptions: b.backendOptions.map((x, j) => j === i ? { ...x, title: v } : x) })} /></Field>
                    <Field label="Opis"><TextArea value={opt.description} onChange={v => set({ backendOptions: b.backendOptions.map((x, j) => j === i ? { ...x, description: v } : x) })} /></Field>
                    <Field label="Kolor akcentu (hex)"><TextInput value={opt.accentColor} onChange={v => set({ backendOptions: b.backendOptions.map((x, j) => j === i ? { ...x, accentColor: v } : x) })} /></Field>
                    <SelectField<MobileAppBackendStatus> label="Status" value={opt.status} onChange={v => set({ backendOptions: b.backendOptions.map((x, j) => j === i ? { ...x, status: v } : x) })} options={BACKEND_STATUS_OPTIONS} />
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set({ backendOptions: [...b.backendOptions, { icon: '⚙️', title: 'Nowa opcja', description: '', accentColor: '#818CF8', status: 'option' }] })}>
                <Plus className="w-4 h-4" /> Dodaj opcję
            </Button>
            <SectionHeader title="Koszty serwera" />
            {b.serverCostRows.map((row, i) => (
                <div key={i} className="border border-border rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{row.name}</span>
                        <button type="button" onClick={() => set({ serverCostRows: b.serverCostRows.filter((_, j) => j !== i) })} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <Field label="Usługa"><TextInput value={row.name} onChange={v => set({ serverCostRows: b.serverCostRows.map((x, j) => j === i ? { ...x, name: v } : x) })} /></Field>
                    <Field label="Koszt"><TextInput value={row.cost} onChange={v => set({ serverCostRows: b.serverCostRows.map((x, j) => j === i ? { ...x, cost: v } : x) })} /></Field>
                    <Field label="Dla kogo"><TextInput value={row.target} onChange={v => set({ serverCostRows: b.serverCostRows.map((x, j) => j === i ? { ...x, target: v } : x) })} /></Field>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set({ serverCostRows: [...b.serverCostRows, { name: '', cost: '', target: '' }] })}>
                <Plus className="w-4 h-4" /> Dodaj wiersz
            </Button>
        </div>
    )
}

// ── Timeline ──────────────────────────────────────────────────────────────────

export function TimelineEditor({
    blocks,
    onChange,
    offerContext,
}: {
    blocks: MobileAppBlocks
    onChange: (b: MobileAppBlocks) => void
    offerContext?: OfferContext
}) {
    const b = blocks.timeline
    const set = useCallback((partial: Partial<typeof b>) => onChange({ ...blocks, timeline: { ...b, ...partial } }), [blocks, b, onChange])

    return (
        <div className="flex flex-col gap-3">
            <AiGenerateButton
                sectionKey="mobile_app.timeline"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    timeline: {
                        ...blocks.timeline,
                        stages: Array.isArray(data.stages) ? data.stages as typeof blocks.timeline.stages : blocks.timeline.stages,
                    },
                })}
            />
            <Field label="Tytuł sekcji"><TextInput value={b.sectionTitle} onChange={v => set({ sectionTitle: v })} /></Field>
            <Field label="Lead"><TextArea value={b.sectionLead} onChange={v => set({ sectionLead: v })} /></Field>
            <SectionHeader title="Etapy" />
            {b.stages.map((stage, i) => (
                <div key={i} className="border border-border rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Etap {i + 1}</span>
                        <button type="button" onClick={() => set({ stages: b.stages.filter((_, j) => j !== i) })} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <Field label="Tytuł"><TextInput value={stage.title} onChange={v => set({ stages: b.stages.map((x, j) => j === i ? { ...x, title: v } : x) })} /></Field>
                    <Field label="Czas (np. 2 tyg.)"><TextInput value={stage.weeks} onChange={v => set({ stages: b.stages.map((x, j) => j === i ? { ...x, weeks: v } : x) })} /></Field>
                    <Field label="Opis"><TextArea value={stage.description} onChange={v => set({ stages: b.stages.map((x, j) => j === i ? { ...x, description: v } : x) })} /></Field>
                    <Field label="Deliverable"><TextInput value={stage.deliverable} onChange={v => set({ stages: b.stages.map((x, j) => j === i ? { ...x, deliverable: v } : x) })} /></Field>
                    <Field label="% płatności"><TextInput value={stage.paymentPercent} onChange={v => set({ stages: b.stages.map((x, j) => j === i ? { ...x, paymentPercent: v } : x) })} /></Field>
                    <Field label="Kwota (zł)"><TextInput value={stage.paymentAmount} onChange={v => set({ stages: b.stages.map((x, j) => j === i ? { ...x, paymentAmount: v } : x) })} /></Field>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set({ stages: [...b.stages, { title: `Etap ${b.stages.length + 1} — Nowy`, weeks: '2 tyg.', description: '', deliverable: '', paymentPercent: '10%', paymentAmount: '0' }] })}>
                <Plus className="w-4 h-4" /> Dodaj etap
            </Button>
        </div>
    )
}

// ── Pricing ───────────────────────────────────────────────────────────────────

export function PricingEditor({
    blocks,
    onChange,
}: {
    blocks: MobileAppBlocks
    onChange: (b: MobileAppBlocks) => void
}) {
    const b = blocks.pricing
    const set = useCallback((partial: Partial<typeof b>) => onChange({ ...blocks, pricing: { ...b, ...partial } }), [blocks, b, onChange])

    return (
        <div className="flex flex-col gap-3">
            <Field label="Tytuł sekcji"><TextInput value={b.sectionTitle} onChange={v => set({ sectionTitle: v })} /></Field>
            <Field label="Lead"><TextArea value={b.sectionLead} onChange={v => set({ sectionLead: v })} /></Field>
            <Field label="Razem netto (zł)"><TextInput value={b.totalNet} onChange={v => set({ totalNet: v })} /></Field>
            <Field label="Całkowity czas (tygodnie)"><TextInput value={b.totalWeeks} onChange={v => set({ totalWeeks: v })} /></Field>
            <NumberInput label="VAT (%)" value={b.vat ?? 23} onChange={v => set({ vat: v })} />
            <Field label="Cena końcowa (priceOverride, puste = auto)">
                <input
                    type="number"
                    className="w-full rounded border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={b.priceOverride ?? ''}
                    onChange={e => set({ priceOverride: e.target.value === '' ? null : Number(e.target.value) })}
                    placeholder="Zostaw puste = z items"
                />
            </Field>
            <SectionHeader title="Fazy wyceny" />
            {b.phases.map((phase, pi) => (
                <div key={pi} className="border border-border rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <Field label="Etykieta fazy"><TextInput value={phase.label} onChange={v => set({ phases: b.phases.map((p, j) => j === pi ? { ...p, label: v } : p) })} /></Field>
                        <button type="button" onClick={() => set({ phases: b.phases.filter((_, j) => j !== pi) })} className="text-destructive ml-2 mt-4 flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    {phase.items.map((item, ii) => (
                        <div key={ii} className="border border-dashed border-muted rounded p-2 flex flex-col gap-1 ml-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Pozycja {ii + 1}</span>
                                <button type="button" onClick={() => set({ phases: b.phases.map((p, j) => j === pi ? { ...p, items: p.items.filter((_, k) => k !== ii) } : p) })} className="text-destructive"><Trash2 className="w-3 h-3" /></button>
                            </div>
                            <Field label="Nazwa"><TextInput value={item.name} onChange={v => set({ phases: b.phases.map((p, j) => j === pi ? { ...p, items: p.items.map((x, k) => k === ii ? { ...x, name: v } : x) } : p) })} /></Field>
                            <Field label="Zakres"><TextInput value={item.scope} onChange={v => set({ phases: b.phases.map((p, j) => j === pi ? { ...p, items: p.items.map((x, k) => k === ii ? { ...x, scope: v } : x) } : p) })} /></Field>
                            <Field label="Czas"><TextInput value={item.weeks} onChange={v => set({ phases: b.phases.map((p, j) => j === pi ? { ...p, items: p.items.map((x, k) => k === ii ? { ...x, weeks: v } : x) } : p) })} /></Field>
                            <Field label="Cena netto"><TextInput value={item.price} onChange={v => set({ phases: b.phases.map((p, j) => j === pi ? { ...p, items: p.items.map((x, k) => k === ii ? { ...x, price: v } : x) } : p) })} /></Field>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => set({ phases: b.phases.map((p, j) => j === pi ? { ...p, items: [...p.items, { name: '', scope: '', weeks: '', price: '0' }] } : p) })}>
                        <Plus className="w-3.5 h-3.5" /> Dodaj pozycję
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set({ phases: [...b.phases, { label: 'Nowa faza', items: [] }] })}>
                <Plus className="w-4 h-4" /> Dodaj fazę
            </Button>
            <SectionHeader title="Opcje dodatkowe" />
            {b.addons.map((a, i) => (
                <div key={i} className="flex gap-2 items-start">
                    <div className="flex flex-col gap-1 flex-1">
                        <TextInput value={a.name} onChange={v => set({ addons: b.addons.map((x, j) => j === i ? { ...x, name: v } : x) })} placeholder="Nazwa opcji" />
                        <TextInput value={a.price} onChange={v => set({ addons: b.addons.map((x, j) => j === i ? { ...x, price: v } : x) })} placeholder="Cena netto" />
                    </div>
                    <button type="button" onClick={() => set({ addons: b.addons.filter((_, j) => j !== i) })} className="text-destructive mt-1"><Trash2 className="w-4 h-4" /></button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set({ addons: [...b.addons, { name: '', price: '0' }] })}>
                <Plus className="w-4 h-4" /> Dodaj addon
            </Button>
        </div>
    )
}

// ── Post-launch ───────────────────────────────────────────────────────────────

export function PostLaunchEditor({
    blocks,
    onChange,
    offerContext,
}: {
    blocks: MobileAppBlocks
    onChange: (b: MobileAppBlocks) => void
    offerContext?: OfferContext
}) {
    const b = blocks.postlaunch
    const set = useCallback((partial: Partial<typeof b>) => onChange({ ...blocks, postlaunch: { ...b, ...partial } }), [blocks, b, onChange])

    return (
        <div className="flex flex-col gap-3">
            <AiGenerateButton
                sectionKey="mobile_app.postlaunch"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    postlaunch: {
                        ...blocks.postlaunch,
                        maintenancePlans: Array.isArray(data.maintenancePlans) ? data.maintenancePlans as typeof blocks.postlaunch.maintenancePlans : blocks.postlaunch.maintenancePlans,
                    },
                })}
            />
            <Field label="Tytuł sekcji"><TextInput value={b.sectionTitle} onChange={v => set({ sectionTitle: v })} /></Field>
            <Field label="Lead"><TextArea value={b.sectionLead} onChange={v => set({ sectionLead: v })} /></Field>
            <Field label="Ostrzeżenie"><TextArea value={b.warningNote} onChange={v => set({ warningNote: v })} /></Field>
            <SectionHeader title="Plany utrzymania" />
            {b.maintenancePlans.map((plan, i) => (
                <div key={i} className="border border-border rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{plan.title || `Plan ${i + 1}`}</span>
                        <button type="button" onClick={() => set({ maintenancePlans: b.maintenancePlans.filter((_, j) => j !== i) })} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <Field label="Emoji"><TextInput value={plan.emoji} onChange={v => set({ maintenancePlans: b.maintenancePlans.map((x, j) => j === i ? { ...x, emoji: v } : x) })} /></Field>
                    <Field label="Tytuł"><TextInput value={plan.title} onChange={v => set({ maintenancePlans: b.maintenancePlans.map((x, j) => j === i ? { ...x, title: v } : x) })} /></Field>
                    <Field label="Opis"><TextArea value={plan.description} onChange={v => set({ maintenancePlans: b.maintenancePlans.map((x, j) => j === i ? { ...x, description: v } : x) })} /></Field>
                    <Field label="Cena (lub 'Wycena indywidualna')"><TextInput value={plan.price} onChange={v => set({ maintenancePlans: b.maintenancePlans.map((x, j) => j === i ? { ...x, price: v } : x) })} /></Field>
                    <Field label="Wyróżniony">
                        <select
                            className="w-full rounded border border-input bg-background px-3 py-1.5 text-sm"
                            value={plan.highlighted ? 'yes' : 'no'}
                            onChange={e => set({ maintenancePlans: b.maintenancePlans.map((x, j) => j === i ? { ...x, highlighted: e.target.value === 'yes' } : x) })}
                        >
                            <option value="no">Nie</option>
                            <option value="yes">Tak</option>
                        </select>
                    </Field>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set({ maintenancePlans: [...b.maintenancePlans, { emoji: '🛠️', title: 'Nowy plan', description: '', price: '0', highlighted: false }] })}>
                <Plus className="w-4 h-4" /> Dodaj plan
            </Button>
            <SectionHeader title="Koszty utrzymania" />
            {b.maintenanceCosts.map((row, i) => (
                <div key={i} className="border border-border rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{row.service || `Koszt ${i + 1}`}</span>
                        <button type="button" onClick={() => set({ maintenanceCosts: b.maintenanceCosts.filter((_, j) => j !== i) })} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <Field label="Usługa"><TextInput value={row.service} onChange={v => set({ maintenanceCosts: b.maintenanceCosts.map((x, j) => j === i ? { ...x, service: v } : x) })} /></Field>
                    <Field label="Koszt"><TextInput value={row.cost} onChange={v => set({ maintenanceCosts: b.maintenanceCosts.map((x, j) => j === i ? { ...x, cost: v } : x) })} /></Field>
                    <Field label="Uwagi"><TextInput value={row.notes} onChange={v => set({ maintenanceCosts: b.maintenanceCosts.map((x, j) => j === i ? { ...x, notes: v } : x) })} /></Field>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set({ maintenanceCosts: [...b.maintenanceCosts, { service: '', cost: '', notes: '' }] })}>
                <Plus className="w-4 h-4" /> Dodaj koszt
            </Button>
        </div>
    )
}

// ── About ─────────────────────────────────────────────────────────────────────

export function AboutEditor({
    blocks,
    onChange,
    offerContext,
}: {
    blocks: MobileAppBlocks
    onChange: (b: MobileAppBlocks) => void
    offerContext?: OfferContext
}) {
    const b = blocks.about
    const set = useCallback((partial: Partial<typeof b>) => onChange({ ...blocks, about: { ...b, ...partial } }), [blocks, b, onChange])

    return (
        <div className="flex flex-col gap-3">
            <AiGenerateButton
                sectionKey="mobile_app.about"
                offerContext={offerContext}
                onResult={(data) => onChange({
                    ...blocks,
                    about: {
                        ...blocks.about,
                        bio: (data.bio as string) || blocks.about.bio,
                        techStack: Array.isArray(data.techStack) ? data.techStack as string[] : blocks.about.techStack,
                        stats: Array.isArray(data.stats) ? data.stats as typeof blocks.about.stats : blocks.about.stats,
                    },
                })}
            />
            <Field label="Tytuł sekcji"><TextInput value={b.sectionTitle} onChange={v => set({ sectionTitle: v })} /></Field>
            <Field label="Bio"><TextArea value={b.bio} onChange={v => set({ bio: v })} rows={5} /></Field>
            <Field label="Stack (każda technologia w nowej linii)">
                <TextArea value={b.techStack.join('\n')} onChange={v => set({ techStack: v.split('\n').filter(Boolean) })} rows={5} />
            </Field>
            <Field label="LinkedIn URL"><TextInput value={b.linkedinUrl} onChange={v => set({ linkedinUrl: v })} /></Field>
            <Field label="GitHub URL"><TextInput value={b.githubUrl} onChange={v => set({ githubUrl: v })} /></Field>
            <Field label="Portfolio URL"><TextInput value={b.portfolioUrl} onChange={v => set({ portfolioUrl: v })} /></Field>
            <SectionHeader title="Statystyki" />
            {b.stats.map((stat, i) => (
                <div key={i} className="flex gap-2 items-center">
                    <TextInput value={stat.value} onChange={v => set({ stats: b.stats.map((x, j) => j === i ? { ...x, value: v } : x) })} placeholder="Wartość (np. 50+)" />
                    <TextInput value={stat.label} onChange={v => set({ stats: b.stats.map((x, j) => j === i ? { ...x, label: v } : x) })} placeholder="Etykieta" />
                    <button type="button" onClick={() => set({ stats: b.stats.filter((_, j) => j !== i) })} className="text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set({ stats: [...b.stats, { value: '', label: '' }] })}>
                <Plus className="w-4 h-4" /> Dodaj statystykę
            </Button>
            <SectionHeader title="Portfolio" />
            {b.portfolioCards.map((card, i) => (
                <div key={i} className="border border-border rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{card.title || `Projekt ${i + 1}`}</span>
                        <button type="button" onClick={() => set({ portfolioCards: b.portfolioCards.filter((_, j) => j !== i) })} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <Field label="Tytuł"><TextInput value={card.title} onChange={v => set({ portfolioCards: b.portfolioCards.map((x, j) => j === i ? { ...x, title: v } : x) })} /></Field>
                    <Field label="Opis"><TextArea value={card.description} onChange={v => set({ portfolioCards: b.portfolioCards.map((x, j) => j === i ? { ...x, description: v } : x) })} /></Field>
                    <Field label="Tag"><TextInput value={card.tag} onChange={v => set({ portfolioCards: b.portfolioCards.map((x, j) => j === i ? { ...x, tag: v } : x) })} /></Field>
                    <Field label="Etykieta sklepu"><TextInput value={card.storeLabel} onChange={v => set({ portfolioCards: b.portfolioCards.map((x, j) => j === i ? { ...x, storeLabel: v } : x) })} /></Field>
                    <Field label="Kolor gradientu (od)"><TextInput value={card.gradientFrom} onChange={v => set({ portfolioCards: b.portfolioCards.map((x, j) => j === i ? { ...x, gradientFrom: v } : x) })} /></Field>
                    <Field label="Kolor gradientu (do)"><TextInput value={card.gradientTo} onChange={v => set({ portfolioCards: b.portfolioCards.map((x, j) => j === i ? { ...x, gradientTo: v } : x) })} /></Field>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set({ portfolioCards: [...b.portfolioCards, { title: '', description: '', tag: '', storeLabel: 'Zobacz w sklepie', gradientFrom: '#1E1B4B', gradientTo: '#F43F5E' }] })}>
                <Plus className="w-4 h-4" /> Dodaj projekt
            </Button>
        </div>
    )
}
