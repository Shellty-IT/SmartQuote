// src/app/dashboard/offer-templates/components/ContractDocumentTemplates.tsx
// Contract document templates tab — Classic info card + "Krótka" editable template.
'use client'

import { useState, useCallback } from 'react'
import { FileSignature, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui'
import { ContractDocumentEditor } from '@/components/contracts/editor/ContractDocumentEditor'
import {
    buildDefaultContractBlocks,
    mergeContractWithDefaults,
    type ContractShortBlocks,
} from '@/lib/pdf/contract-short-blocks'
import { useTranslations } from '@/i18n'
import { cn } from '@/lib/utils'

// ── localStorage persistence ──────────────────────────────────────────────────

const LS_KEY = 'sq_default_contract_short_blocks'

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

// ── Main export ───────────────────────────────────────────────────────────────

type ContractDocType = 'classic' | 'short'

export function ContractDocumentTemplates() {
    const tr = useTranslations('offerTemplatesPage')
    const [docType, setDocType] = useState<ContractDocType>('classic')

    const DOC_TYPES: { key: ContractDocType; label: string }[] = [
        { key: 'classic', label: tr.contractTypeClassic },
        { key: 'short', label: tr.contractTypeShort },
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
        </div>
    )
}
