// SmartQuote-AI/src/app/offer/view/[token]/layout.tsx

import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Oferta handlowa — SmartQuote',
    description: 'Interaktywna oferta handlowa',
};

export default function PublicOfferLayout({
                                              children,
                                          }: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                {children}
            </div>
            <footer className="border-t border-slate-200 bg-white mt-12">
                <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-slate-400">
                        Wygenerowano w{' '}
                        <span className="font-semibold text-slate-500">SmartQuote AI</span>
                    </p>
                    <p className="text-xs text-slate-400">
                        System zarządzania ofertami i sprzedażą
                    </p>
                </div>
            </footer>
        </div>
    );
}