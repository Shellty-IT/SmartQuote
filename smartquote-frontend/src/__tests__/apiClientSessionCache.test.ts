import { afterEach, describe, expect, it, vi } from 'vitest'

const getSessionMock = vi.fn()

vi.mock('next-auth/react', () => ({
    getSession: (...args: unknown[]) => getSessionMock(...args),
    signOut: vi.fn(),
}))

async function loadFreshClient() {
    vi.resetModules()
    getSessionMock.mockReset()
    const mod = await import('@/lib/api/client')
    return mod.api
}

function stubFetchJson(body: unknown, status = 200) {
    return vi.fn().mockResolvedValue({
        ok: status < 400,
        status,
        text: async () => JSON.stringify(body),
    })
}

afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
})

describe('api client session caching', () => {
    it('dedupes concurrent getSession() calls into a single fetch', async () => {
        const api = await loadFreshClient()
        getSessionMock.mockResolvedValue({ accessToken: 'token-1' })
        vi.stubGlobal('fetch', stubFetchJson({ success: true, data: [] }))

        await Promise.all([api.get('/offers'), api.get('/clients'), api.get('/leads')])

        expect(getSessionMock).toHaveBeenCalledTimes(1)
    })

    it('reuses the cached session across sequential calls within the TTL', async () => {
        vi.useFakeTimers()
        const api = await loadFreshClient()
        getSessionMock.mockResolvedValue({ accessToken: 'token-1' })
        vi.stubGlobal('fetch', stubFetchJson({ success: true, data: [] }))

        await api.get('/offers')
        await api.get('/clients')

        expect(getSessionMock).toHaveBeenCalledTimes(1)
    })

    it('refetches the session once the cache entry expires', async () => {
        vi.useFakeTimers()
        const api = await loadFreshClient()
        getSessionMock.mockResolvedValue({ accessToken: 'token-1' })
        vi.stubGlobal('fetch', stubFetchJson({ success: true, data: [] }))

        await api.get('/offers')
        vi.advanceTimersByTime(31_000)
        await api.get('/clients')

        expect(getSessionMock).toHaveBeenCalledTimes(2)
    })

    it('drops the cached session on a 401 so the next call fetches fresh', async () => {
        const api = await loadFreshClient()
        getSessionMock.mockResolvedValue({ accessToken: 'stale-token' })
        vi.stubGlobal(
            'fetch',
            vi
                .fn()
                .mockResolvedValueOnce({
                    ok: false,
                    status: 401,
                    text: async () => JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'x' } }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    text: async () => JSON.stringify({ success: true, data: [] }),
                }),
        )

        await expect(api.get('/offers')).rejects.toThrow()
        await api.get('/clients')

        expect(getSessionMock).toHaveBeenCalledTimes(2)
    })
})
