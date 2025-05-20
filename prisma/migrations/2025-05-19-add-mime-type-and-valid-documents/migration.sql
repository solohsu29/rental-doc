-- Add mime_type and type to documents table
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT;

-- Add valid_documents to equipment table
ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS valid_documents INTEGER DEFAULT 0;
