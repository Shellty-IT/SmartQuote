export function documentTemplateMismatch(
    document: unknown,
    expectedTemplate: string,
): Response | null {
    const actualTemplate = document && typeof document === 'object'
        ? ((document as { templateType?: unknown }).templateType ?? 'classic')
        : 'classic'

    if (actualTemplate === expectedTemplate) return null

    return new Response(JSON.stringify({
        error: 'Template mismatch',
        storedTemplate: actualTemplate,
    }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
    })
}
