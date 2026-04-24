/**
 * Smoke de persistência REAL no Supabase (não é unitário).
 *
 * Pré-requisitos: backend/.env com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY;
 * banco com pelo menos um User e tenantId preenchidos (ex.: após apply-schema-fresh + login/registro).
 *
 * Uso: npm run test:integration
 *
 * O script insere um veículo de teste, confirma leitura e remove (cleanup).
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { randomUUID } from 'node:crypto';
import * as path from 'node:path';

config({ path: path.join(__dirname, '../../.env') });

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error('[integration] Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no backend/.env');
    process.exit(1);
  }

  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const userRes = await sb.from('User').select('id, tenantId').limit(1).maybeSingle();
  if (userRes.error || !userRes.data?.tenantId) {
    console.error('[integration] Nenhum usuário com tenantId encontrado. Faça seed ou registro.');
    process.exit(1);
  }

  const userId = userRes.data.id as string;
  const tenantId = userRes.data.tenantId as string;
  const vid = randomUUID();
  const now = new Date().toISOString();
  const suffix = Date.now().toString(36).toUpperCase();

  const insertPayload = {
    id: vid,
    userId,
    tenantId,
    brand: '__TEST__',
    model: 'Smoke',
    year: 2020,
    licensePlate: `ZZ-${suffix.slice(-6)}`,
    chassis: `CHS-SMOKE-${suffix}`,
    mileage: 0,
    color: 'white',
    fuelType: 'GASOLINE' as const,
    status: 'AVAILABLE' as const,
    purchasePrice: 1,
    purchaseDate: now,
    updatedAt: now,
    isActive: true,
  };

  const ins = await sb.from('Vehicle').insert(insertPayload).select('id, brand, tenantId').single();
  if (ins.error) {
    console.error('[integration] Falha ao inserir Vehicle:', ins.error.message);
    process.exit(1);
  }

  const read = await sb.from('Vehicle').select('id').eq('id', vid).maybeSingle();
  if (read.error || !read.data) {
    console.error('[integration] Leitura após insert falhou');
    await sb.from('Vehicle').delete().eq('id', vid);
    process.exit(1);
  }

  const del = await sb.from('Vehicle').delete().eq('id', vid);
  if (del.error) {
    console.error('[integration] Cleanup delete falhou:', del.error.message);
    process.exit(1);
  }

  console.log('[integration] OK — insert/select/delete Vehicle no Supabase validado.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
