// src/app/dashboard/emails/new/page.tsx
'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { useEmailComposer } from '@/hooks/useEmailComposer';
import RichTextEditor from '@/components/email/RichTextEditor';
import { BUILT_IN_TEMPLATES } from '@/types/email.types';
import type { EmailAttachment } from '@/types/email.types';

function AttachmentTypeLabel({ type }: { type: EmailAttachment['type'] }) {
    const labels: Record<EmailAttachment['type'], { text: string; color: string }> = {
        offer_pdf: { text: 'PDF oferty', color: 'text-red-500' },
        contract_pdf: { text: 'PDF umowy', color: 'text-emerald-600' },
        offer_link: { text: 'Link oferty', color: 'text-cyan-600' },
        contract_link: { text: 'Link umowy', color: 'text-emerald-600' },
    };
    const { text, color } = labels[type];
    return <span className={`text-xs font-medium ${color}`}>{text}</span>;
}

function EmailComposerContent() {
    const router = useRouter();
    const {
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
    } = useEmailComposer();

    const selectedOffer = offers.find(o => o.id === offerId);
    const selectedContract = contracts.find(c => c.id === contractId);

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.push('/dashboard/emails')}
                    className="p-2 text-themed-muted hover-themed rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-themed">Nowa wiadomość</h1>
                    <p className="text-themed-muted mt-0.5">Napisz i wyślij wiadomość do klienta</p>
                </div>
            </div>

            {successMessage && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                    <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{errorMessage}</span>
                    </div>
                    {errorMessage.includes('SMTP') && (
                        <a href="/dashboard/settings" className="inline-block mt-2 text-xs underline text-red-600 dark:text-red-400">
                            Przejdź do ustawień SMTP →
                        </a>
                    )}
                </div>
            )}

            <div className="space-y-6">
                <Card>
                    <h2 className="text-sm font-semibold text-themed mb-4">Szablon wiadomości</h2>
                    <select
                        value={selectedTemplateId}
                        onChange={e => handleTemplateSelect(e.target.value)}
                        disabled={isLoadingData}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-themed text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    >
                        <option value="">— Własna wiadomość —</option>
                        <optgroup label="Wbudowane">
                            {BUILT_IN_TEMPLATES.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </optgroup>
                        {userTemplates.filter(t => !t.isBuiltIn).length > 0 && (
                            <optgroup label="Moje szablony">
                                {userTemplates.filter(t => !t.isBuiltIn).map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </optgroup>
                        )}
                    </select>
                </Card>

                <Card>
                    <h2 className="text-sm font-semibold text-themed mb-4">Odbiorca</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-themed-muted mb-1">Klient (opcjonalnie)</label>
                            <select
                                value={clientId}
                                onChange={e => handleClientChange(e.target.value)}
                                disabled={isLoadingData}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-themed text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                            >
                                <option value="">— Wybierz klienta —</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}{c.email ? ` <${c.email}>` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-themed-muted mb-1">
                                    Adres email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={to}
                                    onChange={e => setTo(e.target.value)}
                                    placeholder="odbiorca@firma.pl"
                                    className={`w-full px-3 py-2 rounded-xl border text-themed text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 bg-white dark:bg-slate-800 ${
                                        errors.to
                                            ? 'border-red-400 dark:border-red-500'
                                            : 'border-slate-200 dark:border-slate-700'
                                    }`}
                                />
                                {errors.to && (
                                    <p className="mt-1 text-xs text-red-500">{errors.to}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-themed-muted mb-1">Imię i nazwisko (opcjonalnie)</label>
                                <input
                                    type="text"
                                    value={toName}
                                    onChange={e => setToName(e.target.value)}
                                    placeholder="Jan Kowalski"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-themed text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card>
                    <h2 className="text-sm font-semibold text-themed mb-4">Treść wiadomości</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-themed-muted mb-1">
                                Temat <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                placeholder="Temat wiadomości"
                                className={`w-full px-3 py-2 rounded-xl border text-themed text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 bg-white dark:bg-slate-800 ${
                                    errors.subject
                                        ? 'border-red-400 dark:border-red-500'
                                        : 'border-slate-200 dark:border-slate-700'
                                }`}
                            />
                            {errors.subject && (
                                <p className="mt-1 text-xs text-red-500">{errors.subject}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-themed-muted mb-1">
                                Treść <span className="text-red-500">*</span>
                            </label>
                            <RichTextEditor
                                value={body}
                                onChange={setBody}
                                placeholder="Wpisz treść wiadomości..."
                            />
                            {errors.body && (
                                <p className="mt-1 text-xs text-red-500">{errors.body}</p>
                            )}
                        </div>
                    </div>
                </Card>

                <Card>
                    <h2 className="text-sm font-semibold text-themed mb-4">Załączniki</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-themed-muted mb-1">Oferta</label>
                                <select
                                    value={offerId}
                                    onChange={e => handleOfferChange(e.target.value)}
                                    disabled={isLoadingData}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-themed text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                                >
                                    <option value="">— Wybierz ofertę —</option>
                                    {offers.map(o => (
                                        <option key={o.id} value={o.id}>
                                            {o.number} — {o.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-themed-muted mb-1">Umowa</label>
                                <select
                                    value={contractId}
                                    onChange={e => handleContractChange(e.target.value)}
                                    disabled={isLoadingData}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-themed text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                                >
                                    <option value="">— Wybierz umowę —</option>
                                    {contracts.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.number} — {c.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {(selectedOffer?.publicToken || selectedContract?.publicToken) && (
                            <div className="flex flex-wrap gap-2">
                                {selectedOffer?.publicToken && (
                                    <button
                                        type="button"
                                        onClick={() => handleAddPublicLink(
                                            'offer_link',
                                            selectedOffer.id,
                                            `Link do oferty ${selectedOffer.number}`
                                        )}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 text-xs hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Dodaj link publiczny oferty
                                    </button>
                                )}
                                {selectedContract?.publicToken && (
                                    <button
                                        type="button"
                                        onClick={() => handleAddPublicLink(
                                            'contract_link',
                                            selectedContract.id,
                                            `Link do umowy ${selectedContract.number}`
                                        )}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Dodaj link publiczny umowy
                                    </button>
                                )}
                            </div>
                        )}

                        {attachments.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-themed-muted">Dodane załączniki:</p>
                                {attachments.map((att, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                                    >
                                        <div className="flex items-center gap-2">
                                            <AttachmentTypeLabel type={att.type} />
                                            <span className="text-xs text-themed">{att.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAttachment(i)}
                                            className="p-1 text-themed-muted hover:text-red-500 transition-colors"
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
                </Card>

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isSavingDraft || isSending}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-themed hover-themed transition-colors disabled:opacity-60"
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
                        Zapisz szkic
                    </button>
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={isSending || isSavingDraft}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
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
                        Wyślij wiadomość
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function NewEmailPage() {
    return (
        <Suspense fallback={
            <div className="p-8 flex items-center justify-center">
                <svg className="w-6 h-6 animate-spin text-cyan-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
            </div>
        }>
            <EmailComposerContent />
        </Suspense>
    );
}