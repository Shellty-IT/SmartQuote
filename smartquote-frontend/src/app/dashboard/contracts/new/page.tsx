// src/app/dashboard/contracts/new/page.tsx
'use client';

import { useState, useEffect, useRef, Suspense, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useContracts } from '@/hooks/useContracts';
import { useClients } from '@/hooks/useClients';
import { Button, Input, Textarea, LoadingSpinner, TemplateChoiceCard } from '@/components/ui';
import { Client } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useTranslations } from '@/i18n';
import { cn, getInitials } from '@/lib/utils';
import { Boxes, FileText, Globe, ShieldCheck, ShoppingCart, Smartphone } from 'lucide-react';
import {
    buildDefaultContractBlocks,
    mergeContractWithDefaults,
    type ContractShortBlocks,
} from '@/lib/pdf/contract-short-blocks';
import {
    buildDefaultContractServicesBlocks,
    mergeServicesWithDefaults,
    type ContractServicesBlocks,
} from '@/lib/pdf/contract-services-blocks';
import {
    buildDefaultContractDedicatedBlocks,
    mergeDedicatedWithDefaults,
    type ContractDedicatedBlocks,
} from '@/lib/pdf/contract-dedicated-blocks';
import {
    buildDefaultContractSlaBlocks,
    mergeSlaWithDefaults,
    type ContractSlaBlocks,
} from '@/lib/pdf/contract-sla-blocks';
import {
    buildDefaultContractMobileBlocks,
    mergeMobileWithDefaults,
    type ContractMobileBlocks,
} from '@/lib/pdf/contract-mobile-blocks';
import { ContractDocumentEditor } from '@/components/contracts/editor/ContractDocumentEditor';
import { ContractServicesDocumentEditor } from '@/components/contracts/editor/ContractServicesDocumentEditor';
import { ContractDedicatedDocumentEditor } from '@/components/contracts/editor/ContractDedicatedDocumentEditor';
import { ContractSlaDocumentEditor } from '@/components/contracts/editor/ContractSlaDocumentEditor';
import { ContractMobileDocumentEditor } from '@/components/contracts/editor/ContractMobileDocumentEditor';
import { TemplateAIFillButton } from '@/components/offers/TemplateAIFillButton';
import WizardHeader from '@/components/ui/WizardHeader';
import { ApiError } from '@/lib/api';
import { prepareContractItems } from '@/lib/contract-form';

const LS_KEY = 'sq_default_contract_short_blocks';
const LS_KEY_SERVICES = 'sq_default_contract_services_blocks';
const LS_KEY_DEDICATED = 'sq_default_contract_dedicated_blocks';
const LS_KEY_SLA = 'sq_default_contract_sla_blocks';
const LS_KEY_MOBILE = 'sq_default_contract_mobile_blocks';

type ContractStep = 'client' | 'type_choice' | 'classic_form' | 'website_form';
type TemplateType = 'classic' | 'short' | 'services' | 'dedicated' | 'sla' | 'mobile';

function loadBlocksFromStorage(): ContractShortBlocks {
    if (typeof window === 'undefined') return buildDefaultContractBlocks();
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) return mergeContractWithDefaults(JSON.parse(raw));
    } catch { /* ignore */ }
    return buildDefaultContractBlocks();
}

function loadServicesBlocksFromStorage(): ContractServicesBlocks {
    if (typeof window === 'undefined') return buildDefaultContractServicesBlocks();
    try {
        const raw = localStorage.getItem(LS_KEY_SERVICES);
        if (raw) return mergeServicesWithDefaults(JSON.parse(raw));
    } catch { /* ignore */ }
    return buildDefaultContractServicesBlocks();
}

function loadDedicatedBlocksFromStorage(): ContractDedicatedBlocks {
    if (typeof window === 'undefined') return buildDefaultContractDedicatedBlocks();
    try {
        const raw = localStorage.getItem(LS_KEY_DEDICATED);
        if (raw) return mergeDedicatedWithDefaults(JSON.parse(raw));
    } catch { /* ignore */ }
    return buildDefaultContractDedicatedBlocks();
}

function loadSlaBlocksFromStorage(): ContractSlaBlocks {
    if (typeof window === 'undefined') return buildDefaultContractSlaBlocks();
    try {
        const raw = localStorage.getItem(LS_KEY_SLA);
        if (raw) return mergeSlaWithDefaults(JSON.parse(raw));
    } catch { /* ignore */ }
    return buildDefaultContractSlaBlocks();
}

function loadMobileBlocksFromStorage(): ContractMobileBlocks {
    if (typeof window === 'undefined') return buildDefaultContractMobileBlocks();
    try {
        const raw = localStorage.getItem(LS_KEY_MOBILE);
        if (raw) return mergeMobileWithDefaults(JSON.parse(raw));
    } catch { /* ignore */ }
    return buildDefaultContractMobileBlocks();
}

// ── Template previews ──────────────────────────────────────────────────────────

function ContractTemplatePreview({ type }: { type: TemplateType }) {
    switch (type) {
        case 'classic':
            return (
                <div className="h-full bg-card p-2.5">
                    <div className="flex items-center justify-between">
                        <div className="h-2 w-20 rounded-full bg-primary/65" />
                        <div className="h-1.5 w-8 rounded-full bg-muted-foreground/20" />
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
        case 'short':
            return (
                <div className="h-full bg-card p-2.5">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-1 rounded-full bg-primary/70" />
                        <div className="flex-1">
                            <div className="h-2 w-24 rounded-full bg-primary/50" />
                            <div className="mt-1.5 h-1.5 w-3/5 rounded-full bg-muted-foreground/20" />
                        </div>
                    </div>
                    <div className="mt-2 grid grid-cols-[1rem_1fr] items-center gap-x-2 gap-y-1.5">
                        <div className="grid size-3 place-items-center rounded-full bg-primary/15 text-[6px] font-bold text-primary">1</div>
                        <div className="h-1.5 rounded-full bg-muted-foreground/20" />
                        <div className="grid size-3 place-items-center rounded-full bg-primary/15 text-[6px] font-bold text-primary">2</div>
                        <div className="h-1.5 w-4/5 rounded-full bg-muted-foreground/20" />
                    </div>
                </div>
            );
        case 'services':
            return (
                <div className="h-full bg-card">
                    <div className="flex h-5 items-center gap-1.5 border-b border-border bg-secondary/70 px-2.5">
                        <div className="size-1.5 rounded-full bg-red-400/70" />
                        <div className="size-1.5 rounded-full bg-amber-400/70" />
                        <div className="size-1.5 rounded-full bg-emerald-400/70" />
                        <div className="ml-auto h-1.5 w-10 rounded-full bg-muted-foreground/15" />
                    </div>
                    <div className="p-2.5">
                        <div className="h-2 w-20 rounded-full bg-amber-500/45" />
                        <div className="mt-2 grid grid-cols-3 gap-1.5">
                            {[0, 1, 2].map((item) => (
                                <div key={item} className="h-7 rounded-md border border-border bg-surface-subtle p-1.5">
                                    <div className="h-1.5 rounded-full bg-muted-foreground/20" />
                                    <div className="mt-1.5 h-1.5 w-2/3 rounded-full bg-primary/25" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        case 'mobile':
            return (
                <div className="flex h-full items-center gap-3 bg-card px-3 py-2">
                    <div className="flex h-14 w-8 shrink-0 flex-col rounded-[0.65rem] border border-primary/25 bg-primary/5 p-1">
                        <div className="mx-auto h-1 w-3 rounded-full bg-primary/35" />
                        <div className="mt-1 flex-1 rounded-md bg-primary/10 p-1">
                            <div className="h-2 rounded bg-primary/35" />
                            <div className="mt-1 h-1 rounded-full bg-muted-foreground/25" />
                            <div className="mt-1 h-1 rounded-full bg-muted-foreground/20" />
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="h-2 w-3/4 rounded-full bg-primary/55" />
                        <div className="mt-2 flex items-center gap-1.5">
                            <div className="size-2 rounded-full bg-emerald-500/55" />
                            <div className="h-1.5 flex-1 rounded-full bg-muted-foreground/20" />
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5">
                            <div className="size-2 rounded-full bg-emerald-500/55" />
                            <div className="h-1.5 w-3/4 rounded-full bg-muted-foreground/20" />
                        </div>
                    </div>
                </div>
            );
        case 'dedicated':
            return (
                <div className="h-full bg-card p-2.5">
                    <div className="flex items-center justify-between">
                        <div className="h-2 w-24 rounded-full bg-primary/60" />
                        <div className="flex gap-1">
                            <div className="size-1.5 rounded-full bg-emerald-500/60" />
                            <div className="size-1.5 rounded-full bg-primary/50" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-center">
                        {[0, 1, 2, 3].map((node, index) => (
                            <div key={node} className="contents">
                                <div className="h-7 flex-1 rounded-md border border-primary/15 bg-primary/10 p-1.5">
                                    <div className="h-1.5 rounded-full bg-primary/30" />
                                    <div className="mt-1 h-1 w-2/3 rounded-full bg-muted-foreground/20" />
                                </div>
                                {index < 3 && <div className="h-px w-2 bg-primary/30" />}
                            </div>
                        ))}
                    </div>
                    <div className="mx-auto mt-2 h-1.5 w-3/5 rounded-full bg-muted-foreground/15" />
                </div>
            );
        case 'sla':
            return (
                <div className="h-full bg-emerald-50 p-2.5 dark:bg-emerald-950/30">
                    <div className="flex items-center justify-between">
                        <div className="h-2 w-20 rounded-full bg-teal-800/80 dark:bg-teal-300/70" />
                        <div className="h-1.5 w-8 rounded-full bg-emerald-500/30" />
                    </div>
                    <div className="mt-2 flex gap-1.5">
                        <div className="h-3 w-8 rounded-md bg-red-400/35" />
                        <div className="h-3 w-8 rounded-md bg-orange-400/35" />
                        <div className="h-3 w-8 rounded-md bg-amber-400/35" />
                        <div className="h-3 w-8 rounded-md bg-emerald-400/35" />
                    </div>
                    <div className="mt-2 space-y-1.5">
                        <div className="h-1.5 w-full rounded-full bg-teal-900/20 dark:bg-white/20" />
                        <div className="h-1.5 w-4/5 rounded-full bg-teal-900/15 dark:bg-white/15" />
                    </div>
                </div>
            );
    }
}

// ── Simple step indicator ──────────────────────────────────────────────────────

interface StepperProps {
    currentStep: ContractStep;
    templateType: TemplateType;
    stepLabels: { client: string; type_choice: string; form: string };
}

function ContractStepper({ currentStep, templateType, stepLabels }: StepperProps) {
    const formStep: ContractStep = templateType === 'classic' ? 'classic_form' : 'website_form';
    const steps: ContractStep[] = ['client', 'type_choice', formStep];
    const currentIndex = steps.indexOf(currentStep);

    return (
        <div className="flex min-w-0 flex-1 items-center justify-between">
            {steps.map((stepId, index) => {
                const isActive = stepId === currentStep;
                const isCompleted = index < currentIndex;
                const label = stepId === 'client'
                    ? stepLabels.client
                    : stepId === 'type_choice'
                        ? stepLabels.type_choice
                        : stepLabels.form;

                return (
                    <div key={stepId} className="flex items-center flex-1">
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                'grid h-8 w-8 place-items-center rounded-full text-xs font-semibold transition-all',
                                isActive
                                    ? 'bg-gradient-primary text-white shadow-glow ring-1 ring-white/15'
                                    : isCompleted
                                        ? 'bg-status-accepted text-white'
                                        : 'border border-border bg-card text-muted-foreground',
                            )}>
                                {isCompleted ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    index + 1
                                )}
                            </div>
                            <span className={cn(
                                'hidden xl:block text-xs font-medium',
                                isActive ? 'text-foreground' : 'text-muted-foreground',
                            )}>
                                {label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className="flex-1 h-px mx-2 md:mx-3 bg-surface-subtle" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Main form ──────────────────────────────────────────────────────────────────

function NewContractForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const t = useTranslations('contractForm');
    const tn = useTranslations('contractNew');
    const commonTr = useTranslations('common');
    const fromOfferId = searchParams.get('fromOffer');

    const { createContract, createFromOffer } = useContracts();
    const { clients } = useClients({ limit: 100 });

    const [loading, setLoading] = useState(false);
    const [formErrors, setFormErrors] = useState<string[]>([]);
    const [step, setStep] = useState<ContractStep>('client');
    const [templateType, setTemplateType] = useState<TemplateType>('classic');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientSearch, setClientSearch] = useState('');
    const [contractBlocks, setContractBlocks] = useState<ContractShortBlocks>(loadBlocksFromStorage);
    const [servicesBlocks, setServicesBlocks] = useState<ContractServicesBlocks>(loadServicesBlocksFromStorage);
    const [dedicatedBlocks, setDedicatedBlocks] = useState<ContractDedicatedBlocks>(loadDedicatedBlocksFromStorage);
    const [slaBlocks, setSlaBlocks] = useState<ContractSlaBlocks>(loadSlaBlocksFromStorage);
    const [mobileBlocks, setMobileBlocks] = useState<ContractMobileBlocks>(loadMobileBlocksFromStorage);

    const createFromOfferAttempted = useRef(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        terms: '',
        paymentTerms: '',
        paymentDays: 14,
        notes: '',
        items: [
            { name: '', description: '', quantity: 1, unit: 'szt.', unitPrice: 0, vatRate: 23, discount: 0 }
        ],
    });

    // Auto-fill title when client is selected for HTML templates
    useEffect(() => {
        if (selectedClient && templateType !== 'classic' && !formData.title) {
            setFormData(prev => ({ ...prev, title: `Umowa — ${selectedClient.name}` }));
        }
    }, [selectedClient, templateType, formData.title]);

    useEffect(() => {
        if (fromOfferId && !createFromOfferAttempted.current) {
            createFromOfferAttempted.current = true;

            const handleCreateFromOffer = async () => {
                setLoading(true);

                const response = await createFromOffer(fromOfferId);

                if (response.success && response.data) {
                    toast.success(t.toasts.created, t.toasts.createdFromOffer);
                    router.push(`/dashboard/contracts/${response.data.id}`);
                } else {
                    toast.error(t.toasts.error, t.toasts.createFromOfferError);
                    setLoading(false);
                }
            };

            handleCreateFromOffer();
        }
    }, [fromOfferId, createFromOffer, router, toast, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const clientId = selectedClient?.id ?? '';
        const title = formData.title || (selectedClient ? `Umowa — ${selectedClient.name}` : 'Nowa umowa');
        const items = prepareContractItems(formData.items, templateType, title);

        const errors: string[] = [];
        if (!clientId) errors.push(t.validation.clientRequired);
        if (!title.trim()) errors.push(t.validation.titleRequired);
        items.forEach((item, index) => {
            if (!item.name) errors.push(t.validation.itemNameRequired.replace('{n}', String(index + 1)));
            if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
                errors.push(t.validation.itemQuantityPositive.replace('{n}', String(index + 1)));
            }
        });

        if (errors.length > 0) {
            setFormErrors(errors);
            toast.error(t.validation.title, errors[0]);
            return;
        }

        setFormErrors([]);
        setLoading(true);

        try {
            const blocksForTemplate =
                templateType === 'short' ? (contractBlocks as unknown)
                    : templateType === 'services' ? (servicesBlocks as unknown)
                    : templateType === 'dedicated' ? (dedicatedBlocks as unknown)
                    : templateType === 'sla' ? (slaBlocks as unknown)
                    : templateType === 'mobile' ? (mobileBlocks as unknown)
                    : undefined;

            const response = await createContract({
                ...formData,
                title,
                clientId,
                paymentDays: Number(formData.paymentDays),
                templateType,
                blocks: blocksForTemplate,
                items,
            });

            if (response.success && response.data) {
                toast.success(t.toasts.created, t.toasts.createdDesc.replace('{name}', title));
                router.push(`/dashboard/contracts/${response.data.id}`);
            } else {
                toast.error(t.toasts.error, t.toasts.createError);
                setLoading(false);
            }
        } catch (error) {
            const details = error instanceof ApiError && Array.isArray(error.details)
                ? error.details
                    .map((detail) => detail && typeof detail === 'object' && 'message' in detail
                        ? String((detail as { message: unknown }).message)
                        : '')
                    .filter(Boolean)
                : [];
            const messages = details.length > 0
                ? details
                : [error instanceof Error ? error.message : t.toasts.createError];
            setFormErrors(messages);
            toast.error(t.validation.title, messages[0]);
            setLoading(false);
        }
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { name: '', description: '', quantity: 1, unit: 'szt.', unitPrice: 0, vatRate: 23, discount: 0 }]
        }));
    };

    const removeItem = (index: number) => {
        if (formData.items.length > 1) {
            setFormData(prev => ({
                ...prev,
                items: prev.items.filter((_, i) => i !== index)
            }));
        }
    };

    const updateItem = (index: number, field: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    if (fromOfferId && loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-muted-foreground">{t.creatingFromOffer}</p>
            </div>
        );
    }

    const filteredClients = clients.filter((c: Client) =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.company?.toLowerCase().includes(clientSearch.toLowerCase())
    );

    const contractTemplates: Array<{
        type: TemplateType;
        label: string;
        description: string;
        icon: ReactNode;
    }> = [
        { type: 'classic', label: tn.typeChoice.classicLabel, description: tn.typeChoice.classicDesc, icon: <FileText className="size-5" /> },
        { type: 'short', label: tn.typeChoice.websiteLabel, description: tn.typeChoice.websiteDesc, icon: <Globe className="size-5" /> },
        { type: 'services', label: tn.typeChoice.servicesLabel, description: tn.typeChoice.servicesDesc, icon: <ShoppingCart className="size-5" /> },
        { type: 'mobile', label: tn.typeChoice.mobileLabel, description: tn.typeChoice.mobileDesc, icon: <Smartphone className="size-5" /> },
        { type: 'dedicated', label: tn.typeChoice.dedicatedLabel, description: tn.typeChoice.dedicatedDesc, icon: <Boxes className="size-5" /> },
        { type: 'sla', label: tn.typeChoice.slaLabel, description: tn.typeChoice.slaDesc, icon: <ShieldCheck className="size-5" /> },
    ];

    return (
        <div className="w-full max-w-[1400px] space-y-4 px-4 py-3 md:px-6">
            <WizardHeader
                title={t.newTitle}
                subtitle={t.newSubtitle}
                backLabel={t.back}
                onBack={() => router.push('/dashboard/contracts')}
                progress={!fromOfferId
                    ? <ContractStepper currentStep={step} templateType={templateType} stepLabels={tn.steps} />
                    : null}
            />

            {formErrors.length > 0 && (
                <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <p className="font-semibold">{t.validation.title}</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5">
                        {formErrors.map((message, index) => <li key={`${message}-${index}`}>{message}</li>)}
                    </ul>
                </div>
            )}

            {/* ── STEP: client ─────────────────────────────────────────────────── */}
            {step === 'client' && (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="text-lg font-semibold text-foreground mb-4">{tn.client.title}</h2>
                    <Input
                        placeholder={tn.client.search}
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="mb-4"
                        icon={
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        }
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                        {filteredClients.map((client: Client) => (
                            <button
                                key={client.id}
                                type="button"
                                data-testid="contract-client-card"
                                onClick={() => setSelectedClient(client)}
                                className={cn(
                                    'flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all',
                                    selectedClient?.id === client.id
                                        ? 'border-primary bg-primary/10'
                                        : 'bg-card border-border hover:bg-secondary/60',
                                )}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                    {getInitials(client.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground truncate">{client.name}</p>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {client.email || client.phone || tn.client.noContact}
                                    </p>
                                </div>
                                {selectedClient?.id === client.id && (
                                    <svg className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                    {filteredClients.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">{tn.client.noResults}</p>
                            <Button variant="outline" onClick={() => router.push('/dashboard/clients/new')}>
                                {tn.client.addNew}
                            </Button>
                        </div>
                    )}
                    <div className="flex justify-end mt-4">
                        <Button
                            type="button"
                            data-testid="contract-next-button"
                            disabled={!selectedClient}
                            onClick={() => setStep('type_choice')}
                        >
                            {commonTr.next}
                        </Button>
                    </div>
                </div>
            )}

            {/* ── STEP: type_choice ────────────────────────────────────────────── */}
            {step === 'type_choice' && (
                <div data-testid="contract-step-type-choice" className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6">
                    <div className="mb-7">
                        <h2 className="text-xl font-semibold tracking-tight text-foreground">{tn.typeChoice.title}</h2>
                        <p className="mt-1.5 max-w-2xl text-sm leading-5 text-muted-foreground">{tn.typeChoice.subtitle}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
                        {contractTemplates.map((template) => (
                            <TemplateChoiceCard
                                key={template.type}
                                selected={templateType === template.type}
                                onSelect={() => setTemplateType(template.type)}
                                title={template.label}
                            description={template.description}
                            icon={template.icon}
                            iconVariant={template.type === 'short' ? 'website' : 'default'}
                            preview={<ContractTemplatePreview type={template.type} />}
                        />
                        ))}
                    </div>
                    <div className="flex justify-between mt-6">
                        <Button variant="outline" type="button" onClick={() => setStep('client')}>
                            {commonTr.previous}
                        </Button>
                        <Button
                            type="button"
                            data-testid="contract-next-button"
                            onClick={() => setStep(templateType === 'classic' ? 'classic_form' : 'website_form')}
                        >
                            {commonTr.next}
                        </Button>
                    </div>
                </div>
            )}

            {/* ── STEP: classic_form ───────────────────────────────────────────── */}
            {step === 'classic_form' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h2 className="text-lg font-semibold text-foreground">{t.basicInfo}</h2>
                            <TemplateAIFillButton
                                blocks={formData}
                                onBlocksChange={(updated) => setFormData((current) => ({ ...current, ...updated }))}
                                clientName={selectedClient?.name ?? ''}
                                title={formData.title}
                                templateType="classic"
                                entityType="contract"
                            />
                        </div>

                        {selectedClient && (
                            <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                    {getInitials(selectedClient.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{selectedClient.name}</p>
                                    {selectedClient.company && (
                                        <p className="text-xs text-muted-foreground truncate">{selectedClient.company}</p>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setStep('client')}
                                    className="text-xs text-muted-foreground"
                                >
                                    {commonTr.edit}
                                </Button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t.contractTitleLabel}
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                required
                            />
                            <Input
                                type="date"
                                label={t.startDate}
                                value={formData.startDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                            <Input
                                type="date"
                                label={t.endDate}
                                value={formData.endDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                            <Input
                                type="number"
                                label={t.paymentDays}
                                value={formData.paymentDays}
                                onChange={(e) => setFormData(prev => ({ ...prev, paymentDays: parseInt(e.target.value) || 14 }))}
                            />
                        </div>
                        <div className="mt-4">
                            <Textarea
                                label={t.descriptionLabel}
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                resizable
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-foreground">{t.itemsSection}</h2>
                            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                {t.addItem}
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {formData.items.map((item, index) => (
                                <div key={index} className="bg-card border-border border rounded-lg p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                        <div className="md:col-span-2">
                                            <Input
                                                label={t.nameLabel}
                                                value={item.name}
                                                onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <Input
                                            type="number"
                                            label={t.qtyLabel}
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                            step="0.001"
                                            min="0"
                                        />
                                        <Input
                                            label={t.unitLabel}
                                            value={item.unit}
                                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                        />
                                        <Input
                                            type="number"
                                            label={t.netPriceLabel}
                                            value={item.unitPrice}
                                            onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                                            step="0.01"
                                            min="0"
                                        />
                                        <div className="flex items-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeItem(index)}
                                                disabled={formData.items.length === 1}
                                            >{commonTr.delete}</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <h2 className="text-lg font-semibold text-foreground mb-4">{t.termsSection}</h2>
                        <div className="space-y-4">
                            <Textarea
                                label={t.termsLabel}
                                value={formData.terms}
                                onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                                rows={4}
                                resizable
                            />
                            <Textarea
                                label={t.internalNotes}
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                rows={3}
                                resizable
                            />
                        </div>
                    </div>

                    <div className="flex justify-between gap-4">
                        <Button type="button" variant="outline" onClick={() => setStep('type_choice')}>
                            {commonTr.previous}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? t.creating : t.createContract}
                        </Button>
                    </div>
                </form>
            )}

            {/* ── STEP: website_form ───────────────────────────────────────────── */}
            {step === 'website_form' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <h2 className="text-lg font-semibold text-foreground mb-4">{tn.websiteForm.title}</h2>

                        {selectedClient && (
                            <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                    {getInitials(selectedClient.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{selectedClient.name}</p>
                                    {selectedClient.company && (
                                        <p className="text-xs text-muted-foreground truncate">{selectedClient.company}</p>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setStep('client')}
                                    className="text-xs text-muted-foreground"
                                >
                                    {commonTr.edit}
                                </Button>
                            </div>
                        )}

                        <Input
                            label={tn.websiteForm.contractTitleLabel}
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            required
                            className="mb-4"
                        />
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                        {templateType === 'services' ? (
                            <ContractServicesDocumentEditor blocks={servicesBlocks} onBlocksChange={setServicesBlocks} />
                        ) : templateType === 'dedicated' ? (
                            <ContractDedicatedDocumentEditor blocks={dedicatedBlocks} onBlocksChange={setDedicatedBlocks} />
                        ) : templateType === 'sla' ? (
                            <ContractSlaDocumentEditor blocks={slaBlocks} onBlocksChange={setSlaBlocks} />
                        ) : templateType === 'mobile' ? (
                            <ContractMobileDocumentEditor blocks={mobileBlocks} onBlocksChange={setMobileBlocks} />
                        ) : (
                            <ContractDocumentEditor blocks={contractBlocks} onBlocksChange={setContractBlocks} />
                        )}
                    </div>

                    <div className="flex justify-between gap-4">
                        <Button type="button" variant="outline" onClick={() => setStep('type_choice')}>
                            {commonTr.previous}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? t.creating : t.createContract}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}

function NewContractLoading() {
    const t = useTranslations('contractForm');
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="mt-4 text-muted-foreground">{t.loading}</p>
        </div>
    );
}

export default function NewContractPage() {
    return (
        <Suspense fallback={<NewContractLoading />}>
            <NewContractForm />
        </Suspense>
    );
}
