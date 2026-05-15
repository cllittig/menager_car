-- Migration: 20250620011743_add_maintenance_audit_fields
-- Description: Add createdBy, deletedBy, updatedBy audit columns to Maintenance.

BEGIN;

ALTER TABLE "Maintenance"
  ADD COLUMN "createdBy" TEXT,
  ADD COLUMN "deletedBy" TEXT,
  ADD COLUMN "updatedBy" TEXT;

COMMIT;
