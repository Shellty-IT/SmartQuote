// src/__tests__/offerFillGenericMerge.test.ts
// Classic offers (and every non-proposal template) go through mergeGenericBlocks,
// not the section-based diffMergeBlocks tested in offerFillMerge.test.ts. This
// path had zero test coverage — verifying it directly to isolate whether a
// reported "AI fill does nothing for classic offers" bug is in this
// deterministic merge or in Gemini's own response behavior.
import { mergeGenericBlocks } from '../services/ai/offer-fill'

// Mirrors the flat OfferDetails shape a classic offer sends as currentBlocks —
// no "blocks"/"sections" concept at all, unlike every other template type.
function classicOfferDetails(overrides: Record<string, unknown> = {}) {
    return {
        title: 'Strona WWW — Klub Sportowy',
        description: '',
        validUntil: '2026-08-01',
        paymentDays: 14,
        terms: '',
        notes: '',
        requireAuditTrail: false,
        templateType: 'classic',
        ...overrides,
    }
}

describe('mergeGenericBlocks — classic offer (flat, non-block schema)', () => {
    it('fills empty description and terms from an AI patch matching the flat shape', () => {
        const current = classicOfferDetails()
        const generated = {
            description: '<p>Oferujemy kompleksowe wdrożenie strony internetowej dla klubu sportowego.</p>',
            terms: '<p>Płatność przelewem w terminie 14 dni od wystawienia faktury.</p>',
        }
        const result = mergeGenericBlocks(current, generated)
        expect(result.description).toBe(generated.description)
        expect(result.terms).toBe(generated.terms)
    })

    it('leaves title/validUntil/paymentDays untouched when the AI patch omits them', () => {
        const current = classicOfferDetails()
        const generated = { description: 'Nowy opis oferty.' }
        const result = mergeGenericBlocks(current, generated)
        expect(result.title).toBe(current.title)
        expect(result.validUntil).toBe(current.validUntil)
        expect(result.paymentDays).toBe(current.paymentDays)
    })

    it('does not overwrite an already-filled field with an empty string from the AI', () => {
        const current = classicOfferDetails({ notes: 'Ważna uwaga wewnętrzna.' })
        const generated = { notes: '' }
        const result = mergeGenericBlocks(current, generated)
        expect(result.notes).toBe('Ważna uwaga wewnętrzna.')
    })

    it('ignores AI-provided keys that do not exist on the current object', () => {
        const current = classicOfferDetails()
        const generated = { description: 'Opis.', hallucinatedField: 'should not appear' }
        const result = mergeGenericBlocks(current, generated)
        expect(result).not.toHaveProperty('hallucinatedField')
    })

    it('ignores a patch whose value type does not match the current field (string expected, number given)', () => {
        const current = classicOfferDetails()
        const generated = { paymentDays: '30' } // Gemini returned a string, field is a number
        const result = mergeGenericBlocks(current, generated)
        expect(result.paymentDays).toBe(14)
    })

    it('returns the object unchanged when the AI patch is not an object (defensive fallback)', () => {
        const current = classicOfferDetails()
        const result = mergeGenericBlocks(current, null as unknown as Record<string, unknown>)
        expect(result).toEqual(current)
    })
})
