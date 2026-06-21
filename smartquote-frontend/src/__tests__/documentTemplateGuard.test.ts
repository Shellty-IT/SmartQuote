import { describe, expect, it } from 'vitest'
import { documentTemplateMismatch } from '@/lib/pdf/template-guard'

describe('document template guard', () => {
    it('allows rendering only in the stored template', () => {
        expect(documentTemplateMismatch({ templateType: 'website_v2' }, 'website_v2')).toBeNull()
    })

    it('rejects a route for another template', () => {
        const response = documentTemplateMismatch({ templateType: 'website_v2' }, 'proposal')
        expect(response?.status).toBe(409)
    })

    it('treats legacy null templates as classic', () => {
        expect(documentTemplateMismatch({ templateType: null }, 'classic')).toBeNull()
    })
})
