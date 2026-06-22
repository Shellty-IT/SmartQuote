import { buildProposalHtml } from './proposal-html'
import { buildShopHtml } from './shop-html'
import { buildWebsiteV2Html } from './website-v2-html'
import { buildWebsiteV3Html } from './website-v3-html'
import { buildSupportHtml } from './support-html'
import { buildMobileAppHtml } from './mobile-app-html'
import { buildMobileSimpleHtml } from './mobile-simple-html'
import { buildUniversalHtml } from './universal-html'
import { mergeSupportWithDefaults, buildDefaultSupportBlocks } from './support-blocks'
import { mergeMobileAppWithDefaults, buildDefaultMobileAppBlocks } from './mobile-app-blocks'
import { mergeMobileSimpleWithDefaults, buildDefaultMobileSimpleBlocks } from './mobile-simple-blocks'
import { mergeUniversalWithDefaults, buildDefaultUniversalBlocks } from './universal-blocks'

interface PublicTemplateOffer {
    number: string
    title: string
    totalGross: number
    currency: string
    paymentDays: number
    createdAt: string
    templateType: string
    blocks: unknown | null
    client: { name: string; company: string | null }
    seller: {
        name: string | null; email: string; company: string | null; website: string | null
        logo: string | null; logoLight?: string | null; logoDark?: string | null; avatar?: string | null; phone: string | null
    }
}

export function buildPublicOfferHtml(offer: PublicTemplateOffer): string | null {
    const companyInfo = {
        name: offer.seller.company,
        website: offer.seller.website,
        logo: offer.seller.logo,
        logoLight: offer.seller.logoLight,
        logoDark: offer.seller.logoDark,
        phone: offer.seller.phone,
        email: offer.seller.email,
    }
    const fullOffer = { ...offer, user: { name: offer.seller.name, email: offer.seller.email, avatar: offer.seller.avatar, companyInfo } }
    const compactOffer = {
        offerNumber: offer.number,
        offerDate: new Date(offer.createdAt).toLocaleDateString('pl-PL'),
        clientName: offer.client.name,
        userLogoUrl: offer.seller.logo ?? undefined,
        userLogoDarkUrl: offer.seller.logoDark ?? undefined,
        userCompanyName: offer.seller.company ?? offer.seller.name ?? undefined,
        userEmail: offer.seller.email,
        userPhone: offer.seller.phone ?? undefined,
        userWebsite: offer.seller.website ?? undefined,
    }

    switch (offer.templateType) {
        case 'proposal': return buildProposalHtml(fullOffer)
        case 'shop': return buildShopHtml(fullOffer)
        case 'website_v2': return buildWebsiteV2Html(fullOffer)
        case 'website_v3': return buildWebsiteV3Html(fullOffer)
        case 'support': return buildSupportHtml(offer.blocks ? mergeSupportWithDefaults(offer.blocks) : buildDefaultSupportBlocks(), compactOffer)
        case 'mobile_app': return buildMobileAppHtml(offer.blocks ? mergeMobileAppWithDefaults(offer.blocks) : buildDefaultMobileAppBlocks(), compactOffer)
        case 'mobile_simple': return buildMobileSimpleHtml(offer.blocks ? mergeMobileSimpleWithDefaults(offer.blocks) : buildDefaultMobileSimpleBlocks(), compactOffer)
        case 'universal': return buildUniversalHtml(offer.blocks ? mergeUniversalWithDefaults(offer.blocks) : buildDefaultUniversalBlocks(), compactOffer)
        default: return null
    }
}
