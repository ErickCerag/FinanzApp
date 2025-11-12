// Service/budget/budget.service.ts
// Contrato común + tipos. La implementación real está en *.native.ts / *.web.ts.

export type Income = {
  id: number;
  name: string;
  amount: number;
};

export type Expense = {
  id: number;
  name: string;
  amount: number;
  day: number; // 1-31
};

export type IncomeDTO = { name: string; amount: number };
export type ExpenseDTO = { name: string; amount: number; day: number };

export async function fetchIncomes(): Promise<Income[]> {
  throw new Error("[budget] Sin implementación de plataforma (native/web).");
}
export async function fetchExpenses(): Promise<Expense[]> {
  throw new Error("[budget] Sin implementación de plataforma (native/web).");
}

export async function addIncome(_dto: IncomeDTO): Promise<Income> {
  throw new Error("[budget] Sin implementación de plataforma (native/web).");
}
export async function addExpense(_dto: ExpenseDTO): Promise<Expense> {
  throw new Error("[budget] Sin implementación de plataforma (native/web).");
}

export async function updateIncome(_p: { id: number; name: string; amount: number }): Promise<Income> {
  throw new Error("[budget] Sin implementación de plataforma (native/web).");
}
export async function updateExpense(_p: { id: number; name: string; amount: number; day: number }): Promise<Expense> {
  throw new Error("[budget] Sin implementación de plataforma (native/web).");
}

export async function deleteIncome(_id: number): Promise<void> {
  throw new Error("[budget] Sin implementación de plataforma (native/web).");
}
export async function deleteExpense(_id: number): Promise<void> {
  throw new Error("[budget] Sin implementación de plataforma (native/web).");
}
