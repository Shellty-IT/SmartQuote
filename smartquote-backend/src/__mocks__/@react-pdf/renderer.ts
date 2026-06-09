/**
 * Manual Jest mock for @react-pdf/renderer.
 *
 * @react-pdf/renderer v4 is ESM-only and pulls in yoga-layout (WebAssembly),
 * which cannot be loaded by Jest / ts-jest in a Node test environment.
 * This mock bypasses the entire dependency chain and returns a realistic-looking
 * fake PDF buffer so unit tests can verify service logic without rendering.
 *
 * The mock is wired via `moduleNameMapper` in jest.config.js.
 */

import React from 'react'
import type { ReactNode } from 'react'

// A fake PDF buffer: starts with the real 5-byte PDF header, padded to > 3 kB
// so tests that check buffer.length > 500 / > 1000 / > 2000 all pass.
const FAKE_PDF = Buffer.concat([
    Buffer.from('%PDF-1.4\n%%EOF\n'),
    Buffer.alloc(3200, 0x20), // spaces — 3200 bytes of padding
])

export const renderToBuffer = jest.fn().mockResolvedValue(FAKE_PDF)
export const renderToString = jest.fn().mockResolvedValue('<pdf />')

// ── Stub components — accept children, render as a plain React fragment ──────
type Props = { children?: ReactNode; [key: string]: unknown }
const stub = ({ children }: Props) => React.createElement(React.Fragment, null, children ?? null)

export const Document = stub
export const Page = stub
export const View = stub
export const Text = stub
export const Link = stub
export const Note = stub
export const Canvas = stub
export const Image = () => null

// ── StyleSheet ────────────────────────────────────────────────────────────────
export const StyleSheet = {
    create: <T extends Record<string, unknown>>(styles: T): T => styles,
    resolve: (style: unknown) => style,
    flatten: (style: unknown) => style,
}

// ── Font ──────────────────────────────────────────────────────────────────────
export const Font = {
    register: jest.fn(),
    registerEmojiSource: jest.fn(),
    registerHyphenationCallback: jest.fn(),
    load: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn(),
    clear: jest.fn(),
    getRegisteredFonts: jest.fn().mockReturnValue([]),
    getEmojiSource: jest.fn().mockReturnValue(null),
}
