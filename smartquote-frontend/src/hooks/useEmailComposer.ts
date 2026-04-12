// src/hooks/useEmailComposer.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { emailsApi } from '@/lib/api/emails.api';
import { offersApi } from '@/lib/api/offers.api';
import { clientsApi } from '@/lib/api/clients.api';
import { contractsApi } from '@/lib/api/contracts.api';
import { BUILT_IN_TEMPLATES } from '@/types/email.types';
import type {
    EmailAttachment,
    EmailTemplate,
    SendEmailInput,
} from '@/types/email.types';
import type { Client } from '@/types/client.types';
import type { Offer } from '@/types/offer.types';
import type { Contract } from '@/types/contract.types';

interface ComposerErrors {
    to?: string;
    subject?: string;
    body?: string;
}

export function useEmailComposer(draftId?: string) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [to, setTo] = useState('');
    const [toName, setToName] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [clientId, setClientId] = useState('');
    const [offerId, setOfferId] = useState('');
    const [contractId, setContractId] = useState('');
    const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [errors, setErrors] = useState<ComposerErrors>({});
    const [isSending, setIsSending] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const [clients, setClients] = useState<Client[]>([]);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [userTemplates, setUserTemplates] = useState<EmailTemplate[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsLoadingData(true);
            try {
                const [clientsRes, offersRes, contractsRes, templatesRes] = await Promise.all([
                    clientsApi.list({ limit: 200 }),
                    offersApi.list({ limit: 200 }),
                    contractsApi.list({ limit: 200 }),
                    emailsApi.getTemplates(),
                ]);
                if (clientsRes.data) setClients(clientsRes.data);
                if (offersRes.data) setOffers(offersRes.data);
                if (contractsRes.data) setContracts(contractsRes.data);
                if (templatesRes.data) setUserTemplates(templatesRes.data);
            } catch {
                setErrorMessage('Nie udało się załadować danych');
            } finally {
                setIsLoadingData(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (isLoadingData) return;

        const preOfferId = searchParams.get('offerId');
        const preClientId = searchParams.get('clientId');
        const preContractId = searchParams.get('contractId');

        if (preOfferId) {
            setOfferId(preOfferId);
            const offer = offers.find(o => o.id === preOfferId);
            if (offer) {
                setSubject(`Oferta handlowa — ${offer.number}`);
                setAttachments(prev => {
                    const hasPdf = prev.some(a => a.type === 'offer_pdf' && a.resourceId === preOfferId);
                    if (!hasPdf) {
                        return [...prev, {
                            type: 'offer_pdf' as const,
                            resourceId: preOfferId,
                            name: `Oferta ${offer.number}.pdf`,
                        }];
                    }
                    return prev;
                });
                if (offer.client?.email) {
                    setTo(offer.client.email);
                    setToName(offer.client.name);
                    setClientId(offer.client.id);
                }
            }
        }

        if (preClientId && !preOfferId) {
            setClientId(preClientId);
            const client = clients.find(c => c.id === preClientId);
            if (client?.email) {
                setTo(client.email);
                setToName(client.name);
            }
        }

        if (preContractId) {
            setContractId(preContractId);
            const contract = contracts.find(c => c.id === preContractId);
            if (contract) {
                setSubject(`Umowa — ${contract.number}`);
                setAttachments(prev => {
                    const hasPdf = prev.some(a => a.type === 'contract_pdf' && a.resourceId === preContractId);
                    if (!hasPdf) {
                        return [...prev, {
                            type: 'contract_pdf' as const,
                            resourceId: preContractId,
                            name: `Umowa ${contract.number}.pdf`,
                        }];
                    }
                    return prev;
                });
            }
        }
    }, [isLoadingData, searchParams, offers, clients, contracts]);

    useEffect(() => {
        if (!draftId) return;
        const load = async () => {
            try {
                const res = await emailsApi.get(draftId);
                if (!res.data) return;
                const draft = res.data;
                setTo(draft.to);
                setToName(draft.toName ?? '');
                setSubject(draft.subject);
                setBody(draft.body);
                setClientId(draft.clientId ?? '');
                setOfferId(draft.offerId ?? '');
                setContractId(draft.contractId ?? '');
                setAttachments(draft.attachments ?? []);
                setSelectedTemplateId(draft.templateId ?? '');
            } catch {
                setErrorMessage('Nie udało się załadować szkicu');
            }
        };
        load();
    }, [draftId]);

    const handleClientChange = useCallback((id: string) => {
        setClientId(id);
        const client = clients.find(c => c.id === id);
        if (client?.email) {
            setTo(client.email);
            setToName(client.name);
        }
    }, [clients]);

    const handleOfferChange = useCallback((id: string) => {
        setOfferId(id);
        if (!id) {
            setAttachments(prev => prev.filter(a => a.type !== 'offer_pdf' && a.type !== 'offer_link'));
            return;
        }
        const offer = offers.find(o => o.id === id);
        if (!offer) return;

        if (!clientId && offer.client?.email) {
            setTo(offer.client.email);
            setToName(offer.client.name);
            setClientId(offer.client.id);
        }

        setAttachments(prev => {
            const filtered = prev.filter(a => a.type !== 'offer_pdf');
            return [...filtered, {
                type: 'offer_pdf' as const,
                resourceId: id,
                name: `Oferta ${offer.number}.pdf`,
            }];
        });
    }, [offers, clientId]);

    const handleContractChange = useCallback((id: string) => {
        setContractId(id);
        if (!id) {
            setAttachments(prev => prev.filter(a => a.type !== 'contract_pdf' && a.type !== 'contract_link'));
            return;
        }
        const contract = contracts.find(c => c.id === id);
        if (!contract) return;

        setAttachments(prev => {
            const filtered = prev.filter(a => a.type !== 'contract_pdf');
            return [...filtered, {
                type: 'contract_pdf' as const,
                resourceId: id,
                name: `Umowa ${contract.number}.pdf`,
            }];
        });
    }, [contracts]);

    const handleAddPublicLink = useCallback((
        type: 'offer_link' | 'contract_link',
        resourceId: string,
        label: string
    ) => {
        setAttachments(prev => {
            const exists = prev.some(a => a.type === type && a.resourceId === resourceId);
            if (exists) return prev;
            return [...prev, { type, resourceId, name: label }];
        });
    }, []);

    const handleRemoveAttachment = useCallback((index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleTemplateSelect = useCallback((templateId: string) => {
        setSelectedTemplateId(templateId);
        if (!templateId) return;

        const builtIn = BUILT_IN_TEMPLATES.find(t => t.id === templateId);
        if (builtIn) {
            setSubject(builtIn.subject);
            setBody(builtIn.body);
            return;
        }

        const userTemplate = userTemplates.find(t => t.id === templateId);
        if (userTemplate) {
            setSubject(userTemplate.subject);
            setBody(userTemplate.body);
        }
    }, [userTemplates]);

    const validate = useCallback((): boolean => {
        const newErrors: ComposerErrors = {};
        if (!to.trim()) {
            newErrors.to = 'Adres email odbiorcy jest wymagany';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
            newErrors.to = 'Nieprawidłowy adres email';
        }
        if (!subject.trim()) newErrors.subject = 'Temat jest wymagany';
        if (!body.trim()) newErrors.body = 'Treść wiadomości jest wymagana';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [to, subject, body]);

    const buildPayload = useCallback((saveAsDraft: boolean): SendEmailInput => ({
        to: to.trim(),
        toName: toName.trim() || undefined,
        subject: subject.trim(),
        body: body.trim(),
        clientId: clientId || undefined,
        offerId: offerId || undefined,
        contractId: contractId || undefined,
        templateId: selectedTemplateId || undefined,
        attachments,
        saveAsDraft,
    }), [to, toName, subject, body, clientId, offerId, contractId, selectedTemplateId, attachments]);

    const handleSend = useCallback(async () => {
        if (!validate()) return;
        setIsSending(true);
        setErrorMessage('');
        setSuccessMessage('');
        try {
            let res;
            if (draftId) {
                res = await emailsApi.sendDraft(draftId);
            } else {
                res = await emailsApi.send(buildPayload(false));
            }
            if (!res.data) throw new Error('Brak odpowiedzi z serwera');

            if (res.data.status === 'FAILED') {
                setErrorMessage('Wiadomość nie została wysłana. Sprawdź konfigurację SMTP w ustawieniach.');
                return;
            }

            setSuccessMessage('Wiadomość została wysłana pomyślnie!');
            setTimeout(() => router.push('/dashboard/emails'), 1500);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Błąd wysyłki';
            if (msg.includes('SMTP_NOT_CONFIGURED')) {
                setErrorMessage('Brak konfiguracji SMTP. Przejdź do Ustawienia → SMTP aby skonfigurować skrzynkę pocztową.');
            } else {
                setErrorMessage(msg);
            }
        } finally {
            setIsSending(false);
        }
    }, [validate, draftId, buildPayload, router]);

    const handleSaveDraft = useCallback(async () => {
        if (!to.trim() && !subject.trim() && !body.trim()) {
            setErrorMessage('Wypełnij przynajmniej jedno pole aby zapisać szkic');
            return;
        }
        setIsSavingDraft(true);
        setErrorMessage('');
        try {
            if (draftId) {
                await emailsApi.updateDraft(draftId, {
                    to: to.trim() || undefined,
                    toName: toName.trim() || undefined,
                    subject: subject.trim() || undefined,
                    body: body.trim() || undefined,
                    clientId: clientId || null,
                    offerId: offerId || null,
                    contractId: contractId || null,
                    attachments,
                });
            } else {
                await emailsApi.send(buildPayload(true));
            }
            setSuccessMessage('Szkic zapisany');
            setTimeout(() => router.push('/dashboard/emails'), 1200);
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : 'Błąd zapisywania szkicu');
        } finally {
            setIsSavingDraft(false);
        }
    }, [to, toName, subject, body, clientId, offerId, contractId, attachments, draftId, buildPayload, router]);

    return {
        to, setTo,
        toName, setToName,
        subject, setSubject,
        body, setBody,
        clientId,
        offerId,
        contractId,
        attachments,
        selectedTemplateId,
        errors,
        isSending,
        isSavingDraft,
        successMessage,
        errorMessage,
        setErrorMessage,
        clients,
        offers,
        contracts,
        userTemplates,
        isLoadingData,
        handleClientChange,
        handleOfferChange,
        handleContractChange,
        handleAddPublicLink,
        handleRemoveAttachment,
        handleTemplateSelect,
        handleSend,
        handleSaveDraft,
    };
}