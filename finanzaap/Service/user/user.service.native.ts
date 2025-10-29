// Service/user/user.service.native.ts
import { getDb } from "../DB_Conector";
import type { Usuario } from "./user.service";

// Crea/Migra la tabla Usuario al esquema final (Correo, Avatar) y tolera columna 'Contra'
async function ensureSchema() {
  const db: any = await getDb();

  // Crea tabla mínima si no existe (id + Nombre)
  await db.execAsync?.(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS Usuario (
      id_usuario INTEGER PRIMARY KEY,
      Nombre     TEXT NOT NULL
    );
  `);

  // Inspeccionar columnas actuales
  let cols: any[] = [];
  try {
    cols = (await db.getAllAsync?.("PRAGMA table_info(Usuario)")) as any[] || [];
  } catch {
    cols = [];
  }
  const names = cols.map((c: any) => String(c.name));

  // Esquema deseado (toleramos 'Contra' por compatibilidad)
  const desired = ["id_usuario", "Nombre", "Correo", "Avatar", "Contra"];
  const hasCorreo  = names.includes("Correo");
  const hasAvatar  = names.includes("Avatar");
  const hasContra  = names.includes("Contra");

  // ¿Falta alguna de las deseadas? → rebuild seguro
  const needsRebuild = desired.some((n) => !names.includes(n));

  if (needsRebuild) {
    await db.execAsync?.("BEGIN TRANSACTION;");

    await db.execAsync?.(`
      CREATE TABLE IF NOT EXISTS _Usuario_new (
        id_usuario INTEGER PRIMARY KEY,
        Nombre     TEXT NOT NULL,
        Correo     TEXT NULL,
        Avatar     TEXT NULL,
        Contra     TEXT NULL
      );
    `);

    const selectCorreo = hasCorreo ? "Correo" : "NULL";
    const selectAvatar = hasAvatar ? "Avatar" : "NULL";
    const selectContra = hasContra ? "Contra" : "NULL";

    await db.execAsync?.(`
      INSERT INTO _Usuario_new (id_usuario, Nombre, Correo, Avatar, Contra)
      SELECT id_usuario, Nombre, ${selectCorreo}, ${selectAvatar}, ${selectContra}
      FROM Usuario;
    `);

    await db.execAsync?.(`DROP TABLE Usuario;`);
    await db.execAsync?.(`ALTER TABLE _Usuario_new RENAME TO Usuario;`);
    await db.execAsync?.("COMMIT;");
  } else {
    // Si no requiere rebuild completo, añadimos puntuales
    if (!hasCorreo)  await db.runAsync?.(`ALTER TABLE Usuario ADD COLUMN Correo TEXT NULL;`);
    if (!hasAvatar)  await db.runAsync?.(`ALTER TABLE Usuario ADD COLUMN Avatar TEXT NULL;`);
    if (!hasContra)  await db.runAsync?.(`ALTER TABLE Usuario ADD COLUMN Contra TEXT NULL;`);
  }
}

export async function obtenerUsuario(id: number): Promise<Usuario | null> {
  await ensureSchema();
  const db: any = await getDb();
  try {
    const rows = await db.getAllAsync?.(
      `SELECT id_usuario, Nombre, Correo, Avatar
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

export async function upsertUsuario(u: Usuario): Promise<void> {
  await ensureSchema();
  const db: any = await getDb();
  try {
    await db.runAsync?.(
      `INSERT INTO Usuario (id_usuario, Nombre, Correo, Avatar)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id_usuario) DO UPDATE SET
         Nombre = excluded.Nombre,
         Correo = excluded.Correo,
         Avatar = excluded.Avatar;`,
      [u.id_usuario, u.Nombre, u.Correo ?? null, u.Avatar ?? null]
    );
    console.log("✅ [Usuario] Guardado/actualizado OK");
  } catch (err) {
    console.error("❌ [Usuario] Error al guardar:", err);
  }
}
