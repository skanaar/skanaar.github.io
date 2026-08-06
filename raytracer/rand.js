// Deterministic PRNG (32-bit LCG, full 2^32 period)
export function seededRandom(s) {
  return () => (s = Math.imul(s, 1597334677) + 1) / 2**32 + 0.5
}
