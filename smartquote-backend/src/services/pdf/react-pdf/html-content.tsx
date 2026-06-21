import React from 'react'
import { Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import parse, { domToReact } from 'html-react-parser'
import type { HTMLReactParserOptions, DOMNode, Element } from 'html-react-parser'

const styles = StyleSheet.create({
    paragraph: {
        fontFamily: 'DejaVu',
        fontSize: 8,
        lineHeight: 1.5,
        color: '#475569',
        marginBottom: 4,
    },
    bold: {
        fontFamily: 'DejaVu',
        fontWeight: 'bold',
    },
    italic: {
        fontStyle: 'italic',
    },
    h1: { fontSize: 13, fontWeight: 'bold', color: '#1e293b', marginBottom: 6, fontFamily: 'DejaVu' },
    h2: { fontSize: 11, fontWeight: 'bold', color: '#1e293b', marginBottom: 5, fontFamily: 'DejaVu' },
    h3: { fontSize: 10, fontWeight: 'bold', color: '#1e293b', marginBottom: 4, fontFamily: 'DejaVu' },
    list: { marginBottom: 4 },
    listItem: { flexDirection: 'row', marginBottom: 2 },
    bullet: { fontFamily: 'DejaVu', fontSize: 8, width: 12, color: '#475569' },
    listContent: { flex: 1, fontFamily: 'DejaVu', fontSize: 8, lineHeight: 1.5, color: '#475569' },
    blockquote: {
        borderLeftWidth: 2,
        borderLeftColor: '#e2e8f0',
        paddingLeft: 8,
        marginBottom: 4,
    },
})

function buildOptions(baseColor?: string): HTMLReactParserOptions {
    const opts: HTMLReactParserOptions = {
        replace(domNode) {
            const node = domNode as DOMNode

            if (node.type === 'text') {
                const text = 'data' in node ? node.data : ''
                if (!text) return

                const textStyle = baseColor
                    ? [styles.paragraph, { color: baseColor }]
                    : styles.paragraph
                return <Text style={textStyle}>{text}</Text>
            }

            if (node.type !== 'tag') return

            const el = node as Element
            const children = domToReact(el.children as DOMNode[], opts)
            const paraStyle = baseColor
                ? [styles.paragraph, { color: baseColor }]
                : styles.paragraph

            switch (el.name) {
                case 'p':
                case 'div':
                    return <Text style={paraStyle}>{children}</Text>

                case 'h1':
                    return <Text style={styles.h1}>{children}</Text>
                case 'h2':
                    return <Text style={styles.h2}>{children}</Text>
                case 'h3':
                    return <Text style={styles.h3}>{children}</Text>

                case 'strong':
                case 'b':
                    return <Text style={styles.bold}>{children}</Text>

                case 'em':
                case 'i':
                    return <Text style={styles.italic}>{children}</Text>

                case 'ul':
                case 'ol':
                    return <View style={styles.list}>{children}</View>

                case 'li':
                    return (
                        <View style={styles.listItem}>
                            <Text style={styles.bullet}>•  </Text>
                            <Text style={styles.listContent}>{children}</Text>
                        </View>
                    )

                case 'br':
                    return <Text>{'\n'}</Text>

                case 'a':
                    return <Text style={[styles.paragraph, { color: '#0891b2' }]}>{children}</Text>

                case 'blockquote':
                    return (
                        <View style={styles.blockquote}>
                            <Text style={paraStyle}>{children}</Text>
                        </View>
                    )

                case 'span':
                    return <Text style={paraStyle}>{children}</Text>

                case 'html':
                case 'head':
                case 'body':
                    return <React.Fragment>{children}</React.Fragment>

                default:
                    return <Text style={paraStyle}>{children}</Text>
            }
        },
    }
    return opts
}

interface HtmlContentProps {
    html: string | null | undefined
    style?: Style
    textColor?: string
}

export function HtmlContent({ html, style, textColor }: HtmlContentProps) {
    if (!html) return null
    const content = parse(html, buildOptions(textColor))
    return <View style={style}>{content}</View>
}
