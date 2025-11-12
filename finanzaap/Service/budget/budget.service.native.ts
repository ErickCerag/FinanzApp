// Service/budget/budget.service.native.ts
import * as SQLite from "expo-sqlite";
import type { Income, Expense, IncomeDTO, ExpenseDTO } from "./budget.service";
import { getDb } from "@/Service/DB_Conector";
import { getRealUserIdFromSession } from "@/Service/user/user.service";

async function ensureSchema() {
  const db: any = await getDb();
  await db.execAsync?.(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS Income (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS Expense (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      day INTEGER NOT NULL DEFAULT 1
    );
  `);
}
async function uid(): Promise<number> {
  const real = await getRealUserIdFromSession();
  return real ?? 1;
}

/* ======== READ ======== */
export async function fetchIncomes(): Promise<Income[]> {
  await ensureSchema();
  const db: any = await getDb();
  const u = await uid();
  const rows = await db.getAllAsync?.(
    `SELECT id, name, amount FROM Income WHERE user_id=? ORDER BY id DESC`, [u]
  );
  return (rows ?? []).map((r:any)=>({ id:r.id, name:r.name, amount:Number(r.amount)||0 }));
}
export async function fetchExpenses(): Promise<Expense[]> {
  await ensureSchema();
  const db: any = await getDb();
  const u = await uid();
  const rows = await db.getAllAsync?.(
    `SELECT id, name, amount, day FROM Expense WHERE user_id=? ORDER BY id DESC`, [u]
  );
  return (rows ?? []).map((r:any)=>({ id:r.id, name:r.name, amount:Number(r.amount)||0, day:Number(r.day)||1 }));
}

/* ======== ADD ======== */
export async function addIncome(dto: IncomeDTO): Promise<Income> {
  await ensureSchema();
  const db: any = await getDb();
  const u = await uid();
  await db.runAsync?.(`INSERT INTO Income (user_id, name, amount) VALUES (?, ?, ?)`, [u, dto.name, Number(dto.amount)||0]);
  const row = await db.getFirstAsync?.(`SELECT id, name, amount FROM Income WHERE user_id=? ORDER BY id DESC LIMIT 1`, [u]);
  return { id: row.id, name: row.name, amount: Number(row.amount)||0 };
}
export async function addExpense(dto: ExpenseDTO): Promise<Expense> {
  await ensureSchema();
  const db: any = await getDb();
  const u = await uid();
  const d = Math.min(31, Math.max(1, Number(dto.day)||1));
  await db.runAsync?.(`INSERT INTO Expense (user_id, name, amount, day) VALUES (?, ?, ?, ?)`, [u, dto.name, Number(dto.amount)||0, d]);
  const row = await db.getFirstAsync?.(`SELECT id, name, amount, day FROM Expense WHERE user_id=? ORDER BY id DESC LIMIT 1`, [u]);
  return { id: row.id, name: row.name, amount: Number(row.amount)||0, day: Number(row.day)||1 };
}

/* ======== UPDATE ======== */
export async function updateIncome(p:{id:number; name:string; amount:number}): Promise<Income> {
  await ensureSchema();
  const db: any = await getDb();
  await db.runAsync?.(`UPDATE Income SET name=?, amount=? WHERE id=?`, [p.name, Number(p.amount)||0, p.id]);
  const row = await db.getFirstAsync?.(`SELECT id, name, amount FROM Income WHERE id=?`, [p.id]);
  return { id: row.id, name: row.name, amount: Number(row.amount)||0 };
}
export async function updateExpense(p:{id:number; name:string; amount:number; day:number}): Promise<Expense> {
  await ensureSchema();
  const db: any = await getDb();
  const d = Math.min(31, Math.max(1, Number(p.day)||1));
  await db.runAsync?.(`UPDATE Expense SET name=?, amount=?, day=? WHERE id=?`, [p.name, Number(p.amount)||0, d, p.id]);
  const row = await db.getFirstAsync?.(`SELECT id, name, amount, day FROM Expense WHERE id=?`, [p.id]);
  return { id: row.id, name: row.name, amount: Number(row.amount)||0, day: Number(row.day)||1 };
}

/* ======== DELETE ======== */
export async function deleteIncome(id:number): Promise<void> {
  await ensureSchema();
  const db: any = await getDb();
  await db.runAsync?.(`DELETE FROM Income WHERE id=?`, [id]);
}
export async function deleteExpense(id:number): Promise<void> {
  await ensureSchema();
  const db: any = await getDb();
  await db.runAsync?.(`DELETE FROM Expense WHERE id=?`, [id]);
}
