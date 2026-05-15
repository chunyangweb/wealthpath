import { describe, it, expect } from 'vitest';
import {
  UserInputsSchema,
  CashFlowSchema,
  SettingsSchema,
  SituationSchema,
} from '@/lib/storage/schema';

describe('CashFlowSchema', () => {
  it('accepts a valid monthly cashflow', () => {
    const result = CashFlowSchema.safeParse({
      id: 'abc',
      label: 'Salaire',
      amount: 2800,
      frequency: 'monthly',
      startDate: '2026-01-01',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative amounts', () => {
    const result = CashFlowSchema.safeParse({
      id: 'abc',
      label: 'Test',
      amount: -100,
      frequency: 'monthly',
      startDate: '2026-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('rejects malformed dates (DD/MM/YYYY)', () => {
    const result = CashFlowSchema.safeParse({
      id: 'abc',
      label: 'Test',
      amount: 100,
      frequency: 'monthly',
      startDate: '01/01/2026',
    });
    expect(result.success).toBe(false);
  });

  it('rejects endDate before startDate', () => {
    const result = CashFlowSchema.safeParse({
      id: 'abc',
      label: 'Test',
      amount: 100,
      frequency: 'monthly',
      startDate: '2026-06-01',
      endDate: '2026-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('accepts endDate equal to startDate', () => {
    const result = CashFlowSchema.safeParse({
      id: 'abc',
      label: 'Test',
      amount: 100,
      frequency: 'monthly',
      startDate: '2026-01-01',
      endDate: '2026-01-01',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a one-off cashflow', () => {
    const result = CashFlowSchema.safeParse({
      id: 'abc',
      label: 'Vacation',
      amount: 1500,
      frequency: 'one-off',
      startDate: '2027-07-15',
    });
    expect(result.success).toBe(true);
  });
});

describe('SituationSchema', () => {
  it('accepts the three valid situations', () => {
    expect(SituationSchema.safeParse('student').success).toBe(true);
    expect(SituationSchema.safeParse('employed').success).toBe(true);
    expect(SituationSchema.safeParse('freelance').success).toBe(true);
  });

  it('rejects unknown situations', () => {
    expect(SituationSchema.safeParse('retired').success).toBe(false);
    expect(SituationSchema.safeParse('').success).toBe(false);
  });
});

describe('UserInputsSchema', () => {
  it('accepts a complete valid state', () => {
    const result = UserInputsSchema.safeParse({
      situation: 'employed',
      household: 'single',
      startingBalance: 8000,
      incomes: [],
      recurringExpenses: [],
      oneOffExpenses: [],
      horizonYears: 5,
      taxMode: 'net',
    });
    expect(result.success).toBe(true);
  });

  it('applies defaults when fields are missing', () => {
    const result = UserInputsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.situation).toBe('employed');
      expect(result.data.household).toBe('single');
      expect(result.data.startingBalance).toBe(0);
      expect(result.data.horizonYears).toBe(5);
      expect(result.data.taxMode).toBe('net');
      expect(result.data.incomes).toEqual([]);
    }
  });

  it('rejects horizon over 40 years', () => {
    const result = UserInputsSchema.safeParse({ horizonYears: 50 });
    expect(result.success).toBe(false);
  });

  it('rejects horizon below 1', () => {
    const result = UserInputsSchema.safeParse({ horizonYears: 0 });
    expect(result.success).toBe(false);
  });
});

describe('SettingsSchema', () => {
  it('defaults to fr when language missing', () => {
    const result = SettingsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.language).toBe('fr');
    }
  });

  it('rejects unknown languages', () => {
    const result = SettingsSchema.safeParse({ language: 'es' });
    expect(result.success).toBe(false);
  });
});
