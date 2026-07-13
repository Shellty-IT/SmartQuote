import { describe, expect, it } from 'vitest'
import { isPdfResourceUrlAllowed } from '@/lib/pdf/puppeteer'

describe('PDF resource request security', () => {
    it.each([
        'data:image/png;base64,AA==',
        'data:font/woff2;base64,AA==',
        'blob:https://smartquote.example/id',
        'about:blank',
    ])('allows embedded resource %s', (url) => {
        expect(isPdfResourceUrlAllowed(url)).toBe(true)
    })

    it.each([
        'http://127.0.0.1:8080/secret',
        'http://169.254.169.254/latest/meta-data',
        'http://[::1]/secret',
        'http://localhost/admin',
        'https://example.com/image.png',
        'file:///etc/passwd',
        'ftp://example.com/file',
        'javascript:alert(1)',
        '/relative-image.png',
        'not a url',
    ])('blocks external resource %s', (url) => {
        expect(isPdfResourceUrlAllowed(url)).toBe(false)
    })
})
