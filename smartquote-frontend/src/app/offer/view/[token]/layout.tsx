// SmartQuote-AI/src/app/offer/views/[token]/layout.tsx
import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
    themeColor: '#06b6d4',
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
};

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
            <div
                className="max-w-4xl mx-auto px-4 py-8 md:py-12"
                style={{
                    paddingLeft: 'max(1rem, env(safe-area-inset-left))',
                    paddingRight: 'max(1rem, env(safe-area-inset-right))',
                    paddingTop: 'max(2rem, env(safe-area-inset-top))',
                }}
            >
                {children}
            </div>
            <footer
                className="border-t border-slate-200 bg-white mt-12"
                style={{
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
            >
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