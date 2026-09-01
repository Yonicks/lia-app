import { describe, expect, it } from 'vitest';

import { add } from '@/testing/mathUtils';

/* Proves vitest resolves TypeScript and the '@' path alias before Phase 2's
 * domain logic and differential tests depend on both working. */
describe('Tier 1 harness smoke test', () => {
  it('resolves a path-aliased TypeScript import and runs it', () => {
    expect(add(2, 3)).toBe(5);
  });
});
