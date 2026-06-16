// src/components/contracts/editor/ContractMobileBlockEditorPanel.tsx
// Side-panel editors for the "Aplikacja mobilna" contract template.
'use client'

import { useState } from 'react'
import { X, ChevronUp, ChevronDown, Eye, EyeOff, Trash2, RotateCcw, Plus } from 'lucide-react'
import { Button } from '@/components/ui'
import {
    type ContractMobileBlocks,
    type MobileSectionKey,
    type MobileEditableSectionKey,
    type MobilePaymentRow,
    ALL_MOBILE_SECTION_KEYS,
    buildDefaultContractMobileBlocks,
} from '@/lib/pdf/contract-mobile-blocks'
import { AiGenerateButton, type OfferContext } from '@/components/offers/editor/block-editors'

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
    )
}

function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        </div>
    )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h3 className="text-sm font-semibold text-foreground">{children}</h3>
}

function StringList({ label, items, onChange }: { label: string; items: string[]; onChange: (items: string[]) => void }) {
    const update = (i: number, val: string) => { const next = [...items]; next[i] = val; onChange(next) }
    const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
    return (
        <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            <div className="space-y-1.5">
                {items.map((item, i) => (
                    <div key={i} className="flex gap-1.5">
                        <input value={item} onChange={e => update(i, e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <button type="button" onClick={() => remove(i)} className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                ))}
                <button type="button" onClick={() => onChange([...items, ''])} className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus className="h-3 w-3" />Dodaj</button>
            </div>
        </div>
    )
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
    return (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
    )
}

function SaveBar({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
    return (
        <div className="flex items-center gap-2 border-t border-border px-4 py-3 bg-card">
            <Button size="sm" onClick={onSave} className="flex-1">Zapisz</Button>
            <Button size="sm" variant="outline" onClick={onClose}>Anuluj</Button>
        </div>
    )
}

function SimpleEditor({ title, children, onSave, onClose }: { title: string; children: React.ReactNode; onSave: () => void; onClose: () => void }) {
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title={title} onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">{children}</div>
            <SaveBar onSave={onSave} onClose={onClose} />
        </div>
    )
}

export const MOBILE_SECTION_LABELS: Record<MobileSectionKey, string> = {
    parties: 'Strony umowy',
    subject: 'Przedmiot umowy',
    scope: 'Zakres prac',
    obligations: 'Obowiązki zamawiającego',
    timeline: 'Termin realizacji',
    payment: 'Wynagrodzenie i płatności',
    revisions: 'Poprawki i zmiany',
    acceptance: 'Odbiór i przekazanie',
    repository: 'Kod źródłowy i repozytorium',
    backend: 'Backend i koszty zewnętrzne',
    gdpr: 'Dane osobowe i RODO',
    copyright: 'Prawa autorskie',
    confidentiality: 'Poufność',
    warranty: 'Odpowiedzialność i gwarancja',
    termination: 'Rozwiązanie umowy',
    general: 'Postanowienia końcowe',
}

// ── Section editor sub-components ─────────────────────────────────────────────

function HeaderEditor({ blocks, onSave, onClose }: { blocks: ContractMobileBlocks; onSave: (b: ContractMobileBlocks) => void; onClose: () => void }) {
    const [h, setH] = useState(blocks.header)
    return <SimpleEditor title="Nagłówek" onSave={() => onSave({ ...blocks, header: h })} onClose={onClose}>
        <Field label="Nr umowy" value={h.contractNumber} onChange={v => setH(p => ({ ...p, contractNumber: v }))} placeholder="MOB/2026/001" />
        <Field label="Data zawarcia" value={h.date} onChange={v => setH(p => ({ ...p, date: v }))} placeholder="DD.MM.RRRR" />
        <Field label="Miejscowość" value={h.city} onChange={v => setH(p => ({ ...p, city: v }))} placeholder="Warszawa" />
        <Field label="Strona WWW" value={h.website} onChange={v => setH(p => ({ ...p, website: v }))} placeholder="www.twoja-strona.pl" />
    </SimpleEditor>
}

function PartiesEditor({ blocks, onSave, onClose }: { blocks: ContractMobileBlocks; onSave: (b: ContractMobileBlocks) => void; onClose: () => void }) {
    const [p, setP] = useState(blocks.parties)
    const setCon = (k: keyof typeof p.contractor, v: string) => setP(pr => ({ ...pr, contractor: { ...pr.contractor, [k]: v } }))
    const setCli = (k: keyof typeof p.client, v: string) => setP(pr => ({ ...pr, client: { ...pr.client, [k]: v } }))
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Strony umowy" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle>Wykonawca</SectionTitle>
                <Field label="Imię i nazwisko / Firma" value={p.contractor.name} onChange={v => setCon('name', v)} />
                <Field label="Adres" value={p.contractor.address} onChange={v => setCon('address', v)} />
                <Field label="NIP" value={p.contractor.nip} onChange={v => setCon('nip', v)} />
                <Field label="Email" value={p.contractor.email} onChange={v => setCon('email', v)} />
                <div className="border-t border-border pt-3" />
                <SectionTitle>Zamawiający</SectionTitle>
                <Field label="Imię i nazwisko / Firma" value={p.client.name} onChange={v => setCli('name', v)} />
                <Field label="Adres" value={p.client.address} onChange={v => setCli('address', v)} />
                <Field label="NIP" value={p.client.nip} onChange={v => setCli('nip', v)} />
                <Field label="Email" value={p.client.email} onChange={v => setCli('email', v)} />
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, parties: p })} onClose={onClose} />
        </div>
    )
}

function SubjectEditor({ blocks, onSave, onClose }: { blocks: ContractMobileBlocks; onSave: (b: ContractMobileBlocks) => void; onClose: () => void }) {
    const [s, setS] = useState(blocks.subject)
    return <SimpleEditor title="Przedmiot umowy" onSave={() => onSave({ ...blocks, subject: s })} onClose={onClose}>
        <Field label="Nazwa aplikacji" value={s.appName} onChange={v => setS(p => ({ ...p, appName: v }))} placeholder="MojaApka" />
        <Field label="Technologia" value={s.technology} onChange={v => setS(p => ({ ...p, technology: v }))} placeholder="React Native" />
        <Field label="Platformy docelowe" value={s.platforms} onChange={v => setS(p => ({ ...p, platforms: v }))} placeholder="iOS i Android" />
        <Field label="Min. wersja iOS" value={s.minIos} onChange={v => setS(p => ({ ...p, minIos: v }))} placeholder="16" />
        <Field label="Min. wersja Android" value={s.minAndroid} onChange={v => setS(p => ({ ...p, minAndroid: v }))} placeholder="10" />
        <Field label="Dostępna w" value={s.stores} onChange={v => setS(p => ({ ...p, stores: v }))} placeholder="App Store i Google Play" />
    </SimpleEditor>
}

function ScopeEditor({ blocks, onSave, onClose, aiContext }: { blocks: ContractMobileBlocks; onSave: (b: ContractMobileBlocks) => void; onClose: () => void; aiContext?: OfferContext }) {
    const [s, setS] = useState(blocks.scope)
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Zakres prac" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AiGenerateButton
                    sectionKey="contract_mobile.scope"
                    offerContext={aiContext}
                    onResult={(data) => setS(p => ({
                        ...p,
                        features: Array.isArray(data.features) ? data.features as string[] : p.features,
                        exclusions: Array.isArray(data.exclusions) ? data.exclusions as string[] : p.exclusions,
                    }))}
                />
                <StringList label="Zakres prac (pozycje)" items={s.features} onChange={v => setS(p => ({ ...p, features: v }))} />
                <StringList label="Wyłączenia z zakresu" items={s.exclusions} onChange={v => setS(p => ({ ...p, exclusions: v }))} />
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, scope: s })} onClose={onClose} />
        </div>
    )
}

function ObligationsEditor({ blocks, onSave, onClose }: { blocks: ContractMobileBlocks; onSave: (b: ContractMobileBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.obligations)
    return <SimpleEditor title="Obowiązki zamawiającego" onSave={() => onSave({ ...blocks, obligations: v })} onClose={onClose}>
        <Field label="Termin dostarczenia materiałów" value={v.materialsDeadline} onChange={val => setV(p => ({ ...p, materialsDeadline: val }))} placeholder="DD.MM.RRRR" />
        <Field label="Termin odpowiedzi na pytania (dni robocze)" value={v.responseDays} onChange={val => setV(p => ({ ...p, responseDays: val }))} placeholder="2" />
    </SimpleEditor>
}

function TimelineEditor({ blocks, onSave, onClose }: { blocks: ContractMobileBlocks; onSave: (b: ContractMobileBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.timeline)
    return <SimpleEditor title="Termin realizacji" onSave={() => onSave({ ...blocks, timeline: v })} onClose={onClose}>
        <Field label="Termin wykonania" value={v.endDate} onChange={val => setV(p => ({ ...p, endDate: val }))} placeholder="DD.MM.RRRR" />
        <Field label="Data rozpoczęcia (lub alternatywnie)" value={v.startDate} onChange={val => setV(p => ({ ...p, startDate: val }))} placeholder="DD.MM.RRRR" />
        <Field label="Dni od podpisania umowy" value={v.startDays} onChange={val => setV(p => ({ ...p, startDays: val }))} placeholder="7" />
    </SimpleEditor>
}

function PaymentEditor({ blocks, onSave, onClose }: { blocks: ContractMobileBlocks; onSave: (b: ContractMobileBlocks) => void; onClose: () => void }) {
    const [pay, setPay] = useState(blocks.payment)
    const updRow = (i: number, key: keyof MobilePaymentRow, v: string) => {
        const next = [...pay.payments]; next[i] = { ...next[i], [key]: v }; setPay(p => ({ ...p, payments: next }))
    }
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Wynagrodzenie i płatności" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <Field label="Kwota netto (zł)" value={pay.totalNet} onChange={v => setPay(p => ({ ...p, totalNet: v }))} placeholder="20000" />
                <Field label="Słownie" value={pay.totalWords} onChange={v => setPay(p => ({ ...p, totalWords: v }))} placeholder="dwadzieścia tysięcy złotych" />
                <Field label="Stawka VAT" value={pay.vatRate} onChange={v => setPay(p => ({ ...p, vatRate: v }))} placeholder="23%" />
                <div className="border-t border-border pt-3" />
                <SectionTitle>Harmonogram płatności</SectionTitle>
                {pay.payments.map((row, i) => (
                    <div key={row.id} className="rounded-lg border border-border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">{row.name || `Płatność ${i + 1}`}</span>
                            <button type="button" onClick={() => setPay(p => ({ ...p, payments: p.payments.filter((_, idx) => idx !== i) }))} className="rounded-md p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                        <Field label="Nazwa" value={row.name} onChange={v => updRow(i, 'name', v)} placeholder="Zaliczka" />
                        <Field label="Kwota (zł)" value={row.amount} onChange={v => updRow(i, 'amount', v)} placeholder="6000" />
                        <Field label="Procent (%)" value={row.percent} onChange={v => updRow(i, 'percent', v)} placeholder="30" />
                        <Field label="Warunek / Termin" value={row.condition} onChange={v => updRow(i, 'condition', v)} placeholder="W ciągu 7 dni od podpisania" />
                    </div>
                ))}
                <button type="button" onClick={() => setPay(p => ({ ...p, payments: [...p.payments, { id: Date.now().toString(), name: '', amount: '', percent: '', condition: '' }] }))} className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus className="h-3 w-3" />Dodaj płatność</button>
                <div className="border-t border-border pt-3" />
                <Field label="Numer konta" value={pay.accountNumber} onChange={v => setPay(p => ({ ...p, accountNumber: v }))} />
                <Field label="Termin płatności faktury (dni)" value={pay.paymentDays} onChange={v => setPay(p => ({ ...p, paymentDays: v }))} placeholder="14" />
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, payment: pay })} onClose={onClose} />
        </div>
    )
}

function RevisionsEditor({ blocks, onSave, onClose }: { blocks: ContractMobileBlocks; onSave: (b: ContractMobileBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.revisions)
    return <SimpleEditor title="Poprawki i zmiany" onSave={() => onSave({ ...blocks, revisions: v })} onClose={onClose}>
        <Field label="Rundy poprawek do UI/UX" value={v.uiRounds} onChange={val => setV(p => ({ ...p, uiRounds: val }))} placeholder="2" />
        <Field label="Rundy poprawek do aplikacji" value={v.appRounds} onChange={val => setV(p => ({ ...p, appRounds: val }))} placeholder="2" />
        <Field label="Stawka za dodatkowe rundy (zł netto/h)" value={v.extraHourRate} onChange={val => setV(p => ({ ...p, extraHourRate: val }))} placeholder="150" />
    </SimpleEditor>
}

function AcceptanceEditor({ blocks, onSave, onClose }: { blocks: ContractMobileBlocks; onSave: (b: ContractMobileBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.acceptance)
    return <SimpleEditor title="Odbiór" onSave={() => onSave({ ...blocks, acceptance: v })} onClose={onClose}>
        <Field label="Termin weryfikacji (dni robocze)" value={v.reviewDays} onChange={val => setV(p => ({ ...p, reviewDays: val }))} placeholder="5" />
    </SimpleEditor>
}

function RepositoryEditor({ blocks, onSave, onClose }: { blocks: ContractMobileBlocks; onSave: (b: ContractMobileBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.repository)
    return <SimpleEditor title="Repozytorium" onSave={() => onSave({ ...blocks, repository: v })} onClose={onClose}>
        <Field label="Platforma repozytorium" value={v.note} onChange={val => setV(p => ({ ...p, note: val }))} placeholder="GitHub / GitLab / Bitbucket" />
    </SimpleEditor>
}

function BackendEditor({ blocks, onSave, onClose }: { blocks: ContractMobileBlocks; onSave: (b: ContractMobileBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.backend)
    return <SimpleEditor title="Backend i koszty" onSave={() => onSave({ ...blocks, backend: v })} onClose={onClose}>
        <TextArea label="Orientacyjne koszty miesięczne" value={v.monthlyCostsDesc} onChange={val => setV(p => ({ ...p, monthlyCostsDesc: val }))} rows={2} />
        <Field label="Wykonawca zapewnia / nie zapewnia hosting backendu" value={v.hostingProvider} onChange={val => setV(p => ({ ...p, hostingProvider: val }))} placeholder="nie zapewnia" />
    </SimpleEditor>
}

function ConfidentialityEditor({ blocks, onSave, onClose }: { blocks: ContractMobileBlocks; onSave: (b: ContractMobileBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.confidentiality)
    return <SimpleEditor title="Poufność" onSave={() => onSave({ ...blocks, confidentiality: v })} onClose={onClose}>
        <Field label="Lata obowiązku poufności po zakończeniu umowy" value={v.years} onChange={val => setV(p => ({ ...p, years: val }))} placeholder="3" />
    </SimpleEditor>
}

function WarrantyEditor({ blocks, onSave, onClose }: { blocks: ContractMobileBlocks; onSave: (b: ContractMobileBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.warranty)
    return <SimpleEditor title="Odpowiedzialność i gwarancja" onSave={() => onSave({ ...blocks, warranty: v })} onClose={onClose}>
        <Field label="Min. wersja iOS objęta gwarancją" value={v.iosMin} onChange={val => setV(p => ({ ...p, iosMin: val }))} placeholder="16" />
        <Field label="Min. wersja Android objęta gwarancją" value={v.androidMin} onChange={val => setV(p => ({ ...p, androidMin: val }))} placeholder="10" />
        <Field label="Okres gwarancji (miesiące)" value={v.months} onChange={val => setV(p => ({ ...p, months: val }))} placeholder="12" />
        <Field label="Termin usunięcia błędów (dni robocze)" value={v.fixDays} onChange={val => setV(p => ({ ...p, fixDays: val }))} placeholder="10" />
    </SimpleEditor>
}

function TerminationEditor({ blocks, onSave, onClose }: { blocks: ContractMobileBlocks; onSave: (b: ContractMobileBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.termination)
    return <SimpleEditor title="Rozwiązanie umowy" onSave={() => onSave({ ...blocks, termination: v })} onClose={onClose}>
        <Field label="Okres wypowiedzenia (dni)" value={v.noticeDays} onChange={val => setV(p => ({ ...p, noticeDays: val }))} placeholder="30" />
        <Field label="Natychmiastowe: opóźnienie płatności (dni)" value={v.immediatePaymentDays} onChange={val => setV(p => ({ ...p, immediatePaymentDays: val }))} placeholder="14" />
        <Field label="Natychmiastowe: brak współpracy (dni)" value={v.noCoopDays} onChange={val => setV(p => ({ ...p, noCoopDays: val }))} placeholder="14" />
    </SimpleEditor>
}

function SignaturesEditor({ blocks, onSave, onClose }: { blocks: ContractMobileBlocks; onSave: (b: ContractMobileBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.signatures)
    return <SimpleEditor title="Podpisy" onSave={() => onSave({ ...blocks, signatures: v })} onClose={onClose}>
        <SectionTitle>Wykonawca</SectionTitle>
        <Field label="Imię i nazwisko" value={v.contractorName} onChange={val => setV(p => ({ ...p, contractorName: val }))} placeholder="Jan Kowalski" />
        <Field label="Data" value={v.contractorDate} onChange={val => setV(p => ({ ...p, contractorDate: val }))} placeholder="DD.MM.RRRR" />
        <div className="border-t border-border pt-3" />
        <SectionTitle>Zamawiający</SectionTitle>
        <Field label="Imię i nazwisko" value={v.clientName} onChange={val => setV(p => ({ ...p, clientName: val }))} placeholder="Anna Nowak" />
        <Field label="Data" value={v.clientDate} onChange={val => setV(p => ({ ...p, clientDate: val }))} placeholder="DD.MM.RRRR" />
    </SimpleEditor>
}

// ── Main export ────────────────────────────────────────────────────────────────

export function ContractMobileBlockEditorPanel({
    sectionKey, blocks, onSave, onClose, aiContext,
}: { sectionKey: MobileEditableSectionKey; blocks: ContractMobileBlocks; onSave: (b: ContractMobileBlocks) => void; onClose: () => void; aiContext?: OfferContext }) {
    if (sectionKey === 'header') return <HeaderEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'parties') return <PartiesEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'subject') return <SubjectEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'scope') return <ScopeEditor blocks={blocks} onSave={onSave} onClose={onClose} aiContext={aiContext} />
    if (sectionKey === 'obligations') return <ObligationsEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'timeline') return <TimelineEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'payment') return <PaymentEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'revisions') return <RevisionsEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'acceptance') return <AcceptanceEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'repository') return <RepositoryEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'backend') return <BackendEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'confidentiality') return <ConfidentialityEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'warranty') return <WarrantyEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'termination') return <TerminationEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'signatures') return <SignaturesEditor blocks={blocks} onSave={onSave} onClose={onClose} />

    return (
        <div className="flex flex-col h-full">
            <PanelHeader title={MOBILE_SECTION_LABELS[sectionKey as MobileSectionKey] ?? sectionKey} onClose={onClose} />
            <div className="flex-1 flex items-center justify-center p-4">
                <p className="text-sm text-muted-foreground text-center">Ta sekcja zawiera tekst standardowy.</p>
            </div>
            <div className="border-t border-border px-4 py-3">
                <Button variant="outline" size="sm" onClick={onClose} className="w-full">Zamknij</Button>
            </div>
        </div>
    )
}

export function MobileSectionManagerPanel({ blocks, onSave, onClose }: { blocks: ContractMobileBlocks; onSave: (b: ContractMobileBlocks) => void; onClose: () => void }) {
    const [sections, setSections] = useState(blocks.sections)
    const defaults = buildDefaultContractMobileBlocks()
    const removed = ALL_MOBILE_SECTION_KEYS.filter(k => !sections.includes(k))

    const move = (i: number, dir: -1 | 1) => {
        const next = [...sections]; const j = i + dir
        if (j < 0 || j >= next.length) return
        ;[next[i], next[j]] = [next[j], next[i]]; setSections(next)
    }

    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Zarządzaj sekcjami" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {sections.map((key, i) => (
                    <div key={key} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                        <div className="flex flex-col gap-0.5">
                            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => move(i, 1)} disabled={i === sections.length - 1} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                        </div>
                        <span className="flex-1 text-sm text-foreground">{MOBILE_SECTION_LABELS[key] ?? key}</span>
                        <button type="button" onClick={() => setSections(p => p.filter(s => s !== key))} className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"><EyeOff className="h-3.5 w-3.5" /></button>
                    </div>
                ))}
                {removed.length > 0 && (
                    <div className="pt-2 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Ukryte sekcje</p>
                        {removed.map(key => (
                            <div key={key} className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 mb-1.5 opacity-60">
                                <span className="flex-1 text-sm text-muted-foreground">{MOBILE_SECTION_LABELS[key] ?? key}</span>
                                <button type="button" onClick={() => setSections(p => [...p, key])} className="rounded-md p-1 text-muted-foreground hover:text-foreground"><Eye className="h-3.5 w-3.5" /></button>
                            </div>
                        ))}
                    </div>
                )}
                <button type="button" onClick={() => setSections([...defaults.sections])} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2">
                    <RotateCcw className="h-3 w-3" />Przywróć domyślne
                </button>
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, sections })} onClose={onClose} />
        </div>
    )
}

export type { MobileEditableSectionKey } from '@/lib/pdf/contract-mobile-blocks'
