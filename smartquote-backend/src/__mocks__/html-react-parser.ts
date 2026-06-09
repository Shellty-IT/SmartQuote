/**
 * Manual Jest mock for html-react-parser.
 *
 * html-react-parser pulls in html-dom-parser which is ESM-only and cannot be
 * loaded by ts-jest in a CommonJS test environment. This mock replaces it with
 * a no-op implementation — sufficient for unit tests that verify PDF service
 * logic without actually rendering HTML to React nodes.
 */

import React from 'react'

// parse(html) → return a simple span with the raw html as text (good enough for tests)
const parse = jest.fn((html: string) => React.createElement('span', null, html))

export default parse

// domToReact — used to convert DOMNode arrays; return empty fragment
export const domToReact = jest.fn(() => null)

// attributesToProps — pass-through
export const attributesToProps = jest.fn((attrs: Record<string, string>) => attrs)

// Element class stub
export class Element {
    tagName = ''
    attribs: Record<string, string> = {}
    children: unknown[] = []
    constructor(tagName: string, attribs: Record<string, string> = {}) {
        this.tagName = tagName
        this.attribs = attribs
    }
}

// Types — defined locally so we never import from the real (ESM) package
export type HTMLReactParserOptions = Record<string, unknown>
export type DOMNode = unknown
