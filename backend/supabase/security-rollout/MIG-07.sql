-- MIG-07: tenantId em satélites + FK Tenant + triggers de consistência (sem DROP de dados)
-- Maintenance
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = 'Maintenance'
  ) THEN
    IF EXISTS (SELECT 1 FROM "Maintenance" m LEFT JOIN "Vehicle" v ON v."id" = m."vehicleId" WHERE v."id" IS NULL) THEN
      RAISE EXCEPTION 'MIG-07 ABORT: Maintenance com vehicleId inválido';
    END IF;

    ALTER TABLE "Maintenance" ADD COLUMN IF NOT EXISTS "tenantId" text;
    UPDATE "Maintenance" m SET "tenantId" = v."tenantId" FROM "Vehicle" v WHERE m."vehicleId" = v."id";

    IF EXISTS (SELECT 1 FROM "Maintenance" WHERE "tenantId" IS NULL) THEN
      RAISE EXCEPTION 'MIG-07 ABORT: Maintenance com tenantId NULL após backfill';
    END IF;

    ALTER TABLE "Maintenance" ALTER COLUMN "tenantId" SET NOT NULL;
    ALTER TABLE "Maintenance" DROP CONSTRAINT IF EXISTS "Maintenance_tenantId_fkey";
    ALTER TABLE "Maintenance"
      ADD CONSTRAINT "Maintenance_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
    CREATE INDEX IF NOT EXISTS "Maintenance_tenantId_idx" ON "Maintenance"("tenantId");

    CREATE OR REPLACE FUNCTION public.trg_maintenance_tenant_sync()
    RETURNS trigger LANGUAGE plpgsql AS $f$
    DECLARE vt text;
    BEGIN
      SELECT v."tenantId" INTO vt FROM "Vehicle" v WHERE v."id" = NEW."vehicleId";
      IF vt IS NULL THEN RAISE EXCEPTION 'vehicleId inválido'; END IF;
      IF NEW."tenantId" IS DISTINCT FROM vt THEN
        RAISE EXCEPTION 'tenantId divergente do Vehicle';
      END IF;
      RETURN NEW;
    END;
    $f$;

    DROP TRIGGER IF EXISTS maintenance_tenant_sync ON "Maintenance";
    CREATE TRIGGER maintenance_tenant_sync
    BEFORE INSERT OR UPDATE OF "vehicleId", "tenantId" ON "Maintenance"
    FOR EACH ROW EXECUTE FUNCTION public.trg_maintenance_tenant_sync();
  END IF;
END $$;

-- ServiceOrder
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = 'ServiceOrder'
  ) THEN
    IF EXISTS (SELECT 1 FROM "ServiceOrder" so LEFT JOIN "Maintenance" m ON m."id" = so."maintenanceId" WHERE m."id" IS NULL) THEN
      RAISE EXCEPTION 'MIG-07 ABORT: ServiceOrder com maintenanceId inválido';
    END IF;

    ALTER TABLE "ServiceOrder" ADD COLUMN IF NOT EXISTS "tenantId" text;
    UPDATE "ServiceOrder" so SET "tenantId" = m."tenantId" FROM "Maintenance" m WHERE so."maintenanceId" = m."id";

    IF EXISTS (SELECT 1 FROM "ServiceOrder" WHERE "tenantId" IS NULL) THEN
      RAISE EXCEPTION 'MIG-07 ABORT: ServiceOrder com tenantId NULL após backfill';
    END IF;

    ALTER TABLE "ServiceOrder" ALTER COLUMN "tenantId" SET NOT NULL;
    ALTER TABLE "ServiceOrder" DROP CONSTRAINT IF EXISTS "ServiceOrder_tenantId_fkey";
    ALTER TABLE "ServiceOrder"
      ADD CONSTRAINT "ServiceOrder_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
    CREATE INDEX IF NOT EXISTS "ServiceOrder_tenantId_idx" ON "ServiceOrder"("tenantId");

    CREATE OR REPLACE FUNCTION public.trg_serviceorder_tenant_sync()
    RETURNS trigger LANGUAGE plpgsql AS $f$
    DECLARE tt text;
    BEGIN
      SELECT m."tenantId" INTO tt FROM "Maintenance" m WHERE m."id" = NEW."maintenanceId";
      IF tt IS NULL THEN RAISE EXCEPTION 'maintenanceId inválido'; END IF;
      IF NEW."tenantId" IS DISTINCT FROM tt THEN
        RAISE EXCEPTION 'tenantId divergente do Maintenance';
      END IF;
      RETURN NEW;
    END;
    $f$;

    DROP TRIGGER IF EXISTS serviceorder_tenant_sync ON "ServiceOrder";
    CREATE TRIGGER serviceorder_tenant_sync
    BEFORE INSERT OR UPDATE OF "maintenanceId", "tenantId" ON "ServiceOrder"
    FOR EACH ROW EXECUTE FUNCTION public.trg_serviceorder_tenant_sync();
  END IF;
END $$;

-- Installment
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = 'Installment'
  ) THEN
    IF EXISTS (SELECT 1 FROM "Installment" i LEFT JOIN "Transaction" t ON t."id" = i."transactionId" WHERE t."id" IS NULL) THEN
      RAISE EXCEPTION 'MIG-07 ABORT: Installment com transactionId inválido';
    END IF;

    ALTER TABLE "Installment" ADD COLUMN IF NOT EXISTS "tenantId" text;
    UPDATE "Installment" i SET "tenantId" = t."tenantId" FROM "Transaction" t WHERE i."transactionId" = t."id";

    IF EXISTS (SELECT 1 FROM "Installment" WHERE "tenantId" IS NULL) THEN
      RAISE EXCEPTION 'MIG-07 ABORT: Installment com tenantId NULL após backfill';
    END IF;

    ALTER TABLE "Installment" ALTER COLUMN "tenantId" SET NOT NULL;
    ALTER TABLE "Installment" DROP CONSTRAINT IF EXISTS "Installment_tenantId_fkey";
    ALTER TABLE "Installment"
      ADD CONSTRAINT "Installment_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
    CREATE INDEX IF NOT EXISTS "Installment_tenantId_idx" ON "Installment"("tenantId");

    CREATE OR REPLACE FUNCTION public.trg_installment_tenant_sync()
    RETURNS trigger LANGUAGE plpgsql AS $f$
    DECLARE tt text;
    BEGIN
      SELECT x."tenantId" INTO tt FROM "Transaction" x WHERE x."id" = NEW."transactionId";
      IF tt IS NULL THEN RAISE EXCEPTION 'transactionId inválido'; END IF;
      IF NEW."tenantId" IS DISTINCT FROM tt THEN
        RAISE EXCEPTION 'tenantId divergente do Transaction';
      END IF;
      RETURN NEW;
    END;
    $f$;

    DROP TRIGGER IF EXISTS installment_tenant_sync ON "Installment";
    CREATE TRIGGER installment_tenant_sync
    BEFORE INSERT OR UPDATE OF "transactionId", "tenantId" ON "Installment"
    FOR EACH ROW EXECUTE FUNCTION public.trg_installment_tenant_sync();
  END IF;
END $$;

-- AuditLog
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = 'AuditLog'
  ) THEN
    IF EXISTS (SELECT 1 FROM "AuditLog" a LEFT JOIN "User" u ON u."id" = a."userId" WHERE u."id" IS NULL) THEN
      RAISE EXCEPTION 'MIG-07 ABORT: AuditLog com userId inválido';
    END IF;

    ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "tenantId" text;
    UPDATE "AuditLog" a SET "tenantId" = u."tenantId" FROM "User" u WHERE a."userId" = u."id";

    IF EXISTS (SELECT 1 FROM "AuditLog" WHERE "tenantId" IS NULL) THEN
      RAISE EXCEPTION 'MIG-07 ABORT: AuditLog com tenantId NULL após backfill';
    END IF;

    ALTER TABLE "AuditLog" ALTER COLUMN "tenantId" SET NOT NULL;
    ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_tenantId_fkey";
    ALTER TABLE "AuditLog"
      ADD CONSTRAINT "AuditLog_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
    CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

    CREATE OR REPLACE FUNCTION public.trg_auditlog_tenant_sync()
    RETURNS trigger LANGUAGE plpgsql AS $f$
    DECLARE tt text;
    BEGIN
      SELECT u."tenantId" INTO tt FROM "User" u WHERE u."id" = NEW."userId";
      IF tt IS NULL THEN RAISE EXCEPTION 'userId inválido'; END IF;
      IF NEW."tenantId" IS DISTINCT FROM tt THEN
        RAISE EXCEPTION 'tenantId divergente do User';
      END IF;
      RETURN NEW;
    END;
    $f$;

    DROP TRIGGER IF EXISTS auditlog_tenant_sync ON "AuditLog";
    CREATE TRIGGER auditlog_tenant_sync
    BEFORE INSERT OR UPDATE OF "userId", "tenantId" ON "AuditLog"
    FOR EACH ROW EXECUTE FUNCTION public.trg_auditlog_tenant_sync();
  END IF;
END $$;
