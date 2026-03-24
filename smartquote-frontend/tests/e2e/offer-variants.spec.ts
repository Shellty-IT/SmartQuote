// tests/e2e/offer-variants.spec.ts
import { test, expect } from '@playwright/test';
import { login, createAndPublishOffer } from './helpers';

test.describe('Offer Variants', () => {
    test('Create offer with variants → Client switches and accepts specific variant', async ({
                                                                                                 page,
                                                                                                 context,
                                                                                             }) => {
        await login(page);

        const { publicPath, title } = await createAndPublishOffer(page, {
            title: `Warianty-E2E-${Date.now()}`,
            itemName: 'Wdrożenie Basic',
            variants: [
                { name: 'Basic', itemName: 'Wdrożenie Basic', price: 5000 },
                { name: 'Premium', itemName: 'Wdrożenie Premium', price: 15000 },
            ],
        });

        const clientPage = await context.newPage();
        await clientPage.goto(publicPath, { waitUntil: 'networkidle' });
        await expect(clientPage.getByText(title)).toBeVisible({ timeout: 15000 });

        await expect(clientPage.getByText('Wybierz wariant')).toBeVisible({ timeout: 5000 });

        const basicBtn = clientPage.getByRole('button', { name: 'Basic' });
        const premiumBtn = clientPage.getByRole('button', { name: 'Premium' });

        await expect(basicBtn).toBeVisible({ timeout: 5000 });
        await expect(premiumBtn).toBeVisible({ timeout: 5000 });

        await premiumBtn.click();
        await clientPage.waitForTimeout(500);

        await expect(clientPage.getByText('Wdrożenie Premium')).toBeVisible({ timeout: 5000 });

        await basicBtn.click();
        await clientPage.waitForTimeout(500);

        await expect(clientPage.getByText('Wdrożenie Basic')).toBeVisible({ timeout: 5000 });

        const acceptBtn = clientPage.getByRole('button', { name: /akceptuję ofertę/i });
        await acceptBtn.scrollIntoViewIfNeeded();
        await acceptBtn.click();

        const acceptDialog = clientPage.locator('[role="dialog"]');
        await acceptDialog.waitFor({ state: 'visible', timeout: 5000 });

        const dialogContent = acceptDialog.locator('div.relative.bg-white');
        await dialogContent.waitFor({ state: 'visible', timeout: 3000 });

        const checkbox = dialogContent.locator('input[type="checkbox"]');
        await checkbox.scrollIntoViewIfNeeded();
        await checkbox.check({ force: true });

        const confirmBtn = dialogContent.getByRole('button', { name: /zatwierdź/i });
        await confirmBtn.scrollIntoViewIfNeeded();
        await confirmBtn.click({ force: true });

        await expect(
            clientPage.getByRole('heading', { name: /zaakceptowana/i })
        ).toBeVisible({ timeout: 15000 });

        await expect(clientPage.getByText('Basic')).toBeVisible({ timeout: 5000 });

        await clientPage.close();
    });

    test('Variant switcher shows correct item counts', async ({ page, context }) => {
        await login(page);

        const { publicPath } = await createAndPublishOffer(page, {
            title: `Warianty-Count-${Date.now()}`,
            itemName: 'Serwis Standard',
            variants: [
                { name: 'Standard', itemName: 'Serwis Standard', price: 3000 },
                { name: 'Enterprise', itemName: 'Serwis Enterprise', price: 20000 },
            ],
        });

        const clientPage = await context.newPage();
        await clientPage.goto(publicPath, { waitUntil: 'networkidle' });

        await expect(clientPage.getByText(/2 wariant/i)).toBeVisible({ timeout: 10000 });

        const standardBtn = clientPage.getByRole('button', { name: 'Standard' });
        await standardBtn.click();
        await clientPage.waitForTimeout(300);

        await expect(clientPage.getByText('Serwis Standard')).toBeVisible({ timeout: 5000 });

        const enterpriseBtn = clientPage.getByRole('button', { name: 'Enterprise' });
        await enterpriseBtn.click();
        await clientPage.waitForTimeout(300);

        await expect(clientPage.getByText('Serwis Enterprise')).toBeVisible({ timeout: 5000 });

        await clientPage.close();
    });

    test('Accepted variant is displayed on confirmation page', async ({ page, context }) => {
        await login(page);

        const { publicPath } = await createAndPublishOffer(page, {
            title: `Wariant-Confirm-${Date.now()}`,
            itemName: 'Plan Starter',
            variants: [
                { name: 'Starter', itemName: 'Plan Starter', price: 1000 },
                { name: 'Pro', itemName: 'Plan Pro', price: 5000 },
            ],
        });

        const clientPage = await context.newPage();
        await clientPage.goto(publicPath, { waitUntil: 'networkidle' });

        const proBtn = clientPage.getByRole('button', { name: 'Pro' });
        await proBtn.waitFor({ state: 'visible', timeout: 10000 });
        await proBtn.click();
        await clientPage.waitForTimeout(500);

        const acceptBtn = clientPage.getByRole('button', { name: /akceptuję ofertę/i });
        await acceptBtn.scrollIntoViewIfNeeded();
        await acceptBtn.click();

        const acceptDialog = clientPage.locator('[role="dialog"]');
        await acceptDialog.waitFor({ state: 'visible', timeout: 5000 });

        const dialogContent = acceptDialog.locator('div.relative.bg-white');
        await dialogContent.waitFor({ state: 'visible', timeout: 3000 });

        const checkbox = dialogContent.locator('input[type="checkbox"]');
        await checkbox.scrollIntoViewIfNeeded();
        await checkbox.check({ force: true });

        const confirmBtn = dialogContent.getByRole('button', { name: /zatwierdź/i });
        await confirmBtn.scrollIntoViewIfNeeded();
        await confirmBtn.click({ force: true });

        await expect(
            clientPage.getByRole('heading', { name: /zaakceptowana/i })
        ).toBeVisible({ timeout: 15000 });

        await expect(clientPage.getByText('Pro')).toBeVisible({ timeout: 5000 });

        await clientPage.close();
    });
});