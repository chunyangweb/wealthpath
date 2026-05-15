import { describe, it, expect } from 'vitest';

/**
 * M0 smoke test. Real finance unit tests arrive with M3 (projection engine)
 * and M4 (liquidity engine). This one only verifies that the test pipeline
 * is wired up and that GitHub Actions runs Vitest correctly.
 */
describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
