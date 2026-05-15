function normalizeOrigin(origin: string): string | null {
  const value = origin.trim();
  if (!value) {
    return null;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

export function parseCsv(value?: string): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseCorsOrigins(...inputs: Array<string | undefined>): string[] {
  const unique = new Set<string>();
  for (const input of inputs) {
    for (const item of parseCsv(input)) {
      const normalized = normalizeOrigin(item);
      if (normalized) {
        unique.add(normalized);
      }
    }
  }
  return [...unique];
}

