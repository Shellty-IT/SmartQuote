import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createContext, runInContext } from 'node:vm'
import { beforeAll, describe, expect, it, vi } from 'vitest'

type WorkerContext = {
    safeNotificationPath: (value: unknown) => string
    isPrivatePath: (value: string) => boolean
    precacheUrls: string[]
}

let worker: WorkerContext

beforeAll(() => {
    const source = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8')
    const context = createContext({
        URL,
        self: {
            location: { origin: 'https://smartquote.example' },
            addEventListener: vi.fn(),
            skipWaiting: vi.fn(),
            clients: { claim: vi.fn() },
        },
    })
    runInContext(source, context)
    worker = {
        safeNotificationPath: runInContext('safeNotificationPath', context),
        isPrivatePath: runInContext('isPrivatePath', context),
        precacheUrls: runInContext('[...PRECACHE_URLS]', context),
    }
})

describe('service worker security', () => {
    it('never precaches authenticated or tokenized documents', () => {
        expect(worker.precacheUrls.every((url) => !worker.isPrivatePath(url))).toBe(true)
    })

    it.each([
        '/dashboard',
        '/dashboard/offers/1',
        '/offer/view/secret',
        '/contract/view/secret',
        '/api/offers',
        '/auth/login',
    ])('treats %s as private', (url) => {
        expect(worker.isPrivatePath(url)).toBe(true)
    })

    it('accepts only same-origin application notification paths', () => {
        expect(worker.safeNotificationPath('/dashboard/offers/1?tab=details#top')).toBe('/dashboard/offers/1?tab=details#top')
        expect(worker.safeNotificationPath('/offer/view/token')).toBe('/offer/view/token')
        expect(worker.safeNotificationPath('https://evil.example/phish')).toBe('/dashboard')
        expect(worker.safeNotificationPath('//evil.example/phish')).toBe('/dashboard')
        expect(worker.safeNotificationPath('/api/auth/signin?callbackUrl=https://evil.example')).toBe('/dashboard')
    })
})
