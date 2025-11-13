// app/Balance.web.tsx
import React, { useMemo, useState, useCallback } from "react";
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
import BottomNav from "@/components/BarraNav";
import { useRouter, useFocusEffect } from "expo-router";
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

type FilterKey =
  | "all"
  | "incomes"
  | "incomesFixed"
  | "expenses"
  | "expensesFixed";

type Goal = { name: string; progress: number };

export default function BalanceWeb() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterKey>("all");

  const [filters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ins, exps] = await Promise.all([fetchIncomes(), fetchExpenses()]);
      setIncomes(ins);
      setExpenses(exps);

      const u = await obtenerSesion();
      const uid = u?.id_usuario ?? null;

      if (!uid) {
        setGoals([]);
      } else {
        const { items } = await obtenerWishlistConItems(uid);

        const mapped: Goal[] = items.map((it) => {
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
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // FILTRADO IGUAL QUE EN MÓVIL
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

  // 🔥 Título dinámico igual que móvil
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

  const exportPDF = () => {
    alert("PDF generado (mock)");
  };

  const exportXLSX = () => {
    alert("Excel generado (mock)");
  };

  if (loading) {
    return (
      <View>
        <ActivityIndicator size="large" color={PURPLE} />
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

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        {/* 🔥 Filtros igual que móvil */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          {(
            [
              ["Todo", "all"],
              ["Ingresos", "incomes"],
              ["Ingresos fijos", "incomesFixed"],
              ["Gastos", "expenses"],
              ["Gastos fijos", "expensesFixed"],
            ] as const
          ).map(([label, key]) => {
            const active = filter === key;
            return (
              <TouchableOpacity key={key} onPress={() => setFilter(key as FilterKey)}>
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

        {/* 🔥 TARJETA PRINCIPAL */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: GRAY_BORDER,
            padding: 14,
            marginBottom: 20,
          }}
        >
          {/* Título dinámico */}
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

          {/* Lista */}
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

          {/* 🔥 SECCIÓN EXPORTAR — RESTAURADA */}
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
              <Text style={{ color: "#065f46", fontWeight: "700" }}>EXCEL</Text>
            </TouchableOpacity>
          </View>

          {/* Total */}
          <View
            style={{
              marginTop: 12,
              borderTopWidth: 1,
              borderTopColor: GRAY_BORDER,
              paddingTop: 8,
            }}
          >
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ color: "#555" }}>Total</Text>
              <Text style={{ color: "#111", fontWeight: "700" }}>
                {currency(totalFiltered)}
              </Text>
            </View>
          </View>
        </View>

        {/* PROGRESO DE METAS */}
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

      <BottomNav active="balance" />
    </View>
  );
}
