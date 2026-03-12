// tests/e2e/critical-path.spec.ts
import { test, expect } from '@playwright/test';
import { login } from './helpers';

const TEST_ID = Date.now();
const OFFER_TITLE = `E2E-Test-${TEST_ID}`;

test.describe('Critical Path', () => {
    test('Login → Create offer → Publish → Client accepts', async ({ page, context }) => {
        await login(page);

        await page.goto('/dashboard/offers/new', { waitUntil: 'networkidle' });

        const firstClient = page.locator('.grid button').first();
        await firstClient.waitFor({ state: 'visible', timeout: 10000 });
        await firstClient.click();
        await page.getByRole('button', { name: /dalej/i }).click();

        const titleInput = page.getByPlaceholder('np. System CRM dla firmy X');
        await titleInput.waitFor({ state: 'visible', timeout: 5000 });
        await titleInput.fill(OFFER_TITLE);
        await page.getByRole('button', { name: /dalej/i }).click();

        const itemNameInput = page.getByPlaceholder('np. Wdrożenie systemu CRM');
        await itemNameInput.waitFor({ state: 'visible', timeout: 5000 });
        await itemNameInput.fill('Usługa testowa E2E');
        await page.getByRole('button', { name: /dalej/i }).click();

        await page.getByRole('button', { name: /utwórz ofertę/i }).click();
        await page.waitForURL(/\/dashboard\/offers\/[^/]+$/, { timeout: 15000 });

        const publishBtn = page.getByRole('button', { name: /publikuj/i }).first();
        await publishBtn.waitFor({ state: 'visible', timeout: 5000 });
        await publishBtn.click();

        const publishDialog = page.locator('[role="dialog"]');
        await publishDialog.waitFor({ state: 'visible', timeout: 5000 });

        const publishContent = publishDialog.locator('div.relative.bg-white');
        await publishContent.waitFor({ state: 'visible', timeout: 3000 });

        const generateBtn = publishContent.getByRole('button', { name: /publikuj|aktywuj|generuj/i });
        await generateBtn.waitFor({ state: 'visible', timeout: 5000 });
        await generateBtn.scrollIntoViewIfNeeded();
        await generateBtn.click({ force: true });

        await page.waitForFunction(
            () => document.body.innerHTML.includes('/offer/view/'),
            { timeout: 15000 }
        );

        const content = await page.content();
        const tokenMatch = content.match(/\/offer\/view\/([a-zA-Z0-9_-]+)/);
        expect(tokenMatch).toBeTruthy();
        const publicPath = `/offer/view/${tokenMatch![1]}`;

        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        const clientPage = await context.newPage();
        await clientPage.goto(publicPath, { waitUntil: 'networkidle' });
        await expect(clientPage.getByText(OFFER_TITLE)).toBeVisible({ timeout: 15000 });

        const acceptBtn = clientPage.getByRole('button', { name: /akceptuj/i });
        await acceptBtn.waitFor({ state: 'visible', timeout: 5000 });
        await acceptBtn.scrollIntoViewIfNeeded();
        await acceptBtn.click();

        const acceptDialog = clientPage.locator('[role="dialog"]');
        await acceptDialog.waitFor({ state: 'visible', timeout: 10000 });

        const acceptContent = acceptDialog.locator('div.relative.bg-white');
        await acceptContent.waitFor({ state: 'visible', timeout: 5000 });

        const checkbox = acceptContent.locator('input[type="checkbox"]');
        await checkbox.scrollIntoViewIfNeeded();
        await checkbox.check({ force: true });

        const confirmBtn = acceptContent.getByRole('button', { name: /zatwierdź/i });
        await confirmBtn.scrollIntoViewIfNeeded();
        await confirmBtn.click({ force: true });

        await expect(
            clientPage.getByRole('heading', { name: /zaakceptowana/i })
        ).toBeVisible({ timeout: 15000 });

        await clientPage.close();
    });
});

test.describe('Error handling', () => {
    test('Shows error for invalid token', async ({ page }) => {
        await page.goto('/offer/view/invalid-token-xyz', { waitUntil: 'networkidle' });
        await expect(
            page.getByRole('heading', { name: /nie znalezion/i })
        ).toBeVisible({ timeout: 15000 });
    });
});