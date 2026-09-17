// TODO (Sub-project 4): replace with real Frankfurter API fetch + DB cache
export async function getRate(base: string, _quote: string): Promise<number> {
  if (base === _quote) return 1
  return 1
}
