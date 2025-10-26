import * as SQLite from "expo-sqlite";

let _db: SQLite.SQLiteDatabase | null = null;

/**
 * Abre la base de datos de FinanzApp.
 * Usa la nueva API asíncrona (Expo SDK 51+).
 */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

  console.log("🔹 [DB] Abriendo BD con openDatabaseAsync('finanzapp.db')");
  _db = await SQLite.openDatabaseAsync("finanzapp.db");
  return _db;
}

/**
 * Inicializa la base de datos: crea tablas y activa claves foráneas.
 */
export async function initDb(): Promise<void> {
  const db = await getDb();

  console.log("📦 [DB] Inicializando BD FinanzApp…");

  // Ejecuta múltiples sentencias SQL en bloque
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS Usuario (
      id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
      Nombre TEXT,
      Apellido TEXT,
      Correo TEXT,
      Contra TEXT,
      FechaNacim TEXT
    );

    CREATE TABLE IF NOT EXISTS Wishlist (
      id_wishlist INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario INTEGER NOT NULL,
      Total REAL,
      FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
      UNIQUE (id_usuario)
    );

    CREATE TABLE IF NOT EXISTS WishListDetalle (
      id_wishlistDetalle INTEGER PRIMARY KEY AUTOINCREMENT,
      id_wishlist INTEGER NOT NULL,
      Nombre TEXT,
      Monto REAL,
      FechaLimite TEXT,
      Descripcion TEXT,
      FOREIGN KEY (id_wishlist) REFERENCES Wishlist(id_wishlist) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS schema_version (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      version INTEGER NOT NULL
    );

    INSERT OR IGNORE INTO Usuario (id_usuario, Nombre, Correo, Contra)
    VALUES (1, 'UsuarioDemo', 'demo@finanzapp', '');

    INSERT OR IGNORE INTO schema_version (id, version) VALUES (1, 1);
  `);

  console.log("✅ [DB] Inicialización completa.");
}

/**
 * Ejecuta una consulta SQL con parámetros opcionales.
 * Devuelve los resultados como un array de objetos.
 */
export async function query(sql: string, params: any[] = []): Promise<any[]> {
  const db = await getDb();
  const result = await db.getAllAsync(sql, params);
  return result;
}

/**
 * Ejecuta una sentencia SQL sin devolver resultados (INSERT, UPDATE, DELETE).
 */
export async function execute(sql: string, params: any[] = []): Promise<void> {
  const db = await getDb();
  await db.runAsync(sql, params);
}
