/**
 * Teste rápido: valida SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY e uma leitura na tabela User.
 * Uso: npm run verify:supabase
 */
import { createClient } from '@supabase/supabase-js';
import { configDotenv } from 'dotenv';
import { resolve } from 'path';

configDotenv({ path: resolve(__dirname, '../.env') });

/** Evita assert do libuv no Windows ao sair com ts-node + fetch ainda encerrando. */
function exitLater(code: number): void {
  process.exitCode = code;
  setTimeout(() => process.exit(code), 100);
}

function assertProjectApiUrl(raw: string): string {
  let u = raw.trim().replace(/\/$/, '');
  if (!u) {
    throw new Error('SUPABASE_URL esta vazia.');
  }
  if (u.includes('supabase.com') && (u.includes('/dashboard') || u.includes('/project'))) {
    throw new Error(
      'SUPABASE_URL nao pode ser o link do dashboard. Em Project Settings > API use "Project URL" no formato https://<ref>.supabase.co',
    );
  }
  if (!u.startsWith('http')) {
    if (/^[a-z0-9]{20,}$/i.test(u)) {
      u = `https://${u}.supabase.co`;
    } else {
      throw new Error(
        'SUPABASE_URL deve ser uma URL https://... ou somente o project ref (ex: abcdefghijklmnop).',
      );
    }
  }
  if (!/\.supabase\.co$/i.test(new URL(u).hostname)) {
    throw new Error(
      `Host invalido (${new URL(u).hostname}). Esperado algo como xxx.supabase.co`,
    );
  }
  return u;
}

async function main(): Promise<void> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!key) {
    console.error('Falta SUPABASE_SERVICE_ROLE_KEY no backend/.env');
    exitLater(1);
    return;
  }

  let url: string;
  try {
    url = assertProjectApiUrl(process.env.SUPABASE_URL ?? '');
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    exitLater(1);
    return;
  }

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error, data } = await sb.from('User').select('id').limit(1);

  if (error) {
    const msg = error.message?.length > 200 ? `${error.message.slice(0, 200)}...` : error.message;
    console.error('Falha na consulta:', error.code ?? '(sem codigo)', msg);
    if (
      msg.includes('relation') ||
      msg.includes('does not exist') ||
      error.code === 'PGRST205'
    ) {
      console.error(
        'Dica: aplique as migrations SQL no Supabase (tabela User ainda nao existe).',
      );
    }
    if (msg.includes('JWT') || error.code === 'PGRST301') {
      console.error('Dica: verifique se SUPABASE_SERVICE_ROLE_KEY e a chave service_role (secret).');
    }
    exitLater(1);
    return;
  }

  console.log('Conexao com Supabase OK.');
  console.log(
    'Leitura em User:',
    Array.isArray(data) ? `${data.length} linha(s) no maximo 1` : 'ok',
  );
  exitLater(0);
}

main().catch((e) => {
  console.error('Erro inesperado:', e instanceof Error ? e.message : e);
  exitLater(1);
});
