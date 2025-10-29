// Service/wishList/wishlist.service.ts
export type WishlistRow = { id_wishlist: number; Total: number };
export type WishlistItemRow = {
  id_wishlistDetalle: number;
  Nombre: string;
  Monto: number;
  FechaLimite?: string | null;
  Descripcion?: string | null;
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
