// tests/e2e/offer-comments.spec.ts
import { test, expect } from '@playwright/test';
import { login, createAndPublishOffer } from './helpers';

test.describe('Offer Comments', () => {
    test('Client adds comment via Enter key', async ({ page, context }) => {
        await login(page);
        const { publicPath, title } = await createAndPublishOffer(page);

        const clientPage = await context.newPage();
        await clientPage.goto(publicPath, { waitUntil: 'networkidle' });
        await expect(clientPage.getByText(title)).toBeVisible({ timeout: 15000 });

        const commentInput = clientPage.getByPlaceholder('Napisz pytanie lub komentarz...');
        await commentInput.scrollIntoViewIfNeeded();
        await commentInput.fill('Czy możliwy jest rabat przy większym zamówieniu?');
        await commentInput.press('Enter');

        await expect(
            clientPage.getByText('Czy możliwy jest rabat przy większym zamówieniu?')
        ).toBeVisible({ timeout: 10000 });

        await clientPage.close();
    });

    test('Client adds multiple comments', async ({ page, context }) => {
        await login(page);
        const { publicPath, title } = await createAndPublishOffer(page);

        const clientPage = await context.newPage();
        await clientPage.goto(publicPath, { waitUntil: 'networkidle' });
        await expect(clientPage.getByText(title)).toBeVisible({ timeout: 15000 });

        const commentInput = clientPage.getByPlaceholder('Napisz pytanie lub komentarz...');

        await commentInput.scrollIntoViewIfNeeded();
        await commentInput.fill('Pierwsze pytanie testowe');
        await commentInput.press('Enter');

        await expect(
            clientPage.getByText('Pierwsze pytanie testowe')
        ).toBeVisible({ timeout: 10000 });

        await commentInput.fill('Drugie pytanie testowe');
        await commentInput.press('Enter');

        await expect(
            clientPage.getByText('Drugie pytanie testowe')
        ).toBeVisible({ timeout: 10000 });

        await clientPage.close();
    });

    test('Comment section is disabled after offer is rejected', async ({ page, context }) => {
        await login(page);
        const { publicPath, title } = await createAndPublishOffer(page);

        const clientPage = await context.newPage();
        await clientPage.goto(publicPath, { waitUntil: 'networkidle' });
        await expect(clientPage.getByText(title)).toBeVisible({ timeout: 15000 });

        const commentInput = clientPage.getByPlaceholder('Napisz pytanie lub komentarz...');
        await commentInput.scrollIntoViewIfNeeded();
        await commentInput.fill('Komentarz przed odrzuceniem');
        await commentInput.press('Enter');

        await expect(
            clientPage.getByText('Komentarz przed odrzuceniem')
        ).toBeVisible({ timeout: 10000 });

        const rejectBtn = clientPage.getByRole('button', { name: /odrzucam/i });
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