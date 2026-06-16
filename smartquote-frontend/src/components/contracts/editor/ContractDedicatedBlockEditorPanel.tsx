// src/components/contracts/editor/ContractDedicatedBlockEditorPanel.tsx
// Side-panel editors for the "System dedykowany" contract template.
'use client'

import { useState } from 'react'
import { X, ChevronUp, ChevronDown, Eye, EyeOff, Trash2, RotateCcw, Plus } from 'lucide-react'
import { Button } from '@/components/ui'
import {
    type ContractDedicatedBlocks,
    type DedicatedSectionKey,
    type DedicatedEditableSectionKey,
    type DedicatedPhaseRow,
    type DedicatedPaymentRow,
    ALL_DEDICATED_SECTION_KEYS,
    buildDefaultContractDedicatedBlocks,
} from '@/lib/pdf/contract-dedicated-blocks'
import { AiGenerateButton, type OfferContext } from '@/components/offers/editor/block-editors'

// ── Shared field primitives ───────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, type = 'text' }: {
    label: string; value: string; onChange: (v: string) => void
    placeholder?: string; type?: string
}) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
    )
}

function TextArea({ label, value, onChange, rows = 3 }: {
    label: string; value: string; onChange: (v: string) => void; rows?: number
}) {
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
    const add = () => onChange([...items, ''])
    return (
        <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            <div className="space-y-1.5">
                {items.map((item, i) => (
                    <div key={i} className="flex gap-1.5">
                        <input value={item} onChange={e => update(i, e.target.value)}
                            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <button type="button" onClick={() => remove(i)} className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={add} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Plus className="h-3 w-3" />Dodaj
                </button>
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

// ── Section labels ────────────────────────────────────────────────────────────

export const DEDICATED_SECTION_LABELS: Record<DedicatedSectionKey, string> = {
    parties: 'Strony umowy',
    subject: 'Przedmiot umowy',
    phases: 'Zakres prac i etapy',
    spec: 'Specyfikacja techniczna',
    obligations: 'Obowiązki zamawiającego',
    timeline: 'Terminy realizacji',
    payment: 'Wynagrodzenie i płatności',
    scopeCreep: 'Zmiany zakresu',
    acceptance: 'Odbiory etapowe',
    infrastructure: 'Infrastruktura',
    gdpr: 'Dane osobowe i RODO',
    copyright: 'Prawa autorskie',
    confidentiality: 'Poufność',
    warranty: 'Odpowiedzialność i gwarancja',
    termination: 'Rozwiązanie umowy',
    general: 'Postanowienia końcowe',
}

// ── Section-specific editor components ────────────────────────────────────────

function HeaderEditor({ blocks, onSave, onClose }: { blocks: ContractDedicatedBlocks; onSave: (b: ContractDedicatedBlocks) => void; onClose: () => void }) {
    const [h, setH] = useState(blocks.header)
    const save = () => onSave({ ...blocks, header: h })
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Nagłówek" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <Field label="Nr umowy" value={h.contractNumber} onChange={v => setH(p => ({ ...p, contractNumber: v }))} placeholder="SYS/2026/001" />
                <Field label="Data zawarcia" value={h.date} onChange={v => setH(p => ({ ...p, date: v }))} placeholder="DD.MM.RRRR" />
                <Field label="Miejscowość" value={h.city} onChange={v => setH(p => ({ ...p, city: v }))} placeholder="Warszawa" />
                <Field label="Strona WWW" value={h.website} onChange={v => setH(p => ({ ...p, website: v }))} placeholder="www.twoja-strona.pl" />
            </div>
            <SaveBar onSave={save} onClose={onClose} />
        </div>
    )
}

function PartiesEditor({ blocks, onSave, onClose }: { blocks: ContractDedicatedBlocks; onSave: (b: ContractDedicatedBlocks) => void; onClose: () => void }) {
    const [p, setP] = useState(blocks.parties)
    const save = () => onSave({ ...blocks, parties: p })
    const setCon = (k: keyof typeof p.contractor, v: string) => setP(prev => ({ ...prev, contractor: { ...prev.contractor, [k]: v } }))
    const setCli = (k: keyof typeof p.client, v: string) => setP(prev => ({ ...prev, client: { ...prev.client, [k]: v } }))
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Strony umowy" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <SectionTitle>Wykonawca</SectionTitle>
                <Field label="Imię i nazwisko / Firma" value={p.contractor.name} onChange={v => setCon('name', v)} placeholder="Jan Kowalski" />
                <Field label="Adres" value={p.contractor.address} onChange={v => setCon('address', v)} placeholder="ul. Przykładowa 1, 00-001 Warszawa" />
                <Field label="NIP" value={p.contractor.nip} onChange={v => setCon('nip', v)} placeholder="1234567890" />
                <Field label="Email" value={p.contractor.email} onChange={v => setCon('email', v)} placeholder="kontakt@firma.pl" />
                <div className="border-t border-border pt-3" />
                <SectionTitle>Zamawiający</SectionTitle>
                <Field label="Imię i nazwisko / Firma" value={p.client.name} onChange={v => setCli('name', v)} placeholder="Firma Sp. z o.o." />
                <Field label="Adres" value={p.client.address} onChange={v => setCli('address', v)} placeholder="ul. Klienta 2, 00-002 Warszawa" />
                <Field label="NIP" value={p.client.nip} onChange={v => setCli('nip', v)} placeholder="0987654321" />
                <Field label="Email" value={p.client.email} onChange={v => setCli('email', v)} placeholder="biuro@klient.pl" />
            </div>
            <SaveBar onSave={save} onClose={onClose} />
        </div>
    )
}

function SubjectEditor({ blocks, onSave, onClose }: { blocks: ContractDedicatedBlocks; onSave: (b: ContractDedicatedBlocks) => void; onClose: () => void }) {
    const [s, setS] = useState(blocks.subject)
    const save = () => onSave({ ...blocks, subject: s })
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Przedmiot umowy" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <Field label="Nazwa systemu" value={s.systemName} onChange={v => setS(p => ({ ...p, systemName: v }))} placeholder="System zarządzania zamówieniami" />
                <TextArea label="Cel systemu" value={s.goal} onChange={v => setS(p => ({ ...p, goal: v }))} />
                <Field label="Technologia realizacji" value={s.technology} onChange={v => setS(p => ({ ...p, technology: v }))} placeholder="React + Node.js" />
                <Field label="Dostęp jako" value={s.accessType} onChange={v => setS(p => ({ ...p, accessType: v }))} placeholder="aplikacja webowa przez przeglądarkę" />
            </div>
            <SaveBar onSave={save} onClose={onClose} />
        </div>
    )
}

function PhasesEditor({ blocks, onSave, onClose, aiContext }: { blocks: ContractDedicatedBlocks; onSave: (b: ContractDedicatedBlocks) => void; onClose: () => void; aiContext?: OfferContext }) {
    const [phases, setPhases] = useState(blocks.phases.phases)
    const [exclusions, setExclusions] = useState(blocks.phases.exclusions)
    const save = () => onSave({ ...blocks, phases: { phases, exclusions } })
    const upd = (i: number, key: keyof DedicatedPhaseRow, v: string) => {
        const next = [...phases]; next[i] = { ...next[i], [key]: v }; setPhases(next)
    }
    const add = () => setPhases(p => [...p, { id: Date.now().toString(), name: '', description: '', date: '' }])
    const remove = (i: number) => setPhases(p => p.filter((_, idx) => idx !== i))
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Zakres prac i etapy" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AiGenerateButton
                    sectionKey="contract_dedicated.phases"
                    offerContext={aiContext}
                    onResult={(data) => {
                        if (Array.isArray(data.phases)) {
                            setPhases((data.phases as { name?: string; description?: string }[]).map((ph, i) => ({
                                id: `${Date.now()}-${i}`,
                                name: ph.name ?? '',
                                description: ph.description ?? '',
                                date: '',
                            })))
                        }
                        if (Array.isArray(data.exclusions)) setExclusions(data.exclusions as string[])
                    }}
                />
                <SectionTitle>Etapy realizacji</SectionTitle>
                {phases.map((phase, i) => (
                    <div key={phase.id} className="rounded-lg border border-border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">Etap {i + 1}</span>
                            <button type="button" onClick={() => remove(i)} className="rounded-md p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                        <Field label="Nazwa" value={phase.name} onChange={v => upd(i, 'name', v)} placeholder="Development — Etap I" />
                        <TextArea label="Opis / Deliverable" value={phase.description} onChange={v => upd(i, 'description', v)} rows={2} />
                        <Field label="Termin" value={phase.date} onChange={v => upd(i, 'date', v)} placeholder="DD.MM.RRRR" />
                    </div>
                ))}
                <button type="button" onClick={add} className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus className="h-3 w-3" />Dodaj etap</button>
                <div className="border-t border-border pt-3" />
                <StringList label="Wyłączenia z zakresu" items={exclusions} onChange={setExclusions} />
            </div>
            <SaveBar onSave={save} onClose={onClose} />
        </div>
    )
}

function PaymentEditor({ blocks, onSave, onClose }: { blocks: ContractDedicatedBlocks; onSave: (b: ContractDedicatedBlocks) => void; onClose: () => void }) {
    const [pay, setPay] = useState(blocks.payment)
    const save = () => onSave({ ...blocks, payment: pay })
    const updRow = (i: number, key: keyof DedicatedPaymentRow, v: string) => {
        const next = [...pay.payments]; next[i] = { ...next[i], [key]: v }; setPay(p => ({ ...p, payments: next }))
    }
    const addRow = () => setPay(p => ({ ...p, payments: [...p.payments, { id: Date.now().toString(), name: '', condition: '', amount: '', percent: '' }] }))
    const removeRow = (i: number) => setPay(p => ({ ...p, payments: p.payments.filter((_, idx) => idx !== i) }))
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Wynagrodzenie i płatności" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <Field label="Kwota netto (zł)" value={pay.totalNet} onChange={v => setPay(p => ({ ...p, totalNet: v }))} placeholder="10000" />
                <Field label="Słownie" value={pay.totalWords} onChange={v => setPay(p => ({ ...p, totalWords: v }))} placeholder="dziesięć tysięcy złotych" />
                <Field label="Stawka VAT" value={pay.vatRate} onChange={v => setPay(p => ({ ...p, vatRate: v }))} placeholder="23%" />
                <div className="border-t border-border pt-3" />
                <SectionTitle>Harmonogram płatności</SectionTitle>
                {pay.payments.map((row, i) => (
                    <div key={row.id} className="rounded-lg border border-border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">Płatność {i + 1}</span>
                            <button type="button" onClick={() => removeRow(i)} className="rounded-md p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                        <Field label="Nazwa" value={row.name} onChange={v => updRow(i, 'name', v)} placeholder="Zaliczka" />
                        <Field label="Warunek" value={row.condition} onChange={v => updRow(i, 'condition', v)} placeholder="Podpisanie umowy" />
                        <Field label="Kwota (zł)" value={row.amount} onChange={v => updRow(i, 'amount', v)} placeholder="3000" />
                        <Field label="Procent (%)" value={row.percent} onChange={v => updRow(i, 'percent', v)} placeholder="30" />
                    </div>
                ))}
                <button type="button" onClick={addRow} className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus className="h-3 w-3" />Dodaj płatność</button>
                <div className="border-t border-border pt-3" />
                <Field label="Numer konta" value={pay.accountNumber} onChange={v => setPay(p => ({ ...p, accountNumber: v }))} placeholder="PL00 0000 0000 0000 0000" />
                <Field label="Termin płatności faktury (dni)" value={pay.paymentDays} onChange={v => setPay(p => ({ ...p, paymentDays: v }))} placeholder="14" />
            </div>
            <SaveBar onSave={save} onClose={onClose} />
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

function SpecEditor({ blocks, onSave, onClose }: { blocks: ContractDedicatedBlocks; onSave: (b: ContractDedicatedBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.spec)
    return <SimpleEditor title="Specyfikacja techniczna" onSave={() => onSave({ ...blocks, spec: v })} onClose={onClose}>
        <Field label="Termin zatwierdzenia (dni robocze)" value={v.approvalDays} onChange={val => setV(p => ({ ...p, approvalDays: val }))} placeholder="5" />
    </SimpleEditor>
}

function ObligationsEditor({ blocks, onSave, onClose }: { blocks: ContractDedicatedBlocks; onSave: (b: ContractDedicatedBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.obligations)
    return <SimpleEditor title="Obowiązki zamawiającego" onSave={() => onSave({ ...blocks, obligations: v })} onClose={onClose}>
        <Field label="Termin dostępności do konsultacji (dni robocze)" value={v.availabilityDays} onChange={val => setV(p => ({ ...p, availabilityDays: val }))} placeholder="2" />
        <Field label="Termin odpowiedzi na pytania (dni robocze)" value={v.responseDays} onChange={val => setV(p => ({ ...p, responseDays: val }))} placeholder="2" />
    </SimpleEditor>
}

function TimelineEditor({ blocks, onSave, onClose }: { blocks: ContractDedicatedBlocks; onSave: (b: ContractDedicatedBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.timeline)
    return <SimpleEditor title="Terminy realizacji" onSave={() => onSave({ ...blocks, timeline: v })} onClose={onClose}>
        <Field label="Data rozpoczęcia" value={v.startDate} onChange={val => setV(p => ({ ...p, startDate: val }))} placeholder="DD.MM.RRRR" />
        <Field label="Dni od podpisania umowy (alternatywnie)" value={v.startDays} onChange={val => setV(p => ({ ...p, startDays: val }))} placeholder="7" />
        <Field label="Data zakończenia" value={v.endDate} onChange={val => setV(p => ({ ...p, endDate: val }))} placeholder="DD.MM.RRRR" />
    </SimpleEditor>
}

function ScopeCreepEditor({ blocks, onSave, onClose }: { blocks: ContractDedicatedBlocks; onSave: (b: ContractDedicatedBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.scopeCreep)
    return <SimpleEditor title="Zmiany zakresu" onSave={() => onSave({ ...blocks, scopeCreep: v })} onClose={onClose}>
        <Field label="Czas wyceny zmiany (dni robocze)" value={v.evaluationDays} onChange={val => setV(p => ({ ...p, evaluationDays: val }))} placeholder="3" />
        <Field label="Limit darmowych godzin zmian (h)" value={v.freeHoursLimit} onChange={val => setV(p => ({ ...p, freeHoursLimit: val }))} placeholder="2" />
    </SimpleEditor>
}

function AcceptanceEditor({ blocks, onSave, onClose }: { blocks: ContractDedicatedBlocks; onSave: (b: ContractDedicatedBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.acceptance)
    return <SimpleEditor title="Odbiory etapowe" onSave={() => onSave({ ...blocks, acceptance: v })} onClose={onClose}>
        <Field label="Termin weryfikacji przez zamawiającego (dni robocze)" value={v.reviewDays} onChange={val => setV(p => ({ ...p, reviewDays: val }))} placeholder="5" />
        <Field label="Czas szkolenia użytkowników (godziny)" value={v.trainingHours} onChange={val => setV(p => ({ ...p, trainingHours: val }))} placeholder="4" />
    </SimpleEditor>
}

function InfrastructureEditor({ blocks, onSave, onClose }: { blocks: ContractDedicatedBlocks; onSave: (b: ContractDedicatedBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.infrastructure)
    return <SimpleEditor title="Infrastruktura" onSave={() => onSave({ ...blocks, infrastructure: v })} onClose={onClose}>
        <Field label="Środowisko produkcyjne zapewnia" value={v.productionProvider} onChange={val => setV(p => ({ ...p, productionProvider: val }))} placeholder="Zamawiający / Wykonawca" />
    </SimpleEditor>
}

function ConfidentialityEditor({ blocks, onSave, onClose }: { blocks: ContractDedicatedBlocks; onSave: (b: ContractDedicatedBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.confidentiality)
    return <SimpleEditor title="Poufność" onSave={() => onSave({ ...blocks, confidentiality: v })} onClose={onClose}>
        <Field label="Lata obowiązku poufności po zakończeniu umowy" value={v.years} onChange={val => setV(p => ({ ...p, years: val }))} placeholder="3" />
    </SimpleEditor>
}

function WarrantyEditor({ blocks, onSave, onClose }: { blocks: ContractDedicatedBlocks; onSave: (b: ContractDedicatedBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.warranty)
    return <SimpleEditor title="Odpowiedzialność i gwarancja" onSave={() => onSave({ ...blocks, warranty: v })} onClose={onClose}>
        <Field label="Okres gwarancji (miesiące)" value={v.months} onChange={val => setV(p => ({ ...p, months: val }))} placeholder="12" />
        <Field label="Termin usunięcia błędów (dni robocze)" value={v.fixDays} onChange={val => setV(p => ({ ...p, fixDays: val }))} placeholder="5" />
    </SimpleEditor>
}

function TerminationEditor({ blocks, onSave, onClose }: { blocks: ContractDedicatedBlocks; onSave: (b: ContractDedicatedBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.termination)
    return <SimpleEditor title="Rozwiązanie umowy" onSave={() => onSave({ ...blocks, termination: v })} onClose={onClose}>
        <Field label="Okres wypowiedzenia (dni)" value={v.noticeDays} onChange={val => setV(p => ({ ...p, noticeDays: val }))} placeholder="30" />
        <Field label="Natychmiastowe rozwiązanie: opóźnienie płatności (dni)" value={v.immediatePaymentDays} onChange={val => setV(p => ({ ...p, immediatePaymentDays: val }))} placeholder="14" />
        <Field label="Natychmiastowe rozwiązanie: brak współpracy (dni)" value={v.noCoopDays} onChange={val => setV(p => ({ ...p, noCoopDays: val }))} placeholder="14" />
    </SimpleEditor>
}

function SignaturesEditor({ blocks, onSave, onClose }: { blocks: ContractDedicatedBlocks; onSave: (b: ContractDedicatedBlocks) => void; onClose: () => void }) {
    const [v, setV] = useState(blocks.signatures)
    return <SimpleEditor title="Podpisy" onSave={() => onSave({ ...blocks, signatures: v })} onClose={onClose}>
        <SectionTitle>Wykonawca</SectionTitle>
        <Field label="Imię i nazwisko" value={v.contractorName} onChange={val => setV(p => ({ ...p, contractorName: val }))} placeholder="Jan Kowalski" />
        <Field label="Data" value={v.contractorDate} onChange={val => setV(p => ({ ...p, contractorDate: val }))} placeholder="DD.MM.RRRR" />
        <div className="border-t border-border pt-3" />
        <SectionTitle>Zamawiający</SectionTitle>
        <Field label="Imię i nazwisko" value={v.clientName} onChange={val => setV(p => ({ ...p, clientName: val }))} placeholder="Anna Nowak" />
        <Field label="Data" value={v.clientDate} onChange={val => setV(p => ({ ...p, clientDate: val }))} placeholder="DD.MM.RRRR" />
        <div className="border-t border-border pt-3" />
        <TextArea label="Nota o załączniku" value={v.footerNote} onChange={val => setV(p => ({ ...p, footerNote: val }))} rows={2} />
    </SimpleEditor>
}

// ── Main export ────────────────────────────────────────────────────────────────

export function ContractDedicatedBlockEditorPanel({
    sectionKey, blocks, onSave, onClose, aiContext,
}: { sectionKey: DedicatedEditableSectionKey; blocks: ContractDedicatedBlocks; onSave: (b: ContractDedicatedBlocks) => void; onClose: () => void; aiContext?: OfferContext }) {
    if (sectionKey === 'header') return <HeaderEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'parties') return <PartiesEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'subject') return <SubjectEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'phases') return <PhasesEditor blocks={blocks} onSave={onSave} onClose={onClose} aiContext={aiContext} />
    if (sectionKey === 'payment') return <PaymentEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'spec') return <SpecEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'obligations') return <ObligationsEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'timeline') return <TimelineEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'scopeCreep') return <ScopeCreepEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'acceptance') return <AcceptanceEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'infrastructure') return <InfrastructureEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'confidentiality') return <ConfidentialityEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'warranty') return <WarrantyEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'termination') return <TerminationEditor blocks={blocks} onSave={onSave} onClose={onClose} />
    if (sectionKey === 'signatures') return <SignaturesEditor blocks={blocks} onSave={onSave} onClose={onClose} />

    // Generic fallback for gdpr, copyright, general
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title={DEDICATED_SECTION_LABELS[sectionKey as DedicatedSectionKey] ?? sectionKey} onClose={onClose} />
            <div className="flex-1 flex items-center justify-center p-4">
                <p className="text-sm text-muted-foreground text-center">Ta sekcja zawiera tekst standardowy — edytowalna przez modyfikację szablonu.</p>
            </div>
            <div className="border-t border-border px-4 py-3">
                <Button variant="outline" size="sm" onClick={onClose} className="w-full">Zamknij</Button>
            </div>
        </div>
    )
}

// ── Section Manager Panel ──────────────────────────────────────────────────────

export function DedicatedSectionManagerPanel({
    blocks, onSave, onClose,
}: { blocks: ContractDedicatedBlocks; onSave: (b: ContractDedicatedBlocks) => void; onClose: () => void }) {
    const [sections, setSections] = useState(blocks.sections)
    const defaults = buildDefaultContractDedicatedBlocks()
    const removed = ALL_DEDICATED_SECTION_KEYS.filter(k => !sections.includes(k))

    const move = (i: number, dir: -1 | 1) => {
        const next = [...sections]; const j = i + dir
        if (j < 0 || j >= next.length) return
        ;[next[i], next[j]] = [next[j], next[i]]; setSections(next)
    }
    const remove = (k: DedicatedSectionKey) => setSections(p => p.filter(s => s !== k))
    const restore = (k: DedicatedSectionKey) => setSections(p => [...p, k])
    const reset = () => setSections([...defaults.sections])

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
                        <span className="flex-1 text-sm text-foreground">{DEDICATED_SECTION_LABELS[key] ?? key}</span>
                        <button type="button" onClick={() => remove(key)} className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"><EyeOff className="h-3.5 w-3.5" /></button>
                    </div>
                ))}
                {removed.length > 0 && (
                    <div className="pt-2 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Ukryte sekcje</p>
                        {removed.map(key => (
                            <div key={key} className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 mb-1.5 opacity-60">
                                <span className="flex-1 text-sm text-muted-foreground">{DEDICATED_SECTION_LABELS[key] ?? key}</span>
                                <button type="button" onClick={() => restore(key)} className="rounded-md p-1 text-muted-foreground hover:text-foreground"><Eye className="h-3.5 w-3.5" /></button>
                            </div>
                        ))}
                    </div>
                )}
                <button type="button" onClick={reset} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2">
                    <RotateCcw className="h-3 w-3" />Przywróć domyślne
                </button>
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, sections })} onClose={onClose} />
        </div>
    )
}

export type { DedicatedEditableSectionKey } from '@/lib/pdf/contract-dedicated-blocks'
