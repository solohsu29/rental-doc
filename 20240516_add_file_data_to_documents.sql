-- Migration: Add file_data column to documents table for storing uploaded files as BLOB/BYTEA
ALTER TABLE documents ADD COLUMN file_data BYTEA;
-- Optionally, add file_name if not present
ALTER TABLE documents ADD COLUMN file_name TEXT;
