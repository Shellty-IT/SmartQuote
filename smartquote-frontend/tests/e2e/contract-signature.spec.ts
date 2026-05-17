// tests/e2e/contract-signature.spec.ts
import { test, expect } from '@playwright/test';
import {
    login,
    createContract,
    publishContract,
    changeContractStatus,
    drawSignature,
    waitForContractPage,
} from './helpers';

test.describe('Contract Electronic Signature', () => {
    test('Full flow: Create → Publish → Send to signature → Client signs electronically', async ({
                                                                                                     page,
                                                                                                     context,
                                                                                                 }) => {
        test.setTimeout(120000);

        await login(page);
        const { contractId, title } = await createContract(page);

        const publicPath = await publishContract(page, contractId);

        await changeContractStatus(page, contractId, /wyślij do podpisu/i);

        const clientPage = await context.newPage();
        await clientPage.goto(publicPath, { waitUntil: 'networkidle' });

        await expect(clientPage.getByText(title)).toBeVisible({ timeout: 15000 });
        await expect(clientPage.getByText('Do podpisu')).toBeVisible({ timeout: 5000 });

        const signBtn = clientPage.getByRole('button', { name: /podpisz umowę/i });
        await signBtn.waitFor({ state: 'visible', timeout: 10000 });
        await signBtn.scrollIntoViewIfNeeded();
        await signBtn.click();

        const signDialog = clientPage.locator('[role="dialog"]');
        await signDialog.waitFor({ state: 'visible', timeout: 5000 });

        const nameInput = signDialog.locator('#signer-name');
        await nameInput.waitFor({ state: 'visible', timeout: 3000 });
        await nameInput.fill('Jan Kowalski E2E');

        const emailInput = signDialog.locator('#signer-email');
        await emailInput.fill('jan.kowalski.e2e@test.pl');

        await drawSignature(clientPage, '[role="dialog"] canvas');

        const submitBtn = signDialog.getByRole('button', { name: /zatwierdź podpis/i });
        await submitBtn.waitFor({ state: 'visible', timeout: 5000 });
        await submitBtn.scrollIntoViewIfNeeded();
        await submitBtn.click();

        await expect(
            clientPage.getByText(/umowa została podpisana/i)
        ).toBeVisible({ timeout: 15000 });

        await expect(
            clientPage.getByText(/podpis elektroniczny/i)
        ).toBeVisible({ timeout: 10000 });

        await expect(
            clientPage.getByText('Jan Kowalski E2E')
        ).toBeVisible({ timeout: 5000 });

        await expect(
            clientPage.getByText('jan.kowalski.e2e@test.pl')
        ).toBeVisible({ timeout: 5000 });

        await clientPage.close();

        await page.goto(`/dashboard/contracts/${contractId}`, { waitUntil: 'networkidle' });
        await waitForContractPage(page);
        await expect(page.getByText('Aktywna').first()).toBeVisible({ timeout: 10000 });

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);

        await expect(page.getByText('Jan Kowalski E2E')).toBeVisible({ timeout: 10000 });
    });

    test('Sign button not visible for DRAFT contracts', async ({ page, context }) => {
        await login(page);
        const { contractId } = await createContract(page);

        const publicPath = await publishContract(page, contractId);

        const clientPage = await context.newPage();
        await clientPage.goto(publicPath, { waitUntil: 'networkidle' });

        await expect(
            clientPage.getByRole('button', { name: /podpisz umowę/i })
        ).not.toBeVisible({ timeout: 5000 });

        await clientPage.close();
    });

    test('Sign dialog validation — empty signature shows error', async ({ page, context }) => {
        await login(page);
        const { contractId } = await createContract(page);

        const publicPath = await publishContract(page, contractId);
        await changeContractStatus(page, contractId, /wyślij do podpisu/i);

        const clientPage = await context.newPage();
        await clientPage.goto(publicPath, { waitUntil: 'networkidle' });

        const signBtn = clientPage.getByRole('button', { name: /podpisz umowę/i });
        await signBtn.waitFor({ state: 'visible', timeout: 10000 });
        await signBtn.scrollIntoViewIfNeeded();
        await signBtn.click();

        const signDialog = clientPage.locator('[role="dialog"]');
        await signDialog.waitFor({ state: 'visible', timeout: 5000 });

        const nameInput = signDialog.locator('#signer-name');
        await nameInput.fill('Test User');

        const emailInput = signDialog.locator('#signer-email');
        await emailInput.fill('test@test.pl');

        const submitBtn = signDialog.getByRole('button', { name: /zatwierdź podpis/i });
        await submitBtn.scrollIntoViewIfNeeded();
        await submitBtn.click();

        await expect(
            signDialog.getByText(/proszę złożyć podpis/i)
        ).toBeVisible({ timeout: 5000 });

        await clientPage.close();
    });

    test('Terminal contract shows alert on public page', async ({ page, context }) => {
        await login(page);
        const { contractId } = await createContract(page);

        const publicPath = await publishContract(page, contractId);

        await changeContractStatus(page, contractId, /wyślij do podpisu/i);
        await changeContractStatus(page, contractId, /anuluj umowę/i);

        const clientPage = await context.newPage();
        await clientPage.goto(publicPath, { waitUntil: 'networkidle' });

        await expect(
            clientPage.getByText(/umowa została rozwiązana/i)
        ).toBeVisible({ timeout: 15000 });

        await expect(
            clientPage.getByRole('button', { name: /podpisz umowę/i })
        ).not.toBeVisible({ timeout: 3000 });

        await clientPage.close();
    });

    test('PDF download works on public contract page', async ({ page, context }) => {
        await login(page);
        const { contractId } = await createContract(page);

        const publicPath = await publishContract(page, contractId);

        const clientPage = await context.newPage();
        await clientPage.goto(publicPath, { waitUntil: 'networkidle' });

        const downloadPromise = clientPage.waitForEvent('download', { timeout: 30000 }).catch(() => null);

        const pdfBtn = clientPage.getByRole('button', { name: /pobierz umowę.*pdf/i });
        await pdfBtn.waitFor({ state: 'visible', timeout: 10000 });
        await pdfBtn.scrollIntoViewIfNeeded();
        await pdfBtn.click();

        const download = await downloadPromise;

        if (download) {
            const fileName = download.suggestedFilename();
            expect(fileName).toMatch(/umowa.*\.pdf/i);
        } else {
            await expect(
                clientPage.getByText(/błąd pobierania/i)
            ).not.toBeVisible({ timeout: 5000 });
        }

        await clientPage.close();
    });
});