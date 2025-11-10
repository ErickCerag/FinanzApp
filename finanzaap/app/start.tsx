// app/start.tsx
import { useEffect } from "react";
import { useRouter, Href } from "expo-router";
import { initDb } from "@/Service/DB_Conector";
import { obtenerUsuario } from "@/Service/user/user.service";

const MAX_BOOT_MS = 4500; // ~4.5s to decide

export default function Start() {
  const router = useRouter();

  useEffect(() => {
    let alive = true;

    const decide = async () => {
      // Dispara initDb en segundo plano, compatible con void | Promise<void>
      (async () => {
        try { await (initDb as any)(); } catch { /* no-op */ }
      })();

      // Chequeo de sesión (true si hay usuario 1 con correo)
      const checkSession = (async () => {
        try {
          const u = await obtenerUsuario(1);
          return !!(u && u.Correo);
        } catch {
          return false;
        }
      })();

      // Timeout de seguridad
      const timeout = new Promise<boolean>(res =>
        setTimeout(() => res(false), MAX_BOOT_MS)
      );

      const hasSession = await Promise.race([checkSession, timeout]);

      if (!alive) return;
      router.replace((hasSession ? "/(tabs)" : "/login") as Href);
    };

    decide();
    return () => { alive = false; };
  }, [router]);

  return null;
}
