import React from 'react'
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { PDFContract, PDFSignatureLog } from '../types'
import { txt, money, dateTime } from '../helpers'
import './fonts'

const PRIMARY = '#059669'
const PRIMARY_LIGHT = '#ecfdf5'
const SUCCESS_BORDER = '#a7f3d0'
const SUCCESS_TEXT = '#065f46'
const SUCCESS_SUBTEXT = '#047857'
const DARK = '#0f172a'
const TEXT = '#1e293b'
const TEXT_LIGHT = '#64748b'
const BORDER = '#e2e8f0'
const WHITE = '#ffffff'
const HEADER_SUBTEXT = '#d1fae5'
const ROW_ALT = '#f8fafc'

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
    headerTitle: { color: WHITE, fontSize: 16, fontWeight: 'bold', fontFamily: 'DejaVu' },
    headerSubtitle: { color: HEADER_SUBTEXT, fontSize: 9, fontFamily: 'DejaVu', marginTop: 2 },
    headerRight: { alignItems: 'flex-end' },
    headerBrand: { color: WHITE, fontSize: 8, fontFamily: 'DejaVu' },
    headerDate: { color: WHITE, fontSize: 8, fontFamily: 'DejaVu', marginTop: 2 },

    content: { paddingHorizontal: 40, paddingTop: 12 },

    summaryBox: {
        backgroundColor: PRIMARY_LIGHT,
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
    summaryTitle: { fontSize: 10, fontWeight: 'bold', color: SUCCESS_TEXT, fontFamily: 'DejaVu' },
    summarySubtitle: { fontSize: 9, color: SUCCESS_SUBTEXT, fontFamily: 'DejaVu', marginTop: 2 },
    summaryNumber: { fontSize: 9, fontWeight: 'bold', color: SUCCESS_TEXT, fontFamily: 'DejaVu', marginTop: 3 },
    summaryAmount: { fontSize: 12, fontWeight: 'bold', color: SUCCESS_TEXT, fontFamily: 'DejaVu' },

    partiesRow: { flexDirection: 'row', gap: 15, marginBottom: 14 },
    partyBox: { flex: 1 },
    partyLabel: { backgroundColor: PRIMARY, paddingVertical: 4, paddingHorizontal: 8 },
    partyLabelText: { color: WHITE, fontSize: 8, fontWeight: 'bold', fontFamily: 'DejaVu' },
    partyBody: {
        backgroundColor: ROW_ALT,
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

    sectionHeader: { backgroundColor: DARK, paddingVertical: 4, paddingHorizontal: 8, marginBottom: 0 },
    sectionHeaderText: { color: WHITE, fontSize: 8, fontWeight: 'bold', fontFamily: 'DejaVu' },

    // Signature image
    signatureImageBox: {
        backgroundColor: WHITE,
        borderWidth: 0.5,
        borderColor: BORDER,
        borderStyle: 'solid',
        height: 90,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    signatureImg: { width: 250, height: 80, objectFit: 'contain' },
    signaturePlaceholder: { fontSize: 9, color: TEXT_LIGHT, fontFamily: 'DejaVu' },

    // Details table
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

    uaBox: {
        backgroundColor: ROW_ALT,
        borderWidth: 0.5,
        borderColor: BORDER,
        borderStyle: 'solid',
        paddingVertical: 4,
        paddingHorizontal: 8,
        minHeight: 28,
        marginBottom: 12,
    },
    uaText: { fontSize: 6, color: TEXT_LIGHT, fontFamily: 'DejaVu' },

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

    declaration: {
        backgroundColor: PRIMARY_LIGHT,
        borderWidth: 1,
        borderColor: SUCCESS_BORDER,
        borderStyle: 'solid',
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    declarationTitle: { fontSize: 8, fontWeight: 'bold', color: SUCCESS_TEXT, fontFamily: 'DejaVu', marginBottom: 4 },
    declarationText: { fontSize: 7, color: SUCCESS_SUBTEXT, fontFamily: 'DejaVu', lineHeight: 1.5 },

    footer: { position: 'absolute', bottom: 15, left: 40, right: 40 },
    footerLine: { borderTopWidth: 0.5, borderTopColor: BORDER, borderTopStyle: 'solid', marginBottom: 4 },
    footerText: { fontSize: 7, color: '#94a3b8', fontFamily: 'DejaVu', textAlign: 'center' },
})

export function SignatureCertPage({
    contract,
    log,
}: {
    contract: PDFContract
    log: PDFSignatureLog
}) {
    return <SignatureCertContent contract={contract} log={log} />
}

export function SignatureCertDocument({
    contract,
    log,
}: {
    contract: PDFContract
    log: PDFSignatureLog
}) {
    return (
        <Document>
            <SignatureCertPage contract={contract} log={log} />
        </Document>
    )
}

function SignatureCertContent({
    contract,
    log,
}: {
    contract: PDFContract
    log: PDFSignatureLog
}) {
    const details: [string, string][] = [
        ['Data i czas podpisu', dateTime(log.signedAt)],
        ['Kwota netto', money(log.totalNet, log.currency)],
        ['Kwota VAT', money(log.totalVat, log.currency)],
        ['Kwota brutto', money(log.totalGross, log.currency)],
        ['Adres IP', log.ipAddress],
        ['Zleceniodawca', txt(
            contract.client.type === 'COMPANY'
                ? contract.client.company || contract.client.name
                : contract.client.name,
        )],
    ]
    if (contract.client.nip) details.push(['NIP zleceniodawcy', contract.client.nip])

    const uaMaxLength = 180
    const uaTruncated =
        log.userAgent.length > uaMaxLength ? log.userAgent.slice(0, uaMaxLength) + '...' : log.userAgent

    const signatureSrc = log.signatureImage.startsWith('data:')
        ? log.signatureImage
        : `data:image/png;base64,${log.signatureImage}`

    return (
        <Page size="A4" style={s.page}>
            {/* Header */}
                <View style={s.header}>
                    <View>
                        <Text style={s.headerTitle}>CERTIFICATE OF SIGNATURE</Text>
                        <Text style={s.headerSubtitle}>Formalne potwierdzenie podpisu umowy</Text>
                    </View>
                    <View style={s.headerRight}>
                        <Text style={s.headerBrand}>SmartQuote AI</Text>
                        <Text style={s.headerDate}>{dateTime(log.signedAt)}</Text>
                    </View>
                </View>

                <View style={s.content}>
                    {/* Summary */}
                    <View style={s.summaryBox} wrap={false}>
                        <View>
                            <Text style={s.summaryTitle}>Umowa podpisana</Text>
                            <Text style={s.summarySubtitle}>{txt(contract.title)}</Text>
                            <Text style={s.summaryNumber}>Nr: {contract.number}</Text>
                        </View>
                        <Text style={s.summaryAmount}>{money(log.totalGross, log.currency)}</Text>
                    </View>

                    {/* Parties */}
                    <View style={s.partiesRow} wrap={false}>
                        <View style={s.partyBox}>
                            <View style={s.partyLabel}>
                                <Text style={s.partyLabelText}>PODPISUJĄCY</Text>
                            </View>
                            <View style={s.partyBody}>
                                <Text style={s.partyName}>{txt(log.signerName)}</Text>
                                <Text style={s.partyInfo}>{log.signerEmail}</Text>
                            </View>
                        </View>
                        <View style={s.partyBox}>
                            <View style={s.partyLabel}>
                                <Text style={s.partyLabelText}>WYKONAWCA</Text>
                            </View>
                            <View style={s.partyBody}>
                                <Text style={s.partyName}>
                                    {txt(contract.user.company || contract.user.name || '')}
                                </Text>
                                <Text style={s.partyInfo}>{contract.user.email}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Signature image */}
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionHeaderText}>PODPIS ELEKTRONICZNY</Text>
                    </View>
                    <View style={s.signatureImageBox}>
                        {signatureSrc ? (
                            <Image src={signatureSrc} style={s.signatureImg} />
                        ) : (
                            <Text style={s.signaturePlaceholder}>Podpis niedostępny</Text>
                        )}
                    </View>

                    {/* Details */}
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionHeaderText}>SZCZEGÓŁY PODPISU</Text>
                    </View>
                    <View style={s.detailsTable}>
                        {details.map(([label, value], idx) => (
                            <View
                                key={label}
                                style={[
                                    s.detailRow,
                                    idx === 0 ? s.detailRowFirst : {},
                                    { backgroundColor: idx % 2 === 0 ? '#ffffff' : ROW_ALT },
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
                    <View style={s.uaBox}>
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
                        Hash SHA-256 wygenerowany z zawartości umowy (pozycje, ceny, waluta). Służy do
                        weryfikacji integralności danych w momencie podpisu.
                    </Text>

                    {/* Declaration */}
                    <View style={s.declaration} wrap={false}>
                        <Text style={s.declarationTitle}>Oświadczenie</Text>
                        <Text style={s.declarationText}>
                            Niniejszy certyfikat potwierdza, że osoba wskazana powyżej podpisała umowę nr{' '}
                            {contract.number} w dniu {dateTime(log.signedAt)}. Podpis elektroniczny i dane
                            zostały zarejestrowane automatycznie przez system SmartQuote AI i są
                            niemodyfikowalne. Hash SHA-256 umożliwia weryfikację integralności treści umowy
                            w momencie podpisu.
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <View fixed style={s.footer}>
                    <View style={s.footerLine} />
                    <Text style={s.footerText}>
                        Certificate of Signature | SmartQuote AI | Wygenerowano: {dateTime(new Date())}
                    </Text>
                </View>
        </Page>
    )
}
