-- This runs once when the Postgres volume is first created.
-- Creates a dedicated database for Keycloak alongside the autosense app DB.
CREATE DATABASE keycloak;
