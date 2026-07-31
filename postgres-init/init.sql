-- This runs once when the Postgres volume is first created.
-- Creates a dedicated database for Keycloak alongside the autosense app DB.
CREATE DATABASE keycloak;

-- Enable pgvector on the app DB for RAG embeddings (Phase 2).
\connect autosense
CREATE EXTENSION IF NOT EXISTS vector;
