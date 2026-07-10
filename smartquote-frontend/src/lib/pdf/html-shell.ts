// src/lib/pdf/html-shell.ts
// Shared document shell for all Puppeteer-rendered HTML templates.
// Centralises: DOCTYPE + html/head/body boilerplate, EMBEDDED_FONTS injection,
// @page rule generation, and orphan/widow baseline for contracts.

import { EMBEDDED_FONTS_CSS } from './embedded-fonts'

// ── HTML escaping ─────────────────────────────────────────────────────────────

/** Escapes text for safe interpolation into HTML markup and double- or single-quoted attributes. */
export function escapeHtml(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

// ── Document shell ────────────────────────────────────────────────────────────

export interface HtmlDocumentOptions {
    title: string
    /** Raw CSS only — no <style> tags, no EMBEDDED_FONTS. */
    css: string
    body: string
    lang?: string
    /** Raw HTML inserted into <head> after the <style> block (scripts, extra styles). */
    extraHead?: string
}

export function buildHtmlDocument({
    title,
    css,
    body,
    lang = 'pl',
    extraHead = '',
}: HtmlDocumentOptions): string {
    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${EMBEDDED_FONTS_CSS}${css}</style>${extraHead ? '\n' + extraHead : ''}
</head>
<body>
${body}
</body>
</html>`
}

// ── Contract helpers ──────────────────────────────────────────────────────────

export interface ContractPageRuleOptions {
    /** CSS shorthand — default: '16mm 14mm 22mm' */
    margins?: string
    /** @bottom-left content string. Omit to skip the bottom-left counter. */
    bottomLeft?: string
    /** Counter text color — default: '#94A3B8' */
    counterColor?: string
    /** Counter font-size — default: '9px' */
    counterSize?: string
}

export function buildContractPageRule({
    margins = '16mm 14mm 22mm',
    bottomLeft,
    counterColor = '#94A3B8',
    counterSize = '9px',
}: ContractPageRuleOptions = {}): string {
    const blRule = bottomLeft
        ? `@bottom-left{content:"${bottomLeft}";font-size:${counterSize};color:${counterColor};font-family:'Source Sans 3',sans-serif;}`
        : ''
    return `@page{size:A4;margin:${margins};${blRule}@bottom-right{content:"Strona " counter(page) " z " counter(pages);font-size:${counterSize};color:${counterColor};font-family:'Source Sans 3',sans-serif;}}`
}

/** Baseline orphan/widow rules for contract body text. */
export const CONTRACT_ORPHANS_CSS = 'p{orphans:3;widows:3;}li{orphans:3;widows:3;}'
