# Weryfikacja refactoringu SmartQuote

Data: 2026-07-13  
Branch: `fix-july-bugs`

## Wyniki zakończone powodzeniem

| Obszar | Polecenie / kontrola | Wynik |
|---|---|---|
| Backend — testy | `npm test -- --runInBand` | 34 zestawy, 662 testy zaliczone |
| Backend — typy | `npm run typecheck` | bez błędów |
| Backend — build | `npm run build` | Prisma Client wygenerowany, TypeScript zbudowany |
| Frontend — testy | `npm run test:unit` | 19 zestawów, 175 testów zaliczonych |
| Frontend — typy | `npx tsc --noEmit` | bez błędów |
| Frontend — lint | `npm run lint` | bez błędów |
| Frontend — build | `npm run build` | produkcyjny build Next.js zakończony powodzeniem |
| Zależności produkcyjne | `npm audit --omit=dev --audit-level=moderate` | 0 podatności backendu i 0 podatności frontendu |
| Lockfile | `npm ci --dry-run` | oba projekty gotowe do czystej instalacji CI |
| Nowe SQL sidebara | wywołanie `DashboardService.getSidebarStats()` na skonfigurowanej bazie | jedno zapytanie wykonało się poprawnie; poprawny kształt odpowiedzi |
| PDF backend | `pdf.service.test.ts` w pełnym zestawie Jest | oferty i umowy zaliczone |
| PDF frontend | testy Vitest generatorów dokumentów | zaliczone |
| Audyt PDF Chromium | `scripts/audit-pdf-layouts.ts` | 28 PDF-ów wygenerowanych |

Audyt Chromium objął 14 szablonów (9 ofert i 5 umów), każdy w wariancie domyślnym i stress. Wynik diagnostyczny:

- 0 przepełnień poziomych,
- 0 przypadków `scrollWidth > viewportWidth`,
- 0 elementów z `break-inside: avoid` większych od strony.

Raport i wygenerowane dokumenty znajdują się lokalnie w ignorowanym przez Git katalogu `smartquote-frontend/test-results/pdf-layout-audit/`.

## Weryfikacja bezpieczeństwa

- Middleware wymagający JSON ma testy dla poprawnego `application/json` i odrzucenia innych typów kodem 415.
- Sanitizacja HTML ma test regresyjny na granicy serwisu ofert: usuwa skrypty, handlery zdarzeń i adresy `javascript:` przed zapisem.
- Nowy endpoint sidebara pozostaje za middleware JWT i filtruje dane po `userId` w każdym podzapytaniu.
- SQL korzysta z interpolacji tagowanej Prisma, bez konkatenacji danych użytkownika.

## E2E — stan środowiska

Pełna lokalna seria Playwright nie daje obecnie miarodajnego wyniku z dwóch powodów środowiskowych:

1. Port 3000 był zajęty przez inną aplikację („Tomi Forno”), więc nieudana próba trafiła do obcego frontendu i przekroczyła limit całej serii. Jej artefakty nie są wynikiem SmartQuote.
2. Po odizolowaniu backendu smoke test logowania zatrzymał się na błędzie Prisma: kolumna `users.tokenVersion` nie istnieje w skonfigurowanej bazie. Migracja `20260709220000_add_user_token_version` jest w repozytorium, ale nie została jeszcze wdrożona.

Przed ponownym E2E należy:

1. Wykonać w kontrolowanym środowisku `npx prisma migrate deploy` w `smartquote-backend/`.
2. Upewnić się, że porty 3000 i 8080 są wolne albo uruchomić SmartQuote na jawnie wybranych alternatywnych portach.
3. Uruchomić `npm run test:e2e:ci` z `PLAYWRIGHT_BASE_URL` oraz `PLAYWRIGHT_BACKEND_URL` wskazującymi te lokalne serwery.

Migracja nie została zastosowana automatycznie, ponieważ zmienia współdzieloną bazę i wymaga świadomej decyzji wdrożeniowej.
