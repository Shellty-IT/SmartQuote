export const PAGE_BREAK_AFTER_CLASS = 'sq-manual-page-break'

export function pageBreakAfterMarker(): string {
    return `<div class="${PAGE_BREAK_AFTER_CLASS}" aria-hidden="true"></div>`
}

export function withPageBreakAfter(html: string, shouldBreak: boolean): string {
    if (!html || !shouldBreak) return html
    return `${html}\n${pageBreakAfterMarker()}`
}
