// src/components/contracts/editor/ContractServicesBlockEditorPanel.tsx
// Side panel for editing individual sections of the "Sklep internetowy" contract template.
'use client'

import { useState } from 'react'
import { X, Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui'
import type {
    ContractServicesBlocks,
    ContractServicesSectionKey,
    ServicesScopeItem,
    ServicesPaymentRow,
} from '@/lib/pdf/contract-services-blocks'
import { ALL_SERVICES_SECTION_KEYS } from '@/lib/pdf/contract-services-blocks'
import { AiGenerateButton, type OfferContext } from '@/components/offers/editor/block-editors'

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

function RadioGroup({
    label,
    options,
    value,
    onChange,
}: {
    label: string
    options: { value: string; label: string }[]
    value: string
    onChange: (v: string) => void
}) {
    return (
        <div className="space-y-1">
            <label className="block text-xs font-medium text-muted-foreground">{label}</label>
            <div className="flex gap-3">
                {options.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer text-sm">
                        <input
                            type="radio"
                            value={opt.value}
                            checked={value === opt.value}
                            onChange={() => onChange(opt.value)}
                            className="text-primary"
                        />
                        {opt.label}
                    </label>
                ))}
            </div>
        </div>
    )
}

function SectionTitle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return <Field label="Tytuł sekcji" value={value} onChange={onChange} />
}

function StringList({
    label,
    items,
    onChange,
}: {
    label?: string
    items: string[]
    onChange: (items: string[]) => void
}) {
    const update = (i: number, v: string) => {
        const next = [...items]; next[i] = v; onChange(next)
    }
    const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
    const add = () => onChange([...items, ''])
    const move = (i: number, dir: -1 | 1) => {
        const j = i + dir
        if (j < 0 || j >= items.length) return
        const next = [...items]; [next[i], next[j]] = [next[j], next[i]]; onChange(next)
    }

    return (
        <div className="space-y-2">
            {label && <label className="block text-xs font-medium text-muted-foreground">{label}</label>}
            {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-2 flex-shrink-0" />
                    <textarea
                        value={item}
                        onChange={(e) => update(i, e.target.value)}
                        rows={2}
                        className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
                    />
                    <div className="flex flex-col gap-0.5 flex-shrink-0 mt-1">
                        <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => remove(i)} className="p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                </div>
            ))}
            <button type="button" onClick={add} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium">
                <Plus className="h-3.5 w-3.5" /> Dodaj
            </button>
        </div>
    )
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
    return (
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card flex-shrink-0">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}

function SaveBar({ onSave }: { onSave: () => void }) {
    return (
        <div className="border-t border-border p-4 flex-shrink-0">
            <Button className="w-full" onClick={onSave}>Zapisz</Button>
        </div>
    )
}

// ── Section editors ───────────────────────────────────────────────────────────

function HeaderEditor({ blocks, onSave, onClose }: { blocks: ContractServicesBlocks; onSave: (b: ContractServicesBlocks) => void; onClose: () => void }) {
    const [local, setLocal] = useState(blocks.header)
    const set = (field: string, v: string) => setLocal((p) => ({ ...p, [field]: v }))
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Nagłówek dokumentu" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <Field label="Tytuł umowy" value={local.contractTitle} onChange={(v) => set('contractTitle', v)} />
                <Field label="Nr umowy" value={local.contractNumber} onChange={(v) => set('contractNumber', v)} placeholder="np. 01/2026" />
                <Field label="Data zawarcia" value={local.date} onChange={(v) => set('date', v)} placeholder="np. 7 czerwca 2026" />
                <Field label="Miejscowość" value={local.place} onChange={(v) => set('place', v)} placeholder="np. Warszawa" />
                <Field label="Strona WWW (logo)" value={local.websiteUrl} onChange={(v) => set('websiteUrl', v)} placeholder="np. www.twoja-firma.pl" />
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, header: local })} />
        </div>
    )
}

function PartiesEditor({ blocks, onSave, onClose }: { blocks: ContractServicesBlocks; onSave: (b: ContractServicesBlocks) => void; onClose: () => void }) {
    const [local, setLocal] = useState(blocks.parties)
    const updC = (field: string, v: string) => setLocal((p) => ({ ...p, contractor: { ...p.contractor, [field]: v } }))
    const updCl = (field: string, v: string) => setLocal((p) => ({ ...p, client: { ...p.client, [field]: v } }))
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Strony umowy" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Wykonawca</p>
                    <Field label="Nazwa firmy / imię i nazwisko" value={local.contractor.firmName} onChange={(v) => updC('firmName', v)} />
                    <Field label="Adres" value={local.contractor.address} onChange={(v) => updC('address', v)} />
                    <Field label="NIP" value={local.contractor.nip} onChange={(v) => updC('nip', v)} />
                    <Field label="Email" value={local.contractor.email} onChange={(v) => updC('email', v)} />
                    <Field label="Telefon" value={local.contractor.phone} onChange={(v) => updC('phone', v)} />
                    <Field label="Reprezentowany przez" value={local.contractor.representative} onChange={(v) => updC('representative', v)} />
                </div>
                <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zamawiający</p>
                    <Field label="Nazwa firmy / imię i nazwisko" value={local.client.firmName} onChange={(v) => updCl('firmName', v)} />
                    <Field label="Adres" value={local.client.address} onChange={(v) => updCl('address', v)} />
                    <Field label="NIP" value={local.client.nip} onChange={(v) => updCl('nip', v)} />
                    <Field label="Email" value={local.client.email} onChange={(v) => updCl('email', v)} />
                    <Field label="Telefon" value={local.client.phone} onChange={(v) => updCl('phone', v)} />
                    <Field label="Reprezentowany przez" value={local.client.representative} onChange={(v) => updCl('representative', v)} />
                </div>
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, parties: local })} />
        </div>
    )
}

function SubjectEditor({ blocks, onSave, onClose }: { blocks: ContractServicesBlocks; onSave: (b: ContractServicesBlocks) => void; onClose: () => void }) {
    const [local, setLocal] = useState(blocks.subject)
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Przedmiot umowy" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <Field label="Domena" value={local.domain} onChange={(v) => setLocal((p) => ({ ...p, domain: v }))} placeholder="np. moja-strona.pl" />
                <Field label="Technologia" value={local.technology} onChange={(v) => setLocal((p) => ({ ...p, technology: v }))} placeholder="np. WordPress, Next.js" />
                <RadioGroup
                    label="Projekt graficzny"
                    options={[{ value: 'contractor', label: 'Wykonawca' }, { value: 'client', label: 'Zamawiający' }]}
                    value={local.graphicBy}
                    onChange={(v) => setLocal((p) => ({ ...p, graphicBy: v as 'contractor' | 'client' }))}
                />
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, subject: local })} />
        </div>
    )
}

function ScopeEditor({ blocks, onSave, onClose, aiContext }: { blocks: ContractServicesBlocks; onSave: (b: ContractServicesBlocks) => void; onClose: () => void; aiContext?: OfferContext }) {
    const [local, setLocal] = useState(blocks.scope)

    const updateItem = (i: number, text: string) => {
        const next = [...local.items]; next[i] = { ...next[i], text }; setLocal((p) => ({ ...p, items: next }))
    }
    const removeItem = (i: number) => setLocal((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))
    const addItem = () => {
        const id = Date.now().toString()
        setLocal((p) => ({ ...p, items: [...p.items, { id, text: '' }] }))
    }
    const moveItem = (i: number, dir: -1 | 1) => {
        const j = i + dir
        if (j < 0 || j >= local.items.length) return
        const next: ServicesScopeItem[] = [...local.items]; [next[i], next[j]] = [next[j], next[i]]
        setLocal((p) => ({ ...p, items: next }))
    }

    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Zakres prac" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AiGenerateButton
                    sectionKey="contract_services.scope"
                    offerContext={aiContext}
                    onResult={(data) => setLocal((p) => ({
                        ...p,
                        items: Array.isArray(data.items)
                            ? (data.items as string[]).map((text, i) => ({ id: `${Date.now()}-${i}`, text }))
                            : p.items,
                        exclusions: typeof data.exclusions === 'string' ? data.exclusions : p.exclusions,
                    }))}
                />
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <label className="block text-xs font-medium text-muted-foreground">Pozycje zakresu</label>
                <div className="space-y-2">
                    {local.items.map((item, i) => (
                        <div key={item.id} className="flex gap-2 items-start">
                            <GripVertical className="h-4 w-4 text-muted-foreground mt-2 flex-shrink-0" />
                            <input
                                value={item.text}
                                onChange={(e) => updateItem(i, e.target.value)}
                                className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                            <div className="flex flex-col gap-0.5 flex-shrink-0 mt-1">
                                <button type="button" onClick={() => moveItem(i, -1)} disabled={i === 0} className="p-0.5 rounded text-muted-foreground disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                                <button type="button" onClick={() => moveItem(i, 1)} disabled={i === local.items.length - 1} className="p-0.5 rounded text-muted-foreground disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                                <button type="button" onClick={() => removeItem(i)} className="p-0.5 rounded text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-xs text-primary font-medium">
                        <Plus className="h-3.5 w-3.5" /> Dodaj pozycję
                    </button>
                </div>
                <TextArea label="Zakres prac nie obejmuje" value={local.exclusions} onChange={(v) => setLocal((p) => ({ ...p, exclusions: v }))} rows={2} />
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, scope: local })} />
        </div>
    )
}

function ObligationsEditor({ blocks, onSave, onClose }: { blocks: ContractServicesBlocks; onSave: (b: ContractServicesBlocks) => void; onClose: () => void }) {
    const [local, setLocal] = useState(blocks.obligations)
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Obowiązki Zamawiającego" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <Field label="Termin dostarczenia materiałów" value={local.materialsDeadline} onChange={(v) => setLocal((p) => ({ ...p, materialsDeadline: v }))} placeholder="np. 10 dni od podpisania" />
                <Field label="Czas odpowiedzi (dni robocze)" value={local.responseBusinessDays} onChange={(v) => setLocal((p) => ({ ...p, responseBusinessDays: v }))} />
                <StringList label="Lista materiałów do dostarczenia" items={local.additionalItems} onChange={(v) => setLocal((p) => ({ ...p, additionalItems: v }))} />
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, obligations: local })} />
        </div>
    )
}

function TimelineEditor({ blocks, onSave, onClose }: { blocks: ContractServicesBlocks; onSave: (b: ContractServicesBlocks) => void; onClose: () => void }) {
    const [local, setLocal] = useState(blocks.timeline)
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Termin realizacji" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <Field label="Data zakończenia" value={local.endDate} onChange={(v) => setLocal((p) => ({ ...p, endDate: v }))} placeholder="np. 15 sierpnia 2026" />
                <Field label="Data startu (opcjonalna)" value={local.startDate} onChange={(v) => setLocal((p) => ({ ...p, startDate: v }))} placeholder="np. 1 lipca 2026" />
                <Field label="Dni robocze od podpisania umowy" value={local.startBusinessDays} onChange={(v) => setLocal((p) => ({ ...p, startBusinessDays: v }))} />
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, timeline: local })} />
        </div>
    )
}

function PaymentEditor({ blocks, onSave, onClose }: { blocks: ContractServicesBlocks; onSave: (b: ContractServicesBlocks) => void; onClose: () => void }) {
    const [local, setLocal] = useState(blocks.payment)

    const updateRow = (i: number, field: keyof ServicesPaymentRow, v: string) => {
        const next: ServicesPaymentRow[] = [...local.rows]
        next[i] = { ...next[i], [field]: v }
        setLocal((p) => ({ ...p, rows: next }))
    }
    const addRow = () => setLocal((p) => ({ ...p, rows: [...p.rows, { label: '', amount: '', condition: '' }] }))
    const removeRow = (i: number) => setLocal((p) => ({ ...p, rows: p.rows.filter((_, idx) => idx !== i) }))

    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Wynagrodzenie i płatności" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <Field label="Kwota netto (zł)" value={local.netAmount} onChange={(v) => setLocal((p) => ({ ...p, netAmount: v }))} placeholder="np. 5000" />
                <Field label="Stawka VAT (%)" value={local.vatRate} onChange={(v) => setLocal((p) => ({ ...p, vatRate: v }))} placeholder="23" />
                <Field label="Numer konta bankowego" value={local.bankAccount} onChange={(v) => setLocal((p) => ({ ...p, bankAccount: v }))} placeholder="PL …" />
                <Field label="Termin płatności faktury (dni)" value={local.invoiceDays} onChange={(v) => setLocal((p) => ({ ...p, invoiceDays: v }))} />
                <div className="space-y-2">
                    <label className="block text-xs font-medium text-muted-foreground">Harmonogram płatności</label>
                    {local.rows.map((row, i) => (
                        <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Rata {i + 1}</span>
                                <button type="button" onClick={() => removeRow(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                            <Field label="Nazwa" value={row.label} onChange={(v) => updateRow(i, 'label', v)} />
                            <Field label="Kwota / udział" value={row.amount} onChange={(v) => updateRow(i, 'amount', v)} />
                            <Field label="Termin / warunek" value={row.condition} onChange={(v) => updateRow(i, 'condition', v)} />
                        </div>
                    ))}
                    <button type="button" onClick={addRow} className="flex items-center gap-1.5 text-xs text-primary font-medium">
                        <Plus className="h-3.5 w-3.5" /> Dodaj ratę
                    </button>
                </div>
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, payment: local })} />
        </div>
    )
}

function RevisionsEditor({ blocks, onSave, onClose }: { blocks: ContractServicesBlocks; onSave: (b: ContractServicesBlocks) => void; onClose: () => void }) {
    const [local, setLocal] = useState(blocks.revisions)
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Poprawki i zmiany" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <Field label="Rundy poprawek graficznych" value={local.graphicRounds} onChange={(v) => setLocal((p) => ({ ...p, graphicRounds: v }))} />
                <Field label="Rundy poprawek do strony" value={local.siteRounds} onChange={(v) => setLocal((p) => ({ ...p, siteRounds: v }))} />
                <Field label="Stawka za dodatkową godzinę (zł netto)" value={local.hourlyRate} onChange={(v) => setLocal((p) => ({ ...p, hourlyRate: v }))} placeholder="np. 150" />
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, revisions: local })} />
        </div>
    )
}

function AcceptanceEditor({ blocks, onSave, onClose }: { blocks: ContractServicesBlocks; onSave: (b: ContractServicesBlocks) => void; onClose: () => void }) {
    const [local, setLocal] = useState(blocks.acceptance)
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Odbiór strony" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <Field label="Czas weryfikacji (dni robocze)" value={local.reviewBusinessDays} onChange={(v) => setLocal((p) => ({ ...p, reviewBusinessDays: v }))} />
                <StringList label="Przekazywane po odbiorze" items={local.deliverables} onChange={(v) => setLocal((p) => ({ ...p, deliverables: v }))} />
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, acceptance: local })} />
        </div>
    )
}

function CopyrightEditor({ blocks, onSave, onClose }: { blocks: ContractServicesBlocks; onSave: (b: ContractServicesBlocks) => void; onClose: () => void }) {
    const [local, setLocal] = useState(blocks.copyright)
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Prawa autorskie" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <StringList items={local.items} onChange={(v) => setLocal((p) => ({ ...p, items: v }))} />
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, copyright: local })} />
        </div>
    )
}

function ConfidentialityEditor({ blocks, onSave, onClose }: { blocks: ContractServicesBlocks; onSave: (b: ContractServicesBlocks) => void; onClose: () => void }) {
    const [local, setLocal] = useState(blocks.confidentiality)
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Poufność" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <Field label="Okres poufności po umowie (lata)" value={local.years} onChange={(v) => setLocal((p) => ({ ...p, years: v }))} />
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, confidentiality: local })} />
        </div>
    )
}

function LiabilityEditor({ blocks, onSave, onClose }: { blocks: ContractServicesBlocks; onSave: (b: ContractServicesBlocks) => void; onClose: () => void }) {
    const [local, setLocal] = useState(blocks.liability)
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Odpowiedzialność" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <StringList items={local.items} onChange={(v) => setLocal((p) => ({ ...p, items: v }))} />
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, liability: local })} />
        </div>
    )
}

function WarrantyEditor({ blocks, onSave, onClose }: { blocks: ContractServicesBlocks; onSave: (b: ContractServicesBlocks) => void; onClose: () => void }) {
    const [local, setLocal] = useState(blocks.warranty)
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Gwarancja" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <Field label="Długość gwarancji (miesiące)" value={local.months} onChange={(v) => setLocal((p) => ({ ...p, months: v }))} />
                <Field label="Termin usunięcia usterek (dni robocze)" value={local.fixBusinessDays} onChange={(v) => setLocal((p) => ({ ...p, fixBusinessDays: v }))} />
                <Field label="Email do zgłoszeń gwarancyjnych" value={local.contactEmail} onChange={(v) => setLocal((p) => ({ ...p, contactEmail: v }))} />
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, warranty: local })} />
        </div>
    )
}

function TerminationEditor({ blocks, onSave, onClose }: { blocks: ContractServicesBlocks; onSave: (b: ContractServicesBlocks) => void; onClose: () => void }) {
    const [local, setLocal] = useState(blocks.termination)
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Rozwiązanie umowy" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <Field label="Okres wypowiedzenia (dni)" value={local.noticeDays} onChange={(v) => setLocal((p) => ({ ...p, noticeDays: v }))} />
                <Field label="Opóźnienie płatności (dni) — natychmiastowe rozwiązanie" value={local.paymentDelayDays} onChange={(v) => setLocal((p) => ({ ...p, paymentDelayDays: v }))} />
                <Field label="Brak współpracy (dni) — natychmiastowe rozwiązanie" value={local.inactivityDays} onChange={(v) => setLocal((p) => ({ ...p, inactivityDays: v }))} />
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, termination: local })} />
        </div>
    )
}

function GeneralEditor({ blocks, onSave, onClose }: { blocks: ContractServicesBlocks; onSave: (b: ContractServicesBlocks) => void; onClose: () => void }) {
    const [local, setLocal] = useState(blocks.general)
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Postanowienia końcowe" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SectionTitle value={local.sectionTitle} onChange={(v) => setLocal((p) => ({ ...p, sectionTitle: v }))} />
                <StringList items={local.items} onChange={(v) => setLocal((p) => ({ ...p, items: v }))} />
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, general: local })} />
        </div>
    )
}

function SignaturesEditor({ blocks, onSave, onClose }: { blocks: ContractServicesBlocks; onSave: (b: ContractServicesBlocks) => void; onClose: () => void }) {
    const [local, setLocal] = useState(blocks.signatures)
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Podpisy" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Wykonawca</p>
                    <Field label="Tytuł" value={local.contractorTitle} onChange={(v) => setLocal((p) => ({ ...p, contractorTitle: v }))} />
                    <Field label="Imię i nazwisko" value={local.contractorName} onChange={(v) => setLocal((p) => ({ ...p, contractorName: v }))} />
                    <Field label="Data" value={local.contractorDate} onChange={(v) => setLocal((p) => ({ ...p, contractorDate: v }))} />
                </div>
                <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zamawiający</p>
                    <Field label="Tytuł" value={local.clientTitle} onChange={(v) => setLocal((p) => ({ ...p, clientTitle: v }))} />
                    <Field label="Imię i nazwisko" value={local.clientName} onChange={(v) => setLocal((p) => ({ ...p, clientName: v }))} />
                    <Field label="Data" value={local.clientDate} onChange={(v) => setLocal((p) => ({ ...p, clientDate: v }))} />
                </div>
            </div>
            <SaveBar onSave={() => onSave({ ...blocks, signatures: local })} />
        </div>
    )
}

// ── Section manager ───────────────────────────────────────────────────────────

const SECTION_LABELS: Record<ContractServicesSectionKey, string> = {
    parties: 'Strony umowy',
    subject: 'Przedmiot umowy',
    scope: 'Zakres prac',
    obligations: 'Obowiązki Zamawiającego',
    timeline: 'Termin realizacji',
    payment: 'Wynagrodzenie i płatności',
    revisions: 'Poprawki i zmiany',
    acceptance: 'Odbiór strony',
    copyright: 'Prawa autorskie',
    confidentiality: 'Poufność',
    liability: 'Odpowiedzialność',
    warranty: 'Gwarancja',
    termination: 'Rozwiązanie umowy',
    general: 'Postanowienia końcowe',
}

export function ServicesSectionManagerPanel({
    blocks,
    onSave,
    onClose,
}: {
    blocks: ContractServicesBlocks
    onSave: (b: ContractServicesBlocks) => void
    onClose: () => void
}) {
    const active = blocks.sections
    const removed = ALL_SERVICES_SECTION_KEYS.filter((k) => !active.includes(k))

    const removeSection = (key: ContractServicesSectionKey) => {
        const next = active.filter((k) => k !== key)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = blocks[key] as any
        onSave({ ...blocks, [key]: { ...raw, enabled: false }, sections: next })
    }
    const restoreSection = (key: ContractServicesSectionKey) => {
        const next = ALL_SERVICES_SECTION_KEYS.filter((k) => active.includes(k) || k === key)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = blocks[key] as any
        onSave({ ...blocks, [key]: { ...raw, enabled: true }, sections: next })
    }
    const moveSection = (idx: number, dir: -1 | 1) => {
        const j = idx + dir
        if (j < 0 || j >= active.length) return
        const next = [...active]; [next[idx], next[j]] = [next[j], next[idx]]
        onSave({ ...blocks, sections: next })
    }

    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Sekcje dokumentu" onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Aktywne sekcje</p>
                    {active.map((key, idx) => (
                        <div key={key} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                            <span className="text-xs text-muted-foreground w-5 flex-shrink-0">§{idx + 1}</span>
                            <span className="flex-1 text-sm text-foreground">{SECTION_LABELS[key]}</span>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                                <button type="button" onClick={() => moveSection(idx, -1)} disabled={idx === 0} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                                <button type="button" onClick={() => moveSection(idx, 1)} disabled={idx === active.length - 1} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                                <button type="button" onClick={() => removeSection(key)} className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                        </div>
                    ))}
                </div>
                {removed.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Usunięte z dokumentu</p>
                        {removed.map((key) => (
                            <div key={key} className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2">
                                <span className="text-sm text-muted-foreground">{SECTION_LABELS[key]}</span>
                                <button type="button" onClick={() => restoreSection(key)} className="text-xs text-primary font-medium">+ Przywróć</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Main export ───────────────────────────────────────────────────────────────

export type ServicesEditableSectionKey = ContractServicesSectionKey | 'header' | 'signatures'

export interface ContractServicesBlockEditorPanelProps {
    sectionKey: ServicesEditableSectionKey
    blocks: ContractServicesBlocks
    onSave: (blocks: ContractServicesBlocks) => void
    onClose: () => void
    aiContext?: OfferContext
}

export function ContractServicesBlockEditorPanel({
    sectionKey,
    blocks,
    onSave,
    onClose,
    aiContext,
}: ContractServicesBlockEditorPanelProps) {
    switch (sectionKey) {
        case 'header': return <HeaderEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'parties': return <PartiesEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'subject': return <SubjectEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'scope': return <ScopeEditor blocks={blocks} onSave={onSave} onClose={onClose} aiContext={aiContext} />
        case 'obligations': return <ObligationsEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'timeline': return <TimelineEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'payment': return <PaymentEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'revisions': return <RevisionsEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'acceptance': return <AcceptanceEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'copyright': return <CopyrightEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'confidentiality': return <ConfidentialityEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'liability': return <LiabilityEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'warranty': return <WarrantyEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'termination': return <TerminationEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'general': return <GeneralEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        case 'signatures': return <SignaturesEditor blocks={blocks} onSave={onSave} onClose={onClose} />
        default: return null
    }
}
