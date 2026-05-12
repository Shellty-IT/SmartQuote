// smartquote_backend/src/services/pdf/helpers.ts
import PDFDocument from 'pdfkit';
import { Decimal } from '@prisma/client/runtime/library';
import path from 'path';
import fs from 'fs';

interface TableItem {
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
}

export function createDoc(): PDFKit.PDFDocument {
    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 80, left: 40, right: 40 },
        layout: 'portrait',
    });

    const fontPaths = [
        path.join(process.cwd(), 'fonts', 'DejaVuSans.ttf'),
        path.join(__dirname, '..', '..', '..', 'fonts', 'DejaVuSans.ttf'),
        path.join(__dirname, '..', '..', '..', '..', 'fonts', 'DejaVuSans.ttf'),
    ];
    const boldFontPaths = [
        path.join(process.cwd(), 'fonts', 'DejaVuSans-Bold.ttf'),
        path.join(__dirname, '..', '..', '..', 'fonts', 'DejaVuSans-Bold.ttf'),
        path.join(__dirname, '..', '..', '..', '..', 'fonts', 'DejaVuSans-Bold.ttf'),
    ];

    const regularFont = fontPaths.find(p => fs.existsSync(p));
    const boldFont = boldFontPaths.find(p => fs.existsSync(p));

    if (regularFont && boldFont) {
        doc.registerFont('Regular', regularFont);
        doc.registerFont('Bold', boldFont);
        doc.registerFont('Mono', regularFont);
    } else {
        doc.registerFont('Regular', 'Helvetica');
        doc.registerFont('Bold', 'Helvetica-Bold');
        doc.registerFont('Mono', 'Courier');
    }

    return doc;
}

export const txt = (text: string | null | undefined): string => text ?? '';

export const money = (amount: Decimal | number, cur = 'PLN'): string => {
    const n = typeof amount === 'number' ? amount : Number(amount);
    return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (cur ? ' ' + cur : '');
};

export const date = (d: Date | string | null): string => {
    if (!d) return '-';
    const dt = new Date(d);
    const day = String(dt.getDate()).padStart(2, '0');
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const year = dt.getFullYear();
    return `${day}.${month}.${year}`;
};

export const dateTime = (d: Date | string | null): string => {
    if (!d) return '-';
    const dt = new Date(d);
    const day = String(dt.getDate()).padStart(2, '0');
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const year = dt.getFullYear();
    const h = String(dt.getHours()).padStart(2, '0');
    const m = String(dt.getMinutes()).padStart(2, '0');
    const s = String(dt.getSeconds()).padStart(2, '0');
    return `${day}.${month}.${year} ${h}:${m}:${s}`;
};

export const statusMap: Record<string, string> = {
    DRAFT: 'Szkic',
    SENT: 'Wysłana',
    VIEWED: 'Wyświetlona',
    NEGOTIATION: 'Negocjacje',
    ACCEPTED: 'Zaakceptowana',
    REJECTED: 'Odrzucona',
    EXPIRED: 'Wygasła',
};

export const contractStatusMap: Record<string, string> = {
    DRAFT: 'Szkic',
    PENDING_SIGNATURE: 'Do podpisu',
    ACTIVE: 'Aktywna',
    COMPLETED: 'Zakończona',
    TERMINATED: 'Rozwiązana',
    EXPIRED: 'Wygasła',
};

export function groupItemsByVariant(items: TableItem[]): Array<{
    name: string | null;
    items: TableItem[];
    totalNet: Decimal;
    totalVat: Decimal;
    totalGross: Decimal;
}> {
    const hasVariants = items.some(item => item.variantName);
    if (!hasVariants) {
        return [{
            name: null,
            items,
            totalNet: items.reduce((s, i) => s.plus(i.totalNet), new Decimal(0)),
            totalVat: items.reduce((s, i) => s.plus(i.totalVat), new Decimal(0)),
            totalGross: items.reduce((s, i) => s.plus(i.totalGross), new Decimal(0)),
        }];
    }

    const groups: ReturnType<typeof groupItemsByVariant> = [];

    const baseItems = items.filter(i => !i.variantName);
    if (baseItems.length > 0) {
        groups.push({
            name: null,
            items: baseItems,
            totalNet: baseItems.reduce((s, i) => s.plus(i.totalNet), new Decimal(0)),
            totalVat: baseItems.reduce((s, i) => s.plus(i.totalVat), new Decimal(0)),
            totalGross: baseItems.reduce((s, i) => s.plus(i.totalGross), new Decimal(0)),
        });
    }

    const variantNames = [...new Set(items.filter(i => i.variantName).map(i => i.variantName!))];
    for (const vName of variantNames) {
        const vItems = items.filter(i => i.variantName === vName);
        groups.push({
            name: vName,
            items: vItems,
            totalNet: vItems.reduce((s, i) => s.plus(i.totalNet), new Decimal(0)),
            totalVat: vItems.reduce((s, i) => s.plus(i.totalVat), new Decimal(0)),
            totalGross: vItems.reduce((s, i) => s.plus(i.totalGross), new Decimal(0)),
        });
    }

    return groups;
}

export function measureTextHeight(
    doc: PDFKit.PDFDocument,
    text: string,
    width: number,
    fontSize: number,
    font: string,
): number {
    doc.font(font).fontSize(fontSize);
    return doc.heightOfString(text, { width });
}

export function renderItemsTable(
    doc: PDFKit.PDFDocument,
    items: TableItem[],
    startY: number,
    accentColor: string,
    W: number,
    L: number,
    pageBreakThreshold = 700,
): number {
    let Y = startY;

    const cols = [22, 210, 38, 33, 58, 38, 38, 78];
    const headers = ['Lp', 'Nazwa', 'Ilość', 'Jm', 'Cena netto', 'VAT', 'Rabat', 'Wartość netto'];

    const tW = cols.reduce((a, b) => a + b, 0);
    const tX = L;

    const renderHeader = (): void => {
        doc.rect(tX, Y, tW, 18).fill(accentColor);

        doc.save();
        doc.strokeColor('#000000').lineWidth(0.4);
        let xLine = tX;
        cols.forEach((colW) => {
            doc.moveTo(xLine, Y).lineTo(xLine, Y + 18).stroke();
            xLine += colW;
        });
        doc.moveTo(xLine, Y).lineTo(xLine, Y + 18).stroke();
        doc.rect(tX, Y, tW, 18).stroke();
        doc.restore();

        let x = tX;
        doc.font('Bold').fontSize(7).fillColor('#fff');
        headers.forEach((h, i) => {
            const align: 'center' | 'right' =
                i === 0 ? 'center' :
                    i === 1 ? 'center' :
                        'right';
            doc.text(h, x + 2, Y + 5, { width: cols[i] - 4, align });
            x += cols[i];
        });
        Y += 18;
    };

    const renderRowBorders = (rowY: number, rowHeight: number): void => {
        doc.save();
        doc.strokeColor('#000000').lineWidth(0.3);
        let x = tX;
        cols.forEach((colW) => {
            doc.moveTo(x, rowY).lineTo(x, rowY + rowHeight).stroke();
            x += colW;
        });
        doc.moveTo(x, rowY).lineTo(x, rowY + rowHeight).stroke();
        doc.rect(tX, rowY, tW, rowHeight).stroke();
        doc.restore();
    };

    renderHeader();

    items.forEach((item, idx) => {
        const nameText = txt(item.name);
        const nameWidth = cols[1] - 4;
        doc.font('Regular').fontSize(7);
        const nameHeight = doc.heightOfString(nameText, { width: nameWidth });
        const rowHeight = Math.max(16, nameHeight + 6);

        if (Y + rowHeight > pageBreakThreshold) {
            doc.addPage();
            Y = 40;
            renderHeader();
        }

        const bg = idx % 2 === 0 ? '#fff' : '#f8fafc';
        doc.rect(tX, Y, tW, rowHeight).fill(bg);

        renderRowBorders(Y, rowHeight);

        const quantity = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity);
        const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : Number(item.unitPrice);
        const totalNet = typeof item.totalNet === 'number' ? item.totalNet : Number(item.totalNet);
        const vatRate = typeof item.vatRate === 'number' ? item.vatRate : Number(item.vatRate);
        const discount = typeof item.discount === 'number' ? item.discount : Number(item.discount);

        const row = [
            String(idx + 1),
            nameText,
            String(quantity),
            item.unit,
            money(unitPrice, ''),
            vatRate + '%',
            discount > 0 ? discount + '%' : '-',
            money(totalNet, ''),
        ];

        let x = tX;
        doc.font('Regular').fontSize(7).fillColor('#1e293b');
        row.forEach((v, i) => {
            const align: 'center' | 'right' =
                i === 0 ? 'center' :
                    i === 1 ? 'center' :
                        'right';
            const cellY = Y + Math.floor((rowHeight - 9) / 2);
            doc.text(v, x + 2, cellY, { width: cols[i] - 4, align });
            x += cols[i];
        });
        Y += rowHeight;
    });

    return Y;
}

export function tryRenderLogo(
    doc: PDFKit.PDFDocument,
    logoBase64: string | null | undefined,
    x: number,
    y: number,
    maxW: number,
    maxH: number
): boolean {
    if (!logoBase64) return false;
    try {
        const base64Data = logoBase64.replace(/^data:image\/\w+;base64,/, '');
        const imgBuffer = Buffer.from(base64Data, 'base64');
        doc.image(imgBuffer, x, y, { fit: [maxW, maxH] });
        return true;
    } catch {
        return false;
    }
}