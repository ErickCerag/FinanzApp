// Service/DB_Conector.web.ts
export function getDb(): any {
  console.warn("🌐 [DB-Web] Usando fallback sin SQLite (navegador).");
  return {
    transaction(cb: any, onError?: any, onSuccess?: any) {
      try {
        cb({
          executeSql: (_q: string, _a?: any[], ok?: any) =>
            ok && ok({}, { rows: { length: 0, item: () => null, _array: [] } }),
        });
      } catch (e) {
        onError && onError(e);
        return;
      }
      onSuccess && onSuccess();
    },
  };
}
export function initDb(): void {
  console.warn("🌐 [DB-Web] initDb(): no-op (sin SQLite).");
}
