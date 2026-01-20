# 🚀 Realtime AI Ops Platform

> **A cloud-native, event-driven, AI-augmented realtime platform** built to demonstrate **senior-level engineering decisions** across **React / Next.js**, **backend architecture**, **distributed systems**, and **modern cloud & AI tooling**.

This project is intentionally designed as a **CV-grade showcase**.
Every technology is introduced for a **clear architectural reason**, at the moment where it becomes **necessary**, not fashionable.

---

## 🎯 Project Vision

Realtime AI Ops Platform is a **collaborative realtime dashboard** where multiple users interact with shared operational entities (incidents, tasks, auctions, tickets, etc.) with:

* Low-latency UI updates
* Optimistic interactions & rollback
* Event-driven backend coordination
* Cloud-native scalability
* AI-assisted analysis & summarization

The business domain is intentionally generic — the goal is to demonstrate **how to design, evolve, and justify complex systems**.

---

## 🧠 Architectural Principles

* **Progressive complexity** → no premature abstractions
* **Clear boundaries** between rendering, orchestration, and domain logic
* **Event-driven only when coordination requires it**
* **AI as an augmentation layer**, never as a source of truth
* **Production-grade patterns**, even in a personal project

---

## 🧩 Core Features

* Authentication & RBAC (Admin / Operator / Viewer)
* Realtime collaboration via WebSockets
* Optimistic UI with rollback
* Event sourcing & audit logs
* Scalable data tables & complex forms
* AI-generated summaries, prioritization & ChatOps assistant
* Observability, error tracking & metrics

---

## 🏗️ High-Level Architecture

```
Users
  ↓ HTTPS / WebSocket
Next.js App (React, App Router)
  ↕ TanStack Query (server-state orchestration)
Fastify API (Node.js)
  ↔ AWS Cognito (Auth)
  ↔ Kafka (Event streaming)
  ↔ Redis (cache / streams)
  ↔ PostgreSQL (Aurora-compatible)
  ↔ AI Service (OpenAI / Azure OpenAI)

Infra
  Docker / Docker Compose (local)
  Kubernetes (EKS)
  CI/CD (GitHub Actions)
  Observability (Sentry, Prometheus, Grafana)
```

---

## 🧠 Technology Choices & Rationale

### ⚛️ Next.js (App Router)

**Role**: Rendering & delivery

**Why**:

* Server-Side Rendering & streaming
* Clear separation between server and client components
* Industry standard for modern React

**Explicit non-goals**:

* Managing async data lifecycles
* Handling realtime cache evolution

> Next.js renders data — it does not orchestrate how data changes over time.

---

### 🔄 TanStack Query

**Role**: Client-side async state orchestrator

**Why**:

* Cache normalization & invalidation
* Optimistic updates & rollback
* Background refetch & retry strategies
* Seamless integration with WebSockets & events

**Key design decision**:

> Next.js handles *where* data comes from, TanStack Query handles *how it evolves*.

This separation is critical for collaborative, realtime systems.

---

### 🎨 shadcn/ui + Tailwind

**Why**:

* Fully composable & unopinionated
* Direct access to markup
* Accessibility via Radix
* Perfect fit for modern Next.js apps

Avoids the rigidity of heavy UI frameworks while remaining production-ready.

---

### 🧩 Backend — Fastify (Node.js)

**Why**:

* High performance, low overhead
* Excellent plugin system
* Native WebSocket support
* Easy Kafka & Redis integration

The backend intentionally starts as a **modular monolith**, with clear boundaries allowing future extraction.

---

### 🔐 Authentication — AWS Cognito

**Why**:

* OAuth2 / JWT / refresh tokens
* Enterprise-grade identity management
* Simple Fastify integration

Auth is introduced **after core flows exist**, avoiding early complexity.

---

### 🔄 Event-Driven Layer — Kafka

**Why Kafka is introduced later**:

* Early stages only need request/response
* Event systems add cognitive overhead

**Why Kafka becomes necessary**:

* Multiple consumers (notifications, AI, analytics)
* Replayability & audit logs
* Loose coupling between domain and side effects

Kafka appears **when coordination becomes the bottleneck**.

---

### 🗄️ Data Layer — PostgreSQL

**Why**:

* Clear relational modeling
* Easy local development
* Aurora-compatible for production

Avoids early cloud lock-in while remaining realistic.

---

### 🤖 AI Layer

**Purpose**:

* Summarize event streams
* Detect anomalies
* Suggest prioritization
* Provide internal ChatOps assistant

**Key rule**:

> AI consumes events — it never owns business logic.

This ensures determinism, debuggability, and trust.

---

### 📈 Observability

* **Sentry** → frontend & backend error tracking
* **Prometheus + Grafana** → metrics & system health
* **Structured logs** → debugging & audits

Observability is treated as a **first-class feature**.

---

## 🗺️ Roadmap

### 🥇 Milestone 1 — Frontend Foundation

* Next.js App Router
* shadcn/ui + design system
* TanStack Query
* Mock APIs & fake latency

### 🥈 Milestone 2 — Backend Core

* Fastify API
* PostgreSQL
* RBAC & permissions

### 🥉 Milestone 3 — Realtime Layer

* WebSockets
* Optimistic UI
* Conflict awareness

### 🏅 Milestone 4 — Event-Driven Architecture

* Kafka topics & consumers
* Audit logs
* Side-effect isolation

### 🧠 Milestone 5 — AI Integration

* LLM service
* Event summaries
* ChatOps assistant

### ☁️ Milestone 6 — Infrastructure

* Docker Compose
* Kubernetes (EKS)
* CI/CD

### 🔭 Milestone 7 — Observability & Hardening

* Sentry
* Prometheus / Grafana
* Load & failure testing

---

## 🤖 Parallel Development with AI Agents

The repository is structured to enable **parallel work by multiple AI agents**:

* **Architect Agent** → boundaries & trade-offs
* **Frontend Agent** → UI, performance, UX
* **Backend Agent** → domain logic, APIs
* **Infra Agent** → Docker, K8s, CI/CD
* **AI Agent** → prompts, pipelines, evaluation
* **QA Agent** → edge cases, resilience

Tools: Cursor, Claude Code, Copilot, ChatGPT

---

## 📌 What This Project Demonstrates

* Senior-level React & Next.js architecture
* Event-driven system design
* Cloud-native thinking
* Responsible AI integration
* Engineering judgment & trade-offs

---

## 🧠 TL;DR

> This project is not about stacking technologies — it is about **knowing when and why to use them**.

That decision-making process is the real deliverable.
