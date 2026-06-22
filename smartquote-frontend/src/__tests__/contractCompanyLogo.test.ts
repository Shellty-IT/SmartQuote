import { describe, expect, it } from 'vitest'
import { buildDefaultContractBlocks } from '@/lib/pdf/contract-short-blocks'
import { buildDefaultContractServicesBlocks } from '@/lib/pdf/contract-services-blocks'
import { buildDefaultContractDedicatedBlocks } from '@/lib/pdf/contract-dedicated-blocks'
import { buildDefaultContractSlaBlocks } from '@/lib/pdf/contract-sla-blocks'
import { buildDefaultContractMobileBlocks } from '@/lib/pdf/contract-mobile-blocks'
import { buildContractShortHtml } from '@/lib/pdf/contract-short-html'
import { buildContractServicesHtml } from '@/lib/pdf/contract-services-html'
import { buildContractDedicatedHtml } from '@/lib/pdf/contract-dedicated-html'
import { buildContractSlaHtml } from '@/lib/pdf/contract-sla-html'
import { buildContractMobileHtml } from '@/lib/pdf/contract-mobile-html'

const logo = 'data:image/png;base64,company-logo'

describe('contract company logos', () => {
    it.each([
        ['short', buildDefaultContractBlocks, buildContractShortHtml],
        ['services', buildDefaultContractServicesBlocks, buildContractServicesHtml],
        ['dedicated', buildDefaultContractDedicatedBlocks, buildContractDedicatedHtml],
        ['sla', buildDefaultContractSlaBlocks, buildContractSlaHtml],
        ['mobile', buildDefaultContractMobileBlocks, buildContractMobileHtml],
    ] as const)('%s contract renders the configured company logo', (_name, defaults, render) => {
        const blocks = defaults()
        blocks.header.logoDarkUrl = logo
        const html = render(blocks as never)

        expect(html).toContain(`src="${logo}"`)
        expect(html).toContain('alt="Logo firmy"')
    })
})
