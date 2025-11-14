// app/(tabs)/Balance.web.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {
  ArrowLeft,
  Filter,
  FileDown,
  FileSpreadsheet,
  TrendingUp,
  PieChart,
  BarChart3,
} from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";

import BottomNav from "@/components/BarraNav";
import { obtenerSesion } from "@/Service/user/user.service";
import { obtenerWishlistConItems } from "@/Service/wishList/wishlist.service";
import {
  fetchIncomes,
  fetchExpenses,
  type Income,
  type Expense,
} from "@/Service/budget/budget.service";

const PURPLE = "#6B21A8";
const GREEN = "#15803d";
const GRAY_BORDER = "#e5e7eb";

const currency = (v: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(v);

type Goal = { name: string; progress: number };

type FilterKey =
  | "all"
  | "incomes"
  | "incomesFixed"
  | "expenses"
  | "expensesFixed";

const FILTER_KEY = "balance_filter_web_v1";

export default function BalanceWeb() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const [filter, setFilter] = useState<FilterKey>("all");

  const [filters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  // === Cargar filtro guardado en localStorage (solo UX) ===
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(FILTER_KEY) as FilterKey | null;
      if (
        saved === "all" ||
        saved === "incomes" ||
        saved === "incomesFixed" ||
        saved === "expenses" ||
        saved === "expensesFixed"
      ) {
        setFilter(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const saveFilter = useCallback((value: FilterKey) => {
    setFilter(value);
    try {
      window.localStorage.setItem(FILTER_KEY, value);
    } catch {
      /* ignore */
    }
  }, []);

  // === Cargar datos (presupuesto + wishlist) ===
  const loadData = useCallback(async () => {
    let cancel = false;

    setLoading(true);
    try {
      const [ins, exps] = await Promise.all([fetchIncomes(), fetchExpenses()]);
      if (cancel) return;
      setIncomes(ins);
      setExpenses(exps);

      const u = await obtenerSesion();
      const uid = u?.id_usuario ?? null;
      if (!uid) {
        setGoals([]);
      } else {
        const { items } = await obtenerWishlistConItems(uid);
        if (cancel) return;

        const mapped: Goal[] = items.map((it: any) => {
          const total = Number(it.Monto || 0);
          const saved = Number(it.Ahorrado || 0);
          const completed = (it.Completado ?? 0) === 1;

          let progress = 0;
          if (total > 0) {
            progress = Math.round(
              Math.min(100, (Math.max(saved, 0) / total) * 100)
            );
          }
          if (completed) progress = 100;
          return { name: it.Nombre, progress };
        });

        setGoals(mapped);
      }

      setError(null);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los datos.");
    } finally {
      if (!cancel) setLoading(false);
    }

    return () => {
      cancel = true;
    };
  }, []);

  // Igual que en native: recarga al enfocarse la vista
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (!active) return;
        await loadData();
      })();
      return () => {
        active = false;
      };
    }, [loadData])
  );

  // === Dataset según filtro ===
  const filteredRows = useMemo(() => {
    const incomeRows = incomes.map((i) => ({
      id: `inc-${i.id}`,
      name: i.name,
      amount: i.amount,
      kind: "income" as const,
      isFixed: !!i.isFixed,
    }));
    const expenseRows = expenses.map((e) => ({
      id: `exp-${e.id}`,
      name: e.name,
      amount: e.amount,
      kind: "expense" as const,
      isFixed: !!e.isFixed,
    }));

    switch (filter) {
      case "incomes":
        return incomeRows.filter((r) => !r.isFixed);
      case "incomesFixed":
        return incomeRows.filter((r) => r.isFixed);
      case "expenses":
        return expenseRows.filter((r) => !r.isFixed);
      case "expensesFixed":
        return expenseRows.filter((r) => r.isFixed);
      default:
        return [...incomeRows, ...expenseRows];
    }
  }, [incomes, expenses, filter]);

  const totalFiltered = useMemo(
    () => filteredRows.reduce((a, b) => a + b.amount, 0),
    [filteredRows]
  );

  // Título dinámico (igual que en native)
  const filterTitle = useMemo(() => {
    switch (filter) {
      case "incomes":
        return "Top ingresos del mes";
      case "incomesFixed":
        return "Top ingresos fijos del mes";
      case "expenses":
        return "Top gastos del mes";
      case "expensesFixed":
        return "Top gastos fijos del mes";
      default:
        return "Top movimientos del mes";
    }
  }, [filter]);

  const handleFilter = () => {
    alert(`Mes: ${filters.month} / Año: ${filters.year}`);
  };

  // ===== Exportar a "PDF" en web (abrir ventana y mandar a imprimir) =====
  const exportPDF = async () => {
    try {
      const { month, year } = filters;
      const monthStr = String(month).padStart(2, "0");

      const rowsHtml = filteredRows
        .map((r) => {
          const tipo = r.kind === "income" ? "Ingreso" : "Gasto";
          const categoria = r.isFixed ? "Fijo" : "Variable";
          return `<tr>
            <td>${tipo}</td>
            <td>${categoria}</td>
            <td>${r.name}</td>
            <td style="text-align:right;">${currency(r.amount)}</td>
          </tr>`;
        })
        .join("");

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Balance FinanzApp</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; padding: 16px; }
              h1 { font-size: 20px; margin-bottom: 4px; }
              h2 { font-size: 14px; margin-top: 0; color: #555; }
              table { width: 100%; border-collapse: collapse; margin-top: 12px; }
              th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; }
              th { background: #f3f4f6; text-align: left; }
            </style>
          </head>
          <body>
            <h1>Balance FinanzApp</h1>
            <h2>Mes ${monthStr} / ${year}</h2>
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Categoría</th>
                  <th>Nombre</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const win = window.open("", "_blank");
      if (!win) {
        alert("No se pudo abrir la ventana para el PDF.");
        return;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    } catch (e) {
      console.error(e);
      alert("No se pudo exportar a PDF.");
    }
  };

  // ===== Exportar a CSV (Excel lo abre) =====
  const exportXLSX = async () => {
    try {
      const { month, year } = filters;
      const monthStr = String(month).padStart(2, "0");

      let csv = `Balance FinanzApp;${monthStr}/${year}\n\n`;
      csv += "Tipo;Categoría;Nombre;Monto\n";

      filteredRows.forEach((r) => {
        const tipo = r.kind === "income" ? "Ingreso" : "Gasto";
        const categoria = r.isFixed ? "Fijo" : "Variable";
        csv += `${tipo};${categoria};${r.name};${r.amount}\n`;
      });

      const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `balance-${year}-${monthStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("No se pudo exportar a Excel.");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={{ marginTop: 10, color: "#555" }}>
            Cargando datos…
          </Text>
        </View>
        <BottomNav active="balance" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* HEADER */}
      <View
        style={{
          backgroundColor: PURPLE,
          paddingTop: 10,
          paddingHorizontal: 16,
          paddingBottom: 18,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              padding: 4,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.1)",
            }}
          >
            <ArrowLeft color="#fff" size={26} />
          </TouchableOpacity>

          <Text
            style={{
              color: "#fff",
              fontSize: 22,
              fontWeight: "700",
              marginLeft: 12,
            }}
          >
            Balance
          </Text>
        </View>
      </View>

      {error ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: "#b91c1c" }}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
          {/* Fila de filtros / categorías (igual que en native) */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            {(
              [
                ["todo", "all"],
                ["ingresos", "incomes"],
                ["ingresos fijos", "incomesFixed"],
                ["gastos", "expenses"],
                ["gastos fijos", "expensesFixed"],
              ] as const
            ).map(([label, key]) => {
              const active = filter === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => saveFilter(key as FilterKey)}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: active ? "700" : "400",
                      color: active ? PURPLE : "#111",
                    }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Top movimientos del mes */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: GRAY_BORDER,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
            >
              <Text
                style={{
                  color: PURPLE,
                  fontSize: 18,
                  fontWeight: "700",
                  flex: 1,
                }}
              >
                {filterTitle}
              </Text>
              <TouchableOpacity
                onPress={handleFilter}
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text style={{ color: "#555", fontWeight: "600" }}>Filtrar</Text>
                <Filter size={18} color="#111" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 6 }}>
              {filteredRows.map((e) => (
                <View
                  key={e.id}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: "#111", fontSize: 16 }}>{e.name}</Text>
                  <Text
                    style={{ color: "#111", fontSize: 16, fontWeight: "600" }}
                  >
                    {currency(e.amount)}
                  </Text>
                </View>
              ))}
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 12,
                gap: 12,
              }}
            >
              <Text style={{ color: PURPLE, fontWeight: "600" }}>
                Exportar datos :
              </Text>
              <TouchableOpacity
                onPress={exportPDF}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderWidth: 1,
                  borderColor: GRAY_BORDER,
                  borderRadius: 8,
                }}
              >
                <FileDown size={18} color="#b91c1c" />
                <Text style={{ color: "#b91c1c", fontWeight: "700" }}>PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={exportXLSX}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderWidth: 1,
                  borderColor: GRAY_BORDER,
                  borderRadius: 8,
                }}
              >
                <FileSpreadsheet size={18} color="#065f46" />
                <Text style={{ color: "#065f46", fontWeight: "700" }}>
                  EXCEL
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                marginTop: 10,
                borderTopWidth: 1,
                borderTopColor: GRAY_BORDER,
                paddingTop: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: "#555" }}>Total</Text>
                <Text style={{ color: "#111", fontWeight: "700" }}>
                  {currency(totalFiltered)}
                </Text>
              </View>
            </View>
          </View>

          {/* Progreso de metas */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: GRAY_BORDER,
              padding: 14,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
                gap: 8,
              }}
            >
              <Text
                style={{
                  color: PURPLE,
                  fontSize: 18,
                  fontWeight: "700",
                  flex: 1,
                }}
              >
                Progreso de metas
              </Text>
              <TrendingUp size={18} color="#111" />
              <PieChart size={18} color="#111" />
              <BarChart3 size={18} color="#111" />
            </View>

            <View style={{ gap: 14 }}>
              {goals.map((g) => (
                <View key={g.name}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ color: "#111" }}>{g.name}</Text>
                    <Text style={{ color: "#111", fontWeight: "600" }}>
                      {g.progress} %
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 8,
                      backgroundColor: "#f3f4f6",
                      borderRadius: 999,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                    }}
                  >
                    <View
                      style={{
                        width: `${g.progress}%`,
                        height: "100%",
                        backgroundColor:
                          g.progress >= 100 ? GREEN : "#22c55e",
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      <BottomNav active="balance" />
    </View>
  );
}
