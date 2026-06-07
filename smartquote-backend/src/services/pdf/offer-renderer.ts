import React from 'react'
import { Document, renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { PDFOffer } from './types'
import { OfferDocumentPage } from './react-pdf/OfferDocument'
import { AcceptanceCertPage } from './react-pdf/AcceptanceCertDocument'
import { createModuleLogger } from '../../lib/logger'

const logger = createModuleLogger('offer-pdf-renderer')

export async function renderOfferPDF(offer: PDFOffer): Promise<Buffer> {
    logger.info({ offerId: offer.id, offerNumber: offer.number }, 'Starting PDF rendering')

    // Build a single Document with offer page(s) + optional acceptance cert page.
    // React-PDF handles automatic page breaks inside each Page component.
    const doc = React.createElement(
        Document,
        null,
        React.createElement(OfferDocumentPage, { offer }),
        offer.acceptanceLog
            ? React.createElement(AcceptanceCertPage, { offer, log: offer.acceptanceLog })
            : null,
    ) as ReactElement<DocumentProps>

    const buffer = await renderToBuffer(doc)
    logger.info({ offerId: offer.id }, 'PDF rendering completed')
    return buffer
}
