// Service/wishlist.service.web.ts
type Item = {
  id: string;
  nombre: string;
  monto: number;
  fechaLimite?: string | null;
  descripcion?: string | null;
};
const KEY = "wishlists_v1"; // { [usuarioId]: { items: Item[], total: number } }

function load(): Record<string, { items: Item[]; total: number }> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function save(db: Record<string, { items: Item[]; total: number }>) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

// 📋 Obtener deseos desde localStorage
export async function obtenerWishlist(idUsuario: number): Promise<any[]> {
  console.log("💻 [Wishlist-Web] Cargando deseos desde localStorage...");
  const db = load();
  const k = String(idUsuario);
  const items = db[k]?.items ?? [];
  console.log(`✅ [Wishlist-Web] ${items.length} deseos obtenidos`);
  // Ajustamos estructura para que coincida con la del móvil
  return items.map((x) => ({
    id: x.id,
    name: x.nombre,
    price: x.monto,
    savedGap: 0,
    done: false,
    note: "",
  }));
}


export async function crearWishlistSiNoExiste(idUsuario: number): Promise<number> {
  console.log("📦 [Wishlist-Web] Verificando wishlist para usuario:", idUsuario);
  const db = load();
  const k = String(idUsuario);
  if (!db[k]) {
    console.log("🆕 [Wishlist-Web] No existe. Creando…");
    db[k] = { items: [], total: 0 };
    save(db);
  } else {
    console.log("✅ [Wishlist-Web] Ya existe.");
  }
  return idUsuario; // usamos idUsuario como idWishlist en web
}

export async function agregarDeseo(
  idWishlist: number,
  nombre: string,
  monto: number,
  fechaLimite?: string | null,
  descripcion?: string | null
): Promise<number> {
  console.log("➕ [Wishlist-Web] Agregando deseo:", { idWishlist, nombre, monto, fechaLimite, descripcion });
  const db = load();
  const k = String(idWishlist);
  if (!db[k]) db[k] = { items: [], total: 0 };

  const id = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
  db[k].items.unshift({
    id,
    nombre,
    monto: Number(monto) || 0,
    fechaLimite: fechaLimite ?? null,
    descripcion: descripcion ?? null
  });
  db[k].total = db[k].items.reduce((a, b) => a + (b.monto || 0), 0);
  save(db);

  console.log("✅ [Wishlist-Web] Guardado. Total:", db[k].total, "Items:", db[k].items.length);
  return Date.now();
}
