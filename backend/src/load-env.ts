import { existsSync } from 'fs';
import { config } from 'dotenv';
import { resolve } from 'path';

/**
 * Carrega antes de AppModule (ex.: auth.constant lê JWT_SECRET na importação).
 * Cobre: `nest start` a partir de backend/, build em dist/src, e monorepo.
 */
const candidates = [
  resolve(process.cwd(), '.env'),
  resolve(__dirname, '../.env'),
  resolve(__dirname, '../../.env'),
];

let loaded = false;
for (const p of candidates) {
  if (existsSync(p)) {
    config({ path: p });
    loaded = true;
    break;
  }
}

if (!loaded) {
  config();
}
