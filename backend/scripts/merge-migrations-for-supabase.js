const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../supabase/schema-migrations-legacy');
const outPath = path.join(__dirname, '../supabase/apply-schema-fresh.sql');

const bootstrap = `
-- Bootstrap: usuario exigido pela migration add_user_isolation (banco vazio)
INSERT INTO "User" ("id", "email", "password", "name", "role", "isActive", "loginAttempts", "createdAt", "updatedAt")
VALUES (
  '00000000-0000-0000-0000-000000000099',
  'admin@controleveicular.com',
  '$2b$10$f9bFtxCmet4YC1l82aA2julJs10Wx/9avhnNf3byv7ZzKT94ovPtq',
  'Bootstrap Admin',
  'ADMIN',
  true,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT ("email") DO NOTHING;

`;

const parts = [
  '20250607214241_sistema/migration.sql',
  '20250619155804_init/migration.sql',
  '20250619165732_add_categoria/migration.sql',
  '20250619180001_sistema_veicular_completo/migration.sql',
  '__BOOTSTRAP__',
  '20250619203552_add_user_isolation/migration.sql',
  '20250619233336_fix_vehicle_unique_constraints_by_user/migration.sql',
  '20250620011743_add_audit_fields_to_maintenance/migration.sql',
  '20250620013204_add_birthdate_to_client/migration.sql',
  '20260320_add_tenant_core/migration.sql',
];

const header = `-- Schema completo para banco NOVO no Supabase (public).
-- Gerado a partir do historico SQL em supabase/schema-migrations-legacy + INSERT bootstrap para admin@controleveicular.com
-- Como usar: Supabase > SQL Editor > colar e Run. Depois: npm run verify:supabase
-- Usuario bootstrap: admin@controleveicular.com / senha: AlterarAposPrimeiroLogin1! (troque apos primeiro acesso).

`;

let out = header + '\n';
for (const p of parts) {
  if (p === '__BOOTSTRAP__') {
    out += '\n' + bootstrap + '\n';
    continue;
  }
  const fp = path.join(migrationsDir, p);
  out += `\n-- === ${p} ===\n`;
  out += fs.readFileSync(fp, 'utf8');
  out += '\n';
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out, 'utf8');
console.log('Wrote', outPath);
