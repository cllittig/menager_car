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
