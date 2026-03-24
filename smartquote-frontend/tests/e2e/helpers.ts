// tests/e2e/helpers.ts
import { Page, expect } from '@playwright/test';

export async function login(page: Page) {
    await page.goto('/', { timeout: 120000 });
    await page.waitForLoadState('domcontentloaded');

    if (page.url().includes('/dashboard')) {
        return;
    }

    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 120000 });

    const serverReadyText = page.getByText(/serwer gotowy/i);
    try {
        await serverReadyText.waitFor({ state: 'visible', timeout: 90000 });
    } catch {
        // server might already be ready, continue
    }

    await page.waitForTimeout(1000);

    for (let attempt = 1; attempt <= 3; attempt++) {
        const passwordInput = page.locator('input[type="password"]');

        await emailInput.click();
        await emailInput.clear();
        await emailInput.type(process.env.TEST_EMAIL!, { delay: 30 });

        await passwordInput.click();
        await passwordInput.clear();
        await passwordInput.type(process.env.TEST_PASSWORD!, { delay: 30 });

        await page.waitForTimeout(300);

        const emailValue = await emailInput.inputValue();
        const passwordValue = await passwordInput.inputValue();

        if (!emailValue || emailValue.length < 3 || !passwordValue || passwordValue.length < 3) {
            if (attempt < 3) {
                await page.waitForTimeout(2000);
                continue;
            }
            throw new Error(`Login fields empty after ${attempt} attempts. Email: "${emailValue}", Password length: ${passwordValue?.length}`);
        }

        await page.locator('button[type="submit"]').click();

        try {
            await page.waitForURL(/\/dashboard/, { timeout: 30000 });
            await page.waitForLoadState('domcontentloaded');
            return;
        } catch {
            const currentUrl = page.url();
            if (currentUrl.includes('/dashboard')) {
                return;
            }
            if (attempt < 3) {
                await page.waitForTimeout(2000);
                continue;
            }
            throw new Error(`Login redirect failed after ${attempt} attempts. URL: ${currentUrl}`);
        }
    }
}

export interface CreateOfferResult {
    publicPath: string;
    title: string;
    offerId: string;
}

export async function createAndPublishOffer(
    page: Page,
    options?: {
        title?: string;
        itemName?: string;
        variants?: { name: string; itemName: string; price: number }[];
        requireAuditTrail?: boolean;
    }
): Promise<CreateOfferResult> {
    const testId = Date.now();
    const title = options?.title || `E2E-Test-${testId}`;
    const itemName = options?.itemName || 'Usługa testowa E2E';

    await page.goto('/dashboard/offers/new', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    const firstClient = page.locator('.grid button').first();
    await firstClient.waitFor({ state: 'visible', timeout: 15000 });
    await firstClient.click();
    await page.getByRole('button', { name: /dalej/i }).click();

    const titleInput = page.getByPlaceholder('np. System CRM dla firmy X');
    await titleInput.waitFor({ state: 'visible', timeout: 5000 });
    await titleInput.fill(title);

    if (options?.requireAuditTrail) {
        const auditLabel = page.locator('label').filter({ hasText: 'Formalne potwierdzenie akceptacji' });
        await auditLabel.scrollIntoViewIfNeeded();
        await auditLabel.click();
    }

    await page.getByRole('button', { name: /dalej/i }).click();

    const itemNameInput = page.getByPlaceholder('np. Wdrożenie systemu CRM');
    await itemNameInput.waitFor({ state: 'visible', timeout: 5000 });
    await itemNameInput.fill(itemName);

    if (options?.variants && options.variants.length > 0) {
        const firstVariantInput = page.getByPlaceholder('np. Basic, Standard, Premium').first();
        await firstVariantInput.scrollIntoViewIfNeeded();
        await firstVariantInput.fill(options.variants[0].name);

        const numberInputs = page.locator('input[type="number"]');
        const firstPriceInput = numberInputs.nth(1);
        await firstPriceInput.scrollIntoViewIfNeeded();
        await firstPriceInput.fill(String(options.variants[0].price));

        for (let i = 1; i < options.variants.length; i++) {
            const variant = options.variants[i];

            const addBtn = page.getByRole('button', { name: /dodaj pozycję/i });
            await addBtn.scrollIntoViewIfNeeded();
            await addBtn.click();
            await page.waitForTimeout(500);

            const allNameInputs = page.getByPlaceholder('np. Wdrożenie systemu CRM');
            const newNameInput = allNameInputs.nth(i);
            await newNameInput.waitFor({ state: 'visible', timeout: 5000 });
            await newNameInput.fill(variant.itemName);

            const allVariantInputs = page.getByPlaceholder('np. Basic, Standard, Premium');
            const newVariantInput = allVariantInputs.nth(i);
            await newVariantInput.scrollIntoViewIfNeeded();
            await newVariantInput.fill(variant.name);

            const allNumberInputs = page.locator('input[type="number"]');
            const newPriceInput = allNumberInputs.nth(i * 3 + 1);
            await newPriceInput.scrollIntoViewIfNeeded();
            await newPriceInput.fill(String(variant.price));
        }
    }

    await page.getByRole('button', { name: /dalej/i }).click();

    await page.getByRole('button', { name: /utwórz ofertę/i }).click();

    await page.waitForURL(
        (url) => /\/dashboard\/offers\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith('/new'),
        { timeout: 30000 }
    );
    await page.waitForLoadState('networkidle');

    const offerUrl = page.url();
    const offerIdMatch = offerUrl.match(/\/dashboard\/offers\/([^/]+)$/);
    expect(offerIdMatch).toBeTruthy();
    const offerId = offerIdMatch![1];

    const publishBtn = page.getByRole('button', { name: /publikuj/i }).first();
    await publishBtn.waitFor({ state: 'visible', timeout: 10000 });
    await publishBtn.click();

    const publishDialog = page.locator('[role="dialog"]');
    await publishDialog.waitFor({ state: 'visible', timeout: 5000 });

    const generateBtn = publishDialog.getByRole('button', { name: /generuj link|publikuj|aktywuj/i });
    await generateBtn.waitFor({ state: 'visible', timeout: 5000 });
    await generateBtn.scrollIntoViewIfNeeded();
    await generateBtn.click({ force: true });

    await page.waitForFunction(
        () => document.body.innerHTML.includes('/offer/view/'),
        { timeout: 30000 }
    );

    const content = await page.content();
    const tokenMatch = content.match(/\/offer\/view\/([a-zA-Z0-9_-]+)/);
    expect(tokenMatch).toBeTruthy();

    const publicPath = `/offer/view/${tokenMatch![1]}`;

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    return { publicPath, title, offerId };
}

export interface CreateContractResult {
    contractId: string;
    title: string;
}

export async function waitForContractPage(page: Page): Promise<void> {
    await page.waitForFunction(
        () => {
            const text = document.body.innerText || '';
            return text.includes('Status umowy') ||
                text.includes('Szczegóły umowy') ||
                text.includes('Pozycje umowy') ||
                text.includes('Dostępne akcje') ||
                text.includes('Dystrybucja') ||
                text.includes('Umowa nie znaleziona');
        },
        { timeout: 30000 }
    );
    await page.waitForTimeout(1000);
}

export async function waitForOfferPage(page: Page): Promise<void> {
    await page.waitForFunction(
        () => {
            const text = document.body.innerText || '';
            return text.includes('Pozycje') ||
                text.includes('Szczegóły') ||
                text.includes('Nie znaleziono oferty');
        },
        { timeout: 30000 }
    );
    await page.waitForTimeout(500);
}

export async function createContract(
    page: Page,
    options?: { title?: string; itemName?: string }
): Promise<CreateContractResult> {
    const testId = Date.now();
    const title = options?.title || `Umowa-E2E-${testId}`;
    const itemName = options?.itemName || 'Pozycja testowa E2E';

    await page.goto('/dashboard/contracts/new', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    await page.getByText('Informacje podstawowe').waitFor({ state: 'visible', timeout: 15000 });

    const textInputs = page.locator('form input:not([type="date"]):not([type="number"]):not([type="hidden"]):not([type="checkbox"])');
    const titleField = textInputs.first();
    await titleField.waitFor({ state: 'visible', timeout: 5000 });
    await titleField.fill(title);

    const clientSelect = page.locator('form select').first();
    await clientSelect.waitFor({ state: 'visible', timeout: 5000 });
    const clientOptions = clientSelect.locator('option');
    const optionCount = await clientOptions.count();
    if (optionCount > 1) {
        const secondOption = await clientOptions.nth(1).getAttribute('value');
        if (secondOption) {
            await clientSelect.selectOption(secondOption);
        }
    }

    const itemNameField = textInputs.nth(1);
    await itemNameField.scrollIntoViewIfNeeded();
    await itemNameField.waitFor({ state: 'visible', timeout: 5000 });
    await itemNameField.fill(itemName);

    const numberInputs = page.locator('form input[type="number"]');
    const priceField = numberInputs.nth(2);
    await priceField.scrollIntoViewIfNeeded();
    await priceField.fill('5000');

    const submitBtn = page.getByRole('button', { name: /utwórz umowę/i });
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();

    await page.waitForURL(
        (url) => /\/dashboard\/contracts\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith('/new'),
        { timeout: 30000 }
    );
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const idMatch = url.match(/\/dashboard\/contracts\/([^/]+)$/);
    expect(idMatch).toBeTruthy();

    return { contractId: idMatch![1], title };
}

export async function publishContract(page: Page, contractId: string): Promise<string> {
    await page.goto(`/dashboard/contracts/${contractId}`, { waitUntil: 'domcontentloaded' });
    await waitForContractPage(page);

    const publishBtn = page.getByRole('button', { name: /wygeneruj link publiczny/i });
    await publishBtn.waitFor({ state: 'visible', timeout: 10000 });
    await publishBtn.scrollIntoViewIfNeeded();

    const responsePromise = page.waitForResponse(
        (resp) =>
            resp.url().includes('/contracts/') &&
            resp.url().includes('/publish') &&
            resp.request().method() === 'POST'
    );

    await publishBtn.click();

    const response = await responsePromise;
    const body = await response.json();
    const publicToken = body.data?.publicToken;

    if (!publicToken) {
        throw new Error(
            `publishContract failed: no publicToken in API response. Status: ${response.status()}, body: ${JSON.stringify(body).slice(0, 300)}`
        );
    }

    await expect(page.getByText(/link aktywny/i)).toBeVisible({ timeout: 10000 });

    return `/contract/view/${publicToken}`;
}

export async function changeContractStatus(
    page: Page,
    contractId: string,
    buttonLabel: RegExp
): Promise<void> {
    await page.goto(`/dashboard/contracts/${contractId}`, { waitUntil: 'domcontentloaded' });
    await waitForContractPage(page);

    const actionBtn = page.getByRole('button', { name: buttonLabel });
    await actionBtn.waitFor({ state: 'visible', timeout: 10000 });
    await actionBtn.scrollIntoViewIfNeeded();
    await actionBtn.click();

    const confirmDialog = page.locator('[role="dialog"]');
    await confirmDialog.waitFor({ state: 'visible', timeout: 5000 });

    const confirmBtn = confirmDialog.getByRole('button', { name: /potwierdź/i });
    await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
    await confirmBtn.click();

    await confirmDialog.waitFor({ state: 'hidden', timeout: 10000 });
    await page.waitForTimeout(2000);
}

export async function drawSignature(page: Page, canvasSelector: string = 'canvas'): Promise<void> {
    const canvas = page.locator(canvasSelector);
    await canvas.waitFor({ state: 'visible', timeout: 5000 });
    await canvas.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas bounding box not found');

    const startX = box.x + box.width * 0.2;
    const startY = box.y + box.height * 0.5;

    await page.mouse.move(startX, startY);
    await page.waitForTimeout(100);
    await page.mouse.down();
    await page.waitForTimeout(50);

    const waypoints = [
        [0.25, 0.35], [0.30, 0.55], [0.35, 0.40], [0.40, 0.60],
        [0.45, 0.35], [0.50, 0.50], [0.55, 0.30], [0.60, 0.55],
        [0.65, 0.40], [0.70, 0.60], [0.75, 0.35], [0.80, 0.50],
    ];

    for (const [wx, wy] of waypoints) {
        await page.mouse.move(box.x + box.width * wx, box.y + box.height * wy, { steps: 2 });
        await page.waitForTimeout(20);
    }

    await page.mouse.up();
    await page.waitForTimeout(200);

    const pixelCheck = await page.evaluate((sel) => {
        const c = document.querySelector(sel) as HTMLCanvasElement | null;
        if (!c) return { found: false, nonWhite: 0 };
        const ctx = c.getContext('2d');
        if (!ctx) return { found: false, nonWhite: 0 };
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        let nw = 0;
        for (let i = 0; i < d.length; i += 16) {
            if (d[i] < 240 || d[i + 1] < 240 || d[i + 2] < 240) nw++;
        }
        return { found: true, nonWhite: nw };
    }, canvasSelector);

    if (!pixelCheck.found || pixelCheck.nonWhite < 10) {
        await page.evaluate((sel) => {
            const c = document.querySelector(sel) as HTMLCanvasElement | null;
            if (!c) return;
            const rect = c.getBoundingClientRect();

            const createMouseEvent = (type: string, clientX: number, clientY: number) => {
                return new MouseEvent(type, {
                    clientX,
                    clientY,
                    bubbles: true,
                    cancelable: true,
                    button: 0,
                });
            };

            const sx = rect.left + rect.width * 0.2;
            const sy = rect.top + rect.height * 0.5;

            c.dispatchEvent(createMouseEvent('mousedown', sx, sy));

            const points = [
                [0.3, 0.4], [0.4, 0.6], [0.5, 0.35], [0.6, 0.55],
                [0.7, 0.4], [0.8, 0.5],
            ];

            for (const [px, py] of points) {
                c.dispatchEvent(createMouseEvent('mousemove',
                    rect.left + rect.width * px,
                    rect.top + rect.height * py
                ));
            }

            c.dispatchEvent(createMouseEvent('mouseup', rect.left + rect.width * 0.8, rect.top + rect.height * 0.5));
        }, canvasSelector);

        await page.waitForTimeout(200);
    }
}