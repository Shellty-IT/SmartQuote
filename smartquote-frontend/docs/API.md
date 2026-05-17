# API Documentation

Dokumentacja punktów końcowych (endpoints) systemu SmartQuote-AI.

## Informacje ogólne
Wszystkie endpointy zaczynają się od `/api`. Wymagają one nagłówka autoryzacji:
`Authorization: Bearer <TOKEN>`

## 1. Klienci (/api/clients)

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/clients` | Pobiera listę wszystkich klientów |
| GET | `/clients/:id` | Pobiera szczegóły konkretnego klienta |
| POST | `/clients` | Dodaje nowego klienta |
| PUT | `/clients/:id` | Aktualizuje dane klienta |
| DELETE | `/clients/:id` | Usuwa klienta |
| GET | `/clients/stats` | Pobiera statystyki dotyczące klientów |

**Przykład Requestu (POST):**
```json
{
  "type": "COMPANY",
  "name": "Acme Corp",
  "email": "contact@acme.com",
  "nip": "1234567890"
}
```

## 2. Oferty (/api/offers)

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/offers` | Pobiera listę ofert |
| GET | `/offers/:id` | Szczegóły oferty |
| POST | `/offers` | Utworzenie nowej oferty |
| POST | `/offers/:id/duplicate` | Duplikacja oferty |
| GET | `/offers/:id/pdf` | Pobranie oferty w formacie PDF |

## 3. AI (/api/ai)

| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/ai/chat` | Interakcja z chatbotem AI |
| POST | `/ai/generate-offer` | Generowanie oferty na podstawie opisu |
| GET | `/ai/analyze-client/:id` | Analiza klienta przez AI |

**Przykład użycia (cURL):**
```bash
curl -X POST https://api.smartquote.ai/api/ai/chat \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"message": "Pomóż mi przygotować ofertę dla dewelopera"}'
```

## 4. Kody Błędów

| Kod | Status | Znaczenie |
|-----|--------|-----------|
| `UNKNOWN_ERROR` | 500 | Wystąpił nieoczekiwany błąd serwera |
| `NETWORK_ERROR` | 0 | Problem z połączeniem |
| `DOWNLOAD_ERROR` | 400 | Nie udało się pobrać pliku |
| `UNAUTHORIZED` | 401 | Brak ważnego tokenu autoryzacji |

## Przykłady Użycia

### JavaScript (fetch)
```javascript
const response = await fetch('/api/clients', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

### Python (requests)
```python
import requests

headers = {"Authorization": f"Bearer {token}"}
response = requests.get("https://api.smartquote.ai/api/clients", headers=headers)
clients = response.json()
```
