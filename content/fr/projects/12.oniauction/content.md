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

## Oni Auction — Plateforme d'Enchères Temps Réel

Oni Auction est une infrastructure de bout en bout (React + FastAPI) conçue pour gérer des enchères collaboratives en temps réel dédiées aux achats en chaîne d'approvisionnement (procurement). Gérant des enchères ascendantes et descendantes (hollandaises), ce projet m'a permis de relever des **défis d'ingénierie backend critiques** : concurrence extrême, consistance stricte des données et temps de latence inférieur à 100 ms. 

Voici les solutions techniques clés mises en place :

### 🚀 Architecture Événementielle & Kafka
- Conception d'un cœur d'application distribué sur **Apache Kafka (KRaft)** pour centraliser et ordonner les flux d'enchères de façon asynchrone.
- **Partitionnement par `lot_id`**, garantissant la stricte linéarité absolue des offres (anti-race condition) et la scalabilité horizontale des workers.
- Mise en place d'une file de messages morts (**Dead-letter queue / DLQ**) et d'un commit manuel systématique pour une tolérance totale aux pannes.

### ⚡ Gestion d'État Live & Temps Réel
- Utilisation de **Redis** en tant que source de vérité pour l'état en direct et le fan-out (Pub/Sub) des WebSockets vers un nombre massif de clients simultanés.
- Sauvegarde asynchrone pour la persistance permanente et inviolable des offres dans **PostgreSQL**.
- Séparation stricte des flux "légaux" (enchères passant par Kafka) des flux éphémères de présence (curseurs naviguant uniquement par les WebSockets).

### 🛠️ DevOps, Qualité & Test
- Création d'une infrastructure Docker-compose complète intégrant des contrôles d'état (health checks) stricts à chaque niveau.
- Modélisation rigoureuse des données sous **Pydantic v2**, validées aux frontières de chaque microservice.
- Création de tests unitaires sous **pytest** et **Playwright**, ainsi que de stress-tests avancés sous **k6** prouvant mathématiquement l'impossibilité de collisions sur les enchères concurrentes.
