// Service/budget/budget.service.ts
// Solo tipos + stubs, las implementaciones reales están en .native / .web

export type Income = {
  id: number;
  name: string;
  amount: number;
  isFixed?: boolean;      // 🔹 nuevo
  date?: string | null;   // reservado para historial
};

export type Expense = {
  id: number;
  name: string;
  amount: number;
  day: number;
  isFixed?: boolean;      // 🔹 nuevo
  date?: string | null;   // reservado para historial
};

// ====== Incomes ======

export async function fetchIncomes(): Promise<Income[]> {
  throw new Error("[Budget] Sin implementación de plataforma (native/web).");
}

export async function addIncome(_data: {
  name: string;
  amount: number;
  isFixed?: boolean;
  date?: string;
}): Promise<Income> {
  throw new Error("[Budget] Sin implementación de plataforma (native/web).");
}

export async function updateIncome(_data: {
  id: number;
  name: string;
  amount: number;
  isFixed?: boolean;
}): Promise<Income> {
  throw new Error("[Budget] Sin implementación de plataforma (native/web).");
}

export async function deleteIncome(_id: number): Promise<void> {
  throw new Error("[Budget] Sin implementación de plataforma (native/web).");
}

// ====== Expenses ======

export async function fetchExpenses(): Promise<Expense[]> {
  throw new Error("[Budget] Sin implementación de plataforma (native/web).");
}

export async function addExpense(_data: {
  name: string;
  amount: number;
  day: number;
  isFixed?: boolean;
  date?: string;
}): Promise<Expense> {
  throw new Error("[Budget] Sin implementación de plataforma (native/web).");
}

export async function updateExpense(_data: {
  id: number;
  name: string;
  amount: number;
  day: number;
  isFixed?: boolean;
}): Promise<Expense> {
  throw new Error("[Budget] Sin implementación de plataforma (native/web).");
}

export async function deleteExpense(_id: number): Promise<void> {
  throw new Error("[Budget] Sin implementación de plataforma (native/web).");
}
