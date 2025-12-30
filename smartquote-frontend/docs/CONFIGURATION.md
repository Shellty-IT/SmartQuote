# Configuration - Konfiguracja systemu

SmartQuote-AI wykorzystuje zmienne środowiskowe do zarządzania konfiguracją dla różnych środowisk (dev, staging, prod).

## Zmienne Środowiskowe (.env)

Poniżej znajduje się lista wszystkich wykorzystywanych zmiennych środowiskowych.

### Publiczne (dostępne na froncie - prefix `NEXT_PUBLIC_`)

| Zmienna | Opis | Wartość domyślna |
|---------|------|------------------|
| `NEXT_PUBLIC_BACKEND_URL` | Adres bazowy API backendu | `http://localhost:8080` |
| `NEXT_PUBLIC_APP_URL` | Adres URL aplikacji frontendowej | `http://localhost:3000` |
| `NEXT_PUBLIC_AI_ENABLED` | Czy funkcje AI są włączone (true/false) | `true` |

### Prywatne (serwerowe)

| Zmienna | Opis | Wymagana |
|---------|------|----------|
| `NEXTAUTH_SECRET` | Klucz szyfrujący dla NextAuth.js | Tak |
| `NEXTAUTH_URL` | Adres URL dla NextAuth (identyczny z APP_URL) | Tak |
| `OPENAI_API_KEY` | Klucz do API OpenAI (używany przez backend) | Tak (na backendzie) |
| `DATABASE_URL` | Connection string do bazy danych | Tak (na backendzie) |

## Przykładowe Konfiguracje

### Środowisko Deweloperskie (`.env.local`)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=twoj_sekretny_klucz_dev
```

### Środowisko Produkcyjne (Netlify Settings)
```env
NEXT_PUBLIC_BACKEND_URL=https://api.smartquote.ai
NEXT_PUBLIC_APP_URL=https://app.smartquote.ai
NEXTAUTH_URL=https://app.smartquote.ai
NEXTAUTH_SECRET=wygenerowany_dlugi_hash_produkcyjny
```

## Pliki Konfiguracyjne

- `next.config.ts`: Główna konfiguracja frameworka Next.js.
- `tailwind.config.ts`: Konfiguracja motywów, kolorów i breakpointów Tailwind CSS.
- `tsconfig.json`: Konfiguracja kompilatora TypeScript i aliasów ścieżek (np. `@/*`).
- `netlify.toml`: Instrukcje budowania dla platformy Netlify.

## Zarządzanie kluczami API

Użytkownik może zarządzać własnymi kluczami API w sekcji `Ustawienia -> Klucze API`. Te klucze służą do autoryzacji zewnętrznych integracji z systemem SmartQuote-AI.
Klucze są szyfrowane przed zapisem w bazie danych.
