// Service/wishList/wishlist.service.native.ts
import { getDb } from "../DB_Conector";
import type { WishlistRow, WishlistItemRow } from "./wishlist.service";

async function ensureSchema() {
  const db: any = await getDb();

  await db.execAsync?.(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS Wishlist (
      id_wishlist INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario  INTEGER NOT NULL,
      Total       REAL    NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS WishListDetalle (
      id_wishlistDetalle INTEGER PRIMARY KEY AUTOINCREMENT,
      id_wishlist        INTEGER NOT NULL,
      Nombre             TEXT    NOT NULL,
      Monto              REAL    NOT NULL DEFAULT 0,
      FechaLimite        TEXT    NULL,
      Descripcion        TEXT    NULL,
      FOREIGN KEY(id_wishlist) REFERENCES Wishlist(id_wishlist)
    );
  `);

  // 🔹 Nuevas columnas (idempotentes)
  try {
    await db.execAsync?.(
      `ALTER TABLE WishListDetalle ADD COLUMN Ahorrado REAL NOT NULL DEFAULT 0;`
    );
  } catch {}
  try {
    await db.execAsync?.(
      `ALTER TABLE WishListDetalle ADD COLUMN Completado INTEGER NOT NULL DEFAULT 0;`
    );
  } catch {}
}

export async function crearWishlistSiNoExiste(idUsuario: number): Promise<number> {
  await ensureSchema();
  const db: any = await getDb();
  const uid = Number(idUsuario);

  const row = await db.getFirstAsync?.(
    `SELECT id_wishlist FROM Wishlist WHERE id_usuario = ? LIMIT 1;`,
    [uid]
  );
  if (row?.id_wishlist) return row.id_wishlist as number;

  await db.runAsync?.(`INSERT INTO Wishlist (id_usuario, Total) VALUES (?, 0);`, [uid]);

  const created = await db.getFirstAsync?.(
    `SELECT id_wishlist FROM Wishlist WHERE id_usuario = ? LIMIT 1;`,
    [uid]
  );
  return created?.id_wishlist ?? 0;
}

export async function agregarDeseo(
  idWishlist: number,
  nombre: string,
  monto: number,
  fechaLimite?: string | null,
  descripcion?: string | null
): Promise<number> {
  await ensureSchema();
  const db: any = await getDb();

  await db.execAsync?.("BEGIN TRANSACTION;");
  try {
    await db.runAsync?.(
      `INSERT INTO WishListDetalle (id_wishlist, Nombre, Monto, FechaLimite, Descripcion, Ahorrado, Completado)
       VALUES (?, ?, ?, ?, ?, 0, 0);`,
      [idWishlist, nombre, Number(monto) || 0, fechaLimite ?? null, descripcion ?? null]
    );

    await db.runAsync?.(
      `UPDATE Wishlist
         SET Total = COALESCE((SELECT SUM(Monto) FROM WishListDetalle WHERE id_wishlist = ?), 0)
       WHERE id_wishlist = ?;`,
      [idWishlist, idWishlist]
    );

    await db.execAsync?.("COMMIT;");
    return Date.now();
  } catch (err) {
    await db.execAsync?.("ROLLBACK;");
    console.error("❌ [Wishlist-Native] agregarDeseo:", err);
    throw err;
  }
}

export async function obtenerWishlistConItems(
  idUsuario: number
): Promise<{ wishlist: WishlistRow | null; items: WishlistItemRow[] }> {
  await ensureSchema();
  const db: any = await getDb();
  const uid = Number(idUsuario);

  const wl = await db.getFirstAsync?.(
    `SELECT id_wishlist, Total FROM Wishlist WHERE id_usuario = ? LIMIT 1;`,
    [uid]
  );
  if (!wl) return { wishlist: null, items: [] };

  const items = await db.getAllAsync?.(
    `SELECT id_wishlistDetalle, Nombre, Monto, FechaLimite, Descripcion, Ahorrado, Completado
       FROM WishListDetalle
      WHERE id_wishlist = ?
      ORDER BY id_wishlistDetalle DESC;`,
    [wl.id_wishlist]
  );

  return {
    wishlist: wl as WishlistRow,
    items: (items ?? []) as WishlistItemRow[],
  };
}

/** Actualizar datos base (nombre/monto/fecha/descripcion) */
export async function actualizarDeseo(
  idWishlistDetalle: number,
  nombre: string,
  monto: number,
  fechaLimite?: string | null,
  descripcion?: string | null
): Promise<void> {
  await ensureSchema();
  const db: any = await getDb();

  // Obtiene id_wishlist para recalcular total
  const row = await db.getFirstAsync?.(
    `SELECT id_wishlist FROM WishListDetalle WHERE id_wishlistDetalle = ?;`,
    [idWishlistDetalle]
  );
  if (!row?.id_wishlist) return;

  const idWishlist = row.id_wishlist;

  await db.execAsync?.("BEGIN TRANSACTION;");
  try {
    await db.runAsync?.(
      `UPDATE WishListDetalle
         SET Nombre = ?, Monto = ?, FechaLimite = ?, Descripcion = ?
       WHERE id_wishlistDetalle = ?;`,
      [nombre, Number(monto) || 0, fechaLimite ?? null, descripcion ?? null, idWishlistDetalle]
    );

    await db.runAsync?.(
      `UPDATE Wishlist
         SET Total = COALESCE((SELECT SUM(Monto) FROM WishListDetalle WHERE id_wishlist = ?), 0)
       WHERE id_wishlist = ?;`,
      [idWishlist, idWishlist]
    );

    await db.execAsync?.("COMMIT;");
  } catch (err) {
    await db.execAsync?.("ROLLBACK;");
    console.error("❌ [Wishlist-Native] actualizarDeseo:", err);
    throw err;
  }
}

/** NUEVO: actualizar solo ahorro + completado */
export async function actualizarProgresoDeseo(
  idWishlistDetalle: number,
  ahorrado: number,
  completado: number
): Promise<void> {
  await ensureSchema();
  const db: any = await getDb();

  await db.runAsync?.(
    `UPDATE WishListDetalle
       SET Ahorrado = ?, Completado = ?
     WHERE id_wishlistDetalle = ?;`,
    [Number(ahorrado) || 0, completado ? 1 : 0, idWishlistDetalle]
  );
}

/** Eliminar */
export async function eliminarDeseo(idWishlistDetalle: number): Promise<void> {
  await ensureSchema();
  const db: any = await getDb();

  // Obtiene id_wishlist para recalcular total
  const row = await db.getFirstAsync?.(
    `SELECT id_wishlist FROM WishListDetalle WHERE id_wishlistDetalle = ?;`,
    [idWishlistDetalle]
  );
  if (!row?.id_wishlist) return;

  const idWishlist = row.id_wishlist;

  await db.execAsync?.("BEGIN TRANSACTION;");
  try {
    await db.runAsync?.(
      `DELETE FROM WishListDetalle WHERE id_wishlistDetalle = ?;`,
      [idWishlistDetalle]
    );

    await db.runAsync?.(
      `UPDATE Wishlist
         SET Total = COALESCE((SELECT SUM(Monto) FROM WishListDetalle WHERE id_wishlist = ?), 0)
       WHERE id_wishlist = ?;`,
      [idWishlist, idWishlist]
    );

    await db.execAsync?.("COMMIT;");
  } catch (err) {
    await db.execAsync?.("ROLLBACK;");
    console.error("❌ [Wishlist-Native] eliminarDeseo:", err);
    throw err;
  }
}
