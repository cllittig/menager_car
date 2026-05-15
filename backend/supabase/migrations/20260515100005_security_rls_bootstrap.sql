-- Migration: 20260515100005_security_rls_bootstrap
-- Description: Drop legacy RLS policies, enable RLS on all application tables,
--              and install permissive bootstrap policies (allow-all via app_bootstrap_allow_rls).
--              Tenant-aware policies replace these in migration 20260515100006.

BEGIN;

DROP POLICY IF EXISTS user_tenant_select    ON "User";
DROP POLICY IF EXISTS user_tenant_update    ON "User";
DROP POLICY IF EXISTS vehicle_tenant_all    ON "Vehicle";
DROP POLICY IF EXISTS client_tenant_all     ON "Client";
DROP POLICY IF EXISTS transaction_tenant_all ON "Transaction";
DROP POLICY IF EXISTS contract_tenant_all   ON "Contract";

DO $$
DECLARE
  t text;
  deny_only  text[] := ARRAY['PasswordReset', 'RefreshSession'];
  bootstrap  text[] := ARRAY[
    'Tenant', 'User', 'Vehicle', 'Client', 'Contract', 'Transaction', 'Installment',
    'Maintenance', 'ServiceOrder', 'AuditLog', 'Category', 'Supplier', 'Product',
    'StockMovement', 'ReportSnapshot', 'ReportSchedule'
  ];
BEGIN
  FOREACH t IN ARRAY deny_only
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = t
    ) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;

  FOREACH t IN ARRAY bootstrap
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = t
    ) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS _rls_phase2_bootstrap_all ON %I', t);
      EXECUTE format(
        'CREATE POLICY _rls_phase2_bootstrap_all ON %I FOR ALL TO anon, authenticated USING (public.app_bootstrap_allow_rls()) WITH CHECK (public.app_bootstrap_allow_rls())',
        t
      );
    END IF;
  END LOOP;
END $$;

COMMIT;
