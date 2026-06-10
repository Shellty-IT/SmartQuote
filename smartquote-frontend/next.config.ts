// SmartQuote-AI/next.config.ts
import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

// localhost:* is always safe to allow in connect-src — it is never accessible from the public internet,
// so including it in the production build's CSP has zero security impact on Vercel deployments.
// This covers both `next dev` and `next start` for local development without relying on env vars.
const connectSrc = "connect-src 'self' https: http://localhost:* ws://localhost:*";

// CSP builder — frame-ancestors controls who can embed this page in an iframe.
// Default is 'none' (no embedding). Preview routes override it to 'self'.
function buildCsp(frameAncestors: "'none'" | "'self'") {
    return [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        connectSrc,
        // Allow blob: and srcdoc iframes (PDF preview modal + document editor)
        "frame-src 'self' blob:",
        `frame-ancestors ${frameAncestors}`,
    ].join('; ');
}

const securityHeaders = [
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ...(isDev ? [] : [
        {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
        },
    ]),
    { key: 'Content-Security-Policy', value: buildCsp("'none'") },
];

// Headers for routes that are intentionally loaded inside an iframe on the same origin
// (proposal HTML preview, public offer page loaded in PdfPreviewModal).
const previewFrameHeaders = [
    // Override the global frame-ancestors 'none' → 'self' so same-origin iframes work
    { key: 'Content-Security-Policy', value: buildCsp("'self'") },
    // X-Frame-Options SAMEORIGIN is consistent with frame-ancestors 'self'
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
];

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: securityHeaders,
            },
            // Proposal HTML preview — loaded in an iframe inside PdfPreviewModal
            {
                source: '/api/offers/:id/proposal/preview',
                headers: previewFrameHeaders,
            },
            // Public offer page can also be previewed in the same modal
            {
                source: '/public/offers/:token',
                headers: previewFrameHeaders,
            },
            {
                source: '/sw.js',
                headers: [
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                    { key: 'Service-Worker-Allowed', value: '/' },
                    { key: 'Content-Type', value: 'application/javascript' },
                ],
            },
            {
                source: '/manifest.json',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=3600' },
                    { key: 'Content-Type', value: 'application/manifest+json' },
                ],
            },
        ];
    },
};

export default nextConfig;
