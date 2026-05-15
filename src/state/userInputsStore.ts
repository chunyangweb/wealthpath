import { create } from 'zustand';
import {
  EMPTY_USER_INPUTS,
  UserInputsSchema,
  type CashFlow,
  type UserInputs,
} from '@/lib/storage/schema';
import { readValidated, write } from '@/lib/storage/localStorage';
import { createId } from '@/lib/utils/createId';

const STORAGE_KEY = 'userInputs';

/**
 * Load initial state from localStorage if valid, else empty defaults.
 * Called once at module load — no React hooks involved.
 */
function loadInitial(): UserInputs {
  const stored = readValidated(STORAGE_KEY, UserInputsSchema);
  return stored ?? EMPTY_USER_INPUTS;
}

/**
 * Debounced write: avoid hitting localStorage on every keystroke.
 * 500ms after the last change, persist the whole object.
 */
let writeTimer: number | undefined;
function persistDebounced(state: UserInputs) {
  if (writeTimer !== undefined) {
    window.clearTimeout(writeTimer);
  }
  writeTimer = window.setTimeout(() => {
    write(STORAGE_KEY, state);
  }, 500);
}

// ---------- Store interface ----------
type UserInputsState = UserInputs & {
  // Top-level setters
  setSituation: (s: 'student' | 'employed' | 'freelance') => void;
  setHousehold: (h: 'single' | 'couple') => void;
  setStartingBalance: (n: number) => void;
  setHorizonYears: (n: number) => void;
  setTaxMode: (m: 'gross' | 'net') => void;

  // List operations (income / recurring expenses / one-off expenses)
  addIncome: () => void;
  updateIncome: (id: string, patch: Partial<CashFlow>) => void;
  removeIncome: (id: string) => void;

  addRecurringExpense: () => void;
  updateRecurringExpense: (id: string, patch: Partial<CashFlow>) => void;
  removeRecurringExpense: (id: string) => void;

  addOneOffExpense: () => void;
  updateOneOffExpense: (id: string, patch: Partial<CashFlow>) => void;
  removeOneOffExpense: (id: string) => void;

  // Reset everything (used by Summary page's reset button later)
  reset: () => void;
};

// ---------- Helpers for list operations ----------
function newRow(frequency: CashFlow['frequency'] = 'monthly'): CashFlow {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: createId(),
    label: '',
    amount: 0,
    frequency,
    startDate: today,
  };
}

// ---------- Store ----------
export const useUserInputsStore = create<UserInputsState>((set) => {
  /**
   * Persist after every state change.
   * We use a wrapper around set() that runs persistDebounced on the resulting state.
   */
  const setAndPersist: typeof set = (...args) => {
    set(...(args as Parameters<typeof set>));
    // After Zustand applies the update, persist the relevant slice
    persistDebounced(stripActions(useUserInputsStore.getState()));
  };

  return {
    ...loadInitial(),

    setSituation: (situation) => setAndPersist({ situation }),
    setHousehold: (household) => setAndPersist({ household }),
    setStartingBalance: (startingBalance) => setAndPersist({ startingBalance }),
    setHorizonYears: (horizonYears) => setAndPersist({ horizonYears }),
    setTaxMode: (taxMode) => setAndPersist({ taxMode }),

    addIncome: () =>
      setAndPersist((s) => ({ incomes: [...s.incomes, newRow('monthly')] })),
    updateIncome: (id, patch) =>
      setAndPersist((s) => ({
        incomes: s.incomes.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      })),
    removeIncome: (id) =>
      setAndPersist((s) => ({
        incomes: s.incomes.filter((r) => r.id !== id),
      })),

    addRecurringExpense: () =>
      setAndPersist((s) => ({
        recurringExpenses: [...s.recurringExpenses, newRow('monthly')],
      })),
    updateRecurringExpense: (id, patch) =>
      setAndPersist((s) => ({
        recurringExpenses: s.recurringExpenses.map((r) =>
          r.id === id ? { ...r, ...patch } : r,
        ),
      })),
    removeRecurringExpense: (id) =>
      setAndPersist((s) => ({
        recurringExpenses: s.recurringExpenses.filter((r) => r.id !== id),
      })),

    addOneOffExpense: () =>
      setAndPersist((s) => ({
        oneOffExpenses: [...s.oneOffExpenses, newRow('one-off')],
      })),
    updateOneOffExpense: (id, patch) =>
      setAndPersist((s) => ({
        oneOffExpenses: s.oneOffExpenses.map((r) =>
          r.id === id ? { ...r, ...patch } : r,
        ),
      })),
    removeOneOffExpense: (id) =>
      setAndPersist((s) => ({
        oneOffExpenses: s.oneOffExpenses.filter((r) => r.id !== id),
      })),

    reset: () => setAndPersist({ ...EMPTY_USER_INPUTS }),
  };
});

/**
 * Strip the action functions from the store state before persisting.
 * Functions can't be JSON-serialized and we don't want them in storage anyway.
 */
function stripActions(state: UserInputsState): UserInputs {
  return {
    situation: state.situation,
    household: state.household,
    startingBalance: state.startingBalance,
    incomes: state.incomes,
    recurringExpenses: state.recurringExpenses,
    oneOffExpenses: state.oneOffExpenses,
    horizonYears: state.horizonYears,
    taxMode: state.taxMode,
  };
}
