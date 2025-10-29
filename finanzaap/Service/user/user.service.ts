// Service/user/user.service.ts
export type Usuario = {
  id_usuario: number;
  Nombre: string;
  Telefono: string | null;
  Correo: string | null;
};

export async function obtenerUsuario(_id: number): Promise<Usuario | null> {
  throw new Error("[Usuario] Sin implementación de plataforma (native/web).");
}

export async function upsertUsuario(_u: Usuario): Promise<void> {
  throw new Error("[Usuario] Sin implementación de plataforma (native/web).");
}
