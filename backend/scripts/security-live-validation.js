/**
 * Validação LIVE do banco + diff OLD/NEW/LIVE + decisão MIG-03/MIG-08 + execução conservadora.
 *
 * Uso: npm run security:validate
 *
 * Força (opcional, não recomendado sem revisão):
 *   SECURITY_FORCE_MIG03=true
 *   SECURITY_FORCE_MIG08=true
 *
 * Postgres: mesma resolução de URL que apply-schema-from-env.js.
 * Supabase CLI remoto: apenas diagnóstico (supabase projects list); sem token = skipped.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Client } = require('pg');
const { configDotenv } = require('dotenv');

configDotenv({ path: path.join(__dirname, '../.env') });

const backendRoot = path.join(__dirname, '..');
const rolloutDir = path.join(backendRoot, 'supabase/security-rollout');
const stateDir = path.join(rolloutDir, '_state');

const PG_COMPAT_QUERY = 'uselibpqcompat=true&sslmode=require';

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

function readJsonSafe(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function ensureStateDir() {
  if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });
}

function keyGrant(g) {
  return `${g.table_name}|${g.grantee}|${g.privilege_type}`;
}

function keyPolicy(p) {
  return `${p.tablename}|${p.policyname}|${p.cmd}`;
}

function normalizeQual(s) {
  if (s == null) return '';
  return String(s).replace(/\s+/g, ' ').trim();
}

async function captureLive(client) {
  const rls = await client.query(`
    SELECT c.relname AS table_name, c.relrowsecurity, c.relforcerowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname
  `);

  const policies = await client.query(`
    SELECT tablename, policyname, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname, cmd
  `);

  const grants = await client.query(`
    SELECT table_name, privilege_type, grantee
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND grantee IN ('anon', 'authenticated')
    ORDER BY table_name, grantee, privilege_type
  `);

  const jwtFn = await client.query(`SELECT public.jwt_tenant_id() AS jwt_tenant_id`).catch((e) => ({
    rows: [{ jwt_tenant_id: null, error: e.message }],
  }));

  const publicTables = await client.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `);

  return {
    capturedAt: new Date().toISOString(),
    rls: rls.rows,
    policies: policies.rows,
    grants: grants.rows,
    jwt_tenant_id_session: jwtFn.rows[0] || null,
    publicTables: publicTables.rows.map((r) => r.tablename),
  };
}

function diffGrants(a, b, labelA, labelB) {
  const ma = new Map((a || []).map((g) => [keyGrant(g), g]));
  const mb = new Map((b || []).map((g) => [keyGrant(g), g]));
  const onlyA = [];
  const onlyB = [];
  for (const [k, v] of ma) if (!mb.has(k)) onlyA.push({ ...v, _in: labelA });
  for (const [k, v] of mb) if (!ma.has(k)) onlyB.push({ ...v, _in: labelB });
  return { onlyA, onlyB, divergent: onlyA.length + onlyB.length > 0 };
}

function diffPolicies(a, b, labelA, labelB) {
  const ma = new Map((a || []).map((p) => [keyPolicy(p), p]));
  const mb = new Map((b || []).map((p) => [keyPolicy(p), p]));
  const onlyA = [];
  const onlyB = [];
  const qualChanged = [];
  for (const [k, v] of ma) {
    if (!mb.has(k)) onlyA.push({ ...v, _in: labelA });
    else {
      const vb = mb.get(k);
      if (normalizeQual(v.qual) !== normalizeQual(vb.qual) || normalizeQual(v.with_check) !== normalizeQual(vb.with_check)) {
        qualChanged.push({ key: k, [labelA]: v, [labelB]: vb });
      }
    }
  }
  for (const [k, v] of mb) if (!ma.has(k)) onlyB.push({ ...v, _in: labelB });
  return { onlyA, onlyB, qualChanged, divergent: onlyA.length + onlyB.length > 0 || qualChanged.length > 0 };
}

function diffRls(a, b, labelA, labelB) {
  const ma = new Map((a || []).map((r) => [r.relname || r.table_name, r]));
  const mb = new Map((b || []).map((r) => [r.relname || r.table_name, r]));
  const drift = [];
  for (const [t, ra] of ma) {
    const rb = mb.get(t);
    if (!rb) drift.push({ table: t, issue: `só em ${labelA}` });
    else if (!!ra.relrowsecurity !== !!rb.relrowsecurity) {
      drift.push({ table: t, [labelA]: ra.relrowsecurity, [labelB]: rb.relrowsecurity });
    }
  }
  for (const t of mb.keys()) if (!ma.has(t)) drift.push({ table: t, issue: `só em ${labelB}` });
  return drift;
}

function scanCodebaseAnonUsage() {
  const repoRoot = path.join(backendRoot, '..');
  const findings = { frontend_from: [], backend_from: [], notes: [] };

  function walkDir(dir, acc, extTest) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === 'node_modules' || ent.name === '.next' || ent.name === 'dist') continue;
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walkDir(p, acc, extTest);
      else if (extTest(ent.name)) {
        const txt = fs.readFileSync(p, 'utf8');
        if (/\.from\s*\(\s*['"`]/.test(txt)) acc.push(path.relative(repoRoot, p));
      }
    }
  }

  walkDir(path.join(repoRoot, 'frontend'), findings.frontend_from, (n) => /\.(ts|tsx)$/.test(n));
  walkDir(path.join(repoRoot, 'backend', 'src'), findings.backend_from, (n) => /\.ts$/.test(n));

  if (findings.backend_from.length) {
    findings.notes.push('Arquivos backend com possível .from( — revisar se usam service_role ou anon.');
  }
  const feReal = findings.frontend_from.filter(
    (f) => !f.includes('node_modules') && !f.includes('supabase-browser.ts'),
  );
  return { ...findings, frontend_data_tables_guess: feReal };
}

function classifyAnon(grantsLive, codeScan) {
  const anonSelect = (grantsLive || []).filter(
    (g) => g.grantee === 'anon' && g.privilege_type === 'SELECT',
  );

  const feTables = codeScan.frontend_data_tables_guess || [];
  const unsafeBackend = (codeScan.backend_from || []).filter((f) => {
    try {
      const t = fs.readFileSync(path.join(backendRoot, '..', f), 'utf8');
      return /createClient\s*\([^)]*anonKey|SUPABASE_ANON_KEY/.test(t) && /\.from\s*\(\s*['"`]/.test(t);
    } catch {
      return false;
    }
  });

  if (feTables.length > 0 || unsafeBackend.length > 0) {
    return {
      level: 'UNSAFE_ANON_IN_USE',
      detail: { feTables, unsafeBackend },
    };
  }

  if (anonSelect.length === 0) {
    return {
      level: 'SAFE_TO_REMOVE_ANON_SELECT',
      detail: { reason: 'anon já sem SELECT em public (information_schema)' },
    };
  }

  return {
    level: 'SAFE_TO_REMOVE_ANON_SELECT',
    detail: {
      reason:
        'Código: sem .from(tabela) no frontend (exceto cliente); backend anon só auth recovery. REVOKE SELECT public não afeta auth schema.',
      anon_select_count: anonSelect.length,
    },
  };
}

function classifyJwtReadiness(policiesLive, jwtSessionRow) {
  const hasNullFallback = (policiesLive || []).some(
    (p) =>
      normalizeQual(p.qual).toLowerCase().includes('jwt_tenant_id() is null') ||
      normalizeQual(p.with_check).toLowerCase().includes('jwt_tenant_id() is null'),
  );

  const sessionVal = jwtSessionRow?.jwt_tenant_id;
  const sessionNote =
    'SELECT jwt_tenant_id() na sessão postgres não inclui JWT de utilizador; não prova claim em PostgREST.';

  const nestUsesCustomJwt = fs.existsSync(path.join(backendRoot, 'src/auth/auth.service.ts'));

  if (!hasNullFallback && (policiesLive || []).length > 0) {
    return {
      level: 'POLICIES_ALREADY_STRICT',
      detail: {
        has_null_fallback_in_policies: false,
        jwt_tenant_id_in_db_session: sessionVal,
        sessionNote,
        nest_custom_jwt: nestUsesCustomJwt,
        explanation:
          'Policies LIVE sem fallback jwt_tenant_id() IS NULL — MIG-08 não necessária (idempotente).',
      },
    };
  }

  return {
    level: 'NOT_READY_NO_CLAIM',
    detail: {
      has_null_fallback_in_policies: hasNullFallback,
      jwt_tenant_id_in_db_session: sessionVal,
      sessionNote,
      nest_custom_jwt: nestUsesCustomJwt,
      explanation:
        'Policies ainda com ramo IS NULL: não aplicar MIG-08 sem evidência de JWT Supabase (app_metadata.tenant_id) para utilizadores PostgREST.',
    },
  };
}

function trySupabaseCli() {
  const out = { projects_list: null, error: null };
  try {
    execSync('npx supabase projects list', {
      cwd: path.join(backendRoot, '..'),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
    });
    out.projects_list = 'ok';
  } catch (e) {
    out.error = e.stderr?.toString() || e.message || String(e);
  }
  return out;
}

async function main() {
  ensureStateDir();

  const report = {
    status: 'BLOCKED',
    migrations_applied: [],
    migrations_skipped: [],
    security_level: 'PARTIAL',
    anon_usage: 'UNKNOWN',
    jwt_readiness: 'UNKNOWN',
    risks_remaining: [],
    actions_taken: [],
    recommended_next_steps: [],
    supabase_cli: trySupabaseCli(),
    etapa1_connection: null,
  };

  const urls = resolveConnectionUrlsInOrder();
  if (!urls.length) {
    report.risks_remaining.push('Sem URL Postgres no .env — impossível validar banco real.');
    fs.writeFileSync(path.join(stateDir, 'FINAL_VALIDATION_REPORT.json'), JSON.stringify(report, null, 2));
    process.exit(1);
  }

  let client;
  let lastErr;
  for (const { label, url } of urls) {
    try {
      client = await tryConnect(url);
      report.etapa1_connection = { ok: true, label, host_redacted: url.replace(/:[^:@/]+@/, ':****@') };
      break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!client) {
    report.etapa1_connection = { ok: false, error: lastErr?.message };
    report.risks_remaining.push('Falha ao conectar ao Postgres.');
    fs.writeFileSync(path.join(stateDir, 'FINAL_VALIDATION_REPORT.json'), JSON.stringify(report, null, 2));
    process.exit(1);
  }

  try {
    const live = await captureLive(client);
    const stateLive = { label: 'STATE_LIVE', ...live };
    fs.writeFileSync(path.join(stateDir, 'STATE_LIVE.json'), JSON.stringify(stateLive, null, 2));
    report.actions_taken.push('STATE_LIVE.json gravado');

    const oldSnap = readJsonSafe(path.join(stateDir, 'STATE_OLD.json'));
    const newSnap = readJsonSafe(path.join(stateDir, 'STATE_NEW.json'));

    const validationDiff = {
      generatedAt: new Date().toISOString(),
      grants_live_vs_new: diffGrants(newSnap?.grants, live.grants, 'STATE_NEW', 'STATE_LIVE'),
      grants_live_vs_old: diffGrants(oldSnap?.grants, live.grants, 'STATE_OLD', 'STATE_LIVE'),
      policies_live_vs_new: diffPolicies(newSnap?.policies, live.policies, 'STATE_NEW', 'STATE_LIVE'),
      rls_live_vs_new: diffRls(newSnap?.rls, live.rls, 'STATE_NEW', 'STATE_LIVE'),
      tables_without_rls: live.rls.filter((r) => !r.relrowsecurity).map((r) => r.relname),
    };
    fs.writeFileSync(path.join(stateDir, 'VALIDATION_DIFF.json'), JSON.stringify(validationDiff, null, 2));
    report.actions_taken.push('VALIDATION_DIFF.json gravado');

    const codeScan = scanCodebaseAnonUsage();
    const anonClass = classifyAnon(live.grants, codeScan);
    report.anon_usage = anonClass.level;
    report.code_scan_summary = {
      frontend_files_with_from: codeScan.frontend_data_tables_guess,
      backend_files_with_from: codeScan.backend_from,
    };

    const jwtClass = classifyJwtReadiness(live.policies, live.jwt_tenant_id_session);
    report.jwt_readiness = jwtClass.level;
    report.jwt_detail = jwtClass.detail;

    let applyMig03 = anonClass.level === 'SAFE_TO_REMOVE_ANON_SELECT';
    let applyMig08 = false;

    if (process.env.SECURITY_FORCE_MIG03 === 'true') {
      applyMig03 = true;
      report.actions_taken.push('SECURITY_FORCE_MIG03=true — aplicando MIG-03 apesar da heurística');
    }
    if (process.env.SECURITY_FORCE_MIG08 === 'true') {
      applyMig08 = true;
      report.actions_taken.push('SECURITY_FORCE_MIG08=true — aplicando MIG-08 (arriscado)');
    }

    if (jwtClass.level === 'POLICIES_ALREADY_STRICT') {
      report.migrations_skipped.push('MIG-08 (policies já estritas)');
      report.actions_taken.push('MIG-08 não necessária: nenhum fallback jwt_tenant_id() IS NULL nas policies LIVE.');
    } else if (!applyMig08) {
      report.migrations_skipped.push('MIG-08');
      report.risks_remaining.push(
        'MIG-08 não aplicada automaticamente: exige SECURITY_FORCE_MIG08=true ou sincronização de claims JWT + validação manual.',
      );
    }

    if (!applyMig03) {
      report.migrations_skipped.push('MIG-03');
      report.risks_remaining.push('MIG-03 não aplicada: classificação anon não segura ou bloqueada.');
    }

    if (applyMig03) {
      try {
        await client.query('BEGIN');
        await client.query('REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon');
        await client.query('COMMIT');
        report.migrations_applied.push('MIG-03');
        report.actions_taken.push('MIG-03: REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon (transação)');
      } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        report.migrations_skipped.push('MIG-03 (falha)');
        report.risks_remaining.push(`MIG-03 erro: ${e.message}`);
      }
    }

    if (applyMig08) {
      const mig08Path = path.join(rolloutDir, 'MIG-08.sql');
      if (fs.existsSync(mig08Path)) {
        try {
          const sql = fs.readFileSync(mig08Path, 'utf8');
          await client.query('BEGIN');
          await client.query(sql);
          await client.query('COMMIT');
          report.migrations_applied.push('MIG-08');
          report.actions_taken.push('MIG-08 aplicado via MIG-08.sql');
        } catch (e) {
          await client.query('ROLLBACK').catch(() => {});
          report.migrations_skipped.push('MIG-08 (falha)');
          report.risks_remaining.push(`MIG-08 erro: ${e.message}`);
        }
      }
    }

    const liveAfter = await captureLive(client);
    fs.writeFileSync(
      path.join(stateDir, 'STATE_LIVE_POST.json'),
      JSON.stringify({ label: 'STATE_LIVE_POST', ...liveAfter }, null, 2),
    );

    const anonSelectAfter = liveAfter.grants.filter(
      (g) => g.grantee === 'anon' && g.privilege_type === 'SELECT',
    );
    if (report.migrations_applied.includes('MIG-03') && anonSelectAfter.length > 0) {
      report.risks_remaining.push('Pós-MIG-03: anon ainda aparece com SELECT em information_schema — revisar grants em views ou default privileges.');
    }

    const policiesWithNull = liveAfter.policies.filter(
      (p) =>
        normalizeQual(p.qual).toLowerCase().includes('jwt_tenant_id() is null') ||
        normalizeQual(p.with_check).toLowerCase().includes('jwt_tenant_id() is null'),
    );
    if (report.migrations_applied.includes('MIG-08') && policiesWithNull.length > 0) {
      report.risks_remaining.push('Pós-MIG-08: ainda existem policies com fallback IS NULL — revisar manualmente.');
    }

    const noRls = liveAfter.rls.filter((r) => !r.relrowsecurity);
    if (noRls.length) {
      report.risks_remaining.push(`Tabelas public sem RLS: ${noRls.map((r) => r.table_name).join(', ')}`);
      report.security_level = 'INSECURE';
    } else if (policiesWithNull.length && !report.migrations_applied.includes('MIG-08')) {
      report.security_level = 'PARTIAL';
    } else if (report.migrations_applied.includes('MIG-08') && policiesWithNull.length === 0) {
      report.security_level = 'STRONG';
    } else {
      report.security_level = 'PARTIAL';
    }

    report.status = 'SUCCESS';
    if (report.migrations_skipped.some((s) => s.includes('falha'))) report.status = 'PARTIAL';
    if (report.risks_remaining.length > 0) report.status = 'PARTIAL';

    if (report.supabase_cli.error) {
      report.recommended_next_steps.push(
        'Autenticar Supabase CLI (supabase login) para auditoria remota com supabase db query.',
      );
    }
    if (!report.migrations_applied.includes('MIG-08')) {
      report.recommended_next_steps.push(
        'Sincronizar tenant_id em app_metadata do Supabase Auth antes de MIG-08, ou manter apenas BFF com service_role.',
      );
    }

    report.etapa10 = {
      backend_service_role_enforcement:
        'Isolamento de dados na API principal continua dependente do Nest + service_role (RLS não aplica a esse papel).',
      postgrest_anon_authenticated:
        report.migrations_applied.includes('MIG-03')
          ? 'SELECT anon em public revogado — superfície PostgREST reduzida; validar edge cases.'
          : 'anon pode ainda ter SELECT em tabelas public — risco de leitura se Data API expuser schema.',
      cross_tenant_risk:
        jwtClass.level === 'NOT_READY_NO_CLAIM'
          ? 'Médio a alto via PostgREST enquanto policies tiverem jwt_tenant_id() IS NULL (modo transicional).'
          : jwtClass.level === 'POLICIES_ALREADY_STRICT'
            ? 'Reduzido para clientes sujeitos a RLS estrita; BFF continua fora de RLS.'
            : 'Avaliar conforme policies LIVE.',
    };

    fs.writeFileSync(path.join(stateDir, 'FINAL_VALIDATION_REPORT.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((e) => {
  const report = { status: 'BLOCKED', errors: [e.message], risks_remaining: [String(e)] };
  ensureStateDir();
  fs.writeFileSync(path.join(stateDir, 'FINAL_VALIDATION_REPORT.json'), JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
});
