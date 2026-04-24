/**
 * Aplica backend/supabase/apply-schema-fresh.sql via Postgres (CLI).
 *
 * Ordem de URL (primeira definida):
 *   1) MIGRATE_DATABASE_URL — recomendado: cole a URI "Session pooler" (porta 5432) do Connect
 *   2) DIRECT_URL
 *   3) DATABASE_URL
 *   4) SUPABASE_URL + SUPABASE_DB_PASSWORD + SUPABASE_POOLER_HOST (host completo do painel)
 *   5) SUPABASE_URL + SUPABASE_DB_PASSWORD + SUPABASE_POOLER_REGION — tenta aws-0 e aws-1 (ex.: sa-east-1)
 *   6) SUPABASE_URL + SUPABASE_DB_PASSWORD (direct db.* — IPv6)
 *
 * "Tenant or user not found" no pooler: host errado. Nem todo projeto usa aws-0; alguns usam aws-1-REGIAO.
 * Cole o host exato em SUPABASE_POOLER_HOST ou use MIGRATE_DATABASE_URL do Connect.
 *
 * Uso:
 *   npm run db:apply                    — schema completo (banco NOVO / vazio)
 *   npm run db:apply:inventory          — só RF18–RF33 (banco que já tem o core)
 *   npm run db:apply:fresh              — apaga public e recria schema completo (veja abaixo)
 *
 * Opcional: node scripts/apply-schema-from-env.js caminho/relativo/ao/backend/arquivo.sql
 *
 * db:apply:fresh exige no ambiente: DB_RESET_CONFIRM=APAGAR_PUBLIC_SCHEMA
 * (PowerShell: $env:DB_RESET_CONFIRM='APAGAR_PUBLIC_SCHEMA'; npm run db:apply:fresh)
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { configDotenv } = require('dotenv');

configDotenv({ path: path.join(__dirname, '../.env') });

const RESET_CONFIRM = 'APAGAR_PUBLIC_SCHEMA';
const backendRoot = path.join(__dirname, '..');
const argv = process.argv.slice(2);
const isFresh = argv.includes('--fresh');
const argSql = argv.find((a) => a !== '--fresh' && !a.startsWith('-'))?.trim();

const sqlFile = argSql
  ? path.isAbsolute(argSql)
    ? argSql
    : path.join(backendRoot, argSql)
  : path.join(backendRoot, 'supabase/apply-schema-fresh.sql');

const resetPublicSchemaPath = path.join(backendRoot, 'supabase/reset-public-schema.sql');

const PG_COMPAT_QUERY = 'uselibpqcompat=true&sslmode=require';

function extractProjectRef(supabaseUrl) {
  if (!supabaseUrl || typeof supabaseUrl !== 'string') {
    return null;
  }
  try {
    const u = new URL(supabaseUrl.trim());
    const host = u.hostname.toLowerCase();
    const m = host.match(/^([a-z0-9-]+)\.supabase\.co$/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function safeHostForLog(urlString) {
  try {
    const u = new URL(urlString.replace(/^postgres(ql)?:\/\//i, 'http://'));
    return `${u.hostname}:${u.port || '5432'}`;
  } catch {
    return '(URL invalida)';
  }
}

function appendSslCompat(url) {
  let out = url;
  if (!/sslmode=/i.test(out) && !/localhost|127\.0\.0\.1/i.test(out)) {
    out += (out.includes('?') ? '&' : '?') + PG_COMPAT_QUERY;
  } else if (/sslmode=require/i.test(out) && !/uselibpqcompat=/i.test(out)) {
    out += (out.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
  }
  return out;
}

/**
 * Session pooler: usuario postgres.<project_ref> — ver Connect > Session pooler no painel.
 * @returns {{ label: string, url: string }[]}
 */
function buildPoolerSessionCandidates() {
  const base = process.env.SUPABASE_URL?.trim();
  const password =
    process.env.SUPABASE_DB_PASSWORD?.trim() ||
    process.env.POSTGRES_PASSWORD?.trim() ||
    process.env.DATABASE_PASSWORD?.trim();

  const hostFull = process.env.SUPABASE_POOLER_HOST?.trim();
  const region = process.env.SUPABASE_POOLER_REGION?.trim();
  const port = parseInt(process.env.SUPABASE_POOLER_PORT || '5432', 10);

  if (!base || !password) {
    return [];
  }

  const ref = extractProjectRef(base);
  if (!ref) {
    return [];
  }

  const enc = encodeURIComponent(password);
  const user = `postgres.${ref}`;
  const userEnc = encodeURIComponent(user);

  function urlForHost(poolHost) {
    return appendSslCompat(
      `postgresql://${userEnc}:${enc}@${poolHost}:${port}/postgres`,
    );
  }

  if (hostFull) {
    return [
      {
        label: 'SUPABASE_POOLER_HOST (Session pooler)',
        url: urlForHost(hostFull),
      },
    ];
  }

  if (!region) {
    return [];
  }

  const hosts = [
    `aws-0-${region}.pooler.supabase.com`,
    `aws-1-${region}.pooler.supabase.com`,
  ];

  return hosts.map((h) => ({
    label: `SUPABASE_POOLER_REGION Session (${h})`,
    url: urlForHost(h),
  }));
}

function buildDirectFromSupabase() {
  const base = process.env.SUPABASE_URL?.trim();
  const password =
    process.env.SUPABASE_DB_PASSWORD?.trim() ||
    process.env.POSTGRES_PASSWORD?.trim() ||
    process.env.DATABASE_PASSWORD?.trim();

  if (!base || !password) {
    return null;
  }

  const ref = extractProjectRef(base);
  if (!ref) {
    console.error(
      'SUPABASE_URL invalida ou nao e https://<ref>.supabase.co — nao foi possivel obter o project ref.',
    );
    process.exit(1);
  }

  const enc = encodeURIComponent(password);
  return appendSslCompat(
    `postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres`,
  );
}

function resolveConnectionUrlsInOrder() {
  const list = [];

  const migrate = process.env.MIGRATE_DATABASE_URL?.trim();
  if (migrate) {
    list.push({ label: 'MIGRATE_DATABASE_URL', url: appendSslCompat(migrate) });
  }

  list.push(...buildPoolerSessionCandidates());

  const direct = process.env.DIRECT_URL?.trim();
  if (direct) {
    list.push({ label: 'DIRECT_URL', url: appendSslCompat(direct) });
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    list.push({ label: 'DATABASE_URL', url: appendSslCompat(databaseUrl) });
  }

  const directBuilt = buildDirectFromSupabase();
  if (directBuilt) {
    list.push({
      label: 'SUPABASE_URL+SUPABASE_DB_PASSWORD (direct IPv6)',
      url: directBuilt,
    });
  }

  return list;
}

function printMissingEnvHelp() {
  console.error(
    'Nenhuma URL de Postgres utilizavel.\n\n' +
      'Opcao 1 (recomendada, funciona em Windows / IPv4):\n' +
      '  No Supabase: Connect > Session pooler > copie a URI (porta 5432).\n' +
      '  No .env:\n' +
      '    MIGRATE_DATABASE_URL=postgresql://postgres.SEU_REF:senha@aws-0-REGIAO.pooler.supabase.com:5432/postgres\n' +
      '  (usuario = postgres.SEU_REF; senha com caracteres especiais: codifique na URI ou use variavel abaixo)\n\n' +
      'Opcao 2 — host do pooler copiado do painel (recomendado se so regiao falhar):\n' +
      '  SUPABASE_URL=https://SEU_REF.supabase.co\n' +
      '  SUPABASE_DB_PASSWORD=senha\n' +
      '  SUPABASE_POOLER_HOST=aws-1-sa-east-1.pooler.supabase.com\n' +
      '  (veja Connect > Session pooler; pode ser aws-0 ou aws-1)\n\n' +
      'Opcao 3 — so regiao (tenta aws-0 e aws-1 automaticamente):\n' +
      '  SUPABASE_POOLER_REGION=sa-east-1\n\n' +
      'Opcao 4 — conexao direta (so se sua rede tem IPv6):\n' +
      '  DIRECT_URL=postgresql://postgres:senha@db.SEU_REF.supabase.co:5432/postgres\n',
  );
}

function useSsl(url) {
  if (/localhost|127\.0\.0\.1/i.test(url)) {
    return undefined;
  }
  return { rejectUnauthorized: false };
}

function isNotFoundError(msg) {
  return msg.includes('ENOTFOUND') || msg.includes('getaddrinfo');
}

async function tryConnect(url) {
  const client = new Client({
    connectionString: url,
    ssl: useSsl(url),
  });
  await client.connect();
  return client;
}

function requireResetConfirm(contextLabel) {
  if (process.env.DB_RESET_CONFIRM?.trim() !== RESET_CONFIRM) {
    console.error(
      `${contextLabel}: operacao destrutiva bloqueada.\n` +
        `Defina DB_RESET_CONFIRM=${RESET_CONFIRM} no ambiente e execute de novo.\n` +
        `Ex. PowerShell: $env:DB_RESET_CONFIRM='${RESET_CONFIRM}'; npm run db:apply:fresh`,
    );
    process.exit(1);
  }
}

async function main() {
  if (isFresh && argSql) {
    console.error('Use apenas --fresh (sem caminho de .sql). O schema aplicado sera apply-schema-fresh.sql.');
    process.exit(1);
  }

  if (!fs.existsSync(sqlFile)) {
    console.error(
      'Arquivo nao encontrado:',
      sqlFile,
      '\nBanco novo: npm run merge:schema && npm run db:apply',
      '\nBanco existente: npm run db:apply:inventory',
    );
    process.exit(1);
  }

  const basename = path.basename(sqlFile);
  if (basename === 'reset-public-schema.sql') {
    requireResetConfirm('reset-public-schema.sql');
  }
  if (isFresh) {
    requireResetConfirm('db:apply:fresh');
    if (!fs.existsSync(resetPublicSchemaPath)) {
      console.error('Arquivo nao encontrado:', resetPublicSchemaPath);
      process.exit(1);
    }
  }

  const candidates = resolveConnectionUrlsInOrder();
  if (candidates.length === 0) {
    printMissingEnvHelp();
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlFile, 'utf8');
  const resetSql = isFresh ? fs.readFileSync(resetPublicSchemaPath, 'utf8') : null;
  let lastErr = null;

  for (const { label, url } of candidates) {
    console.log(`Tentando [${label}] -> ${safeHostForLog(url)} ...`);
    try {
      const client = await tryConnect(url);
      try {
        if (isFresh) {
          console.log('Executando reset do schema public...');
          await client.query(resetSql);
          console.log('Aplicando apply-schema-fresh.sql...');
          await client.query(sql);
          console.log('Banco recriado (public) e schema aplicado.');
        } else {
          await client.query(sql);
          console.log('Schema aplicado com sucesso:', sqlFile);
        }
      } finally {
        await client.end().catch(() => {});
      }
      process.exit(0);
      return;
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.error('  Falhou:', msg.split('\n')[0]);

      if (isNotFoundError(msg) && label.includes('direct IPv6')) {
        console.error(
          '  (Conexao direta db.* costuma exigir IPv6. Use pooler ou MIGRATE_DATABASE_URL.)',
        );
      }
      if (/Tenant or user not found/i.test(msg)) {
        console.error(
          '  -> Host do pooler errado para este projeto. Em Connect > Session pooler copie o host completo\n' +
            '     para SUPABASE_POOLER_HOST ou cole a URI inteira em MIGRATE_DATABASE_URL (nao use aws-0 chutado).',
        );
      }
    }
  }

  console.error('\nNenhuma conexao funcionou. Ultimo erro:', lastErr?.message || lastErr);
  if (lastErr && isNotFoundError(String(lastErr.message || lastErr))) {
    console.error(
      '\nEm redes só IPv4 (comum no Windows), use MIGRATE_DATABASE_URL ou SUPABASE_POOLER_HOST do painel.\n',
    );
  }
  if (lastErr && /Tenant or user not found/i.test(String(lastErr.message || lastErr))) {
    console.error(
      '\nDefina SUPABASE_POOLER_HOST exatamente como em Supabase > Connect > Session pooler,\n' +
        'ou MIGRATE_DATABASE_URL completa. O cluster pode ser aws-1-REGION, nao aws-0.\n',
    );
  }
  process.exit(1);
}

main().catch((err) => {
  console.error('Erro:', err instanceof Error ? err.message : err);
  process.exit(1);
});
