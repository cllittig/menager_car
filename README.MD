# Sistema Veicular

Monorepo com **frontend** (Next.js App Router) e **backend** (NestJS), integração com **Supabase** e API REST.

Documentação operacional adicional pode existir em `docs/` (se usada localmente). Este README cobre o essencial para rodar e entender a arquitetura.

## Execução rápida

- **Backend:** `cd backend`, `npm install`, copiar/configurar `.env`, `npm run start:dev` (porta padrão comum: **3005** — conferir env).
- **Frontend:** `cd frontend`, `npm install`, configurar `.env.local` (`NEXT_PUBLIC_API_URL`, variáveis de auth/BFF se aplicável), `npm run dev`.

## Arquitetura do frontend (visão DDD)

- **`frontend/lib/<contexto>/`**: camadas **domain** (tipos, contratos de repositório), **application** (casos de uso, hooks React Query), **infrastructure** (HTTP/axios).
- **`frontend/lib/services/*`**: fachadas de compatibilidade que reexportam tipos e application services (migração incremental).
- **`frontend/app/`**: rotas e páginas (preferir páginas finas + componentes em `components/`).
- **Estado servidor:** TanStack Query (`lib/providers/query-provider.tsx`) com chaves centralizadas (`vehicleKeys`, `clientKeys`, etc.).
- **Auth:** JWT no cliente (cookie legível por JS + sessionStorage em fluxo legado); BFF em `frontend/app/api/auth/*` para login/refresh/logout quando habilitado (`NEXT_PUBLIC_AUTH_*`).

## Qualidade e testes

- Frontend: `npm run lint`, `npm run type-check`, `npm run test`, `npm run build`.
- Backend: ver `package.json` do backend (Jest em módulos com `*.spec.ts`).

## Banco (Supabase)

Histórico SQL em `backend/supabase/schema-migrations-legacy/`. Schema agregado: `npm run merge:schema` gera `backend/supabase/apply-schema-fresh.sql`; aplicar com `npm run db:apply` (ver `backend/config.env.template`). RLS opcional: `backend/supabase/rls_policies.sql`.

## Segurança (leitura obrigatória para evolução)

- O **access token** acessível a JavaScript aumenta impacto de XSS; evolução recomendada: access token de curta duração + refresh **HttpOnly** (BFF já prepara parte do fluxo).
- Headers de segurança e cache de rotas sensíveis estão em `frontend/next.config.mjs`.

## CI (GitHub Actions)

Workflow em `.github/workflows/ci.yml`: formatação, lint, TypeScript, testes e build por app.
