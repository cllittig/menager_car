-- Migration: 20260515100002_security_revoke_write_from_roles
-- Description: Revoke all write DML (INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER)
--              on existing public tables from anon and authenticated roles.
--              Grants USAGE on the public schema so read via RLS remains possible.

BEGIN;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.%I FROM anon, authenticated',
      r.tablename
    );
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;

COMMIT;
