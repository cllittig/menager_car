



import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')





function parseEnvFile(filePath) {

  const out = {}
  if (!existsSync(filePath)) {
    return out
  }
  const text = readFileSync(filePath, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }
    const eq = trimmed.indexOf('=')
    if (eq === -1) {
      continue
    }
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

const envMerged = {
  ...parseEnvFile(join(root, '.env')),
  ...parseEnvFile(join(root, '.env.local')),
}

const siteUrl = envMerged.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? ''
if (siteUrl) {
  const green = '\x1b[32m'
  const bold = '\x1b[1m'
  const dim = '\x1b[2m'
  const reset = '\x1b[0m'
  console.log(
    `${green}${bold}-${reset} URL pública (WAN)  ${siteUrl}  ${dim}(NEXT_PUBLIC_SITE_URL; a linha "Network" do Next é sempre o IP da placa de rede)${reset}\n`,
  )
}

const nextBin = join(root, 'node_modules', 'next', 'dist', 'bin', 'next')
const useLocalNext = existsSync(nextBin)

const child = useLocalNext
  ? spawn(process.execPath, [nextBin, 'dev', '--webpack'], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, ...envMerged },
    })
  : spawn('npx', ['next', 'dev', '--webpack'], {
      cwd: root,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ...envMerged },
    })

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
