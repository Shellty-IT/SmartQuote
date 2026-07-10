// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';
import * as url from 'url';
import * as path from 'path';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (key && !(key in process.env)) {
            process.env[key] = value;
        }
    }
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const baseOrigin = new URL(baseURL).origin;

// Vercel preview deployments sit behind Deployment Protection (Vercel
// Authentication) — this header is the documented way for automation to get
// past that wall without disabling protection for real visitors.
// https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection#protection-bypass-for-automation
const vercelBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const extraHTTPHeaders = vercelBypassSecret
    ? {
        'x-vercel-protection-bypass': vercelBypassSecret,
        'x-vercel-set-bypass-cookie': 'true',
    }
    : undefined;

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [['html', { open: 'never' }], ['list']],
    timeout: 60_000,
    expect: {
        timeout: 15_000,
    },
    use: {
        baseURL,
        extraHTTPHeaders,
        storageState: {
            cookies: [],
            origins: [
                {
                    origin: baseOrigin,
                    localStorage: [
                        { name: 'smartquote-lang', value: 'pl' },
                    ],
                },
            ],
        },
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
        locale: 'pl-PL',
        timezoneId: 'Europe/Warsaw',
        actionTimeout: 15_000,
        navigationTimeout: 30_000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'mobile-chrome',
            use: { ...devices['Pixel 5'] },
        },
        {
            name: 'mobile-safari',
            use: { ...devices['iPhone 13'] },
        },
    ],
});
