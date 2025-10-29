import { getDb } from "../DB_Conector";
import type { Usuario } from "./user.service";


// ✅ Crea o migra la tabla Usuario en SQLite
async function ensureSchema() {
  const db: any = await getDb();

  // Crear tabla base si no existe
  await db.execAsync?.(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS Usuario (
      id_usuario INTEGER PRIMARY KEY,
      Nombre     TEXT NOT NULL
    );
  `);

  // 🔹 Migración: verificar columnas existentes
  let cols: any[] = [];
  try {
    cols = (await db.getAllAsync?.("PRAGMA table_info(Usuario)")) as any[] || [];
  } catch {
    cols = [];
  }

  const names = cols.map((c: any) => c.name as string);

  // Agregar columnas nuevas si faltan
  if (!names.includes("Telefono")) {
    await db.runAsync?.(`ALTER TABLE Usuario ADD COLUMN Telefono TEXT NULL;`);
  }

  if (!names.includes("Correo")) {
    await db.runAsync?.(`ALTER TABLE Usuario ADD COLUMN Correo TEXT NULL;`);
  }
}

// ✅ Obtener usuario
export async function obtenerUsuario(id: number): Promise<Usuario | null> {
  await ensureSchema();
  const db: any = await getDb();

  try {
    const rows = await db.getAllAsync?.(
      `SELECT id_usuario, Nombre, Telefono, Correo
       FROM Usuario
       WHERE id_usuario = ?
       LIMIT 1`,
      [id]
    );

    return rows && rows.length ? (rows[0] as Usuario) : null;
  } catch (err) {
    console.error("❌ [Usuario] Error al obtener:", err);
    return null;
  }
}

// ✅ Insertar o actualizar usuario
export async function upsertUsuario(u: Usuario): Promise<void> {
  await ensureSchema();
  const db: any = await getDb();

  try {
    await db.runAsync?.(
      `INSERT INTO Usuario (id_usuario, Nombre, Telefono, Correo)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id_usuario) DO UPDATE SET
         Nombre   = excluded.Nombre,
         Telefono = excluded.Telefono,
         Correo   = excluded.Correo;`,
      [u.id_usuario, u.Nombre, u.Telefono, u.Correo]
    );

    console.log("✅ [Usuario] Datos guardados/actualizados correctamente");
  } catch (err) {
    console.error("❌ [Usuario] Error al guardar:", err);
  }
}
