// src/app/dashboard/offer-templates/components/DocumentTemplatesTab.tsx
// Offer document templates — one editor per template type, all saved to localStorage.
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { FileText, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui'
import { ProposalDocumentEditor } from '@/components/offers/editor/ProposalDocumentEditor'
import { ShopDocumentEditor } from '@/components/offers/ShopDocumentEditor'
import { WebsiteV2DocumentEditor } from '@/components/offers/WebsiteV2DocumentEditor'
import { WebsiteV3DocumentEditor } from '@/components/offers/WebsiteV3DocumentEditor'
import { SupportDocumentEditor } from '@/components/offers/SupportDocumentEditor'
import { MobileAppDocumentEditor } from '@/components/offers/MobileAppDocumentEditor'
import { MobileSimpleDocumentEditor } from '@/components/offers/MobileSimpleDocumentEditor'
import { UniversalDocumentEditor } from '@/components/offers/UniversalDocumentEditor'
import { settingsApi } from '@/lib/api'
import { buildDefaultBlocks, mergeWithDefaults, type ProposalBlocks } from '@/lib/pdf/proposal-blocks'
import { buildDefaultShopBlocks, mergeShopWithDefaults, type ShopBlocks } from '@/lib/pdf/shop-blocks'
import { buildDefaultWebsiteV2Blocks, mergeWebsiteV2WithDefaults, type WebsiteV2Blocks } from '@/lib/pdf/website-v2-blocks'
import { buildDefaultWebsiteV3Blocks, mergeWebsiteV3WithDefaults, type WebsiteV3Blocks } from '@/lib/pdf/website-v3-blocks'
import { buildDefaultSupportBlocks, mergeSupportWithDefaults, type SupportBlocks } from '@/lib/pdf/support-blocks'
import { buildDefaultMobileAppBlocks, mergeMobileAppWithDefaults, type MobileAppBlocks } from '@/lib/pdf/mobile-app-blocks'
import { buildDefaultMobileSimpleBlocks, mergeMobileSimpleWithDefaults, type MobileSimpleBlocks } from '@/lib/pdf/mobile-simple-blocks'
import { buildDefaultUniversalBlocks, mergeUniversalWithDefaults, type UniversalBlocks } from '@/lib/pdf/universal-blocks'
import { useTranslations } from '@/i18n'
import { cn } from '@/lib/utils'
import type { CompanyInfo } from '@/types'

// ── LocalStorage keys ─────────────────────────────────────────────────────────

export const LS_KEYS = {
    classic: 'sq_default_classic_settings',
    proposal: 'sq_default_proposal_blocks',
    shop: 'sq_default_shop_blocks',
    website_v2: 'sq_default_website_v2_blocks',
    website_v3: 'sq_default_website_v3_blocks',
    support: 'sq_default_support_blocks',
    mobile_app: 'sq_default_mobile_app_blocks',
    mobile_simple: 'sq_default_mobile_simple_blocks',
    universal: 'sq_default_universal_blocks',
} as const

interface ClassicSettings {
    paymentDays: number
    terms: string
    notes: string
}

const DEFAULT_CLASSIC: ClassicSettings = { paymentDays: 14, terms: '', notes: '' }

function loadFromStorage<T>(key: string): Partial<T> | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = localStorage.getItem(key)
        return raw ? (JSON.parse(raw) as Partial<T>) : null
    } catch {
        return null
    }
}

function saveToStorage<T>(key: string, blocks: T) {
    try {
        localStorage.setItem(key, JSON.stringify(blocks))
    } catch { /* quota exceeded */ }
}

// ── Classic (systemowy) template editor ──────────────────────────────────────

function ClassicTemplateEditor() {
    const tr = useTranslations('offerTemplatesPage')
    const [settings, setSettings] = useState<ClassicSettings>(() => {
        try {
            const raw = typeof window !== 'undefined' ? localStorage.getItem(LS_KEYS.classic) : null
            return raw ? { ...DEFAULT_CLASSIC, ...(JSON.parse(raw) as Partial<ClassicSettings>) } : DEFAULT_CLASSIC
        } catch { return DEFAULT_CLASSIC }
    })
    const { saved, flash } = useSaveIndicator()

    function update<K extends keyof ClassicSettings>(field: K, value: ClassicSettings[K]) {
        const next = { ...settings, [field]: value }
        setSettings(next)
        saveToStorage(LS_KEYS.classic, next)
        flash()
    }

    function handleReset() {
        if (!confirm(tr.proposalResetConfirm)) return
        setSettings(DEFAULT_CLASSIC)
        saveToStorage(LS_KEYS.classic, DEFAULT_CLASSIC)
    }

    return (
        <div className="space-y-4">
            <TemplateEditorHeader saved={saved} onReset={handleReset} />
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-6">
                {/* Header info */}
                <div className="flex items-start gap-4 pb-5 border-b border-border">
                    <div className="flex-shrink-0 rounded-xl bg-primary/10 p-3 text-primary">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-base mb-1">Szablon systemowy PDF</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Wygląd generowany automatycznie przez system. Poniższe wartości stosowane jako domyślne przy tworzeniu nowej oferty.
                            Logo i dane firmowe pobierane są z{' '}
                            <span
                                className="font-medium text-primary cursor-pointer hover:underline"
                                onClick={() => window.open('/dashboard/settings', '_blank')}
                            >
                                Ustawień → Firma
                            </span>.
                        </p>
                    </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Termin płatności (dni)</label>
                        <input
                            type="number"
                            min={0}
                            max={365}
                            value={settings.paymentDays}
                            onChange={(e) => update('paymentDays', Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Domyślne warunki płatności</label>
                    <textarea
                        value={settings.terms}
                        onChange={(e) => update('terms', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/40"
                        placeholder="Np. Płatność przelewem w ciągu 14 dni od wystawienia faktury..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Domyślne uwagi</label>
                    <textarea
                        value={settings.notes}
                        onChange={(e) => update('notes', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/40"
                        placeholder="Np. Oferta ważna 30 dni od daty wystawienia..."
                    />
                </div>

                {/* What's included */}
                <div className="pt-4 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{tr.contentsLabel}</p>
                    <ul className="text-xs text-muted-foreground space-y-1 columns-2 gap-4">
                        {([tr.classicOfferContent1, tr.classicOfferContent2, tr.classicOfferContent3, tr.classicOfferContent4, tr.classicOfferContent5] as string[]).map((item) => (
                            <li key={item} className="break-inside-avoid">• {item}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}

// ── Shared demo offer builders ────────────────────────────────────────────────

function buildOldStyleOffer(session: ReturnType<typeof useSession>['data'], companyInfo: CompanyInfo | null) {
    return {
        number: 'SZABLON',
        title: 'Przykładowy dokument',
        totalGross: 0,
        currency: 'PLN',
        paymentDays: 14,
        createdAt: new Date().toISOString(),
        client: { name: 'Przykładowy Klient', company: null },
        user: {
            name: session?.user?.name ?? null,
            email: session?.user?.email ?? '',
            companyInfo: companyInfo
                ? {
                      name: companyInfo.name,
                      website: companyInfo.website,
                      logo: companyInfo.logo,
                      phone: companyInfo.phone,
                      email: companyInfo.email ?? null,
                  }
                : null,
        },
    }
}

function buildNewStyleOffer(session: ReturnType<typeof useSession>['data'], companyInfo: CompanyInfo | null) {
    return {
        offerNumber: 'SZABLON',
        offerDate: new Date().toLocaleDateString('pl-PL'),
        clientName: 'Przykładowy Klient',
        userLogoUrl: companyInfo?.logo ?? undefined,
        userCompanyName: companyInfo?.name ?? session?.user?.name ?? undefined,
        userEmail: companyInfo?.email ?? session?.user?.email ?? undefined,
        userPhone: companyInfo?.phone ?? undefined,
        userWebsite: companyInfo?.website ?? undefined,
    }
}

// ── Save indicator wrapper ────────────────────────────────────────────────────

function useSaveIndicator() {
    const [saved, setSaved] = useState(false)
    const flash = useCallback(() => {
        setSaved(true)
        const t = setTimeout(() => setSaved(false), 2000)
        return () => clearTimeout(t)
    }, [])
    return { saved, flash }
}

// ── Proposal template editor ──────────────────────────────────────────────────

function ProposalTemplateEditor({ session, companyInfo }: { session: ReturnType<typeof useSession>['data']; companyInfo: CompanyInfo | null }) {
    const tr = useTranslations('offerTemplatesPage')
    const [blocks, setBlocks] = useState<ProposalBlocks>(() => mergeWithDefaults(loadFromStorage<ProposalBlocks>(LS_KEYS.proposal)))
    const { saved, flash } = useSaveIndicator()

    const demoOffer = useMemo(() => ({
        ...buildOldStyleOffer(session, companyInfo),
        blocks,
    }), [session, companyInfo, blocks])

    const handleBlocksChange = useCallback((updated: ProposalBlocks) => {
        setBlocks(updated)
        saveToStorage(LS_KEYS.proposal, updated)
        flash()
    }, [flash])

    const handleReset = useCallback(() => {
        if (!confirm(tr.proposalResetConfirm)) return
        const fresh = buildDefaultBlocks()
        setBlocks(fresh)
        saveToStorage(LS_KEYS.proposal, fresh)
    }, [tr.proposalResetConfirm])

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-muted-foreground">{tr.proposalAutoSave}</p>
                <div className="flex items-center gap-3 shrink-0">
                    {saved && <span className="text-xs text-green-600 font-medium">{tr.proposalSaved}</span>}
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="h-3.5 w-3.5" />
                        {tr.proposalReset}
                    </Button>
                </div>
            </div>
            <ProposalDocumentEditor offer={demoOffer} blocks={blocks} onBlocksChange={handleBlocksChange} />
        </div>
    )
}

// ── Shop template editor ──────────────────────────────────────────────────────

function ShopTemplateEditor({ session, companyInfo }: { session: ReturnType<typeof useSession>['data']; companyInfo: CompanyInfo | null }) {
    const [blocks, setBlocks] = useState<ShopBlocks>(() => {
        const saved = loadFromStorage<ShopBlocks>(LS_KEYS.shop)
        return saved ? mergeShopWithDefaults(saved) : buildDefaultShopBlocks()
    })
    const { saved, flash } = useSaveIndicator()
    const offer = useMemo(() => buildOldStyleOffer(session, companyInfo), [session, companyInfo])

    const handleBlocksChange = useCallback((updated: ShopBlocks) => {
        setBlocks(updated)
        saveToStorage(LS_KEYS.shop, updated)
        flash()
    }, [flash])

    return (
        <div className="space-y-3">
            <TemplateEditorHeader saved={saved} onReset={() => { const f = buildDefaultShopBlocks(); setBlocks(f); saveToStorage(LS_KEYS.shop, f) }} />
            <ShopDocumentEditor offer={offer as Parameters<typeof ShopDocumentEditor>[0]['offer']} blocks={blocks} onBlocksChange={handleBlocksChange} />
        </div>
    )
}

// ── WebsiteV2 template editor ─────────────────────────────────────────────────

function WebsiteV2TemplateEditor({ session, companyInfo }: { session: ReturnType<typeof useSession>['data']; companyInfo: CompanyInfo | null }) {
    const [blocks, setBlocks] = useState<WebsiteV2Blocks>(() => {
        const saved = loadFromStorage<WebsiteV2Blocks>(LS_KEYS.website_v2)
        return saved ? mergeWebsiteV2WithDefaults(saved) : buildDefaultWebsiteV2Blocks()
    })
    const { saved, flash } = useSaveIndicator()
    const offer = useMemo(() => buildOldStyleOffer(session, companyInfo), [session, companyInfo])

    const handleBlocksChange = useCallback((updated: WebsiteV2Blocks) => {
        setBlocks(updated)
        saveToStorage(LS_KEYS.website_v2, updated)
        flash()
    }, [flash])

    return (
        <div className="space-y-3">
            <TemplateEditorHeader saved={saved} onReset={() => { const f = buildDefaultWebsiteV2Blocks(); setBlocks(f); saveToStorage(LS_KEYS.website_v2, f) }} />
            <WebsiteV2DocumentEditor offer={offer as Parameters<typeof WebsiteV2DocumentEditor>[0]['offer']} blocks={blocks} onBlocksChange={handleBlocksChange} />
        </div>
    )
}

// ── WebsiteV3 template editor ─────────────────────────────────────────────────

function WebsiteV3TemplateEditor({ session, companyInfo }: { session: ReturnType<typeof useSession>['data']; companyInfo: CompanyInfo | null }) {
    const [blocks, setBlocks] = useState<WebsiteV3Blocks>(() => {
        const saved = loadFromStorage<WebsiteV3Blocks>(LS_KEYS.website_v3)
        return saved ? mergeWebsiteV3WithDefaults(saved) : buildDefaultWebsiteV3Blocks()
    })
    const { saved, flash } = useSaveIndicator()
    const offer = useMemo(() => buildOldStyleOffer(session, companyInfo), [session, companyInfo])

    const handleBlocksChange = useCallback((updated: WebsiteV3Blocks) => {
        setBlocks(updated)
        saveToStorage(LS_KEYS.website_v3, updated)
        flash()
    }, [flash])

    return (
        <div className="space-y-3">
            <TemplateEditorHeader saved={saved} onReset={() => { const f = buildDefaultWebsiteV3Blocks(); setBlocks(f); saveToStorage(LS_KEYS.website_v3, f) }} />
            <WebsiteV3DocumentEditor offer={offer as Parameters<typeof WebsiteV3DocumentEditor>[0]['offer']} blocks={blocks} onBlocksChange={handleBlocksChange} />
        </div>
    )
}

// ── Support template editor ───────────────────────────────────────────────────

function SupportTemplateEditor({ session, companyInfo }: { session: ReturnType<typeof useSession>['data']; companyInfo: CompanyInfo | null }) {
    const [blocks, setBlocks] = useState<SupportBlocks>(() => {
        const saved = loadFromStorage<SupportBlocks>(LS_KEYS.support)
        return saved ? mergeSupportWithDefaults(saved) : buildDefaultSupportBlocks()
    })
    const { saved, flash } = useSaveIndicator()
    const offer = useMemo(() => buildNewStyleOffer(session, companyInfo), [session, companyInfo])

    const handleBlocksChange = useCallback((updated: SupportBlocks) => {
        setBlocks(updated)
        saveToStorage(LS_KEYS.support, updated)
        flash()
    }, [flash])

    return (
        <div className="space-y-3">
            <TemplateEditorHeader saved={saved} onReset={() => { const f = buildDefaultSupportBlocks(); setBlocks(f); saveToStorage(LS_KEYS.support, f) }} />
            <SupportDocumentEditor offer={offer as Parameters<typeof SupportDocumentEditor>[0]['offer']} blocks={blocks} onBlocksChange={handleBlocksChange} />
        </div>
    )
}

// ── MobileApp template editor ─────────────────────────────────────────────────

function MobileAppTemplateEditor({ session, companyInfo }: { session: ReturnType<typeof useSession>['data']; companyInfo: CompanyInfo | null }) {
    const [blocks, setBlocks] = useState<MobileAppBlocks>(() => {
        const saved = loadFromStorage<MobileAppBlocks>(LS_KEYS.mobile_app)
        return saved ? mergeMobileAppWithDefaults(saved) : buildDefaultMobileAppBlocks()
    })
    const { saved, flash } = useSaveIndicator()
    const offer = useMemo(() => buildNewStyleOffer(session, companyInfo), [session, companyInfo])

    const handleBlocksChange = useCallback((updated: MobileAppBlocks) => {
        setBlocks(updated)
        saveToStorage(LS_KEYS.mobile_app, updated)
        flash()
    }, [flash])

    return (
        <div className="space-y-3">
            <TemplateEditorHeader saved={saved} onReset={() => { const f = buildDefaultMobileAppBlocks(); setBlocks(f); saveToStorage(LS_KEYS.mobile_app, f) }} />
            <MobileAppDocumentEditor offer={offer as Parameters<typeof MobileAppDocumentEditor>[0]['offer']} blocks={blocks} onBlocksChange={handleBlocksChange} />
        </div>
    )
}

// ── MobileSimple template editor ──────────────────────────────────────────────

function MobileSimpleTemplateEditor({ session, companyInfo }: { session: ReturnType<typeof useSession>['data']; companyInfo: CompanyInfo | null }) {
    const [blocks, setBlocks] = useState<MobileSimpleBlocks>(() => {
        const saved = loadFromStorage<MobileSimpleBlocks>(LS_KEYS.mobile_simple)
        return saved ? mergeMobileSimpleWithDefaults(saved) : buildDefaultMobileSimpleBlocks()
    })
    const { saved, flash } = useSaveIndicator()
    const offer = useMemo(() => buildNewStyleOffer(session, companyInfo), [session, companyInfo])

    const handleBlocksChange = useCallback((updated: MobileSimpleBlocks) => {
        setBlocks(updated)
        saveToStorage(LS_KEYS.mobile_simple, updated)
        flash()
    }, [flash])

    return (
        <div className="space-y-3">
            <TemplateEditorHeader saved={saved} onReset={() => { const f = buildDefaultMobileSimpleBlocks(); setBlocks(f); saveToStorage(LS_KEYS.mobile_simple, f) }} />
            <MobileSimpleDocumentEditor offer={offer as Parameters<typeof MobileSimpleDocumentEditor>[0]['offer']} blocks={blocks} onBlocksChange={handleBlocksChange} />
        </div>
    )
}

// ── Universal template editor ─────────────────────────────────────────────────

function UniversalTemplateEditor({ session, companyInfo }: { session: ReturnType<typeof useSession>['data']; companyInfo: CompanyInfo | null }) {
    const [blocks, setBlocks] = useState<UniversalBlocks>(() => {
        const saved = loadFromStorage<UniversalBlocks>(LS_KEYS.universal)
        return saved ? mergeUniversalWithDefaults(saved) : buildDefaultUniversalBlocks()
    })
    const { saved, flash } = useSaveIndicator()
    const offer = useMemo(() => buildNewStyleOffer(session, companyInfo), [session, companyInfo])

    const handleBlocksChange = useCallback((updated: UniversalBlocks) => {
        setBlocks(updated)
        saveToStorage(LS_KEYS.universal, updated)
        flash()
    }, [flash])

    return (
        <div className="space-y-3">
            <TemplateEditorHeader saved={saved} onReset={() => { const f = buildDefaultUniversalBlocks(); setBlocks(f); saveToStorage(LS_KEYS.universal, f) }} />
            <UniversalDocumentEditor offer={offer as Parameters<typeof UniversalDocumentEditor>[0]['offer']} blocks={blocks} onBlocksChange={handleBlocksChange} />
        </div>
    )
}

// ── Shared header for non-proposal editors ────────────────────────────────────

function TemplateEditorHeader({ saved, onReset }: { saved: boolean; onReset: () => void }) {
    const tr = useTranslations('offerTemplatesPage')
    return (
        <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-muted-foreground">{tr.proposalAutoSave}</p>
            <div className="flex items-center gap-3 shrink-0">
                {saved && <span className="text-xs text-green-600 font-medium">{tr.proposalSaved}</span>}
                <Button variant="outline" size="sm" onClick={() => { if (confirm(tr.proposalResetConfirm)) onReset() }}>
                    <RotateCcw className="h-3.5 w-3.5" />
                    {tr.proposalReset}
                </Button>
            </div>
        </div>
    )
}

// ── Main export ───────────────────────────────────────────────────────────────

type DocType = 'classic' | 'proposal' | 'shop' | 'website_v2' | 'website_v3' | 'support' | 'mobile_app' | 'mobile_simple' | 'universal'

const DOC_TYPE_META: { key: DocType; label: string; icon: string }[] = [
    { key: 'classic', label: 'Uniwersalny - systemowy', icon: '📄' },
    { key: 'universal', label: 'Uniwersalny - klasyczny', icon: '💼' },
    { key: 'proposal', label: 'Strona internetowa - V1', icon: '🌐' },
    { key: 'website_v2', label: 'Strona internetowa - domyślny', icon: '🖥' },
    { key: 'website_v3', label: 'Strona internetowa - zaawansowany', icon: '✨' },
    { key: 'mobile_simple', label: 'Aplikacja mobilna - domyślny', icon: '✅' },
    { key: 'mobile_app', label: 'Aplikacja mobilna - zaawansowany', icon: '📱' },
    { key: 'shop', label: 'Sklep internetowy', icon: '🛒' },
    { key: 'support', label: 'Wsparcie IT / SLA', icon: '🛡' },
]

export function DocumentTemplatesTab() {
    const tr = useTranslations('offerTemplatesPage')
    const { data: session } = useSession()
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
    const [docType, setDocType] = useState<DocType>('classic')

    useEffect(() => {
        settingsApi.getCompany().then(setCompanyInfo).catch(() => {})
    }, [])

    return (
        <div className="space-y-5">
            <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{tr.docTypeLabel}</p>
                <div className="flex gap-2 flex-wrap">
                    {DOC_TYPE_META.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setDocType(t.key)}
                            className={cn(
                                'flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all',
                                docType === t.key
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-border bg-card text-muted-foreground hover:border-border/60 hover:text-foreground',
                            )}
                        >
                            <span>{t.icon}</span>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {docType === 'classic' && <ClassicTemplateEditor />}
            {docType === 'proposal' && <ProposalTemplateEditor session={session} companyInfo={companyInfo} />}
            {docType === 'shop' && <ShopTemplateEditor session={session} companyInfo={companyInfo} />}
            {docType === 'website_v2' && <WebsiteV2TemplateEditor session={session} companyInfo={companyInfo} />}
            {docType === 'website_v3' && <WebsiteV3TemplateEditor session={session} companyInfo={companyInfo} />}
            {docType === 'support' && <SupportTemplateEditor session={session} companyInfo={companyInfo} />}
            {docType === 'mobile_app' && <MobileAppTemplateEditor session={session} companyInfo={companyInfo} />}
            {docType === 'mobile_simple' && <MobileSimpleTemplateEditor session={session} companyInfo={companyInfo} />}
            {docType === 'universal' && <UniversalTemplateEditor session={session} companyInfo={companyInfo} />}
        </div>
    )
}
