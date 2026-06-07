// src/services/pdf/helpers.ts
import { Decimal } from '@prisma/client/runtime/library'

export interface TableItem {
    name: string
    quantity: Decimal | number
    unit: string
    unitPrice: Decimal | number
    vatRate: Decimal | number
    discount: Decimal | number
    totalNet: Decimal | number
    totalVat: Decimal | number
    totalGross: Decimal | number
    variantName?: string | null
}

export const txt = (text: string | null | undefined): string => text ?? ''

/** Strip HTML tags and decode common entities — used when rendering rich text as plain text */
export const stripHtml = (html: string | null | undefined): string => {
    if (!html) return ''
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&nbsp;/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

export const money = (amount: Decimal | number, cur = 'PLN'): string => {
    const n = typeof amount === 'number' ? amount : Number(amount)
    return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (cur ? ' ' + cur : '')
}

export const date = (d: Date | string | null): string => {
    if (!d) return '-'
    const dt = new Date(d)
    const day = String(dt.getDate()).padStart(2, '0')
    const month = String(dt.getMonth() + 1).padStart(2, '0')
    const year = dt.getFullYear()
    return `${day}.${month}.${year}`
}

export const dateTime = (d: Date | string | null): string => {
    if (!d) return '-'
    const dt = new Date(d)
    const day = String(dt.getDate()).padStart(2, '0')
    const month = String(dt.getMonth() + 1).padStart(2, '0')
    const year = dt.getFullYear()
    const h = String(dt.getHours()).padStart(2, '0')
    const m = String(dt.getMinutes()).padStart(2, '0')
    const s = String(dt.getSeconds()).padStart(2, '0')
    return `${day}.${month}.${year} ${h}:${m}:${s}`
}

export const statusMap: Record<string, string> = {
    DRAFT: 'Szkic',
    SENT: 'Wysłana',
    VIEWED: 'Wyświetlona',
    NEGOTIATION: 'Negocjacje',
    ACCEPTED: 'Zaakceptowana',
    REJECTED: 'Odrzucona',
    EXPIRED: 'Wygasła',
}

export const contractStatusMap: Record<string, string> = {
    DRAFT: 'Szkic',
    PENDING_SIGNATURE: 'Do podpisu',
    ACTIVE: 'Aktywna',
    COMPLETED: 'Zakończona',
    TERMINATED: 'Rozwiązana',
    EXPIRED: 'Wygasła',
}

export function groupItemsByVariant(items: TableItem[]): Array<{
    name: string | null
    items: TableItem[]
    totalNet: Decimal
    totalVat: Decimal
    totalGross: Decimal
}> {
    const hasVariants = items.some(item => item.variantName)
    if (!hasVariants) {
        return [
            {
                name: null,
                items,
                totalNet: items.reduce((s, i) => s.plus(i.totalNet), new Decimal(0)),
                totalVat: items.reduce((s, i) => s.plus(i.totalVat), new Decimal(0)),
                totalGross: items.reduce((s, i) => s.plus(i.totalGross), new Decimal(0)),
            },
        ]
    }

    const groups: ReturnType<typeof groupItemsByVariant> = []

    const baseItems = items.filter(i => !i.variantName)
    if (baseItems.length > 0) {
        groups.push({
            name: null,
            items: baseItems,
            totalNet: baseItems.reduce((s, i) => s.plus(i.totalNet), new Decimal(0)),
            totalVat: baseItems.reduce((s, i) => s.plus(i.totalVat), new Decimal(0)),
            totalGross: baseItems.reduce((s, i) => s.plus(i.totalGross), new Decimal(0)),
        })
    }

    const variantNames = [
        ...new Set(items.filter(i => i.variantName).map(i => i.variantName!)),
    ]
    for (const vName of variantNames) {
        const vItems = items.filter(i => i.variantName === vName)
        groups.push({
            name: vName,
            items: vItems,
            totalNet: vItems.reduce((s, i) => s.plus(i.totalNet), new Decimal(0)),
            totalVat: vItems.reduce((s, i) => s.plus(i.totalVat), new Decimal(0)),
            totalGross: vItems.reduce((s, i) => s.plus(i.totalGross), new Decimal(0)),
        })
    }

    return groups
}
