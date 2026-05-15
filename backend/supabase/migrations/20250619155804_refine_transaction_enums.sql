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
