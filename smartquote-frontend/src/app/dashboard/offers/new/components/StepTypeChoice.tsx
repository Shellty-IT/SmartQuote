// src/app/dashboard/offers/new/components/StepTypeChoice.tsx

import {
    Briefcase,
    FileText,
    Globe,
    Layers,
    Monitor,
    ShieldCheck,
    ShoppingCart,
    Smartphone,
    Sparkles,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { TemplateChoiceCard } from '@/components/ui';
import { useTranslations } from '@/i18n';
import type { TemplateType } from '../constants';

interface StepTypeChoiceProps {
    selectedType: TemplateType;
    onSelect: (type: TemplateType) => void;
}

function OfferTemplatePreview({ type }: { type: TemplateType }) {
    switch (type) {
        case 'classic':
            return (
                <div className="h-full bg-card p-2.5">
                    <div className="flex items-center justify-between">
                        <div className="h-2 w-16 rounded-full bg-primary/70" />
                        <div className="h-1.5 w-8 rounded-full bg-muted-foreground/25" />
                    </div>
                    <div className="mt-2 overflow-hidden rounded-md border border-border">
                        <div className="grid grid-cols-[1fr_2.5rem] gap-2 bg-secondary/80 px-2 py-1">
                            <div className="h-1.5 rounded-full bg-muted-foreground/35" />
                            <div className="h-1.5 rounded-full bg-primary/35" />
                        </div>
                        {[0, 1].map((row) => (
                            <div key={row} className="grid grid-cols-[1fr_2.5rem] gap-2 border-t border-border/70 px-2 py-1">
                                <div className="h-1.5 rounded-full bg-muted-foreground/20" />
                                <div className="h-1.5 rounded-full bg-muted-foreground/25" />
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'universal':
            return (
                <div className="h-full bg-[linear-gradient(135deg,#173957,#102b46)] p-2.5 dark:bg-[linear-gradient(135deg,#112d48,#0b2238)]">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-1 rounded-full bg-[#d6b458]" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="h-2 w-3/4 rounded-full bg-[#d6b458]" />
                            <div className="h-1.5 w-full rounded-full bg-white/30" />
                            <div className="h-1.5 w-2/3 rounded-full bg-white/20" />
                        </div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                        <div className="h-4 rounded-md border border-[#d6b458]/30 bg-[#d6b458]/20" />
                        <div className="h-4 rounded-md border border-white/10 bg-white/10" />
                        <div className="h-4 rounded-md border border-white/10 bg-white/10" />
                    </div>
                </div>
            );
        case 'proposal':
            return (
                <div className="h-full bg-card">
                    <div className="flex h-5 items-center gap-1.5 border-b border-border bg-secondary/70 px-2.5">
                        <div className="size-1.5 rounded-full bg-red-400/70" />
                        <div className="size-1.5 rounded-full bg-amber-400/70" />
                        <div className="size-1.5 rounded-full bg-emerald-400/70" />
                        <div className="ml-1 h-1.5 flex-1 rounded-full bg-muted-foreground/15" />
                    </div>
                    <div className="grid h-[3.75rem] grid-cols-[1.25fr_0.75fr] gap-2 p-2.5">
                        <div className="space-y-1.5">
                            <div className="h-2 w-2/3 rounded-full bg-primary/60" />
                            <div className="h-1.5 w-full rounded-full bg-muted-foreground/25" />
                            <div className="h-1.5 w-4/5 rounded-full bg-muted-foreground/20" />
                        </div>
                        <div className="rounded-lg bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-glow))] opacity-80" />
                    </div>
                </div>
            );
        case 'website_v2':
            return (
                <div className="h-full bg-card p-2.5">
                    <div className="flex items-center justify-between">
                        <div className="h-2 w-20 rounded-full bg-primary/55" />
                        <div className="flex gap-1">
                            <div className="size-1.5 rounded-full bg-muted-foreground/25" />
                            <div className="size-1.5 rounded-full bg-muted-foreground/25" />
                            <div className="size-1.5 rounded-full bg-muted-foreground/25" />
                        </div>
                    </div>
                    <div className="mt-2 h-5 rounded-md bg-primary/10 p-1.5">
                        <div className="h-1.5 w-3/5 rounded-full bg-primary/40" />
                    </div>
                    <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                        {[0, 1, 2].map((item) => (
                            <div key={item} className="h-5 rounded-md border border-border bg-surface-subtle" />
                        ))}
                    </div>
                </div>
            );
        case 'website_v3':
            return (
                <div className="h-full bg-card p-2.5">
                    <div className="h-2 w-24 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500" />
                    <div className="mt-2 flex items-end gap-1.5">
                        <div className="h-9 flex-1 rounded-md border border-border bg-surface-subtle p-1.5">
                            <div className="h-1.5 w-3/4 rounded-full bg-muted-foreground/25" />
                            <div className="mt-1.5 h-2 w-1/2 rounded-full bg-muted-foreground/20" />
                        </div>
                        <div className="h-11 flex-1 rounded-md border border-violet-500/35 bg-gradient-to-b from-violet-500/15 to-cyan-500/10 p-1.5">
                            <div className="h-1.5 w-3/4 rounded-full bg-violet-500/55" />
                            <div className="mt-1.5 h-2 w-1/2 rounded-full bg-cyan-500/35" />
                        </div>
                        <div className="h-9 flex-1 rounded-md border border-border bg-surface-subtle p-1.5">
                            <div className="h-1.5 w-3/4 rounded-full bg-muted-foreground/25" />
                            <div className="mt-1.5 h-2 w-1/2 rounded-full bg-muted-foreground/20" />
                        </div>
                    </div>
                </div>
            );
        case 'shop':
            return (
                <div className="h-full bg-card p-2.5">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-primary/60" />
                        <div className="h-1.5 flex-1 rounded-full bg-muted-foreground/15" />
                        <div className="grid size-4 place-items-center rounded-full bg-primary/15">
                            <div className="size-1.5 rounded-full bg-primary/60" />
                        </div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                        {[0, 1, 2].map((item) => (
                            <div key={item} className="rounded-md border border-border bg-surface-subtle p-1.5">
                                <div className="h-4 rounded bg-primary/10" />
                                <div className="mt-1 h-1.5 w-3/4 rounded-full bg-muted-foreground/25" />
                                <div className="mt-1 h-1.5 w-1/2 rounded-full bg-primary/35" />
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'mobile_simple':
            return (
                <div className="flex h-full items-center gap-3 bg-[linear-gradient(135deg,#07665f,#0f9488)] px-3 py-2">
                    <div className="flex h-14 w-8 shrink-0 flex-col rounded-[0.65rem] border border-white/25 bg-white/10 p-1">
                        <div className="mx-auto h-1 w-3 rounded-full bg-white/40" />
                        <div className="mt-1 flex-1 rounded-md bg-white/10 p-1">
                            <div className="h-2 rounded bg-orange-400/80" />
                            <div className="mt-1 h-1 rounded-full bg-white/30" />
                            <div className="mt-1 h-1 rounded-full bg-white/20" />
                        </div>
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="h-2 w-3/4 rounded-full bg-orange-400/90" />
                        <div className="h-1.5 w-full rounded-full bg-white/35" />
                        <div className="h-1.5 w-4/5 rounded-full bg-white/25" />
                        <div className="flex gap-1.5 pt-0.5">
                            <div className="h-3 flex-1 rounded bg-white/12" />
                            <div className="h-3 flex-1 rounded bg-white/12" />
                        </div>
                    </div>
                </div>
            );
        case 'mobile_app':
            return (
                <div className="flex h-full items-center gap-3 bg-[linear-gradient(135deg,#211b51,#312468)] px-3 py-2">
                    <div className="grid h-14 w-8 shrink-0 place-items-center rounded-[0.65rem] border border-white/25 bg-white/5">
                        <div className="h-7 w-4 rounded bg-gradient-to-b from-rose-400 to-indigo-400 opacity-90" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="h-2 w-3/4 rounded-full bg-rose-400/85" />
                        <div className="mt-2 flex items-center gap-1.5">
                            <div className="size-2 rounded-full bg-indigo-300" />
                            <div className="h-1 flex-1 rounded-full bg-white/25" />
                            <div className="size-2 rounded-full bg-purple-300" />
                            <div className="h-1 flex-1 rounded-full bg-white/25" />
                            <div className="size-2 rounded-full bg-rose-300" />
                        </div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-white/25" />
                        <div className="mt-1.5 h-1.5 w-2/3 rounded-full bg-white/20" />
                    </div>
                </div>
            );
        case 'support':
            return (
                <div className="h-full bg-emerald-50 p-2.5 dark:bg-emerald-950/30">
                    <div className="flex items-center justify-between">
                        <div className="h-2 w-20 rounded-full bg-teal-800/85 dark:bg-teal-300/70" />
                        <div className="h-1.5 w-10 rounded-full bg-emerald-500/30" />
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                        <div className="h-8 rounded-md border border-emerald-200 bg-white/75 dark:border-emerald-700/50 dark:bg-white/5" />
                        <div className="h-9 rounded-md border-2 border-teal-700 bg-blue-50 dark:border-teal-400/70 dark:bg-teal-400/10" />
                        <div className="h-8 rounded-md border border-slate-800 bg-slate-900 dark:border-slate-600" />
                    </div>
                    <div className="mt-1.5 h-1.5 w-3/4 rounded-full bg-emerald-400/45" />
                </div>
            );
    }
}

export default function StepTypeChoice({ selectedType, onSelect }: StepTypeChoiceProps) {
    const tr = useTranslations('offerNew');
    const c = tr.typeChoice;

    const templates: Array<{
        type: TemplateType;
        label: string;
        description: string;
        icon: ReactNode;
    }> = [
        { type: 'classic', label: c.classicLabel, description: c.classicDesc, icon: <FileText className="size-5" /> },
        { type: 'universal', label: c.universalLabel, description: c.universalDesc, icon: <Briefcase className="size-5" /> },
        { type: 'proposal', label: c.proposalLabel, description: c.proposalDesc, icon: <Globe className="size-5" /> },
        { type: 'website_v2', label: c.websiteV2Label, description: c.websiteV2Desc, icon: <Monitor className="size-5" /> },
        { type: 'website_v3', label: c.websiteV3Label, description: c.websiteV3Desc, icon: <Sparkles className="size-5" /> },
        { type: 'shop', label: c.shopLabel, description: c.shopDesc, icon: <ShoppingCart className="size-5" /> },
        { type: 'mobile_simple', label: c.mobileSimpleLabel, description: c.mobileSimpleDesc, icon: <Smartphone className="size-5" /> },
        { type: 'mobile_app', label: c.mobileAppLabel, description: c.mobileAppDesc, icon: <Layers className="size-5" /> },
        { type: 'support', label: c.supportLabel, description: c.supportDesc, icon: <ShieldCheck className="size-5" /> },
    ];

    return (
        <div data-testid="offer-step-type-choice">
            <div className="mb-7">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">{c.title}</h2>
                <p className="mt-1.5 max-w-2xl text-sm leading-5 text-muted-foreground">{c.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
                {templates.map((template) => (
                    <TemplateChoiceCard
                        key={template.type}
                        selected={selectedType === template.type}
                        onSelect={() => onSelect(template.type)}
                        title={template.label}
                        description={template.description}
                        icon={template.icon}
                        preview={<OfferTemplatePreview type={template.type} />}
                    />
                ))}
            </div>
        </div>
    );
}
