-- MIG-03: REVOKE SELECT anon (alto risco — só com SECURITY_APPLY_MIG03=true no runner)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('REVOKE SELECT ON TABLE public.%I FROM anon', r.tablename);
  END LOOP;
END $$;
