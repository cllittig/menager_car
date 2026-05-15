-- Schema completo para banco NOVO no Supabase (public).
-- Gerado a partir de supabase/migrations/ + INSERT bootstrap para admin@controleveicular.com
-- Como usar: Supabase > SQL Editor > colar e Run. Depois: npm run verify:supabase
-- Usuario bootstrap: admin@controleveicular.com / senha: AlterarAposPrimeiroLogin1! (troque apos primeiro acesso).
-- Nota: policies RLS e restricoes de privilege sao aplicadas separadamente via npm run security:rollout



-- === 20250607214241_initial_schema.sql ===
-- Migration: 20250607214241_initial_schema
-- Description: Create all ENUMs and core tables (User, Vehicle, Client, Maintenance,
--              ServiceOrder, Contract, Transaction, Installment, AuditLog)

BEGIN;

CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

CREATE TYPE "FuelType" AS ENUM ('GASOLINE', 'ETHANOL', 'DIESEL', 'FLEX', 'ELECTRIC', 'HYBRID');

CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'SOLD', 'RENTED', 'MAINTENANCE');

CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

CREATE TYPE "TransactionType" AS ENUM ('SALE', 'RENT', 'PURCHASE');

CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

CREATE TYPE "ContractStatus" AS ENUM ('PENDING', 'SIGNED', 'EXPIRED', 'CANCELLED');


CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAttempt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedBy" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "chassis" TEXT NOT NULL,
    "mileage" DOUBLE PRECISION NOT NULL,
    "color" TEXT NOT NULL,
    "fuelType" "FuelType" NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "salePrice" DOUBLE PRECISION,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "saleDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedBy" TEXT,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cnh" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedBy" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "Maintenance" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'PENDING',
    "mechanic" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "ServiceOrder" (
    "id" TEXT NOT NULL,
    "maintenanceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "parts" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceOrder_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileHash" TEXT NOT NULL,
    "fileBuffer" BYTEA NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedBy" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "Installment" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);


CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

CREATE UNIQUE INDEX "Vehicle_licensePlate_key" ON "Vehicle"("licensePlate");
CREATE UNIQUE INDEX "Vehicle_chassis_key" ON "Vehicle"("chassis");
CREATE INDEX "Vehicle_licensePlate_idx" ON "Vehicle"("licensePlate");
CREATE INDEX "Vehicle_chassis_idx" ON "Vehicle"("chassis");
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");
CREATE INDEX "Vehicle_isActive_idx" ON "Vehicle"("isActive");

CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");
CREATE UNIQUE INDEX "Client_cpf_key" ON "Client"("cpf");
CREATE UNIQUE INDEX "Client_cnh_key" ON "Client"("cnh");
CREATE INDEX "Client_email_idx" ON "Client"("email");
CREATE INDEX "Client_cpf_idx" ON "Client"("cpf");
CREATE INDEX "Client_cnh_idx" ON "Client"("cnh");
CREATE INDEX "Client_isActive_idx" ON "Client"("isActive");

CREATE UNIQUE INDEX "Contract_transactionId_key" ON "Contract"("transactionId");
CREATE INDEX "Contract_transactionId_idx" ON "Contract"("transactionId");

CREATE INDEX "Transaction_vehicleId_idx" ON "Transaction"("vehicleId");
CREATE INDEX "Transaction_clientId_idx" ON "Transaction"("clientId");
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");
CREATE INDEX "Transaction_isActive_idx" ON "Transaction"("isActive");

CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");


ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "Maintenance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Contract" ADD CONSTRAINT "Contract_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Installment" ADD CONSTRAINT "Installment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;


-- === 20250619155804_refine_transaction_enums.sql ===
-- Migration: 20250619155804_refine_transaction_enums
-- Description: Replace TransactionType enum (adds MAINTENANCE, removes RENT),
--              replace VehicleStatus enum (adds RESERVED), drop unused ContractStatus enum.
-- Note: ALTER TYPE ADD VALUE is transactional in PG12+. Each enum swap uses
--       the create-rename-drop pattern to stay fully transactional.

BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('PURCHASE', 'SALE', 'MAINTENANCE');
ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "TransactionType_old";
COMMIT;

BEGIN;
CREATE TYPE "VehicleStatus_new" AS ENUM ('AVAILABLE', 'SOLD', 'MAINTENANCE', 'RESERVED');
ALTER TABLE "Vehicle" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Vehicle" ALTER COLUMN "status" TYPE "VehicleStatus_new" USING ("status"::text::"VehicleStatus_new");
ALTER TYPE "VehicleStatus" RENAME TO "VehicleStatus_old";
ALTER TYPE "VehicleStatus_new" RENAME TO "VehicleStatus";
DROP TYPE "VehicleStatus_old";
ALTER TABLE "Vehicle" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
COMMIT;

-- ContractStatus was defined in the initial schema but never used by any table column.
DROP TYPE "ContractStatus";


-- === 20250619165732_add_categoria.sql ===
-- Migration: 20250619165732_add_categoria
-- Description: Create temporary Portuguese-named Categoria table (dropped in next migration).

BEGIN;

CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

COMMIT;


-- === 20250619180001_drop_categoria.sql ===
-- Migration: 20250619180001_drop_categoria
-- Description: Drop the Categoria table added in the previous migration.
--              The Category table (English, tenant-aware) is created later in the inventory migration.

BEGIN;

DROP TABLE "Categoria";

COMMIT;



-- Bootstrap: usuario exigido pela migration add_user_isolation (banco vazio)
INSERT INTO "User" ("id", "email", "password", "name", "role", "isActive", "loginAttempts", "createdAt", "updatedAt")
VALUES (
  '00000000-0000-0000-0000-000000000099',
  'admin@controleveicular.com',
  '$2b$10$f9bFtxCmet4YC1l82aA2julJs10Wx/9avhnNf3byv7ZzKT94ovPtq',
  'Bootstrap Admin',
  'ADMIN',
  true,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT ("email") DO NOTHING;



-- === 20250619203552_add_user_isolation.sql ===
-- Migration: 20250619203552_add_user_isolation
-- Description: Add userId FK to Client and Vehicle; backfill from the seeded admin user.

BEGIN;

ALTER TABLE "Client" ADD COLUMN "userId" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "userId" TEXT;

UPDATE "Client" SET "userId" = (SELECT id FROM "User" WHERE email = 'admin@controleveicular.com' LIMIT 1);
UPDATE "Vehicle" SET "userId" = (SELECT id FROM "User" WHERE email = 'admin@controleveicular.com' LIMIT 1);

ALTER TABLE "Client" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Vehicle" ALTER COLUMN "userId" SET NOT NULL;

CREATE INDEX "Client_userId_idx" ON "Client"("userId");
CREATE INDEX "Vehicle_userId_idx" ON "Vehicle"("userId");

ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;


-- === 20250619233336_fix_vehicle_unique_constraints.sql ===
-- Migration: 20250619233336_fix_vehicle_unique_constraints
-- Description: Replace global unique indexes on Client (email/cpf/cnh) and Vehicle
--              (licensePlate/chassis) with user-scoped composite unique indexes.

BEGIN;

DROP INDEX "Client_cnh_key";
DROP INDEX "Client_cpf_key";
DROP INDEX "Client_email_key";
DROP INDEX "Vehicle_chassis_key";
DROP INDEX "Vehicle_licensePlate_key";

CREATE UNIQUE INDEX "Vehicle_userId_licensePlate_key" ON "Vehicle"("userId", "licensePlate");
CREATE UNIQUE INDEX "Vehicle_userId_chassis_key" ON "Vehicle"("userId", "chassis");

COMMIT;


-- === 20250620011743_add_maintenance_audit_fields.sql ===
-- Migration: 20250620011743_add_maintenance_audit_fields
-- Description: Add createdBy, deletedBy, updatedBy audit columns to Maintenance.

BEGIN;

ALTER TABLE "Maintenance"
  ADD COLUMN "createdBy" TEXT,
  ADD COLUMN "deletedBy" TEXT,
  ADD COLUMN "updatedBy" TEXT;

COMMIT;


-- === 20250620013204_add_client_birthdate.sql ===
-- Migration: 20250620013204_add_client_birthdate
-- Description: Add optional birthDate column to Client.

BEGIN;

ALTER TABLE "Client" ADD COLUMN "birthDate" TIMESTAMP(3);

COMMIT;


-- === 20260320000000_add_tenant_core.sql ===
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


-- === 20260320100000_add_inventory_and_auth_tables.sql ===
-- Migration: 20260320100000_add_inventory_and_auth_tables
-- Description: Add EMPLOYEE role, StockMovementType enum, inventory tables
--              (Category, Supplier, Product, StockMovement), and auth-support tables
--              (PasswordReset, ReportSnapshot, ReportSchedule) with FKs and indexes.
-- Depends on: 20260320000000_add_tenant_core (Tenant table must exist)

BEGIN;

DO $$ BEGIN
  CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'ADJUST');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'EMPLOYEE';

CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Category_tenantId_name_key" ON "Category"("tenantId", "name");

CREATE TABLE IF NOT EXISTS "Supplier" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "document" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "categoryId" TEXT,
    "supplierId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'UN',
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Product_tenantId_sku_key" ON "Product"("tenantId", "sku");

CREATE TABLE IF NOT EXISTS "StockMovement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "balanceAfter" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ReportSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ReportSchedule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "cronExpression" TEXT NOT NULL DEFAULT '0 8 * * 1',
    "emailTo" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReportSchedule_pkey" PRIMARY KEY ("id")
);


ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_tenantId_fkey";
ALTER TABLE "Category" ADD CONSTRAINT "Category_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "Supplier" DROP CONSTRAINT IF EXISTS "Supplier_tenantId_fkey";
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_tenantId_fkey";
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_categoryId_fkey";
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_supplierId_fkey";
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "StockMovement" DROP CONSTRAINT IF EXISTS "StockMovement_tenantId_fkey";
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StockMovement" DROP CONSTRAINT IF EXISTS "StockMovement_productId_fkey";
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "StockMovement" DROP CONSTRAINT IF EXISTS "StockMovement_userId_fkey";
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "PasswordReset" DROP CONSTRAINT IF EXISTS "PasswordReset_userId_fkey";
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "ReportSnapshot" DROP CONSTRAINT IF EXISTS "ReportSnapshot_tenantId_fkey";
ALTER TABLE "ReportSnapshot" ADD CONSTRAINT "ReportSnapshot_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ReportSnapshot" DROP CONSTRAINT IF EXISTS "ReportSnapshot_generatedBy_fkey";
ALTER TABLE "ReportSnapshot" ADD CONSTRAINT "ReportSnapshot_generatedBy_fkey"
  FOREIGN KEY ("generatedBy") REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "ReportSchedule" DROP CONSTRAINT IF EXISTS "ReportSchedule_tenantId_fkey";
ALTER TABLE "ReportSchedule" ADD CONSTRAINT "ReportSchedule_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "ReportSchedule" DROP CONSTRAINT IF EXISTS "ReportSchedule_createdBy_fkey";
ALTER TABLE "ReportSchedule" ADD CONSTRAINT "ReportSchedule_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE RESTRICT;


CREATE INDEX IF NOT EXISTS "StockMovement_productId_idx"          ON "StockMovement"("productId");
CREATE INDEX IF NOT EXISTS "StockMovement_tenantId_createdAt_idx" ON "StockMovement"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "PasswordReset_tokenHash_idx"          ON "PasswordReset"("tokenHash");
CREATE INDEX IF NOT EXISTS "ReportSnapshot_tenantId_idx"          ON "ReportSnapshot"("tenantId");
CREATE INDEX IF NOT EXISTS "ReportSchedule_tenantId_idx"          ON "ReportSchedule"("tenantId");

COMMIT;


-- === 20260422000000_create_refresh_session.sql ===
-- Migration: 20260422000000_create_refresh_session
-- Description: Create RefreshSession table for JWT refresh-token rotation with
--              family-based revocation support.

BEGIN;

CREATE TABLE IF NOT EXISTS "RefreshSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "familyId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "replacedBySessionId" TEXT,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userAgent" TEXT,
  "ip" TEXT,
  CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RefreshSession_tokenHash_idx" ON "RefreshSession"("tokenHash");
CREATE INDEX IF NOT EXISTS "RefreshSession_userId_idx"    ON "RefreshSession"("userId");
CREATE INDEX IF NOT EXISTS "RefreshSession_familyId_idx"  ON "RefreshSession"("familyId");

ALTER TABLE "RefreshSession" DROP CONSTRAINT IF EXISTS "RefreshSession_userId_fkey";
ALTER TABLE "RefreshSession" ADD CONSTRAINT "RefreshSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE CASCADE;

COMMIT;

