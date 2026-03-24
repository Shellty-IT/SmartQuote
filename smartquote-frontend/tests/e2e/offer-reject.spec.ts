// tests/e2e/offer-reject.spec.ts
import { test, expect } from '@playwright/test';
import { login, createAndPublishOffer } from './helpers';

test.describe('Offer Rejection', () => {
    test('Client rejects offer with reason', async ({ page, context }) => {
        await login(page);
        const { publicPath, title } = await createAndPublishOffer(page);

        const clientPage = await context.newPage();
        await clientPage.goto(publicPath, { waitUntil: 'networkidle' });
        await expect(clientPage.getByText(title)).toBeVisible({ timeout: 15000 });

        const rejectBtn = clientPage.getByRole('button', { name: /odrzucam/i });
        await rejectBtn.waitFor({ state: 'visible', timeout: 5000 });
        await rejectBtn.scrollIntoViewIfNeeded();
        await rejectBtn.click();

        const rejectDialog = clientPage.locator('[role="dialog"]');
        await rejectDialog.waitFor({ state: 'visible', timeout: 5000 });

        const dialogContent = rejectDialog.locator('div.relative.bg-white');
        await dialogContent.waitFor({ state: 'visible', timeout: 3000 });

        const reasonTextarea = dialogContent.locator('textarea');
        await reasonTextarea.fill('Za wysoka cena, potrzebuję rabatu');

        const confirmBtn = dialogContent.getByRole('button', { name: /odrzuć ofertę/i });
        await confirmBtn.scrollIntoViewIfNeeded();
        await confirmBtn.click({ force: true });

        await expect(
            clientPage.getByRole('heading', { name: /odrzucona/i })
        ).toBeVisible({ timeout: 15000 });

        await expect(
            clientPage.getByText(/została odrzucona/i)
        ).toBeVisible({ timeout: 5000 });

        await clientPage.close();
    });

    test('Client rejects offer without reason', async ({ page, context }) => {
        await login(page);
        const { publicPath, title } = await createAndPublishOffer(page);

        const clientPage = await context.newPage();
        await clientPage.goto(publicPath, { waitUntil: 'networkidle' });
        await expect(clientPage.getByText(title)).toBeVisible({ timeout: 15000 });

        const rejectBtn = clientPage.getByRole('button', { name: /odrzucam/i });
        await rejectBtn.waitFor({ state: 'visible', timeout: 5000 });
        await rejectBtn.scrollIntoViewIfNeeded();
        await rejectBtn.click();

        const rejectDialog = clientPage.locator('[role="dialog"]');
        await rejectDialog.waitFor({ state: 'visible', timeout: 5000 });

        const dialogContent = rejectDialog.locator('div.relative.bg-white');
        await dialogContent.waitFor({ state: 'visible', timeout: 3000 });

        const confirmBtn = dialogContent.getByRole('button', { name: /odrzuć ofertę/i });
        await confirmBtn.scrollIntoViewIfNeeded();
        await confirmBtn.click({ force: true });

        await expect(
            clientPage.getByRole('heading', { name: /odrzucona/i })
        ).toBeVisible({ timeout: 15000 });

        await clientPage.close();
    });
});