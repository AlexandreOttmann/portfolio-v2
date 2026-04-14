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

## EONI — Plateforme SaaS E-commerce IA

EONI est né de la volonté d'offrir aux marchands hors de l'écosystème Shopify une solution clé en main pour rendre leur catalogue repérable par l'IA. Cette plateforme transforme n'importe quel site web en une vitrine propulsée par un agent autonome, grâce à un pipeline RAG de niveau production, une recherche hybride et un chat diffusé en temps réel. Ce projet a représenté un véritable **laboratoire d'architecture IA**, me permettant d'explorer et de maîtriser des infrastructures complexes.

Voici les travaux majeurs que j'ai réalisés sur cette plateforme :

### 🧠 Architecture IA & Pipeline RAG
- Mise en place d'un **pipeline RAG complet** : crawling, classification dynamique, "chunking", et stockage d'embeddings OpenAI (1536 dims) dans **Supabase via pgvector**.
- Combinaison de la **recherche sémantique** et de la **recherche full-text** (Reciprocal Rank Fusion) pour une pertinence optimale.
- Intégration d'un **reranker cross-encoder (Jina AI)** et d'un processus strict d'**anti-hallucination en deux étapes** avant de générer la réponse en streaming via **Claude Sonnet 4**.

### ⚙️ Performance & Ingénierie Backend
- Développement du backend sous **Nuxt 4** avec des requêtes parallèles pour un temps de réponse optimisé.
- Création d'un système de **Rate Limiting Distribué** au niveau de PostgreSQL (Supabase) pour gérer de manière atomique la concurrence.
- Mise en cache intelligente des requêtes (Query Cache) via des empreintes SHA-256 des embeddings.

### 🤖 Workflow Multi-Agents
- Orchestration du développement en utilisant un **workflow de 6 agents IA spécialisés** (produit, backend, frontend, UX/UI, sécurité, tests) via Claude Code.
