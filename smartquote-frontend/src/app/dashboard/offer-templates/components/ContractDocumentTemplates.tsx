// src/app/dashboard/offer-templates/components/ContractDocumentTemplates.tsx
// Contract document templates tab — Classic info card + editable HTML templates.
'use client'

import { useState, useCallback } from 'react'
import { FileSignature, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui'
import { ContractDocumentEditor } from '@/components/contracts/editor/ContractDocumentEditor'
import { ContractServicesDocumentEditor } from '@/components/contracts/editor/ContractServicesDocumentEditor'
import { ContractDedicatedDocumentEditor } from '@/components/contracts/editor/ContractDedicatedDocumentEditor'
import { ContractSlaDocumentEditor } from '@/components/contracts/editor/ContractSlaDocumentEditor'
import { ContractMobileDocumentEditor } from '@/components/contracts/editor/ContractMobileDocumentEditor'
import {
    buildDefaultContractBlocks,
    mergeContractWithDefaults,
    type ContractShortBlocks,
} from '@/lib/pdf/contract-short-blocks'
import {
    buildDefaultContractServicesBlocks,
    mergeServicesWithDefaults,
    type ContractServicesBlocks,
} from '@/lib/pdf/contract-services-blocks'
import {
    buildDefaultContractDedicatedBlocks,
    mergeDedicatedWithDefaults,
    type ContractDedicatedBlocks,
} from '@/lib/pdf/contract-dedicated-blocks'
import {
    buildDefaultContractSlaBlocks,
    mergeSlaWithDefaults,
    type ContractSlaBlocks,
} from '@/lib/pdf/contract-sla-blocks'
import {
    buildDefaultContractMobileBlocks,
    mergeMobileWithDefaults,
    type ContractMobileBlocks,
} from '@/lib/pdf/contract-mobile-blocks'
import { useTranslations } from '@/i18n'
import { cn } from '@/lib/utils'

// ── localStorage persistence ──────────────────────────────────────────────────

const LS_KEY = 'sq_default_contract_short_blocks'
const LS_KEY_SERVICES = 'sq_default_contract_services_blocks'
const LS_KEY_DEDICATED = 'sq_default_contract_dedicated_blocks'
const LS_KEY_SLA = 'sq_default_contract_sla_blocks'
const LS_KEY_MOBILE = 'sq_default_contract_mobile_blocks'

function loadFromStorage(): Partial<ContractShortBlocks> | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = localStorage.getItem(LS_KEY)
        return raw ? (JSON.parse(raw) as Partial<ContractShortBlocks>) : null
    } catch {
        return null
    }
}

function saveToStorage(blocks: ContractShortBlocks) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(blocks))
    } catch {
        // quota exceeded or private mode — ignore
    }
}

function loadServicesFromStorage(): Partial<ContractServicesBlocks> | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = localStorage.getItem(LS_KEY_SERVICES)
        return raw ? (JSON.parse(raw) as Partial<ContractServicesBlocks>) : null
    } catch {
        return null
    }
}

function saveServicesToStorage(blocks: ContractServicesBlocks) {
    try {
        localStorage.setItem(LS_KEY_SERVICES, JSON.stringify(blocks))
    } catch {
        // quota exceeded or private mode — ignore
    }
}

function loadDedicatedFromStorage(): Partial<ContractDedicatedBlocks> | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = localStorage.getItem(LS_KEY_DEDICATED)
        return raw ? (JSON.parse(raw) as Partial<ContractDedicatedBlocks>) : null
    } catch { return null }
}

function saveDedicatedToStorage(blocks: ContractDedicatedBlocks) {
    try { localStorage.setItem(LS_KEY_DEDICATED, JSON.stringify(blocks)) } catch { /* ignore */ }
}

function loadSlaFromStorage(): Partial<ContractSlaBlocks> | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = localStorage.getItem(LS_KEY_SLA)
        return raw ? (JSON.parse(raw) as Partial<ContractSlaBlocks>) : null
    } catch { return null }
}

function saveSlaToStorage(blocks: ContractSlaBlocks) {
    try { localStorage.setItem(LS_KEY_SLA, JSON.stringify(blocks)) } catch { /* ignore */ }
}

function loadMobileFromStorage(): Partial<ContractMobileBlocks> | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = localStorage.getItem(LS_KEY_MOBILE)
        return raw ? (JSON.parse(raw) as Partial<ContractMobileBlocks>) : null
    } catch { return null }
}

function saveMobileToStorage(blocks: ContractMobileBlocks) {
    try { localStorage.setItem(LS_KEY_MOBILE, JSON.stringify(blocks)) } catch { /* ignore */ }
}

// ── Classic contract info card ────────────────────────────────────────────────

function ClassicContractCard() {
    const tr = useTranslations('offerTemplatesPage')

    return (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 rounded-xl bg-primary/10 p-3 text-primary">
                    <FileSignature className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-base">{tr.contractClassicTitle}</h3>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground font-medium">
                            {tr.contractActiveBadge}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tr.contractClassicDesc}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                <div className="rounded-lg bg-secondary/40 p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{tr.contentsLabel}</p>
                    <ul className="text-xs text-foreground space-y-1">
                        {([
                            tr.contractContent1,
                            tr.contractContent2,
                            tr.contractContent3,
                            tr.contractContent4,
                            tr.contractContent5,
                        ] as string[]).map((item) => (
                            <li key={item}>• {item}</li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-lg bg-secondary/40 p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{tr.customizeLabel}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {tr.contractCustomizeDesc.split('{link}')[0]}
                        <span
                            className="font-medium text-primary cursor-pointer"
                            onClick={() => window.open('/dashboard/settings', '_blank')}
                        >
                            {tr.settingsLink}
                        </span>
                        {tr.contractCustomizeDesc.split('{link}')[1]}
                    </p>
                </div>
            </div>
        </div>
    )
}

// ── "Krótka" editable template editor ────────────────────────────────────────

function ShortContractEditor() {
    const tr = useTranslations('offerTemplatesPage')
    const [blocks, setBlocks] = useState<ContractShortBlocks>(() =>
        mergeContractWithDefaults(loadFromStorage()),
    )
    const [savedIndicator, setSavedIndicator] = useState(false)

    const handleBlocksChange = useCallback((updated: ContractShortBlocks) => {
        setBlocks(updated)
        saveToStorage(updated)
        setSavedIndicator(true)
        setTimeout(() => setSavedIndicator(false), 2000)
    }, [])

    const handleReset = useCallback(() => {
        if (!confirm(tr.contractShortResetConfirm)) return
        const fresh = buildDefaultContractBlocks()
        setBlocks(fresh)
        saveToStorage(fresh)
    }, [tr.contractShortResetConfirm])

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-muted-foreground">{tr.contractShortAutoSave}</p>
                <div className="flex items-center gap-3 shrink-0">
                    {savedIndicator && (
                        <span className="text-xs text-green-600 font-medium">{tr.proposalSaved}</span>
                    )}
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="h-3.5 w-3.5" />
                        {tr.proposalReset}
                    </Button>
                </div>
            </div>
            <ContractDocumentEditor
                blocks={blocks}
                onBlocksChange={handleBlocksChange}
            />
        </div>
    )
}

// ── "Sklep internetowy" editable template editor ──────────────────────────────

function ServicesContractEditor() {
    const tr = useTranslations('offerTemplatesPage')
    const [blocks, setBlocks] = useState<ContractServicesBlocks>(() =>
        mergeServicesWithDefaults(loadServicesFromStorage()),
    )
    const [savedIndicator, setSavedIndicator] = useState(false)

    const handleBlocksChange = useCallback((updated: ContractServicesBlocks) => {
        setBlocks(updated)
        saveServicesToStorage(updated)
        setSavedIndicator(true)
        setTimeout(() => setSavedIndicator(false), 2000)
    }, [])

    const handleReset = useCallback(() => {
        if (!confirm(tr.contractShortResetConfirm)) return
        const fresh = buildDefaultContractServicesBlocks()
        setBlocks(fresh)
        saveServicesToStorage(fresh)
    }, [tr.contractShortResetConfirm])

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-muted-foreground">{tr.contractShortAutoSave}</p>
                <div className="flex items-center gap-3 shrink-0">
                    {savedIndicator && (
                        <span className="text-xs text-green-600 font-medium">{tr.proposalSaved}</span>
                    )}
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="h-3.5 w-3.5" />
                        {tr.proposalReset}
                    </Button>
                </div>
            </div>
            <ContractServicesDocumentEditor
                blocks={blocks}
                onBlocksChange={handleBlocksChange}
            />
        </div>
    )
}

// ── Dedicated editable template editor ───────────────────────────────────────

function DedicatedContractEditor() {
    const tr = useTranslations('offerTemplatesPage')
    const [blocks, setBlocks] = useState<ContractDedicatedBlocks>(() =>
        mergeDedicatedWithDefaults(loadDedicatedFromStorage()),
    )
    const [savedIndicator, setSavedIndicator] = useState(false)

    const handleBlocksChange = useCallback((updated: ContractDedicatedBlocks) => {
        setBlocks(updated)
        saveDedicatedToStorage(updated)
        setSavedIndicator(true)
        setTimeout(() => setSavedIndicator(false), 2000)
    }, [])

    const handleReset = useCallback(() => {
        if (!confirm(tr.contractShortResetConfirm)) return
        const fresh = buildDefaultContractDedicatedBlocks()
        setBlocks(fresh)
        saveDedicatedToStorage(fresh)
    }, [tr.contractShortResetConfirm])

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-muted-foreground">{tr.contractShortAutoSave}</p>
                <div className="flex items-center gap-3 shrink-0">
                    {savedIndicator && <span className="text-xs text-green-600 font-medium">{tr.proposalSaved}</span>}
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="h-3.5 w-3.5" />
                        {tr.proposalReset}
                    </Button>
                </div>
            </div>
            <ContractDedicatedDocumentEditor blocks={blocks} onBlocksChange={handleBlocksChange} />
        </div>
    )
}

// ── SLA editable template editor ──────────────────────────────────────────────

function SlaContractEditor() {
    const tr = useTranslations('offerTemplatesPage')
    const [blocks, setBlocks] = useState<ContractSlaBlocks>(() =>
        mergeSlaWithDefaults(loadSlaFromStorage()),
    )
    const [savedIndicator, setSavedIndicator] = useState(false)

    const handleBlocksChange = useCallback((updated: ContractSlaBlocks) => {
        setBlocks(updated)
        saveSlaToStorage(updated)
        setSavedIndicator(true)
        setTimeout(() => setSavedIndicator(false), 2000)
    }, [])

    const handleReset = useCallback(() => {
        if (!confirm(tr.contractShortResetConfirm)) return
        const fresh = buildDefaultContractSlaBlocks()
        setBlocks(fresh)
        saveSlaToStorage(fresh)
    }, [tr.contractShortResetConfirm])

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-muted-foreground">{tr.contractShortAutoSave}</p>
                <div className="flex items-center gap-3 shrink-0">
                    {savedIndicator && <span className="text-xs text-green-600 font-medium">{tr.proposalSaved}</span>}
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="h-3.5 w-3.5" />
                        {tr.proposalReset}
                    </Button>
                </div>
            </div>
            <ContractSlaDocumentEditor blocks={blocks} onBlocksChange={handleBlocksChange} />
        </div>
    )
}

// ── Mobile editable template editor ──────────────────────────────────────────

function MobileContractEditor() {
    const tr = useTranslations('offerTemplatesPage')
    const [blocks, setBlocks] = useState<ContractMobileBlocks>(() =>
        mergeMobileWithDefaults(loadMobileFromStorage()),
    )
    const [savedIndicator, setSavedIndicator] = useState(false)

    const handleBlocksChange = useCallback((updated: ContractMobileBlocks) => {
        setBlocks(updated)
        saveMobileToStorage(updated)
        setSavedIndicator(true)
        setTimeout(() => setSavedIndicator(false), 2000)
    }, [])

    const handleReset = useCallback(() => {
        if (!confirm(tr.contractShortResetConfirm)) return
        const fresh = buildDefaultContractMobileBlocks()
        setBlocks(fresh)
        saveMobileToStorage(fresh)
    }, [tr.contractShortResetConfirm])

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-muted-foreground">{tr.contractShortAutoSave}</p>
                <div className="flex items-center gap-3 shrink-0">
                    {savedIndicator && <span className="text-xs text-green-600 font-medium">{tr.proposalSaved}</span>}
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="h-3.5 w-3.5" />
                        {tr.proposalReset}
                    </Button>
                </div>
            </div>
            <ContractMobileDocumentEditor blocks={blocks} onBlocksChange={handleBlocksChange} />
        </div>
    )
}

// ── Main export ───────────────────────────────────────────────────────────────

type ContractDocType = 'classic' | 'short' | 'services' | 'mobile' | 'dedicated' | 'sla'

export function ContractDocumentTemplates() {
    const tr = useTranslations('offerTemplatesPage')
    const [docType, setDocType] = useState<ContractDocType>('classic')

    const DOC_TYPES: { key: ContractDocType; label: string }[] = [
        { key: 'classic', label: tr.contractTypeClassic },
        { key: 'short', label: tr.contractTypeShort },
        { key: 'mobile', label: tr.contractTypeMobile },
        { key: 'services', label: tr.contractTypeServices },
        { key: 'dedicated', label: tr.contractTypeDedicated },
        { key: 'sla', label: tr.contractTypeSla },
    ]

    return (
        <div className="space-y-5">
            <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{tr.docTypeLabel}</p>
                <div className="flex gap-2 flex-wrap">
                    {DOC_TYPES.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setDocType(t.key)}
                            className={cn(
                                'flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all',
                                docType === t.key
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-border bg-card text-muted-foreground hover:border-border/60 hover:text-foreground',
                            )}
                        >
                            <FileSignature className="h-4 w-4" />
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {docType === 'classic' && <ClassicContractCard />}
            {docType === 'short' && <ShortContractEditor />}
            {docType === 'services' && <ServicesContractEditor />}
            {docType === 'dedicated' && <DedicatedContractEditor />}
            {docType === 'sla' && <SlaContractEditor />}
            {docType === 'mobile' && <MobileContractEditor />}
        </div>
    )
}
