// Service/budget/budget.service.web.ts
import type { Income, Expense } from "./budget.service";
import { obtenerSesion } from "../user/user.service";

type Bucket = {
  incomes: Income[];
  expenses: Expense[];
};

type DB = Record<string, Bucket>;

const KEY = "budget_v2";

// Helpers de almacenamiento
function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DB) : {};
  } catch {
    return {};
  }
}

function save(db: DB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // ignore
  }
}

async function getUserKey(): Promise<string> {
  try {
    const u = await obtenerSesion();
    if (u?.id_usuario) return String(u.id_usuario);
  } catch {
    // ignore
  }
  return "guest";
}

function ensureBucket(db: DB, key: string): Bucket {
  if (!db[key]) db[key] = { incomes: [], expenses: [] };
  return db[key];
}

function genId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

/* ================== INCOMES ================== */

export async function fetchIncomes(): Promise<Income[]> {
  const userKey = await getUserKey();
  const db = load();
  const bucket = ensureBucket(db, userKey);
  return bucket.incomes;
}

export async function addIncome(data: {
  name: string;
  amount: number;
  isFixed?: boolean;
  date?: string;
}): Promise<Income> {
  const userKey = await getUserKey();
  const db = load();
  const bucket = ensureBucket(db, userKey);

  const income: Income = {
    id: genId(),
    name: data.name,
    amount: Number(data.amount) || 0,
    isFixed: !!data.isFixed,
    date: data.date ?? new Date().toISOString(),
  };

  bucket.incomes.unshift(income);
  save(db);
  return income;
}

export async function updateIncome(data: {
  id: number;
  name: string;
  amount: number;
  isFixed?: boolean;
}): Promise<Income> {
  const userKey = await getUserKey();
  const db = load();
  const bucket = ensureBucket(db, userKey);

  const idx = bucket.incomes.findIndex((i) => i.id === data.id);
  if (idx < 0) throw new Error("Ingreso no encontrado");

  const prev = bucket.incomes[idx];
  const updated: Income = {
    ...prev,
    name: data.name,
    amount: Number(data.amount) || 0,
    isFixed: !!data.isFixed,
  };

  bucket.incomes[idx] = updated;
  save(db);
  return updated;
}

export async function deleteIncome(id: number): Promise<void> {
  const userKey = await getUserKey();
  const db = load();
  const bucket = ensureBucket(db, userKey);

  bucket.incomes = bucket.incomes.filter((i) => i.id !== id);
  save(db);
}

/* ================== EXPENSES ================== */

export async function fetchExpenses(): Promise<Expense[]> {
  const userKey = await getUserKey();
  const db = load();
  const bucket = ensureBucket(db, userKey);
  return bucket.expenses;
}

export async function addExpense(data: {
  name: string;
  amount: number;
  day: number;
  isFixed?: boolean;
  date?: string;
}): Promise<Expense> {
  const userKey = await getUserKey();
  const db = load();
  const bucket = ensureBucket(db, userKey);

  const expense: Expense = {
    id: genId(),
    name: data.name,
    amount: Number(data.amount) || 0,
    day: Number(data.day || 1),
    isFixed: !!data.isFixed,
    date: data.date ?? new Date().toISOString(),
  };

  bucket.expenses.unshift(expense);
  save(db);
  return expense;
}

export async function updateExpense(data: {
  id: number;
  name: string;
  amount: number;
  day: number;
  isFixed?: boolean;
}): Promise<Expense> {
  const userKey = await getUserKey();
  const db = load();
  const bucket = ensureBucket(db, userKey);

  const idx = bucket.expenses.findIndex((e) => e.id === data.id);
  if (idx < 0) throw new Error("Gasto no encontrado");

  const prev = bucket.expenses[idx];
  const updated: Expense = {
    ...prev,
    name: data.name,
    amount: Number(data.amount) || 0,
    day: Number(data.day || 1),
    isFixed: !!data.isFixed,
  };

  bucket.expenses[idx] = updated;
  save(db);
  return updated;
}

export async function deleteExpense(id: number): Promise<void> {
  const userKey = await getUserKey();
  const db = load();
  const bucket = ensureBucket(db, userKey);

  bucket.expenses = bucket.expenses.filter((e) => e.id !== id);
  save(db);
}
