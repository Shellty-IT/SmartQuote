// src/components/publicOffer/utils/formatters.ts

export function formatPLN(amount: number): string {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN'
    }).format(amount);
}

export function formatDateTime(isoString: string): string {
    return new Date(isoString).toLocaleString('pl-PL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}