// src/components/contracts/editor/ContractBlockEditorPanel.tsx
// Side panel for editing individual contract sections in the "Krótka" template.
'use client'

import { useState } from 'react'
import { X, Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui'
import type {
    ContractShortBlocks,
    ContractSectionKey,
} from '@/lib/pdf/contract-short-blocks'
import { ALL_CONTRACT_SECTION_KEYS as SECTION_KEYS } from '@/lib/pdf/contract-short-blocks'

// ── Shared field components ───────────────────────────────────────────────────

function Field({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
}: {
    label: string
    value: string
    onChange: (v: string) => void
    placeholder?: string
    type?: string
}) {
    return (
        <div className="space-y-1">
            <label className="block text-xs font-medium text-muted-foreground">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
        </div>
    )
}

function TextArea({
    label,
    value,
    onChange,
    rows = 3,
}: {
    label: string
    value: string
    onChange: (v: string) => void
    rows?: number
}) {
    return (
        <div className="space-y-1">
            <label className="block text-xs font-medium text-muted-foreground">{label}</label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
            />
        </div>
    )
}

function CheckboxField({
    label,
    checked,
    onChange,
}: {
    label: string
    checked: boolean
    onChange: (v: boolean) => void
}) {
    return (
        <label className="flex items-center gap-2 cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="rounded border-border text-primary"
            />
            <span className="text-sm text-foreground">{label}</span>
        </label>
    )
}

function SectionTitle({
    value,
    onChange,
}: {
    value: string
    onChange: (v: string) => void
}) {
    return <Field label="Tytuł sekcji" value={value} onChange={onChange} />
}

// ── Items list editor ─────────────────────────────────────────────────────────

function ItemsList({
    items,
    onChange,
    rows = 2,
}: {
    items: string[]
    onChange: (items: string[]) => void
    rows?: number
}) {
    const update = (i: number, v: string) => {
        const next = [...items]
        next[i] = v
        onChange(next)
    }
    const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
    const add = () => onChange([...items, ''])

    return (
        <div className="space-y-2">
            {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-2 flex-shrink-0" />
                    <textarea
                        value={item}
                        onChange={(e) => update(i, e.target.value)}
                        rows={rows}
                        className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
                    />
                    <button
                        type="button"
                        onClick={() => remove(i)}
                        className="mt-2 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={add}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium"
            >
                <Plus className="h-3.5 w-3.5" />
                Dodaj pozycję
            </button>
        </div>
    )
}

// ── Panel header ──────────────────────────────────────────────────────────────

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
    return (
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}

// ── Section editors ───────────────────────────────────────────────────────────

function HeaderEditor({
    blocks,
    onSave,
    onClose,
}: {
    blocks: ContractShortBlocks
    onSave: (b: ContractShortBlocks) => void
    onClose: () => void
}) {
    const [local, setLocal] = useState(blocks.header)

    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Nagłówek dokumentu" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <Field label="Podtytuł (kicker)" value={local.kicker} onChange={(v) => setLocal((p) => ({ ...p, kicker: v }))} />
                <Field label="Tytuł dokumentu" value={local.title} onChange={(v) => setLocal((p) => ({ ...p, title: v }))} />
                <Field label="Nr umowy" value={local.contractNumber} onChange={(v) => setLocal((p) => ({ ...p, contractNumber: v }))} placeholder="np. 01/2026" />
                <Field label="Miejscowość" value={local.city} onChange={(v) => setLocal((p) => ({ ...p, city: v }))} placeholder="np. Warszawa" />
                <Field label="Data zawarcia" value={local.date} onChange={(v) => setLocal((p) => ({ ...p, date: v }))} placeholder="np. 7 czerwca 2026" />
            </div>
            <div className="border-t border-border p-4">
                <Button className="w-full" onClick={() => onSave({ ...blocks, header: local })}>
                    Zapisz
                </Button>
            </div>
        </div>
    )
}

function PartiesEditor({
    blocks,
    onSave,
    onClose,
}: {
    blocks: ContractShortBlocks
    onSave: (b: ContractShortBlocks) => void
    onClose: () => void
}) {
    const [local, setLocal] = useState(blocks.parties)

    const updateContractor = (field: string, v: string) =>
        setLocal((p) => ({ ...p, contractor: { ...p.contractor, [field]: v } }))
    const updateClient = (field: string, v: string) =>
        setLocal((p) => ({ ...p, client: { ...p.client, [field]: v } }))

    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="§ Strony Umowy" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />

                <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {local.contractorRole}
                    </p>
                    <Field label="Nazwa firmy" value={local.contractor.firmName} onChange={(v) => updateContractor('firmName', v)} />
                    <Field label="Adres" value={local.contractor.address} onChange={(v) => updateContractor('address', v)} />
                    <Field label="NIP" value={local.contractor.nip} onChange={(v) => updateContractor('nip', v)} />
                    <Field label="Reprezentuje" value={local.contractor.representative} onChange={(v) => updateContractor('representative', v)} />
                </div>

                <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {local.clientRole}
                    </p>
                    <Field label="Firma / Imię i nazwisko" value={local.client.firmName} onChange={(v) => updateClient('firmName', v)} />
                    <Field label="Adres" value={local.client.address} onChange={(v) => updateClient('address', v)} />
                    <Field label="NIP" value={local.client.nip} onChange={(v) => updateClient('nip', v)} />
                    <Field label="Reprezentuje" value={local.client.representative} onChange={(v) => updateClient('representative', v)} />
                </div>
            </div>
            <div className="border-t border-border p-4">
                <Button className="w-full" onClick={() => onSave({ ...blocks, parties: local })}>
                    Zapisz
                </Button>
            </div>
        </div>
    )
}

function SubjectEditor({
    blocks,
    onSave,
    onClose,
}: {
    blocks: ContractShortBlocks
    onSave: (b: ContractShortBlocks) => void
    onClose: () => void
}) {
    const [local, setLocal] = useState(blocks.subject)

    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="§ Przedmiot Umowy" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />

                <div className="space-y-2">
                    <label className="block text-xs font-medium text-muted-foreground">Typ zlecenia</label>
                    <CheckboxField
                        label="Wykonanie nowej strony od podstaw"
                        checked={local.isNewSite}
                        onChange={(v) => setLocal((p) => ({ ...p, isNewSite: v }))}
                    />
                    <CheckboxField
                        label="Modernizacja istniejącej strony"
                        checked={local.isModernization}
                        onChange={(v) => setLocal((p) => ({ ...p, isModernization: v }))}
                    />
                </div>

                <Field
                    label="Technologia realizacji"
                    value={local.technology}
                    onChange={(v) => setLocal((p) => ({ ...p, technology: v }))}
                    placeholder="np. WordPress, React, Next.js"
                />

                <div className="space-y-1">
                    <label className="block text-xs font-medium text-muted-foreground">Zakres prac</label>
                    <ItemsList
                        items={local.scopeItems}
                        onChange={(items) => setLocal((p) => ({ ...p, scopeItems: items }))}
                        rows={2}
                    />
                </div>

                <TextArea
                    label="Uwaga końcowa (punkt 4)"
                    value={local.additionalNote}
                    onChange={(v) => setLocal((p) => ({ ...p, additionalNote: v }))}
                    rows={3}
                />
            </div>
            <div className="border-t border-border p-4">
                <Button className="w-full" onClick={() => onSave({ ...blocks, subject: local })}>
                    Zapisz
                </Button>
            </div>
        </div>
    )
}

function DeadlineEditor({
    blocks,
    onSave,
    onClose,
}: {
    blocks: ContractShortBlocks
    onSave: (b: ContractShortBlocks) => void
    onClose: () => void
}) {
    const [local, setLocal] = useState(blocks.deadline)

    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="§ Termin Realizacji" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <Field label="Data rozpoczęcia prac" value={local.startDate} onChange={(v) => setLocal((p) => ({ ...p, startDate: v }))} placeholder="np. 1 lipca 2026" />
                <Field label="Termin przekazania strony" value={local.endDate} onChange={(v) => setLocal((p) => ({ ...p, endDate: v }))} placeholder="np. 31 sierpnia 2026" />
            </div>
            <div className="border-t border-border p-4">
                <Button className="w-full" onClick={() => onSave({ ...blocks, deadline: local })}>
                    Zapisz
                </Button>
            </div>
        </div>
    )
}

function PaymentEditor({
    blocks,
    onSave,
    onClose,
}: {
    blocks: ContractShortBlocks
    onSave: (b: ContractShortBlocks) => void
    onClose: () => void
}) {
    const [local, setLocal] = useState(blocks.payment)

    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="§ Wynagrodzenie" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />

                <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kwoty</p>
                    <Field label="Wartość netto (zł)" value={local.netAmount} onChange={(v) => setLocal((p) => ({ ...p, netAmount: v }))} placeholder="np. 8 000,00" />
                    <Field label="Stawka VAT (%)" value={local.vatRate} onChange={(v) => setLocal((p) => ({ ...p, vatRate: v }))} placeholder="23" />
                    <Field label="Kwota VAT (zł)" value={local.vatAmount} onChange={(v) => setLocal((p) => ({ ...p, vatAmount: v }))} placeholder="np. 1 840,00" />
                    <Field label="Wartość brutto (zł)" value={local.grossAmount} onChange={(v) => setLocal((p) => ({ ...p, grossAmount: v }))} placeholder="np. 9 840,00" />
                </div>

                <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Harmonogram płatności</p>
                    <Field label="Zaliczka (%)" value={local.advancePercent} onChange={(v) => setLocal((p) => ({ ...p, advancePercent: v }))} placeholder="50" />
                    <Field label="Płatność końcowa (%)" value={local.finalPercent} onChange={(v) => setLocal((p) => ({ ...p, finalPercent: v }))} placeholder="50" />
                    <Field label="Termin płatności końcowej (dni)" value={local.finalPaymentDays} onChange={(v) => setLocal((p) => ({ ...p, finalPaymentDays: v }))} placeholder="14" />
                </div>

                <Field label="Nr rachunku bankowego Wykonawcy" value={local.bankAccount} onChange={(v) => setLocal((p) => ({ ...p, bankAccount: v }))} placeholder="PL00 0000 0000 0000 0000 0000 0000" />
            </div>
            <div className="border-t border-border p-4">
                <Button className="w-full" onClick={() => onSave({ ...blocks, payment: local })}>
                    Zapisz
                </Button>
            </div>
        </div>
    )
}

function ObligationsEditor({
    blocks,
    onSave,
    onClose,
}: {
    blocks: ContractShortBlocks
    onSave: (b: ContractShortBlocks) => void
    onClose: () => void
}) {
    const [local, setLocal] = useState(blocks.obligations)

    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="§ Obowiązki Zamawiającego" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <Field label="Termin dostarczenia materiałów (dni)" value={local.materialsDays} onChange={(v) => setLocal((p) => ({ ...p, materialsDays: v }))} placeholder="7" />
                <Field label="Termin udzielenia dostępu (dni)" value={local.accessDays} onChange={(v) => setLocal((p) => ({ ...p, accessDays: v }))} placeholder="7" />
                <Field label="Czas na odpowiedź / akceptację (dni rob.)" value={local.responseDays} onChange={(v) => setLocal((p) => ({ ...p, responseDays: v }))} placeholder="3" />
            </div>
            <div className="border-t border-border p-4">
                <Button className="w-full" onClick={() => onSave({ ...blocks, obligations: local })}>
                    Zapisz
                </Button>
            </div>
        </div>
    )
}

function AcceptanceEditor({
    blocks,
    onSave,
    onClose,
}: {
    blocks: ContractShortBlocks
    onSave: (b: ContractShortBlocks) => void
    onClose: () => void
}) {
    const [local, setLocal] = useState(blocks.acceptance)

    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="§ Odbiór i Poprawki" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <Field label="Liczba rund poprawek" value={local.revisionRounds} onChange={(v) => setLocal((p) => ({ ...p, revisionRounds: v }))} placeholder="2" />
                <Field label="Czas na zgłoszenie uwag (dni rob.)" value={local.reviewDays} onChange={(v) => setLocal((p) => ({ ...p, reviewDays: v }))} placeholder="5" />
                <Field label="Stawka za dodatkowe poprawki (zł netto/godz.)" value={local.hourlyRate} onChange={(v) => setLocal((p) => ({ ...p, hourlyRate: v }))} placeholder="np. 120" />
            </div>
            <div className="border-t border-border p-4">
                <Button className="w-full" onClick={() => onSave({ ...blocks, acceptance: local })}>
                    Zapisz
                </Button>
            </div>
        </div>
    )
}

function CopyrightEditor({
    blocks,
    onSave,
    onClose,
}: {
    blocks: ContractShortBlocks
    onSave: (b: ContractShortBlocks) => void
    onClose: () => void
}) {
    const [local, setLocal] = useState(blocks.copyright)

    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="§ Prawa Autorskie" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <div className="space-y-1">
                    <label className="block text-xs font-medium text-muted-foreground">Punkty (obsługują HTML: &lt;strong&gt;, &lt;em&gt;)</label>
                    <ItemsList
                        items={local.items}
                        onChange={(items) => setLocal((p) => ({ ...p, items }))}
                        rows={3}
                    />
                </div>
            </div>
            <div className="border-t border-border p-4">
                <Button className="w-full" onClick={() => onSave({ ...blocks, copyright: local })}>
                    Zapisz
                </Button>
            </div>
        </div>
    )
}

function WarrantyEditor({
    blocks,
    onSave,
    onClose,
}: {
    blocks: ContractShortBlocks
    onSave: (b: ContractShortBlocks) => void
    onClose: () => void
}) {
    const [local, setLocal] = useState(blocks.warranty)

    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="§ Gwarancja" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <Field label="Okres gwarancji (miesiące)" value={local.warrantyMonths} onChange={(v) => setLocal((p) => ({ ...p, warrantyMonths: v }))} placeholder="12" />
                <Field label="Czas usunięcia błędu (dni rob.)" value={local.fixDays} onChange={(v) => setLocal((p) => ({ ...p, fixDays: v }))} placeholder="10" />
            </div>
            <div className="border-t border-border p-4">
                <Button className="w-full" onClick={() => onSave({ ...blocks, warranty: local })}>
                    Zapisz
                </Button>
            </div>
        </div>
    )
}

function ConfidentialityEditor({
    blocks,
    onSave,
    onClose,
}: {
    blocks: ContractShortBlocks
    onSave: (b: ContractShortBlocks) => void
    onClose: () => void
}) {
    const [local, setLocal] = useState(blocks.confidentiality)

    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="§ Poufność" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <div className="space-y-1">
                    <label className="block text-xs font-medium text-muted-foreground">Punkty (obsługują HTML: &lt;strong&gt;)</label>
                    <ItemsList
                        items={local.items}
                        onChange={(items) => setLocal((p) => ({ ...p, items }))}
                        rows={3}
                    />
                </div>
            </div>
            <div className="border-t border-border p-4">
                <Button className="w-full" onClick={() => onSave({ ...blocks, confidentiality: local })}>
                    Zapisz
                </Button>
            </div>
        </div>
    )
}

function FinalProvisionsEditor({
    blocks,
    onSave,
    onClose,
}: {
    blocks: ContractShortBlocks
    onSave: (b: ContractShortBlocks) => void
    onClose: () => void
}) {
    const [local, setLocal] = useState(blocks.finalProvisions)

    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="§ Postanowienia Końcowe" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <div className="space-y-1">
                    <label className="block text-xs font-medium text-muted-foreground">Punkty (obsługują HTML: &lt;strong&gt;)</label>
                    <ItemsList
                        items={local.items}
                        onChange={(items) => setLocal((p) => ({ ...p, items }))}
                        rows={2}
                    />
                </div>
            </div>
            <div className="border-t border-border p-4">
                <Button className="w-full" onClick={() => onSave({ ...blocks, finalProvisions: local })}>
                    Zapisz
                </Button>
            </div>
        </div>
    )
}

function SignaturesEditor({
    blocks,
    onSave,
    onClose,
}: {
    blocks: ContractShortBlocks
    onSave: (b: ContractShortBlocks) => void
    onClose: () => void
}) {
    const [local, setLocal] = useState(blocks.signatures)

    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Podpisy Stron" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Wykonawca</p>
                    <Field label="Tytuł kolumny" value={local.contractorTitle} onChange={(v) => setLocal((p) => ({ ...p, contractorTitle: v }))} />
                    <Field label="Firma / Imię i nazwisko" value={local.contractorFirm} onChange={(v) => setLocal((p) => ({ ...p, contractorFirm: v }))} />
                    <Field label="Reprezentowany przez" value={local.contractorRepresentative} onChange={(v) => setLocal((p) => ({ ...p, contractorRepresentative: v }))} />
                    <Field label="Data" value={local.contractorDate} onChange={(v) => setLocal((p) => ({ ...p, contractorDate: v }))} placeholder="np. 7 czerwca 2026" />
                </div>
                <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zamawiający</p>
                    <Field label="Tytuł kolumny" value={local.clientTitle} onChange={(v) => setLocal((p) => ({ ...p, clientTitle: v }))} />
                    <Field label="Firma / Imię i nazwisko" value={local.clientFirm} onChange={(v) => setLocal((p) => ({ ...p, clientFirm: v }))} />
                    <Field label="Reprezentowany przez" value={local.clientRepresentative} onChange={(v) => setLocal((p) => ({ ...p, clientRepresentative: v }))} />
                    <Field label="Data" value={local.clientDate} onChange={(v) => setLocal((p) => ({ ...p, clientDate: v }))} placeholder="np. 7 czerwca 2026" />
                </div>
            </div>
            <div className="border-t border-border p-4">
                <Button className="w-full" onClick={() => onSave({ ...blocks, signatures: local })}>
                    Zapisz
                </Button>
            </div>
        </div>
    )
}

// ── Section Manager Panel ─────────────────────────────────────────────────────

const SECTION_LABELS: Record<ContractSectionKey, string> = {
    parties: 'Strony Umowy',
    subject: 'Przedmiot Umowy',
    deadline: 'Termin Realizacji',
    payment: 'Wynagrodzenie',
    obligations: 'Obowiązki Zamawiającego',
    acceptance: 'Odbiór i Poprawki',
    copyright: 'Prawa Autorskie',
    warranty: 'Gwarancja',
    confidentiality: 'Poufność',
    finalProvisions: 'Postanowienia Końcowe',
}

export function SectionManagerPanel({
    blocks,
    onSave,
    onClose,
}: {
    blocks: ContractShortBlocks
    onSave: (b: ContractShortBlocks) => void
    onClose: () => void
}) {
    const activeSections = blocks.sections
    const removedSections = SECTION_KEYS.filter((k) => !activeSections.includes(k))

    const toggleSection = (key: ContractSectionKey) => {
        const isActive = activeSections.includes(key)
        const next = isActive
            ? activeSections.filter((k) => k !== key)
            : [...activeSections, key]
        // Restore in original order
        const ordered = SECTION_KEYS.filter((k) => next.includes(k))
        // Update enabled flag on the block
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawBlock = blocks[key] as any
        const updatedBlock = { ...rawBlock }
        if ('enabled' in updatedBlock) updatedBlock.enabled = !isActive
        onSave({ ...blocks, [key]: updatedBlock, sections: ordered })
    }

    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Sekcje dokumentu" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Aktywne sekcje</p>
                    {activeSections.map((key, idx) => (
                        <div
                            key={key}
                            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-4">§{idx + 1}</span>
                                <span className="text-sm text-foreground">{SECTION_LABELS[key]}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => toggleSection(key)}
                                className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Usuń sekcję"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>

                {removedSections.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Usunięte z dokumentu</p>
                        {removedSections.map((key) => (
                            <div
                                key={key}
                                className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2"
                            >
                                <span className="text-sm text-muted-foreground">{SECTION_LABELS[key]}</span>
                                <button
                                    type="button"
                                    onClick={() => toggleSection(key)}
                                    className="text-xs text-primary hover:text-primary/80 font-medium"
                                >
                                    + Przywróć
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Main export ───────────────────────────────────────────────────────────────

export type EditableSectionKey = ContractSectionKey | 'header' | 'signatures'

export interface ContractBlockEditorPanelProps {
    sectionKey: EditableSectionKey
    blocks: ContractShortBlocks
    onSave: (blocks: ContractShortBlocks) => void
    onClose: () => void
}

export function ContractBlockEditorPanel({
    sectionKey,
    blocks,
    onSave,
    onClose,
}: ContractBlockEditorPanelProps) {
    switch (sectionKey) {
        case 'header':
            return <HeaderEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'parties':
            return <PartiesEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'subject':
            return <SubjectEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'deadline':
            return <DeadlineEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'payment':
            return <PaymentEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'obligations':
            return <ObligationsEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'acceptance':
            return <AcceptanceEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'copyright':
            return <CopyrightEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'warranty':
            return <WarrantyEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'confidentiality':
            return <ConfidentialityEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'finalProvisions':
            return <FinalProvisionsEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'signatures':
            return <SignaturesEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        default:
            return null
    }
}
