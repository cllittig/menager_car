-- ARQUIVO LEGADO — não aplicar em produção.
-- Policies originais usando current_setting('request.jwt.claim.tenantId').
-- Foram substituídas pelas policies baseadas em public.jwt_tenant_id() nas migrações
-- 20260515100005 até 20260515100008 (antes chamadas MIG-05 a MIG-08).

ALTER TABLE "User"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vehicle"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contract"    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_tenant_select" ON "User"
  FOR SELECT USING (
    "tenantId" = (current_setting('request.jwt.claim.tenantId', true))::text
  );

CREATE POLICY "user_tenant_update" ON "User"
  FOR UPDATE USING (
    "tenantId" = (current_setting('request.jwt.claim.tenantId', true))::text
  );

CREATE POLICY "vehicle_tenant_all" ON "Vehicle"
  FOR ALL USING (
    "tenantId" = (current_setting('request.jwt.claim.tenantId', true))::text
  )
  WITH CHECK (
    "tenantId" = (current_setting('request.jwt.claim.tenantId', true))::text
  );

CREATE POLICY "client_tenant_all" ON "Client"
  FOR ALL USING (
    "tenantId" = (current_setting('request.jwt.claim.tenantId', true))::text
  )
  WITH CHECK (
    "tenantId" = (current_setting('request.jwt.claim.tenantId', true))::text
  );

CREATE POLICY "transaction_tenant_all" ON "Transaction"
  FOR ALL USING (
    "tenantId" = (current_setting('request.jwt.claim.tenantId', true))::text
  )
  WITH CHECK (
    "tenantId" = (current_setting('request.jwt.claim.tenantId', true))::text
  );

CREATE POLICY "contract_tenant_all" ON "Contract"
  FOR ALL USING (
    "tenantId" = (current_setting('request.jwt.claim.tenantId', true))::text
  )
  WITH CHECK (
    "tenantId" = (current_setting('request.jwt.claim.tenantId', true))::text
  );
