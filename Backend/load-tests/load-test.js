/**
 * load-test.js — FluxPay API load test using autocannon
 *
 * Tests three endpoints representative of real-world payment workloads:
 *   1. GET  /api/v1/account/balance   — balance reads (hot path, Redis-cached)
 *   2. POST /api/v1/transaction/transfer — P2P payment writes (DB + Kafka)
 *   3. GET  /api/v1/transaction/history  — paginated transaction history reads
 *
 * Pre-requisites:
 *   1. Backend server running:  npm run start  (or npm run dev)
 *   2. Database seeded:         npm run seed
 *   3. autocannon installed:    npm install  (already in devDependencies)
 *
 * Run:  npm run load-test
 *       DURATION=60 CONNECTIONS=200 npm run load-test
 *
 * Results are written to: load-tests/results.json  (machine-readable)
 */

require('dotenv').config({ path: `${__dirname}/../.env` });
const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.LOAD_TEST_URL || 'http://localhost:3000';
const DURATION = parseInt(process.env.DURATION, 10) || 30;       // seconds
const CONNECTIONS = parseInt(process.env.CONNECTIONS, 10) || 100; // concurrent connections
const PIPELINING = parseInt(process.env.PIPELINING, 10) || 1;

// ── Auth tokens for simulated users ──────────────────────────────────────────
// These are pre-signed JWTs for seeded users (userId 1 and 2).
// In CI you would call /api/v1/user/signin to obtain fresh tokens.
const JWT_SECRET = process.env.JWT_SECRET || 'e2f3b8c9a1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0';
const jwt = require('jsonwebtoken');

function makeToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET);
}

// We'll test with a rotating pool of 20 user IDs to simulate real traffic
const USER_IDS = Array.from({ length: 20 }, (_, i) => i + 1);
const tokens = USER_IDS.map(makeToken);
let rrIdx = 0;
const nextToken = () => tokens[rrIdx++ % tokens.length];

// ── Test suites ───────────────────────────────────────────────────────────────

const SUITES = [
    {
        label: 'Balance reads (GET /account/balance) — Redis-cached hot path',
        options: {
            url: `${BASE_URL}/api/v1/account/balance`,
            method: 'GET',
            headers: { authorization: `Bearer ${makeToken(1)}` },
            connections: CONNECTIONS,
            duration: DURATION,
            pipelining: PIPELINING,
        },
    },
    {
        label: 'Transaction history reads (GET /transaction/history)',
        options: {
            url: `${BASE_URL}/api/v1/transaction/history`,
            method: 'GET',
            headers: { authorization: `Bearer ${makeToken(1)}` },
            connections: CONNECTIONS,
            duration: DURATION,
            pipelining: PIPELINING,
        },
    },
    {
        label: 'P2P transfer writes (POST /transaction/transfer)',
        options: {
            url: `${BASE_URL}/api/v1/transaction/transfer`,
            method: 'POST',
            headers: {
                authorization: `Bearer ${makeToken(1)}`,
                'content-type': 'application/json',
            },
            body: JSON.stringify({ receiverVPA: 'user_2_aarav@fluxpay', amount: 1 }),
            connections: Math.min(CONNECTIONS, 50), // writes use fewer connections to avoid balance exhaustion
            duration: DURATION,
            pipelining: 1,
        },
    },
];

// ── Runner ────────────────────────────────────────────────────────────────────

function runSuite(suite) {
    return new Promise((resolve, reject) => {
        console.log(`\n${'─'.repeat(70)}`);
        console.log(`Running: ${suite.label}`);
        console.log(`  Connections : ${suite.options.connections}`);
        console.log(`  Duration    : ${DURATION}s`);
        console.log(`${'─'.repeat(70)}\n`);

        const instance = autocannon(suite.options, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });

        autocannon.track(instance, { renderProgressBar: true });
    });
}

async function main() {
    const allResults = [];

    for (const suite of SUITES) {
        const result = await runSuite(suite);

        const summary = {
            suite: suite.label,
            duration: result.duration,
            connections: result.connections,
            totalRequests: result.requests.total,
            requestsPerSec: Math.round(result.requests.average),
            latency: {
                p50_ms: result.latency['50'],
                p75_ms: result.latency['75'],
                p90_ms: result.latency['90'],
                p95_ms: result.latency['97.5'] ?? result.latency['95'],
                p99_ms: result.latency['99'],
                mean_ms: parseFloat(result.latency.mean),
            },
            throughput: {
                totalMB: (result.throughput.total / 1024 / 1024).toFixed(2) + ' MB',
                avgMBps: (result.throughput.average / 1024 / 1024).toFixed(2) + ' MB/s',
            },
            errors: result.errors,
            timeouts: result.timeouts,
            non2xx: result.non2xx,
        };

        console.log('\n── Summary ──────────────────────────────────────────────────');
        console.log(`  Req/s    : ${summary.requestsPerSec.toLocaleString()}`);
        console.log(`  p50      : ${summary.latency.p50_ms} ms`);
        console.log(`  p95      : ${summary.latency.p95_ms} ms`);
        console.log(`  p99      : ${summary.latency.p99_ms} ms`);
        console.log(`  Errors   : ${summary.errors}`);
        console.log('─────────────────────────────────────────────────────────────\n');

        allResults.push(summary);
    }

    const outputPath = path.join(__dirname, 'results.json');
    fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
    console.log(`\n[load-test] Results written to ${outputPath}`);
}

main().catch((err) => {
    console.error('[load-test] Fatal:', err);
    process.exit(1);
});
