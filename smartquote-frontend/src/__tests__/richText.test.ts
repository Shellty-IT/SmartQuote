import { describe, expect, it } from 'vitest'
import { richTextToPlainText } from '@/lib/rich-text'

describe('richTextToPlainText', () => {
    it('preserves readable block and list structure', () => {
        expect(richTextToPlainText('<p>Hello <strong>world</strong></p><ul><li>One</li><li>Two</li></ul>'))
            .toBe('Hello world\n• One\n• Two')
    })

    it('decodes safe named and numeric entities', () => {
        expect(richTextToPlainText('&lt;test&gt;&nbsp;&#65;&#x42;&amp;')).toBe('<test> AB&')
        expect(richTextToPlainText('&#999999999;')).toBe('�')
    })

    it('returns script and event markup as inert text', () => {
        expect(richTextToPlainText('<img src=x onerror=alert(1)><script>alert(2)</script>Safe'))
            .toBe('alert(2)Safe')
    })
})
