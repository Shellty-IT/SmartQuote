// src/services/pdf/offer-document-renderer.ts
import { PDFOffer } from './types';
import { txt, stripHtml, money, date, statusMap, groupItemsByVariant, renderItemsTable } from './helpers';
import { PDF_CONFIG } from './pdf-config';
import { Decimal } from '@prisma/client/runtime/library';
import { offerPartiesRenderer } from './offer-parties-renderer';

type VariantGroupInternal = {
    name: string | null;
    items: Array<{
        name: string;
        quantity: Decimal | number;
        unit: string;
        unitPrice: Decimal | number;
        vatRate: Decimal | number;
        discount: Decimal | number;
        totalNet: Decimal | number;
        totalVat: Decimal | number;
        totalGross: Decimal | number;
        variantName?: string | null;
    }>;
    totalNet: Decimal;
    totalVat: Decimal;
    totalGross: Decimal;
};

const PARTY_BOX_MIN_HEIGHT = 90;
const PARTY_BOX_LINES_BASE_Y = 32;
const PARTY_BOX_LINE_HEIGHT = 10;
const PARTY_BOX_PADDING_BOTTOM = 12;
const FOOTER_Y = 800;

function estimatePartyBoxHeight(lineCount: number): number {
    return PARTY_BOX_LINES_BASE_Y + lineCount * PARTY_BOX_LINE_HEIGHT + PARTY_BOX_PADDING_BOTTOM;
}

export class OfferDocumentRenderer {
    private readonly config = PDF_CONFIG;

    render(doc: PDFKit.PDFDocument, offer: PDFOffer): number {
        let Y = 40;

        offerPartiesRenderer.renderHeader(doc, offer);
        Y = this.renderPartiesDynamic(doc, offer, 60);
        Y = this.renderMetadata(doc, offer, Y);
        Y = this.renderDescription(doc, offer, Y);
        Y = this.renderItems(doc, offer, Y);
        Y = this.renderSummary(doc, offer, Y);
        Y = this.renderTerms(doc, offer, Y);
        Y = this.renderSignature(doc, Y);
        this.renderFooter(doc);

        return Y;
    }

    private renderPartiesDynamic(doc: PDFKit.PDFDocument, offer: PDFOffer, Y: number): number {
        const { layout, dimensions } = this.config;
        const { partyBoxWidth, partyBoxGap } = dimensions;

        const sellerLines = this.countSellerLines(offer);
        const buyerLines = this.countBuyerLines(offer);
        const boxHeight = Math.max(
            PARTY_BOX_MIN_HEIGHT,
            estimatePartyBoxHeight(Math.max(sellerLines, buyerLines)),
        );

        offerPartiesRenderer.renderPartiesWithHeight(
            doc, offer, layout.leftMargin, Y, partyBoxWidth, partyBoxGap, boxHeight,
        );

        return Y + boxHeight + 10;
    }

    private countSellerLines(offer: PDFOffer): number {
        let lines = 1;
        if (offer.user.nip) lines++;
        if (offer.user.address) lines++;
        if (offer.user.email) lines++;
        if (offer.user.phone) lines++;
        return lines;
    }

    private countBuyerLines(offer: PDFOffer): number {
        let lines = 1;
        if (offer.client.nip) lines++;
        if (offer.client.address) lines++;
        if (offer.client.city) lines++;
        if (offer.client.email) lines++;
        return lines;
    }

    private renderMetadata(doc: PDFKit.PDFDocument, offer: PDFOffer, Y: number): number {
        const { colors, layout, sizes, dimensions } = this.config;

        doc.rect(layout.leftMargin, Y, layout.contentWidth, dimensions.metadataHeight)
            .fill(colors.background);

        const infos: [string, string][] = [
            ['Data', date(offer.createdAt)],
            ['Ważna do', date(offer.validUntil)],
            ['Status', statusMap[offer.status] || offer.status],
            ['Płatność', offer.paymentDays + ' dni'],
        ];

        const iW = layout.contentWidth / 4;
        infos.forEach(([lbl, val], i) => {
            const x = layout.leftMargin + i * iW + 6;
            doc.font('Regular').fontSize(sizes.tiny).fillColor(colors.textLight).text(lbl, x, Y + 4);
            doc.font('Bold').fontSize(sizes.header).fillColor(colors.text).text(val, x, Y + 13);
        });

        return Y + 32;
    }

    private renderDescription(doc: PDFKit.PDFDocument, offer: PDFOffer, Y: number): number {
        const { colors, layout, sizes } = this.config;

        if (offer.title) {
            doc.font('Bold').fontSize(sizes.subtitle).fillColor(colors.text)
                .text(txt(offer.title), layout.leftMargin, Y);
            Y += 16;
        }
        if (offer.description) {
            const descText = stripHtml(offer.description);
            doc.font('Regular').fontSize(sizes.normal).fillColor(colors.textLight);
            const descHeight = doc.heightOfString(descText, { width: layout.contentWidth });
            doc.text(descText, layout.leftMargin, Y, { width: layout.contentWidth });
            Y += descHeight + 8;
        }

        return Y;
    }

    private renderItems(doc: PDFKit.PDFDocument, offer: PDFOffer, Y: number): number {
        const { colors, layout, dimensions } = this.config;
        const variantGroups = groupItemsByVariant(offer.items);
        const hasVariants = variantGroups.some((g) => g.name !== null);

        for (const group of variantGroups) {
            if (Y > dimensions.pageBreakThreshold) { doc.addPage(); Y = 40; }
            if (hasVariants) { Y = this.renderVariantHeader(doc, group, Y); }

            Y = renderItemsTable(
                doc,
                group.items,
                Y,
                colors.primary,
                layout.contentWidth,
                layout.leftMargin,
                dimensions.pageBreakThreshold,
            );

            if (hasVariants) { Y = this.renderVariantSummary(doc, group, offer.currency, Y); }
            Y += 8;
        }

        return Y;
    }

    private renderVariantHeader(doc: PDFKit.PDFDocument, group: VariantGroupInternal, Y: number): number {
        const { colors, layout, sizes } = this.config;
        const label = group.name ? 'Wariant: ' + txt(group.name) : 'Pozycje wspólne';

        doc.rect(layout.leftMargin, Y, layout.contentWidth, 20)
            .fill(group.name ? colors.primaryLight : colors.background);
        doc.font('Bold').fontSize(sizes.header)
            .fillColor(group.name ? colors.primary : colors.textMuted)
            .text(label, layout.leftMargin + 8, Y + 5);

        return Y + 24;
    }

    private renderVariantSummary(
        doc: PDFKit.PDFDocument,
        group: VariantGroupInternal,
        currency: string,
        Y: number,
    ): number {
        const { colors, layout, sizes, dimensions } = this.config;
        const subX = layout.leftMargin + layout.contentWidth - dimensions.summaryOffsetX;

        Y += 4;
        doc.font('Regular').fontSize(sizes.normal).fillColor(colors.textLight).text('Netto sekcji:', subX, Y);
        doc.font('Bold').fontSize(sizes.normal).fillColor(colors.text)
            .text(money(group.totalNet, currency), subX + 70, Y, { width: 90, align: 'right' });
        Y += 12;
        doc.font('Regular').fontSize(sizes.normal).fillColor(colors.textLight).text('Brutto sekcji:', subX, Y);
        doc.font('Bold').fontSize(sizes.normal).fillColor(colors.text)
            .text(money(group.totalGross, currency), subX + 70, Y, { width: 90, align: 'right' });

        return Y + 16;
    }

    private renderSummary(doc: PDFKit.PDFDocument, offer: PDFOffer, Y: number): number {
        const { colors, layout, sizes, dimensions } = this.config;
        const { summaryBoxWidth, summaryBoxHeight } = dimensions;
        const summaryOffsetX = summaryBoxWidth;
        const sumX = layout.leftMargin + layout.contentWidth - summaryOffsetX;

        if (Y > dimensions.pageBreakSoft) { doc.addPage(); Y = 40; }

        Y += 4;
        doc.font('Regular').fontSize(sizes.header).fillColor(colors.text).text('Netto:', sumX, Y);
        doc.font('Bold').text(money(offer.totalNet, offer.currency), sumX + 60, Y, { width: 120, align: 'right' });
        Y += 14;
        doc.font('Regular').text('VAT:', sumX, Y);
        doc.font('Bold').text(money(offer.totalVat, offer.currency), sumX + 60, Y, { width: 120, align: 'right' });
        Y += 18;

        doc.rect(sumX, Y, summaryBoxWidth, summaryBoxHeight).fill(colors.primary);

        doc.save();
        doc.strokeColor('#000000').lineWidth(0.5);
        doc.rect(sumX, Y, summaryBoxWidth, summaryBoxHeight).stroke();
        doc.restore();

        const labelWidth = 90;
        const valueWidth = summaryBoxWidth - labelWidth - 8;
        const textY = Y + Math.floor((summaryBoxHeight - 9) / 2);

        doc.font('Bold').fontSize(7.5).fillColor('#fff')
            .text('Razem do zapłaty:', sumX + 4, textY, { width: labelWidth });

        doc.font('Bold').fontSize(7.5).fillColor('#fff')
            .text(money(offer.totalGross, offer.currency), sumX + 4 + labelWidth, textY, {
                width: valueWidth,
                align: 'right',
            });

        return Y + summaryBoxHeight + 13;
    }

    private renderTerms(doc: PDFKit.PDFDocument, offer: PDFOffer, Y: number): number {
        const { colors, layout, sizes, dimensions } = this.config;

        if (!offer.terms) return Y;
        if (Y > dimensions.pageBreakSoft) { doc.addPage(); Y = 40; }

        doc.font('Bold').fontSize(sizes.header).fillColor(colors.text).text('Warunki:', layout.leftMargin, Y);
        Y += 12;
        doc.font('Regular').fontSize(sizes.normal).fillColor(colors.textLight);
        const termsText = stripHtml(offer.terms);
        const termsHeight = doc.heightOfString(termsText, { width: layout.contentWidth });
        doc.text(termsText, layout.leftMargin, Y, { width: layout.contentWidth });

        return Y + termsHeight + 13;
    }

    private renderSignature(doc: PDFKit.PDFDocument, Y: number): number {
        const { colors } = this.config;

        doc.moveTo(380, Y + 20).lineTo(555, Y + 20).stroke(colors.border);
        doc.font('Regular').fontSize(7).fillColor('#94a3b8')
            .text('Podpis', 380, Y + 24, { width: 175, align: 'center' });

        return Y;
    }

    private renderFooter(doc: PDFKit.PDFDocument): void {
        const { colors, layout } = this.config;
        const { leftMargin, contentWidth } = layout;

        doc.moveTo(leftMargin, FOOTER_Y)
            .lineTo(leftMargin + contentWidth, FOOTER_Y)
            .stroke(colors.border);

        doc.font('Regular').fontSize(7).fillColor('#94a3b8')
            .text(
                'Wygenerowano w SmartQuote AI | ' + date(new Date()),
                leftMargin,
                FOOTER_Y + 5,
                { width: contentWidth, align: 'center' },
            );
    }
}

export const offerDocumentRenderer = new OfferDocumentRenderer();