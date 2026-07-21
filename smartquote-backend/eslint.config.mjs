// eslint.config.mjs
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import tseslint from 'typescript-eslint';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'coverage/**',
            'scripts/**',
            'src/**/__tests__/**',
            'src/**/__mocks__/**',
            'src/**/__integration_tests__/**',
            'src/**/*.test.ts',
        ],
    },
    {
        files: ['src/**/*.ts'],
        extends: [...tseslint.configs.recommendedTypeChecked],
        languageOptions: {
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
            },
        },
        rules: {
            // This codebase predates lint. Most type-checked rules would flag a large
            // volume of pre-existing, intentional patterns (Prisma JSON fields,
            // third-party API responses cast at the boundary, `declare global
            // { namespace Express {...} }` for Request augmentation — the only way
            // to do that augmentation, so no-namespace is a false positive here).
            // Keep the one rule that catches a real, costly class of bug in an
            // Express/Prisma backend — an un-awaited promise silently swallows a DB
            // write, drops an error, or crashes the process on an unhandled
            // rejection — and leave the rest for incremental adoption rather than a
            // one-shot cleanup unrelated to that goal.
            '@typescript-eslint/no-floating-promises': 'error',
            // Express 4's RequestHandler type predates async/await, so every async
            // controller passed to router.get/post/etc trips the void-return check
            // here. Every controller in this codebase already wraps its body in
            // try/catch and forwards failures via next(err) (see errorHandler.ts),
            // so an unhandled rejection from a route handler can't actually happen —
            // this is the documented config for Express codebases using async
            // handlers. Other misuse checks (e.g. an async predicate passed to
            // Array#filter) stay on.
            '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { arguments: false } }],
            // Route registrations pass plain exported functions (never real class
            // methods relying on `this`) by reference — a false positive here.
            '@typescript-eslint/unbound-method': 'off',
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-unnecessary-type-assertion': 'off',
            '@typescript-eslint/no-base-to-string': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/require-await': 'off',
            '@typescript-eslint/restrict-template-expressions': 'off',
            '@typescript-eslint/no-redundant-type-constituents': 'off',
        },
    },
);
