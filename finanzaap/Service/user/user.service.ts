// Service/user/user.service.ts
export type Usuario = {
  id_usuario: number;
  Nombre: string;
  Correo?: string | null;
  Avatar?: string | null;
  Apellido?: string | null;
  FechaNacim?: string | null; // ISO yyyy-MM-dd
  Contra?: string | null;     // (hash en el futuro)
};

export type RegistroPayload = {
  nombre: string;
  apellido: string;
  fechaNac: string; // yyyy-MM-dd
  correo: string;
  contra: string;
};

export async function obtenerUsuario(_id: number): Promise<Usuario | null> {
  throw new Error("[Usuario] Sin implementación de plataforma (native/web).");
}
export async function upsertUsuario(_u: Usuario): Promise<void> {
  throw new Error("[Usuario] Sin implementación de plataforma (native/web).");
}
export async function obtenerUsuarioPorCorreo(_correo: string): Promise<Usuario | null> {
  throw new Error("[Usuario] Sin implementación de plataforma (native/web).");
}
export async function registrarUsuario(_data: RegistroPayload): Promise<number> {
  throw new Error("[Usuario] Sin implementación de plataforma (native/web).");
}

/* === nuevas APIs de sesión === */
export async function iniciarSesion(_u: Usuario): Promise<void> {
  throw new Error("[Usuario] Sin implementación de plataforma (native/web).");
}
export async function obtenerSesion(): Promise<Usuario | null> {
  throw new Error("[Usuario] Sin implementación de plataforma (native/web).");
}
export async function logoutLocal(): Promise<void> {
  throw new Error("[Usuario] Sin implementación de plataforma (native/web).");
}

/* === Helpers de sesión real === */
export async function getRealUserIdFromSession(): Promise<number | null> {
  return null;
}

/* === Debug opcional === */
export async function _debugDumpUsuarios(): Promise<void> {
  // no-op base
}
