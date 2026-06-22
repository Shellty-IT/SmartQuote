import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const TEMPLATE_FILES = [
    '../lib/pdf/proposal-html.ts',
    '../lib/pdf/website-v2-html.ts',
    '../lib/pdf/website-v3-html.ts',
    '../lib/pdf/shop-html.ts',
    '../lib/pdf/support-html.ts',
    '../lib/pdf/universal-html.ts',
    '../lib/pdf/mobile-app-html.ts',
    '../lib/pdf/mobile-simple-html.ts',
    '../lib/pdf/contract-short-html.ts',
    '../lib/pdf/contract-services-html.ts',
    '../lib/pdf/contract-dedicated-html.ts',
    '../lib/pdf/contract-mobile-html.ts',
    '../lib/pdf/contract-sla-html.ts',
]

describe('document template text styling', () => {
    it.each(TEMPLATE_FILES)('%s does not apply yellow backgrounds to ordinary text spans', (relativePath) => {
        const source = readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
        const yellowTextSpan = /<span\b(?=[^>]*\bbackground\s*:\s*#(?:FEF[0-9A-F]{3}|FFF[0-9A-F]{3}))[^>]*>\$\{(?:esc|ph)\(/i

        expect(source).not.toMatch(yellowTextSpan)
    })
})
