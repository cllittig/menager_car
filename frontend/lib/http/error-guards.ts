
export function getHttpStatusFromUnknown(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined
  }
  if (!('response' in error)) {
    return undefined
  }
  const response = (error as { response?: { status?: number } }).response
  const status = response?.status
  return typeof status === 'number' ? status : undefined
}


export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null) {
    return fallback
  }
  const data = (error as { response?: { data?: { message?: unknown } } })
    .response?.data
  const message = data?.message
  return typeof message === 'string' && message.length > 0 ? message : fallback
}
