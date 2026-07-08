// src/app/dashboard/offers/hooks/useOfferForm.ts

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClients } from '@/hooks/useClients';
import { useLeads } from '@/hooks/useLeads';
import { offersApi, ApiError } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useTranslations } from '@/i18n';
import type { Client, CreateOfferInput, OfferTemplate, Offer } from '@/types';
import type { Lead } from '@/types/lead.types';
import type { Step } from '../new/constants';
import type { ExtendedOfferItem, OfferDetails, OfferTotalsData } from '../new/types';
import { emptyItem, defaultOfferDetails } from '../new/types';
import { mergeWithDefaults, type ProposalBlocks } from '@/lib/pdf/proposal-blocks';
import { mergeShopWithDefaults, buildDefaultShopBlocks, type ShopBlocks } from '@/lib/pdf/shop-blocks';
import { mergeWebsiteV2WithDefaults, buildDefaultWebsiteV2Blocks, type WebsiteV2Blocks } from '@/lib/pdf/website-v2-blocks';
import { mergeWebsiteV3WithDefaults, buildDefaultWebsiteV3Blocks, type WebsiteV3Blocks } from '@/lib/pdf/website-v3-blocks';
import { mergeSupportWithDefaults, buildDefaultSupportBlocks, type SupportBlocks } from '@/lib/pdf/support-blocks';
import { mergeMobileAppWithDefaults, buildDefaultMobileAppBlocks, type MobileAppBlocks } from '@/lib/pdf/mobile-app-blocks';
import { mergeMobileSimpleWithDefaults, buildDefaultMobileSimpleBlocks, type MobileSimpleBlocks } from '@/lib/pdf/mobile-simple-blocks';
import { mergeUniversalWithDefaults, buildDefaultUniversalBlocks, type UniversalBlocks } from '@/lib/pdf/universal-blocks';
import { resolveTemplatePrice } from '@/lib/offer-template-price';
import { buildStepIds } from '../new/constants';

const DOCUMENT_TEMPLATE_TYPES = new Set([
    'proposal',
    'shop',
    'website_v2',
    'website_v3',
    'support',
    'mobile_app',
    'mobile_simple',
    'universal',
]);

function isDocumentTemplateType(templateType?: string | null): boolean {
    return DOCUMENT_TEMPLATE_TYPES.has(templateType ?? '');
}

function buildSubmittedTitle(templateType: OfferDetails['templateType'], entityName: string, title?: string): string {
    const trimmedTitle = title?.trim();
    if (trimmedTitle) return trimmedTitle;

    return templateType === 'shop' ? `Sklep — ${entityName}` :
        templateType === 'website_v2' ? `Strona WWW — ${entityName}` :
            templateType === 'website_v3' ? `Strona WWW v3 — ${entityName}` :
                templateType === 'support' ? `Wsparcie IT — ${entityName}` :
                    templateType === 'mobile_app' ? `Aplikacja mobilna — ${entityName}` :
                        templateType === 'mobile_simple' ? `Aplikacja mobilna — ${entityName}` :
                            templateType === 'universal' ? `Oferta — ${entityName}` :
                                templateType === 'classic' ? `Oferta — ${entityName}` :
                                    `Propozycja — ${entityName}`;
}

export function calculateItemTotal(item: ExtendedOfferItem): OfferTotalsData {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    const discount = item.discount || 0;
    const vatRate = item.vatRate || 23;

    const discountMultiplier = 1 - discount / 100;
    const totalNet = quantity * unitPrice * discountMultiplier;
    const totalVat = totalNet * (vatRate / 100);
    const totalGross = totalNet + totalVat;

    return { totalNet, totalVat, totalGross };
}

export function getUniqueVariants(items: ExtendedOfferItem[]): string[] {
    const variants = items
        .map((i) => i.variantName.trim())
        .filter((v) => v.length > 0);
    return [...new Set(variants)];
}

export function useOfferForm(options?: { initialData?: Offer }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const tr = useTranslations('offerNew');
    const commonTr = useTranslations('common');

    const isEditMode = !!options?.initialData;
    const offerId = options?.initialData?.id;
    const preselectedClientId = searchParams.get('clientId');
    const preselectedLeadId = searchParams.get('leadId');
    const preselectedTitle = searchParams.get('title');

    const { clients, isLoading: isLoadingClients } = useClients({ limit: 100 });
    const { leads, isLoading: isLoadingLeads } = useLeads({ limit: 200 });

    const [currentStep, setCurrentStep] = useState<Step>('client');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
    const [proposalBlocks, setProposalBlocks] = useState<ProposalBlocks>(() => {
        // Load saved document template from localStorage (set in Szablony → Szablony dokumentów)
        let savedTemplate: Partial<ProposalBlocks> | null = null
        try {
            const raw = typeof window !== 'undefined' ? localStorage.getItem('sq_default_proposal_blocks') : null
            savedTemplate = raw ? (JSON.parse(raw) as Partial<ProposalBlocks>) : null
        } catch {
            // ignore parse errors
        }
        return mergeWithDefaults(
            options?.initialData?.blocks as Partial<ProposalBlocks> | null ?? savedTemplate,
            undefined,
        )
    });

    const [shopBlocks, setShopBlocks] = useState<ShopBlocks>(() => {
        if (options?.initialData?.templateType === 'shop' && options?.initialData?.blocks)
            return mergeShopWithDefaults(options.initialData.blocks as Partial<ShopBlocks>)
        if (!options?.initialData) {
            try {
                const raw = typeof window !== 'undefined' ? localStorage.getItem('sq_default_shop_blocks') : null
                if (raw) return mergeShopWithDefaults(JSON.parse(raw) as Partial<ShopBlocks>)
            } catch { /* ignore */ }
        }
        return buildDefaultShopBlocks()
    })

    const [websiteV2Blocks, setWebsiteV2Blocks] = useState<WebsiteV2Blocks>(() => {
        if (options?.initialData?.templateType === 'website_v2' && options?.initialData?.blocks)
            return mergeWebsiteV2WithDefaults(options.initialData.blocks as Partial<WebsiteV2Blocks>)
        if (!options?.initialData) {
            try {
                const raw = typeof window !== 'undefined' ? localStorage.getItem('sq_default_website_v2_blocks') : null
                if (raw) return mergeWebsiteV2WithDefaults(JSON.parse(raw) as Partial<WebsiteV2Blocks>)
            } catch { /* ignore */ }
        }
        return buildDefaultWebsiteV2Blocks()
    })

    const [websiteV3Blocks, setWebsiteV3Blocks] = useState<WebsiteV3Blocks>(() => {
        if (options?.initialData?.templateType === 'website_v3' && options?.initialData?.blocks)
            return mergeWebsiteV3WithDefaults(options.initialData.blocks as Partial<WebsiteV3Blocks>)
        if (!options?.initialData) {
            try {
                const raw = typeof window !== 'undefined' ? localStorage.getItem('sq_default_website_v3_blocks') : null
                if (raw) return mergeWebsiteV3WithDefaults(JSON.parse(raw) as Partial<WebsiteV3Blocks>)
            } catch { /* ignore */ }
        }
        return buildDefaultWebsiteV3Blocks()
    })

    const [supportBlocks, setSupportBlocks] = useState<SupportBlocks>(() => {
        if (options?.initialData?.templateType === 'support' && options?.initialData?.blocks)
            return mergeSupportWithDefaults(options.initialData.blocks as Partial<SupportBlocks>)
        if (!options?.initialData) {
            try {
                const raw = typeof window !== 'undefined' ? localStorage.getItem('sq_default_support_blocks') : null
                if (raw) return mergeSupportWithDefaults(JSON.parse(raw) as Partial<SupportBlocks>)
            } catch { /* ignore */ }
        }
        return buildDefaultSupportBlocks()
    })

    const [mobileAppBlocks, setMobileAppBlocks] = useState<MobileAppBlocks>(() => {
        if (options?.initialData?.templateType === 'mobile_app' && options?.initialData?.blocks)
            return mergeMobileAppWithDefaults(options.initialData.blocks as Partial<MobileAppBlocks>)
        if (!options?.initialData) {
            try {
                const raw = typeof window !== 'undefined' ? localStorage.getItem('sq_default_mobile_app_blocks') : null
                if (raw) return mergeMobileAppWithDefaults(JSON.parse(raw) as Partial<MobileAppBlocks>)
            } catch { /* ignore */ }
        }
        return buildDefaultMobileAppBlocks()
    })

    const [mobileSimpleBlocks, setMobileSimpleBlocks] = useState<MobileSimpleBlocks>(() => {
        if (options?.initialData?.templateType === 'mobile_simple' && options?.initialData?.blocks)
            return mergeMobileSimpleWithDefaults(options.initialData.blocks as Partial<MobileSimpleBlocks>)
        if (!options?.initialData) {
            try {
                const raw = typeof window !== 'undefined' ? localStorage.getItem('sq_default_mobile_simple_blocks') : null
                if (raw) return mergeMobileSimpleWithDefaults(JSON.parse(raw) as Partial<MobileSimpleBlocks>)
            } catch { /* ignore */ }
        }
        return buildDefaultMobileSimpleBlocks()
    })

    const [universalBlocks, setUniversalBlocks] = useState<UniversalBlocks>(() => {
        if (options?.initialData?.templateType === 'universal' && options?.initialData?.blocks)
            return mergeUniversalWithDefaults(options.initialData.blocks as Partial<UniversalBlocks>)
        if (!options?.initialData) {
            try {
                const raw = typeof window !== 'undefined' ? localStorage.getItem('sq_default_universal_blocks') : null
                if (raw) return mergeUniversalWithDefaults(JSON.parse(raw) as Partial<UniversalBlocks>)
            } catch { /* ignore */ }
        }
        return buildDefaultUniversalBlocks()
    })

    const [selectedClient, setSelectedClient] = useState<Client | null>(() => {
        return options?.initialData?.client || null;
    });
    const [selectedLead, setSelectedLead] = useState<Lead | null>(() => {
        return options?.initialData?.lead || null;
    });

    const [offerDetails, setOfferDetails] = useState<OfferDetails>(() => {
        if (options?.initialData) {
            return {
                title: options.initialData.title,
                description: options.initialData.description || '',
                validUntil: options.initialData.validUntil
                    ? options.initialData.validUntil.split('T')[0]
                    : '',
                notes: options.initialData.notes || '',
                terms: options.initialData.terms || '',
                paymentDays: options.initialData.paymentDays,
                requireAuditTrail: options.initialData.requireAuditTrail || false,
                templateType: (options.initialData.templateType as 'classic' | 'proposal' | 'shop' | 'website_v2' | 'website_v3' | 'support' | 'mobile_app' | 'mobile_simple' | 'universal') ?? 'classic',
            };
        }
        // Load saved classic settings from localStorage (set in Szablony → Szablony dokumentów)
        let classicSettings: { paymentDays?: number; terms?: string; notes?: string } = {}
        try {
            const raw = typeof window !== 'undefined' ? localStorage.getItem('sq_default_classic_settings') : null
            if (raw) classicSettings = JSON.parse(raw)
        } catch { /* ignore */ }
        return {
            ...defaultOfferDetails,
            terms: '',
            ...(classicSettings.paymentDays != null ? { paymentDays: classicSettings.paymentDays } : {}),
            ...(classicSettings.terms ? { terms: classicSettings.terms } : {}),
            ...(classicSettings.notes ? { notes: classicSettings.notes } : {}),
            ...(preselectedTitle ? { title: preselectedTitle } : {}),
        };
    });

    const [items, setItems] = useState<ExtendedOfferItem[]>(() => {
        if (options?.initialData?.items) {
            return options.initialData.items.map((item) => ({
                name: item.name,
                description: item.description || '',
                quantity: Number(item.quantity),
                unit: item.unit,
                unitPrice: Number(item.unitPrice),
                vatRate: Number(item.vatRate),
                discount: Number(item.discount),
                isOptional: item.isOptional || false,
                minQuantity: item.minQuantity || 1,
                maxQuantity: item.maxQuantity || 100,
                variantName: item.variantName || '',
            }));
        }
        return [{ ...emptyItem }];
    });

    // Guard prevents this one-shot init from re-running on every TanStack Query background refetch
    // (each refetch returns a new clients array reference, which would re-trigger the effect and
    // reset the wizard step back to type_choice even after the user has progressed further).
    const preselectedApplied = useRef(false);

    useEffect(() => {
        if (preselectedApplied.current) return;
        if (!isEditMode && preselectedClientId && clients.length > 0) {
            const client = clients.find((c) => c.id === preselectedClientId);
            if (client) {
                preselectedApplied.current = true;
                setSelectedClient(client);
                setSelectedLead(null);
                setCurrentStep('type_choice');
            }
        } else if (!isEditMode && preselectedLeadId && leads.length > 0) {
            const lead = leads.find((l) => l.id === preselectedLeadId);
            if (lead) {
                preselectedApplied.current = true;
                setSelectedLead(lead);
                setSelectedClient(null);
                setCurrentStep('type_choice');
            }
        }
    }, [isEditMode, preselectedClientId, preselectedLeadId, clients, leads]);

    const totals = useMemo(() => {
        return items.reduce(
            (acc, item) => {
                const itemTotals = calculateItemTotal(item);
                return {
                    totalNet: acc.totalNet + itemTotals.totalNet,
                    totalVat: acc.totalVat + itemTotals.totalVat,
                    totalGross: acc.totalGross + itemTotals.totalGross,
                };
            },
            { totalNet: 0, totalVat: 0, totalGross: 0 }
        );
    }, [items]);

    const uniqueVariants = useMemo(() => getUniqueVariants(items), [items]);

    const entityName = selectedClient?.name ?? selectedLead?.name ?? 'Klient';
    const submittedTitle = useMemo(
        () => buildSubmittedTitle(offerDetails.templateType, entityName, offerDetails.title),
        [entityName, offerDetails.templateType, offerDetails.title],
    );

    const submittedBlocks = useMemo(() => {
        switch (offerDetails.templateType) {
            case 'proposal':
                return proposalBlocks as unknown;
            case 'shop':
                return shopBlocks as unknown;
            case 'website_v2':
                return websiteV2Blocks as unknown;
            case 'website_v3':
                return websiteV3Blocks as unknown;
            case 'support':
                return supportBlocks as unknown;
            case 'mobile_app':
                return mobileAppBlocks as unknown;
            case 'mobile_simple':
                return mobileSimpleBlocks as unknown;
            case 'universal':
                return universalBlocks as unknown;
            default:
                return null;
        }
    }, [
        offerDetails.templateType,
        proposalBlocks,
        shopBlocks,
        websiteV2Blocks,
        websiteV3Blocks,
        supportBlocks,
        mobileAppBlocks,
        mobileSimpleBlocks,
        universalBlocks,
    ]);

    const templatePrice = useMemo(
        () => resolveTemplatePrice(submittedBlocks, offerDetails.templateType),
        [submittedBlocks, offerDetails.templateType],
    );

    const summaryItems = useMemo<ExtendedOfferItem[]>(() => {
        if (!isEditMode && isDocumentTemplateType(offerDetails.templateType)) {
            return [{
                ...emptyItem,
                name: submittedTitle,
                unitPrice: templatePrice?.net ?? 0,
                vatRate: templatePrice?.vatRate ?? 23,
            }];
        }

        return items;
    }, [isEditMode, items, offerDetails.templateType, submittedTitle, templatePrice]);

    const summaryTotals = useMemo(() => {
        if (!isEditMode && isDocumentTemplateType(offerDetails.templateType) && templatePrice) {
            return {
                totalNet: templatePrice.net,
                totalVat: templatePrice.vat,
                totalGross: templatePrice.gross,
            };
        }

        return summaryItems.reduce(
            (acc, item) => {
                const itemTotals = calculateItemTotal(item);
                return {
                    totalNet: acc.totalNet + itemTotals.totalNet,
                    totalVat: acc.totalVat + itemTotals.totalVat,
                    totalGross: acc.totalGross + itemTotals.totalGross,
                };
            },
            { totalNet: 0, totalVat: 0, totalGross: 0 }
        );
    }, [isEditMode, offerDetails.templateType, summaryItems, templatePrice]);

    const stepIds = useMemo(
        () => buildStepIds(offerDetails.templateType ?? 'classic', isEditMode),
        [offerDetails.templateType, isEditMode],
    );

    const goToStep = useCallback((step: Step) => setCurrentStep(step), []);

    const goNext = useCallback(() => {
        const currentIndex = stepIds.indexOf(currentStep);
        if (currentIndex < stepIds.length - 1) {
            setCurrentStep(stepIds[currentIndex + 1]);
        }
    }, [currentStep, stepIds]);

    const goBack = useCallback(() => {
        const currentIndex = stepIds.indexOf(currentStep);
        if (currentIndex > 0) {
            setCurrentStep(stepIds[currentIndex - 1]);
        }
    }, [currentStep, stepIds]);

    const addItem = useCallback(() => {
        setItems((prev) => [...prev, { ...emptyItem }]);
    }, []);

    const removeItem = useCallback((index: number) => {
        setItems((prev) => {
            if (prev.length > 1) {
                return prev.filter((_, i) => i !== index);
            }
            return prev;
        });
    }, []);

    const updateItem = useCallback(
        (index: number, field: keyof ExtendedOfferItem, value: string | number | boolean) => {
            setItems((prev) => {
                const newItems = [...prev];
                newItems[index] = { ...newItems[index], [field]: value };
                return newItems;
            });
        },
        []
    );

    const updateDetails = useCallback(
        <K extends keyof OfferDetails>(field: K, value: OfferDetails[K]) => {
            setOfferDetails((prev) => ({ ...prev, [field]: value }));
        },
        []
    );

    const applyTemplate = useCallback(
        (template: OfferTemplate) => {
            const templateItems: ExtendedOfferItem[] = template.items.map((item) => ({
                name: item.name,
                description: item.description ?? '',
                quantity: Number(item.quantity),
                unit: item.unit,
                unitPrice: Number(item.unitPrice),
                vatRate: Number(item.vatRate),
                discount: Number(item.discount),
                isOptional: item.isOptional,
                minQuantity: 1,
                maxQuantity: 100,
                variantName: item.variantName ?? '',
            }));

            setItems(templateItems);

            if (!offerDetails.paymentDays || offerDetails.paymentDays === defaultOfferDetails.paymentDays) {
                setOfferDetails((prev) => ({
                    ...prev,
                    paymentDays: template.defaultPaymentDays,
                    terms: prev.terms || template.defaultTerms || '',
                    notes: prev.notes || template.defaultNotes || '',
                }));
            }

            toast.success(
                tr.toasts.templateApplied,
                tr.toasts.templateAppliedDesc
                    .replace('{n}', String(template.items.length))
                    .replace('{name}', template.name)
            );
        },
        [offerDetails.paymentDays, toast, tr.toasts.templateApplied, tr.toasts.templateAppliedDesc]
    );

    const canProceed = useCallback(() => {
        switch (currentStep) {
            case 'client':
                return selectedClient !== null || selectedLead !== null;
            case 'type_choice':
                return true; // template type always has a default value
            case 'details':
                return offerDetails.title.length >= 3;
            case 'items':
                return items.every(
                    (item) => item.name && item.quantity > 0 && item.unitPrice >= 0
                );
            default:
                return true;
        }
    }, [currentStep, selectedClient, selectedLead, offerDetails.title, items]);

    const handleSubmit = useCallback(async () => {
        if (!selectedClient && !selectedLead) return;

        setIsSubmitting(true);

        try {
            const entityName = selectedClient?.name ?? selectedLead?.name ?? 'Klient';

            const isProposal = offerDetails.templateType === 'proposal';
            const isShop = offerDetails.templateType === 'shop';
            const isWebsiteV2 = offerDetails.templateType === 'website_v2';
            const isWebsiteV3 = offerDetails.templateType === 'website_v3';
            const isSupport = offerDetails.templateType === 'support';
            const isMobileApp = offerDetails.templateType === 'mobile_app';
            const isMobileSimple = offerDetails.templateType === 'mobile_simple';
            const isUniversal = offerDetails.templateType === 'universal';
            const isDocTemplate = isProposal || isShop || isWebsiteV2 || isWebsiteV3 || isSupport || isMobileApp || isMobileSimple || isUniversal;

            // For doc-template offers created via the new flow, the details step is skipped
            // → auto-fill title and create a single placeholder item from priceOverride.
            const submittedTitle = offerDetails.title.trim() ||
                (isShop ? `Sklep — ${entityName}` :
                 isWebsiteV2 ? `Strona WWW — ${entityName}` :
                 isWebsiteV3 ? `Strona WWW v3 — ${entityName}` :
                 isSupport ? `Wsparcie IT — ${entityName}` :
                 isMobileApp ? `Aplikacja mobilna — ${entityName}` :
                 isMobileSimple ? `Aplikacja mobilna — ${entityName}` :
                 isUniversal ? `Oferta — ${entityName}` :
                 offerDetails.templateType === 'classic' ? `Oferta — ${entityName}` :
                 `Propozycja — ${entityName}`);

            const submittedBlocks = isProposal ? (proposalBlocks as unknown) : isShop ? (shopBlocks as unknown) : isWebsiteV2 ? (websiteV2Blocks as unknown) : isWebsiteV3 ? (websiteV3Blocks as unknown) : isSupport ? (supportBlocks as unknown) : isMobileApp ? (mobileAppBlocks as unknown) : isMobileSimple ? (mobileSimpleBlocks as unknown) : isUniversal ? (universalBlocks as unknown) : null;
            const templatePrice = resolveTemplatePrice(submittedBlocks, offerDetails.templateType);

            const proposalPlaceholderItem = {
                name: submittedTitle,
                description: undefined,
                quantity: 1,
                unit: 'szt.',
                unitPrice: templatePrice?.net ?? 0,
                vatRate: templatePrice?.vatRate ?? 23,
                discount: 0,
                isOptional: false,
            };

            const submittedItems = isDocTemplate && !isEditMode
                ? [proposalPlaceholderItem]
                : items.map((item) => ({
                    name: item.name,
                    description: item.description || undefined,
                    quantity: item.quantity,
                    unit: item.unit,
                    unitPrice: item.unitPrice,
                    vatRate: item.vatRate,
                    discount: item.discount,
                    isOptional: item.isOptional,
                    minQuantity: item.isOptional ? item.minQuantity : undefined,
                    maxQuantity: item.isOptional ? item.maxQuantity : undefined,
                    variantName: item.variantName.trim() || undefined,
                }));

            const data: CreateOfferInput = {
                clientId: selectedClient?.id ?? null,
                leadId: selectedLead?.id ?? null,
                title: submittedTitle,
                description: offerDetails.description || undefined,
                validUntil: offerDetails.validUntil || undefined,
                notes: offerDetails.notes || undefined,
                terms: offerDetails.terms || undefined,
                paymentDays: offerDetails.paymentDays,
                requireAuditTrail: offerDetails.requireAuditTrail,
                templateType: offerDetails.templateType ?? 'classic',
                blocks: submittedBlocks,
                items: submittedItems,
            };

            if (isEditMode && offerId) {
                await offersApi.update(offerId, data);
                toast.success(tr.toasts.updated, tr.toasts.updatedDesc);
                router.push(`/dashboard/offers/${offerId}`);
            } else {
                const response = await offersApi.create(data);
                if (response.data?.id) {
                    toast.success(tr.toasts.created);
                    router.push(`/dashboard/offers/${response.data.id}`);
                } else {
                    throw new Error(tr.toasts.createError);
                }
            }
        } catch (err) {
            if (err instanceof ApiError) {
                toast.error(
                    isEditMode ? tr.toasts.updateError : tr.toasts.createError,
                    err.message
                );
            } else {
                toast.error(commonTr.errorTitle, tr.toasts.unknownError);
            }
            setIsSubmitting(false);
        }
    }, [isEditMode, offerId, selectedClient, selectedLead, offerDetails, proposalBlocks, shopBlocks, websiteV2Blocks, websiteV3Blocks, supportBlocks, mobileAppBlocks, mobileSimpleBlocks, universalBlocks, items, toast, router, tr.toasts, commonTr.errorTitle]);

    return {
        clients,
        isLoadingClients,
        leads,
        isLoadingLeads,
        currentStep,
        isSubmitting,
        isEditMode,
        selectedClient,
        setSelectedClient,
        selectedLead,
        setSelectedLead,
        offerDetails,
        updateDetails,
        items,
        summaryItems,
        addItem,
        removeItem,
        updateItem,
        totals,
        summaryTotals,
        uniqueVariants,
        stepIds,
        goToStep,
        goNext,
        goBack,
        canProceed,
        handleSubmit,
        applyTemplate,
        templateSelectorOpen,
        setTemplateSelectorOpen,
        proposalBlocks,
        setProposalBlocks,
        shopBlocks,
        setShopBlocks,
        websiteV2Blocks,
        setWebsiteV2Blocks,
        websiteV3Blocks,
        setWebsiteV3Blocks,
        supportBlocks,
        setSupportBlocks,
        mobileAppBlocks,
        setMobileAppBlocks,
        mobileSimpleBlocks,
        setMobileSimpleBlocks,
        universalBlocks,
        setUniversalBlocks,
        router,
    };
}
