// Service/user/user.service.native.ts
import { getDb } from "../DB_Conector";
import type { Usuario, RegistroPayload } from "./user.service";

const normEmail = (s?: string | null) =>
  (s ?? "").normalize("NFKC").trim().toLowerCase();

/* ====== Schema ====== */
async function ensureSchema() {
  const db: any = await getDb();
  await db.execAsync?.(`
    PRAGMA journal_mode = WAL;

    /* Tabla usuarios con UNIQUE por correo (case-insensitive) */
    CREATE TABLE IF NOT EXISTS Usuario (
      id_usuario  INTEGER PRIMARY KEY AUTOINCREMENT,
      Nombre      TEXT NOT NULL,
      Apellido    TEXT NULL,
      Correo      TEXT NULL UNIQUE COLLATE NOCASE,
      Contra      TEXT NULL,
      FechaNacim  TEXT NULL,
      Avatar      TEXT NULL
    );

    /* ✂️ Elimina índice viejo si aún existe en tu BD */
    DROP INDEX IF EXISTS UX_Usuario_Correo_Norm;

    /* Tabla de sesión: guarda el id REAL del usuario logueado */
    CREATE TABLE IF NOT EXISTS Session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      real_user_id INTEGER NULL
    );
    INSERT OR IGNORE INTO Session (id, real_user_id) VALUES (1, NULL);

    /* Fila snapshot reservada (id=1). NUNCA debe tener Correo único. */
    INSERT OR IGNORE INTO Usuario (id_usuario, Nombre, Correo)
    VALUES (1, '__SESSION__', NULL);
  `);
}

/* ====== Lecturas ====== */
export async function obtenerUsuario(id: number): Promise<Usuario | null> {
  await ensureSchema();
  const db: any = await getDb();
  const rows = await db.getAllAsync?.(
    `SELECT id_usuario, Nombre, Correo, Avatar, Apellido, FechaNacim, Contra
     FROM Usuario WHERE id_usuario = ? LIMIT 1`,
    [id]
  );
  return rows?.[0] ?? null;
}

export async function obtenerUsuarioPorCorreo(correo: string): Promise<Usuario | null> {
  await ensureSchema();
  const db: any = await getDb();
  const clean = normEmail(correo);
  const rows = await db.getAllAsync?.(
    `SELECT id_usuario, Nombre, Correo, Avatar, Apellido, FechaNacim, Contra
     FROM Usuario
     WHERE TRIM(Correo) = TRIM(?) COLLATE NOCASE
     LIMIT 1`,
    [clean]
  );
  return rows?.[0] ?? null;
}

/* ====== Escrituras ====== */
export async function registrarUsuario(data: RegistroPayload): Promise<number> {
  await ensureSchema();
  const db: any = await getDb();
  const correoNorm = normEmail(data.correo);

  // chequeo manual
  const existe = await obtenerUsuarioPorCorreo(correoNorm);
  if (existe) {
    const err: any = new Error("Correo duplicado");
    err.code = 19;
    throw err;
  }

  const res = await db.runAsync?.(
    `INSERT INTO Usuario (Nombre, Apellido, FechaNacim, Correo, Contra, Avatar)
     VALUES (?, ?, ?, ?, ?, NULL)`,
    [
      data.nombre.trim(),
      data.apellido.trim(),
      data.fechaNac,
      correoNorm,
      data.contra,
    ]
  );

  const id = res?.lastInsertRowId ?? 0;
  console.log("[NATIVE REGISTER] id:", id);
  return id;
}

export async function upsertUsuario(u: Usuario): Promise<void> {
  await ensureSchema();
  const db: any = await getDb();
  const correo = u.Correo != null ? normEmail(u.Correo) : null;

  await db.runAsync?.(
    `INSERT INTO Usuario (id_usuario, Nombre, Correo, Avatar, Apellido, FechaNacim, Contra)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id_usuario) DO UPDATE SET
       Nombre     = excluded.Nombre,
       Correo     = excluded.Correo,
       Avatar     = excluded.Avatar,
       Apellido   = excluded.Apellido,
       FechaNacim = excluded.FechaNacim,
       Contra     = COALESCE(excluded.Contra, Usuario.Contra);`,
    [
      u.id_usuario,
      u.Nombre,
      correo,
      u.Avatar ?? null,
      u.Apellido ?? null,
      u.FechaNacim ?? null,
      u.Contra ?? null,
    ]
  );
}

/* ====== Sesión ====== */
export async function iniciarSesion(u: Usuario): Promise<void> {
  await ensureSchema();
  const db: any = await getDb();

  /* Snapshot id=1: NO guardes Correo ni Contra (evita UNIQUE). */
  await db.runAsync?.(
    `INSERT INTO Usuario (id_usuario, Nombre, Correo, Avatar, Apellido, FechaNacim)
     VALUES (1, ?, NULL, ?, ?, ?)
     ON CONFLICT(id_usuario) DO UPDATE SET
       Nombre     = excluded.Nombre,
       Avatar     = excluded.Avatar,
       Apellido   = excluded.Apellido,
       FechaNacim = excluded.FechaNacim;`,
    [
      u.Nombre,
      u.Avatar ?? null,
      u.Apellido ?? null,
      u.FechaNacim ?? null,
    ]
  );

  await db.runAsync?.(
    `INSERT INTO Session (id, real_user_id) VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET real_user_id = excluded.real_user_id`,
    [u.id_usuario]
  );
}

/* Devuelve el USUARIO REAL (para Perfil). */
export async function obtenerSesion(): Promise<Usuario | null> {
  await ensureSchema();
  const db: any = await getDb();
  const row = await db.getAllAsync?.(`SELECT real_user_id FROM Session WHERE id = 1`);
  const realId = row?.[0]?.real_user_id;
  if (!realId) return null;
  return await obtenerUsuario(realId);
}

export async function getRealUserIdFromSession(): Promise<number | null> {
  await ensureSchema();
  const db: any = await getDb();
  const rows = await db.getAllAsync?.(`SELECT real_user_id FROM Session WHERE id = 1`);
  const v = rows?.[0]?.real_user_id;
  return v != null ? Number(v) : null;
}

export async function logoutLocal(): Promise<void> {
  await ensureSchema();
  const db: any = await getDb();
  await db.runAsync?.(`DELETE FROM Usuario WHERE id_usuario = 1;`);
  await db.runAsync?.(`UPDATE Session SET real_user_id = NULL WHERE id = 1;`);
}

/* ====== Debug ====== */
export async function _debugDumpUsuarios(): Promise<void> {
  try {
    await ensureSchema();
    const db: any = await getDb();
    const usuarios = await db.getAllAsync?.(
      `SELECT id_usuario, Nombre, Correo, Contra, Avatar FROM Usuario ORDER BY id_usuario`
    );
    const session = await db.getAllAsync?.(
      `SELECT id, real_user_id FROM Session WHERE id = 1`
    );
    console.log("[DEBUG Usuarios]", usuarios ?? []);
    console.log("[DEBUG Session]", session ?? []);
  } catch (e) {
    console.log("[DEBUG Usuarios] error:", e);
  }
}

console.log("[UsuarioService] NATIVE impl cargada");
