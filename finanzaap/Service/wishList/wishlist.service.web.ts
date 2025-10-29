// Service/wishList/wishlist.service.web.ts
import type { WishlistRow, WishlistItemRow } from "./wishlist.service";

type Item = {
  id: string;
  nombre: string;
  monto: number;
  fechaLimite?: string | null;
  descripcion?: string | null;
};

type Bucket = { items: Item[]; total: number };
type DB = Record<string, Bucket>;

const KEY = "wishlists_v1";

function load(): DB {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
  catch { return {}; }
}
function save(db: DB) { localStorage.setItem(KEY, JSON.stringify(db)); }

export async function crearWishlistSiNoExiste(idUsuario: number): Promise<number> {
  const db = load();
  const k = String(idUsuario);
  if (!db[k]) db[k] = { items: [], total: 0 };
  save(db);
  // En web usamos idUsuario como id_wishlist
  return idUsuario;
}

export async function agregarDeseo(
  idWishlist: number,
  nombre: string,
  monto: number,
  fechaLimite?: string | null,
  descripcion?: string | null
): Promise<number> {
  const db = load();
  const k = String(idWishlist);
  if (!db[k]) db[k] = { items: [], total: 0 };

  const id = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
  db[k].items.unshift({
    id,
    nombre,
    monto: Number(monto) || 0,
    fechaLimite: fechaLimite ?? null,
    descripcion: descripcion ?? null,
  });
  db[k].total = db[k].items.reduce((a, b) => a + (b.monto || 0), 0);
  save(db);
  return Date.now();
}

export async function obtenerWishlistConItems(
  idUsuario: number
): Promise<{ wishlist: WishlistRow | null; items: WishlistItemRow[] }> {
  const db = load();
  const k = String(idUsuario);
  const bucket = db[k] ?? { items: [], total: 0 };

  const wl: WishlistRow = { id_wishlist: idUsuario, Total: bucket.total };
  const items: WishlistItemRow[] = bucket.items.map((x) => ({
    id_wishlistDetalle: Number.NaN,       // no aplica en Web
    Nombre: x.nombre,
    Monto: x.monto,
    FechaLimite: x.fechaLimite ?? null,
    Descripcion: x.descripcion ?? null,
  }));

  return { wishlist: wl, items };
}
