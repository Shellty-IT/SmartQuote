// SmartQuote-AI/src/components/offers/PublishDialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { useOfferPublish, useOfferSendToClient } from '@/hooks/useOffers';
import { useSmtpConfig } from '@/hooks/useSettings';

interface PublishDialogProps {
    isOpen: boolean;
    onClose: () => void;
    offerId: string;
    offerNumber: string;
    validUntil: string | null;
    currentToken: string | null;
    isInteractive: boolean;
    clientEmail: string | null;
    onPublished: () => void;
}

export default function PublishDialog({
                                          isOpen,
                                          onClose,
                                          offerId,
                                          offerNumber,
                                          validUntil,
                                          currentToken,
                                          isInteractive,
                                          clientEmail,
                                          onPublished,
                                      }: PublishDialogProps) {
    const { publish, unpublish, isPublishing, isUnpublishing, error } = useOfferPublish(offerId);
    const { sendToClient, isSending, error: sendError } = useOfferSendToClient(offerId);
    const { config: smtpConfig, isLoading: isLoadingSmtp } = useSmtpConfig();

    const [publicUrl, setPublicUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [wasPublished, setWasPublished] = useState(false);
    const [sendEmail, setSendEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [emailSentTo, setEmailSentTo] = useState<string | null>(null);

    const smtpReady = smtpConfig?.smtpConfigured === true;
    const canSendEmail = !!clientEmail && smtpReady;

    useEffect(() => {
        if (isOpen && currentToken && isInteractive) {
            const baseUrl = window.location.origin;
            setPublicUrl(`${baseUrl}/offer/view/${currentToken}`);
            setWasPublished(true);
        } else if (isOpen) {
            setPublicUrl(null);
            setWasPublished(false);
        }
        setCopied(false);
        setSendEmail(false);
        setEmailSent(false);
        setEmailSentTo(null);
    }, [isOpen, currentToken, isInteractive]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePublish = async () => {
        const result = await publish();
        if (result) {
            setPublicUrl(result.publicUrl);
            setWasPublished(true);
            onPublished();

            if (sendEmail && canSendEmail) {
                const sendResult = await sendToClient();
                if (sendResult?.sent) {
                    setEmailSent(true);
                    setEmailSentTo(sendResult.email);
                }
            }
        }
    };

    const handleSendEmail = async () => {
        const result = await sendToClient();
        if (result?.sent) {
            setEmailSent(true);
            setEmailSentTo(result.email);
        }
    };

    const handleUnpublish = async () => {
        const success = await unpublish();
        if (success) {
            setPublicUrl(null);
            setWasPublished(false);
            setEmailSent(false);
            onPublished();
        }
    };

    const handleCopy = async () => {
        if (!publicUrl) return;
        try {
            await navigator.clipboard.writeText(publicUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch {
            const input = document.createElement('input');
            input.value = publicUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    const handleClose = () => {
        if (isPublishing || isUnpublishing || isSending) return;
        onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const isExpired = validUntil ? new Date(validUntil) < new Date() : false;
    const displayError = error || sendError;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </div>
                        <div>
                            <h2 id="publish-dialog-title" className="text-xl font-bold text-slate-900">
                                Interaktywny link do oferty
                            </h2>
                            <p className="text-sm text-slate-500">{offerNumber}</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="ml-auto p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            aria-label="Zamknij"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {displayError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700" role="alert">
                            {displayError}
                        </div>
                    )}

                    {!wasPublished ? (
                        <div>
                            <div className="bg-slate-50 rounded-xl p-4 mb-6">
                                <p className="text-sm text-slate-700 leading-relaxed">
                                    Wygeneruj interaktywny link, który możesz wysłać klientowi.
                                    Klient będzie mógł:
                                </p>
                                <ul className="mt-3 space-y-2">
                                    {['Przeglądać pozycje oferty', 'Wybierać opcjonalne pozycje i zmieniać ilości', 'Zadawać pytania przez komentarze', 'Zaakceptować lub odrzucić ofertę'].map((text) => (
                                        <li key={text} className="flex items-center gap-2 text-sm text-slate-600">
                                            <svg className="w-4 h-4 text-cyan-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {validUntil && (
                                <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 ${isExpired ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                                    <svg className={`w-5 h-5 flex-shrink-0 ${isExpired ? 'text-red-500' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className={`text-sm ${isExpired ? 'text-red-700' : 'text-blue-700'}`}>
                                        {isExpired
                                            ? 'Uwaga: Oferta wygasła. Klient zobaczy informację o wygaśnięciu.'
                                            : `Link będzie aktywny do ${new Date(validUntil).toLocaleDateString('pl-PL', { day: '2-digit', month: 'long', year: 'numeric' })}`
                                        }
                                    </p>
                                </div>
                            )}

                            <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-white">
                                <label className={`flex items-start gap-3 ${canSendEmail ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                                    <input
                                        type="checkbox"
                                        checked={sendEmail}
                                        onChange={(e) => setSendEmail(e.target.checked)}
                                        disabled={!canSendEmail || isLoadingSmtp}
                                        className="mt-0.5 w-4 h-4 text-cyan-500 border-slate-300 rounded focus:ring-cyan-500"
                                    />
                                    <div>
                                        <span className="text-sm font-medium text-slate-900">
                                            Wyślij link mailem do klienta
                                        </span>
                                        {clientEmail && canSendEmail && (
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Na adres: {clientEmail}
                                            </p>
                                        )}
                                        {!clientEmail && (
                                            <p className="text-xs text-amber-600 mt-0.5">
                                                Klient nie ma podanego adresu email
                                            </p>
                                        )}
                                        {clientEmail && !smtpReady && !isLoadingSmtp && (
                                            <p className="text-xs text-amber-600 mt-0.5">
                                                Skonfiguruj skrzynkę pocztową w{' '}
                                                <a href="/dashboard/settings" className="underline hover:text-amber-700">ustawieniach</a>
                                            </p>
                                        )}
                                    </div>
                                </label>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row gap-3">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Anuluj
                                </button>
                                <button
                                    onClick={handlePublish}
                                    disabled={isPublishing || isSending}
                                    className="flex-1 px-4 py-3 rounded-xl bg-cyan-500 text-white font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isPublishing || isSending ? (
                                        <>
                                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            {isSending ? 'Wysyłanie...' : 'Generowanie...'}
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                            {sendEmail ? 'Generuj i wyślij' : 'Generuj link'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Link do oferty
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 break-all select-all">
                                        {publicUrl}
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className={`px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 flex-shrink-0 ${
                                            copied
                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                : 'bg-cyan-500 text-white hover:bg-cyan-600'
                                        }`}
                                    >
                                        {copied ? (
                                            <>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                                Skopiowano
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                </svg>
                                                Kopiuj
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {emailSent && emailSentTo && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                                    <div className="flex items-start gap-2">
                                        <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm text-emerald-700">
                                            Email z linkiem został wysłany na adres <strong>{emailSentTo}</strong>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!emailSent && canSendEmail && (
                                <button
                                    onClick={handleSendEmail}
                                    disabled={isSending}
                                    className="w-full mb-4 px-4 py-3 rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700 font-medium hover:bg-cyan-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSending ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Wysyłanie...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            Wyślij link mailem ({clientEmail})
                                        </>
                                    )}
                                </button>
                            )}

                            {!emailSent && !canSendEmail && (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                                    <p className="text-sm text-slate-500">
                                        {!clientEmail
                                            ? 'Klient nie ma podanego adresu email — skopiuj link i wyślij ręcznie.'
                                            : 'Skonfiguruj skrzynkę pocztową w ustawieniach, aby wysyłać oferty mailem.'
                                        }
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col-reverse sm:flex-row gap-3">
                                <button
                                    onClick={handleUnpublish}
                                    disabled={isUnpublishing}
                                    className="px-4 py-3 rounded-xl border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isUnpublishing ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Dezaktywacja...
                                        </>
                                    ) : (
                                        'Dezaktywuj link'
                                    )}
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
                                >
                                    Zamknij
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}