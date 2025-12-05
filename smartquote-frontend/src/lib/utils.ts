import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'PLN'): string {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency,
    }).format(amount);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...options,
    };
    return new Intl.DateTimeFormat('pl-PL', defaultOptions).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
    return formatDate(date, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatRelativeTime(date: string | Date): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Przed chwilą';
    if (diffMins < 60) return `${diffMins} min temu`;
    if (diffHours < 24) return `${diffHours} godz. temu`;
    if (diffDays < 7) return `${diffDays} dni temu`;
    return formatDate(date);
}

export function getStatusConfig(status: string) {
    const config: Record<string, { label: string; color: string; bgColor: string }> = {
        DRAFT: { label: 'Szkic', color: 'text-slate-600', bgColor: 'bg-slate-100' },
        SENT: { label: 'Wysłana', color: 'text-blue-700', bgColor: 'bg-blue-100' },
        VIEWED: { label: 'Otwarta', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
        NEGOTIATION: { label: 'Negocjacje', color: 'text-amber-700', bgColor: 'bg-amber-100' },
        ACCEPTED: { label: 'Zaakceptowana', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
        REJECTED: { label: 'Odrzucona', color: 'text-red-700', bgColor: 'bg-red-100' },
        EXPIRED: { label: 'Wygasła', color: 'text-gray-700', bgColor: 'bg-gray-100' },
    };
    return config[status] || { label: status, color: 'text-slate-600', bgColor: 'bg-slate-100' };
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}