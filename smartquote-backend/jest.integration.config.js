// jest.integration.config.js — real HTTP requests against the actual Express app
// backed by a disposable local Postgres (see docker-compose.test.yml). Separate
// from jest.config.js (which mocks Prisma/repositories everywhere) because these
// tests need the opposite: a real database and no mocks. Run via `npm run
// test:integration`, never as part of the regular `npm test`.
/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__integration_tests__/**/*.test.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    setupFiles: ['<rootDir>/jest.setup.integration.ts'],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
    },
    moduleNameMapper: {
        '^@react-pdf/renderer$': '<rootDir>/src/__mocks__/@react-pdf/renderer.ts',
        '^html-react-parser$': '<rootDir>/src/__mocks__/html-react-parser.ts',
    },
    testTimeout: 30000,
    // Sequential — all test files share one database and mutate real rows.
    maxWorkers: 1,
};
