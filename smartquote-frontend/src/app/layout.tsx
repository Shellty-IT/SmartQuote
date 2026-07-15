// SmartQuote-AI/src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { cookies } from 'next/headers';
import { Providers } from './providers';
import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const viewport: Viewport = {
    themeColor: '#2563eb',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    viewportFit: 'cover',
};

export const metadata: Metadata = {
    metadataBase: new URL('https://smart-quote.shellty.pl'),
    title: {
        default: 'SmartQuote AI — CRM sprzedażowy z asystentem AI',
        template: '%s | SmartQuote AI',
    },
    description: 'SmartQuote AI to CRM sprzedażowy, który usprawnia tworzenie ofert, obsługę klientów, e-podpisy i follow-upy dzięki inteligentnej automatyzacji.',
    applicationName: 'SmartQuote AI',
    keywords: ['CRM', 'sprzedaż', 'oferty handlowe', 'e-podpis', 'automatyzacja sprzedaży', 'AI'],
    authors: [{ name: 'Shellty' }],
    creator: 'Shellty',
    publisher: 'Shellty',
    alternates: {
        canonical: '/',
    },
    openGraph: {
        type: 'website',
        locale: 'pl_PL',
        url: '/',
        siteName: 'SmartQuote AI',
        title: 'SmartQuote AI — CRM sprzedażowy z asystentem AI',
        description: 'Twórz oferty, rozwijaj relacje z klientami, podpisuj dokumenty i automatyzuj sprzedaż w jednym inteligentnym CRM.',
        images: [
            {
                url: '/og-image-smartquote.webp',
                width: 1200,
                height: 630,
                type: 'image/webp',
                alt: 'SmartQuote AI — CRM i automatyzacja sprzedaży',
            },
            {
                url: '/og-image-smartquote.png',
                width: 1200,
                height: 630,
                type: 'image/png',
                alt: 'SmartQuote AI — CRM i automatyzacja sprzedaży',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'SmartQuote AI — CRM sprzedażowy z asystentem AI',
        description: 'Oferty, klienci, e-podpisy i automatyzacja sprzedaży w jednym inteligentnym CRM.',
        images: [
            {
                url: '/og-image-smartquote.webp',
                alt: 'SmartQuote AI — CRM i automatyzacja sprzedaży',
            },
        ],
    },
    manifest: '/site.webmanifest',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'SmartQuote AI',
    },
    icons: {
        icon: [
            { url: '/logo.svg', type: 'image/svg+xml' },
            { url: '/favicon.ico', sizes: 'any' },
        ],
        apple: [
            { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
    },
};

function ServiceWorkerRegistration() {
    if (process.env.NODE_ENV !== 'production') return null;
    return (
        <script
            dangerouslySetInnerHTML={{
                __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .then(function(reg) {
                  reg.addEventListener('updatefound', function() {
                    var newWorker = reg.installing;
                    if (newWorker) {
                      newWorker.addEventListener('statechange', function() { void newWorker.state; });
                    }
                  });
                })
                .catch(function() {});
            });
          }
        `,
            }}
        />
    );
}

function DevServiceWorkerCleanup() {
    if (process.env.NODE_ENV !== 'development') return null;
    return (
        <script
            dangerouslySetInnerHTML={{
                __html: `
          (function() {
            if (!('serviceWorker' in navigator)) return;
            window.addEventListener('load', function() {
              navigator.serviceWorker.getRegistrations()
                .then(function(registrations) {
                  if (!registrations.length) return false;
                  return Promise.all(registrations.map(function(reg) { return reg.unregister(); }))
                    .then(function() { return true; });
                })
                .then(function(unregistered) {
                  if (!('caches' in window)) return unregistered;
                  return caches.keys()
                    .then(function(keys) {
                      return Promise.all(keys
                        .filter(function(key) { return key.indexOf('smartquote-') === 0; })
                        .map(function(key) { return caches.delete(key); }));
                    })
                    .then(function() { return unregistered; });
                })
                .then(function(unregistered) {
                  if (!unregistered || !navigator.serviceWorker.controller) return;
                  if (sessionStorage.getItem('smartquote-dev-sw-cleaned') === '1') return;
                  sessionStorage.setItem('smartquote-dev-sw-cleaned', '1');
                  window.location.reload();
                })
                .catch(function() {});
            });
          })();
        `,
            }}
        />
    );
}

function resolveLanguage(value?: string): 'pl' | 'en' {
    return value === 'en' ? 'en' : 'pl';
}

export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: React.ReactNode;
}>) {
    const cookieStore = await cookies();
    const initialLanguage = resolveLanguage(cookieStore.get('smartquote-lang')?.value);

    return (
        <html lang={initialLanguage}>
        <head>
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="mobile-web-app-capable" content="yes" />
            <ServiceWorkerRegistration />
            <DevServiceWorkerCleanup />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers initialLanguage={initialLanguage}>{children}</Providers>
        </body>
        </html>
    );
}
