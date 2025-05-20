-- Enable ON DELETE CASCADE for documents.equipment_id foreign key
ALTER TABLE documents
DROP CONSTRAINT IF EXISTS documents_equipment_id_fkey;
ALTER TABLE documents
ADD CONSTRAINT documents_equipment_id_fkey
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE;
