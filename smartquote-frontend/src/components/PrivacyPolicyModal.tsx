'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '@/i18n';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const CONTENT = {
    en: {
        title: 'Privacy Policy',
        updated: 'Last updated: May 31, 2026',
        sections: [
            {
                heading: '§1. Data Controller',
                body: 'The controller of your personal data is Shellty IT Tomasz Skorupski, os. Bursztynowe 78/78, 72-005 Warzymice, Poland, Tax ID (NIP): 8513307050, e-mail: shellty@zohomail.eu.',
            },
            {
                heading: '§2. Data We Process',
                body: 'We process the following personal data:\n• E-mail address and name – provided upon registration\n• Phone number – optional, provided in your profile\n• Company data – provided in settings (name, Tax ID, address, bank details)\n• Clients, offers, and contracts data – entered by you while using the application\n• Technical data – IP addresses, login timestamps, activity logs',
            },
            {
                heading: '§3. Purpose and Legal Basis',
                body: 'Your data is processed for the following purposes:\n• Providing the CRM service (Art. 6(1)(b) GDPR – performance of a contract)\n• Security and fraud prevention (Art. 6(1)(f) GDPR – legitimate interest)\n• Compliance with legal obligations (Art. 6(1)(c) GDPR)',
            },
            {
                heading: '§4. Recipients of Data',
                body: 'Your data may be shared with the following processors:\n• Google LLC – Gemini AI service (offer content generation; servers may be outside the EEA; Google applies standard contractual clauses)\n• Render Services, Inc. – application server hosting (USA; Render applies standard contractual clauses)\n• Netlify, Inc. – application frontend hosting (USA; Netlify applies standard contractual clauses)\n\nWe do not sell your personal data to third parties.',
            },
            {
                heading: '§5. Retention Period',
                body: 'Data is retained for the duration of your account. After account deletion, data is erased within 30 days, except where we are required to retain it by law.',
            },
            {
                heading: '§6. Your Rights',
                body: 'Under the GDPR you have the right to:\n• Access your data and obtain a copy\n• Rectify inaccurate data\n• Erasure of data (right to be forgotten)\n• Restriction of processing\n• Data portability\n• Object to processing\n• Lodge a complaint with the supervisory authority (President of the UODO, ul. Stawki 2, 00-193 Warsaw, Poland)\n\nTo exercise your rights, contact us: shellty@zohomail.eu',
            },
            {
                heading: '§7. Cookies and Local Storage',
                body: 'The application uses only browser local storage (localStorage) for:\n• Remembering your theme preference (light / dark)\n• Remembering your chosen interface language\n• Storing the session token (JWT) during your logged-in session\n\nWe do not use tracking or advertising cookies.',
            },
            {
                heading: '§8. Security',
                body: 'We apply technical and organisational security measures: connection encryption (HTTPS/TLS), password hashing (bcrypt), and encryption of sensitive data stored in the database (AES-256).',
            },
            {
                heading: '§9. Policy Changes',
                body: 'We will notify you of significant changes to this policy by e-mail or via an in-app notice.',
            },
            {
                heading: '§10. Contact',
                body: 'Privacy enquiries: shellty@zohomail.eu',
            },
        ],
    },
    pl: {
        title: 'Polityka prywatności',
        updated: 'Aktualizacja: 31 maja 2026 r.',
        sections: [
            {
                heading: '§1. Administrator danych osobowych',
                body: 'Administratorem Twoich danych osobowych jest Shellty IT Tomasz Skorupski, os. Bursztynowe 78/78, 72-005 Warzymice, NIP: 8513307050, e-mail: shellty@zohomail.eu.',
            },
            {
                heading: '§2. Zakres przetwarzanych danych',
                body: 'Przetwarzamy następujące dane osobowe:\n• Adres e-mail i imię – podane przy rejestracji konta\n• Numer telefonu – opcjonalnie, podany w profilu\n• Dane firmy – podane w ustawieniach (nazwa, NIP, adres, dane bankowe)\n• Dane klientów, ofert i umów – wprowadzane przez Ciebie w ramach korzystania z aplikacji\n• Dane techniczne – adresy IP, daty logowania, logi aktywności',
            },
            {
                heading: '§3. Cel i podstawa prawna przetwarzania',
                body: 'Twoje dane przetwarzamy w następujących celach:\n• Świadczenie usługi CRM (art. 6 ust. 1 lit. b RODO – wykonanie umowy)\n• Bezpieczeństwo i zapobieganie nadużyciom (art. 6 ust. 1 lit. f RODO – prawnie uzasadniony interes)\n• Wywiązanie się z obowiązków prawnych (art. 6 ust. 1 lit. c RODO)',
            },
            {
                heading: '§4. Odbiorcy danych',
                body: 'Twoje dane mogą być przekazywane następującym podmiotom przetwarzającym:\n• Google LLC – usługa Gemini AI (generowanie treści ofert; serwery mogą znajdować się poza EOG; Google stosuje standardowe klauzule umowne)\n• Render Services, Inc. – hosting serwera aplikacji (USA; Render stosuje standardowe klauzule umowne)\n• Netlify, Inc. – hosting interfejsu aplikacji (USA; Netlify stosuje standardowe klauzule umowne)\n\nNie sprzedajemy Twoich danych osobom trzecim.',
            },
            {
                heading: '§5. Okres przechowywania danych',
                body: 'Dane przechowujemy przez czas trwania konta. Po usunięciu konta dane są kasowane w ciągu 30 dni, z wyjątkiem danych, które musimy zachować zgodnie z przepisami prawa.',
            },
            {
                heading: '§6. Twoje prawa',
                body: 'Na podstawie RODO przysługują Ci prawa do:\n• Dostępu do danych i uzyskania ich kopii\n• Sprostowania nieprawidłowych danych\n• Usunięcia danych (prawo do bycia zapomnianym)\n• Ograniczenia przetwarzania\n• Przeniesienia danych\n• Wniesienia sprzeciwu wobec przetwarzania\n• Wniesienia skargi do Prezesa UODO (ul. Stawki 2, 00-193 Warszawa)\n\nAby skorzystać z praw, skontaktuj się z nami: shellty@zohomail.eu',
            },
            {
                heading: '§7. Pliki cookie i pamięć lokalna',
                body: 'Aplikacja korzysta wyłącznie z pamięci lokalnej przeglądarki (localStorage) w następujących celach:\n• Zapamiętanie preferencji motywu (jasny / ciemny)\n• Zapamiętanie wybranego języka interfejsu\n• Przechowywanie tokenu sesji (JWT) na czas zalogowania\n\nNie korzystamy z plików cookie śledzących ani reklamowych.',
            },
            {
                heading: '§8. Bezpieczeństwo danych',
                body: 'Stosujemy techniczne i organizacyjne środki ochrony danych: szyfrowanie połączeń (HTTPS/TLS), haszowanie haseł (bcrypt) oraz szyfrowanie wrażliwych danych przechowywanych w bazie (AES-256).',
            },
            {
                heading: '§9. Zmiany polityki prywatności',
                body: 'O istotnych zmianach polityki prywatności będziemy informować e-mailem lub komunikatem w aplikacji.',
            },
            {
                heading: '§10. Kontakt',
                body: 'W sprawach prywatności: shellty@zohomail.eu',
            },
        ],
    },
} as const;

export default function PrivacyPolicyModal({ isOpen, onClose }: Props) {
    const { language } = useLanguage();
    const c = CONTENT[language];

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            aria-modal="true"
            role="dialog"
            aria-labelledby="privacy-modal-title"
        >
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card shadow-elevated">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5 shrink-0">
                    <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary mb-0.5">
                            SmartQuote
                        </div>
                        <h2 id="privacy-modal-title" className="text-xl font-bold tracking-tight text-foreground">
                            {c.title}
                        </h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">{c.updated}</p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="shrink-0 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="overflow-y-auto px-6 py-5 space-y-6">
                    {c.sections.map((section) => (
                        <div key={section.heading}>
                            <h3 className="mb-2 text-sm font-semibold text-foreground">
                                {section.heading}
                            </h3>
                            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                {section.body}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t border-border px-6 py-4">
                    <button
                        onClick={onClose}
                        className="w-full h-10 rounded-xl bg-gradient-primary text-sm font-semibold text-white shadow-glow ring-1 ring-white/15 transition hover:brightness-110"
                    >
                        {language === 'pl' ? 'Zamknij' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
}
