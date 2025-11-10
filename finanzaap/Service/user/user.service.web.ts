// Service/user/user.service.web.ts
import type { Usuario, RegistroPayload } from "./user.service";

const USERS_KEY = "usuarios_v1";
const SESSION_KEY = "session_user_id_v1";

function readUsers(): Usuario[] {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(USERS_KEY) : null;
    return raw ? (JSON.parse(raw) as Usuario[]) : [];
  } catch { return []; }
}
function writeUsers(list: Usuario[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(USERS_KEY, JSON.stringify(list));
}
function readSessionId(): number | null {
  try {
    const v = typeof localStorage !== "undefined" ? localStorage.getItem(SESSION_KEY) : null;
    return v ? Number(v) : null;
  } catch { return null; }
}
function writeSessionId(id: number | null) {
  if (typeof localStorage === "undefined") return;
  if (id == null) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, String(id));
}
function nextId(list: Usuario[]) {
  return (list.reduce((m, x) => Math.max(m, x.id_usuario ?? 0), 0) || 0) + 1;
}
const norm = (s?: string | null) => (s ?? "").normalize("NFKC").trim();

if (typeof window !== "undefined") {
  console.log("%c[UsuarioService] WEB impl cargada (usuarios + sesión)", "color:#6B21A8;font-weight:bold");
  (window as any).finUser = {
    dump() { console.log("[finUser.dump] users:", readUsers(), "sessionId:", readSessionId()); },
    clearAll() {
      localStorage.removeItem(USERS_KEY);
      localStorage.removeItem(SESSION_KEY);
      console.log("[finUser.clearAll] done");
    }
  };
}

export async function obtenerUsuario(id: number): Promise<Usuario | null> {
  const users = readUsers();
  if (id === 1) {
    const sid = readSessionId();
    if (sid == null) return null;
    return users.find(u => u.id_usuario === sid) ?? null;
  }
  return users.find(u => u.id_usuario === id) ?? null;
}
export async function upsertUsuario(u: Usuario): Promise<void> {
  const users = readUsers();
  const idx = users.findIndex(x => x.id_usuario === u.id_usuario);
  if (idx === -1) return;
  const curr = users[idx];
  users[idx] = {
    id_usuario: u.id_usuario,
    Nombre: u.Nombre ?? curr.Nombre,
    Correo: u.Correo ?? curr.Correo,
    Avatar: (u as any).Avatar ?? curr.Avatar ?? null,
    Apellido: (u as any).Apellido ?? (curr as any)?.Apellido ?? null,
    FechaNacim: (u as any).FechaNacim ?? (curr as any)?.FechaNacim ?? null,
    Contra: u.Contra ?? curr.Contra ?? null,
  };
  writeUsers(users);
}
export async function obtenerUsuarioPorCorreo(correo: string): Promise<Usuario | null> {
  const users = readUsers();
  const wanted = norm(correo).toLowerCase();
  const found = users.find(u => (norm(u.Correo).toLowerCase() === wanted));
  if (typeof window !== "undefined") console.log("[UsuarioService.web.getByCorreo]", { wanted, found });
  return found ?? null;
}
export async function registrarUsuario(data: RegistroPayload): Promise<number> {
  const users = readUsers();
  const id = nextId(users);
  const u: Usuario = {
    id_usuario: id,
    Nombre: data.nombre,
    Apellido: data.apellido,
    FechaNacim: data.fechaNac,
    Correo: data.correo.trim().toLowerCase(),
    Contra: data.contra,
    Avatar: null,
  };
  users.push(u);
  writeUsers(users);
  if (typeof window !== "undefined") console.log("[UsuarioService.web.register] saved:", u);
  return id;
}
export async function iniciarSesion(u: Usuario): Promise<void> { writeSessionId(u.id_usuario); }
export async function obtenerSesion(): Promise<Usuario | null> {
  const users = readUsers();
  const sid = readSessionId();
  if (sid == null) return null;
  return users.find(u => u.id_usuario === sid) ?? null;
}
export async function logoutLocal(): Promise<void> {
  writeSessionId(null);
  if (typeof window !== "undefined") console.log("[UsuarioService.web.logout] removed");
}
export async function getRealUserIdFromSession(): Promise<number | null> {
  return readSessionId();
}
export async function _debugDumpUsuarios(): Promise<void> {
  if (typeof window !== "undefined") {
    console.log("[DEBUG Usuarios][web] no-op. Usa window.finUser.dump() para ver localStorage.");
  }
}
