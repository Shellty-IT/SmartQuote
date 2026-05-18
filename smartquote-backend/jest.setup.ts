// jest.setup.ts — sets minimal env vars so config/index.ts doesn't call process.exit(1)
// These are fake values safe for unit/integration tests that don't hit a real DB.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-chars!!!';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
