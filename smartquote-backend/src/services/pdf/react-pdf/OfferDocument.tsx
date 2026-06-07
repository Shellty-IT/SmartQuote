import React from 'react'
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { PDFOffer } from '../types'
import { txt, money, date, statusMap, groupItemsByVariant } from '../helpers'
import { HtmlContent } from './html-content'
import './fonts'

const PRIMARY = '#0891b2'
const PRIMARY_LIGHT = '#e0f2fe'
const BG = '#f1f5f9'
const TEXT = '#1e293b'
const TEXT_MUTED = '#475569'
const TEXT_LIGHT = '#64748b'
const BORDER = '#e2e8f0'
const WHITE = '#ffffff'

const s = StyleSheet.create({
    page: {
        fontFamily: 'DejaVu',
        fontSize: 8,
        color: TEXT,
        paddingBottom: 50,
    },
    // ─── Header ───────────────────────────────────────────────────────────────
    header: {
        backgroundColor: PRIMARY,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        paddingHorizontal: 40,
    },
    headerLeft: { flexDirection: 'column', gap: 3 },
    headerTitle: { color: WHITE, fontSize: 14, fontWeight: 'bold', fontFamily: 'DejaVu', letterSpacing: 0.5 },
    headerSubtitle: { color: '#e0f2fe', fontSize: 8, fontFamily: 'DejaVu' },
    headerNumber: { color: '#bae6fd', fontSize: 8.5, fontFamily: 'DejaVu' },
    headerRight: { alignItems: 'flex-end', gap: 3 },
    headerLogoWrap: { alignItems: 'flex-end', marginBottom: 4 },
    headerLogo: { height: 36, maxWidth: 130, objectFit: 'contain' },
    headerCompany: { color: WHITE, fontSize: 9, fontWeight: 'bold', fontFamily: 'DejaVu' },
    headerInfo: { color: '#e0f2fe', fontSize: 7.5, fontFamily: 'DejaVu' },
    headerWebsite: { color: '#bae6fd', fontSize: 7.5, fontFamily: 'DejaVu' },

    // ─── Content wrapper ──────────────────────────────────────────────────────
    content: { paddingHorizontal: 40, paddingTop: 10 },

    // ─── Parties ──────────────────────────────────────────────────────────────
    partiesRow: { flexDirection: 'row', gap: 19, marginBottom: 8 },
    partyBox: { flex: 1, backgroundColor: BG },
    partyLabel: {
        backgroundColor: PRIMARY,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    partyLabelText: { color: WHITE, fontSize: 8, fontWeight: 'bold', fontFamily: 'DejaVu' },
    partyBody: { padding: 8 },
    partyName: { fontSize: 9, fontWeight: 'bold', color: TEXT, fontFamily: 'DejaVu', marginBottom: 3 },
    partyInfo: { fontSize: 7.5, color: TEXT_MUTED, fontFamily: 'DejaVu', marginBottom: 1.5 },

    // ─── Metadata bar ─────────────────────────────────────────────────────────
    metaBar: {
        flexDirection: 'row',
        backgroundColor: BG,
        padding: 6,
        marginBottom: 10,
    },
    metaCell: { flex: 1, paddingHorizontal: 6 },
    metaLabel: { fontSize: 7, color: TEXT_LIGHT, fontFamily: 'DejaVu', marginBottom: 1 },
    metaValue: { fontSize: 9, fontWeight: 'bold', color: TEXT, fontFamily: 'DejaVu' },

    // ─── Title / description ──────────────────────────────────────────────────
    offerTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: TEXT,
        fontFamily: 'DejaVu',
        marginBottom: 4,
    },

    // ─── Items table ──────────────────────────────────────────────────────────
    tableSection: { marginBottom: 10 },
    variantHeader: {
        backgroundColor: PRIMARY_LIGHT,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginBottom: 4,
    },
    variantHeaderText: { fontSize: 9, fontWeight: 'bold', color: PRIMARY, fontFamily: 'DejaVu' },
    sharedHeader: {
        backgroundColor: BG,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginBottom: 4,
    },
    sharedHeaderText: { fontSize: 9, fontWeight: 'bold', color: TEXT_MUTED, fontFamily: 'DejaVu' },

    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: PRIMARY,
        borderWidth: 0.4,
        borderColor: '#000000',
        borderStyle: 'solid',
    },
    tableRow: {
        flexDirection: 'row',
        borderWidth: 0.3,
        borderColor: '#000000',
        borderStyle: 'solid',
    },
    tableRowAlt: { backgroundColor: '#f8fafc' },
    tableRowEven: { backgroundColor: WHITE },

    cellLp: { width: '4%', paddingVertical: 3, paddingHorizontal: 2, textAlign: 'center' },
    cellName: { width: '40%', paddingVertical: 3, paddingHorizontal: 2, textAlign: 'left' },
    cellQty: { width: '7%', paddingVertical: 3, paddingHorizontal: 2, textAlign: 'right' },
    cellUnit: { width: '6%', paddingVertical: 3, paddingHorizontal: 2, textAlign: 'right' },
    cellPrice: { width: '11%', paddingVertical: 3, paddingHorizontal: 2, textAlign: 'right' },
    cellVat: { width: '7%', paddingVertical: 3, paddingHorizontal: 2, textAlign: 'right' },
    cellDiscount: { width: '7%', paddingVertical: 3, paddingHorizontal: 2, textAlign: 'right' },
    cellTotal: { width: '18%', paddingVertical: 3, paddingHorizontal: 2, textAlign: 'right' },

    tableHeaderCell: { color: WHITE, fontSize: 7, fontWeight: 'bold', fontFamily: 'DejaVu' },
    tableCell: { fontSize: 7, color: TEXT, fontFamily: 'DejaVu' },

    // ─── Variant summary ──────────────────────────────────────────────────────
    variantSummary: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 4,
        marginBottom: 8,
    },
    variantSummaryRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    summaryLabel: { fontSize: 8, color: TEXT_LIGHT, fontFamily: 'DejaVu' },
    summaryValue: { fontSize: 8, fontWeight: 'bold', color: TEXT, fontFamily: 'DejaVu', minWidth: 80, textAlign: 'right' },

    // ─── Totals ───────────────────────────────────────────────────────────────
    totalsSection: { alignItems: 'flex-end', marginBottom: 12 },
    totalRow: { flexDirection: 'row', marginBottom: 3, gap: 8, alignItems: 'center' },
    totalLabel: { fontSize: 9, color: TEXT, fontFamily: 'DejaVu', minWidth: 60 },
    totalValue: { fontSize: 9, fontWeight: 'bold', color: TEXT, fontFamily: 'DejaVu', minWidth: 100, textAlign: 'right' },
    grandTotalBox: {
        flexDirection: 'row',
        backgroundColor: PRIMARY,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginTop: 4,
        alignItems: 'center',
        gap: 8,
        minWidth: 280,
    },
    grandTotalLabel: { color: WHITE, fontSize: 8, fontWeight: 'bold', fontFamily: 'DejaVu', flex: 1, flexShrink: 0, minWidth: 140 },
    grandTotalValue: { color: WHITE, fontSize: 8, fontWeight: 'bold', fontFamily: 'DejaVu', minWidth: 100, textAlign: 'right' },

    // ─── Section label ────────────────────────────────────────────────────────
    sectionLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: TEXT,
        fontFamily: 'DejaVu',
        marginBottom: 4,
    },

    // ─── Signature ────────────────────────────────────────────────────────────
    signatureSection: { alignItems: 'flex-end', marginTop: 16 },
    signatureLine: { borderTopWidth: 0.5, borderTopColor: BORDER, borderTopStyle: 'solid', width: 175, marginBottom: 3 },
    signatureLabel: { fontSize: 7, color: '#94a3b8', fontFamily: 'DejaVu', width: 175, textAlign: 'center' },

    // ─── Footer ───────────────────────────────────────────────────────────────
    footer: {
        position: 'absolute',
        bottom: 15,
        left: 40,
        right: 40,
    },
    footerLine: { borderTopWidth: 0.5, borderTopColor: BORDER, borderTopStyle: 'solid', marginBottom: 4 },
    footerText: { fontSize: 7, color: '#94a3b8', fontFamily: 'DejaVu', textAlign: 'center' },
})

// ─── Sub-components ───────────────────────────────────────────────────────────

function OfferHeader({ offer }: { offer: PDFOffer }) {
    const companyName = txt(offer.user.company || offer.user.name || offer.user.email)
    const website = offer.user.website ? offer.user.website.replace(/^https?:\/\//, '') : null
    const logoSrc = offer.user.logo
        ? `data:image/png;base64,${offer.user.logo.replace(/^data:image\/\w+;base64,/, '')}`
        : null
    return (
        <View style={s.header}>
            {/* Left — offer identity */}
            <View style={s.headerLeft}>
                <Text style={s.headerTitle}>OFERTA HANDLOWA</Text>
                <Text style={s.headerNumber}>Nr: {offer.number}</Text>
            </View>
            {/* Right — company identity */}
            <View style={s.headerRight}>
                {logoSrc ? (
                    <View style={s.headerLogoWrap}>
                        <Image src={logoSrc} style={s.headerLogo} />
                    </View>
                ) : null}
                <Text style={s.headerCompany}>{companyName}</Text>
                {offer.user.nip ? <Text style={s.headerInfo}>NIP: {offer.user.nip}</Text> : null}
                {offer.user.email ? <Text style={s.headerInfo}>{offer.user.email}</Text> : null}
                {offer.user.phone ? <Text style={s.headerInfo}>{offer.user.phone}</Text> : null}
                {website ? <Text style={s.headerWebsite}>{website}</Text> : null}
            </View>
        </View>
    )
}

function PartiesSection({ offer }: { offer: PDFOffer }) {
    const clientName = txt(
        offer.client.type === 'COMPANY'
            ? offer.client.company || offer.client.name
            : offer.client.name,
    )
    const addrLine = [offer.user.address, offer.user.postalCode, offer.user.city]
        .filter(Boolean)
        .join(', ')

    return (
        <View style={s.partiesRow}>
            {/* Sprzedawca */}
            <View style={s.partyBox}>
                <View style={s.partyLabel}>
                    <Text style={s.partyLabelText}>SPRZEDAWCA</Text>
                </View>
                <View style={s.partyBody}>
                    <Text style={s.partyName}>
                        {txt(offer.user.company || offer.user.name || offer.user.email)}
                    </Text>
                    {offer.user.nip ? <Text style={s.partyInfo}>NIP: {offer.user.nip}</Text> : null}
                    {addrLine ? <Text style={s.partyInfo}>{addrLine}</Text> : null}
                    {offer.user.email ? <Text style={s.partyInfo}>{offer.user.email}</Text> : null}
                    {offer.user.phone ? <Text style={s.partyInfo}>{offer.user.phone}</Text> : null}
                </View>
            </View>
            {/* Nabywca */}
            <View style={s.partyBox}>
                <View style={s.partyLabel}>
                    <Text style={s.partyLabelText}>NABYWCA</Text>
                </View>
                <View style={s.partyBody}>
                    <Text style={s.partyName}>{clientName}</Text>
                    {offer.client.nip ? <Text style={s.partyInfo}>NIP: {offer.client.nip}</Text> : null}
                    {offer.client.address ? <Text style={s.partyInfo}>{offer.client.address}</Text> : null}
                    {offer.client.city ? (
                        <Text style={s.partyInfo}>
                            {[offer.client.postalCode, offer.client.city].filter(Boolean).join(' ')}
                        </Text>
                    ) : null}
                    {offer.client.email ? <Text style={s.partyInfo}>{offer.client.email}</Text> : null}
                </View>
            </View>
        </View>
    )
}

function MetaBar({ offer }: { offer: PDFOffer }) {
    const infos: [string, string][] = [
        ['Data', date(offer.createdAt)],
        ['Ważna do', date(offer.validUntil)],
        ['Status', statusMap[offer.status] ?? offer.status],
        ['Płatność', `${offer.paymentDays} dni`],
    ]
    return (
        <View style={s.metaBar}>
            {infos.map(([label, value]) => (
                <View key={label} style={s.metaCell}>
                    <Text style={s.metaLabel}>{label}</Text>
                    <Text style={s.metaValue}>{value}</Text>
                </View>
            ))}
        </View>
    )
}

function ItemsTable({ offer }: { offer: PDFOffer }) {
    const variantGroups = groupItemsByVariant(offer.items)
    const hasVariants = variantGroups.some(g => g.name !== null)

    const TableHeader = () => (
        <View style={s.tableHeaderRow}>
            <View style={s.cellLp}><Text style={s.tableHeaderCell}>Lp</Text></View>
            <View style={s.cellName}><Text style={s.tableHeaderCell}>Nazwa</Text></View>
            <View style={s.cellQty}><Text style={s.tableHeaderCell}>Ilość</Text></View>
            <View style={s.cellUnit}><Text style={s.tableHeaderCell}>Jm</Text></View>
            <View style={s.cellPrice}><Text style={s.tableHeaderCell}>Cena netto</Text></View>
            <View style={s.cellVat}><Text style={s.tableHeaderCell}>VAT</Text></View>
            <View style={s.cellDiscount}><Text style={s.tableHeaderCell}>Rabat</Text></View>
            <View style={s.cellTotal}><Text style={s.tableHeaderCell}>Wartość netto</Text></View>
        </View>
    )

    let rowIndex = 0

    return (
        <View style={s.tableSection}>
            {variantGroups.map((group, gi) => {
                const isVariantGroup = group.name !== null
                return (
                    <View key={gi}>
                        {hasVariants && (
                            <View style={isVariantGroup ? s.variantHeader : s.sharedHeader}>
                                <Text style={isVariantGroup ? s.variantHeaderText : s.sharedHeaderText}>
                                    {isVariantGroup ? `Wariant: ${group.name}` : 'Pozycje wspólne'}
                                </Text>
                            </View>
                        )}
                        <TableHeader />
                        {group.items.map((item) => {
                            const idx = rowIndex++
                            const qty = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity)
                            const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : Number(item.unitPrice)
                            const vatRate = typeof item.vatRate === 'number' ? item.vatRate : Number(item.vatRate)
                            const discount = typeof item.discount === 'number' ? item.discount : Number(item.discount)
                            const totalNet = typeof item.totalNet === 'number' ? item.totalNet : Number(item.totalNet)
                            return (
                                <View
                                    key={idx}
                                    style={[s.tableRow, idx % 2 === 0 ? s.tableRowEven : s.tableRowAlt]}
                                    wrap={false}
                                >
                                    <View style={s.cellLp}><Text style={s.tableCell}>{idx + 1}</Text></View>
                                    <View style={s.cellName}><Text style={s.tableCell}>{item.name}</Text></View>
                                    <View style={s.cellQty}><Text style={s.tableCell}>{String(qty)}</Text></View>
                                    <View style={s.cellUnit}><Text style={s.tableCell}>{item.unit}</Text></View>
                                    <View style={s.cellPrice}><Text style={s.tableCell}>{money(unitPrice, '')}</Text></View>
                                    <View style={s.cellVat}><Text style={s.tableCell}>{vatRate}%</Text></View>
                                    <View style={s.cellDiscount}>
                                        <Text style={s.tableCell}>{discount > 0 ? `${discount}%` : '-'}</Text>
                                    </View>
                                    <View style={s.cellTotal}><Text style={s.tableCell}>{money(totalNet, '')}</Text></View>
                                </View>
                            )
                        })}
                        {hasVariants && (
                            <View style={s.variantSummary}>
                                <View>
                                    <View style={s.variantSummaryRow}>
                                        <Text style={s.summaryLabel}>Netto sekcji:</Text>
                                        <Text style={s.summaryValue}>{money(group.totalNet, offer.currency)}</Text>
                                    </View>
                                    <View style={s.variantSummaryRow}>
                                        <Text style={s.summaryLabel}>Brutto sekcji:</Text>
                                        <Text style={s.summaryValue}>{money(group.totalGross, offer.currency)}</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                )
            })}
        </View>
    )
}

function TotalsSection({ offer }: { offer: PDFOffer }) {
    return (
        <View style={s.totalsSection} wrap={false}>
            <View style={s.totalRow}>
                <Text style={s.totalLabel}>Netto:</Text>
                <Text style={s.totalValue}>{money(offer.totalNet, offer.currency)}</Text>
            </View>
            <View style={s.totalRow}>
                <Text style={s.totalLabel}>VAT:</Text>
                <Text style={s.totalValue}>{money(offer.totalVat, offer.currency)}</Text>
            </View>
            <View style={s.grandTotalBox}>
                <Text style={s.grandTotalLabel}>Razem do zapłaty:</Text>
                <Text style={s.grandTotalValue}>{money(offer.totalGross, offer.currency)}</Text>
            </View>
        </View>
    )
}

function Footer({ offer }: { offer: PDFOffer }) {
    const website = offer.user.website ? offer.user.website.replace(/^https?:\/\//, '') : null
    const companyName = offer.user.company || offer.user.name || null
    return (
        <View fixed style={s.footer}>
            <View style={s.footerLine} />
            <Text style={s.footerText}>
                {companyName ? `${companyName}` : ''}
                {website ? `${companyName ? ' · ' : ''}${website}` : ''}
                {` · ${date(new Date())}`}
            </Text>
        </View>
    )
}

// ─── Page component (re-usable in combined documents) ─────────────────────────

export function OfferDocumentPage({ offer }: { offer: PDFOffer }) {
    return (
        <Page size="A4" style={s.page}>
            <OfferHeader offer={offer} />

            <View style={s.content}>
                <PartiesSection offer={offer} />
                <MetaBar offer={offer} />

                {offer.title ? (
                    <Text style={s.offerTitle}>{offer.title}</Text>
                ) : null}

                {offer.description ? (
                    <HtmlContent
                        html={offer.description}
                        style={{ marginBottom: 8 }}
                        textColor={TEXT_LIGHT}
                    />
                ) : null}

                <ItemsTable offer={offer} />
                <TotalsSection offer={offer} />

                {offer.terms ? (
                    <View style={{ marginBottom: 12 }}>
                        <Text style={s.sectionLabel}>Warunki:</Text>
                        <HtmlContent html={offer.terms} textColor={TEXT_LIGHT} />
                    </View>
                ) : null}

                <View style={s.signatureSection} wrap={false}>
                    <View style={s.signatureLine} />
                    <Text style={s.signatureLabel}>Podpis</Text>
                </View>
            </View>

            <Footer offer={offer} />
        </Page>
    )
}

export function OfferDocument({ offer }: { offer: PDFOffer }) {
    return (
        <Document>
            <OfferDocumentPage offer={offer} />
        </Document>
    )
}
