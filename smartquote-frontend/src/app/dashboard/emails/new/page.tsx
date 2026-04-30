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
        offer_pdf: { text: 'PDF oferty', color: 'text-cyan-700 dark:text-cyan-400' },
        contract_pdf: { text: 'PDF umowy', color: 'text-emerald-700 dark:text-emerald-400' },
        offer_link: { text: 'Link oferty', color: 'text-cyan-700 dark:text-cyan-400' },
        contract_link: { text: 'Link umowy', color: 'text-emerald-700 dark:text-emerald-400' },
    };
    const { text, color } = labels[type];
    return <span className={`text-xs font-medium ${color}`}>{text}</span>;
}

function SectionCard({ title, accent, children }: { title: string; accent?: string; children: React.ReactNode }) {
    return (
        <div
            className="rounded-2xl border"
            style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: accent ?? 'var(--card-border)',
            }}
        >
            <div
                className="px-5 py-3 border-b rounded-t-2xl"
                style={{
                    backgroundColor: 'var(--dash-section-header)',
                    borderColor: accent ?? 'var(--card-border)',
                }}
            >
                <h2 className="text-sm font-semibold" style={{ color: 'var(--dash-section-title)' }}>{title}</h2>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function FormLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--label-text)' }}>
            {children}
            {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
    );
}

function StyledSelect({ value, onChange, disabled, children }: {
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    children: React.ReactNode;
}) {
    return (
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors"
            style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--input-border)',
                color: 'var(--input-text)',
            }}
        >
            {children}
        </select>
    );
}

function StyledInput({ type = 'text', value, onChange, placeholder, hasError }: {
    type?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    hasError?: boolean;
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors"
            style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: hasError ? '#f87171' : 'var(--input-border)',
                color: 'var(--input-text)',
            }}
        />
    );
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
                    className="p-2 rounded-lg transition-colors hover-themed"
                    style={{ color: 'var(--muted-text)' }}
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

            <div className="space-y-5">
                <SectionCard title="Szablon wiadomości" accent="#7dd3fc">
                    <StyledSelect value={selectedTemplateId} onChange={handleTemplateSelect} disabled={isLoadingData}>
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
                    </StyledSelect>
                </SectionCard>

                <SectionCard title="Odbiorca" accent="#93c5fd">
                    <div className="space-y-4">
                        <div>
                            <FormLabel>Klient (opcjonalnie)</FormLabel>
                            <StyledSelect value={clientId} onChange={handleClientChange} disabled={isLoadingData}>
                                <option value="">— Wybierz klienta —</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}{c.email ? ` <${c.email}>` : ''}
                                    </option>
                                ))}
                            </StyledSelect>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <FormLabel required>Adres email</FormLabel>
                                <StyledInput
                                    type="email"
                                    value={to}
                                    onChange={setTo}
                                    placeholder="odbiorca@firma.pl"
                                    hasError={!!errors.to}
                                />
                                {errors.to && <p className="mt-1 text-xs text-red-500">{errors.to}</p>}
                            </div>
                            <div>
                                <FormLabel>Imię i nazwisko (opcjonalnie)</FormLabel>
                                <StyledInput
                                    value={toName}
                                    onChange={setToName}
                                    placeholder="Jan Kowalski"
                                />
                            </div>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Treść wiadomości" accent="#60a5fa">
                    <div className="space-y-4">
                        <div>
                            <FormLabel required>Temat</FormLabel>
                            <StyledInput
                                value={subject}
                                onChange={setSubject}
                                placeholder="Temat wiadomości"
                                hasError={!!errors.subject}
                            />
                            {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
                        </div>
                        <div>
                            <FormLabel required>Treść</FormLabel>
                            <RichTextEditor
                                value={body}
                                onChange={setBody}
                                placeholder="Wpisz treść wiadomości..."
                            />
                            {errors.body && <p className="mt-1 text-xs text-red-500">{errors.body}</p>}
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Załączniki" accent="#38bdf8">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <FormLabel>Oferta</FormLabel>
                                <StyledSelect value={offerId} onChange={handleOfferChange} disabled={isLoadingData}>
                                    <option value="">— Wybierz ofertę —</option>
                                    {offers.map(o => (
                                        <option key={o.id} value={o.id}>
                                            {o.number} — {o.title}
                                        </option>
                                    ))}
                                </StyledSelect>
                            </div>
                            <div>
                                <FormLabel>Umowa</FormLabel>
                                <StyledSelect value={contractId} onChange={handleContractChange} disabled={isLoadingData}>
                                    <option value="">— Wybierz umowę —</option>
                                    {contracts.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.number} — {c.title}
                                        </option>
                                    ))}
                                </StyledSelect>
                            </div>
                        </div>

                        {(selectedOffer?.publicToken || selectedContract?.publicToken) && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {selectedOffer?.publicToken && (
                                    <button
                                        type="button"
                                        onClick={() => handleAddPublicLink(
                                            'offer_link',
                                            selectedOffer.id,
                                            `Link do oferty ${selectedOffer.number}`
                                        )}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
                                        style={{
                                            borderColor: '#38bdf8',
                                            color: '#0369a1',
                                            backgroundColor: 'rgba(56,189,248,0.08)',
                                        }}
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
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
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
                                <p className="text-xs font-semibold" style={{ color: 'var(--label-text)' }}>Dodane załączniki:</p>
                                {attachments.map((att, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between px-3 py-2 rounded-xl border"
                                        style={{
                                            backgroundColor: 'var(--section-bg)',
                                            borderColor: 'var(--divider)',
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--muted-text)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                            </svg>
                                            <AttachmentTypeLabel type={att.type} />
                                            <span className="text-xs text-themed">{att.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAttachment(i)}
                                            className="p-1 rounded-lg transition-colors hover:text-red-500"
                                            style={{ color: 'var(--muted-text)' }}
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
                </SectionCard>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-1">
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isSavingDraft || isSending}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium transition-colors disabled:opacity-60"
                        style={{
                            borderColor: 'var(--card-border)',
                            backgroundColor: 'var(--card-bg)',
                            color: 'var(--foreground)',
                        }}
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