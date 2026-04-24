-- DESTRUTIVO: remove todo o conteudo do schema public (tabelas, tipos ENUM, funcoes neste schema).
-- Nao mexe em auth, storage, realtime, extensions (Supabase).
-- Depois deste script, rode apply-schema-fresh.sql (ex.: npm run db:apply ou npm run db:apply:fresh).
--
-- NAO execute no painel de producao sem backup.

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;
