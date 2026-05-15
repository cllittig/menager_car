-- Migration: 20260515100008_security_rls_harden
-- Description: Harden RLS by removing the NULL jwt_tenant_id bypass.
--              After this migration all policies require an exact tenantId match
--              (service-role connections bypass RLS at the PostgreSQL level and are unaffected).

BEGIN;

-- Harden all tables that now have a direct tenantId column.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'User', 'Vehicle', 'Client', 'Transaction', 'Contract',
    'Maintenance', 'ServiceOrder', 'Installment', 'AuditLog',
    'Category', 'Supplier', 'Product', 'StockMovement', 'ReportSnapshot', 'ReportSchedule'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = t
        AND a.attname = 'tenantId' AND a.attnum > 0 AND NOT a.attisdropped
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tx_sel', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tx_ins', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tx_upd', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tx_del', t);

      EXECUTE format(
        'CREATE POLICY %I ON %I FOR SELECT TO anon, authenticated USING ("tenantId" = public.jwt_tenant_id())',
        t || '_tx_sel', t
      );
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR INSERT TO anon, authenticated WITH CHECK ("tenantId" = public.jwt_tenant_id())',
        t || '_tx_ins', t
      );
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR UPDATE TO anon, authenticated USING ("tenantId" = public.jwt_tenant_id()) WITH CHECK ("tenantId" = public.jwt_tenant_id())',
        t || '_tx_upd', t
      );
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR DELETE TO anon, authenticated USING ("tenantId" = public.jwt_tenant_id())',
        t || '_tx_del', t
      );
    END IF;
  END LOOP;
END $$;

-- Tenant table: strict self-match only.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = 'Tenant'
  ) THEN
    DROP POLICY IF EXISTS tenant_tx_sel ON "Tenant";
    CREATE POLICY tenant_tx_sel ON "Tenant" FOR SELECT TO anon, authenticated
      USING ("id" = public.jwt_tenant_id());
  END IF;
END $$;

COMMIT;
