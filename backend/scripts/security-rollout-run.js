/**
 * Hardening + RLS rollout (MIG-01 .. MIG-08) com snapshot OLD/NEW, validação e relatório.
 *
 * Uso: npm run security:rollout
 *
 * Variáveis opcionais:
 *   SECURITY_APPLY_MIG03=true   — REVOKE SELECT anon em todas as tabelas public (alto risco)
 *   SECURITY_APPLY_MIG08=true   — remove ramo jwt_tenant_id() IS NULL nas policies (alto risco)
 *
 * Requer a mesma resolução de URL que apply-schema-from-env.js (MIGRATE_DATABASE_URL, etc.)
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { configDotenv } = require('dotenv');

configDotenv({ path: path.join(__dirname, '../.env') });

const backendRoot = path.join(__dirname, '..');
const rolloutDir = path.join(backendRoot, 'supabase/security-rollout');
const stateDir = path.join(rolloutDir, '_state');

const PG_COMPAT_QUERY = 'uselibpqcompat=true&sslmode=require';

const CRITICAL_TABLES = [
  'Tenant',
  'User',
  'Vehicle',
  'Client',
  'Contract',
  'Transaction',
  'Installment',
  'Maintenance',
  'ServiceOrder',
  'AuditLog',
  'Category',
  'Supplier',
  'Product',
  'StockMovement',
  'PasswordReset',
  'RefreshSession',
  'ReportSnapshot',
  'ReportSchedule',
];

const LEGACY_POLICIES = [
  ['User', 'user_tenant_select'],
  ['User', 'user_tenant_update'],
  ['Vehicle', 'vehicle_tenant_all'],
  ['Client', 'client_tenant_all'],
  ['Transaction', 'transaction_tenant_all'],
  ['Contract', 'contract_tenant_all'],
];

function appendSsl(url) {
  let out = url;
  if (!/sslmode=/i.test(out) && !/localhost|127\.0\.0\.1/i.test(out)) {
    out += (out.includes('?') ? '&' : '?') + PG_COMPAT_QUERY;
  } else if (/sslmode=require/i.test(out) && !/uselibpqcompat=/i.test(out)) {
    out += (out.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
  }
  return out;
}

function extractProjectRef(supabaseUrl) {
  if (!supabaseUrl || typeof supabaseUrl !== 'string') return null;
  try {
    const u = new URL(supabaseUrl.trim());
    const host = u.hostname.toLowerCase();
    const m = host.match(/^([a-z0-9-]+)\.supabase\.co$/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function buildPoolerSessionCandidates() {
  const base = process.env.SUPABASE_URL?.trim();
  const password =
    process.env.SUPABASE_DB_PASSWORD?.trim() ||
    process.env.POSTGRES_PASSWORD?.trim() ||
    process.env.DATABASE_PASSWORD?.trim();
  const hostFull = process.env.SUPABASE_POOLER_HOST?.trim();
  const region = process.env.SUPABASE_POOLER_REGION?.trim();
  const port = parseInt(process.env.SUPABASE_POOLER_PORT || '5432', 10);
  if (!base || !password) return [];
  const ref = extractProjectRef(base);
  if (!ref) return [];
  const enc = encodeURIComponent(password);
  const userEnc = encodeURIComponent(`postgres.${ref}`);
  function urlForHost(poolHost) {
    return appendSsl(`postgresql://${userEnc}:${enc}@${poolHost}:${port}/postgres`);
  }
  if (hostFull) return [{ label: 'SUPABASE_POOLER_HOST', url: urlForHost(hostFull) }];
  if (!region) return [];
  return [`aws-0-${region}.pooler.supabase.com`, `aws-1-${region}.pooler.supabase.com`].map(
    (h) => ({ label: `pooler ${h}`, url: urlForHost(h) }),
  );
}

function buildDirectFromSupabase() {
  const base = process.env.SUPABASE_URL?.trim();
  const password =
    process.env.SUPABASE_DB_PASSWORD?.trim() ||
    process.env.POSTGRES_PASSWORD?.trim() ||
    process.env.DATABASE_PASSWORD?.trim();
  if (!base || !password) return null;
  const ref = extractProjectRef(base);
  if (!ref) return null;
  return appendSsl(`postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`);
}

function resolveConnectionUrlsInOrder() {
  const list = [];
  const migrate = process.env.MIGRATE_DATABASE_URL?.trim();
  if (migrate) list.push({ label: 'MIGRATE_DATABASE_URL', url: appendSsl(migrate) });
  list.push(...buildPoolerSessionCandidates());
  const direct = process.env.DIRECT_URL?.trim();
  if (direct) list.push({ label: 'DIRECT_URL', url: appendSsl(direct) });
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) list.push({ label: 'DATABASE_URL', url: appendSsl(databaseUrl) });
  const directBuilt = buildDirectFromSupabase();
  if (directBuilt) list.push({ label: 'SUPABASE direct', url: directBuilt });
  return list;
}

function useSsl(url) {
  if (/localhost|127\.0\.0\.1/i.test(url)) return undefined;
  return { rejectUnauthorized: false };
}

async function tryConnect(url) {
  const client = new Client({ connectionString: url, ssl: useSsl(url) });
  await client.connect();
  return client;
}

async function snapshot(client, label) {
  const grants = await client.query(`
      SELECT table_schema, table_name, privilege_type, grantee
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND grantee IN ('anon', 'authenticated', 'service_role')
      ORDER BY table_name, grantee, privilege_type
    `);
  const rls = await client.query(`
      SELECT c.relname AS table_name, c.relrowsecurity, c.relforcerowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY c.relname
    `);
  const policies = await client.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `);
  const tables = await client.query(`
      SELECT c.relname AS table_name, a.attname AS column_name,
             format_type(a.atttypid, a.atttypmod) AS data_type
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
        AND a.attnum > 0 AND NOT a.attisdropped
        AND c.relname = ANY($1::name[])
      ORDER BY c.relname, a.attnum
    `, [CRITICAL_TABLES]);

  return {
    label,
    capturedAt: new Date().toISOString(),
    grants: grants.rows,
    rls: rls.rows,
    policies: policies.rows,
    criticalColumns: tables.rows,
  };
}

function writeJson(name, data) {
  if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });
  const p = path.join(stateDir, name);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  return p;
}

function loadMigFile(num) {
  const p = path.join(rolloutDir, `MIG-${String(num).padStart(2, '0')}.sql`);
  if (!fs.existsSync(p)) throw new Error(`Arquivo ausente: ${p}`);
  return fs.readFileSync(p, 'utf8');
}

async function tableExists(client, relname) {
  const r = await client.query(
    `SELECT 1 FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = $1`,
    [relname],
  );
  return r.rowCount > 0;
}

async function validateCriticalRls(client, report) {
  const missing = [];
  for (const t of CRITICAL_TABLES) {
    if (!(await tableExists(client, t))) continue;
    const r = await client.query(
      `SELECT c.relrowsecurity FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = $1`,
      [t],
    );
    if (!r.rows[0]?.relrowsecurity) missing.push(t);
  }
  if (missing.length) {
    report.errors.push(`RLS ausente em: ${missing.join(', ')}`);
    return false;
  }
  return true;
}

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

async function validateAnonDml(client, report) {
  const r = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
  const bad = [];
  for (const { tablename } of r.rows) {
    const reg = `public.${quoteIdent(tablename)}`;
    for (const priv of ['INSERT', 'UPDATE', 'DELETE']) {
      const x = await client.query(`SELECT has_table_privilege('anon'::name, $1::regclass, $2)`, [
        reg,
        priv,
      ]);
      if (x.rows[0]?.has_table_privilege) bad.push(`${tablename}:${priv}`);
    }
  }
  if (bad.length) {
    report.warnings.push(`anon ainda possui DML: ${bad.join(', ')}`);
    return false;
  }
  return true;
}

function diffSnapshots(oldS, newS) {
  const grantKey = (g) => `${g.table_name}|${g.grantee}|${g.privilege_type}`;
  const oldG = new Map(oldS.grants.map((g) => [grantKey(g), g]));
  const newG = new Map(newS.grants.map((g) => [grantKey(g), g]));
  const grantsRemoved = [];
  const grantsAdded = [];
  for (const [k, v] of oldG) if (!newG.has(k)) grantsRemoved.push(v);
  for (const [k, v] of newG) if (!oldG.has(k)) grantsAdded.push(v);

  const rlsOld = new Map(oldS.rls.map((x) => [x.table_name, x]));
  const rlsNew = new Map(newS.rls.map((x) => [x.table_name, x]));
  const rlsEnabled = [];
  for (const [t, row] of rlsNew) {
    const o = rlsOld.get(t);
    if (row.relrowsecurity && (!o || !o.relrowsecurity)) rlsEnabled.push(t);
  }

  const polKey = (p) => `${p.tablename}|${p.policyname}`;
  const oldP = new Map(oldS.policies.map((p) => [polKey(p), p]));
  const newP = new Map(newS.policies.map((p) => [polKey(p), p]));
  const policiesRemoved = [];
  const policiesAdded = [];
  for (const [k, v] of oldP) if (!newP.has(k)) policiesRemoved.push(v);
  for (const [k, v] of newP) if (!oldP.has(k)) policiesAdded.push(v);

  return { grantsRemoved, grantsAdded, rlsEnabled, policiesRemoved, policiesAdded };
}

async function main() {
  const report = {
    summary: { status: 'Falha', completedMigrations: [], skippedMigrations: [] },
    errors: [],
    warnings: [],
    risks: [],
    recommendations: [],
    diff: null,
    serviceRoleNote:
      'No Supabase, service_role ignora RLS; o backend Nest não é bloqueado pelas policies em relação a esse papel.',
  };

  const urls = resolveConnectionUrlsInOrder();
  if (!urls.length) {
    report.errors.push('Nenhuma URL Postgres (MIGRATE_DATABASE_URL, pooler, DIRECT_URL, DATABASE_URL).');
    writeJson('REPORT.json', report);
    console.error(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  let client;
  let lastErr;
  for (const { label, url } of urls) {
    try {
      client = await tryConnect(url);
      report.connection = { label, host: url.replace(/:[^:@/]+@/, ':****@') };
      break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!client) {
    report.errors.push(`Conexão falhou: ${lastErr?.message || lastErr}`);
    writeJson('REPORT.json', report);
    console.error(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  try {
    const oldSnap = await snapshot(client, 'STATE_OLD');
    writeJson('STATE_OLD.json', oldSnap);

    const migrations = [1, 2, 3, 4, 5, 6, 7, 8];
    for (const num of migrations) {
      if (num === 3 && process.env.SECURITY_APPLY_MIG03 !== 'true') {
        report.summary.skippedMigrations.push('MIG-03');
        report.warnings.push('MIG-03 omitida (defina SECURITY_APPLY_MIG03=true para REVOKE SELECT anon).');
        continue;
      }
      if (num === 8 && process.env.SECURITY_APPLY_MIG08 !== 'true') {
        report.summary.skippedMigrations.push('MIG-08');
        report.warnings.push(
          'MIG-08 omitida (defina SECURITY_APPLY_MIG08=true após 100% JWT com app_metadata.tenant_id).',
        );
        continue;
      }

      const sql = loadMigFile(num);
      try {
        await client.query(sql);
        report.summary.completedMigrations.push(`MIG-${String(num).padStart(2, '0')}`);
      } catch (e) {
        report.errors.push(`MIG-${String(num).padStart(2, '0')} falhou: ${e.message || e}`);
        throw e;
      }

      if (num >= 5) {
        const ok = await validateCriticalRls(client, report);
        if (!ok) throw new Error('Validação RLS pós-migração falhou');
      }
      if (num === 2) {
        const anonOk = await validateAnonDml(client, report);
        if (!anonOk) {
          report.errors.push('MIG-02: anon ainda possui INSERT/UPDATE/DELETE em public — abortar.');
          throw new Error('Validação anon DML falhou após MIG-02');
        }
      }
    }

    const newSnap = await snapshot(client, 'STATE_NEW');
    writeJson('STATE_NEW.json', newSnap);
    report.diff = diffSnapshots(oldSnap, newSnap);

    const finalRlsOk = await validateCriticalRls(client, report);
    const finalAnonOk = await validateAnonDml(client, report);

    if (!finalRlsOk) report.summary.status = 'Falha parcial';
    else if (!finalAnonOk || report.warnings.length) report.summary.status = 'Sucesso com ressalvas';
    else report.summary.status = 'Sucesso';

    if (process.env.SECURITY_APPLY_MIG03 !== 'true') {
      report.recommendations.push('Avaliar SECURITY_APPLY_MIG03=true em staging após confirmar ausência de SELECT anon necessário.');
    }
    if (process.env.SECURITY_APPLY_MIG08 !== 'true') {
      report.recommendations.push('Após JWT com tenant_id estável, aplicar SECURITY_APPLY_MIG08=true.');
    }
    if (report.diff.policiesAdded.length === 0 && report.summary.completedMigrations.includes('MIG-06')) {
      report.warnings.push('Nenhuma policy nova detectada no diff — verifique se MIG-06 aplicou corretamente.');
    }
  } finally {
    await client.end().catch(() => {});
  }

  writeJson('REPORT.json', report);
  console.log(JSON.stringify(report, null, 2));
  const bad = report.summary.status === 'Falha' || report.summary.status === 'Falha parcial';
  process.exit(bad ? 1 : 0);
}

main().catch((err) => {
  const report = {
    summary: { status: 'Falha' },
    errors: [err?.message || String(err)],
  };
  try {
    if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(path.join(stateDir, 'REPORT.json'), JSON.stringify(report, null, 2));
  } catch (_) {}
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
});
