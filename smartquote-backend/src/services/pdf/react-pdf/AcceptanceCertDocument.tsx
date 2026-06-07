import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { PDFOffer, PDFAcceptanceLog } from '../types'
import { txt, money, date, dateTime } from '../helpers'
import './fonts'

const SUCCESS = '#059669'
const SUCCESS_LIGHT = '#ecfdf5'
const SUCCESS_BORDER = '#a7f3d0'
const SUCCESS_TEXT = '#065f46'
const SUCCESS_SUBTEXT = '#047857'
const DARK = '#0f172a'
const TEXT = '#1e293b'
const TEXT_LIGHT = '#64748b'
const BORDER = '#e2e8f0'
const WHITE = '#ffffff'

const s = StyleSheet.create({
    page: { fontFamily: 'DejaVu', fontSize: 8, color: TEXT, paddingBottom: 50 },

    // ─── Header ───────────────────────────────────────────────────────────────
    header: {
        backgroundColor: SUCCESS,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 10,
        paddingHorizontal: 40,
    },
    headerTitle: { color: WHITE, fontSize: 16, fontWeight: 'bold', fontFamily: 'DejaVu' },
    headerSubtitle: { color: '#d1fae5', fontSize: 9, fontFamily: 'DejaVu', marginTop: 2 },
    headerRight: { alignItems: 'flex-end' },
    headerBrand: { color: WHITE, fontSize: 8, fontFamily: 'DejaVu' },
    headerDate: { color: WHITE, fontSize: 8, fontFamily: 'DejaVu', marginTop: 2 },

    // ─── Content ──────────────────────────────────────────────────────────────
    content: { paddingHorizontal: 40, paddingTop: 12 },

    // ─── Summary box ──────────────────────────────────────────────────────────
    summaryBox: {
        backgroundColor: SUCCESS_LIGHT,
        borderWidth: 1,
        borderColor: SUCCESS_BORDER,
        borderStyle: 'solid',
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginBottom: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLeft: {},
    summaryTitle: { fontSize: 10, fontWeight: 'bold', color: SUCCESS_TEXT, fontFamily: 'DejaVu' },
    summaryOfferTitle: { fontSize: 9, color: SUCCESS_SUBTEXT, fontFamily: 'DejaVu', marginTop: 2 },
    summaryNumber: { fontSize: 9, fontWeight: 'bold', color: SUCCESS_TEXT, fontFamily: 'DejaVu', marginTop: 3 },
    summaryAmount: { fontSize: 12, fontWeight: 'bold', color: SUCCESS_TEXT, fontFamily: 'DejaVu' },

    // ─── Parties ──────────────────────────────────────────────────────────────
    partiesRow: { flexDirection: 'row', gap: 15, marginBottom: 14 },
    partyBox: { flex: 1 },
    partyLabel: { backgroundColor: SUCCESS, paddingVertical: 4, paddingHorizontal: 8 },
    partyLabelText: { color: WHITE, fontSize: 8, fontWeight: 'bold', fontFamily: 'DejaVu' },
    partyBody: {
        backgroundColor: '#f8fafc',
        borderWidth: 0.5,
        borderColor: BORDER,
        borderStyle: 'solid',
        paddingTop: 8,
        paddingRight: 8,
        paddingBottom: 10,
        paddingLeft: 8,
        minHeight: 50,
    },
    partyName: { fontSize: 9, fontWeight: 'bold', color: TEXT, fontFamily: 'DejaVu', marginBottom: 3 },
    partyInfo: { fontSize: 8, color: TEXT_LIGHT, fontFamily: 'DejaVu' },

    // ─── Section header ───────────────────────────────────────────────────────
    sectionHeader: {
        backgroundColor: DARK,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginBottom: 0,
    },
    sectionHeaderText: { color: WHITE, fontSize: 8, fontWeight: 'bold', fontFamily: 'DejaVu' },

    // ─── Details table ────────────────────────────────────────────────────────
    detailsTable: { marginBottom: 12 },
    detailRow: {
        flexDirection: 'row',
        borderWidth: 0.5,
        borderColor: BORDER,
        borderStyle: 'solid',
        borderTopWidth: 0,
    },
    detailRowFirst: { borderTopWidth: 0.5 },
    detailLabel: { width: 200, paddingVertical: 5, paddingHorizontal: 8, fontSize: 8, color: TEXT_LIGHT, fontFamily: 'DejaVu' },
    detailValue: { flex: 1, paddingVertical: 5, paddingHorizontal: 8, fontSize: 8, fontWeight: 'bold', color: TEXT, fontFamily: 'DejaVu', textAlign: 'right' },

    // ─── User agent ───────────────────────────────────────────────────────────
    uaBox: {
        backgroundColor: '#f8fafc',
        borderWidth: 0.5,
        borderColor: BORDER,
        borderStyle: 'solid',
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginBottom: 12,
        minHeight: 28,
    },
    uaText: { fontSize: 6, color: TEXT_LIGHT, fontFamily: 'DejaVu' },

    // ─── Content hash ─────────────────────────────────────────────────────────
    hashBox: {
        backgroundColor: DARK,
        borderWidth: 0.5,
        borderColor: '#1e293b',
        borderStyle: 'solid',
        padding: 8,
        marginBottom: 4,
    },
    hashText: { fontSize: 7, color: '#34d399', fontFamily: 'DejaVu' },
    hashNote: { fontSize: 7, color: TEXT_LIGHT, fontFamily: 'DejaVu', marginBottom: 12 },

    // ─── Declaration ──────────────────────────────────────────────────────────
    declaration: {
        backgroundColor: SUCCESS_LIGHT,
        borderWidth: 1,
        borderColor: SUCCESS_BORDER,
        borderStyle: 'solid',
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    declarationTitle: { fontSize: 8, fontWeight: 'bold', color: SUCCESS_TEXT, fontFamily: 'DejaVu', marginBottom: 4 },
    declarationText: { fontSize: 7, color: SUCCESS_SUBTEXT, fontFamily: 'DejaVu', lineHeight: 1.5 },

    // ─── Footer ───────────────────────────────────────────────────────────────
    footer: { position: 'absolute', bottom: 15, left: 40, right: 40 },
    footerLine: { borderTopWidth: 0.5, borderTopColor: BORDER, borderTopStyle: 'solid', marginBottom: 4 },
    footerText: { fontSize: 7, color: '#94a3b8', fontFamily: 'DejaVu', textAlign: 'center' },
})

export function AcceptanceCertPage({ offer, log }: { offer: PDFOffer; log: PDFAcceptanceLog }) {
    return <AcceptanceCertPageContent offer={offer} log={log} />
}

export function AcceptanceCertDocument({ offer, log }: { offer: PDFOffer; log: PDFAcceptanceLog }) {
    return (
        <Document>
            <AcceptanceCertPage offer={offer} log={log} />
        </Document>
    )
}

function AcceptanceCertPageContent({ offer, log }: { offer: PDFOffer; log: PDFAcceptanceLog }) {
    const details: [string, string][] = [
        ['Data i czas akceptacji', dateTime(log.acceptedAt)],
        ['Kwota netto', money(log.totalNet, log.currency)],
        ['Kwota VAT', money(log.totalVat, log.currency)],
        ['Kwota brutto', money(log.totalGross, log.currency)],
    ]
    if (log.selectedVariant) details.push(['Wybrany wariant', txt(log.selectedVariant)])
    details.push(
        ['Adres IP', log.ipAddress],
        ['Klient (nabywca)', txt(
            offer.client.type === 'COMPANY'
                ? offer.client.company || offer.client.name
                : offer.client.name,
        )],
    )
    if (offer.client.nip) details.push(['NIP nabywcy', offer.client.nip])

    const uaMaxLength = 180
    const uaTruncated =
        log.userAgent.length > uaMaxLength ? log.userAgent.slice(0, uaMaxLength) + '...' : log.userAgent

    return (
        <Page size="A4" style={s.page}>
            {/* Header */}
                <View style={s.header}>
                    <View>
                        <Text style={s.headerTitle}>CERTIFICATE OF ACCEPTANCE</Text>
                        <Text style={s.headerSubtitle}>Formalne potwierdzenie akceptacji oferty</Text>
                    </View>
                    <View style={s.headerRight}>
                        <Text style={s.headerBrand}>SmartQuote AI</Text>
                        <Text style={s.headerDate}>{dateTime(log.acceptedAt)}</Text>
                    </View>
                </View>

                <View style={s.content}>
                    {/* Summary */}
                    <View style={s.summaryBox} wrap={false}>
                        <View style={s.summaryLeft}>
                            <Text style={s.summaryTitle}>Oferta zaakceptowana</Text>
                            <Text style={s.summaryOfferTitle}>{txt(offer.title)}</Text>
                            <Text style={s.summaryNumber}>Nr: {offer.number}</Text>
                        </View>
                        <Text style={s.summaryAmount}>{money(log.totalGross, log.currency)}</Text>
                    </View>

                    {/* Parties */}
                    <View style={s.partiesRow} wrap={false}>
                        <View style={s.partyBox}>
                            <View style={s.partyLabel}>
                                <Text style={s.partyLabelText}>AKCEPTUJĄCY</Text>
                            </View>
                            <View style={s.partyBody}>
                                <Text style={s.partyName}>{txt(log.clientName || '-')}</Text>
                                <Text style={s.partyInfo}>{log.clientEmail || '-'}</Text>
                            </View>
                        </View>
                        <View style={s.partyBox}>
                            <View style={s.partyLabel}>
                                <Text style={s.partyLabelText}>SPRZEDAWCA</Text>
                            </View>
                            <View style={s.partyBody}>
                                <Text style={s.partyName}>
                                    {txt(offer.user.company || offer.user.name || '')}
                                </Text>
                                <Text style={s.partyInfo}>{offer.user.email}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Details */}
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionHeaderText}>SZCZEGÓŁY AKCEPTACJI</Text>
                    </View>
                    <View style={s.detailsTable}>
                        {details.map(([label, value], idx) => (
                            <View
                                key={label}
                                style={[
                                    s.detailRow,
                                    idx === 0 ? s.detailRowFirst : {},
                                    { backgroundColor: idx % 2 === 0 ? WHITE : '#f8fafc' },
                                ]}
                            >
                                <Text style={s.detailLabel}>{label}</Text>
                                <Text style={s.detailValue}>{value}</Text>
                            </View>
                        ))}
                    </View>

                    {/* User Agent */}
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionHeaderText}>USER AGENT</Text>
                    </View>
                    <View style={[s.uaBox, { marginBottom: 12 }]}>
                        <Text style={s.uaText}>{uaTruncated}</Text>
                    </View>

                    {/* Content hash */}
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionHeaderText}>CONTENT HASH (SHA-256)</Text>
                    </View>
                    <View style={s.hashBox}>
                        <Text style={s.hashText}>{log.contentHash}</Text>
                    </View>
                    <Text style={s.hashNote}>
                        Hash SHA-256 wygenerowany z zawartości oferty (pozycje, ceny, wariant, waluta).
                        Służy do weryfikacji integralności danych w momencie akceptacji.
                    </Text>

                    {/* Declaration */}
                    <View style={s.declaration} wrap={false}>
                        <Text style={s.declarationTitle}>Oświadczenie</Text>
                        <Text style={s.declarationText}>
                            Niniejszy certyfikat potwierdza, że osoba wskazana powyżej zaakceptowała ofertę nr{' '}
                            {offer.number} w dniu {dateTime(log.acceptedAt)}. Dane zostały zarejestrowane
                            automatycznie przez system SmartQuote AI i są niemodyfikowalne. Hash SHA-256
                            umożliwia weryfikację integralności treści oferty w momencie akceptacji.
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <View fixed style={s.footer}>
                    <View style={s.footerLine} />
                    <Text style={s.footerText}>
                        Certificate of Acceptance | SmartQuote AI | Wygenerowano: {dateTime(new Date())}
                    </Text>
                </View>
        </Page>
    )
}
