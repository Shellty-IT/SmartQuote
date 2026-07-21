// scripts/run-integration-tests.ts
//
// Orchestrates `npm run test:integration`: starts the disposable Postgres
// container (docker-compose.test.yml), waits for it to accept connections,
// applies migrations, runs the integration Jest config, then always tears the
// container down — even if the tests fail. Local dev tool only, not wired
// into CI.
import { execSync, spawnSync } from 'child_process';

const COMPOSE_FILE = 'docker-compose.test.yml';
const TEST_DATABASE_URL = 'postgresql://test:test@localhost:5433/smartquote_test';

function run(cmd: string, extraEnv: NodeJS.ProcessEnv = {}) {
    execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...extraEnv } });
}

async function waitForPostgres(maxAttempts = 30): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const result = spawnSync(
            'docker',
            ['compose', '-f', COMPOSE_FILE, 'exec', '-T', 'postgres-test', 'pg_isready', '-U', 'test'],
            { stdio: 'pipe' },
        );
        if (result.status === 0) {
            console.log('Postgres test container is ready.');
            return;
        }
        console.log(`Waiting for Postgres (attempt ${attempt}/${maxAttempts})...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error('Postgres test container did not become ready in time.');
}

async function main() {
    console.log('Starting disposable test Postgres container...');
    run(`docker compose -f ${COMPOSE_FILE} up -d`);

    try {
        await waitForPostgres();

        console.log('Applying migrations to the test database...');
        run('npx prisma migrate deploy', { DATABASE_URL: TEST_DATABASE_URL });

        console.log('Running integration tests...');
        run('npx jest --config jest.integration.config.js', { DATABASE_URL: TEST_DATABASE_URL });
    } finally {
        console.log('Tearing down test Postgres container...');
        try {
            run(`docker compose -f ${COMPOSE_FILE} down -v`);
        } catch (teardownErr) {
            console.error('Failed to tear down the test container — you may need to run:');
            console.error(`  docker compose -f ${COMPOSE_FILE} down -v`);
            console.error(teardownErr);
        }
    }
}

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
});
