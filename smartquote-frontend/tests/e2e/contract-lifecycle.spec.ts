// tests/e2e/contract-lifecycle.spec.ts
import { test, expect } from '@playwright/test';
import { login, changeContractStatus, publishContract, waitForContractPage } from './helpers';
import { deleteContract, ensureClientId, getAccessToken, seedContract } from './template-helpers';

async function seedClassicContract(page: Parameters<typeof getAccessToken>[0]) {
    const token = await getAccessToken(page);
    const clientId = await ensureClientId(token, page.request);
    const title = `Umowa-E2E-${Date.now()}`;
    const contractId = await seedContract(token, page.request, {
        templateType: 'classic',
        clientId,
        title,
    });
    return { contractId, title, token };
}

test.describe('Contract Lifecycle', () => {
    const contractsToCleanup: Array<{ id: string; token: string }> = [];

    test.afterEach(async ({ page }) => {
        while (contractsToCleanup.length > 0) {
            const contract = contractsToCleanup.pop()!;
            await deleteContract(contract.token, page.request, contract.id);
        }
    });

    test('Create contract → Send to signature → Mark as signed → Complete', async ({ page }) => {
        test.setTimeout(120000);

        await login(page);
        const { contractId, title, token } = await seedClassicContract(page);
        contractsToCleanup.push({ id: contractId, token });

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
        const { contractId, token } = await seedClassicContract(page);
        contractsToCleanup.push({ id: contractId, token });

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
        const { contractId, token } = await seedClassicContract(page);
        contractsToCleanup.push({ id: contractId, token });

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
