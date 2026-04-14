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

## EONI — AI E-commerce SaaS

EONI was born out of the need to provide non-Shopify merchants with a turnkey solution to make their storefronts AI-discoverable. This platform transforms any website into an agent-powered storefront, equipped with a production-grade RAG pipeline, hybrid vector search, and a real-time streaming chat. Developing EONI was a true **AI engineering laboratory**, allowing me to build and scale complex modern infrastructures.

Here are the key technical implementations achieved for this platform:

### 🧠 AI Architecture & RAG Pipeline
- Built a **complete RAG pipeline**: from web crawling and dynamic content classification to generating OpenAI embeddings (1536 dims) stored in **Supabase via pgvector**.
- Merged **semantic search** and **full-text keyword search** using Reciprocal Rank Fusion (RRF) to eliminate missing exact matches.
- Integrated a **Jina AI cross-encoder reranker** alongside a strict **two-step anti-hallucination validation** process before streaming responses through **Claude Sonnet 4**.

### ⚙️ Performance & Backend Engineering
- Developed the backend leveraging **Nuxt 4** with extensive parallelized queries to drastically cut down latency.
- Engineered a **Distributed Rate Limiting** system using atomic locks inside PostgreSQL to safely throttle requests across multiple edge instances.
- Implemented an embedding-based **Query Cache** using SHA-256 fingerprinting for instant context retrieval on common queries.

### 🤖 Multi-Agent Workflow
- Orchestrated the entire build using a collaborative team of **6 specialized AI agents** (Product Manager, Backend, Frontend, UI/UX, Security, QA) through Claude Code.
