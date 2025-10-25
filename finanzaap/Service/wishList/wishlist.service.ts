// Service/wishlist.service.ts
/**
 * Fallback universal para TypeScript o entornos no nativos/web.
 * 
 * En tiempo de ejecución, Expo elige automáticamente:
 * - wishlist.service.native.ts → Android/iOS (SQLite)
 * - wishlist.service.web.ts → Web (localStorage)
 */
export async function crearWishlistSiNoExiste(_idUsuario: number): Promise<number> {
  throw new Error(
    "[Wishlist] Ninguna implementación de plataforma detectada. " +
      "Asegúrate de tener wishlist.service.native.ts o wishlist.service.web.ts."
  );
}

export async function agregarDeseo(
  _idWishlist: number,
  _nombre: string,
  _monto: number,
  _fechaLimite?: string | null,
  _descripcion?: string | null
): Promise<number> {
  throw new Error(
    "[Wishlist] Ninguna implementación de plataforma detectada. " +
      "Asegúrate de tener wishlist.service.native.ts o wishlist.service.web.ts."
  );
}

export async function obtenerWishlist(_idUsuario: number): Promise<any[]> {
  throw new Error(
    "[Wishlist] Ninguna implementación de plataforma detectada. " +
      "Asegúrate de tener wishlist.service.native.ts o wishlist.service.web.ts."
  );
}
