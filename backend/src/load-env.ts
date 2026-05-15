import { existsSync } from 'fs';
import { config } from 'dotenv';
import { resolve } from 'path';





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
