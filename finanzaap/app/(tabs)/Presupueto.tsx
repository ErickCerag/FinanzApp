// app/(tabs)/Presupuesto.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal,
  TextInput, Alert, Platform, StyleSheet, KeyboardAvoidingView, InputAccessoryView, Keyboard
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Plus, MoreHorizontal } from "lucide-react-native";

import {
  fetchIncomes, fetchExpenses,
  addIncome, addExpense,
  updateIncome, updateExpense,
  deleteIncome, deleteExpense,
  type Income, type Expense
} from "@/Service/budget/budget.service";

/* ======== Constantes/Helpers UI ======== */
const PURPLE = "#6B21A8";
const GRAY_BORDER = "#E5E7EB";
const isIOS = Platform.OS === "ios";
const isWeb = Platform.OS === "web";

const currency = (v: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(v);
const onlyDigits = (s: string) => s.replace(/\D+/g, "");

/* ======== DoneBar iOS ======== */
function DoneBar({ nativeID, onDone }: { nativeID: string; onDone: () => void }) {
  if (!isIOS) return null;
  return (
    <InputAccessoryView nativeID={nativeID}>
      <View style={styles.accessoryBar}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onDone}><Text style={styles.accessoryBtn}>Listo</Text></TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
}

/* ======== Componente Modal Unificado ======== */
function BudgetModal({
  visible,
  onClose,
  type,
  editingItem,
  onSubmit
}: {
  visible: boolean;
  onClose: () => void;
  type: "income" | "expense";
  editingItem: Income | Expense | null;
  onSubmit: (data: { name: string; amount: number; day?: number }) => void;
}) {
  const isEditing = !!editingItem;
  
  // Estados del formulario
  const [name, setName] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [dayRaw, setDayRaw] = useState("01");

  // Refs para inputs
  const refAmount = useRef<TextInput>(null);
  const refDay = useRef<TextInput>(null);

  // Resetear formulario cuando se abre/cierra el modal
  useEffect(() => {
    if (visible) {
      if (isEditing && editingItem) {
        setName(editingItem.name);
        setAmountRaw(String(editingItem.amount));
        if (type === "expense") {
          setDayRaw(String((editingItem as Expense).day).padStart(2, "0"));
        }
      } else {
        // Valores por defecto para nuevo item
        setName(type === "income" ? "Sueldo" : "");
        setAmountRaw("");
        setDayRaw("01");
      }
    }
  }, [visible, isEditing, editingItem, type]);

  const handleSubmit = () => {
    const amount = Number(onlyDigits(amountRaw) || "0");
    const trimmedName = name.trim();

    if (!trimmedName || amount <= 0) {
      Alert.alert("Completa los datos", "Nombre y monto son obligatorios.");
      return;
    }

    if (type === "expense") {
      const day = Number(onlyDigits(dayRaw) || "0");
      if (day < 1 || day > 31) {
        Alert.alert("Día inválido", "El día debe estar entre 1 y 31.");
        return;
      }
      onSubmit({ name: trimmedName, amount, day });
    } else {
      onSubmit({ name: trimmedName, amount });
    }
  };

  const modalTitle = isEditing 
    ? `Editar ${type === "income" ? "ingreso" : "gasto"}`
    : `Agregar ${type === "income" ? "ingreso" : "gasto"}`;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView behavior={isIOS ? "padding" : undefined} keyboardVerticalOffset={isIOS ? 12 : 0}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>

            {/* Nombre */}
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={type === "income" ? "Ej: Sueldo" : "Ej: Arriendo"}
              style={styles.input}
              returnKeyType="next"
              blurOnSubmit
            />

            {/* Monto */}
            <Text style={[styles.label, { marginTop: 12 }]}>Monto</Text>
            <TextInput
              ref={refAmount}
              value={Number(onlyDigits(amountRaw) || "0") > 0 ? currency(Number(onlyDigits(amountRaw))) : ""}
              onChangeText={(t) => setAmountRaw(onlyDigits(t))}
              placeholder="$ 0"
              keyboardType={isIOS ? "number-pad" : "numeric"}
              style={styles.input}
              inputAccessoryViewID={isIOS ? `acc-${type}-amount` : undefined}
            />

            {/* Día (solo para gastos) */}
            {type === "expense" && (
              <>
                <Text style={[styles.label, { marginTop: 12 }]}>Día del mes (1–31)</Text>
                <TextInput
                  ref={refDay}
                  value={dayRaw}
                  onChangeText={(t) => setDayRaw(onlyDigits(t).slice(0, 2))}
                  placeholder="01"
                  maxLength={2}
                  keyboardType={isIOS ? "number-pad" : "numeric"}
                  style={styles.input}
                  inputAccessoryViewID={isIOS ? `acc-${type}-day` : undefined}
                />
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: "#666" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSubmit}>
                <Text style={{ color: PURPLE, fontWeight: "700" }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* DoneBars para iOS */}
      <DoneBar nativeID={`acc-${type}-amount`} onDone={() => { refAmount.current?.blur(); Keyboard.dismiss(); }} />
      {type === "expense" && (
        <DoneBar nativeID={`acc-${type}-day`} onDone={() => { refDay.current?.blur(); Keyboard.dismiss(); }} />
      )}
    </Modal>
  );
}

/* ======== Componente Principal ======== */
export default function BudgetPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Estado unificado para el modal
  const [modalState, setModalState] = useState<{
    visible: boolean;
    type: "income" | "expense";
    editingItem: Income | Expense | null;
  }>({
    visible: false,
    type: "income",
    editingItem: null
  });

  // Web: menú "..." anclado
  const [menu, setMenu] = useState<{ type: "income" | "expense"; id: number; x: number; y: number } | null>(null);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [ins, exps] = await Promise.all([fetchIncomes(), fetchExpenses()]);
      setIncomes(ins);
      setExpenses(exps);
      setError(null);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /* ======== Totales ======== */
  const totalIncome = useMemo(() => incomes.reduce((a, b) => a + b.amount, 0), [incomes]);
  const totalExpenses = useMemo(() => expenses.reduce((a, b) => a + b.amount, 0), [expenses]);

  /* ======== Handlers Modal ======== */
  const openAddModal = (type: "income" | "expense") => {
    setModalState({
      visible: true,
      type,
      editingItem: null
    });
  };

  const openEditModal = (type: "income" | "expense", item: Income | Expense) => {
    setModalState({
      visible: true,
      type,
      editingItem: item
    });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, visible: false }));
  };

  const handleModalSubmit = async (data: { name: string; amount: number; day?: number }) => {
    const { type, editingItem } = modalState;
    const isEditing = !!editingItem;

    try {
      if (isEditing) {
        // Editar item existente
        if (type === "income") {
          const updated = await updateIncome({ id: editingItem!.id, ...data });
          setIncomes(prev => prev.map(i => i.id === updated.id ? updated : i));
        } else {
          const updated = await updateExpense({ id: editingItem!.id, ...data, day: data.day! });
          setExpenses(prev => prev.map(i => i.id === updated.id ? updated : i));
        }
      } else {
        // Agregar nuevo item
        if (type === "income") {
          const created = await addIncome(data);
          setIncomes(prev => [created, ...prev]);
        } else {
          const created = await addExpense({ ...data, day: data.day! });
          setExpenses(prev => [created, ...prev]);
        }
      }
      closeModal();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", `No se pudo ${isEditing ? "actualizar" : "agregar"} el ${type === "income" ? "ingreso" : "gasto"}.`);
    }
  };

  /* ======== Handlers: Borrar ======== */
  const confirmDelete = (type: "income" | "expense", id: number, name: string) => {
    const run = async () => {
      try {
        if (type === "income") {
          await deleteIncome(id);
          setIncomes(prev => prev.filter(i => i.id !== id));
        } else {
          await deleteExpense(id);
          setExpenses(prev => prev.filter(i => i.id !== id));
        }
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "No se pudo eliminar.");
      }
    };

    if (isWeb) {
      if (window.confirm(`¿Eliminar "${name}"?`)) run();
    } else {
      Alert.alert("Eliminar", `¿Eliminar "${name}"?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: run }
      ]);
    }
  };

  /* ======== Render ======== */
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={PURPLE} />
        <Text style={{ marginTop: 10, color: "#555" }}>Cargando…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header morado */}
      <View style={{
        backgroundColor: PURPLE,
        paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: 18,
        borderBottomLeftRadius: 12, borderBottomRightRadius: 12, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, elevation: 2
      }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ padding: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.1)" }}>
            <ArrowLeft color="#fff" size={22} />
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontSize: 25, fontWeight: "700", marginLeft: 12 }}>Gestionar presupuesto</Text>
        </View>
      </View>

      {error ? (
        <View style={{ padding: 16 }}><Text style={{ color: "#b91c1c" }}>{error}</Text></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: (insets.bottom || 0) + 24 }}>
          {/* Totales */}
          <View style={{ paddingVertical: 18, alignItems: "center" }}>
            <Text style={{ color: "#444", marginBottom: 4 }}>Mi presupuesto</Text>
            <Text style={{ fontSize: 28, fontWeight: "800" }}>{currency(totalIncome)}</Text>
            <Text style={{ color: "#444", marginTop: 10 }}>Mis gastos</Text>
            <Text style={{ fontSize: 28, fontWeight: "800" }}>{currency(totalExpenses)}</Text>
          </View>

          {/* Ingresos */}
          <View style={{ borderTopWidth: 6, borderTopColor: "#F2F2F2", borderBottomWidth: 1, borderBottomColor: GRAY_BORDER, paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ color: PURPLE, fontSize: 20, fontWeight: "700", flex: 1 }}>Ingresos</Text>
              <TouchableOpacity onPress={() => openAddModal("income")}>
                <Plus color={PURPLE} size={22} />
              </TouchableOpacity>
            </View>

            {incomes.map((i) => (
              <View key={i.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, alignItems: "center" }}>
                <Text style={{ color: "#333", fontSize: 16 }}>{i.name}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ color: "#111", fontSize: 22, fontWeight: "700" }}>{currency(i.amount)}</Text>
                  <TouchableOpacity
                    onPress={(ev: any) => {
                      if (isWeb) {
                        const rect = ev?.target?.getBoundingClientRect?.();
                        setMenu({ type: "income", id: i.id, x: rect ? rect.left : 0, y: rect ? rect.bottom : 0 });
                      } else {
                        Alert.alert("Opciones", i.name, [
                          { text: "Editar", onPress: () => openEditModal("income", i) },
                          { text: "Eliminar", style: "destructive", onPress: () => confirmDelete("income", i.id, i.name) },
                          { text: "Cancelar", style: "cancel" }
                        ]);
                      }
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MoreHorizontal size={20} color="#444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Gastos */}
          <View style={{ borderTopWidth: 6, borderTopColor: "#F2F2F2", paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ color: PURPLE, fontSize: 20, fontWeight: "700", flex: 1 }}>Gastos</Text>
              <TouchableOpacity onPress={() => openAddModal("expense")}>
                <Plus color={PURPLE} size={22} />
              </TouchableOpacity>
            </View>

            {expenses.map((g) => (
              <View key={g.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: GRAY_BORDER, alignItems: "center" }}>
                <View>
                  <Text style={{ color: "#333", fontSize: 16 }}>{g.name}</Text>
                  <Text style={{ color: "#777", fontSize: 12 }}>Gasto mensual el día {String(g.day).padStart(2, "0")}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ color: "#111", fontSize: 22, fontWeight: "700" }}>{currency(g.amount)}</Text>
                  <TouchableOpacity
                    onPress={(ev: any) => {
                      if (isWeb) {
                        const rect = ev?.target?.getBoundingClientRect?.();
                        setMenu({ type: "expense", id: g.id, x: rect ? rect.left : 0, y: rect ? rect.bottom : 0 });
                      } else {
                        Alert.alert("Opciones", g.name, [
                          { text: "Editar", onPress: () => openEditModal("expense", g) },
                          { text: "Eliminar", style: "destructive", onPress: () => confirmDelete("expense", g.id, g.name) },
                          { text: "Cancelar", style: "cancel" }
                        ]);
                      }
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MoreHorizontal size={20} color="#444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ===== Web Menu ===== */}
      {isWeb && menu && (
        <>
          <View
            style={{
              position: "fixed" as any,
              inset: 0,
              backgroundColor: "transparent",
              zIndex: 9998,
            }}
            onStartShouldSetResponder={() => true}
            onResponderRelease={() => setMenu(null)}
          />

          <View
            style={{
              position: "fixed" as any,
              left: menu.x - 140,
              top: menu.y + 6,
              zIndex: 9999,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)" as any,
            }}
            onStartShouldSetResponder={() => true}
          >
            <TouchableOpacity
              style={{ padding: 12, minWidth: 140 }}
              onPress={() => {
                const list = menu.type === "income" ? incomes : expenses;
                const found = list.find((x) => x.id === menu.id);
                if (found) openEditModal(menu.type, found as any);
                setMenu(null);
              }}
            >
              <Text>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ padding: 12 }}
              onPress={() => {
                const list = menu.type === "income" ? incomes : expenses;
                const found = list.find((x) => x.id === menu.id);
                if (found) confirmDelete(menu.type, menu.id, found.name);
                setMenu(null);
              }}
            >
              <Text style={{ color: "#b91c1c" }}>Eliminar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ padding: 12 }}
              onPress={() => setMenu(null)}
            >
              <Text>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ===== Modal Unificado ===== */}
      <BudgetModal
        visible={modalState.visible}
        onClose={closeModal}
        type={modalState.type}
        editingItem={modalState.editingItem}
        onSubmit={handleModalSubmit}
      />
    </View>
  );
}

/* ======== Estilos ======== */
const styles = StyleSheet.create({
  input: {
    borderBottomWidth: 1, borderBottomColor: GRAY_BORDER, paddingVertical: 10, fontSize: 16, color: "#111827",
  },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  label: { color: PURPLE, fontWeight: "700" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 16 },
  accessoryBar: {
    backgroundColor: "#F6F6F8", borderTopWidth: StyleSheet.hairlineWidth, borderColor: "#D1D5DB",
    paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center",
  },
  accessoryBtn: { color: PURPLE, fontWeight: "700", fontSize: 16 },
});