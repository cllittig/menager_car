-- Migration: 20260515100003_security_revoke_anon_select
-- Description: Revoke SELECT on all public tables from the anon role.
--              Read access is re-granted selectively via RLS policies.

BEGIN;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('REVOKE SELECT ON TABLE public.%I FROM anon', r.tablename);
  END LOOP;
END $$;

COMMIT;
