import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'
import { applyPrintPagination } from '../src/lib/pdf/puppeteer'
import { buildDefaultBlocks } from '../src/lib/pdf/proposal-blocks'
import { buildProposalHtml } from '../src/lib/pdf/proposal-html'
import { buildDefaultShopBlocks } from '../src/lib/pdf/shop-blocks'
import { buildShopHtml } from '../src/lib/pdf/shop-html'
import { buildDefaultWebsiteV2Blocks } from '../src/lib/pdf/website-v2-blocks'
import { buildWebsiteV2Html } from '../src/lib/pdf/website-v2-html'
import { buildDefaultWebsiteV3Blocks } from '../src/lib/pdf/website-v3-blocks'
import { buildWebsiteV3Html } from '../src/lib/pdf/website-v3-html'
import { buildDefaultSupportBlocks } from '../src/lib/pdf/support-blocks'
import { buildSupportHtml } from '../src/lib/pdf/support-html'
import { buildDefaultMobileAppBlocks } from '../src/lib/pdf/mobile-app-blocks'
import { buildMobileAppHtml } from '../src/lib/pdf/mobile-app-html'
import { buildDefaultMobileSimpleBlocks } from '../src/lib/pdf/mobile-simple-blocks'
import { buildMobileSimpleHtml } from '../src/lib/pdf/mobile-simple-html'
import { buildDefaultUniversalBlocks } from '../src/lib/pdf/universal-blocks'
import { buildUniversalHtml } from '../src/lib/pdf/universal-html'
import { buildDefaultContractBlocks } from '../src/lib/pdf/contract-short-blocks'
import { buildContractShortHtml } from '../src/lib/pdf/contract-short-html'
import { buildDefaultContractServicesBlocks } from '../src/lib/pdf/contract-services-blocks'
import { buildContractServicesHtml } from '../src/lib/pdf/contract-services-html'
import { buildDefaultContractDedicatedBlocks } from '../src/lib/pdf/contract-dedicated-blocks'
import { buildContractDedicatedHtml } from '../src/lib/pdf/contract-dedicated-html'
import { buildDefaultContractSlaBlocks } from '../src/lib/pdf/contract-sla-blocks'
import { buildContractSlaHtml } from '../src/lib/pdf/contract-sla-html'
import { buildDefaultContractMobileBlocks } from '../src/lib/pdf/contract-mobile-blocks'
import { buildContractMobileHtml } from '../src/lib/pdf/contract-mobile-html'

const localEnv = await fs.readFile(path.resolve('.env.local'), 'utf8')
for (const line of localEnv.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (!match || process.env[match[1].trim()]) continue
    process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '')
}

const outputDir = path.resolve('test-results/pdf-layout-audit')
const filler = ' Szczegółowy opis obejmuje analizę, wdrożenie, testy jakościowe oraz przekazanie kompletnej dokumentacji.'
const layoutKeys = new Set(['sections', 'page1Sections', 'page2Sections'])

function stress<T>(input: T, key = ''): T {
    if (typeof input === 'string') {
        return (input.length >= 35 && !/^https?:/i.test(input) ? `${input}${filler}` : input) as T
    }
    if (Array.isArray(input)) {
        const values = input.map(value => stress(value, key))
        if (!layoutKeys.has(key) && values.length >= 2 && values.length <= 4 && values.every(value => value && typeof value === 'object')) {
            return [...values, ...values.slice(0, 2).map(value => structuredClone(value))] as T
        }
        return values as T
    }
    if (input && typeof input === 'object') {
        return Object.fromEntries(
            Object.entries(input).map(([childKey, value]) => [childKey, stress(value, childKey)]),
        ) as T
    }
    return input
}

const commonOffer = {
    number: 'OFF/2026/AUDYT', title: 'Kompleksowa realizacja projektu cyfrowego', totalGross: 24900,
    currency: 'PLN', paymentDays: 14, createdAt: '2026-06-21T10:00:00.000Z',
    client: { name: 'Przykładowy Klub Sportowy', company: 'Klub Sportowy' },
    user: {
        name: 'Jan Kowalski', email: 'kontakt@example.com', avatar: null,
        companyInfo: { name: 'SmartQuote Studio', website: 'https://example.com', logo: null, logoLight: null, logoDark: null, phone: '+48 500 600 700', email: 'kontakt@example.com' },
    },
}

const compactOffer = {
    offerNumber: commonOffer.number, offerDate: '21.06.2026', validUntil: '05.07.2026',
    clientName: commonOffer.client.name, userCompanyName: commonOffer.user.companyInfo.name,
    userEmail: commonOffer.user.email, userPhone: commonOffer.user.companyInfo.phone,
    userWebsite: commonOffer.user.companyInfo.website,
}

type TemplateCase = { name: string; build: (stressed: boolean) => string }

const cases: TemplateCase[] = [
    { name: 'offer-proposal', build: long => buildProposalHtml({ ...commonOffer, blocks: long ? stress(buildDefaultBlocks(commonOffer.client.name)) : buildDefaultBlocks(commonOffer.client.name) }) },
    { name: 'offer-shop', build: long => buildShopHtml({ ...commonOffer, blocks: long ? stress(buildDefaultShopBlocks()) : buildDefaultShopBlocks() }) },
    { name: 'offer-website-v2', build: long => buildWebsiteV2Html({ ...commonOffer, blocks: long ? stress(buildDefaultWebsiteV2Blocks()) : buildDefaultWebsiteV2Blocks() }) },
    { name: 'offer-website-v3', build: long => buildWebsiteV3Html({ ...commonOffer, blocks: long ? stress(buildDefaultWebsiteV3Blocks()) : buildDefaultWebsiteV3Blocks() }) },
    { name: 'offer-support', build: long => buildSupportHtml(long ? stress(buildDefaultSupportBlocks()) : buildDefaultSupportBlocks(), compactOffer) },
    { name: 'offer-mobile-app', build: long => buildMobileAppHtml(long ? stress(buildDefaultMobileAppBlocks()) : buildDefaultMobileAppBlocks(), compactOffer) },
    { name: 'offer-mobile-simple', build: long => buildMobileSimpleHtml(long ? stress(buildDefaultMobileSimpleBlocks()) : buildDefaultMobileSimpleBlocks(), compactOffer) },
    { name: 'offer-universal', build: long => buildUniversalHtml(long ? stress(buildDefaultUniversalBlocks()) : buildDefaultUniversalBlocks(), compactOffer) },
    { name: 'contract-short', build: long => buildContractShortHtml(long ? stress(buildDefaultContractBlocks()) : buildDefaultContractBlocks()) },
    { name: 'contract-services', build: long => buildContractServicesHtml(long ? stress(buildDefaultContractServicesBlocks()) : buildDefaultContractServicesBlocks()) },
    { name: 'contract-dedicated', build: long => buildContractDedicatedHtml(long ? stress(buildDefaultContractDedicatedBlocks()) : buildDefaultContractDedicatedBlocks()) },
    { name: 'contract-sla', build: long => buildContractSlaHtml(long ? stress(buildDefaultContractSlaBlocks()) : buildDefaultContractSlaBlocks()) },
    { name: 'contract-mobile', build: long => buildContractMobileHtml(long ? stress(buildDefaultContractMobileBlocks()) : buildDefaultContractMobileBlocks()) },
]
const selectedCases = process.argv[2] ? cases.filter(item => item.name.includes(process.argv[2])) : cases

await fs.mkdir(outputDir, { recursive: true })
const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
if (!executablePath) throw new Error('PUPPETEER_EXECUTABLE_PATH is required')
const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const report: unknown[] = []

try {
    for (const template of selectedCases) {
        for (const long of [false, true]) {
            const variant = long ? 'stress' : 'default'
            const page = await browser.newPage()
            await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 })
            await page.emulateMediaType('print')
            const html = applyPrintPagination(template.build(long))
            await page.setContent(html, { waitUntil: 'load' })
            await page.evaluate(() => document.fonts.ready)
            const visibleText = await page.evaluate(() => document.body.innerText)
            const diagnostics = await page.evaluate(() => {
                const viewportWidth = document.documentElement.clientWidth
                const pageHeight = 1122.52
                const elements = Array.from(document.querySelectorAll<HTMLElement>('body *'))
                const horizontal = elements.flatMap(element => {
                    const rect = element.getBoundingClientRect()
                    if (rect.width < 1 || rect.height < 1 || getComputedStyle(element).position === 'fixed') return []
                    if (rect.left >= -1 && rect.right <= viewportWidth + 1) return []
                    return [{ tag: element.tagName, cls: element.className.toString().slice(0, 100), text: (element.textContent || '').trim().slice(0, 120), style: element.getAttribute('style')?.slice(0, 180), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) }]
                }).slice(0, 30)
                const oversizedAvoid = elements.flatMap(element => {
                    const style = getComputedStyle(element)
                    const rect = element.getBoundingClientRect()
                    if (!style.breakInside.includes('avoid') || rect.height <= pageHeight - 20) return []
                    return [{ tag: element.tagName, cls: element.className.toString().slice(0, 100), height: Math.round(rect.height) }]
                }).slice(0, 30)
                return { viewportWidth, scrollWidth: document.documentElement.scrollWidth, horizontal, oversizedAvoid }
            })
            const pdfPath = path.join(outputDir, `${template.name}-${variant}.pdf`)
            const textPath = path.join(outputDir, `${template.name}-${variant}.txt`)
            await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } })
            await fs.writeFile(textPath, visibleText)
            report.push({ template: template.name, variant, ...diagnostics, pdfPath, textPath })
            await page.close()
        }
    }
} finally {
    await browser.close()
}

await fs.writeFile(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
