// tests/e2e/critical-path.spec.ts
import { test, expect } from '@playwright/test';
import { login, createAndPublishOffer } from './helpers';

test.describe('Critical Path', () => {
    test('Login → Create offer → Publish → Client accepts', async ({ page, context }) => {
        await login(page);
        const { publicPath, title } = await createAndPublishOffer(page);

        const clientPage = await context.newPage();
        await clientPage.goto(publicPath, { waitUntil: 'networkidle' });
        await expect(clientPage.getByText(title)).toBeVisible({ timeout: 15000 });

        const acceptBtn = clientPage.getByRole('button', { name: /akceptuję ofertę/i });
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