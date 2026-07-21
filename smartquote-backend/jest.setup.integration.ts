// jest.setup.integration.ts — runs before src/app.ts (and therefore config/index.ts)
// is ever imported, so dotenv.config() in config/index.ts sees DATABASE_URL already
// set and never falls back to the real Neon URL in .env. Points at the disposable
// Postgres container from docker-compose.test.yml — see scripts/run-integration-tests.ts.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-chars!!!';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32chars-pad!';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5433/smartquote_test';
