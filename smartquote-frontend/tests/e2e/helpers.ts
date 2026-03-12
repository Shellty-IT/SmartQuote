// SmartQuote-AI/tests/e2e/helpers.ts
import { Page } from '@playwright/test';

export async function login(page: Page) {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('input[type="email"]').fill(process.env.TEST_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_PASSWORD!);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
}