-- Enable the pgvector extension to work with embedding vectors
-- Run these commands in your Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Create table for storing our portfolio content chunks
CREATE TABLE IF NOT EXISTS portfolio_chunks (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- Store url, file path, titles, images etc.
  embedding vector(1536) NOT NULL -- 1536 is the dimension size for text-embedding-3-small
);

-- Note: We use an HNSW index to greatly speed up the vector similarity search
CREATE INDEX IF NOT EXISTS portfolio_chunks_embedding_idx 
ON portfolio_chunks 
USING hnsw (embedding vector_cosine_ops);


-- 2. Create table for Semantic Query Caching
CREATE TABLE IF NOT EXISTS semantic_query_cache (
  id BIGSERIAL PRIMARY KEY,
  query_text TEXT NOT NULL,
  query_embedding vector(1536) NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- We could index this as well, though for <10k rows a sequential scan on cache is very fast.
CREATE INDEX IF NOT EXISTS semantic_query_cache_embedding_idx 
ON semantic_query_cache 
USING hnsw (query_embedding vector_cosine_ops);

-- 3. Create RPC for fast vector search on chunks
CREATE OR REPLACE FUNCTION match_portfolio_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    portfolio_chunks.id,
    portfolio_chunks.content,
    portfolio_chunks.metadata,
    1 - (portfolio_chunks.embedding <=> query_embedding) AS similarity
  FROM portfolio_chunks
  WHERE 1 - (portfolio_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY portfolio_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 4. Create RPC for checking the semantic cache
CREATE OR REPLACE FUNCTION check_semantic_cache (
  query_emb vector(1536),
  match_threshold float
)
RETURNS TABLE (
  response text,
  similarity float
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    semantic_query_cache.response,
    1 - (semantic_query_cache.query_embedding <=> query_emb) AS similarity
  FROM semantic_query_cache
  WHERE 1 - (semantic_query_cache.query_embedding <=> query_emb) > match_threshold
    AND semantic_query_cache.created_at > NOW() - INTERVAL '1 day'
  ORDER BY semantic_query_cache.query_embedding <=> query_emb
  LIMIT 1;
$$;
