/** Trivial module that only exists so the Tier 1 smoke test has a path-aliased
 *  import to resolve. Real logic modules arrive in Phase 2. */
export function add(a: number, b: number): number {
  return a + b;
}
