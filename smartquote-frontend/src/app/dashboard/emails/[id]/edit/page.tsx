// src/app/dashboard/emails/[id]/edit/page.tsx
'use client';

import { use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEmailComposer } from '@/hooks/useEmailComposer';
import RichTextEditor from '@/components/email/RichTextEditor';
import { BUILT_IN_TEMPLATES } from '@/types/email.types';
import type { EmailAttachment } from '@/types/email.types';
import { useTranslations } from '@/i18n';

interface PageProps {
    params: Promise<{ id: string }>;
}

function AttachmentTypeLabel({ type }: { type: EmailAttachment['type'] }) {
    const tr = useTranslations('emailsNew');
    const colors: Record<EmailAttachment['type'], string> = {
        offer_pdf: 'text-status-rejected',
        contract_pdf: 'text-status-accepted',
        offer_link: 'text-primary',
        contract_link: 'text-status-accepted',
    };
    return <span className={`text-xs font-medium ${colors[type]}`}>{tr.attachTypes[type]}</span>;
}

function EditDraftContent({ draftId }: { draftId: string }) {
    const router = useRouter();
    const tr = useTranslations('emailsNew');
    const {
        smtpConfigured,
        isLoadingSmtp,
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
    } = useEmailComposer(draftId);

    const selectedOffer = offers.find(o => o.id === offerId);
    const selectedContract = contracts.find(c => c.id === contractId);

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.push('/dashboard/emails')}
                    className="p-2 text-muted-foreground hover:bg-secondary/60 rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{tr.editTitle}</h1>
                    <p className="text-muted-foreground mt-0.5">{tr.editSubtitle}</p>
                </div>
            </div>

            {successMessage && (
                <div className="mb-6 p-4 rounded-xl bg-destructive/10 dark:bg-emerald-900/20 border border-destructive/25 dark:border-emerald-800 text-destructive dark:text-status-accepted text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-sm">
                    <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{errorMessage}</span>
                    </div>
                    {errorMessage.includes('SMTP') && (
                        <Link href="/dashboard/settings" className="inline-block mt-2 text-xs underline text-status-rejected">
                            {tr.smtpRedirect}
                        </Link>
                    )}
                </div>
            )}

            {!isLoadingSmtp && !smtpConfigured && (
                <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/25 text-sm text-destructive">
                    {tr.smtpConnectWarning}{' '}
                    <Link href="/dashboard/settings" className="underline">{tr.smtpLink}</Link>
                </div>
            )}

            <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="text-sm font-semibold text-foreground mb-4">{tr.templateSection}</h2>
                    <select
                        value={selectedTemplateId}
                        onChange={e => handleTemplateSelect(e.target.value)}
                        disabled={isLoadingData}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                    >
                        <option value="">{tr.templateOwn}</option>
                        <optgroup label={tr.templateBuiltIn}>
                            {BUILT_IN_TEMPLATES.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </optgroup>
                        {userTemplates.filter(t => !t.isBuiltIn).length > 0 && (
                            <optgroup label={tr.templateMine}>
                                {userTemplates.filter(t => !t.isBuiltIn).map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </optgroup>
                        )}
                    </select>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="text-sm font-semibold text-foreground mb-4">{tr.recipientSection}</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">{tr.clientOptional}</label>
                            <select
                                value={clientId}
                                onChange={e => handleClientChange(e.target.value)}
                                disabled={isLoadingData}
                                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                            >
                                <option value="">{tr.clientSelect}</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}{c.email ? ` <${c.email}>` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    {tr.emailRequired} <span className="text-status-rejected">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={to}
                                    onChange={e => setTo(e.target.value)}
                                    placeholder={tr.emailPlaceholder}
                                    className={`w-full px-3 py-2 rounded-xl border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 bg-card ${
                                        errors.to
                                            ? 'border-destructive'
                                            : 'border-border'
                                    }`}
                                />
                                {errors.to && <p className="mt-1 text-xs text-status-rejected">{errors.to}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">{tr.nameOptional}</label>
                                <input
                                    type="text"
                                    value={toName}
                                    onChange={e => setToName(e.target.value)}
                                    placeholder={tr.namePlaceholder}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="text-sm font-semibold text-foreground mb-4">{tr.contentSection}</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                                {tr.subjectLabel} <span className="text-status-rejected">*</span>
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                placeholder={tr.subjectPlaceholder}
                                className={`w-full px-3 py-2 rounded-xl border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 bg-card ${
                                    errors.subject
                                        ? 'border-destructive'
                                        : 'border-border'
                                }`}
                            />
                            {errors.subject && <p className="mt-1 text-xs text-status-rejected">{errors.subject}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                                {tr.bodyLabel} <span className="text-status-rejected">*</span>
                            </label>
                            <RichTextEditor
                                value={body}
                                onChange={setBody}
                                placeholder={tr.bodyPlaceholder}
                            />
                            {errors.body && <p className="mt-1 text-xs text-status-rejected">{errors.body}</p>}
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h2 className="text-sm font-semibold text-foreground mb-4">{tr.attachmentsSection}</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">{tr.offerLabel}</label>
                                <select
                                    value={offerId}
                                    onChange={e => handleOfferChange(e.target.value)}
                                    disabled={isLoadingData}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                                >
                                    <option value="">{tr.offerSelect}</option>
                                    {offers.map(o => (
                                        <option key={o.id} value={o.id}>{o.number} — {o.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">{tr.contractLabel}</label>
                                <select
                                    value={contractId}
                                    onChange={e => handleContractChange(e.target.value)}
                                    disabled={isLoadingData}
                                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                                >
                                    <option value="">{tr.contractSelect}</option>
                                    {contracts.map(c => (
                                        <option key={c.id} value={c.id}>{c.number} — {c.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {(selectedOffer?.publicToken || selectedContract?.publicToken) && (
                            <div className="flex flex-wrap gap-2">
                                {selectedOffer?.publicToken && (
                                    <button
                                        type="button"
                                        onClick={() => handleAddPublicLink('offer_link', selectedOffer.id, tr.addOfferLinkLabel.replace('{n}', selectedOffer.number))}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/25 text-primary text-xs hover:bg-primary/10 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        {tr.addOfferLink}
                                    </button>
                                )}
                                {selectedContract?.publicToken && (
                                    <button
                                        type="button"
                                        onClick={() => handleAddPublicLink('contract_link', selectedContract.id, tr.addContractLinkLabel.replace('{n}', selectedContract.number))}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-status-accepted/25 text-status-accepted text-xs hover:bg-status-accepted/10 dark:hover:bg-emerald-900/20 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        {tr.addContractLink}
                                    </button>
                                )}
                            </div>
                        )}

                        {attachments.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">{tr.attachmentsAdded}</p>
                                {attachments.map((att, i) => (
                                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-subtle/50 border border-border">
                                        <div className="flex items-center gap-2">
                                            <AttachmentTypeLabel type={att.type} />
                                            <span className="text-xs text-foreground">{att.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAttachment(i)}
                                            className="p-1 text-muted-foreground hover:text-status-rejected transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isSavingDraft || isSending}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-60"
                    >
                        {isSavingDraft ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                        )}
                        {tr.saveChanges}
                    </button>
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={isSending || isSavingDraft || (!isLoadingSmtp && !smtpConfigured)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-primary hover:brightness-110 text-white text-sm font-medium transition-colors disabled:opacity-60"
                    >
                        {isSending ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                        {tr.send}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function EditDraftPage({ params }: PageProps) {
    const { id } = use(params);
    return (
        <Suspense fallback={
            <div className="p-8 flex items-center justify-center">
                <svg className="w-6 h-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
            </div>
        }>
            <EditDraftContent draftId={id} />
        </Suspense>
    );
}
