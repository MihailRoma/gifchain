export type SP = Record<string, string | string[] | undefined>

export function one(sp: SP, key: string): string | undefined {
  const v = sp[key]
  return Array.isArray(v) ? v[0] : v
}

export function pageOf(sp: SP, max: number): number {
  const raw = parseInt(one(sp, 'p') ?? '1', 10)
  if (!Number.isFinite(raw) || raw < 1) return 1
  return Math.min(raw, Math.max(1, max))
}

export function buildHref(base: string, sp: SP, patch: Record<string, string | undefined>) {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(sp)) {
    const value = Array.isArray(v) ? v[0] : v
    if (value) params.set(k, value)
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === '') params.delete(k)
    else params.set(k, v)
  }
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}
