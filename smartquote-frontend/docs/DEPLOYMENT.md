# Deployment - Wdrożenie systemu

Ten dokument opisuje proces wdrażania aplikacji SmartQuote-AI na środowiska produkcyjne i stagingowe.

## Architektura Wdrożenia

Aplikacja SmartQuote-AI składa się z dwóch głównych części:
1. **Frontend**: Next.js (obecnie skonfigurowany pod Netlify).
2. **Backend**: Serwer API (Node.js/Spring Boot/inne) działający na porcie 8080.

## Wdrożenie Frontendu (Netlify)

Projekt zawiera plik `netlify.toml`, który automatyzuje proces budowania i wdrażania.

### Kroki wdrożenia:
1. Podłącz repozytorium GitHub do Netlify.
2. Skonfiguruj zmienne środowiskowe w panelu Netlify (zobacz [CONFIGURATION.md](./CONFIGURATION.md)).
3. Uruchom build ręcznie lub poprzez push na gałąź `main`.

**Konfiguracja Builda:**
- **Build command**: `npm run build`
- **Publish directory**: `.next`

## Wdrożenie Backendu

Backend powinien być wdrożony na serwerze wspierającym Node.js (jeśli to aplikacja JS) lub w kontenerze Docker.

### Przykład Docker Compose:
```yaml
services:
  backend:
    image: smartquote-backend:latest
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: always

  frontend:
    image: smartquote-frontend:latest
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_BACKEND_URL=https://api.smartquote.com
    depends_on:
      - backend
```

## CI/CD Pipeline

Zalecane jest korzystanie z GitHub Actions do automatyzacji testów i wdrożeń.

### Przykładowy Workflow (.github/workflows/deploy.yml):
1. **Linting & Testing**: Sprawdzenie jakości kodu.
2. **Build**: Budowanie artefaktów.
3. **Deploy**: Wysłanie na środowisko docelowe.

## Monitoring i Logowanie

- **Frontend**: Wykorzystaj wbudowane narzędzia Netlify Analytics lub Vercel Analytics.
- **Backend**: Zalecane ELK Stack (Elasticsearch, Logstash, Kibana) lub Sentry do śledzenia błędów w czasie rzeczywistym.

## Procedura Rollback

W przypadku krytycznego błędu po wdrożeniu:
1. **Netlify**: Przejdź do sekcji "Deploys" i kliknij "Rollback" przy poprzedniej stabilnej wersji.
2. **Docker**: Zmień tag obrazu na poprzednią wersję i zrestartuj kontenery.
3. **Git**: Jeśli konieczne, wykonaj `git revert` na gałęzi produkcyjnej.
