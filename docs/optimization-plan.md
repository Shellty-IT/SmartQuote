# Plan optymalizacji i refactoringu SmartQuote

## Stan początkowy

- Branch roboczy: `fix-july-bugs` (czysty względem `origin/fix-july-bugs`).
- Backend: Node.js, Express, Prisma i PostgreSQL; 30 zestawów oraz 642 testy jednostkowe przechodzą.
- Frontend: Next.js 16, React 19, Tailwind CSS 4 i TanStack Query 5; 15 zestawów oraz 145 testów jednostkowych przechodzi.
- TypeScript przechodzi dla obu aplikacji, a ESLint przechodzi dla frontendu.
- PDF-y ofert i umów są generowane w dwóch kontrolowanych ścieżkach: React PDF na backendzie dla klasycznych załączników oraz HTML/Puppeteer na frontendzie dla szablonów aplikacji.

## Zidentyfikowane problemy

1. Sidebar odpytuje pięć endpointów statystyk co minutę. Te endpointy wykonują łącznie około 13 zapytań lub odczytów statystycznych, mimo że UI potrzebuje tylko pięciu liczników. Statystyki follow-upów pobierają wszystkie rekordy użytkownika do pamięci.
2. Pełne statystyki ofert, umów i leadów osobno pobierają liczbę wszystkich rekordów, chociaż można ją wyliczyć z już pobranego grupowania po statusie.
3. Walidacja relacji nowego follow-upu wykonuje do trzech niezależnych zapytań sekwencyjnie.
4. Publiczne akcje zmieniające stan korzystają z limitów ruchu i walidacji Zod, ale nie wymagają jawnie formatu JSON. Wymuszenie JSON powoduje preflight dla żądań cross-origin i uzupełnia ochronę CSRF wynikającą z CORS. Prywatne API używa tokenu Bearer zamiast cookies, więc nie jest podatne na klasyczny CSRF oparty na sesji cookie.
5. Opisy i warunki ofert są renderowane jako HTML. Backend już sanitizuje je przy zapisie; potrzebne są testy regresyjne potwierdzające sanitizację zarówno podczas tworzenia, jak i aktualizacji.
6. Klucze i inwalidacje TanStack Query są rozproszone. Nowy licznik zbiorczy musi mieć jeden stabilny klucz oraz być unieważniany po mutacjach encji wpływających na sidebar.

## Zakres realizacji

### Backend i baza danych

- Dodać uwierzytelniony endpoint `GET /api/dashboard/sidebar-stats`.
- Pobierać pięć minimalnych liczników w jednym żądaniu HTTP i równolegle po stronie bazy.
- Wyliczać `total` pełnych statystyk ze zgrupowanych statusów tam, gdzie wynik jest równoważny.
- Równolegle weryfikować własność relacji follow-upu i ograniczyć zwracane kolumny do `id`.
- Zachować kontrolę własności rekordów oraz istniejące transakcje atomowe.

### Frontend i UI/UX

- Zastąpić pięć zapytań sidebara jednym zapytaniem zbiorczym.
- Zachować stany ładowania poszczególnych liczników i ostatnie poprawne dane podczas odświeżania.
- Centralnie unieważniać licznik sidebara po mutacjach ofert, klientów, umów, follow-upów i leadów.
- Nie zmieniać publicznych kontraktów typów ani wyglądu dokumentów.

### Bezpieczeństwo

- Wymagać `application/json` dla publicznych operacji `POST`/`PATCH`, które zmieniają ofertę lub podpisują umowę.
- Utrzymać ścisłą listę CORS, tokeny Bearer, rate limiting, walidację Zod i sanitizację HTML.
- Dodać testy middleware JSON oraz testy sanitizacji na granicy serwisu ofert.

### Jakość i weryfikacja

- Dodać testy jednostkowe nowego serwisu statystyk i hooka sidebara.
- Uruchomić testy backendu, testy frontendu, oba typechecki, ESLint i buildy produkcyjne.
- Uruchomić testy generatorów HTML/PDF oraz skrypt audytu layoutów w zakresie możliwym lokalnie.
- Każdy etap funkcjonalny zakończyć osobnym, opisowym commitem.

## Kryteria ukończenia

- Sidebar wykonuje jedno żądanie zamiast pięciu i nie pobiera pełnej listy follow-upów.
- Liczniki zachowują dotychczasową semantykę biznesową.
- Publiczne akcje zmieniające stan odrzucają formularze cross-site bez typu JSON kodem 415.
- Nie ma regresji w testach, typechecku, lintingu, buildach ani testach dokumentów.
