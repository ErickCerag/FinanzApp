// Service/budget/budget.service.native.ts
import { getDb } from "../DB_Conector";
import { obtenerSesion } from "../user/user.service";
import type { Income, Expense } from "./budget.service";

async function ensureSchema() {
  const db: any = await getDb();

  await db.execAsync?.(`
    PRAGMA foreign_keys = ON;

    /* Tabla Income con user_id (snake_case real) */
    CREATE TABLE IF NOT EXISTS Income (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id   INTEGER NOT NULL,
      name      TEXT    NOT NULL,
      amount    REAL    NOT NULL DEFAULT 0,
      isFixed   INTEGER NOT NULL DEFAULT 0,
      date      TEXT    NULL,
      FOREIGN KEY (user_id) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
    );

    /* Tabla Expense con user_id */
    CREATE TABLE IF NOT EXISTS Expense (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id   INTEGER NOT NULL,
      name      TEXT    NOT NULL,
      amount    REAL    NOT NULL DEFAULT 0,
      day       INTEGER NOT NULL DEFAULT 1,
      isFixed   INTEGER NOT NULL DEFAULT 0,
      date      TEXT    NULL,
      FOREIGN KEY (user_id) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
    );
  `);

  // MIGRACIONES: renombrar columnas antiguas si existen
  try { await db.execAsync?.(`ALTER TABLE Income ADD COLUMN user_id INTEGER;`); } catch {}
  try { await db.execAsync?.(`ALTER TABLE Expense ADD COLUMN user_id INTEGER;`); } catch {}

  try { await db.execAsync?.(`ALTER TABLE Income ADD COLUMN isFixed INTEGER NOT NULL DEFAULT 0;`); } catch {}
  try { await db.execAsync?.(`ALTER TABLE Expense ADD COLUMN isFixed INTEGER NOT NULL DEFAULT 0;`); } catch {}

  try { await db.execAsync?.(`ALTER TABLE Income ADD COLUMN date TEXT NULL;`); } catch {}
  try { await db.execAsync?.(`ALTER TABLE Expense ADD COLUMN date TEXT NULL;`); } catch {}

  // Asigna usuario 1 si está nulo (evita errores previos)
  await db.execAsync?.(`UPDATE Income  SET user_id = 1 WHERE user_id IS NULL;`);
  await db.execAsync?.(`UPDATE Expense SET user_id = 1 WHERE user_id IS NULL;`);
}

async function getCurrentUserId(): Promise<number> {
  const u = await obtenerSesion();
  return u?.id_usuario ?? 1;
}

/* ================== INCOMES ================== */

export async function fetchIncomes(): Promise<Income[]> {
  await ensureSchema();
  const db: any = await getDb();
  const userId = await getCurrentUserId();

  const rows = await db.getAllAsync?.(
    `SELECT id, user_id, name, amount, isFixed, date
       FROM Income
      WHERE user_id = ?
      ORDER BY id DESC;`,
    [userId]
  );

  return (rows ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    amount: Number(r.amount ?? 0),
    isFixed: !!r.isFixed,
    date: r.date ?? null,
  }));
}

export async function addIncome(data: {
  name: string;
  amount: number;
  isFixed?: boolean;
  date?: string;
}): Promise<Income> {
  await ensureSchema();
  const db: any = await getDb();
  const userId = await getCurrentUserId();

  const isFixed = data.isFixed ? 1 : 0;
  const date = data.date ?? new Date().toISOString();

  await db.runAsync?.(
    `INSERT INTO Income (user_id, name, amount, isFixed, date)
     VALUES (?, ?, ?, ?, ?);`,
    [userId, data.name, Number(data.amount) || 0, isFixed, date]
  );

  const row = await db.getFirstAsync?.(
    `SELECT id, user_id, name, amount, isFixed, date
       FROM Income
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 1;`,
    [userId]
  );

  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount ?? 0),
    isFixed: !!row.isFixed,
    date: row.date ?? null,
  };
}

export async function updateIncome(data: {
  id: number;
  name: string;
  amount: number;
  isFixed?: boolean;
}): Promise<Income> {
  await ensureSchema();
  const db: any = await getDb();
  const userId = await getCurrentUserId();

  const isFixed = data.isFixed ? 1 : 0;

  await db.runAsync?.(
    `UPDATE Income
        SET name = ?, amount = ?, isFixed = ?
      WHERE id = ? AND user_id = ?;`,
    [data.name, Number(data.amount) || 0, isFixed, data.id, userId]
  );

  const row = await db.getFirstAsync?.(
    `SELECT id, user_id, name, amount, isFixed, date
       FROM Income
      WHERE id = ? AND user_id = ?;`,
    [data.id, userId]
  );

  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount ?? 0),
    isFixed: !!row.isFixed,
    date: row.date ?? null,
  };
}

export async function deleteIncome(id: number): Promise<void> {
  await ensureSchema();
  const db: any = await getDb();
  const userId = await getCurrentUserId();

  await db.runAsync?.(
    `DELETE FROM Income WHERE id = ? AND user_id = ?;`,
    [id, userId]
  );
}

/* ================== EXPENSES ================== */

export async function fetchExpenses(): Promise<Expense[]> {
  await ensureSchema();
  const db: any = await getDb();
  const userId = await getCurrentUserId();

  const rows = await db.getAllAsync?.(
    `SELECT id, user_id, name, amount, day, isFixed, date
       FROM Expense
      WHERE user_id = ?
      ORDER BY id DESC;`,
    [userId]
  );

  return (rows ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    amount: Number(r.amount ?? 0),
    day: Number(r.day ?? 1),
    isFixed: !!r.isFixed,
    date: r.date ?? null,
  }));
}

export async function addExpense(data: {
  name: string;
  amount: number;
  day: number;
  isFixed?: boolean;
  date?: string;
}): Promise<Expense> {
  await ensureSchema();
  const db: any = await getDb();
  const userId = await getCurrentUserId();

  const isFixed = data.isFixed ? 1 : 0;
  const date = data.date ?? new Date().toISOString();
  const day = Number(data.day || 1);

  await db.runAsync?.(
    `INSERT INTO Expense (user_id, name, amount, day, isFixed, date)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [userId, data.name, Number(data.amount) || 0, day, isFixed, date]
  );

  const row = await db.getFirstAsync?.(
    `SELECT id, user_id, name, amount, day, isFixed, date
       FROM Expense
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 1;`,
    [userId]
  );

  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount ?? 0),
    day: Number(row.day ?? 1),
    isFixed: !!row.isFixed,
    date: row.date ?? null,
  };
}

export async function updateExpense(data: {
  id: number;
  name: string;
  amount: number;
  day: number;
  isFixed?: boolean;
}): Promise<Expense> {
  await ensureSchema();
  const db: any = await getDb();
  const userId = await getCurrentUserId();

  const isFixed = data.isFixed ? 1 : 0;
  const day = Number(data.day || 1);

  await db.runAsync?.(
    `UPDATE Expense
        SET name = ?, amount = ?, day = ?, isFixed = ?
      WHERE id = ? AND user_id = ?;`,
    [data.name, Number(data.amount) || 0, day, isFixed, data.id, userId]
  );

  const row = await db.getFirstAsync?.(
    `SELECT id, user_id, name, amount, day, isFixed, date
       FROM Expense
      WHERE id = ? AND user_id = ?;`,
    [data.id, userId]
  );

  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount ?? 0),
    day: Number(row.day ?? 1),
    isFixed: !!row.isFixed,
    date: row.date ?? null,
  };
}

export async function deleteExpense(id: number): Promise<void> {
  await ensureSchema();
  const db: any = await getDb();
  const userId = await getCurrentUserId();

  await db.runAsync?.(
    `DELETE FROM Expense WHERE id = ? AND user_id = ?;`,
    [id, userId]
  );
}
