// Service/wishList/wishlist.service.ts

export type WishlistRow = { id_wishlist: number; Total: number };

export type WishlistItemRow = {
  id_wishlistDetalle: number; // clave para editar/eliminar
  Nombre: string;
  Monto: number;
  FechaLimite?: string | null;
  Descripcion?: string | null;

  // NUEVO: progreso
  Ahorrado?: number;     // monto ahorrado
  Completado?: number;   // 0 / 1
};

export async function crearWishlistSiNoExiste(_idUsuario: number): Promise<number> {
  throw new Error("[Wishlist] Sin implementación de plataforma (native/web).");
}

export async function agregarDeseo(
  _idWishlist: number,
  _nombre: string,
  _monto: number,
  _fechaLimite?: string | null,
  _descripcion?: string | null
): Promise<number> {
  throw new Error("[Wishlist] Sin implementación de plataforma (native/web).");
}

export async function obtenerWishlistConItems(
  _idUsuario: number
): Promise<{ wishlist: WishlistRow | null; items: WishlistItemRow[] }> {
  throw new Error("[Wishlist] Sin implementación de plataforma (native/web).");
}

/** Actualizar datos base de un deseo (nombre/monto/fecha/descripcion) */
export async function actualizarDeseo(
  _idWishlistDetalle: number,
  _nombre: string,
  _monto: number,
  _fechaLimite?: string | null,
  _descripcion?: string | null
): Promise<void> {
  throw new Error("[Wishlist] Sin implementación de plataforma (native/web).");
}

/** NUEVO: actualizar solo progreso (ahorro + completado) */
export async function actualizarProgresoDeseo(
  _idWishlistDetalle: number,
  _ahorrado: number,
  _completado: number
): Promise<void> {
  throw new Error("[Wishlist] Sin implementación de plataforma (native/web).");
}

/** Eliminar un deseo */
export async function eliminarDeseo(
  _idWishlistDetalle: number
): Promise<void> {
  throw new Error("[Wishlist] Sin implementación de plataforma (native/web).");
}
