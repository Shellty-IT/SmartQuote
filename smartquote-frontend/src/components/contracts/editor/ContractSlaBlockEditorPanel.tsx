// src/components/contracts/editor/ContractSlaBlockEditorPanel.tsx
// Side-panel editors for the "Opieka IT" (SLA) contract template.
'use client'

import { useState } from 'react'
import { X, ChevronUp, ChevronDown, Eye, EyeOff, Trash2, RotateCcw, Plus } from 'lucide-react'
import { Button } from '@/components/ui'
import {
    type ContractSlaBlocks,
    type SlaSectionKey,
    type SlaEditableSectionKey,
    type SlaSystemRow,
    type SlaPriorityRow,
    ALL_SLA_SECTION_KEYS,
    buildDefaultContractSlaBlocks,
} from '@/lib/pdf/contract-sla-blocks'
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

export const SLA_SECTION_LABELS: Record<SlaSectionKey, string> = {
    parties: 'Strony umowy',
    subject: 'Przedmiot umowy',
    package: 'Pakiet i wynagrodzenie',
    services: 'Katalog usług',
    priorities: 'Priorytety i czasy reakcji',
    incidents: 'Zgłaszanie i obsługa awarii',
    obligations: 'Obowiązki usługobiorcy',
    reporting: 'Raportowanie',
    confidentiality: 'Poufność i dane osobowe',
    liability: 'Odpowiedzialność',
    termination: 'Czas trwania i rozwiązanie',
    general: 'Postanowienia końcowe',
}

// ── Section editor sub-components ─────────────────────────────────────────────

function HeaderEditor({ blocks, onSave, onClose }: { blocks: ContractSlaBlocks; onSave: (b: ContractSlaBlocks) => void; onClose: () => void }) {
    const [h, setH] = useState(blocks.header)
    return <SimpleEditor title="Nagłówek" onSave={() => onSave({ ...blocks, header: h })} onClose={onClose}>
        <Field label="Nr umowy" value={h.contractNumber} onChange={v => setH(p => ({ ...p, contractNumber: v }))} placeholder="SLA/2026/001" />
        <Field label="Data zawarcia" value={h.date} onChange={v => setH(p => ({ ...p, date: v }))} placeholder="DD.MM.RRRR" />
        <Field label="Miejscowość" value={h.city} onChange={v => setH(p => ({ ...p, city: v }))} placeholder="Warszawa" />
        <Field label="Strona WWW" value={h.website} onChange={v => setH(p => ({ ...p, website: v }))} placeholder="www.twoja-strona.pl" />
    </SimpleEditor>
}

function PartiesEditor({ blocks, onSave, onClose }: { blocks: ContractSlaBlocks; onSave: (b: ContractSlaBlocks) => void; onClose: () => void }) {
    const [p, setP] = useState(blocks.parties)
    const setProv = (k: keyof typeof p.provider, v: string) => setP(pr => ({ ...pr, provider: { ...pr.provider, [k]: v } }))
    const setCli = (k: keyof typeof p.client, v: string) => setP(pr => ({ ...pr, client: { ...pr.client, [k]: v } }))
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Strony umowy" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle>Usługodawca</SectionTitle>
                <Field label="Imię i nazwisko / Firma" value={p.provider.name} onChange={v => setProv('name', v)} placeholder="Jan Kowalski" />
                <Field label="Adres" value={p.provider.address} onChange={v => setProv('address', v)} />
                <Field label="NIP" value={p.provider.nip} onChange={v => setProv('nip', v)} />
                <Field label="Email" value={p.provider.email} onChange={v => setProv('email', v)} />
                <Field label="Telefon" value={p.provider.phone} onChange={v => setProv('phone', v)} />
                <div className="border-t border-border pt-3" />
                <SectionTitle>Usługobiorca</SectionTitle>
                <Field label="Imię i nazwisko / Firma" value={p.client.name} onChange={v => setCli('name', v)} />
                <Field label="Adres" value={p.client.address} onChange={v => setCli('address', v)} />
                <Field label="NIP" value={p.client.nip} onChange={v => setCli('nip', v)} />
                <Field label="Email" value={p.client.email} onChange={v => setCli('email', v)} />
                <Field label="Telefon" value={p.client.phone} onChange={v => setCli('phone', v)} />
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, parties: p })} onClose={onClose} />
        </div>
    )
}

function SubjectEditor({ blocks, onSave, onClose }: { blocks: ContractSlaBlocks; onSave: (b: ContractSlaBlocks) => void; onClose: () => void }) {
    const [systems, setSystems] = useState(blocks.subject.systems)
    const upd = (i: number, k: keyof SlaSystemRow, v: string) => {
        const next = [...systems]; next[i] = { ...next[i], [k]: v }; setSystems(next)
    }
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Systemy objęte opieką" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {systems.map((s, i) => (
                    <div key={s.id} className="rounded-lg border border-border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">System {i + 1}</span>
                            <button type="button" onClick={() => setSystems(p => p.filter((_, idx) => idx !== i))} className="rounded-md p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                        <Field label="Nazwa" value={s.name} onChange={v => upd(i, 'name', v)} placeholder="Strona firmowa" />
                        <Field label="Adres / URL" value={s.address} onChange={v => upd(i, 'address', v)} placeholder="https://firma.pl" />
                    </div>
                ))}
                <button type="button" onClick={() => setSystems(p => [...p, { id: Date.now().toString(), name: '', address: '' }])} className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus className="h-3 w-3" />Dodaj system</button>
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, subject: { systems } })} onClose={onClose} />
        </div>
    )
}

function PackageEditor({ blocks, onSave, onClose }: { blocks: ContractSlaBlocks; onSave: (b: ContractSlaBlocks) => void; onClose: () => void }) {
    const [pkg, setPkg] = useState(blocks.package)
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Pakiet i wynagrodzenie" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <Field label="Nazwa pakietu" value={pkg.packageName} onChange={v => setPkg(p => ({ ...p, packageName: v }))} placeholder="STANDARD" />
                <Field label="Opłata miesięczna (zł netto)" value={pkg.monthlyFee} onChange={v => setPkg(p => ({ ...p, monthlyFee: v }))} placeholder="500" />
                <Field label="Stawka VAT" value={pkg.vatRate} onChange={v => setPkg(p => ({ ...p, vatRate: v }))} placeholder="23%" />
                <Field label="Pula godzin wsparcia / miesiąc" value={pkg.supportHours} onChange={v => setPkg(p => ({ ...p, supportHours: v }))} placeholder="10" />
                <Field label="Stawka za godziny ponadabonamentowe (zł netto/h)" value={pkg.extraHourRate} onChange={v => setPkg(p => ({ ...p, extraHourRate: v }))} placeholder="150" />
                <Field label="Godziny świadczenia usług" value={pkg.serviceHours} onChange={v => setPkg(p => ({ ...p, serviceHours: v }))} placeholder="pon–pt, 9:00–17:00" />
                <Field label="Dostępność w nagłych przypadkach" value={pkg.emergencyAvailability} onChange={v => setPkg(p => ({ ...p, emergencyAvailability: v }))} placeholder="24/7 dla KRYTYCZNYCH" />
                <Field label="Niewykorzystane godziny" value={pkg.unusedHours} onChange={v => setPkg(p => ({ ...p, unusedHours: v }))} placeholder="nie przechodzą" />
                <div className="border-t border-border pt-3" />
                <Field label="Płatność do dnia miesiąca" value={pkg.paymentDay} onChange={v => setPkg(p => ({ ...p, paymentDay: v }))} placeholder="5" />
                <Field label="Numer konta" value={pkg.accountNumber} onChange={v => setPkg(p => ({ ...p, accountNumber: v }))} placeholder="PL00 0000 0000 0000 0000" />
                <Field label="Termin płatności faktury (dni)" value={pkg.paymentTermDays} onChange={v => setPkg(p => ({ ...p, paymentTermDays: v }))} placeholder="14" />
                <Field label="Zmiana ceny: wyprzedzenie (miesiące)" value={pkg.priceNoticeMonths} onChange={v => setPkg(p => ({ ...p, priceNoticeMonths: v }))} placeholder="1" />
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, package: pkg })} onClose={onClose} />
        </div>
    )
}

function ServicesEditor({ blocks, onSave, onClose, aiContext }: { blocks: ContractSlaBlocks; onSave: (b: ContractSlaBlocks) => void; onClose: () => void; aiContext?: OfferContext }) {
    const [srv, setSrv] = useState(blocks.services)
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Katalog usług" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AiGenerateButton
                    sectionKey="contract_sla.services"
                    offerContext={aiContext}
                    onResult={(data) => setSrv(p => ({
                        ...p,
                        included: Array.isArray(data.included) ? data.included as string[] : p.included,
                        excluded: Array.isArray(data.excluded) ? data.excluded as string[] : p.excluded,
                    }))}
                />
                <StringList label="Usługi objęte abonamentem" items={srv.included} onChange={v => setSrv(p => ({ ...p, included: v }))} />
                <Field label="Stawka godzinowa za prace poza katalogiem (zł netto/h)" value={srv.hourRate} onChange={v => setSrv(p => ({ ...p, hourRate: v }))} placeholder="150" />
                <StringList label="Prace poza katalogiem (osobna oferta)" items={srv.excluded} onChange={v => setSrv(p => ({ ...p, excluded: v }))} />
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, services: srv })} onClose={onClose} />
        </div>
    )
}

function PrioritiesEditor({ blocks, onSave, onClose }: { blocks: ContractSlaBlocks; onSave: (b: ContractSlaBlocks) => void; onClose: () => void }) {
    const [prios, setPrios] = useState(blocks.priorities.priorities)
    const upd = (i: number, k: keyof SlaPriorityRow, v: string) => {
        const next = [...prios]; next[i] = { ...next[i], [k]: v }; setPrios(next)
    }
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Priorytety i czasy reakcji" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {prios.map((p, i) => (
                    <div key={p.id} className="rounded-lg border border-border p-3 space-y-2">
                        <span className="text-xs font-semibold" style={{ color: p.color }}>{p.priority}</span>
                        <Field label="Definicja" value={p.definition} onChange={v => upd(i, 'definition', v)} />
                        <Field label="Czas reakcji" value={p.reactionTime} onChange={v => upd(i, 'reactionTime', v)} placeholder="1 godzina" />
                        <Field label="Cel rozwiązania" value={p.resolutionTime} onChange={v => upd(i, 'resolutionTime', v)} placeholder="4 godziny" />
                    </div>
                ))}
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, priorities: { ...blocks.priorities, priorities: prios } })} onClose={onClose} />
        </div>
    )
}

function IncidentsEditor({ blocks, onSave, onClose }: { blocks: ContractSlaBlocks; onSave: (b: ContractSlaBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.incidents)
    return <SimpleEditor title="Kanały zgłoszeń" onSave={() => onSave({ ...blocks, incidents: v })} onClose={onClose}>
        <Field label="Email dla zgłoszeń" value={v.email} onChange={val => setV(p => ({ ...p, email: val }))} placeholder="support@firma.pl" />
        <Field label="Telefon (tylko KRYTYCZNE/WYSOKIE)" value={v.phone} onChange={val => setV(p => ({ ...p, phone: val }))} placeholder="+48 000 000 000" />
        <Field label="System ticketowy / link (opcjonalnie)" value={v.ticketSystem} onChange={val => setV(p => ({ ...p, ticketSystem: val }))} placeholder="https://help.firma.pl" />
        <Field label="Termin domyślnego zamknięcia (dni robocze)" value={v.closureWorkDays} onChange={val => setV(p => ({ ...p, closureWorkDays: val }))} placeholder="2" />
    </SimpleEditor>
}

function ObligationsEditor({ blocks, onSave, onClose }: { blocks: ContractSlaBlocks; onSave: (b: ContractSlaBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.obligations)
    return <SimpleEditor title="Obowiązki usługobiorcy" onSave={() => onSave({ ...blocks, obligations: v })} onClose={onClose}>
        <Field label="Termin odpowiedzi na pytania (dni robocze)" value={v.responseDays} onChange={val => setV(p => ({ ...p, responseDays: val }))} placeholder="2" />
    </SimpleEditor>
}

function ReportingEditor({ blocks, onSave, onClose }: { blocks: ContractSlaBlocks; onSave: (b: ContractSlaBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.reporting)
    return <SimpleEditor title="Raportowanie" onSave={() => onSave({ ...blocks, reporting: v })} onClose={onClose}>
        <Field label="Dzień miesiąca dostarczenia raportu" value={v.reportDay} onChange={val => setV(p => ({ ...p, reportDay: val }))} placeholder="5" />
        <Field label="Email odbiorcy raportu" value={v.reportEmail} onChange={val => setV(p => ({ ...p, reportEmail: val }))} placeholder="biuro@klient.pl" />
    </SimpleEditor>
}

function ConfidentialityEditor({ blocks, onSave, onClose }: { blocks: ContractSlaBlocks; onSave: (b: ContractSlaBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.confidentiality)
    return <SimpleEditor title="Poufność" onSave={() => onSave({ ...blocks, confidentiality: v })} onClose={onClose}>
        <Field label="Lata obowiązku poufności po zakończeniu umowy" value={v.years} onChange={val => setV(p => ({ ...p, years: val }))} placeholder="3" />
    </SimpleEditor>
}

function TerminationEditor({ blocks, onSave, onClose }: { blocks: ContractSlaBlocks; onSave: (b: ContractSlaBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.termination)
    return <SimpleEditor title="Czas trwania i rozwiązanie" onSave={() => onSave({ ...blocks, termination: v })} onClose={onClose}>
        <Field label="Data startu umowy" value={v.startDate} onChange={val => setV(p => ({ ...p, startDate: val }))} placeholder="DD.MM.RRRR" />
        <Field label="Okres wypowiedzenia (miesiące)" value={v.noticeMonths} onChange={val => setV(p => ({ ...p, noticeMonths: val }))} placeholder="1" />
        <Field label="Natychmiastowe: opóźnienie płatności (dni)" value={v.immediatePaymentDays} onChange={val => setV(p => ({ ...p, immediatePaymentDays: val }))} placeholder="14" />
        <Field label="Termin przekazania danych dostępowych po zakończeniu (dni)" value={v.handoverDays} onChange={val => setV(p => ({ ...p, handoverDays: val }))} placeholder="7" />
    </SimpleEditor>
}

function SignaturesEditor({ blocks, onSave, onClose }: { blocks: ContractSlaBlocks; onSave: (b: ContractSlaBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.signatures)
    return <SimpleEditor title="Podpisy" onSave={() => onSave({ ...blocks, signatures: v })} onClose={onClose}>
        <SectionTitle>Usługodawca</SectionTitle>
        <Field label="Imię i nazwisko" value={v.providerName} onChange={val => setV(p => ({ ...p, providerName: val }))} placeholder="Jan Kowalski" />
        <Field label="Data" value={v.providerDate} onChange={val => setV(p => ({ ...p, providerDate: val }))} placeholder="DD.MM.RRRR" />
        <div className="border-t border-border pt-3" />
        <SectionTitle>Usługobiorca</SectionTitle>
        <Field label="Imię i nazwisko" value={v.clientName} onChange={val => setV(p => ({ ...p, clientName: val }))} placeholder="Anna Nowak" />
        <Field label="Data" value={v.clientDate} onChange={val => setV(p => ({ ...p, clientDate: val }))} placeholder="DD.MM.RRRR" />
    </SimpleEditor>
}

// ── Main export ────────────────────────────────────────────────────────────────

export function ContractSlaBlockEditorPanel({
    sectionKey, blocks, onSave, onClose, aiContext,
}: { sectionKey: SlaEditableSectionKey; blocks: ContractSlaBlocks; onSave: (b: ContractSlaBlocks) => void; onClose: () => void; aiContext?: OfferContext }) {
    if (sectionKey === 'header') return <HeaderEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'parties') return <PartiesEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'subject') return <SubjectEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'package') return <PackageEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'services') return <ServicesEditor blocks={blocks} onSave={onSave} onClose={onClose} aiContext={aiContext} />
    if (sectionKey === 'priorities') return <PrioritiesEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'incidents') return <IncidentsEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'obligations') return <ObligationsEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'reporting') return <ReportingEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'confidentiality') return <ConfidentialityEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'termination') return <TerminationEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'signatures') return <SignaturesEditor blocks={blocks} onSave={onSave} onClose={onClose} />

    return (
        <div className="flex flex-col h-full">
            <PanelHeader title={SLA_SECTION_LABELS[sectionKey as SlaSectionKey] ?? sectionKey} onClose={onClose} />
            <div className="flex-1 flex items-center justify-center p-4">
                <p className="text-sm text-muted-foreground text-center">Ta sekcja zawiera tekst standardowy.</p>
            </div>
            <div className="border-t border-border px-4 py-3">
                <Button variant="outline" size="sm" onClick={onClose} className="w-full">Zamknij</Button>
            </div>
        </div>
    )
}

export function SlaSectionManagerPanel({ blocks, onSave, onClose }: { blocks: ContractSlaBlocks; onSave: (b: ContractSlaBlocks) => void; onClose: () => void }) {
    const [sections, setSections] = useState(blocks.sections)
    const defaults = buildDefaultContractSlaBlocks()
    const removed = ALL_SLA_SECTION_KEYS.filter(k => !sections.includes(k))

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
                        <span className="flex-1 text-sm text-foreground">{SLA_SECTION_LABELS[key] ?? key}</span>
                        <button type="button" onClick={() => setSections(p => p.filter(s => s !== key))} className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"><EyeOff className="h-3.5 w-3.5" /></button>
                    </div>
                ))}
                {removed.length > 0 && (
                    <div className="pt-2 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Ukryte sekcje</p>
                        {removed.map(key => (
                            <div key={key} className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 mb-1.5 opacity-60">
                                <span className="flex-1 text-sm text-muted-foreground">{SLA_SECTION_LABELS[key] ?? key}</span>
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

export type { SlaEditableSectionKey } from '@/lib/pdf/contract-sla-blocks'
