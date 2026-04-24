-- MIG-06: substituir bootstrap por policies transicionais (jwt_tenant_id IS NULL OR tenant match)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'User', 'Vehicle', 'Client', 'Transaction', 'Contract',
    'Category', 'Supplier', 'Product', 'StockMovement', 'ReportSnapshot', 'ReportSchedule'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = t
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS _rls_phase2_bootstrap_all ON %I', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tx_sel', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tx_ins', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tx_upd', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tx_del', t);

      EXECUTE format(
        'CREATE POLICY %I ON %I FOR SELECT TO anon, authenticated USING (public.jwt_tenant_id() IS NULL OR "tenantId" = public.jwt_tenant_id())',
        t || '_tx_sel', t
      );
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR INSERT TO anon, authenticated WITH CHECK (public.jwt_tenant_id() IS NULL OR "tenantId" = public.jwt_tenant_id())',
        t || '_tx_ins', t
      );
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR UPDATE TO anon, authenticated USING (public.jwt_tenant_id() IS NULL OR "tenantId" = public.jwt_tenant_id()) WITH CHECK (public.jwt_tenant_id() IS NULL OR "tenantId" = public.jwt_tenant_id())',
        t || '_tx_upd', t
      );
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR DELETE TO anon, authenticated USING (public.jwt_tenant_id() IS NULL OR "tenantId" = public.jwt_tenant_id())',
        t || '_tx_del', t
      );
    END IF;
  END LOOP;
END $$;

-- Tenant: apenas SELECT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = 'Tenant'
  ) THEN
    DROP POLICY IF EXISTS _rls_phase2_bootstrap_all ON "Tenant";
    DROP POLICY IF EXISTS tenant_tx_sel ON "Tenant";
    CREATE POLICY tenant_tx_sel ON "Tenant" FOR SELECT TO anon, authenticated
      USING (public.jwt_tenant_id() IS NULL OR "id" = public.jwt_tenant_id());
  END IF;
END $$;

-- Installment: via Transaction
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = 'Installment'
  ) THEN
    DROP POLICY IF EXISTS _rls_phase2_bootstrap_all ON "Installment";
    DROP POLICY IF EXISTS Installment_tx_sel ON "Installment";
    DROP POLICY IF EXISTS Installment_tx_ins ON "Installment";
    DROP POLICY IF EXISTS Installment_tx_upd ON "Installment";
    DROP POLICY IF EXISTS Installment_tx_del ON "Installment";

    CREATE POLICY Installment_tx_sel ON "Installment" FOR SELECT TO anon, authenticated
      USING (
        public.jwt_tenant_id() IS NULL
        OR EXISTS (
          SELECT 1 FROM "Transaction" x
          WHERE x."id" = "Installment"."transactionId"
            AND x."tenantId" = public.jwt_tenant_id()
        )
      );
    CREATE POLICY Installment_tx_ins ON "Installment" FOR INSERT TO anon, authenticated
      WITH CHECK (
        public.jwt_tenant_id() IS NULL
        OR EXISTS (
          SELECT 1 FROM "Transaction" x
          WHERE x."id" = "Installment"."transactionId"
            AND x."tenantId" = public.jwt_tenant_id()
        )
      );
    CREATE POLICY Installment_tx_upd ON "Installment" FOR UPDATE TO anon, authenticated
      USING (
        public.jwt_tenant_id() IS NULL
        OR EXISTS (
          SELECT 1 FROM "Transaction" x
          WHERE x."id" = "Installment"."transactionId"
            AND x."tenantId" = public.jwt_tenant_id()
        )
      )
      WITH CHECK (
        public.jwt_tenant_id() IS NULL
        OR EXISTS (
          SELECT 1 FROM "Transaction" x
          WHERE x."id" = "Installment"."transactionId"
            AND x."tenantId" = public.jwt_tenant_id()
        )
      );
    CREATE POLICY Installment_tx_del ON "Installment" FOR DELETE TO anon, authenticated
      USING (
        public.jwt_tenant_id() IS NULL
        OR EXISTS (
          SELECT 1 FROM "Transaction" x
          WHERE x."id" = "Installment"."transactionId"
            AND x."tenantId" = public.jwt_tenant_id()
        )
      );
  END IF;
END $$;

-- Maintenance: via Vehicle
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = 'Maintenance'
  ) THEN
    DROP POLICY IF EXISTS _rls_phase2_bootstrap_all ON "Maintenance";
    DROP POLICY IF EXISTS Maintenance_tx_sel ON "Maintenance";
    DROP POLICY IF EXISTS Maintenance_tx_ins ON "Maintenance";
    DROP POLICY IF EXISTS Maintenance_tx_upd ON "Maintenance";
    DROP POLICY IF EXISTS Maintenance_tx_del ON "Maintenance";

    CREATE POLICY Maintenance_tx_sel ON "Maintenance" FOR SELECT TO anon, authenticated
      USING (
        public.jwt_tenant_id() IS NULL
        OR EXISTS (
          SELECT 1 FROM "Vehicle" v
          WHERE v."id" = "Maintenance"."vehicleId"
            AND v."tenantId" = public.jwt_tenant_id()
        )
      );
    CREATE POLICY Maintenance_tx_ins ON "Maintenance" FOR INSERT TO anon, authenticated
      WITH CHECK (
        public.jwt_tenant_id() IS NULL
        OR EXISTS (
          SELECT 1 FROM "Vehicle" v
          WHERE v."id" = "Maintenance"."vehicleId"
            AND v."tenantId" = public.jwt_tenant_id()
        )
      );
    CREATE POLICY Maintenance_tx_upd ON "Maintenance" FOR UPDATE TO anon, authenticated
      USING (
        public.jwt_tenant_id() IS NULL
        OR EXISTS (
          SELECT 1 FROM "Vehicle" v
          WHERE v."id" = "Maintenance"."vehicleId"
            AND v."tenantId" = public.jwt_tenant_id()
        )
      )
      WITH CHECK (
        public.jwt_tenant_id() IS NULL
        OR EXISTS (
          SELECT 1 FROM "Vehicle" v
          WHERE v."id" = "Maintenance"."vehicleId"
            AND v."tenantId" = public.jwt_tenant_id()
        )
      );
    CREATE POLICY Maintenance_tx_del ON "Maintenance" FOR DELETE TO anon, authenticated
      USING (
        public.jwt_tenant_id() IS NULL
        OR EXISTS (
          SELECT 1 FROM "Vehicle" v
          WHERE v."id" = "Maintenance"."vehicleId"
            AND v."tenantId" = public.jwt_tenant_id()
        )
      );
  END IF;
END $$;

-- ServiceOrder: via Maintenance -> Vehicle
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = 'ServiceOrder'
  ) THEN
    DROP POLICY IF EXISTS _rls_phase2_bootstrap_all ON "ServiceOrder";
    DROP POLICY IF EXISTS ServiceOrder_tx_sel ON "ServiceOrder";
    DROP POLICY IF EXISTS ServiceOrder_tx_ins ON "ServiceOrder";
    DROP POLICY IF EXISTS ServiceOrder_tx_upd ON "ServiceOrder";
    DROP POLICY IF EXISTS ServiceOrder_tx_del ON "ServiceOrder";

    CREATE POLICY ServiceOrder_tx_sel ON "ServiceOrder" FOR SELECT TO anon, authenticated
      USING (
        public.jwt_tenant_id() IS NULL
        OR EXISTS (
          SELECT 1 FROM "Maintenance" m
          JOIN "Vehicle" v ON v."id" = m."vehicleId"
          WHERE m."id" = "ServiceOrder"."maintenanceId"
            AND v."tenantId" = public.jwt_tenant_id()
        )
      );
    CREATE POLICY ServiceOrder_tx_ins ON "ServiceOrder" FOR INSERT TO anon, authenticated
      WITH CHECK (
        public.jwt_tenant_id() IS NULL
        OR EXISTS (
          SELECT 1 FROM "Maintenance" m
          JOIN "Vehicle" v ON v."id" = m."vehicleId"
          WHERE m."id" = "ServiceOrder"."maintenanceId"
            AND v."tenantId" = public.jwt_tenant_id()
        )
      );
    CREATE POLICY ServiceOrder_tx_upd ON "ServiceOrder" FOR UPDATE TO anon, authenticated
      USING (
        public.jwt_tenant_id() IS NULL
        OR EXISTS (
          SELECT 1 FROM "Maintenance" m
          JOIN "Vehicle" v ON v."id" = m."vehicleId"
          WHERE m."id" = "ServiceOrder"."maintenanceId"
            AND v."tenantId" = public.jwt_tenant_id()
        )
      )
      WITH CHECK (
        public.jwt_tenant_id() IS NULL
        OR EXISTS (
          SELECT 1 FROM "Maintenance" m
          JOIN "Vehicle" v ON v."id" = m."vehicleId"
          WHERE m."id" = "ServiceOrder"."maintenanceId"
            AND v."tenantId" = public.jwt_tenant_id()
        )
      );
    CREATE POLICY ServiceOrder_tx_del ON "ServiceOrder" FOR DELETE TO anon, authenticated
      USING (
        public.jwt_tenant_id() IS NULL
        OR EXISTS (
          SELECT 1 FROM "Maintenance" m
          JOIN "Vehicle" v ON v."id" = m."vehicleId"
          WHERE m."id" = "ServiceOrder"."maintenanceId"
            AND v."tenantId" = public.jwt_tenant_id()
        )
      );
  END IF;
END $$;

-- AuditLog: via User
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = 'AuditLog'
  ) THEN
    DROP POLICY IF EXISTS _rls_phase2_bootstrap_all ON "AuditLog";
    DROP POLICY IF EXISTS AuditLog_tx_sel ON "AuditLog";
    DROP POLICY IF EXISTS AuditLog_tx_ins ON "AuditLog";
    DROP POLICY IF EXISTS AuditLog_tx_upd ON "AuditLog";
    DROP POLICY IF EXISTS AuditLog_tx_del ON "AuditLog";

    CREATE POLICY AuditLog_tx_sel ON "AuditLog" FOR SELECT TO anon, authenticated
      USING (
        public.jwt_tenant_id() IS NULL
        OR EXISTS (
          SELECT 1 FROM "User" u
          WHERE u."id" = "AuditLog"."userId"
            AND u."tenantId" = public.jwt_tenant_id()
        )
      );
    CREATE POLICY AuditLog_tx_ins ON "AuditLog" FOR INSERT TO anon, authenticated
      WITH CHECK (
        public.jwt_tenant_id() IS NULL
        OR EXISTS (
          SELECT 1 FROM "User" u
          WHERE u."id" = "AuditLog"."userId"
            AND u."tenantId" = public.jwt_tenant_id()
        )
      );
    CREATE POLICY AuditLog_tx_upd ON "AuditLog" FOR UPDATE TO anon, authenticated
      USING (
        public.jwt_tenant_id() IS NULL
        OR EXISTS (
          SELECT 1 FROM "User" u
          WHERE u."id" = "AuditLog"."userId"
            AND u."tenantId" = public.jwt_tenant_id()
        )
      )
      WITH CHECK (
        public.jwt_tenant_id() IS NULL
        OR EXISTS (
          SELECT 1 FROM "User" u
          WHERE u."id" = "AuditLog"."userId"
            AND u."tenantId" = public.jwt_tenant_id()
        )
      );
    CREATE POLICY AuditLog_tx_del ON "AuditLog" FOR DELETE TO anon, authenticated
      USING (
        public.jwt_tenant_id() IS NULL
        OR EXISTS (
          SELECT 1 FROM "User" u
          WHERE u."id" = "AuditLog"."userId"
            AND u."tenantId" = public.jwt_tenant_id()
        )
      );
  END IF;
END $$;
