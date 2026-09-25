-- AI chat logging (see AI_CHAT_SETUP.md). Run in the Supabase SQL editor.
-- `if not exists`: safe to run on the existing project.

CREATE TABLE IF NOT EXISTS ai_chat_interactions (
  id BIGSERIAL PRIMARY KEY,
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_token INTEGER,
  total_tokens INTEGER,
  estimated_cost NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The previous pgvector RAG (portfolio_chunks, semantic_query_cache and their
-- RPCs) is no longer used by the app. Once the new chat is deployed, drop it:
--
-- DROP FUNCTION IF EXISTS match_portfolio_chunks(vector, float, int);
-- DROP FUNCTION IF EXISTS check_semantic_cache(vector, float);
-- DROP TABLE IF EXISTS semantic_query_cache;
-- DROP TABLE IF EXISTS portfolio_chunks;
