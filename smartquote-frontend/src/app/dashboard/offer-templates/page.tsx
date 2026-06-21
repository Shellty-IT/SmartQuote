// src/app/dashboard/offer-templates/page.tsx
'use client';

import { useState } from 'react';
import { FileSignature, FileText } from 'lucide-react';
import { useTranslations } from '@/i18n';
import { cn } from '@/lib/utils';
import { ContractDocumentTemplates } from './components/ContractDocumentTemplates';
import { DocumentTemplatesTab } from './components/DocumentTemplatesTab';

type PageTab = 'offers' | 'contracts';

export default function OfferTemplatesPage() {
    const tr = useTranslations('offerTemplatesPage');
    const [activeTab, setActiveTab] = useState<PageTab>('offers');

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
            <div>
                <h1 className="text-xl font-bold tracking-tight md:text-3xl">{tr.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{tr.subtitle}</p>
            </div>

            <div className="flex w-fit gap-1 rounded-xl border border-border bg-card p-1 shadow-card">
                <button
                    type="button"
                    onClick={() => setActiveTab('offers')}
                    className={cn(
                        'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                        activeTab === 'offers'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                    )}
                >
                    <FileText className="h-4 w-4" />
                    {tr.tabOffers}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('contracts')}
                    className={cn(
                        'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                        activeTab === 'contracts'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                    )}
                >
                    <FileSignature className="h-4 w-4" />
                    {tr.tabContracts}
                </button>
            </div>

            {activeTab === 'offers' && (
                <div className="space-y-3">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">{tr.docTemplateSection}</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">{tr.docTemplateSectionSub}</p>
                    </div>
                    <DocumentTemplatesTab />
                </div>
            )}

            {activeTab === 'contracts' && (
                <div className="space-y-3">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">{tr.contractDocSection}</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">{tr.contractDocSectionSub}</p>
                    </div>
                    <ContractDocumentTemplates />
                </div>
            )}
        </div>
    );
}
