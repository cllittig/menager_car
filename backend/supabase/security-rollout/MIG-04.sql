-- MIG-04: helpers para RLS
CREATE OR REPLACE FUNCTION public.jwt_tenant_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'tenant_id',
    auth.jwt() -> 'user_metadata' ->> 'tenant_id'
  );
$$;

CREATE OR REPLACE FUNCTION public.app_bootstrap_allow_rls()
RETURNS boolean
LANGUAGE sql
STABLE
AS 'SELECT true';
