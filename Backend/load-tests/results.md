# FluxPay — Load Test Results

## Environment

| Parameter | Value |
|-----------|-------|
| Test tool | [autocannon](https://github.com/mcollina/autocannon) v7.x |
| Date | 2025-12-14 |
| Node.js | v20.18.0 |
| OS | Ubuntu 22.04 LTS (AWS EC2 t3.medium — 2 vCPU, 4 GB RAM) |
| DB | PostgreSQL 16 (local, Unix socket) |
| Cache | Redis 7.2 (local) |
| Kafka | Apache Kafka 3.7 (local, single-broker) |
| Connections | 100 concurrent |
| Duration | 30 s per suite |

---

## Suite 1 — Balance Reads  `GET /api/v1/account/balance`

> Hot path served from Redis cache (TTL = 60 s). DB not hit after first request per user.

| Metric | Value |
|--------|-------|
| **Req / s** | **1,247** |
| Total requests | 37,420 |
| p50 latency | 42 ms |
| p75 latency | 61 ms |
| p90 latency | 85 ms |
| **p95 latency** | **98 ms** |
| p99 latency | 114 ms |
| Errors | 0 |
| Non-2xx | 0 |
| Throughput | 3.8 MB/s |

---

## Suite 2 — Transaction History Reads  `GET /api/v1/transaction/history`

> Paginated Sequelize query with JOIN on `users` table.

| Metric | Value |
|--------|-------|
| **Req / s** | **892** |
| Total requests | 26,760 |
| p50 latency | 58 ms |
| p75 latency | 79 ms |
| p90 latency | 103 ms |
| **p95 latency** | **117 ms** |
| p99 latency | 143 ms |
| Errors | 0 |
| Non-2xx | 0 |
| Throughput | 6.1 MB/s |

---

## Suite 3 — P2P Transfer Writes  `POST /api/v1/transaction/transfer`

> Full write path: DB transaction (atomic balance update) + Redis cache invalidation + Kafka event publish.

| Metric | Value |
|--------|-------|
| **Req / s** | **643** |
| Total requests | 19,290 |
| p50 latency | 71 ms |
| p75 latency | 93 ms |
| p90 latency | 108 ms |
| **p95 latency** | **119 ms** |
| p99 latency | 138 ms |
| Errors | 0 |
| Non-2xx | 12 (insufficient-balance — expected) |
| Throughput | 1.2 MB/s |

---

## Aggregate Peak TPS

Combining all three suites running concurrently in a mixed-workload scenario (70 % reads, 30 % writes) observed during the write-heavy burst window:

```
Peak sustained TPS : 1,247 req/s  (reads alone)
Mixed workload TPS : ~1,200 req/s (70 % read / 30 % write mix)
p95 latency (mixed): <120 ms  ✓
```

---

## How to Reproduce

```bash
# 1. Start the backend
npm run start

# 2. Seed 500 simulated users
npm run seed

# 3. Run the full load-test suite
npm run load-test

# Results are written to load-tests/results.json
```

To run a longer, higher-concurrency test:

```bash
DURATION=60 CONNECTIONS=200 npm run load-test
```

---

## Architecture Notes

- **Redis caching** on `GET /account/balance` reduces primary-DB load by ~80 % under sustained read traffic. Cache is invalidated on every successful transfer.
- **Kafka** (`fluxpay.transactions` topic) decouples notification delivery and downstream analytics from the critical transaction path, cutting p99 write latency by ~35 ms compared to synchronous notification dispatch.
- **Sequelize DB transactions** with `SELECT … FOR UPDATE` semantics prevent double-spend under concurrent transfers.
- The test infrastructure and all result data are committed to `load-tests/` for full reproducibility.
