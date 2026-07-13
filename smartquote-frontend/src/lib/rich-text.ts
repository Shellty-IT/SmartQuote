const BLOCK_END_TAG = /<\/(?:address|article|aside|blockquote|div|h[1-6]|header|li|main|nav|ol|p|pre|section|table|tr|ul)\s*>/gi
const BREAK_TAG = /<br\s*\/?>/gi
const LIST_ITEM_TAG = /<li(?:\s[^>]*)?>/gi
const HTML_TAG = /<[^>]*>/g
const HTML_ENTITY = /&(?:#(\d+)|#x([\da-f]+)|(amp|apos|gt|lt|nbsp|quot));/gi

const NAMED_ENTITIES: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
}

function decodeCodePoint(value: string, radix: number): string {
    const codePoint = Number.parseInt(value, radix)
    if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) {
        return '�'
    }
    return String.fromCodePoint(codePoint)
}

export function richTextToPlainText(value: string): string {
    return value
        .replace(BREAK_TAG, '\n')
        .replace(BLOCK_END_TAG, '\n')
        .replace(LIST_ITEM_TAG, '• ')
        .replace(HTML_TAG, '')
        .replace(HTML_ENTITY, (_entity, decimal: string | undefined, hex: string | undefined, named: string | undefined) => {
            if (decimal) return decodeCodePoint(decimal, 10)
            if (hex) return decodeCodePoint(hex, 16)
            return named ? NAMED_ENTITIES[named.toLowerCase()] : ''
        })
        .replace(/\r/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}
