// app/Balance.native.tsx
import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { obtenerSesion } from "@/Service/user/user.service";
import { obtenerWishlistConItems } from "@/Service/wishList/wishlist.service";

const PURPLE = "#6B21A8";
const GREEN = "#15803d";
const GRAY_BORDER = "#e5e7eb";

const currency = (v: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(v);

type Expense = { name: string; amount: number };
type Goal = { name: string; progress: number };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 🔹 Mock de gastos (no lo tocamos aún)
async function fetchTopExpensesLocal(): Promise<Expense[]> {
  await wait(300);
  return [
    { name: "Arriendo", amount: 350000 },
    { name: "Alimentación", amount: 100000 },
  ];
}

async function exportExpensesPDFLocal(_params?: any) {
  await wait(200);
  return { ok: true, url: "/mock/report.pdf" };
}

async function exportExpensesXLSXLocal(_params?: any) {
  await wait(200);
  return { ok: true, url: "/mock/report.xlsx" };
}

export default function BalanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [filters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  // 🔹 Lógica de carga centralizada
  const loadData = useCallback(async () => {
    let cancel = false;

    setLoading(true);
    try {
      // Top gastos
      const [e] = await Promise.all([fetchTopExpensesLocal()]);
      if (cancel) return;
      setExpenses(e);

      // Wishlist → progreso de metas
      const u = await obtenerSesion();
      const uid = u?.id_usuario ?? null;
      if (!uid) {
        setGoals([]);
      } else {
        const { items } = await obtenerWishlistConItems(uid);
        if (cancel) return;

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
      if (!cancel) setLoading(false);
    }

    return () => {
      cancel = true;
    };
  }, []);

  // 🔹 Se ejecuta cada vez que la pantalla gana foco (incluida la primera vez)
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
    }, [loadData, filters])
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((a, b) => a + b.amount, 0),
    [expenses]
  );

  const handleFilter = () => {
    Alert.alert("Filtros", `Mes: ${filters.month} / Año: ${filters.year}`);
  };

  const exportPDF = async () => {
    try {
      const res = await exportExpensesPDFLocal({ filters, expenses });
      if (res.ok) {
        Alert.alert("PDF generado", "Abrir reporte", [
          { text: "Abrir", onPress: () => console.log("open", res.url) },
        ]);
      }
    } catch {
      Alert.alert("Error", "No se pudo exportar a PDF.");
    }
  };

  const exportXLSX = async () => {
    try {
      const res = await exportExpensesXLSXLocal({ filters, expenses });
      if (res.ok) {
        Alert.alert("Excel generado", "Abrir reporte", [
          { text: "Abrir", onPress: () => console.log("open", res.url) },
        ]);
      }
    } catch {
      Alert.alert("Error", "No se pudo exportar a Excel.");
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
          <Text style={{ marginTop: 10, color: "#555" }}>Cargando datos…</Text>
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
          paddingTop: insets.top + 10,
          paddingHorizontal: 16,
          paddingBottom: 18,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
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
          {/* Top 5 Gastos */}
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
                Top 5 gastos del mes
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
              {expenses.map((e) => (
                <View
                  key={e.name}
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
                <Text style={{ color: "#065f46", fontWeight: "700" }}>EXCEL</Text>
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
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#555" }}>Total</Text>
                <Text style={{ color: "#111", fontWeight: "700" }}>
                  {currency(totalExpenses)}
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
