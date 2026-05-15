import { z } from 'zod';

/**
 * All persisted data passes through these schemas on read AND write.
 *
 * On read: invalid data gets rejected and we fall back to defaults.
 * This protects us when we change the schema later — old data won't crash the app.
 *
 * On write: TypeScript already catches mistakes at compile time, but
 * runtime validation guards against any path we missed.
 */

// ---------- Frequency for incomes and expenses ----------
export const FrequencySchema = z.enum([
  'one-off',
  'daily',
  'weekly',
  'monthly',
  'yearly',
]);
export type Frequency = z.infer<typeof FrequencySchema>;

// ---------- A single cashflow row (income or expense) ----------
// Refined so endDate, if present, is on or after startDate.
export const CashFlowSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().max(80),
    amount: z.number().nonnegative().finite(),
    frequency: FrequencySchema,
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD expected'),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD expected')
      .optional(),
  })
  .refine(
    (v) => !v.endDate || v.endDate >= v.startDate,
    { message: 'endDate must be on or after startDate', path: ['endDate'] },
  );
export type CashFlow = z.infer<typeof CashFlowSchema>;

// ---------- Situation: drives default allocation profile in M2 ----------
export const SituationSchema = z.enum(['student', 'employed', 'freelance']);
export type Situation = z.infer<typeof SituationSchema>;

// ---------- The full user inputs object ----------
export const UserInputsSchema = z.object({
  situation: SituationSchema.default('employed'),
  household: z.enum(['single', 'couple']).default('single'),
  startingBalance: z.number().finite().default(0),
  incomes: z.array(CashFlowSchema).default([]),
  recurringExpenses: z.array(CashFlowSchema).default([]),
  oneOffExpenses: z.array(CashFlowSchema).default([]),
  horizonYears: z.number().int().min(1).max(40).default(5),
  taxMode: z.enum(['gross', 'net']).default('net'),
});
export type UserInputs = z.infer<typeof UserInputsSchema>;

// ---------- Settings (separate store: persists language, etc.) ----------
export const SettingsSchema = z.object({
  language: z.enum(['fr', 'en']).default('fr'),
});
export type Settings = z.infer<typeof SettingsSchema>;

// ---------- Default empty state ----------
export const EMPTY_USER_INPUTS: UserInputs = {
  situation: 'employed',
  household: 'single',
  startingBalance: 0,
  incomes: [],
  recurringExpenses: [],
  oneOffExpenses: [],
  horizonYears: 5,
  taxMode: 'net',
};
