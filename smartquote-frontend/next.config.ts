// SmartQuote-AI/next.config.ts
import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const isDev = process.env.NODE_ENV === 'development';
const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(frontendRoot);

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
        // shellty-it.github.io needed for demo/about website previews in offer documents
        "frame-src 'self' blob: https://shellty-it.github.io",
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
    turbopack: {
        root: repoRoot,
    },

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
            // Shop template preview — loaded in iframe inside ProposalDocumentEditor
            {
                source: '/api/offers/:id/shop/preview',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/offers/:id/pdf/shop',
                headers: previewFrameHeaders,
            },
            // Website v2 template preview — loaded in iframe inside WebsiteV2DocumentEditor
            {
                source: '/api/offers/:id/website-v2/preview',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/offers/:id/pdf/website-v2',
                headers: previewFrameHeaders,
            },
            // Website v3 template preview — loaded in iframe inside WebsiteV3DocumentEditor
            {
                source: '/api/offers/:id/website-v3/preview',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/offers/:id/pdf/website-v3',
                headers: previewFrameHeaders,
            },
            // Support template preview — loaded in iframe inside SupportDocumentEditor
            {
                source: '/api/offers/:id/support/preview',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/offers/:id/pdf/support',
                headers: previewFrameHeaders,
            },
            // Mobile App template preview — loaded in iframe inside MobileAppDocumentEditor
            {
                source: '/api/offers/:id/mobile-app/preview',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/offers/:id/pdf/mobile-app',
                headers: previewFrameHeaders,
            },
            // Mobile Simple template preview — loaded in iframe inside MobileSimpleDocumentEditor
            {
                source: '/api/offers/:id/mobile-simple/preview',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/offers/:id/pdf/mobile-simple',
                headers: previewFrameHeaders,
            },
            // Universal template preview — loaded in iframe inside UniversalDocumentEditor
            {
                source: '/api/offers/:id/universal/preview',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/offers/:id/pdf/universal',
                headers: previewFrameHeaders,
            },
            // Contract short template preview — loaded in iframe inside dashboard + public contract page
            {
                source: '/api/contracts/:id/short/preview',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/contracts/:id/pdf/short',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/public/contracts/:token/short/preview',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/public/contracts/:token/pdf/short',
                headers: previewFrameHeaders,
            },
            // Contract services (Sklep internetowy) template preview — loaded in iframe inside dashboard + public contract page
            {
                source: '/api/contracts/:id/services/preview',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/contracts/:id/pdf/services',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/public/contracts/:token/services/preview',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/public/contracts/:token/pdf/services',
                headers: previewFrameHeaders,
            },
            // Contract dedicated (System dedykowany) template preview — loaded in iframe inside dashboard + public contract page
            {
                source: '/api/contracts/:id/dedicated/preview',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/contracts/:id/pdf/dedicated',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/public/contracts/:token/dedicated/preview',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/public/contracts/:token/pdf/dedicated',
                headers: previewFrameHeaders,
            },
            // Contract SLA (Opieka IT) template preview — loaded in iframe inside dashboard + public contract page
            {
                source: '/api/contracts/:id/sla/preview',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/contracts/:id/pdf/sla',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/public/contracts/:token/sla/preview',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/public/contracts/:token/pdf/sla',
                headers: previewFrameHeaders,
            },
            // Contract mobile (Aplikacja mobilna) template preview — loaded in iframe inside dashboard + public contract page
            {
                source: '/api/contracts/:id/mobile/preview',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/contracts/:id/pdf/mobile',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/public/contracts/:token/mobile/preview',
                headers: previewFrameHeaders,
            },
            {
                source: '/api/public/contracts/:token/pdf/mobile',
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
