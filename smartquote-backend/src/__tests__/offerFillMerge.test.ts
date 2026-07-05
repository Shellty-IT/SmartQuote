// src/__tests__/offerFillMerge.test.ts
import { completionMessageWithoutBlocks, diffMergeBlocks, mergeProposalPatch } from '../services/ai/offer-fill'

type Blocks = Parameters<typeof diffMergeBlocks>[1]

function blocks(overrides: Record<string, unknown> = {}): Blocks {
    return overrides as Blocks
}

describe('diffMergeBlocks — non-destructive merge', () => {
    it('preserves current section when AI output is absent for that key', () => {
        const current = { intro: { enabled: true, paragraphs: ['Hello'] }, page1Sections: ['intro'] }
        const ai = blocks({})
        const result = diffMergeBlocks(current, ai)
        expect(result.intro).toEqual({ enabled: true, paragraphs: ['Hello'] })
        expect(result.page1Sections).toEqual(['intro'])
    })

    it('overwrites substantive fields from AI', () => {
        const current = { intro: { enabled: false, paragraphs: ['Old text'] } }
        const ai = blocks({ intro: { enabled: true, paragraphs: ['New text'] } })
        const result = diffMergeBlocks(current, ai)
        expect((result.intro as Record<string, unknown>).paragraphs).toEqual(['New text'])
    })

    it('does NOT let AI silently disable an enabled section (true→false ignored)', () => {
        const current = { intro: { enabled: true, paragraphs: ['Hello'] } }
        const ai = blocks({ intro: { enabled: false, paragraphs: ['Hello'] } })
        const result = diffMergeBlocks(current, ai)
        // Protected: a populated, enabled section must not vanish from the render.
        expect((result.intro as Record<string, unknown>).enabled).toBe(true)
    })

    it('lets AI enable a previously disabled section (false→true)', () => {
        const current = { testing: { enabled: false, intro: '', cards: [] } }
        const ai = blocks({
            testing: { enabled: true, intro: 'Testy', cards: [{ icon: '✓', title: 'QA', description: 'Pełne testy' }] },
        })
        const result = diffMergeBlocks(current, ai)
        expect((result.testing as Record<string, unknown>).enabled).toBe(true)
    })

    it('re-attaches a still-enabled section the AI dropped from the page layout', () => {
        const current = {
            intro: { enabled: true, paragraphs: ['Hello'] },
            scope: { enabled: true, title: 'Zakres', items: [{ html: 'Item' }] },
            page1Sections: ['intro', 'scope'],
            page2Sections: [],
        }
        // AI reorders page 1 but forgets `scope`, which is still enabled.
        const ai = blocks({ page1Sections: ['intro'] })
        const result = diffMergeBlocks(current, ai)
        const page1 = result.page1Sections as string[]
        const page2 = result.page2Sections as string[]
        expect([...page1, ...page2]).toContain('scope')
    })

    it('does not overwrite current field when AI provides empty string', () => {
        const current = { intro: { enabled: true, paragraphs: ['Existing text'] } }
        const ai = blocks({ intro: { enabled: true, paragraphs: ['Existing text'], title: '' } })
        const result = diffMergeBlocks(current, ai)
        // `title: ''` is not substantive — current (undefined) stays
        expect((result.intro as Record<string, unknown>).title).toBeUndefined()
    })

    it('does not overwrite current array when AI provides empty array', () => {
        const current = {
            scope: { enabled: true, title: 'Zakres', items: [{ html: 'Item 1' }] },
        }
        const ai = blocks({ scope: { enabled: true, title: 'Zakres', items: [] } })
        const result = diffMergeBlocks(current, ai)
        const scope = result.scope as Record<string, unknown>
        expect(scope.items).toEqual([{ html: 'Item 1' }])
    })

    it('replaces page1Sections when AI returns non-empty array', () => {
        const current = { page1Sections: ['intro', 'scope'], page2Sections: ['about'] }
        const ai = blocks({ page1Sections: ['scope', 'intro', 'structure'] })
        const result = diffMergeBlocks(current, ai)
        expect(result.page1Sections).toEqual(['scope', 'intro', 'structure'])
        expect(result.page2Sections).toEqual(['about'])
    })

    it('does not replace page1Sections when AI returns empty array', () => {
        const current = { page1Sections: ['intro', 'scope'] }
        const ai = blocks({ page1Sections: [] })
        const result = diffMergeBlocks(current, ai)
        expect(result.page1Sections).toEqual(['intro', 'scope'])
    })

    it('merges header section like a normal section', () => {
        const current = { header: { enabled: true, tag: 'Original Tag' } }
        const ai = blocks({ header: { enabled: true, tag: 'New Tag' } })
        const result = diffMergeBlocks(current, ai)
        expect((result.header as Record<string, unknown>).tag).toBe('New Tag')
    })

    it('merges new section keys benefits, process, stats', () => {
        const current = {}
        const ai = blocks({
            benefits: { enabled: true, title: 'Korzyści', items: [{ icon: '✓', title: 'Szybko', description: 'Szybka realizacja' }] },
            process: { enabled: true, title: 'Proces', steps: [{ title: 'Krok 1', description: 'Kontakt' }] },
            stats: { enabled: true, items: [{ value: '50+', label: 'Projektów' }] },
        })
        const result = diffMergeBlocks(current, ai)
        expect((result.benefits as Record<string, unknown>).enabled).toBe(true)
        expect((result.process as Record<string, unknown>).enabled).toBe(true)
        expect((result.stats as Record<string, unknown>).enabled).toBe(true)
    })

    it('preserves extra current fields not in SECTION_KEYS', () => {
        const current = { customField: 'value', page1Sections: ['intro'] }
        const ai = blocks({ intro: { enabled: true, paragraphs: ['Text'] } })
        const result = diffMergeBlocks(current, ai)
        expect(result.customField).toBe('value')
    })
})

describe('AI offer patch validation', () => {
    it('accepts a partial section patch and preserves the remaining template', () => {
        const current = {
            intro: { enabled: true, paragraphs: ['Stary wstęp'] },
            scope: { enabled: true, title: 'Zakres', items: [{ html: 'Bez zmian' }] },
        }

        const result = mergeProposalPatch(current, {
            intro: { paragraphs: ['Nowy wstęp dla klubu sportowego'] },
        })

        expect(result).not.toBeNull()
        expect(result?.intro).toEqual({ enabled: true, paragraphs: ['Nowy wstęp dla klubu sportowego'] })
        expect(result?.scope).toEqual(current.scope)
    })

    it('rejects a patch with an invalid field type', () => {
        expect(mergeProposalPatch({}, { intro: { paragraphs: 'not-an-array' } })).toBeNull()
    })

    it('does not claim success when no blocks can be applied', () => {
        expect(completionMessageWithoutBlocks('Szablon został wypełniony przykładowymi danymi'))
            .toContain('Nie udało mi się przygotować poprawnych danych')
    })

    // Real production reply that slipped through the old regex (only matched
    // "wypełni/uzupełni/zaktualiz/gotow/fill/updated/complete"): the model said
    // "Dodałem" (I added) instead, so the false claim reached the user verbatim
    // while isComplete/blocks stayed null — the offer looked untouched.
    it('catches a Polish "dodałem" (added) claim the original regex missed', () => {
        expect(completionMessageWithoutBlocks("Dodałem teraz ogólny opis oferty IT do pola 'description'."))
            .toContain('Nie udało mi się przygotować poprawnych danych')
    })

    it('leaves a genuine clarifying question untouched', () => {
        const question = 'Czy chcesz zmienić typ dokumentu, czy potrzebujesz opisu dla innej branży?'
        expect(completionMessageWithoutBlocks(question)).toBe(question)
    })
})
