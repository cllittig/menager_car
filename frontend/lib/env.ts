function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '')
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.location !== 'undefined'
}

function readEnvUrl(name: 'NEXT_PUBLIC_API_URL' | 'INTERNAL_API_URL'): string | null {
  const value = process.env[name]?.trim()
  if (!value) {
    return null
  }
  return stripTrailingSlash(value)
}

export function getFrontendApiBaseUrl(): string {
  const sameOriginApi = process.env.NEXT_PUBLIC_API_SAME_ORIGIN === 'true'
  const forceFixed = process.env.NEXT_PUBLIC_API_DYNAMIC_HOST === 'false'
  const forceDynamic = process.env.NEXT_PUBLIC_API_DYNAMIC_HOST === 'true'
  const nodeEnv = process.env.NODE_ENV || 'development'
  const allowAutoDynamic = nodeEnv !== 'production' && nodeEnv !== 'test'

  if (isBrowser() && sameOriginApi) {
    return '/api'
  }

  const useDynamic =
    !forceFixed && isBrowser() && (forceDynamic || allowAutoDynamic)
  if (useDynamic) {
    const port = process.env.NEXT_PUBLIC_API_PORT || '3005'
    const { protocol, hostname } = window.location
    // Mantém o protocolo da página para evitar Mixed Content
    return `${protocol}//${hostname}:${port}`
  }

  return (
    readEnvUrl('INTERNAL_API_URL') ??
    readEnvUrl('NEXT_PUBLIC_API_URL') ??
    'http://localhost:3005'
  )
}

export function getServerApiBaseUrl(): string {
  return (
    readEnvUrl('INTERNAL_API_URL') ??
    readEnvUrl('NEXT_PUBLIC_API_URL') ??
    'http://localhost:3005'
  )
}

