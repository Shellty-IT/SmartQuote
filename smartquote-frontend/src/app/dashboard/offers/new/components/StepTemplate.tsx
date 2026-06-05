// src/app/dashboard/offers/new/components/StepTemplate.tsx
// Block editor step — shown during offer creation when templateType === 'proposal'.
// Manages blocks in local state; parent persists them on offer create.
'use client'

import { useState, useCallback } from 'react'
import { ChevronDown, ChevronUp, Eye, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui'
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
import type { Client } from '@/types'

// ── Shared helpers ────────────────────────────────────────────────────────────

const inputCls =
    'w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30'
const textareaCls = `${inputCls} resize-vertical min-h-[60px]`

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
                <span className={cn('pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-4' : 'translate-x-0')} />
            </button>
            <span className="text-xs text-muted-foreground">{label}</span>
        </label>
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

interface BlockCardProps {
    title: string; description: string; icon: string
    enabled: boolean; onToggle: (v: boolean) => void
    children: React.ReactNode
    trEnabled: string; trDisabled: string
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
                    <button type="button" onClick={() => setOpen(o => !o)} className="rounded-md p-1 text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                </div>
            </div>
            {open && <div className="border-t border-border px-4 py-4">{children}</div>}
        </div>
    )
}

// ── Block editors (inline, same as in TemplateTab) ────────────────────────────

type Btr = ReturnType<typeof useTranslations<'offerDetail'>>['template']['blocks']

function IntroEditor({ blocks, tr, onChange }: { blocks: ProposalBlocks; tr: Btr; onChange: (b: ProposalBlocks) => void }) {
    const upd = (p: string[]) => onChange({ ...blocks, intro: { ...blocks.intro, paragraphs: p } })
    return (
        <div>
            {blocks.intro.paragraphs.map((p, i) => (
                <FieldRow key={i} label={tr.paragraphLabel.replace('{n}', String(i + 1))}>
                    <div className="flex gap-2">
                        <textarea className={textareaCls} value={p} onChange={e => { const n = [...blocks.intro.paragraphs]; n[i] = e.target.value; upd(n) }} />
                        {blocks.intro.paragraphs.length > 1 && (
                            <button type="button" onClick={() => upd(blocks.intro.paragraphs.filter((_, j) => j !== i))} className="self-start rounded-md border border-border px-2 py-1 text-xs text-destructive hover:bg-destructive/10">{tr.removeParagraph}</button>
                        )}
                    </div>
                </FieldRow>
            ))}
            <button type="button" onClick={() => upd([...blocks.intro.paragraphs, ''])} className="text-xs text-primary hover:underline">{tr.addParagraph}</button>
        </div>
    )
}

function DemoEditor({ blocks, tr, onChange }: { blocks: ProposalBlocks; tr: Btr; onChange: (b: ProposalBlocks) => void }) {
    const s = (p: Partial<ProposalBlocks['demo']>) => onChange({ ...blocks, demo: { ...blocks.demo, ...p } })
    const upUrl = (i: number, p: Partial<DemoUrl>) => s({ urls: blocks.demo.urls.map((u, j) => j === i ? { ...u, ...p } : u) })
    return (
        <div>
            <FieldRow label={tr.demoTitle}><input className={inputCls} value={blocks.demo.title} onChange={e => s({ title: e.target.value })} /></FieldRow>
            <FieldRow label={tr.demoBody}><textarea className={textareaCls} value={blocks.demo.body} onChange={e => s({ body: e.target.value })} /></FieldRow>
            {blocks.demo.urls.map((u, i) => (
                <div key={i} className="mb-2 grid grid-cols-2 gap-2">
                    <FieldRow label={tr.demoUrlHref.replace('{n}', String(i + 1))}><input className={inputCls} value={u.href} placeholder="https://" onChange={e => upUrl(i, { href: e.target.value })} /></FieldRow>
                    <FieldRow label={tr.demoUrlLabel.replace('{n}', String(i + 1))}><input className={inputCls} value={u.label} onChange={e => upUrl(i, { label: e.target.value })} /></FieldRow>
                </div>
            ))}
            <FieldRow label={tr.demoWarning}><input className={inputCls} value={blocks.demo.warning ?? ''} onChange={e => s({ warning: e.target.value })} /></FieldRow>
            <FieldRow label={tr.demoNote}><input className={inputCls} value={blocks.demo.note ?? ''} onChange={e => s({ note: e.target.value })} /></FieldRow>
        </div>
    )
}

function StructureEditor({ blocks, tr, onChange }: { blocks: ProposalBlocks; tr: Btr; onChange: (b: ProposalBlocks) => void }) {
    const s = (p: Partial<ProposalBlocks['structure']>) => onChange({ ...blocks, structure: { ...blocks.structure, ...p } })
    const upItem = (i: number, p: Partial<StructureItem>) => s({ items: blocks.structure.items.map((it, j) => j === i ? { ...it, ...p } : it) })
    return (
        <div>
            <FieldRow label={tr.structureTitle}><input className={inputCls} value={blocks.structure.title} onChange={e => s({ title: e.target.value })} /></FieldRow>
            {blocks.structure.items.map((item, i) => (
                <div key={i} className="mb-2 rounded-lg border border-border p-3">
                    <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
                        <button type="button" onClick={() => s({ items: blocks.structure.items.filter((_, j) => j !== i) })} className="text-xs text-destructive hover:underline">{tr.removeItem}</button>
                    </div>
                    <div className="grid grid-cols-[60px_1fr_2fr] gap-2">
                        <FieldRow label={tr.structureIcon}><input className={inputCls} value={item.icon} onChange={e => upItem(i, { icon: e.target.value })} /></FieldRow>
                        <FieldRow label={tr.structureName}><input className={inputCls} value={item.name} onChange={e => upItem(i, { name: e.target.value })} /></FieldRow>
                        <FieldRow label={tr.structureItemDesc}><input className={inputCls} value={item.description} onChange={e => upItem(i, { description: e.target.value })} /></FieldRow>
                    </div>
                </div>
            ))}
            <button type="button" onClick={() => s({ items: [...blocks.structure.items, { icon: '📋', name: '', description: '' }] })} className="text-xs text-primary hover:underline">{tr.addItem}</button>
            <FieldRow label={tr.structureNote}><input className={inputCls} value={blocks.structure.note ?? ''} onChange={e => s({ note: e.target.value })} /></FieldRow>
        </div>
    )
}

function ScopeEditor({ blocks, tr, onChange }: { blocks: ProposalBlocks; tr: Btr; onChange: (b: ProposalBlocks) => void }) {
    const s = (p: Partial<ProposalBlocks['scope']>) => onChange({ ...blocks, scope: { ...blocks.scope, ...p } })
    const upItem = (i: number, p: Partial<ScopeItem>) => s({ items: blocks.scope.items.map((it, j) => j === i ? { ...it, ...p } : it) })
    return (
        <div>
            <FieldRow label={tr.scopeTitle}><input className={inputCls} value={blocks.scope.title} onChange={e => s({ title: e.target.value })} /></FieldRow>
            {blocks.scope.items.map((item, i) => (
                <div key={i} className="mb-2 flex gap-2">
                    <textarea className={textareaCls} value={item.html} placeholder={tr.scopeItemHtml} onChange={e => upItem(i, { html: e.target.value })} />
                    <button type="button" onClick={() => s({ items: blocks.scope.items.filter((_, j) => j !== i) })} className="self-start rounded-md border border-border px-2 py-1 text-xs text-destructive hover:bg-destructive/10">{tr.removeItem}</button>
                </div>
            ))}
            <button type="button" onClick={() => s({ items: [...blocks.scope.items, { html: '' }] })} className="text-xs text-primary hover:underline">{tr.addItem}</button>
        </div>
    )
}

function TestingEditor({ blocks, tr, onChange }: { blocks: ProposalBlocks; tr: Btr; onChange: (b: ProposalBlocks) => void }) {
    const s = (p: Partial<ProposalBlocks['testing']>) => onChange({ ...blocks, testing: { ...blocks.testing, ...p } })
    const upCard = (i: number, p: Partial<TestingCard>) => s({ cards: blocks.testing.cards.map((c, j) => j === i ? { ...c, ...p } : c) })
    return (
        <div>
            <FieldRow label={tr.testingIntro}><textarea className={textareaCls} value={blocks.testing.intro} onChange={e => s({ intro: e.target.value })} /></FieldRow>
            <div className="grid grid-cols-2 gap-3">
                {blocks.testing.cards.map((card, i) => (
                    <div key={i} className="rounded-lg border border-border p-3">
                        <div className="grid grid-cols-[50px_1fr] gap-2 mb-2">
                            <FieldRow label={tr.cardIcon}><input className={inputCls} value={card.icon} onChange={e => upCard(i, { icon: e.target.value })} /></FieldRow>
                            <FieldRow label={tr.cardTitle}><input className={inputCls} value={card.title} onChange={e => upCard(i, { title: e.target.value })} /></FieldRow>
                        </div>
                        <FieldRow label={tr.cardDesc}><input className={inputCls} value={card.description} onChange={e => upCard(i, { description: e.target.value })} /></FieldRow>
                    </div>
                ))}
            </div>
            <FieldRow label={tr.testingNote}><input className={inputCls} value={blocks.testing.note ?? ''} onChange={e => s({ note: e.target.value })} /></FieldRow>
        </div>
    )
}

function TechnologyEditor({ blocks, tr, onChange }: { blocks: ProposalBlocks; tr: Btr; onChange: (b: ProposalBlocks) => void }) {
    const s = (p: Partial<ProposalBlocks['technology']>) => onChange({ ...blocks, technology: { ...blocks.technology, ...p } })
    const upOpt = (i: number, p: Partial<TechOption>) => s({ options: blocks.technology.options.map((o, j) => j === i ? { ...o, ...p } : o) })
    const upUrl = (oi: number, ui: number, p: Partial<DemoUrl>) => s({ options: blocks.technology.options.map((o, j) => j !== oi ? o : { ...o, urls: o.urls.map((u, k) => k === ui ? { ...u, ...p } : u) }) })
    return (
        <div>
            <FieldRow label={tr.technologyBody}><textarea className={textareaCls} value={blocks.technology.body} onChange={e => s({ body: e.target.value })} /></FieldRow>
            {blocks.technology.options.map((opt, i) => (
                <div key={i} className="mb-3 rounded-lg border border-border p-3">
                    <div className="grid grid-cols-[50px_1fr] gap-2 mb-2">
                        <FieldRow label={tr.techOptionIcon.replace('{n}', String(i + 1))}><input className={inputCls} value={opt.icon} onChange={e => upOpt(i, { icon: e.target.value })} /></FieldRow>
                        <FieldRow label={tr.techOptionTitle.replace('{n}', String(i + 1))}><input className={inputCls} value={opt.title} onChange={e => upOpt(i, { title: e.target.value })} /></FieldRow>
                    </div>
                    {opt.urls.map((u, j) => (
                        <div key={j} className="grid grid-cols-2 gap-2">
                            <FieldRow label={tr.techOptionUrl.replace('{n}', String(j + 1))}><input className={inputCls} value={u.href} placeholder="https://" onChange={e => upUrl(i, j, { href: e.target.value })} /></FieldRow>
                            <FieldRow label={tr.techOptionUrlLabel}><input className={inputCls} value={u.label} onChange={e => upUrl(i, j, { label: e.target.value })} /></FieldRow>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
}

function PricingExtraEditor({ blocks, tr, onChange }: { blocks: ProposalBlocks; tr: Btr; onChange: (b: ProposalBlocks) => void }) {
    const s = (p: Partial<ProposalBlocks['pricingExtra']>) => onChange({ ...blocks, pricingExtra: { ...blocks.pricingExtra, ...p } })
    return (
        <div className="grid grid-cols-2 gap-3">
            <FieldRow label={tr.timeline}><input className={inputCls} value={blocks.pricingExtra.timeline} onChange={e => s({ timeline: e.target.value })} /></FieldRow>
            <FieldRow label={tr.timelineSub}><input className={inputCls} value={blocks.pricingExtra.timelineSub} onChange={e => s({ timelineSub: e.target.value })} /></FieldRow>
            <FieldRow label={tr.contractType}><input className={inputCls} value={blocks.pricingExtra.contractType} onChange={e => s({ contractType: e.target.value })} /></FieldRow>
            <FieldRow label={tr.contractSub}><input className={inputCls} value={blocks.pricingExtra.contractSub} onChange={e => s({ contractSub: e.target.value })} /></FieldRow>
        </div>
    )
}

function AboutEditor({ blocks, tr, onChange }: { blocks: ProposalBlocks; tr: Btr; onChange: (b: ProposalBlocks) => void }) {
    return (
        <FieldRow label={tr.ctaText}>
            <textarea className={textareaCls} value={blocks.about.ctaText} onChange={e => onChange({ ...blocks, about: { ...blocks.about, ctaText: e.target.value } })} />
        </FieldRow>
    )
}

// ── Main component ────────────────────────────────────────────────────────────

interface StepTemplateProps {
    client: Client | null
    offerTitle: string
    totalGross: number
    currency: string
    paymentDays: number
    blocks: ProposalBlocks
    onBlocksChange: (blocks: ProposalBlocks) => void
}

export default function StepTemplate({ client, offerTitle, totalGross, currency, paymentDays, blocks, onBlocksChange }: StepTemplateProps) {
    const tr = useTranslations('offerDetail')
    const btr = tr.template.blocks
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isPreviewLoading, setIsPreviewLoading] = useState(false)

    const toggleBlock = useCallback(<K extends keyof ProposalBlocks>(key: K, enabled: boolean) => {
        onBlocksChange({ ...blocks, [key]: { ...(blocks[key] as object), enabled } })
    }, [blocks, onBlocksChange])

    const handlePreview = async () => {
        setIsPreviewLoading(true)
        try {
            const res = await fetch('/api/proposals/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    number: 'PODGLĄD',
                    title: offerTitle || 'Nowa oferta',
                    totalGross,
                    currency,
                    paymentDays,
                    createdAt: new Date().toISOString(),
                    client: { name: client?.name ?? 'Klient', company: client?.company ?? null },
                    user: { name: null, email: '' },
                    blocks,
                }),
            })
            if (!res.ok) throw new Error('Preview failed')
            const html = await res.text()
            const blob = new Blob([html], { type: 'text/html' })
            const url = URL.createObjectURL(blob)
            if (previewUrl) URL.revokeObjectURL(previewUrl)
            setPreviewUrl(url)
            setPreviewOpen(true)
        } catch {
            // fallback: open in new tab via the POST route won't work directly, show info
        } finally {
            setIsPreviewLoading(false)
        }
    }

    const BLOCK_DEFS = [
        { key: 'intro' as const, icon: '📝', title: btr.intro, desc: btr.introDesc, editor: <IntroEditor blocks={blocks} tr={btr} onChange={onBlocksChange} /> },
        { key: 'demo' as const, icon: '💻', title: btr.demo, desc: btr.demoDesc, editor: <DemoEditor blocks={blocks} tr={btr} onChange={onBlocksChange} /> },
        { key: 'structure' as const, icon: '🗂️', title: btr.structure, desc: btr.structureDesc, editor: <StructureEditor blocks={blocks} tr={btr} onChange={onBlocksChange} /> },
        { key: 'scope' as const, icon: '📦', title: btr.scope, desc: btr.scopeDesc, editor: <ScopeEditor blocks={blocks} tr={btr} onChange={onBlocksChange} /> },
        { key: 'testing' as const, icon: '🔬', title: btr.testing, desc: btr.testingDesc, editor: <TestingEditor blocks={blocks} tr={btr} onChange={onBlocksChange} /> },
        { key: 'technology' as const, icon: '⚙️', title: btr.technology, desc: btr.technologyDesc, editor: <TechnologyEditor blocks={blocks} tr={btr} onChange={onBlocksChange} /> },
        { key: 'pricingExtra' as const, icon: '💰', title: btr.pricing, desc: btr.pricingDesc, editor: <PricingExtraEditor blocks={blocks} tr={btr} onChange={onBlocksChange} /> },
        { key: 'about' as const, icon: '🙋', title: btr.about, desc: btr.aboutDesc, editor: <AboutEditor blocks={blocks} tr={btr} onChange={onBlocksChange} /> },
    ]

    return (
        <div>
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Szablon: Strona internetowa</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Włącz sekcje i wypełnij treść. Zmiany możesz zawsze edytować po utworzeniu oferty.</p>
                </div>
                <Button variant="outline" onClick={handlePreview} disabled={isPreviewLoading}>
                    <Eye className="h-4 w-4" />
                    {isPreviewLoading ? 'Ładowanie…' : 'Podgląd'}
                </Button>
            </div>

            <div className="space-y-2">
                {BLOCK_DEFS.map(({ key, icon, title, desc, editor }) => (
                    <BlockCard
                        key={key}
                        icon={icon}
                        title={title}
                        description={desc}
                        enabled={(blocks[key] as { enabled: boolean }).enabled}
                        onToggle={v => toggleBlock(key, v)}
                        trEnabled={btr.enabledLabel}
                        trDisabled={btr.disabledLabel}
                    >
                        {editor}
                    </BlockCard>
                ))}
            </div>

            {/* Preview iframe modal */}
            {previewOpen && previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-border bg-card shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border px-5 py-3">
                            <span className="font-semibold text-foreground">Podgląd szablonu</span>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-secondary/60">
                                    <ExternalLink className="h-3.5 w-3.5" /> Nowa karta
                                </button>
                                <button type="button" onClick={() => { setPreviewOpen(false); if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) } }} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-secondary/60">
                                    Zamknij
                                </button>
                            </div>
                        </div>
                        <iframe src={previewUrl} title="Podgląd szablonu" className="flex-1 rounded-b-2xl" />
                    </div>
                </div>
            )}
        </div>
    )
}
