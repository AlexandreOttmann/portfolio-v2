---
ogImage:
  props: {}
schemaOrg: {}
head:
  script: []
sitemap:
  videos: []
  images: []
---

## Oni Auction — Real-time Auction Platform

Oni Auction is an end-to-end event-driven platform (React + FastAPI) built tailored for supply-chain procurement. Handling highly concurrent English (ascending) and Dutch (descending) auctions, this project was deeply centered around **solving critical backend engineering challenges**: extreme concurrency, rigid data consistency, and achieving sub-100 ms bid-to-broadcast latency.

Here is a breakdown of the key technical decisions and systems developed:

### 🚀 Event-Driven Architecture & Kafka
- Designed a distributed core built on **Apache Kafka (KRaft)** to asynchronously process and sequence bid streams.
- Relied on **Partitioning by `lot_id`**, explicitly preventing race conditions while enabling horizontal scalability across worker instances.
- Forged a **Dead-letter queue (DLQ)** with manual offset committing to guarantee true fault tolerance and zero lost bids.

### ⚡ Live State Management & Real-time
- Implemented **Redis** as the absolute source of truth for the live auction state alongside a robust Pub/Sub system fanning out WebSocket broadcasts to thousands of clients.
- Ensured completely non-blocking, asynchronous persistence into **PostgreSQL** to maintain immutable historical records.
- Architected two distinct network planes: a strict event path for legal bids and an ephemeral low-latency path for frontend presence features (e.g. cursors).

### 🛠️ DevOps, Quality & Load Testing
- Enforced strict payload validation at the boundaries of every microservice utilizing **Pydantic v2**.
- Orchestrated a resilient orchestration via Docker-compose enforcing strict dependency health checks.
- Wrote thorough testing suites including **pytest**, E2E with **Playwright**, and rigorous **k6 load testing** designed to mathematically prove that under heavy bid storms, collision rates were consistently zero.
