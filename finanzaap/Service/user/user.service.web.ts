// Service/user/user.service.web.ts
import type { Usuario } from "./user.service";

const KEY = "usuario_v1"; // almacena un único usuario (id=1) en localStorage

export async function obtenerUsuario(id: number): Promise<Usuario | null> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as Usuario;
    return u && u.id_usuario === id ? u : null;
  } catch {
    return null;
  }
}

export async function upsertUsuario(u: Usuario): Promise<void> {
  localStorage.setItem(KEY, JSON.stringify(u));
}
