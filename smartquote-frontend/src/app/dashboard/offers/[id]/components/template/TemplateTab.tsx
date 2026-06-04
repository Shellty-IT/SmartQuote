// src/app/dashboard/offers/[id]/components/template/TemplateTab.tsx
'use client'

import { useState, useCallback } from 'react'
import { ChevronDown, ChevronUp, Eye, Download, Save, FileText, Presentation } from 'lucide-react'
import { Button } from '@/components/ui'
import { PdfPreviewModal } from '@/components/pdf/PdfPreviewModal'
import { offersApi } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import { useTranslations } from '@/i18n'
import { cn } from '@/lib/utils'
import {
    mergeWithDefaults,
    type ProposalBlocks,
    type StructureItem,
    type ScopeItem,
    type TestingCard,
    type DemoUrl,
    type TechOption,
} from '@/lib/pdf/proposal-blocks'
import type { Offer } from '@/types'

// ── Small utilities ───────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <label className="flex cursor-pointer items-center gap-2">
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={cn(
                    'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors',
                    checked ? 'bg-primary' : 'bg-muted',
                )}
            >
                <span
                    className={cn(
                        'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                        checked ? 'translate-x-4' : 'translate-x-0',
                    )}
                />
            </button>
            <span className="text-xs text-muted-foreground">{label}</span>
        </label>
    )
}

interface BlockCardProps {
    title: string
    description: string
    icon: string
    enabled: boolean
    onToggle: (v: boolean) => void
    children: React.ReactNode
    trEnabled: string
    trDisabled: string
}

function BlockCard({ title, description, icon, enabled, onToggle, children, trEnabled, trDisabled }: BlockCardProps) {
    const [open, setOpen] = useState(false)
    return (
        <div className={cn('rounded-xl border transition-colors', enabled ? 'border-border' : 'border-dashed border-border/50 opacity-60')}>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="text-lg">{icon}</span>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
                        <p className="truncate text-xs text-muted-foreground">{description}</p>
                    </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                    <Toggle checked={enabled} onChange={onToggle} label={enabled ? trEnabled : trDisabled} />
                    <button
                        type="button"
                        onClick={() => setOpen((o) => !o)}
                        className="rounded-md p-1 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    >
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                </div>
            </div>
            {open && <div className="border-t border-border px-4 py-4">{children}</div>}
        </div>
    )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-foreground">{label}</label>
            {children}
        </div>
    )
}

const inputCls = 'w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30'
const textareaCls = `${inputCls} resize-vertical min-h-[60px]`

// ── Block editors ─────────────────────────────────────────────────────────────

function IntroEditor({ blocks, tr, onChange }: { blocks: ProposalBlocks; tr: ReturnType<typeof useTranslations<'offerDetail'>>['template']['blocks']; onChange: (b: ProposalBlocks) => void }) {
    const update = (paragraphs: string[]) => onChange({ ...blocks, intro: { ...blocks.intro, paragraphs } })
    return (
        <div>
            {blocks.intro.paragraphs.map((p, i) => (
                <FieldRow key={i} label={tr.paragraphLabel.replace('{n}', String(i + 1))}>
                    <div className="flex gap-2">
                        <textarea className={textareaCls} value={p} onChange={(e) => {
                            const next = [...blocks.intro.paragraphs]
                            next[i] = e.target.value
                            update(next)
                        }} />
                        {blocks.intro.paragraphs.length > 1 && (
                            <button type="button" onClick={() => update(blocks.intro.paragraphs.filter((_, j) => j !== i))}
                                className="self-start rounded-md border border-border px-2 py-1 text-xs text-destructive hover:bg-destructive/10">
                                {tr.removeParagraph}
                            </button>
                        )}
                    </div>
                </FieldRow>
            ))}
            <button type="button" onClick={() => update([...blocks.intro.paragraphs, ''])}
                className="text-xs text-primary hover:underline">{tr.addParagraph}</button>
        </div>
    )
}

function DemoEditor({ blocks, tr, onChange }: { blocks: ProposalBlocks; tr: ReturnType<typeof useTranslations<'offerDetail'>>['template']['blocks']; onChange: (b: ProposalBlocks) => void }) {
    const set = (patch: Partial<ProposalBlocks['demo']>) => onChange({ ...blocks, demo: { ...blocks.demo, ...patch } })
    const updateUrl = (i: number, patch: Partial<DemoUrl>) => {
        const urls = blocks.demo.urls.map((u, j) => j === i ? { ...u, ...patch } : u)
        set({ urls })
    }
    return (
        <div>
            <FieldRow label={tr.demoTitle}><input className={inputCls} value={blocks.demo.title} onChange={(e) => set({ title: e.target.value })} /></FieldRow>
            <FieldRow label={tr.demoBody}><textarea className={textareaCls} value={blocks.demo.body} onChange={(e) => set({ body: e.target.value })} /></FieldRow>
            {blocks.demo.urls.map((u, i) => (
                <div key={i} className="mb-2 grid grid-cols-2 gap-2">
                    <FieldRow label={tr.demoUrlHref.replace('{n}', String(i + 1))}>
                        <input className={inputCls} value={u.href} onChange={(e) => updateUrl(i, { href: e.target.value })} placeholder="https://" />
                    </FieldRow>
                    <FieldRow label={tr.demoUrlLabel.replace('{n}', String(i + 1))}>
                        <input className={inputCls} value={u.label} onChange={(e) => updateUrl(i, { label: e.target.value })} />
                    </FieldRow>
                </div>
            ))}
            <FieldRow label={tr.demoWarning}><input className={inputCls} value={blocks.demo.warning ?? ''} onChange={(e) => set({ warning: e.target.value })} /></FieldRow>
            <FieldRow label={tr.demoNote}><input className={inputCls} value={blocks.demo.note ?? ''} onChange={(e) => set({ note: e.target.value })} /></FieldRow>
        </div>
    )
}

function StructureEditor({ blocks, tr, onChange }: { blocks: ProposalBlocks; tr: ReturnType<typeof useTranslations<'offerDetail'>>['template']['blocks']; onChange: (b: ProposalBlocks) => void }) {
    const set = (patch: Partial<ProposalBlocks['structure']>) => onChange({ ...blocks, structure: { ...blocks.structure, ...patch } })
    const updateItem = (i: number, patch: Partial<StructureItem>) => {
        const items = blocks.structure.items.map((it, j) => j === i ? { ...it, ...patch } : it)
        set({ items })
    }
    return (
        <div>
            <FieldRow label={tr.structureTitle}><input className={inputCls} value={blocks.structure.title} onChange={(e) => set({ title: e.target.value })} /></FieldRow>
            {blocks.structure.items.map((item, i) => (
                <div key={i} className="mb-2 rounded-lg border border-border p-3">
                    <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
                        <button type="button" onClick={() => set({ items: blocks.structure.items.filter((_, j) => j !== i) })}
                            className="text-xs text-destructive hover:underline">{tr.removeItem}</button>
                    </div>
                    <div className="grid grid-cols-[60px_1fr_2fr] gap-2">
                        <FieldRow label={tr.structureIcon}><input className={inputCls} value={item.icon} onChange={(e) => updateItem(i, { icon: e.target.value })} /></FieldRow>
                        <FieldRow label={tr.structureName}><input className={inputCls} value={item.name} onChange={(e) => updateItem(i, { name: e.target.value })} /></FieldRow>
                        <FieldRow label={tr.structureItemDesc}><input className={inputCls} value={item.description} onChange={(e) => updateItem(i, { description: e.target.value })} /></FieldRow>
                    </div>
                </div>
            ))}
            <button type="button" onClick={() => set({ items: [...blocks.structure.items, { icon: '📋', name: '', description: '' }] })}
                className="text-xs text-primary hover:underline">{tr.addItem}</button>
            <FieldRow label={tr.structureNote}><input className={inputCls} value={blocks.structure.note ?? ''} onChange={(e) => set({ note: e.target.value })} /></FieldRow>
        </div>
    )
}

function ScopeEditor({ blocks, tr, onChange }: { blocks: ProposalBlocks; tr: ReturnType<typeof useTranslations<'offerDetail'>>['template']['blocks']; onChange: (b: ProposalBlocks) => void }) {
    const set = (patch: Partial<ProposalBlocks['scope']>) => onChange({ ...blocks, scope: { ...blocks.scope, ...patch } })
    const updateItem = (i: number, patch: Partial<ScopeItem>) => {
        const items = blocks.scope.items.map((it, j) => j === i ? { ...it, ...patch } : it)
        set({ items })
    }
    return (
        <div>
            <FieldRow label={tr.scopeTitle}><input className={inputCls} value={blocks.scope.title} onChange={(e) => set({ title: e.target.value })} /></FieldRow>
            {blocks.scope.items.map((item, i) => (
                <div key={i} className="mb-2 flex gap-2">
                    <textarea className={textareaCls} value={item.html} placeholder={tr.scopeItemHtml}
                        onChange={(e) => updateItem(i, { html: e.target.value })} />
                    <button type="button" onClick={() => set({ items: blocks.scope.items.filter((_, j) => j !== i) })}
                        className="self-start rounded-md border border-border px-2 py-1 text-xs text-destructive hover:bg-destructive/10">{tr.removeItem}</button>
                </div>
            ))}
            <button type="button" onClick={() => set({ items: [...blocks.scope.items, { html: '' }] })}
                className="text-xs text-primary hover:underline">{tr.addItem}</button>
        </div>
    )
}

function TestingEditor({ blocks, tr, onChange }: { blocks: ProposalBlocks; tr: ReturnType<typeof useTranslations<'offerDetail'>>['template']['blocks']; onChange: (b: ProposalBlocks) => void }) {
    const set = (patch: Partial<ProposalBlocks['testing']>) => onChange({ ...blocks, testing: { ...blocks.testing, ...patch } })
    const updateCard = (i: number, patch: Partial<TestingCard>) => {
        const cards = blocks.testing.cards.map((c, j) => j === i ? { ...c, ...patch } : c)
        set({ cards })
    }
    return (
        <div>
            <FieldRow label={tr.testingIntro}><textarea className={textareaCls} value={blocks.testing.intro} onChange={(e) => set({ intro: e.target.value })} /></FieldRow>
            <div className="grid grid-cols-2 gap-3">
                {blocks.testing.cards.map((card, i) => (
                    <div key={i} className="rounded-lg border border-border p-3">
                        <div className="grid grid-cols-[50px_1fr] gap-2 mb-2">
                            <FieldRow label={tr.cardIcon}><input className={inputCls} value={card.icon} onChange={(e) => updateCard(i, { icon: e.target.value })} /></FieldRow>
                            <FieldRow label={tr.cardTitle}><input className={inputCls} value={card.title} onChange={(e) => updateCard(i, { title: e.target.value })} /></FieldRow>
                        </div>
                        <FieldRow label={tr.cardDesc}><input className={inputCls} value={card.description} onChange={(e) => updateCard(i, { description: e.target.value })} /></FieldRow>
                    </div>
                ))}
            </div>
            <FieldRow label={tr.testingNote}><input className={inputCls} value={blocks.testing.note ?? ''} onChange={(e) => set({ note: e.target.value })} /></FieldRow>
        </div>
    )
}

function TechnologyEditor({ blocks, tr, onChange }: { blocks: ProposalBlocks; tr: ReturnType<typeof useTranslations<'offerDetail'>>['template']['blocks']; onChange: (b: ProposalBlocks) => void }) {
    const set = (patch: Partial<ProposalBlocks['technology']>) => onChange({ ...blocks, technology: { ...blocks.technology, ...patch } })
    const updateOption = (i: number, patch: Partial<TechOption>) => {
        const options = blocks.technology.options.map((o, j) => j === i ? { ...o, ...patch } : o)
        set({ options })
    }
    const updateUrl = (optIdx: number, urlIdx: number, patch: Partial<DemoUrl>) => {
        const options = blocks.technology.options.map((o, j) => {
            if (j !== optIdx) return o
            return { ...o, urls: o.urls.map((u, k) => k === urlIdx ? { ...u, ...patch } : u) }
        })
        set({ options })
    }
    return (
        <div>
            <FieldRow label={tr.technologyBody}><textarea className={textareaCls} value={blocks.technology.body} onChange={(e) => set({ body: e.target.value })} /></FieldRow>
            {blocks.technology.options.map((opt, i) => (
                <div key={i} className="mb-3 rounded-lg border border-border p-3">
                    <div className="mb-2 grid grid-cols-[50px_1fr] gap-2">
                        <FieldRow label={tr.techOptionIcon.replace('{n}', String(i + 1))}><input className={inputCls} value={opt.icon} onChange={(e) => updateOption(i, { icon: e.target.value })} /></FieldRow>
                        <FieldRow label={tr.techOptionTitle.replace('{n}', String(i + 1))}><input className={inputCls} value={opt.title} onChange={(e) => updateOption(i, { title: e.target.value })} /></FieldRow>
                    </div>
                    {opt.urls.map((u, j) => (
                        <div key={j} className="grid grid-cols-2 gap-2">
                            <FieldRow label={tr.techOptionUrl.replace('{n}', String(j + 1))}><input className={inputCls} value={u.href} placeholder="https://" onChange={(e) => updateUrl(i, j, { href: e.target.value })} /></FieldRow>
                            <FieldRow label={tr.techOptionUrlLabel}><input className={inputCls} value={u.label} onChange={(e) => updateUrl(i, j, { label: e.target.value })} /></FieldRow>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
}

function PricingExtraEditor({ blocks, tr, onChange }: { blocks: ProposalBlocks; tr: ReturnType<typeof useTranslations<'offerDetail'>>['template']['blocks']; onChange: (b: ProposalBlocks) => void }) {
    const set = (patch: Partial<ProposalBlocks['pricingExtra']>) => onChange({ ...blocks, pricingExtra: { ...blocks.pricingExtra, ...patch } })
    return (
        <div className="grid grid-cols-2 gap-3">
            <FieldRow label={tr.timeline}><input className={inputCls} value={blocks.pricingExtra.timeline} onChange={(e) => set({ timeline: e.target.value })} /></FieldRow>
            <FieldRow label={tr.timelineSub}><input className={inputCls} value={blocks.pricingExtra.timelineSub} onChange={(e) => set({ timelineSub: e.target.value })} /></FieldRow>
            <FieldRow label={tr.contractType}><input className={inputCls} value={blocks.pricingExtra.contractType} onChange={(e) => set({ contractType: e.target.value })} /></FieldRow>
            <FieldRow label={tr.contractSub}><input className={inputCls} value={blocks.pricingExtra.contractSub} onChange={(e) => set({ contractSub: e.target.value })} /></FieldRow>
        </div>
    )
}

function AboutEditor({ blocks, tr, onChange }: { blocks: ProposalBlocks; tr: ReturnType<typeof useTranslations<'offerDetail'>>['template']['blocks']; onChange: (b: ProposalBlocks) => void }) {
    return (
        <FieldRow label={tr.ctaText}>
            <textarea className={textareaCls} value={blocks.about.ctaText}
                onChange={(e) => onChange({ ...blocks, about: { ...blocks.about, ctaText: e.target.value } })} />
        </FieldRow>
    )
}

// ── Main TemplateTab ──────────────────────────────────────────────────────────

interface TemplateTabProps {
    offer: Offer
    onSaved: () => void
}

export function TemplateTab({ offer, onSaved }: TemplateTabProps) {
    const tr = useTranslations('offerDetail')
    const ttr = tr.template
    const btr = ttr.blocks
    const toast = useToast()

    const [templateType, setTemplateType] = useState<'classic' | 'proposal'>(
        (offer.templateType ?? 'classic') as 'classic' | 'proposal',
    )
    const [blocks, setBlocks] = useState<ProposalBlocks>(
        mergeWithDefaults(offer.blocks as Partial<ProposalBlocks> | null, offer.client?.name),
    )
    const [isSaving, setIsSaving] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)

    const previewUrl = offersApi.getProposalPreviewUrl(offer.id)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await offersApi.update(offer.id, { templateType, blocks: blocks as unknown })
            toast.success(ttr.saved, offer.number)
            onSaved()
        } catch {
            toast.error(ttr.saveError, offer.number)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDownload = async () => {
        setIsDownloading(true)
        try {
            const blob = await offersApi.downloadProposalPdf(offer.id)
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Propozycja_${offer.number.replace(/\//g, '-')}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success(tr.toasts.pdfDownloaded, offer.number)
        } catch {
            toast.error(tr.toasts.pdfError, offer.number)
        } finally {
            setIsDownloading(false)
        }
    }

    const toggleBlock = useCallback(
        <K extends keyof ProposalBlocks>(key: K, enabled: boolean) => {
            setBlocks((prev) => ({
                ...prev,
                [key]: { ...(prev[key] as object), enabled },
            }))
        },
        [],
    )

    const BLOCK_DEFS: Array<{
        key: keyof ProposalBlocks
        icon: string
        title: string
        desc: string
        editor: React.ReactNode
    }> = [
        { key: 'intro', icon: '📝', title: btr.intro, desc: btr.introDesc, editor: <IntroEditor blocks={blocks} tr={btr} onChange={setBlocks} /> },
        { key: 'demo', icon: '💻', title: btr.demo, desc: btr.demoDesc, editor: <DemoEditor blocks={blocks} tr={btr} onChange={setBlocks} /> },
        { key: 'structure', icon: '🗂️', title: btr.structure, desc: btr.structureDesc, editor: <StructureEditor blocks={blocks} tr={btr} onChange={setBlocks} /> },
        { key: 'scope', icon: '📦', title: btr.scope, desc: btr.scopeDesc, editor: <ScopeEditor blocks={blocks} tr={btr} onChange={setBlocks} /> },
        { key: 'testing', icon: '🔬', title: btr.testing, desc: btr.testingDesc, editor: <TestingEditor blocks={blocks} tr={btr} onChange={setBlocks} /> },
        { key: 'technology', icon: '⚙️', title: btr.technology, desc: btr.technologyDesc, editor: <TechnologyEditor blocks={blocks} tr={btr} onChange={setBlocks} /> },
        { key: 'pricingExtra', icon: '💰', title: btr.pricing, desc: btr.pricingDesc, editor: <PricingExtraEditor blocks={blocks} tr={btr} onChange={setBlocks} /> },
        { key: 'about', icon: '🙋', title: btr.about, desc: btr.aboutDesc, editor: <AboutEditor blocks={blocks} tr={btr} onChange={setBlocks} /> },
    ]

    return (
        <div className="space-y-6">

            {/* Template type selector */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{ttr.typeLabel}</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(['classic', 'proposal'] as const).map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setTemplateType(type)}
                            className={cn(
                                'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all',
                                templateType === type
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-border/80 hover:bg-secondary/30',
                            )}
                        >
                            <div className={cn('mt-0.5 flex-shrink-0 rounded-full p-1.5', templateType === type ? 'bg-primary text-white' : 'bg-muted text-muted-foreground')}>
                                {type === 'classic' ? <FileText className="h-4 w-4" /> : <Presentation className="h-4 w-4" />}
                            </div>
                            <div>
                                <p className={cn('font-semibold', templateType === type ? 'text-primary' : 'text-foreground')}>
                                    {type === 'classic' ? ttr.classic : ttr.proposal}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {type === 'classic' ? ttr.classicDesc : ttr.proposalDesc}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Proposal block editor — only when proposal is selected */}
            {templateType === 'proposal' && (
                <>
                    {/* Actions bar */}
                    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                        <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                            <Eye className="h-4 w-4" />
                            {ttr.previewBtn}
                        </Button>
                        <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
                            <Download className="h-4 w-4" />
                            {isDownloading ? '…' : ttr.downloadBtn}
                        </Button>
                        <div className="flex-1" />
                        <Button onClick={handleSave} disabled={isSaving}>
                            <Save className="h-4 w-4" />
                            {isSaving ? ttr.saving : ttr.saveBtn}
                        </Button>
                    </div>

                    {/* Block list */}
                    <div className="space-y-2">
                        {BLOCK_DEFS.map(({ key, icon, title, desc, editor }) => (
                            <BlockCard
                                key={key}
                                icon={icon}
                                title={title}
                                description={desc}
                                enabled={(blocks[key] as { enabled: boolean }).enabled}
                                onToggle={(v) => toggleBlock(key, v)}
                                trEnabled={btr.enabledLabel}
                                trDisabled={btr.disabledLabel}
                            >
                                {editor}
                            </BlockCard>
                        ))}
                    </div>

                    {/* Save bottom */}
                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving}>
                            <Save className="h-4 w-4" />
                            {isSaving ? ttr.saving : ttr.saveBtn}
                        </Button>
                    </div>
                </>
            )}

            {/* Classic — just save button to store templateType */}
            {templateType === 'classic' && (
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="h-4 w-4" />
                        {isSaving ? ttr.saving : ttr.saveBtn}
                    </Button>
                </div>
            )}

            {/* Preview modal */}
            <PdfPreviewModal
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
                pdfUrl={previewOpen ? previewUrl : null}
                error={null}
                title={ttr.previewTitle.replace('{number}', offer.number)}
                frameTitle={ttr.previewFrameTitle}
                openInNewTabLabel={ttr.openInNewTab}
                loadingLabel={ttr.loadingPreview}
                frameType="html"
            />
        </div>
    )
}
