-- Migration: Enable ON DELETE CASCADE for inspections.rental_id foreign key

-- 1. Drop the existing foreign key constraint
ALTER TABLE inspections DROP CONSTRAINT IF EXISTS inspections_rental_id_fkey;

-- 2. Add a new foreign key constraint with ON DELETE CASCADE
ALTER TABLE inspections
ADD CONSTRAINT inspections_rental_id_fkey
FOREIGN KEY (rental_id)
REFERENCES rentals(id)
ON DELETE CASCADE;
