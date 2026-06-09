// smartquote_backend/jest.config.js
/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    moduleFileExtensions: ['ts', 'js', 'mjs', 'cjs', 'json'],
    // Runs before each test file — sets env vars so config/index.ts doesn't exit(1)
    setupFiles: ['<rootDir>/jest.setup.ts'],
    clearMocks: true,
    restoreMocks: true,
    collectCoverageFrom: [
        'src/services/**/*.ts',
        'src/utils/**/*.ts',
        '!src/**/__tests__/**',
        // ── Services that require a live database (Prisma) or external APIs ──
        // These are covered by integration / E2E tests, not unit tests.
        '!src/services/auth.service.ts',
        '!src/services/contracts.service.ts',
        '!src/services/email-composer.service.ts',
        '!src/services/followupReminder.service.ts',
        '!src/services/followups.service.ts',
        '!src/services/ksef-bridge.service.ts',
        '!src/services/notification.service.ts',
        '!src/services/offer-templates.service.ts',
        '!src/services/offers.service.ts',
        '!src/services/publicContract.service.ts',
        '!src/services/publicOffer.service.ts',
        '!src/services/settings.service.ts',
        // ── AI services that require live Gemini API calls ──────────────────
        '!src/services/ai/chat.ts',
        '!src/services/ai/feedback.service.ts',
        '!src/services/ai/feedback.ts',
        '!src/services/ai/index.ts',
        '!src/services/ai/observer.service.ts',
        '!src/services/ai/closing-strategy.service.ts',
        '!src/services/ai/price-insight.service.ts',
        '!src/services/ai/analysis.ts',
        // ── Email transport (requires SMTP / MailerSend) ─────────────────────
        '!src/services/email/email-attachment-resolver.ts',
        '!src/services/email/email-transport.ts',
        '!src/services/email/sender.ts',
        '!src/services/email/index.ts',
        // ── Misc services with external dependencies ─────────────────────────
        '!src/services/public-offer/notifier.ts',
        '!src/services/shared/postmortem.utils.ts',
    ],
    coverageDirectory: 'coverage',
    transform: {
        // TypeScript files — standard ts-jest
        '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
        // Plain JS / ESM files coming from node_modules (e.g. @react-pdf/renderer v4 is ESM-only)
        '^.+\\.(js|mjs|cjs|jsx)$': ['ts-jest', {
            tsconfig: {
                allowJs: true,
                esModuleInterop: true,
                module: 'commonjs',
            },
            diagnostics: false,
        }],
    },
    // By default Jest ignores all node_modules; we punch a hole for @react-pdf/* so
    // the ESM packages get compiled to CJS by the transform rule above.
    transformIgnorePatterns: [
        '/node_modules/(?!@react-pdf)',
    ],
    testTimeout: 15000,
};