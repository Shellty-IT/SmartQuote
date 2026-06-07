import React from 'react'
import { Document, renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { PDFContract } from './types'
import { ContractDocumentPage } from './react-pdf/ContractDocument'
import { SignatureCertPage } from './react-pdf/SignatureCertDocument'
import { createModuleLogger } from '../../lib/logger'

const logger = createModuleLogger('contract-pdf-renderer')

export async function renderContractPDF(contract: PDFContract): Promise<Buffer> {
    logger.info(
        { contractId: contract.id, contractNumber: contract.number },
        'Starting contract PDF rendering',
    )

    // Build a single Document with contract page(s) + optional signature cert page.
    const doc = React.createElement(
        Document,
        null,
        React.createElement(ContractDocumentPage, { contract }),
        contract.signatureLog
            ? React.createElement(SignatureCertPage, { contract, log: contract.signatureLog })
            : null,
    ) as ReactElement<DocumentProps>

    const buffer = await renderToBuffer(doc)
    logger.info({ contractId: contract.id }, 'Contract PDF rendering completed')
    return buffer
}
