-- Migration: 20260320000000_add_tenant_core
-- Description: Create Tenant table, seed default tenant, add tenantId to core tables,
--              backfill existing rows, enforce NOT NULL, add FK constraints and indexes,
--              and replace user-scoped Vehicle unique indexes with tenant-scoped ones.

BEGIN;

CREATE TABLE IF NOT EXISTS "Tenant" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "Tenant" ("id", "name", "slug", "isActive")
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Tenant', 'default-tenant', true)
ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "User"        ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Vehicle"     ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Client"      ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Contract"    ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

UPDATE "User"        SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;
UPDATE "Vehicle"     SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;
UPDATE "Client"      SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;
UPDATE "Transaction" SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;
UPDATE "Contract"    SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;

ALTER TABLE "User"        ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Vehicle"     ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Client"      ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Transaction" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Contract"    ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "Client" ADD CONSTRAINT "Client_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS "User_tenantId_idx"        ON "User"("tenantId");
CREATE INDEX IF NOT EXISTS "Vehicle_tenantId_idx"     ON "Vehicle"("tenantId");
CREATE INDEX IF NOT EXISTS "Client_tenantId_idx"      ON "Client"("tenantId");
CREATE INDEX IF NOT EXISTS "Transaction_tenantId_idx" ON "Transaction"("tenantId");
CREATE INDEX IF NOT EXISTS "Contract_tenantId_idx"    ON "Contract"("tenantId");

-- Replace user-scoped unique indexes with tenant-scoped ones.
DROP INDEX IF EXISTS "unique_user_license_plate";
DROP INDEX IF EXISTS "unique_user_chassis";
CREATE UNIQUE INDEX IF NOT EXISTS "unique_tenant_license_plate" ON "Vehicle"("tenantId", "licensePlate");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_tenant_chassis"       ON "Vehicle"("tenantId", "chassis");

COMMIT;
