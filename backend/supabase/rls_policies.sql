-- Supabase RLS baseline for multi-tenant isolation
-- Execute after schema migration in Supabase SQL editor.

alter table "User" enable row level security;
alter table "Vehicle" enable row level security;
alter table "Client" enable row level security;
alter table "Transaction" enable row level security;
alter table "Contract" enable row level security;

-- Helpers:
-- JWT must contain tenantId claim in app_metadata or custom claim map.
-- Example uses request.jwt.claim.tenantId (adjust if your Supabase JWT mapping differs).

create policy "user_tenant_select" on "User"
for select using (tenantId = (current_setting('request.jwt.claim.tenantId', true))::text);

create policy "user_tenant_update" on "User"
for update using (tenantId = (current_setting('request.jwt.claim.tenantId', true))::text);

create policy "vehicle_tenant_all" on "Vehicle"
for all using (tenantId = (current_setting('request.jwt.claim.tenantId', true))::text)
with check (tenantId = (current_setting('request.jwt.claim.tenantId', true))::text);

create policy "client_tenant_all" on "Client"
for all using (tenantId = (current_setting('request.jwt.claim.tenantId', true))::text)
with check (tenantId = (current_setting('request.jwt.claim.tenantId', true))::text);

create policy "transaction_tenant_all" on "Transaction"
for all using (tenantId = (current_setting('request.jwt.claim.tenantId', true))::text)
with check (tenantId = (current_setting('request.jwt.claim.tenantId', true))::text);

create policy "contract_tenant_all" on "Contract"
for all using (tenantId = (current_setting('request.jwt.claim.tenantId', true))::text)
with check (tenantId = (current_setting('request.jwt.claim.tenantId', true))::text);
