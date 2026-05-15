-- Migration: 20260515100004_security_create_jwt_functions
-- Description: Create helper functions used by RLS policies:
--              jwt_tenant_id() extracts tenant_id from the JWT,
--              app_bootstrap_allow_rls() is a permissive stub used during the bootstrap phase.

BEGIN;

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

COMMIT;
