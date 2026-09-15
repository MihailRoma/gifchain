// Deterministic pseudo-random helpers. Every number on GIFCHAIN is derived
// from a fixed seed so the same object, block or wallet renders identically
// on every page and on every request.

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return function rand() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seedFrom(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function rngFor(key: string) {
  return mulberry32(seedFrom(key))
}

export function hexFrom(key: string, chars: number): string {
  const rand = rngFor(key)
  let out = ''
  const alphabet = '0123456789abcdef'
  while (out.length < chars) out += alphabet[Math.floor(rand() * 16)]
  return out
}

export function pick<T>(rand: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

export function int(rand: () => number, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1))
}
