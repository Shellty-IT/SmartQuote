import React from 'react'
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { PDFContract } from '../types'
import { txt, money, date, contractStatusMap, groupItemsByVariant } from '../helpers'
import { HtmlContent } from './html-content'
import './fonts'

const PRIMARY = '#059669'
const PRIMARY_LIGHT = '#ecfdf5'
const BG = '#f1f5f9'
const TEXT = '#1e293b'
const TEXT_MUTED = '#475569'
const TEXT_LIGHT = '#64748b'
const BORDER = '#e2e8f0'
const WHITE = '#ffffff'
const HEADER_SUBTEXT = '#d1fae5'

const s = StyleSheet.create({
    page: { fontFamily: 'DejaVu', fontSize: 8, color: TEXT, paddingBottom: 50 },

    header: {
        backgroundColor: PRIMARY,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 10,
        paddingHorizontal: 40,
    },
    headerBrand: { color: WHITE, fontSize: 18, fontWeight: 'bold', fontFamily: 'DejaVu' },
    headerRight: { alignItems: 'flex-end' },
    headerCompany: { color: WHITE, fontSize: 9, fontWeight: 'bold', fontFamily: 'DejaVu' },
    headerInfo: { color: HEADER_SUBTEXT, fontSize: 7.5, fontFamily: 'DejaVu' },
    headerLogo: { height: 34, maxWidth: 120, objectFit: 'contain' },

    content: { paddingHorizontal: 40, paddingTop: 10 },

    contractTitle: { fontSize: 16, fontWeight: 'bold', color: TEXT, fontFamily: 'DejaVu' },
    contractNumber: { fontSize: 10, color: PRIMARY, fontFamily: 'DejaVu' },
    titleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginBottom: 12 },

    partiesRow: { flexDirection: 'row', gap: 19, marginBottom: 8 },
    partyBox: { flex: 1, backgroundColor: BG },
    partyLabel: { backgroundColor: PRIMARY, paddingVertical: 4, paddingHorizontal: 8 },
    partyLabelText: { color: WHITE, fontSize: 8, fontWeight: 'bold', fontFamily: 'DejaVu' },
    partyBody: { padding: 8 },
    partyName: { fontSize: 9, fontWeight: 'bold', color: TEXT, fontFamily: 'DejaVu', marginBottom: 3 },
    partyInfo: { fontSize: 7.5, color: TEXT_MUTED, fontFamily: 'DejaVu', marginBottom: 1.5 },

    metaBar: {
        flexDirection: 'row',
        backgroundColor: BG,
        padding: 6,
        marginBottom: 10,
    },
    metaCell: { flex: 1, paddingHorizontal: 6 },
    metaLabel: { fontSize: 7, color: TEXT_LIGHT, fontFamily: 'DejaVu', marginBottom: 1 },
    metaValue: { fontSize: 9, fontWeight: 'bold', color: TEXT, fontFamily: 'DejaVu' },

    sectionLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: TEXT,
        fontFamily: 'DejaVu',
        marginBottom: 4,
    },

    // Table
    tableSection: { marginBottom: 10 },
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

    // Totals
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
    },
    grandTotalLabel: { color: WHITE, fontSize: 10, fontWeight: 'bold', fontFamily: 'DejaVu', flex: 1 },
    grandTotalValue: { color: WHITE, fontSize: 10, fontWeight: 'bold', fontFamily: 'DejaVu', minWidth: 100, textAlign: 'right' },

    // Signature lines
    signaturesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
    signatureBlock: { width: 175 },
    signatureLine: {
        borderTopWidth: 0.5,
        borderTopColor: BORDER,
        borderTopStyle: 'solid',
        marginBottom: 3,
    },
    signatureLabel: { fontSize: 7, color: '#94a3b8', fontFamily: 'DejaVu', textAlign: 'center' },

    footer: { position: 'absolute', bottom: 15, left: 40, right: 40 },
    footerLine: { borderTopWidth: 0.5, borderTopColor: BORDER, borderTopStyle: 'solid', marginBottom: 4 },
    footerText: { fontSize: 7, color: '#94a3b8', fontFamily: 'DejaVu', textAlign: 'center' },
})

function ContractHeader({ contract }: { contract: PDFContract }) {
    const companyName = txt(contract.user.company || contract.user.name || contract.user.email)
    return (
        <View style={s.header}>
            <View>
                {contract.user.logo ? (
                    <Image
                        src={`data:image/png;base64,${contract.user.logo.replace(/^data:image\/\w+;base64,/, '')}`}
                        style={s.headerLogo}
                    />
                ) : (
                    <Text style={s.headerBrand}>SmartQuote</Text>
                )}
            </View>
            <View style={s.headerRight}>
                <Text style={s.headerCompany}>{companyName}</Text>
                {contract.user.nip ? <Text style={s.headerInfo}>NIP: {contract.user.nip}</Text> : null}
                {contract.user.email ? <Text style={s.headerInfo}>{contract.user.email}</Text> : null}
                {contract.user.phone ? <Text style={s.headerInfo}>{contract.user.phone}</Text> : null}
            </View>
        </View>
    )
}

function ItemsTable({ contract }: { contract: PDFContract }) {
    const variantGroups = groupItemsByVariant(contract.items)

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
            {variantGroups.map((group, gi) => (
                <View key={gi}>
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
                </View>
            ))}
        </View>
    )
}

export function ContractDocumentPage({ contract }: { contract: PDFContract }) {
    return <ContractDocumentContent contract={contract} />
}

export function ContractDocument({ contract }: { contract: PDFContract }) {
    return (
        <Document>
            <ContractDocumentPage contract={contract} />
        </Document>
    )
}

function ContractDocumentContent({ contract }: { contract: PDFContract }) {
    const infos: [string, string][] = [
        ['Data zawarcia', date(contract.createdAt)],
        ['Obowiązuje od', date(contract.startDate)],
        ['Obowiązuje do', date(contract.endDate)],
        ['Status', contractStatusMap[contract.status] ?? contract.status],
    ]

    const clientName = txt(
        contract.client.type === 'COMPANY'
            ? contract.client.company || contract.client.name
            : contract.client.name,
    )

    return (
        <Page size="A4" style={s.page}>
            <ContractHeader contract={contract} />

                <View style={s.content}>
                    <View style={s.titleRow}>
                        <Text style={s.contractTitle}>UMOWA</Text>
                        <Text style={s.contractNumber}>Nr: {contract.number}</Text>
                    </View>

                    {/* Parties */}
                    <View style={s.partiesRow} wrap={false}>
                        <View style={s.partyBox}>
                            <View style={s.partyLabel}>
                                <Text style={s.partyLabelText}>WYKONAWCA</Text>
                            </View>
                            <View style={s.partyBody}>
                                <Text style={s.partyName}>
                                    {txt(contract.user.company || contract.user.name || contract.user.email)}
                                </Text>
                                {contract.user.nip ? (
                                    <Text style={s.partyInfo}>NIP: {contract.user.nip}</Text>
                                ) : null}
                                {contract.user.address ? (
                                    <Text style={s.partyInfo}>
                                        {[contract.user.address, contract.user.postalCode, contract.user.city]
                                            .filter(Boolean)
                                            .join(', ')}
                                    </Text>
                                ) : null}
                                {contract.user.email ? (
                                    <Text style={s.partyInfo}>{contract.user.email}</Text>
                                ) : null}
                                {contract.user.phone ? (
                                    <Text style={s.partyInfo}>{contract.user.phone}</Text>
                                ) : null}
                            </View>
                        </View>
                        <View style={s.partyBox}>
                            <View style={s.partyLabel}>
                                <Text style={s.partyLabelText}>ZLECENIODAWCA</Text>
                            </View>
                            <View style={s.partyBody}>
                                <Text style={s.partyName}>{clientName}</Text>
                                {contract.client.nip ? (
                                    <Text style={s.partyInfo}>NIP: {contract.client.nip}</Text>
                                ) : null}
                                {contract.client.address ? (
                                    <Text style={s.partyInfo}>{contract.client.address}</Text>
                                ) : null}
                                {contract.client.city ? (
                                    <Text style={s.partyInfo}>
                                        {[contract.client.postalCode, contract.client.city]
                                            .filter(Boolean)
                                            .join(' ')}
                                    </Text>
                                ) : null}
                                {contract.client.email ? (
                                    <Text style={s.partyInfo}>{contract.client.email}</Text>
                                ) : null}
                            </View>
                        </View>
                    </View>

                    {/* Metadata */}
                    <View style={s.metaBar} wrap={false}>
                        {infos.map(([label, value]) => (
                            <View key={label} style={s.metaCell}>
                                <Text style={s.metaLabel}>{label}</Text>
                                <Text style={s.metaValue}>{value}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Title + description */}
                    {contract.title ? (
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: TEXT, fontFamily: 'DejaVu', marginBottom: 4 }}>
                            {contract.title}
                        </Text>
                    ) : null}
                    {contract.description ? (
                        <Text style={{ fontSize: 8, color: TEXT_LIGHT, fontFamily: 'DejaVu', marginBottom: 8 }}>
                            {contract.description}
                        </Text>
                    ) : null}

                    <ItemsTable contract={contract} />

                    {/* Totals */}
                    <View style={s.totalsSection} wrap={false}>
                        <View style={s.totalRow}>
                            <Text style={s.totalLabel}>Netto:</Text>
                            <Text style={s.totalValue}>{money(contract.totalNet, contract.currency)}</Text>
                        </View>
                        <View style={s.totalRow}>
                            <Text style={s.totalLabel}>VAT:</Text>
                            <Text style={s.totalValue}>{money(contract.totalVat, contract.currency)}</Text>
                        </View>
                        <View style={s.grandTotalBox}>
                            <Text style={s.grandTotalLabel}>BRUTTO:</Text>
                            <Text style={s.grandTotalValue}>{money(contract.totalGross, contract.currency)}</Text>
                        </View>
                    </View>

                    {/* Terms */}
                    {contract.terms ? (
                        <View style={{ marginBottom: 10 }} wrap={false}>
                            <Text style={s.sectionLabel}>Warunki umowy:</Text>
                            <HtmlContent html={contract.terms} textColor={TEXT_LIGHT} />
                        </View>
                    ) : null}

                    {/* Payment terms */}
                    {contract.paymentTerms ? (
                        <View style={{ marginBottom: 10 }} wrap={false}>
                            <Text style={s.sectionLabel}>Warunki płatności:</Text>
                            <HtmlContent html={contract.paymentTerms} textColor={TEXT_LIGHT} />
                        </View>
                    ) : null}

                    <Text style={{ fontSize: 8, color: TEXT_LIGHT, fontFamily: 'DejaVu', marginBottom: 20 }}>
                        Termin płatności: {contract.paymentDays} dni
                    </Text>

                    {/* Signatures */}
                    <View style={s.signaturesRow} wrap={false}>
                        <View style={s.signatureBlock}>
                            <View style={s.signatureLine} />
                            <Text style={s.signatureLabel}>Podpis Wykonawcy</Text>
                        </View>
                        <View style={s.signatureBlock}>
                            <View style={s.signatureLine} />
                            <Text style={s.signatureLabel}>Podpis Zleceniodawcy</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View fixed style={s.footer}>
                    <View style={s.footerLine} />
                    <Text style={s.footerText}>
                        Wygenerowano w SmartQuote AI | {date(new Date())}
                    </Text>
                </View>
        </Page>
    )
}
