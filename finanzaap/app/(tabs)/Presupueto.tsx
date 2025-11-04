import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
  InputAccessoryView,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Plus } from "lucide-react-native";

/* =========================
   Estilos base y helpers
   ========================= */
const PURPLE = "#6B21A8";
const GRAY_BORDER = "#E5E7EB";
const isIOS = Platform.OS === "ios";

const currency = (v: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(v);

const onlyDigits = (s: string) => s.replace(/\D+/g, "");

/* =========================
   Tipos de datos
   ========================= */
type Income = { id: string; name: string; amount: number };
type Expense = { id: string; name: string; amount: number; day: number };

/* =========================
   Funciones locales (mock backend)
   ========================= */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchIncomesLocal(): Promise<Income[]> {
  await wait(300);
  return [{ id: "i-1", name: "Sueldo", amount: 1000000 }];
}

async function fetchExpensesLocal(): Promise<Expense[]> {
  await wait(300);
  return [
    { id: "e-1", name: "Alimentación", amount: 100000, day: 1 },
    { id: "e-2", name: "Arriendo", amount: 350000, day: 5 },
  ];
}

async function addIncomeLocal(item: Omit<Income, "id">): Promise<Income> {
  await wait(250);
  return { ...item, id: `i-${Math.random().toString(36).slice(2, 9)}` };
}

async function addExpenseLocal(item: Omit<Expense, "id">): Promise<Expense> {
  await wait(250);
  return { ...item, id: `e-${Math.random().toString(36).slice(2, 9)}` };
}

/* =========================
   Barra "Listo" para iOS
   ========================= */
function DoneBar({
  nativeID,
  onDone,
}: {
  nativeID: string;
  onDone: () => void;
}) {
  if (!isIOS) return null;
  return (
    <InputAccessoryView nativeID={nativeID}>
      <View style={styles.accessoryBar}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onDone} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.accessoryBtn}>Listo</Text>
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
}

/* =========================
   Componente principal
   ========================= */
export default function BudgetPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Form ingreso
  const [incomeName, setIncomeName] = useState("Sueldo");
  const [incomeAmountRaw, setIncomeAmountRaw] = useState("1000000");

  // Form gasto
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmountRaw, setExpenseAmountRaw] = useState("");
  const [expenseDayRaw, setExpenseDayRaw] = useState("01");

  // refs para blur() cuando se toque "Listo"
  const refIncomeAmount = useRef<TextInput>(null);
  const refExpenseAmount = useRef<TextInput>(null);
  const refExpenseDay = useRef<TextInput>(null);

  useEffect(() => {
    let cancel = false;

    (async () => {
      try {
        setLoading(true);
        const [ins, exps] = await Promise.all([
          fetchIncomesLocal(),
          fetchExpensesLocal(),
        ]);
        if (cancel) return;
        setIncomes(ins);
        setExpenses(exps);
      } catch (e) {
        console.error(e);
        setError("No se pudieron cargar los datos.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, []);

  // 💰 Mi presupuesto = suma total de ingresos
  const totalIncome = useMemo(
    () => incomes.reduce((a, b) => a + b.amount, 0),
    [incomes]
  );

  // 💸 Mis gastos = suma total de gastos
  const totalExpenses = useMemo(
    () => expenses.reduce((a, b) => a + b.amount, 0),
    [expenses]
  );

  const myBudget = totalIncome;

  const handleAddIncome = async () => {
    const amount = Number(onlyDigits(incomeAmountRaw) || "0");
    const name = incomeName.trim();

    if (!name || amount <= 0) {
      Alert.alert("Completa los datos", "Nombre y monto son obligatorios.");
      return;
    }

    try {
      const created = await addIncomeLocal({ name, amount });
      setIncomes((prev) => [created, ...prev]);
      setShowIncomeModal(false);
    } catch {
      Alert.alert("Error", "No se pudo agregar el ingreso.");
    }
  };

  const handleAddExpense = async () => {
    const amount = Number(onlyDigits(expenseAmountRaw) || "0");
    const name = expenseName.trim();
    const day = Number(onlyDigits(expenseDayRaw) || "0");

    if (!name || amount <= 0) {
      Alert.alert("Completa los datos", "Nombre y monto son obligatorios.");
      return;
    }
    if (day < 1 || day > 31) {
      Alert.alert("Día inválido", "El día debe estar entre 1 y 31.");
      return;
    }

    try {
      const created = await addExpenseLocal({ name, amount, day });
      setExpenses((prev) => [created, ...prev]);
      setShowExpenseModal(false);
      setExpenseName("");
      setExpenseAmountRaw("");
      setExpenseDayRaw("01");
    } catch {
      Alert.alert("Error", "No se pudo agregar el gasto.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* ===================== */}
      {/* 🔹 HEADER MORADO SAFE 🔹 */}
      {/* ===================== */}
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
            <ArrowLeft color="#fff" size={22} />
          </TouchableOpacity>
          <Text
            style={{
              color: "#fff",
              fontSize: 25,
              fontWeight: "700",
              marginLeft: 12,
            }}
          >
            Gestionar presupuesto
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={{ marginTop: 10, color: "#555" }}>Cargando…</Text>
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: "#b91c1c" }}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingBottom: (insets.bottom || 0) + 24,
          }}
        >
          {/* Totales */}
          <View style={{ paddingVertical: 18, alignItems: "center" }}>
            <Text style={{ color: "#444", marginBottom: 4 }}>Mi presupuesto</Text>
            <Text style={{ fontSize: 28, fontWeight: "800" }}>
              {currency(myBudget)}
            </Text>

            <Text style={{ color: "#444", marginTop: 10 }}>Mis gastos</Text>
            <Text style={{ fontSize: 28, fontWeight: "800" }}>
              {currency(totalExpenses)}
            </Text>
          </View>

          {/* Ingresos */}
          <View
            style={{
              borderTopWidth: 6,
              borderTopColor: "#F2F2F2",
              borderBottomWidth: 1,
              borderBottomColor: GRAY_BORDER,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ color: PURPLE, fontSize: 20, fontWeight: "700", flex: 1 }}>
                Ingresos
              </Text>
              <TouchableOpacity onPress={() => setShowIncomeModal(true)}>
                <Plus color={PURPLE} size={22} />
              </TouchableOpacity>
            </View>

            {incomes.map((i) => (
              <View
                key={i.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: "#333", fontSize: 16 }}>{i.name}</Text>
                <Text style={{ color: "#111", fontSize: 22, fontWeight: "700" }}>
                  {currency(i.amount)}
                </Text>
              </View>
            ))}
          </View>

          {/* Gastos */}
          <View
            style={{
              borderTopWidth: 6,
              borderTopColor: "#F2F2F2",
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ color: PURPLE, fontSize: 20, fontWeight: "700", flex: 1 }}>
                Gastos
              </Text>
              <TouchableOpacity onPress={() => setShowExpenseModal(true)}>
                <Plus color={PURPLE} size={22} />
              </TouchableOpacity>
            </View>

            {expenses.map((g) => (
              <View
                key={g.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: GRAY_BORDER,
                }}
              >
                <View>
                  <Text style={{ color: "#333", fontSize: 16 }}>{g.name}</Text>
                  <Text style={{ color: "#777", fontSize: 12 }}>
                    Gasto mensual el día {String(g.day).padStart(2, "0")}
                  </Text>
                </View>
                <Text style={{ color: "#111", fontSize: 22, fontWeight: "700" }}>
                  {currency(g.amount)}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Modal: Nuevo ingreso */}
      <Modal
        visible={showIncomeModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowIncomeModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={isIOS ? "padding" : undefined}
            keyboardVerticalOffset={isIOS ? 12 : 0}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Agregar ingreso</Text>

              <Text style={styles.label}>Nombre</Text>
              <TextInput
                value={incomeName}
                onChangeText={setIncomeName}
                placeholder="Ej: Sueldo"
                style={styles.input}
                returnKeyType="next"
                blurOnSubmit
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Monto</Text>
              <TextInput
                ref={refIncomeAmount}
                value={
                  Number(onlyDigits(incomeAmountRaw) || "0") > 0
                    ? currency(Number(onlyDigits(incomeAmountRaw)))
                    : ""
                }
                onChangeText={(t) => setIncomeAmountRaw(onlyDigits(t))}
                placeholder="$ 0"
                keyboardType={isIOS ? "number-pad" : "numeric"}
                style={styles.input}
                inputAccessoryViewID={isIOS ? "acc-income" : undefined}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowIncomeModal(false)}>
                  <Text style={{ color: "#666" }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddIncome}>
                  <Text style={{ color: PURPLE, fontWeight: "700" }}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>

        {/* Barra "Listo" iOS para Monto (Ingreso) */}
        <DoneBar
          nativeID="acc-income"
          onDone={() => {
            refIncomeAmount.current?.blur();
            Keyboard.dismiss();
          }}
        />
      </Modal>

      {/* Modal: Nuevo gasto */}
      <Modal
        visible={showExpenseModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowExpenseModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={isIOS ? "padding" : undefined}
            keyboardVerticalOffset={isIOS ? 12 : 0}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Agregar gasto</Text>

              <Text style={styles.label}>Nombre</Text>
              <TextInput
                value={expenseName}
                onChangeText={setExpenseName}
                placeholder="Ej: Arriendo"
                style={styles.input}
                returnKeyType="next"
                blurOnSubmit
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Monto</Text>
              <TextInput
                ref={refExpenseAmount}
                value={
                  Number(onlyDigits(expenseAmountRaw) || "0") > 0
                    ? currency(Number(onlyDigits(expenseAmountRaw)))
                    : ""
                }
                onChangeText={(t) => setExpenseAmountRaw(onlyDigits(t))}
                placeholder="$ 0"
                keyboardType={isIOS ? "number-pad" : "numeric"}
                style={styles.input}
                inputAccessoryViewID={isIOS ? "acc-expense-amount" : undefined}
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Día del mes (1–31)</Text>
              <TextInput
                ref={refExpenseDay}
                value={expenseDayRaw}
                onChangeText={(t) => setExpenseDayRaw(onlyDigits(t).slice(0, 2))}
                placeholder="01"
                keyboardType={isIOS ? "number-pad" : "numeric"}
                style={styles.input}
                maxLength={2}
                inputAccessoryViewID={isIOS ? "acc-expense-day" : undefined}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowExpenseModal(false)}>
                  <Text style={{ color: "#666" }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddExpense}>
                  <Text style={{ color: PURPLE, fontWeight: "700" }}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>

        {/* Barras "Listo" iOS para Monto y Día */}
        <DoneBar
          nativeID="acc-expense-amount"
          onDone={() => {
            refExpenseAmount.current?.blur();
            Keyboard.dismiss();
          }}
        />
        <DoneBar
          nativeID="acc-expense-day"
          onDone={() => {
            refExpenseDay.current?.blur();
            Keyboard.dismiss();
          }}
        />
      </Modal>
    </View>
  );
}

/* =========================
   Estilos puntuales
   ========================= */
const styles = StyleSheet.create({
  input: {
    borderBottomWidth: 1,
    borderBottomColor: GRAY_BORDER,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  label: {
    color: PURPLE,
    fontWeight: "700",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  accessoryBar: {
    backgroundColor: "#F6F6F8",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#D1D5DB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  accessoryBtn: {
    color: PURPLE,
    fontWeight: "700",
    fontSize: 16,
  },
});
