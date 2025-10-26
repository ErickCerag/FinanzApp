// Service/DB_Conector.web.ts
// Fallback para web: no importa expo-sqlite (evita wa-sqlite.wasm).
export function getDb(): any {
  console.warn("[DB web] Usando fallback sin SQLite.");
  return {
    transaction(cb: any, onError?: any, onSuccess?: any) {
      try {
        cb({
          executeSql: (_q: string, _a?: any[], ok?: any) => {
            ok && ok({}, { rows: { length: 0, item: () => null, _array: [] } });
          },
        });
      } catch (e) {
        onError && onError(e);
        return;
      }
      onSuccess && onSuccess();
    },
  };
}

export async function initDb(): Promise<void> {
  console.warn("[DB web] initDb(): no-op (sin SQLite).");
}
