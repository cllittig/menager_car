-- Migration: 20250619180001_drop_categoria
-- Description: Drop the Categoria table added in the previous migration.
--              The Category table (English, tenant-aware) is created later in the inventory migration.

BEGIN;

DROP TABLE "Categoria";

COMMIT;
