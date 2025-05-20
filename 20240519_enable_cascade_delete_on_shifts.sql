-- Migration: Enable ON DELETE CASCADE for shifts.rental_id foreign key

-- 1. Drop the existing foreign key constraint
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_rental_id_fkey;

-- 2. Add a new foreign key constraint with ON DELETE CASCADE
ALTER TABLE shifts
ADD CONSTRAINT shifts_rental_id_fkey
FOREIGN KEY (rental_id)
REFERENCES rentals(id)
ON DELETE CASCADE;
