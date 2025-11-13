// Service/wishList/wishlist.service.web.ts
import type { WishlistRow, WishlistItemRow } from "./wishlist.service";

type Item = {
  idDetalle: number;
  nombre: string;
  monto: number;
  fechaLimite?: string | null;
  descripcion?: string | null;

  ahorrado?: number;
  completado?: number; // 0/1
};

type Bucket = { items: Item[]; total: number };
type DB = Record<string, Bucket>;

const KEY = "wishlists_v1";

function load(): DB {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
function save(db: DB) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

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

  const idDetalle = Date.now();
  db[k].items.unshift({
    idDetalle,
    nombre,
    monto: Number(monto) || 0,
    fechaLimite: fechaLimite ?? null,
    descripcion: descripcion ?? null,
    ahorrado: 0,
    completado: 0,
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
    Ahorrado: x.ahorrado ?? 0,
    Completado: x.completado ?? 0,
  }));

  return { wishlist: wl, items };
}

/** Actualizar datos base */
export async function actualizarDeseo(
  idWishlistDetalle: number,
  nombre: string,
  monto: number,
  fechaLimite?: string | null,
  descripcion?: string | null
): Promise<void> {
  const db = load();
  for (const k of Object.keys(db)) {
    const bucket = db[k];
    const idx = bucket.items.findIndex((i) => i.idDetalle === idWishlistDetalle);
    if (idx >= 0) {
      const prev = bucket.items[idx];
      bucket.items[idx] = {
        ...prev,
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

/** NUEVO: actualizar progreso (ahorro + completado) */
export async function actualizarProgresoDeseo(
  idWishlistDetalle: number,
  ahorrado: number,
  completado: number
): Promise<void> {
  const db = load();
  for (const k of Object.keys(db)) {
    const bucket = db[k];
    const idx = bucket.items.findIndex((i) => i.idDetalle === idWishlistDetalle);
    if (idx >= 0) {
      const prev = bucket.items[idx];
      bucket.items[idx] = {
        ...prev,
        ahorrado: Number(ahorrado) || 0,
        completado: completado ? 1 : 0,
      };
      save(db);
      return;
    }
  }
}

/** Eliminar */
export async function eliminarDeseo(idWishlistDetalle: number): Promise<void> {
  const db = load();
  for (const k of Object.keys(db)) {
    const bucket = db[k];
    const lenBefore = bucket.items.length;
    bucket.items = bucket.items.filter((i) => i.idDetalle !== idWishlistDetalle);
    if (bucket.items.length !== lenBefore) {
      recalc(bucket);
      save(db);
      return;
    }
  }
}
