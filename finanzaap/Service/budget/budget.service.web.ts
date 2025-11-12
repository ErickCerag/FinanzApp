// Service/budget/budget.service.web.ts
import type { Income, Expense, IncomeDTO, ExpenseDTO } from "./budget.service";
import { getRealUserIdFromSession } from "@/Service/user/user.service";

type Bucket = {
  incomes: Income[];
  expenses: Expense[];
};
type DB = Record<string, Bucket>;

const KEY = "budget_v1";

function load(): DB {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
  catch { return {}; }
}
function save(db: DB) { localStorage.setItem(KEY, JSON.stringify(db)); }

function ensureBucket(db: DB, uid: number): Bucket {
  const k = String(uid);
  if (!db[k]) db[k] = { incomes: [], expenses: [] };
  return db[k];
}
function nextId(list: { id: number }[]) {
  return (list.reduce((m, x) => Math.max(m, x.id ?? 0), 0) || 0) + 1;
}

async function uid(): Promise<number> {
  const real = await getRealUserIdFromSession();
  return real ?? 1;
}

export async function fetchIncomes(): Promise<Income[]> {
  const db = load();
  const u = await uid();
  return ensureBucket(db, u).incomes.slice().sort((a,b)=>b.id-a.id);
}
export async function fetchExpenses(): Promise<Expense[]> {
  const db = load();
  const u = await uid();
  return ensureBucket(db, u).expenses.slice().sort((a,b)=>b.id-a.id);
}

export async function addIncome(dto: IncomeDTO): Promise<Income> {
  const db = load();
  const u = await uid();
  const b = ensureBucket(db, u);
  const created: Income = { id: nextId(b.incomes), name: dto.name, amount: Number(dto.amount)||0 };
  b.incomes = [created, ...b.incomes];
  save(db);
  return created;
}
export async function addExpense(dto: ExpenseDTO): Promise<Expense> {
  const db = load();
  const u = await uid();
  const b = ensureBucket(db, u);
  const created: Expense = {
    id: nextId(b.expenses),
    name: dto.name,
    amount: Number(dto.amount)||0,
    day: Math.min(31, Math.max(1, Number(dto.day)||1)),
  };
  b.expenses = [created, ...b.expenses];
  save(db);
  return created;
}

export async function updateIncome(p: { id:number; name:string; amount:number }): Promise<Income> {
  const db = load();
  const u = await uid();
  const b = ensureBucket(db, u);
  const idx = b.incomes.findIndex(i=>i.id===p.id);
  if (idx>=0) {
    b.incomes[idx] = { id: p.id, name: p.name, amount: Number(p.amount)||0 };
    save(db);
    return b.incomes[idx];
  }
  throw new Error("Income not found");
}
export async function updateExpense(p: { id:number; name:string; amount:number; day:number }): Promise<Expense> {
  const db = load();
  const u = await uid();
  const b = ensureBucket(db, u);
  const idx = b.expenses.findIndex(i=>i.id===p.id);
  if (idx>=0) {
    b.expenses[idx] = {
      id: p.id,
      name: p.name,
      amount: Number(p.amount)||0,
      day: Math.min(31, Math.max(1, Number(p.day)||1)),
    };
    save(db);
    return b.expenses[idx];
  }
  throw new Error("Expense not found");
}

export async function deleteIncome(id:number): Promise<void> {
  const db = load();
  const u = await uid();
  const b = ensureBucket(db, u);
  b.incomes = b.incomes.filter(i=>i.id!==id);
  save(db);
}
export async function deleteExpense(id:number): Promise<void> {
  const db = load();
  const u = await uid();
  const b = ensureBucket(db, u);
  b.expenses = b.expenses.filter(i=>i.id!==id);
  save(db);
}
