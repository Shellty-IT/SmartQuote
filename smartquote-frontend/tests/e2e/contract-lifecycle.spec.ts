// tests/e2e/contract-lifecycle.spec.ts
import { test, expect } from '@playwright/test';
import { login, createContract, changeContractStatus, publishContract, waitForContractPage } from './helpers';

test.describe('Contract Lifecycle', () => {
    test('Create contract → Send to signature → Mark as signed → Complete', async ({ page }) => {
        test.setTimeout(120000);

        await login(page);
        const { contractId, title } = await createContract(page);

        await page.goto(`/dashboard/contracts/${contractId}`, { waitUntil: 'networkidle' });
        await waitForContractPage(page);
        await expect(page.getByText(title)).toBeVisible({ timeout: 10000 });

        await changeContractStatus(page, contractId, /wyślij do podpisu/i);
        await page.goto(`/dashboard/contracts/${contractId}`, { waitUntil: 'networkidle' });
        await waitForContractPage(page);
        await expect(page.getByText('Do podpisu').first()).toBeVisible({ timeout: 10000 });

        await changeContractStatus(page, contractId, /oznacz jako podpisaną/i);
        await page.goto(`/dashboard/contracts/${contractId}`, { waitUntil: 'networkidle' });
        await waitForContractPage(page);
        await expect(page.getByText('Aktywna').first()).toBeVisible({ timeout: 10000 });

        await changeContractStatus(page, contractId, /zakończ umowę/i);
        await page.goto(`/dashboard/contracts/${contractId}`, { waitUntil: 'networkidle' });
        await waitForContractPage(page);
        await expect(page.getByText('Zakończona').first()).toBeVisible({ timeout: 10000 });
    });

    test('Create contract → Send to signature → Terminate', async ({ page }) => {
        await login(page);
        const { contractId } = await createContract(page);

        await changeContractStatus(page, contractId, /wyślij do podpisu/i);

        await page.goto(`/dashboard/contracts/${contractId}`, { waitUntil: 'networkidle' });
        await waitForContractPage(page);
        await expect(page.getByText('Do podpisu').first()).toBeVisible({ timeout: 10000 });

        await changeContractStatus(page, contractId, /anuluj umowę/i);

        await page.goto(`/dashboard/contracts/${contractId}`, { waitUntil: 'networkidle' });
        await waitForContractPage(page);
        await expect(page.getByText(/rozwiązana/i).first()).toBeVisible({ timeout: 10000 });
    });

    test('Publish contract and verify public link is active', async ({ page }) => {
        await login(page);
        const { contractId } = await createContract(page);

        const publicPath = await publishContract(page, contractId);
        expect(publicPath).toMatch(/^\/contract\/view\//);

        await expect(page.getByText(/link aktywny/i)).toBeVisible({ timeout: 5000 });
    });

    test('Public contract page shows error for invalid token', async ({ page }) => {
        await page.goto('/contract/view/invalid-token-xyz-123', { waitUntil: 'networkidle' });
        await expect(
            page.getByRole('heading', { name: /nie znaleziona/i })
        ).toBeVisible({ timeout: 15000 });
    });
});