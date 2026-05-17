# Kontrybuowanie do SmartQuote-AI

Dziękujemy za zainteresowanie projektem SmartQuote-AI! Ten dokument zawiera wytyczne dotyczące zgłaszania błędów, proponowania nowych funkcji oraz procesu tworzenia Pull Requestów.

## Jak zacząć?

1. Sforkuj repozytorium.
2. Sklonuj swoją kopię na lokalną maszynę.
3. Zainstaluj zależności: `npm install`.
4. Stwórz nową gałąź (branch) dla swojej zmiany: `git checkout -b feature/nowa-funkcjonalność` lub `fix/opis-bledu`.

## Standardy kodowania

- Używamy **TypeScript** dla zachowania bezpieczeństwa typów.
- Kod powinien być sformatowany zgodnie z regułami **ESLint** zdefiniowanymi w projekcie.
- Komponenty React tworzymy jako komponenty funkcyjne z wykorzystaniem **Tailwind CSS** do stylizacji.
- Nazewnictwo plików: `PascalCase` dla komponentów, `camelCase` dla hooków i utilsów.

## Proces Pull Request (PR)

1. Upewnij się, że Twój kod kompiluje się bez błędów: `npm run build`.
2. Uruchom linter: `npm run lint`.
3. Dodaj testy, jeśli wprowadzasz nową logikę.
4. Zaktualizuj dokumentację, jeśli Twoja zmiana tego wymaga.
5. Opisz dokładnie swoje zmiany w opisie PR.
6. Każdy PR musi zostać zatwierdzony przez co najmniej jednego maintainera przed mergem.

## Zgłaszanie błędów (Issues)

Przy zgłaszaniu błędu użyj poniższego szablonu:
- **Tytuł**: Krótki opis problemu.
- **Opis**: Co się dzieje, a co powinno się dziać?
- **Kroki do reprodukcji**:
    1. Przejdź do...
    2. Kliknij na...
    3. Zobacz błąd...
- **Środowisko**: Przeglądarka, system operacyjny, wersja Node.js.

## Styl pisania commitów

Stosujemy [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: dodanie generatora ofert AI`
- `fix: poprawka walidacji formularza klienta`
- `docs: aktualizacja instrukcji instalacji`
- `style: poprawa layoutu dashboardu`
- `refactor: uproszczenie hooka useOffers`

## Pytania?

Jeśli masz wątpliwości, zajrzyj do [FAQ.md](./FAQ.md) lub skontaktuj się z zespołem poprzez GitHub Discussions.
