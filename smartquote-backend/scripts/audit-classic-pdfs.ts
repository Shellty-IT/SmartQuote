import fs from 'node:fs/promises'
import path from 'node:path'
import { Decimal } from '@prisma/client/runtime/library'
import { renderOfferPDF } from '../src/services/pdf/offer-renderer'
import { renderContractPDF } from '../src/services/pdf/contract-renderer'
import type { PDFClient, PDFContract, PDFOffer, PDFUser } from '../src/services/pdf/types'

const outputDir = path.resolve('../smartquote-frontend/test-results/pdf-layout-audit')
const money = (value: number) => new Decimal(value)
const user: PDFUser = {
    id: 'audit-user', email: 'kontakt@example.com', name: 'Jan Kowalski', company: 'SmartQuote Studio',
    phone: '+48 500 600 700', nip: '1234567890', address: 'ul. Przykladowa 10', city: 'Warszawa',
    postalCode: '00-001', logo: null, website: 'https://example.com',
}
const client: PDFClient = {
    id: 'audit-client', type: 'COMPANY', name: 'Przykladowy Klub Sportowy', email: 'klub@example.com',
    phone: '+48 111 222 333', company: 'Klub Sportowy', nip: '9876543210', address: 'ul. Sportowa 1',
    city: 'Krakow', postalCode: '30-001',
}
const item = (index: number) => ({
    id: `item-${index}`,
    name: `Etap ${index + 1}: kompleksowa realizacja modulu serwisu internetowego`,
    description: 'Analiza potrzeb, projekt, implementacja, testy, optymalizacja i dokumentacja powdrozeniowa.',
    quantity: money(1), unit: 'szt.', unitPrice: money(1500 + index * 100), vatRate: money(23), discount: money(0),
    totalNet: money(1500 + index * 100), totalVat: money((1500 + index * 100) * 0.23),
    totalGross: money((1500 + index * 100) * 1.23),
})
const items = Array.from({ length: 20 }, (_, index) => item(index))
const totalNet = items.reduce((sum, value) => sum.plus(value.totalNet), money(0))
const totalVat = items.reduce((sum, value) => sum.plus(value.totalVat), money(0))
const totalGross = items.reduce((sum, value) => sum.plus(value.totalGross), money(0))

const offer: PDFOffer = {
    id: 'audit-offer', number: 'OFF/2026/AUDYT', title: 'Kompleksowa oferta realizacji serwisu internetowego',
    description: 'Dokument obejmuje pelny zakres realizacji, wdrozenia i opieki nad serwisem klubu sportowego.',
    status: 'DRAFT', totalNet, totalVat, totalGross, currency: 'PLN', validUntil: new Date('2026-07-21'),
    notes: null, terms: 'Realizacja rozpoczyna sie po podpisaniu umowy. Kazdy etap podlega odbiorowi.',
    paymentDays: 14, createdAt: new Date('2026-06-21'), client, user,
    items: items.map((value, index) => ({ ...value, variantName: index < 10 ? 'Wariant podstawowy' : 'Wariant rozszerzony' })),
}
const contract: PDFContract = {
    id: 'audit-contract', number: 'UMW/2026/AUDYT', title: 'Umowa na wykonanie i wdrozenie serwisu internetowego',
    description: offer.description, status: 'DRAFT', totalNet, totalVat, totalGross, currency: 'PLN',
    startDate: new Date('2026-07-01'), endDate: new Date('2026-09-30'), signedAt: null,
    terms: 'Wykonawca realizuje prace zgodnie z harmonogramem, standardami jakosci i dokumentacja.',
    paymentTerms: 'Platnosc etapami na podstawie faktur VAT, w terminie 14 dni od wystawienia.', paymentDays: 14,
    notes: null, createdAt: new Date('2026-06-21'), client, user, items,
}

async function main() {
    await fs.mkdir(outputDir, { recursive: true })
    await fs.writeFile(path.join(outputDir, 'offer-classic-stress.pdf'), await renderOfferPDF(offer))
    await fs.writeFile(path.join(outputDir, 'contract-classic-stress.pdf'), await renderContractPDF(contract))
    console.log('Classic PDFs rendered')
}

void main()
