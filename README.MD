# Sistema Veicular (ManagerCar)

Monorepo para **gestão de veículos, clientes, vendas e operações** voltado a concessionárias e revendas. O **frontend** é uma aplicação [Next.js](https://nextjs.org/) (App Router, React 19) e o **backend** é uma API REST em [NestJS](https://nestjs.com/) com persistência e auth integradas ao **Supabase** (PostgreSQL).

| Camada | Pacote / pasta | Tecnologias principais |
|--------|------------------|-------------------------|
| Frontend | `frontend/` | Next.js 16, TanStack Query, Axios, Tailwind, Radix UI, Zod, Vitest |
| Backend | `backend/` | NestJS 11, JWT/Passport, Supabase JS, Swagger, Jest, Redis (cache opcional) |
| Dados | Supabase | Migrações legadas e scripts em `backend/supabase/` |

## Pré-requisitos

- **Node.js 20** (mesma versão usada no CI em `.github/workflows/ci.yml`).
- Conta e projeto **Supabase** com URL e chaves de API configuradas.
- **Redis** opcional em produção (variáveis em `backend/config.env.template`).

## Execução local

### 1. Backend

```bash
cd backend
npm install
```

Copie `backend/config.env.template` para `backend/.env` e preencha ao menos: `JWT_SECRET` (mínimo 32 caracteres), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, e ajuste `PORT` (padrão **3005**), `FRONTEND_URL` e `CORS_ORIGIN` se necessário.

Para desenvolvimento com hot reload:

```bash
npm run start:dev
```

A API sobe em `http://localhost:3005` (ou no `PORT` definido). Documentação interativa **Swagger**: `http://localhost:3005/api/docs`.

### 2. Frontend

```bash
cd frontend
npm install
```

Copie `frontend/.env.example` para `frontend/.env.local` e configure `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL` (ex.: `http://localhost:3005`), `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Comentários no arquivo explicam modo dinâmico de host da API, BFF de auth e origens de dev.

```bash
npm run dev
```

A interface padrão fica em `http://localhost:3000`.

### 3. Banco (Supabase)

- Histórico de SQL: `backend/supabase/schema-migrations-legacy/`.
- Gerar schema agregado: na pasta `backend`, `npm run merge:schema` produz `backend/supabase/apply-schema-fresh.sql`.
- Aplicar: `npm run db:apply` (credenciais conforme `backend/config.env.template`). RLS opcional: `backend/supabase/rls_policies.sql`.
- Fluxo combinado (merge + apply + verificação): `npm run db:setup`.

## Módulos da API (backend)

Principais domínios expostos pelo NestJS (ver `backend/src/app.module.ts`): autenticação e usuários, veículos, clientes, vendas, manutenção, contratos, dashboard, categorias, fornecedores, produtos e relatórios. Há rate limiting global (Throttler), Helmet, compressão e CORS configurados em `backend/src/main.ts`.

## Arquitetura do frontend (visão DDD)

- **`frontend/lib/<contexto>/`**: camadas **domain** (tipos, contratos de repositório), **application** (casos de uso, hooks React Query), **infrastructure** (HTTP/Axios).
- **`frontend/lib/services/*`**: fachadas de compatibilidade que reexportam tipos e serviços de aplicação (migração incremental).
- **`frontend/app/`**: rotas e páginas (preferir páginas finas; UI em `frontend/components/`).
- **Estado servidor:** TanStack Query (`frontend/lib/providers/query-provider.tsx`) com chaves agrupadas (`vehicleKeys`, `clientKeys`, etc.).
- **Auth:** JWT no cliente (cookie legível por JS e fluxo legado com sessionStorage); rotas BFF em `frontend/app/api/auth/*` quando habilitado (`NEXT_PUBLIC_AUTH_*` / variáveis relacionadas em `.env.example`).

## Qualidade e testes

Na pasta correspondente (`frontend` ou `backend`):

| Objetivo | Frontend | Backend |
|----------|----------|---------|
| Formatação | `npm run format:check` | `npm run format:check` |
| Lint | `npm run lint` | `npm run lint` |
| TypeScript | `npm run type-check` | `npm run type-check` |
| Testes | `npm run test` (Vitest) | `npm test` (Jest; `*.spec.ts`) |
| Build | `npm run build` | `npm run build` |

Scripts adicionais do backend: `npm run test:cov`, `npm run test:e2e`, `npm run test:integration`, `npm run verify:supabase`, `npm run security:validate`.

## CI (GitHub Actions)

O workflow `.github/workflows/ci.yml` roda em `push`/`pull_request` para `main` e `develop`: checagem Prettier, ESLint, TypeScript e build para **frontend** e **backend**; testes Jest no backend; job de `npm audit` com nível alto (não bloqueante). Variáveis de build de exemplo: `NEXT_PUBLIC_API_URL=http://localhost:3005`, `JWT_SECRET` com tamanho mínimo para o pipeline.

## Segurança (evolução)

- **Access token** acessível a JavaScript aumenta o impacto de XSS; a evolução recomendada é access token de curta duração com refresh em cookie **HttpOnly** (o BFF cobre parte desse fluxo quando ativado).
- Headers e políticas de cache para rotas sensíveis estão em `frontend/next.config.mjs`.

## Documentação extra

Se existir material operacional local, pode estar em `docs/`; este README concentra o necessário para clonar, configurar ambientes e entender a divisão frontend/backend.
