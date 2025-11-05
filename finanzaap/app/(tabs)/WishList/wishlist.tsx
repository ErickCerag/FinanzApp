import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  InputAccessoryView,
  Keyboard,
  Platform,
  StyleSheet,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  obtenerWishlistConItems,
  actualizarDeseo,
  eliminarDeseo,
} from "@/Service/wishList/wishlist.service"; // ← resolverá .native / .web automáticamente
import { Plus, CheckSquare, Square, ArrowLeft, MoreHorizontal } from "lucide-react-native";
import BottomNav from "@/components/BarraNav";

/* =========================
   Constantes / helpers
   ========================= */
const PURPLE = "#6B21A8";
const GRAY_BG = "#f4f4f5";
const GRAY_BORDER = "#E5E7EB";
const isIOS = Platform.OS === "ios";

const onlyDigits = (s: string) => s.replace(/\D+/g, "");
const currency = (v: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(v);

/* =========================
   Tipos locales
   ========================= */
type UIItem = {
  id: number;
  name: string;
  price: number;
  done: boolean;
};

/* =========================
   Barra “Listo” iOS
   ========================= */
function DoneBar({ nativeID, onDone }: { nativeID: string; onDone: () => void }) {
  if (!isIOS) return null;
  return (
    <InputAccessoryView nativeID={nativeID}>
      <View style={styles.accessoryBar}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={onDone}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.accessoryBtn}>Listo</Text>
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
}

/* =========================
   Pantalla principal
   ========================= */
export default function WishlistPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<UIItem[]>([]);
  const [loading, setLoading] = useState(true);

  // edición
  const [editing, setEditing] = useState<UIItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editPriceRaw, setEditPriceRaw] = useState(""); // guarda dígitos crudos

  // refs para cerrar teclado con “Listo”
  const refEditName = useRef<TextInput>(null);
  const refEditAmount = useRef<TextInput>(null);

  const usuarioId = 1; // demo

  const loadItems = async () => {
    try {
      setLoading(true);
      const { wishlist, items: dbItems } = await obtenerWishlistConItems(usuarioId);
      const mapped: UIItem[] = (dbItems ?? []).map((it) => ({
        id: it.id_wishlistDetalle,
        name: it.Nombre,
        price: Number(it.Monto ?? 0),
        done: false,
      }));
      setItems(mapped);
      console.log("Total wishlist:", wishlist?.Total ?? 0);
    } catch (error) {
      console.error("❌ Error cargando los deseos:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  const toggleDone = (id: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const openEdit = (item: UIItem) => {
    setEditing(item);
    setEditName(item.name);
    setEditPriceRaw(String(item.price || 0));
  };

  const confirmDelete = (item: UIItem) => {
    Alert.alert("Eliminar deseo", `¿Seguro que deseas eliminar "${item.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await eliminarDeseo(item.id);
            await loadItems();
          } catch (e) {
            console.error(e);
            Alert.alert("Error", "No se pudo eliminar el deseo.");
          }
        },
      },
    ]);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const nombre = editName.trim() || "Sin nombre";
      const monto = Number(onlyDigits(editPriceRaw) || "0");
      await actualizarDeseo(editing.id, nombre, monto, null, null);
      setEditing(null);
      await loadItems();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo actualizar el deseo.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* HEADER */}
      <View
        style={{
          backgroundColor: PURPLE,
          paddingTop: insets.top + 10,
          paddingBottom: 18,
          paddingHorizontal: 16,
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
            <ArrowLeft color="#fff" size={28} />
          </TouchableOpacity>

          <Text
            style={{
              color: "#fff",
              fontSize: 25,
              fontWeight: "800",
              marginLeft: 12,
            }}
          >
            Lista de deseos
          </Text>
        </View>
      </View>

      {/* CONTENIDO */}
      <ScrollView
        style={{ paddingHorizontal: 16 }}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: (insets.bottom || 0) + 80,
        }}
      >
        {/* Encabezado de sección */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ color: PURPLE, fontSize: 18, fontWeight: "700" }}>
            Nuevo deseo
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/WishList/AddWish")}
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderColor: GRAY_BORDER,
              borderWidth: 1,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 1,
            }}
            accessibilityLabel="Agregar deseo"
          >
            <Plus size={18} color="#111" />
          </TouchableOpacity>
        </View>

        {/* Lista */}
        {loading ? (
          <View style={{ marginTop: 50, alignItems: "center" }}>
            <ActivityIndicator size="large" color={PURPLE} />
            <Text style={{ marginTop: 10, color: "#555" }}>Cargando tus deseos...</Text>
          </View>
        ) : items.length === 0 ? (
          <Text style={{ marginTop: 40, textAlign: "center", color: "#666" }}>
            No tienes deseos guardados aún.
          </Text>
        ) : (
          items.map((item) => (
            <View
              key={item.id}
              style={{
                backgroundColor: GRAY_BG,
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 14,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <TouchableOpacity onPress={() => toggleDone(item.id)}>
                {item.done ? <CheckSquare size={22} color={PURPLE} /> : <Square size={22} color="#999" />}
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <View
                  style={{
    flexDirection: "row",
    alignItems: "center",
  }}
>
  {/* Nombre (izquierda, ocupa todo el espacio libre) */}
  <Text
    style={{
      flex: 1,
      fontWeight: "700",
      color: "#111",
      fontSize: 16,
    }}
    numberOfLines={1}
  >
    {item.name}
  </Text>

  {/* Precio (alineado derecha, ancho fijo para columna uniforme) */}
  <Text
    style={{
      width: 110, // 👈 ajusta según longitud máxima esperada (ej. $9.999.999)
      textAlign: "right",
      fontWeight: "700",
      color: "#111",
      fontSize: 16,
    }}
  >
    {currency(item.price)}
  </Text>

  {/* Botón de opciones */}
  <TouchableOpacity
    onPress={() =>
      Alert.alert("Opciones", item.name, [
        { text: "Editar", onPress: () => openEdit(item) },
        { text: "Eliminar", style: "destructive", onPress: () => confirmDelete(item) },
        { text: "Cancelar", style: "cancel" },
      ])
    }
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    style={{ paddingLeft: 10 }}
  >
    <MoreHorizontal size={20} color="#444" />
  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* NAV INFERIOR */}
      <BottomNav active="wishlist" />

      {/* MODAL EDITAR: KeyboardAvoiding + “Listo” iOS + moneda */}
      <Modal
        visible={!!editing}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(null)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={isIOS ? "padding" : undefined}
            keyboardVerticalOffset={isIOS ? insets.top + 12 : 0}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Editar deseo</Text>

              <Text style={styles.label}>Nombre</Text>
              <TextInput
                ref={refEditName}
                value={editName}
                onChangeText={setEditName}
                placeholder="Nombre del deseo"
                style={styles.input}
                returnKeyType="next"
                blurOnSubmit
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Monto</Text>
              <TextInput
                ref={refEditAmount}
                value={
                  Number(onlyDigits(editPriceRaw) || "0") > 0
                    ? currency(Number(onlyDigits(editPriceRaw)))
                    : ""
                }
                onChangeText={(t) => setEditPriceRaw(onlyDigits(t))}
                placeholder="$ 0"
                keyboardType={isIOS ? "number-pad" : "numeric"}
                style={styles.input}
                inputAccessoryViewID={isIOS ? "acc-wish-edit" : undefined}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setEditing(null)} style={styles.btnCancel}>
                  <Text style={{ color: "#111", fontWeight: "600" }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveEdit} style={styles.btnPrimary}>
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>

        {/* Barra “Listo” iOS para cerrar teclado del monto */}
        <DoneBar
          nativeID="acc-wish-edit"
          onDone={() => {
            refEditAmount.current?.blur();
            Keyboard.dismiss();
          }}
        />
      </Modal>
    </View>
  );
}

/* =========================
   Estilos
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
    gap: 10,
    marginTop: 16,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: "#eee",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: PURPLE,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
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
