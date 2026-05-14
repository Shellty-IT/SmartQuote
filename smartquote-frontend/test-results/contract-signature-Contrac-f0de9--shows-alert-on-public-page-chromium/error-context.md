# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: contract-signature.spec.ts >> Contract Electronic Signature >> Terminal contract shows alert on public page
- Location: tests\e2e\contract-signature.spec.ts:133:5

# Error details

```
Error: publishContract failed: no publicToken in API response. Status: 429, body: {"success":false,"error":{"code":"RATE_LIMIT_EXCEEDED","message":"Zbyt wiele żądań. Spróbuj ponownie za 15 minut."}}
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e12]:
    - complementary [ref=e13]:
      - generic [ref=e14]:
        - img "SmartQuote AI" [ref=e15]
        - generic [ref=e16]: SmartQuoteAI
      - navigation [ref=e17]:
        - generic [ref=e18]:
          - link "Dashboard" [ref=e19] [cursor=pointer]:
            - /url: /dashboard
            - generic [ref=e20]:
              - img [ref=e21]
              - text: Dashboard
          - link "Oferty 221" [ref=e23] [cursor=pointer]:
            - /url: /dashboard/offers
            - generic [ref=e24]:
              - img [ref=e25]
              - text: Oferty
            - generic [ref=e27]: "221"
          - link "Szablony ofert" [ref=e28] [cursor=pointer]:
            - /url: /dashboard/offer-templates
            - generic [ref=e29]:
              - img [ref=e30]
              - text: Szablony ofert
          - link "Umowy 132" [ref=e32] [cursor=pointer]:
            - /url: /dashboard/contracts
            - generic [ref=e33]:
              - img [ref=e34]
              - text: Umowy
            - generic [ref=e36]: "132"
          - link "Klienci 2" [ref=e37] [cursor=pointer]:
            - /url: /dashboard/clients
            - generic [ref=e38]:
              - img [ref=e39]
              - text: Klienci
            - generic [ref=e41]: "2"
          - link "Follow-upy" [ref=e42] [cursor=pointer]:
            - /url: /dashboard/followups
            - generic [ref=e43]:
              - img [ref=e44]
              - text: Follow-upy
          - link "Korespondencja" [ref=e46] [cursor=pointer]:
            - /url: /dashboard/emails
            - generic [ref=e47]:
              - img [ref=e48]
              - text: Korespondencja
          - link "Powiadomienia 603" [ref=e50] [cursor=pointer]:
            - /url: /dashboard/notifications
            - generic [ref=e51]:
              - img [ref=e52]
              - text: Powiadomienia
            - generic [ref=e54]: "603"
          - link "AI Asystent" [ref=e55] [cursor=pointer]:
            - /url: /dashboard/ai
            - generic [ref=e56]:
              - img [ref=e57]
              - text: AI Asystent
          - link "Wnioski AI" [ref=e59] [cursor=pointer]:
            - /url: /dashboard/ai-insights
            - generic [ref=e60]:
              - img [ref=e61]
              - text: Wnioski AI
        - generic [ref=e63]:
          - link "Ustawienia" [ref=e64] [cursor=pointer]:
            - /url: /dashboard/settings
            - img [ref=e65]
            - text: Ustawienia
          - button "Wyloguj się" [ref=e68]:
            - img [ref=e69]
            - text: Wyloguj się
    - generic [ref=e71]:
      - banner [ref=e72]:
        - generic [ref=e73]:
          - button [ref=e75]:
            - img [ref=e76]
          - generic [ref=e78]:
            - img "Użytkownik" [ref=e80]
            - generic [ref=e81]:
              - paragraph [ref=e82]: Użytkownik
              - paragraph [ref=e83]: testowy@test.pl
      - main [ref=e84]:
        - generic [ref=e85]:
          - generic [ref=e87]:
            - link [ref=e88] [cursor=pointer]:
              - /url: /dashboard/contracts
              - button [ref=e89]:
                - img [ref=e90]
            - generic [ref=e92]:
              - generic [ref=e93]:
                - heading "UMW/2026/132" [level=1] [ref=e94]
                - generic [ref=e95]: Szkic
              - paragraph [ref=e96]: Umowa-E2E-1778776338051
          - generic [ref=e97]:
            - heading "Status umowy" [level=3] [ref=e98]
            - generic [ref=e100]:
              - generic [ref=e102]:
                - generic [ref=e104]: "1"
                - generic [ref=e105]: Szkic
              - generic [ref=e108]:
                - generic [ref=e110]: "2"
                - generic [ref=e111]: Do podpisu
              - generic [ref=e114]:
                - generic [ref=e116]: "3"
                - generic [ref=e117]: Aktywna
              - generic [ref=e120]:
                - generic [ref=e122]: "4"
                - generic [ref=e123]: Zakończona
          - generic [ref=e124]:
            - heading "Dostępne akcje" [level=3] [ref=e125]
            - generic [ref=e127]:
              - button "Wyślij do podpisu" [ref=e128]:
                - img [ref=e129]
                - text: Wyślij do podpisu
              - generic [ref=e131]: Oznacz umowę jako wysłaną do klienta do podpisu
          - generic [ref=e132]:
            - generic [ref=e133]:
              - generic [ref=e134]:
                - heading "Szczegóły umowy" [level=2] [ref=e136]
                - generic [ref=e138]:
                  - generic [ref=e139]:
                    - text: Data rozpoczęcia
                    - paragraph [ref=e140]: —
                  - generic [ref=e141]:
                    - text: Data zakończenia
                    - paragraph [ref=e142]: —
                  - generic [ref=e143]:
                    - text: Data podpisania
                    - paragraph [ref=e144]: —
                  - generic [ref=e145]:
                    - text: Termin płatności
                    - paragraph [ref=e146]: 14 dni
              - generic [ref=e147]:
                - heading "Pozycje umowy" [level=2] [ref=e149]
                - table [ref=e151]:
                  - rowgroup [ref=e152]:
                    - row "Nazwa Ilość Cena jedn. VAT Brutto" [ref=e153]:
                      - columnheader "Nazwa" [ref=e154]
                      - columnheader "Ilość" [ref=e155]
                      - columnheader "Cena jedn." [ref=e156]
                      - columnheader "VAT" [ref=e157]
                      - columnheader "Brutto" [ref=e158]
                  - rowgroup [ref=e159]:
                    - row "Pozycja testowa E2E 1 szt. 5000,00 zł 23% 6150,00 zł" [ref=e160]:
                      - cell "Pozycja testowa E2E" [ref=e161]:
                        - paragraph [ref=e162]: Pozycja testowa E2E
                      - cell "1 szt." [ref=e163]
                      - cell "5000,00 zł" [ref=e164]
                      - cell "23%" [ref=e165]
                      - cell "6150,00 zł" [ref=e166]
                - generic [ref=e167]:
                  - generic [ref=e168]:
                    - generic [ref=e169]: "Suma netto:"
                    - generic [ref=e170]: 5000,00 zł
                  - generic [ref=e171]:
                    - generic [ref=e172]: "VAT:"
                    - generic [ref=e173]: 1150,00 zł
                  - generic [ref=e174]:
                    - generic [ref=e175]: "RAZEM BRUTTO:"
                    - generic [ref=e176]: 6150,00 zł
            - generic [ref=e177]:
              - generic [ref=e178]:
                - heading "Klient" [level=2] [ref=e180]
                - generic [ref=e181]:
                  - generic [ref=e182]:
                    - generic [ref=e183]: J
                    - generic [ref=e184]:
                      - paragraph [ref=e185]: Janko Muzykant
                      - paragraph [ref=e186]: Muzyczna
                  - generic [ref=e187]:
                    - text: Email
                    - paragraph [ref=e188]: rastuszkowy@wp.pl
                  - generic [ref=e189]:
                    - text: Telefon
                    - paragraph [ref=e190]: "+48222333444"
                  - generic [ref=e191]:
                    - text: NIP
                    - paragraph [ref=e192]: "2223334443"
                  - link "Zobacz profil klienta" [ref=e193] [cursor=pointer]:
                    - /url: /dashboard/clients/cmmo3us09000117x0mbh7b63y
                    - button "Zobacz profil klienta" [ref=e194]
              - generic [ref=e195]:
                - heading "Dystrybucja" [level=2] [ref=e197]
                - button "Wygeneruj link publiczny" [ref=e199]:
                  - img [ref=e200]
                  - text: Wygeneruj link publiczny
              - generic [ref=e202]:
                - heading "Akcje" [level=2] [ref=e204]
                - generic [ref=e205]:
                  - link "Edytuj umowę" [ref=e206] [cursor=pointer]:
                    - /url: /dashboard/contracts/cmp5pi890002n61b8kxkhec0n/edit
                    - button "Edytuj umowę" [ref=e207]:
                      - img [ref=e208]
                      - text: Edytuj umowę
                  - button "Pobierz PDF" [ref=e210]:
                    - img [ref=e211]
                    - text: Pobierz PDF
              - generic [ref=e213]:
                - heading "Historia" [level=2] [ref=e215]
                - generic [ref=e218]:
                  - generic [ref=e220]: "Utworzono:"
                  - generic [ref=e221]: 14.05.2026
    - button [ref=e222]:
      - img [ref=e223]
  - region "Powiadomienia":
    - alert [ref=e225]:
      - img [ref=e227]
      - generic [ref=e229]:
        - paragraph [ref=e230]: Błąd
        - paragraph [ref=e231]: Nie udało się opublikować linku
      - button "Zamknij" [ref=e232] [cursor=pointer]:
        - img [ref=e233]
```

# Test source

```ts
  215 |                 text.includes('Dostępne akcje') ||
  216 |                 text.includes('Dystrybucja') ||
  217 |                 text.includes('Umowa nie znaleziona');
  218 |         },
  219 |         { timeout: 30000 }
  220 |     );
  221 |     await page.waitForTimeout(1000);
  222 | }
  223 | 
  224 | export async function waitForOfferPage(page: Page): Promise<void> {
  225 |     await page.waitForFunction(
  226 |         () => {
  227 |             const text = document.body.innerText || '';
  228 |             return text.includes('Pozycje') ||
  229 |                 text.includes('Szczegóły') ||
  230 |                 text.includes('Nie znaleziono oferty');
  231 |         },
  232 |         { timeout: 30000 }
  233 |     );
  234 |     await page.waitForTimeout(500);
  235 | }
  236 | 
  237 | export async function createContract(
  238 |     page: Page,
  239 |     options?: { title?: string; itemName?: string }
  240 | ): Promise<CreateContractResult> {
  241 |     const testId = Date.now();
  242 |     const title = options?.title || `Umowa-E2E-${testId}`;
  243 |     const itemName = options?.itemName || 'Pozycja testowa E2E';
  244 | 
  245 |     await page.goto('/dashboard/contracts/new', { waitUntil: 'domcontentloaded' });
  246 |     await page.waitForLoadState('networkidle');
  247 | 
  248 |     await page.getByText('Informacje podstawowe').waitFor({ state: 'visible', timeout: 15000 });
  249 | 
  250 |     const textInputs = page.locator('form input:not([type="date"]):not([type="number"]):not([type="hidden"]):not([type="checkbox"])');
  251 |     const titleField = textInputs.first();
  252 |     await titleField.waitFor({ state: 'visible', timeout: 5000 });
  253 |     await titleField.fill(title);
  254 | 
  255 |     const clientSelect = page.locator('form select').first();
  256 |     await clientSelect.waitFor({ state: 'visible', timeout: 5000 });
  257 |     const clientOptions = clientSelect.locator('option');
  258 |     const optionCount = await clientOptions.count();
  259 |     if (optionCount > 1) {
  260 |         const secondOption = await clientOptions.nth(1).getAttribute('value');
  261 |         if (secondOption) {
  262 |             await clientSelect.selectOption(secondOption);
  263 |         }
  264 |     }
  265 | 
  266 |     const itemNameField = textInputs.nth(1);
  267 |     await itemNameField.scrollIntoViewIfNeeded();
  268 |     await itemNameField.waitFor({ state: 'visible', timeout: 5000 });
  269 |     await itemNameField.fill(itemName);
  270 | 
  271 |     const numberInputs = page.locator('form input[type="number"]');
  272 |     const priceField = numberInputs.nth(2);
  273 |     await priceField.scrollIntoViewIfNeeded();
  274 |     await priceField.fill('5000');
  275 | 
  276 |     const submitBtn = page.getByRole('button', { name: /utwórz umowę/i });
  277 |     await submitBtn.scrollIntoViewIfNeeded();
  278 |     await submitBtn.click();
  279 | 
  280 |     await page.waitForURL(
  281 |         (url) => /\/dashboard\/contracts\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith('/new'),
  282 |         { timeout: 30000 }
  283 |     );
  284 |     await page.waitForLoadState('networkidle');
  285 | 
  286 |     const url = page.url();
  287 |     const idMatch = url.match(/\/dashboard\/contracts\/([^/]+)$/);
  288 |     expect(idMatch).toBeTruthy();
  289 | 
  290 |     return { contractId: idMatch![1], title };
  291 | }
  292 | 
  293 | export async function publishContract(page: Page, contractId: string): Promise<string> {
  294 |     await page.goto(`/dashboard/contracts/${contractId}`, { waitUntil: 'domcontentloaded' });
  295 |     await waitForContractPage(page);
  296 | 
  297 |     const publishBtn = page.getByRole('button', { name: /wygeneruj link publiczny/i });
  298 |     await publishBtn.waitFor({ state: 'visible', timeout: 10000 });
  299 |     await publishBtn.scrollIntoViewIfNeeded();
  300 | 
  301 |     const responsePromise = page.waitForResponse(
  302 |         (resp) =>
  303 |             resp.url().includes('/contracts/') &&
  304 |             resp.url().includes('/publish') &&
  305 |             resp.request().method() === 'POST'
  306 |     );
  307 | 
  308 |     await publishBtn.click();
  309 | 
  310 |     const response = await responsePromise;
  311 |     const body = await response.json();
  312 |     const publicToken = body.data?.publicToken;
  313 | 
  314 |     if (!publicToken) {
> 315 |         throw new Error(
      |               ^ Error: publishContract failed: no publicToken in API response. Status: 429, body: {"success":false,"error":{"code":"RATE_LIMIT_EXCEEDED","message":"Zbyt wiele żądań. Spróbuj ponownie za 15 minut."}}
  316 |             `publishContract failed: no publicToken in API response. Status: ${response.status()}, body: ${JSON.stringify(body).slice(0, 300)}`
  317 |         );
  318 |     }
  319 | 
  320 |     await expect(page.getByText(/link aktywny/i)).toBeVisible({ timeout: 10000 });
  321 | 
  322 |     return `/contract/view/${publicToken}`;
  323 | }
  324 | 
  325 | export async function changeContractStatus(
  326 |     page: Page,
  327 |     contractId: string,
  328 |     buttonLabel: RegExp
  329 | ): Promise<void> {
  330 |     await page.goto(`/dashboard/contracts/${contractId}`, { waitUntil: 'domcontentloaded' });
  331 |     await waitForContractPage(page);
  332 | 
  333 |     const actionBtn = page.getByRole('button', { name: buttonLabel });
  334 |     await actionBtn.waitFor({ state: 'visible', timeout: 10000 });
  335 |     await actionBtn.scrollIntoViewIfNeeded();
  336 |     await actionBtn.click();
  337 | 
  338 |     const confirmDialog = page.locator('[role="dialog"]');
  339 |     await confirmDialog.waitFor({ state: 'visible', timeout: 5000 });
  340 | 
  341 |     const confirmBtn = confirmDialog.getByRole('button', { name: /potwierdź/i });
  342 |     await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
  343 |     await confirmBtn.click();
  344 | 
  345 |     await confirmDialog.waitFor({ state: 'hidden', timeout: 10000 });
  346 |     await page.waitForTimeout(2000);
  347 | }
  348 | 
  349 | export async function drawSignature(page: Page, canvasSelector: string = 'canvas'): Promise<void> {
  350 |     const canvas = page.locator(canvasSelector);
  351 |     await canvas.waitFor({ state: 'visible', timeout: 5000 });
  352 |     await canvas.scrollIntoViewIfNeeded();
  353 |     await page.waitForTimeout(300);
  354 | 
  355 |     const box = await canvas.boundingBox();
  356 |     if (!box) throw new Error('Canvas bounding box not found');
  357 | 
  358 |     const startX = box.x + box.width * 0.2;
  359 |     const startY = box.y + box.height * 0.5;
  360 | 
  361 |     await page.mouse.move(startX, startY);
  362 |     await page.waitForTimeout(100);
  363 |     await page.mouse.down();
  364 |     await page.waitForTimeout(50);
  365 | 
  366 |     const waypoints = [
  367 |         [0.25, 0.35], [0.30, 0.55], [0.35, 0.40], [0.40, 0.60],
  368 |         [0.45, 0.35], [0.50, 0.50], [0.55, 0.30], [0.60, 0.55],
  369 |         [0.65, 0.40], [0.70, 0.60], [0.75, 0.35], [0.80, 0.50],
  370 |     ];
  371 | 
  372 |     for (const [wx, wy] of waypoints) {
  373 |         await page.mouse.move(box.x + box.width * wx, box.y + box.height * wy, { steps: 2 });
  374 |         await page.waitForTimeout(20);
  375 |     }
  376 | 
  377 |     await page.mouse.up();
  378 |     await page.waitForTimeout(200);
  379 | 
  380 |     const pixelCheck = await page.evaluate((sel) => {
  381 |         const c = document.querySelector(sel) as HTMLCanvasElement | null;
  382 |         if (!c) return { found: false, nonWhite: 0 };
  383 |         const ctx = c.getContext('2d');
  384 |         if (!ctx) return { found: false, nonWhite: 0 };
  385 |         const d = ctx.getImageData(0, 0, c.width, c.height).data;
  386 |         let nw = 0;
  387 |         for (let i = 0; i < d.length; i += 16) {
  388 |             if (d[i] < 240 || d[i + 1] < 240 || d[i + 2] < 240) nw++;
  389 |         }
  390 |         return { found: true, nonWhite: nw };
  391 |     }, canvasSelector);
  392 | 
  393 |     if (!pixelCheck.found || pixelCheck.nonWhite < 10) {
  394 |         await page.evaluate((sel) => {
  395 |             const c = document.querySelector(sel) as HTMLCanvasElement | null;
  396 |             if (!c) return;
  397 |             const rect = c.getBoundingClientRect();
  398 | 
  399 |             const createMouseEvent = (type: string, clientX: number, clientY: number) => {
  400 |                 return new MouseEvent(type, {
  401 |                     clientX,
  402 |                     clientY,
  403 |                     bubbles: true,
  404 |                     cancelable: true,
  405 |                     button: 0,
  406 |                 });
  407 |             };
  408 | 
  409 |             const sx = rect.left + rect.width * 0.2;
  410 |             const sy = rect.top + rect.height * 0.5;
  411 | 
  412 |             c.dispatchEvent(createMouseEvent('mousedown', sx, sy));
  413 | 
  414 |             const points = [
  415 |                 [0.3, 0.4], [0.4, 0.6], [0.5, 0.35], [0.6, 0.55],
```