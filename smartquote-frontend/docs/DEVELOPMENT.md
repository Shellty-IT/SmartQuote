# Development - Przewodnik Dewelopera

Ten dokument zawiera informacje niezbędne do rozpoczęcia pracy nad kodem projektu SmartQuote-AI.

## Setup środowiska deweloperskiego

1. **Wymagania wstępne**:
    - Node.js (wersja 20 lub nowsza)
    - npm lub yarn
    - Dostęp do działającego API (lokalnie lub zdalnie)

2. **Instalacja**:
   ```bash
   git clone <url-repozytorium>
   cd SmartQuote-AI
   npm install
   ```

3. **Konfiguracja**:
   Skopiuj plik `.env.example` do `.env.local` i uzupełnij brakujące dane (zobacz [CONFIGURATION.md](./CONFIGURATION.md)).

4. **Uruchomienie**:
   ```bash
   npm run dev
   ```
   Aplikacja będzie dostępna pod adresem `http://localhost:3000`.

## Struktura Projektu

```text
src/
├── app/            # Next.js App Router (widoki i API routes)
│   ├── dashboard/  # Panel główny użytkownika
│   ├── api/        # Endpointy API specyficzne dla frontendu
│   └── layout.tsx  # Główny layout aplikacji
├── components/     # Komponenty UI wielokrotnego użytku
│   ├── ui/         # Bazowe komponenty (Button, Input, Card)
│   ├── ai/         # Komponenty związane z AI
│   └── notifications/ # System powiadomień
├── hooks/          # Niestandardowe Hooki React
├── lib/            # Narzędzia i konfiguracja (klient API, utils)
├── contexts/       # Konteksty React (np. AIChatContext)
└── types/          # Definicje typów TypeScript
```

## Standardy Kodowania

- **Zasada Single Responsibility**: Każdy komponent powinien robić jedną rzecz.
- **Typowanie**: Zawsze definiuj interfejsy dla Propsów i danych z API. Unikaj używania typu `any`.
- **Komponenty**: Preferujemy komponenty funkcyjne z Hookami.
- **Stylizacja**: Używamy klas Tailwind CSS bezpośrednio w kodzie JSX. Dla złożonych warunków używamy biblioteki `clsx` lub `tailwind-merge`.

## Praca z API

Wszystkie wywołania do zewnętrznego API powinny przechodzić przez klienta zdefiniowanego w `src/lib/api.ts`.
Przykład użycia w komponencie:

```tsx
import { clientsApi } from '@/lib/api';

const fetchClients = async () => {
  try {
    const response = await clientsApi.list();
    if (response.success) {
      // obsługa danych
    }
  } catch (error) {
    // obsługa błędu
  }
};
```

## Testowanie

W projekcie planowane jest wdrożenie:
- **Jest**: Dla testów jednostkowych logiki (utils, hooks).
- **React Testing Library**: Dla testów komponentów.
- **Playwright**: Dla testów end-to-end.

Uruchomienie testów (jeśli skonfigurowane):
```bash
npm run test
```

## Jak dodać nową funkcjonalność?

1. Zdefiniuj potrzebne typy w `src/types/`.
2. Dodaj odpowiednie metody do klienta API w `src/lib/api.ts`.
3. Stwórz potrzebne hooki w `src/hooks/`.
4. Przygotuj komponenty UI w `src/components/`.
5. Stwórz nową stronę (page) w `src/app/dashboard/`.
6. Zaktualizuj menu boczne w `src/app/dashboard/components/Sidebar.tsx`.
