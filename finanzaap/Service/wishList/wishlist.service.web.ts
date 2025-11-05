// Service/wishList/wishlist.service.web.ts
import type { WishlistRow, WishlistItemRow } from "./wishlist.service";

type Item = {
  idDetalle: number;               // ← ID consistente con RN
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

function recalc(bucket: Bucket) {
  bucket.total = bucket.items.reduce((a, b) => a + (b.monto || 0), 0);
}

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

  const idDetalle = Date.now(); // Suficiente para demo (único)
  db[k].items.unshift({
    idDetalle,
    nombre,
    monto: Number(monto) || 0,
    fechaLimite: fechaLimite ?? null,
    descripcion: descripcion ?? null,
  });
  recalc(db[k]);
  save(db);
  return idDetalle;
}

export async function obtenerWishlistConItems(
  idUsuario: number
): Promise<{ wishlist: WishlistRow | null; items: WishlistItemRow[] }> {
  const db = load();
  const k = String(idUsuario);
  const bucket = db[k] ?? { items: [], total: 0 };

  const wl: WishlistRow = { id_wishlist: idUsuario, Total: bucket.total };
  const items: WishlistItemRow[] = bucket.items.map((x) => ({
    id_wishlistDetalle: x.idDetalle,
    Nombre: x.nombre,
    Monto: x.monto,
    FechaLimite: x.fechaLimite ?? null,
    Descripcion: x.descripcion ?? null,
  }));

  return { wishlist: wl, items };
}

/** NUEVO: actualizar (web) */
export async function actualizarDeseo(
  idWishlistDetalle: number,
  nombre: string,
  monto: number,
  fechaLimite?: string | null,
  descripcion?: string | null
): Promise<void> {
  const db = load();
  // Recorre todas las "listas" (por simplicidad)
  for (const k of Object.keys(db)) {
    const bucket = db[k];
    const idx = bucket.items.findIndex(i => i.idDetalle === idWishlistDetalle);
    if (idx >= 0) {
      bucket.items[idx] = {
        ...bucket.items[idx],
        nombre,
        monto: Number(monto) || 0,
        fechaLimite: fechaLimite ?? null,
        descripcion: descripcion ?? null,
      };
      recalc(bucket);
      save(db);
      return;
    }
  }
}

/** NUEVO: eliminar (web) */
export async function eliminarDeseo(idWishlistDetalle: number): Promise<void> {
  const db = load();
  for (const k of Object.keys(db)) {
    const bucket = db[k];
    const lenBefore = bucket.items.length;
    bucket.items = bucket.items.filter(i => i.idDetalle !== idWishlistDetalle);
    if (bucket.items.length !== lenBefore) {
      recalc(bucket);
      save(db);
      return;
    }
  }
}
