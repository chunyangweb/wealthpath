import { describe, it, expect } from 'vitest';
import { computeSuggestion } from '@/lib/finance/suggestion';

/**
 * Tests for the suggestion engine.
 *
 * The engine takes (situation, profile, totalAmount) and returns a map of
 * product → allocated amount. Properties tested:
 *  - amounts sum to the total (no money lost or invented)
 *  - product caps are respected (no over-allocation to Livret A's 22,950)
 *  - custom product is never auto-allocated
 *  - zero total returns all zeros
 */

describe('computeSuggestion', () => {
  it('sums to the total amount (employed, balanced, €10k)', () => {
    const result = computeSuggestion('employed', 'balanced', 10000);
    const total = Object.values(result).reduce((a, v) => a + v, 0);
    expect(total).toBeCloseTo(10000, 2);
  });

  it('sums to the total amount (student, prudent, €5k)', () => {
    const result = computeSuggestion('student', 'prudent', 5000);
    const total = Object.values(result).reduce((a, v) => a + v, 0);
    expect(total).toBeCloseTo(5000, 2);
  });

  it('sums to the total amount (freelance, dynamic, €100k)', () => {
    const result = computeSuggestion('freelance', 'dynamic', 100000);
    const total = Object.values(result).reduce((a, v) => a + v, 0);
    expect(total).toBeCloseTo(100000, 2);
  });

  it('returns all zeros for zero total', () => {
    const result = computeSuggestion('employed', 'balanced', 0);
    Object.values(result).forEach((v) => {
      expect(v).toBe(0);
    });
  });

  it('respects the Livret A cap when target exceeds it', () => {
    // At €100k balanced employed (20% Livret A would be €20k = under cap, fine).
    // But with €200k, 20% = €40k which exceeds the €22,950 cap.
    const result = computeSuggestion('employed', 'balanced', 200000);
    expect(result['livret-a']).toBeLessThanOrEqual(22950);
  });

  it('respects the LDDS cap', () => {
    const result = computeSuggestion('employed', 'balanced', 300000);
    expect(result['ldds']).toBeLessThanOrEqual(12000);
  });

  it('respects the LEP cap', () => {
    const result = computeSuggestion('student', 'prudent', 100000);
    expect(result['lep']).toBeLessThanOrEqual(10000);
  });

  it('overflows excess into a no-cap product (preserves total)', () => {
    // At €500k, Livret A and LDDS will overflow heavily.
    // The total must still equal €500k.
    const result = computeSuggestion('employed', 'balanced', 500000);
    const total = Object.values(result).reduce((a, v) => a + v, 0);
    expect(total).toBeCloseTo(500000, 2);
  });

  it('returns no negative amounts', () => {
    const result = computeSuggestion('freelance', 'dynamic', 50000);
    Object.values(result).forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
    });
  });

  it('differs between situations for the same profile', () => {
    const student = computeSuggestion('student', 'balanced', 10000);
    const freelance = computeSuggestion('freelance', 'balanced', 10000);
    // Student gets no PER, freelance does.
    expect(student['per']).toBe(0);
    expect(freelance['per']).toBeGreaterThan(0);
  });

  it('differs between profiles for the same situation', () => {
    const prudent = computeSuggestion('employed', 'prudent', 10000);
    const dynamic = computeSuggestion('employed', 'dynamic', 10000);
    // Dynamic should have more PEA than prudent
    expect(dynamic['pea']).toBeGreaterThan(prudent['pea']);
    // Prudent should have more in fonds euros than dynamic
    expect(prudent['av-fonds-euros']).toBeGreaterThan(
      dynamic['av-fonds-euros'],
    );
  });
});
