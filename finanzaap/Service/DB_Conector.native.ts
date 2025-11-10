// Service/DB_Conector.native.ts
import * as SQLite from "expo-sqlite";

let _db: SQLite.SQLiteDatabase | null = null;

/** Abre la base de datos de FinanzApp (Expo SDK 51+). */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  console.log("🔹 [DB] Abriendo BD con openDatabaseAsync('finanzapp.db')");
  _db = await SQLite.openDatabaseAsync("finanzapp.db");
  return _db;
}

/** Inicializa tablas base (las migraciones finas las hace cada service). */
export async function initDb(): Promise<void> {
  const db = await getDb();

  console.log("📦 [DB] Inicializando BD FinanzApp…");

  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS Usuario (
      id_usuario  INTEGER PRIMARY KEY AUTOINCREMENT,
      Nombre      TEXT NOT NULL,
      Apellido    TEXT NULL,
      Correo      TEXT NULL UNIQUE COLLATE NOCASE,
      Contra      TEXT NULL,
      FechaNacim  TEXT NULL,
      Avatar      TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS Wishlist (
      id_wishlist INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario  INTEGER NOT NULL,
      Total       REAL,
      FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
      UNIQUE (id_usuario)
    );

    CREATE TABLE IF NOT EXISTS WishListDetalle (
      id_wishlistDetalle INTEGER PRIMARY KEY AUTOINCREMENT,
      id_wishlist        INTEGER NOT NULL,
      Nombre             TEXT,
      Monto              REAL,
      FechaLimite        TEXT,
      Descripcion        TEXT,
      FOREIGN KEY (id_wishlist) REFERENCES Wishlist(id_wishlist) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS schema_version (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      version INTEGER NOT NULL
    );
    INSERT OR IGNORE INTO schema_version (id, version) VALUES (1, 1);

    /* Fila snapshot para la sesión (id=1) */
    INSERT OR IGNORE INTO Usuario (id_usuario, Nombre, Correo)
    VALUES (1, '__SESSION__', NULL);

    /* Tabla de sesión real */
    CREATE TABLE IF NOT EXISTS Session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      real_user_id INTEGER NULL
    );
    INSERT OR IGNORE INTO Session (id, real_user_id) VALUES (1, NULL);
  `);

  console.log("✅ [DB] Inicialización completa.");
}

/** Helpers simples */
export async function query(sql: string, params: any[] = []): Promise<any[]> {
  const db = await getDb();
  return await db.getAllAsync(sql, params);
}

export async function execute(sql: string, params: any[] = []): Promise<void> {
  const db = await getDb();
  await db.runAsync(sql, params);
}
