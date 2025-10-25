import { getDb } from "../DB_Conector";

export type WishlistRow = { id_wishlist: number; Total: number };
export type WishlistItemRow = {
  id_wishlistDetalle: number;
  Nombre: string;
  Monto: number;
  FechaLimite?: string | null;
  Descripcion?: string | null;
};

// 📦 Obtiene la wishlist para un usuario
export async function obtenerWishlist(idUsuario: number): Promise<WishlistRow | null> {
  const db: any = await getDb();
  const uid = Number(idUsuario);

  try {
    // 👇 Elimina el uso del genérico <WishlistRow> que da error
    const row: any = await db.getFirstAsync(
      `SELECT id_wishlist, Total FROM Wishlist WHERE id_usuario = ? LIMIT 1;`,
      [uid]
    );

    if (row) {
      console.log("✅ [Wishlist] Encontrada:", row);
      return row as WishlistRow;
    } else {
      console.log("ℹ️ [Wishlist] No existe para usuario:", uid);
      return null;
    }
  } catch (err) {
    console.error("❌ [Wishlist] Error al obtener wishlist:", err);
    return null;
  }
}

// 📦 Obtiene wishlist + ítems
export async function obtenerWishlistConItems(
  idUsuario: number
): Promise<{ wishlist: WishlistRow | null; items: WishlistItemRow[] }> {
  const db: any = await getDb();
  const uid = Number(idUsuario);

  try {
    const wl: any = await db.getFirstAsync(
      `SELECT id_wishlist, Total FROM Wishlist WHERE id_usuario = ? LIMIT 1;`,
      [uid]
    );

    if (!wl) {
      console.log("ℹ️ [Wishlist] No existe. Items: 0");
      return { wishlist: null, items: [] };
    }

    const items: any[] = await db.getAllAsync(
      `SELECT id_wishlistDetalle, Nombre, Monto, FechaLimite, Descripcion
       FROM WishListDetalle
       WHERE id_wishlist = ?
       ORDER BY id_wishlistDetalle DESC;`,
      [wl.id_wishlist]
    );

    console.log(`✅ [Wishlist] Items: ${items.length}`);
    return { wishlist: wl as WishlistRow, items: items as WishlistItemRow[] };
  } catch (err) {
    console.error("❌ [Wishlist] Error al obtener wishlist con items:", err);
    return { wishlist: null, items: [] };
  }
}

// 🆕 Crea wishlist si no existe
export async function crearWishlistSiNoExiste(idUsuario: number): Promise<number> {
  const db: any = await getDb();
  const uid = Number(idUsuario);

  const existente = await obtenerWishlist(uid);
  if (existente) return existente.id_wishlist;

  console.log("🆕 [Wishlist] Creando nueva wishlist para usuario:", uid);

  await db.runAsync(
    `INSERT INTO Wishlist (id_usuario, Total) VALUES (?, 0);`,
    [uid]
  );

  const row: any = await db.getFirstAsync(
    `SELECT id_wishlist FROM Wishlist WHERE id_usuario = ? LIMIT 1;`,
    [uid]
  );

  console.log("✅ [Wishlist] Creada:", row?.id_wishlist);
  return row?.id_wishlist ?? 0;
}

// ➕ Agrega deseo
export async function agregarDeseo(
  idUsuario: number,
  nombre: string,
  monto: number,
  fechaLimite?: string | null,
  descripcion?: string | null
): Promise<void> {
  const db: any = await getDb();
  const uid = Number(idUsuario);

  const idWishlist = await crearWishlistSiNoExiste(uid);
  console.log("➕ [Wishlist] Agregando deseo:", nombre, "->", monto);

  await db.runAsync(
    `INSERT INTO WishListDetalle (id_wishlist, Nombre, Monto, FechaLimite, Descripcion)
     VALUES (?, ?, ?, ?, ?);`,
    [idWishlist, nombre, monto, fechaLimite ?? null, descripcion ?? null]
  );

  await db.runAsync(
    `UPDATE Wishlist
     SET Total = COALESCE((
       SELECT SUM(Monto)
       FROM WishListDetalle
       WHERE id_wishlist = ?
     ), 0)
     WHERE id_wishlist = ?;`,
    [idWishlist, idWishlist]
  );

  console.log("✅ [Wishlist] Deseo agregado correctamente.");
}
