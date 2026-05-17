# Installation - Instrukcja Instalacji

Ten przewodnik pomoże Ci uruchomić projekt SmartQuote-AI na Twoim lokalnym urządzeniu.

## Wymagania wstępne

Zanim zaczniesz, upewnij się, że masz zainstalowane:
- **Node.js** (rekomendowana wersja v20.x lub nowsza)
- **npm** (zazwyczaj zainstalowany z Node.js) lub **yarn**
- **Git**

## Krok po kroku Setup

### 1. Klonowanie repozytorium
```bash
git clone https://github.com/twoje-uzytkownik/SmartQuote-AI.git
cd SmartQuote-AI
```

### 2. Instalacja zależności
```bash
npm install
```

### 3. Konfiguracja środowiska
Stwórz plik `.env.local` w katalogu głównym projektu:
```bash
cp .env.example .env.local
```
Następnie uzupełnij wymagane klucze (szczegóły w [CONFIGURATION.md](./CONFIGURATION.md)).

### 4. Uruchomienie aplikacji (tryb deweloperski)
```bash
npm run dev
```
Aplikacja powinna być dostępna pod adresem: `http://localhost:3000`.

### 5. Budowanie wersji produkcyjnej
```bash
npm run build
npm start
```

## Troubleshooting instalacji

### Problem: Błąd podczas `npm install`
- **Rozwiązanie**: Upewnij się, że używasz wersji Node.js zgodnej z projektem. Spróbuj usunąć folder `node_modules` i plik `package-lock.json`, a następnie uruchom ponownie `npm install`.

### Problem: Aplikacja nie może połączyć się z API
- **Rozwiązanie**: Sprawdź zmienną `NEXT_PUBLIC_BACKEND_URL` w pliku `.env.local`. Upewnij się, że serwer backendowy działa pod wskazanym adresem.

### Problem: Błędy typowania TypeScript
- **Rozwiązanie**: Upewnij się, że masz zainstalowane wszystkie zależności deweloperskie. Spróbuj zrestartować serwer TS w swoim edytorze (np. VS Code).

### Problem: Brak ikon lub nieprawidłowe style
- **Rozwiązanie**: Upewnij się, że proces budowania Tailwind CSS działa poprawnie (jest uruchamiany automatycznie przy `npm run dev`).
