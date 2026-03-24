// tests/e2e/offer-audit-trail.spec.ts
import { test, expect } from '@playwright/test';
import { login, createAndPublishOffer } from './helpers';

test.describe('Offer Audit Trail', () => {
    test('Accept offer with audit trail — requires name and email', async ({ page, context }) => {
        await login(page);

        const { publicPath, title } = await createAndPublishOffer(page, {
            title: `Audit-E2E-${Date.now()}`,
            requireAuditTrail: true,
        });

        const clientPage = await context.newPage();
        await clientPage.goto(publicPath, { waitUntil: 'networkidle' });
        await expect(clientPage.getByText(title)).toBeVisible({ timeout: 15000 });

        await expect(
            clientPage.getByText(/oferta z formalnym potwierdzeniem/i)
        ).toBeVisible({ timeout: 5000 });

        const acceptBtn = clientPage.getByRole('button', { name: /akceptuję ofertę/i });
        await acceptBtn.scrollIntoViewIfNeeded();
        await acceptBtn.click();

        const acceptDialog = clientPage.locator('[role="dialog"]');
        await acceptDialog.waitFor({ state: 'visible', timeout: 5000 });

        const dialogContent = acceptDialog.locator('div.relative.bg-white');
        await dialogContent.waitFor({ state: 'visible', timeout: 3000 });

        await expect(
            dialogContent.getByText(/formalna akceptacja/i)
        ).toBeVisible({ timeout: 3000 });

        const nameInput = dialogContent.locator('input[type="text"]').first();
        await nameInput.scrollIntoViewIfNeeded();
        await nameInput.fill('Jan Kowalski Audit');

        const emailInput = dialogContent.locator('input[type="email"]').first();
        await emailInput.fill('jan.audit@test.pl');

        const checkbox = dialogContent.locator('input[type="checkbox"]');
        await checkbox.scrollIntoViewIfNeeded();
        await checkbox.check({ force: true });

        const confirmBtn = dialogContent.getByRole('button', { name: /zatwierdź/i });
        await confirmBtn.scrollIntoViewIfNeeded();
        await confirmBtn.click({ force: true });

        await expect(
            clientPage.getByRole('heading', { name: /zaakceptowana/i })
        ).toBeVisible({ timeout: 15000 });

        await expect(
            clientPage.getByText(/certyfikat akceptacji/i)
        ).toBeVisible({ timeout: 10000 });

        await expect(
            clientPage.getByText(/sha-256/i)
        ).toBeVisible({ timeout: 5000 });

        await clientPage.close();
    });

    test('Audit trail shows on dashboard after acceptance', async ({ page, context }) => {
        await login(page);

        const { publicPath, offerId } = await createAndPublishOffer(page, {
            title: `Audit-Dashboard-${Date.now()}`,
            requireAuditTrail: true,
        });

        const clientPage = await context.newPage();
        await clientPage.goto(publicPath, { waitUntil: 'networkidle' });

        const acceptBtn = clientPage.getByRole('button', { name: /akceptuję ofertę/i });
        await acceptBtn.scrollIntoViewIfNeeded();
        await acceptBtn.click();

        const acceptDialog = clientPage.locator('[role="dialog"]');
        await acceptDialog.waitFor({ state: 'visible', timeout: 5000 });

        const dialogContent = acceptDialog.locator('div.relative.bg-white');
        await dialogContent.waitFor({ state: 'visible', timeout: 3000 });

        const nameInput = dialogContent.locator('input[type="text"]').first();
        await nameInput.scrollIntoViewIfNeeded();
        await nameInput.fill('Maria Testowa');

        const emailInput = dialogContent.locator('input[type="email"]').first();
        await emailInput.fill('maria@test.pl');

        const checkbox = dialogContent.locator('input[type="checkbox"]');
        await checkbox.scrollIntoViewIfNeeded();
        await checkbox.check({ force: true });

        const confirmBtn = dialogContent.getByRole('button', { name: /zatwierdź/i });
        await confirmBtn.scrollIntoViewIfNeeded();
        await confirmBtn.click({ force: true });

        await expect(
            clientPage.getByRole('heading', { name: /zaakceptowana/i })
        ).toBeVisible({ timeout: 15000 });
        await clientPage.close();

        await page.waitForTimeout(3000);

        for (let attempt = 0; attempt < 3; attempt++) {
            await page.goto(`/dashboard/offers/${offerId}`, { waitUntil: 'networkidle' });
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(1000);

            const found = await page.getByText('Maria Testowa').isVisible().catch(() => false);
            if (found) break;

            if (attempt < 2) {
                await page.waitForTimeout(3000);
            }
        }

        await expect(page.getByText('Maria Testowa')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('maria@test.pl')).toBeVisible({ timeout: 5000 });
    });

    test('Offer without audit trail accepts normally (no extra fields)', async ({ page, context }) => {
        await login(page);

        const { publicPath, title } = await createAndPublishOffer(page, {
            title: `No-Audit-${Date.now()}`,
            requireAuditTrail: false,
        });

        const clientPage = await context.newPage();
        await clientPage.goto(publicPath, { waitUntil: 'networkidle' });
        await expect(clientPage.getByText(title)).toBeVisible({ timeout: 15000 });

        await expect(
            clientPage.getByText(/oferta z formalnym potwierdzeniem/i)
        ).not.toBeVisible({ timeout: 3000 });

        const acceptBtn = clientPage.getByRole('button', { name: /akceptuję ofertę/i });
        await acceptBtn.scrollIntoViewIfNeeded();
        await acceptBtn.click();

        const acceptDialog = clientPage.locator('[role="dialog"]');
        await acceptDialog.waitFor({ state: 'visible', timeout: 5000 });

        const dialogContent = acceptDialog.locator('div.relative.bg-white');
        await dialogContent.waitFor({ state: 'visible', timeout: 3000 });

        await expect(
            dialogContent.getByText(/formalna akceptacja/i)
        ).not.toBeVisible({ timeout: 2000 });

        const checkbox = dialogContent.locator('input[type="checkbox"]');
        await checkbox.scrollIntoViewIfNeeded();
        await checkbox.check({ force: true });

        const confirmBtn = dialogContent.getByRole('button', { name: /zatwierdź/i });
        await confirmBtn.scrollIntoViewIfNeeded();
        await confirmBtn.click({ force: true });

        await expect(
            clientPage.getByRole('heading', { name: /zaakceptowana/i })
        ).toBeVisible({ timeout: 15000 });

        await expect(
            clientPage.getByText(/certyfikat akceptacji/i)
        ).not.toBeVisible({ timeout: 3000 });

        await clientPage.close();
    });
});