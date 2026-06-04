// SmartQuote-AI/next.config.ts
import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

const connectSrc = isDev
    ? "connect-src 'self' https: http://localhost:8080 ws://localhost:3000"
    : "connect-src 'self' https:";

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
    {
        key: 'Content-Security-Policy',
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            connectSrc,
            "frame-ancestors 'none'",
        ].join('; '),
    },
];

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: securityHeaders,
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
