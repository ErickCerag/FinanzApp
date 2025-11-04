import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
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

// ==== ESTILOS Y HELPERS ====
const PURPLE = "#6B21A8";
const GREEN = "#15803d";
const GRAY_BORDER = "#e5e7eb";

const currency = (v: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(v);

// ==== FUNCIONES LOCALES (mock backend) ====

type Expense = { name: string; amount: number };
type Goal = { name: string; progress: number };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchTopExpensesLocal(): Promise<Expense[]> {
  await wait(500);
  return [
    { name: "Arriendo", amount: 350000 },
    { name: "Alimentación", amount: 100000 },
    { name: "Entretenimiento", amount: 50000 },
    { name: "Transporte", amount: 35000 },
    { name: "Plan teléfono", amount: 15000 },
  ];
}

async function fetchGoalsProgressLocal(): Promise<Goal[]> {
  await wait(500);
  return [
    { name: "Computador nuevo", progress: 100 },
    { name: "Bicicleta", progress: 90 },
    { name: "Entrada concierto", progress: 70 },
  ];
}

async function exportExpensesPDFLocal(_params?: any) {
  await wait(400);
  return { ok: true, url: "/mock/report.pdf" };
}

async function exportExpensesXLSXLocal(_params?: any) {
  await wait(400);
  return { ok: true, url: "/mock/report.xlsx" };
}

// ==== COMPONENTE PRINCIPAL ====

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

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        const [e, g] = await Promise.all([
          fetchTopExpensesLocal(),
          fetchGoalsProgressLocal(),
        ]);
        if (cancel) return;
        setExpenses(e);
        setGoals(g);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los datos.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [filters]);

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

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* ===================== */}
      {/* 🔹 ENCABEZADO MORADO 🔹 */}
      {/* ===================== */}
      <View
        style={{
          backgroundColor: PURPLE,
          paddingTop: insets.top + 10, // respeta notch / barra de estado
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

      {/* ===================== */}
      {/* 🔹 CONTENIDO 🔹 */}
      {/* ===================== */}
      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={{ marginTop: 10, color: "#555" }}>Cargando datos…</Text>
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: "#b91c1c" }}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
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
    </View>
  );
}
