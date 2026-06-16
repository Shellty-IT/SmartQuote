// src/app/dashboard/contracts/new/page.tsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useContracts } from '@/hooks/useContracts';
import { useClients } from '@/hooks/useClients';
import { Button, Input, Textarea, LoadingSpinner } from '@/components/ui';
import { Client } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useTranslations } from '@/i18n';
import { cn, getInitials } from '@/lib/utils';
import { FileText, FileCode } from 'lucide-react';
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

// ── Template card ──────────────────────────────────────────────────────────────

function TemplateCard({ selected, onSelect, label, desc, icon, preview }: {
    type: string; selected: boolean; onSelect: () => void;
    label: string; desc: string; icon: React.ReactNode; preview: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                'flex flex-col gap-4 p-5 rounded-xl border-2 text-left transition-all',
                selected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-secondary/40',
            )}
        >
            <div className="flex items-start gap-3">
                <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    selected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
                )}>
                    {icon}
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-foreground">{label}</p>
                    <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                </div>
                {selected && (
                    <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                )}
            </div>
            {preview}
        </button>
    );
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
        <div className="mb-8 flex items-center justify-between">
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
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                'grid h-10 w-10 place-items-center rounded-full text-sm font-semibold transition-all',
                                isActive
                                    ? 'bg-gradient-primary text-white shadow-glow ring-1 ring-white/15'
                                    : isCompleted
                                        ? 'bg-status-accepted text-white'
                                        : 'border border-border bg-card text-muted-foreground',
                            )}>
                                {isCompleted ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    index + 1
                                )}
                            </div>
                            <span className={cn(
                                'hidden md:block text-sm font-medium',
                                isActive ? 'text-foreground' : 'text-muted-foreground',
                            )}>
                                {label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className="flex-1 h-0.5 mx-2 md:mx-4 bg-surface-subtle" />
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
        setLoading(true);

        const clientId = selectedClient?.id ?? '';
        const title = formData.title || (selectedClient ? `Umowa — ${selectedClient.name}` : 'Nowa umowa');

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
                items: formData.items.map((item, index) => ({
                    ...item,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                    vatRate: Number(item.vatRate),
                    discount: Number(item.discount),
                    position: index,
                })),
            });

            if (response.success && response.data) {
                toast.success(t.toasts.created, t.toasts.createdDesc.replace('{name}', title));
                router.push(`/dashboard/contracts/${response.data.id}`);
            } else {
                toast.error(t.toasts.error, t.toasts.createError);
                setLoading(false);
            }
        } catch {
            toast.error(t.toasts.error, t.toasts.createError);
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

    return (
        <div className="space-y-6 p-4 md:p-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/contracts">
                    <Button variant="ghost" size="sm">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t.newTitle}</h1>
                    <p className="text-muted-foreground">{t.newSubtitle}</p>
                </div>
            </div>

            {/* Step indicator (hidden on first step if fromOffer) */}
            {!fromOfferId && (
                <ContractStepper
                    currentStep={step}
                    templateType={templateType}
                    stepLabels={tn.steps}
                />
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
                <div data-testid="contract-step-type-choice" className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="text-lg font-semibold text-foreground mb-1">{tn.typeChoice.title}</h2>
                    <p className="text-sm text-muted-foreground mb-6">{tn.typeChoice.subtitle}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Classic */}
                        <TemplateCard
                            type="classic"
                            selected={templateType === 'classic'}
                            onSelect={() => setTemplateType('classic')}
                            label={tn.typeChoice.classicLabel}
                            desc={tn.typeChoice.classicDesc}
                            icon={<FileText className="w-5 h-5" />}
                            preview={
                                <div className="rounded-lg bg-secondary/60 p-3 space-y-1.5">
                                    {[0, 1, 2].map((i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="h-2 rounded bg-muted-foreground/30 flex-1" />
                                            <div className="h-2 w-12 rounded bg-muted-foreground/20" />
                                        </div>
                                    ))}
                                    <div className="flex justify-end mt-2">
                                        <div className="h-2.5 w-20 rounded bg-primary/40" />
                                    </div>
                                </div>
                            }
                        />
                        {/* Website / short */}
                        <TemplateCard
                            type="short"
                            selected={templateType === 'short'}
                            onSelect={() => setTemplateType('short')}
                            label={tn.typeChoice.websiteLabel}
                            desc={tn.typeChoice.websiteDesc}
                            icon={<FileCode className="w-5 h-5" />}
                            preview={
                                <div className="rounded-lg bg-secondary/60 p-3 space-y-1.5">
                                    <div className="h-3 w-24 rounded bg-primary/40" />
                                    <div className="h-2 rounded bg-muted-foreground/20 w-full" />
                                    <div className="h-2 rounded bg-muted-foreground/20 w-4/5" />
                                    <div className="h-2 rounded bg-muted-foreground/20 w-3/5" />
                                </div>
                            }
                        />
                        {/* Mobile app */}
                        <TemplateCard
                            type="mobile"
                            selected={templateType === 'mobile'}
                            onSelect={() => setTemplateType('mobile')}
                            label={tn.typeChoice.mobileLabel}
                            desc={tn.typeChoice.mobileDesc}
                            icon={<FileCode className="w-5 h-5" />}
                            preview={
                                <div className="rounded-lg bg-secondary/60 p-3 space-y-1.5">
                                    <div className="h-2 w-16 rounded" style={{ background: 'rgba(27,58,92,0.4)' }} />
                                    <div className="h-2 rounded bg-muted-foreground/20 w-full" />
                                    <div className="h-2 rounded bg-muted-foreground/20 w-3/5" />
                                    <div className="flex gap-1.5 mt-1">
                                        <div className="h-2 flex-1 rounded bg-muted-foreground/20" />
                                        <div className="h-2 flex-1 rounded bg-muted-foreground/20" />
                                        <div className="h-2 flex-1 rounded bg-muted-foreground/20" />
                                    </div>
                                </div>
                            }
                        />
                        {/* Services / sklep internetowy */}
                        <TemplateCard
                            type="services"
                            selected={templateType === 'services'}
                            onSelect={() => setTemplateType('services')}
                            label={tn.typeChoice.servicesLabel}
                            desc={tn.typeChoice.servicesDesc}
                            icon={<FileCode className="w-5 h-5" />}
                            preview={
                                <div className="rounded-lg bg-secondary/60 p-3 space-y-1.5">
                                    <div className="h-2 w-16 rounded" style={{ background: 'rgba(201,168,76,0.4)' }} />
                                    <div className="h-2 rounded bg-muted-foreground/20 w-full" />
                                    <div className="h-2 rounded bg-muted-foreground/20 w-4/5" />
                                    <div className="h-px w-full bg-muted-foreground/20 mt-1" />
                                    <div className="h-4 rounded" style={{ background: 'rgba(27,58,92,0.15)' }} />
                                </div>
                            }
                        />
                        {/* Dedicated system */}
                        <TemplateCard
                            type="dedicated"
                            selected={templateType === 'dedicated'}
                            onSelect={() => setTemplateType('dedicated')}
                            label={tn.typeChoice.dedicatedLabel}
                            desc={tn.typeChoice.dedicatedDesc}
                            icon={<FileCode className="w-5 h-5" />}
                            preview={
                                <div className="rounded-lg bg-secondary/60 p-3 space-y-1.5">
                                    <div className="h-2 w-20 rounded" style={{ background: 'rgba(27,58,92,0.4)' }} />
                                    <div className="h-2 rounded bg-muted-foreground/20 w-full" />
                                    <div className="flex gap-1.5 mt-1">
                                        {[0,1,2,3].map(i => <div key={i} className="h-4 flex-1 rounded bg-muted-foreground/20" />)}
                                    </div>
                                    <div className="h-2 rounded bg-muted-foreground/20 w-3/4" />
                                </div>
                            }
                        />
                        {/* SLA / Opieka IT */}
                        <TemplateCard
                            type="sla"
                            selected={templateType === 'sla'}
                            onSelect={() => setTemplateType('sla')}
                            label={tn.typeChoice.slaLabel}
                            desc={tn.typeChoice.slaDesc}
                            icon={<FileCode className="w-5 h-5" />}
                            preview={
                                <div className="rounded-lg bg-secondary/60 p-3 space-y-1.5">
                                    <div className="h-2 w-14 rounded" style={{ background: 'rgba(201,168,76,0.4)' }} />
                                    <div className="flex gap-1 mt-1">
                                        <div className="h-3 w-4 rounded" style={{ background: 'rgba(220,38,38,0.3)' }} />
                                        <div className="h-3 w-4 rounded" style={{ background: 'rgba(234,88,12,0.3)' }} />
                                        <div className="h-3 w-4 rounded" style={{ background: 'rgba(202,138,4,0.3)' }} />
                                        <div className="h-3 w-4 rounded" style={{ background: 'rgba(22,163,74,0.3)' }} />
                                    </div>
                                    <div className="h-2 rounded bg-muted-foreground/20 w-full" />
                                    <div className="h-2 rounded bg-muted-foreground/20 w-4/5" />
                                </div>
                            }
                        />
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
                        <h2 className="text-lg font-semibold text-foreground mb-4">{t.basicInfo}</h2>

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
