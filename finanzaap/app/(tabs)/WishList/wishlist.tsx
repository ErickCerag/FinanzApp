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
} from "@/Service/wishList/wishlist.service";
import { obtenerSesion } from "@/Service/user/user.service";
import { Plus, CheckSquare, Square, ArrowLeft, MoreHorizontal } from "lucide-react-native";
import BottomNav from "@/components/BarraNav";

const PURPLE = "#6B21A8";
const GRAY_BG = "#f4f4f5";
const GRAY_BORDER = "#E5E7EB";
const isIOS = Platform.OS === "ios";
const isWeb = Platform.OS === "web";

const onlyDigits = (s: string) => s.replace(/\D+/g, "");
const currency = (v: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(v);

type UIItem = { id: number; name: string; price: number; done: boolean };

function DoneBar({ nativeID, onDone }: { nativeID: string; onDone: () => void }) {
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

export default function WishlistPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<UIItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  const [editing, setEditing] = useState<UIItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editPriceRaw, setEditPriceRaw] = useState("");

  // Menú contextual (web)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const refEditName = useRef<TextInput>(null);
  const refEditAmount = useRef<TextInput>(null);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const u = await obtenerSesion();
      const uid = u?.id_usuario ?? null;
      setUserId(uid);

      if (!uid) {
        setItems([]);
        setLoading(false);
        return;
      }

      const { wishlist, items: dbItems } = await obtenerWishlistConItems(uid);
      const mapped: UIItem[] = (dbItems ?? []).map((it) => ({
        id: it.id_wishlistDetalle,
        name: it.Nombre,
        price: Number(it.Monto ?? 0),
        done: false,
      }));
      setItems(mapped);
      console.log("Total wishlist:", wishlist?.Total ?? 0);
    } catch (e) {
      console.error("❌ Error cargando los deseos:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadItems(); }, [loadItems]));

  const toggleDone = (id: number) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it)));
  };

  const openEdit = (item: UIItem) => {
    setEditing(item);
    setEditName(item.name);
    setEditPriceRaw(String(item.price || 0));
    setOpenMenuId(null);
  };

  // Confirmación + eliminación (web)
  const confirmDeleteWeb = async (item: UIItem) => {
    // window.confirm existe en web; en native no se usa este flujo
    // eslint-disable-next-line no-restricted-globals
    const ok = typeof window !== "undefined" ? window.confirm(`¿Eliminar "${item.name}" definitivamente?`) : false;
    if (!ok) { setOpenMenuId(null); return; }
    try {
      await eliminarDeseo(item.id);
      setOpenMenuId(null);
      await loadItems();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo eliminar el deseo.");
    }
  };

  // Confirmación + eliminación (native) ya estaba con Alert
  const confirmDeleteNative = (item: UIItem) => {
    Alert.alert("Eliminar deseo", `¿Seguro que deseas eliminar "${item.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => {
          try { await eliminarDeseo(item.id); await loadItems(); }
          catch (e) { console.error(e); Alert.alert("Error", "No se pudo eliminar el deseo."); }
        }
      },
    ]);
  };

  const handleOptions = (item: UIItem) => {
    if (isWeb) {
      setOpenMenuId((prev) => (prev === item.id ? null : item.id));
      return;
    }
    // Nativo: Alert con opciones
    Alert.alert("Opciones", item.name, [
      { text: "Editar", onPress: () => openEdit(item) },
      { text: "Eliminar", style: "destructive", onPress: () => confirmDeleteNative(item) },
      { text: "Cancelar", style: "cancel" },
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
            style={{ padding: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            <ArrowLeft color="#fff" size={28} />
          </TouchableOpacity>

          <Text style={{ color: "#fff", fontSize: 25, fontWeight: "800", marginLeft: 12 }}>
            Lista de deseos
          </Text>
        </View>
      </View>

      {/* CONTENIDO */}
      <ScrollView
        style={{ paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: (insets.bottom || 0) + 80 }}
      >
        {/* Encabezado */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ color: PURPLE, fontSize: 18, fontWeight: "700" }}>Nuevo deseo</Text>
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
            {userId ? "No tienes deseos guardados aún." : "Inicia sesión para ver tu lista."}
          </Text>
        ) : (
          items.map((item) => {
            const menuOpen = openMenuId === item.id;
            return (
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
                  position: "relative",
                  overflow: "visible",
                  zIndex: menuOpen ? 1000 : 0,
                }}
              >
                <TouchableOpacity onPress={() => toggleDone(item.id)}>
                  {item.done ? <CheckSquare size={22} color={PURPLE} /> : <Square size={22} color="#999" />}
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ flex: 1, fontWeight: "700", color: "#111", fontSize: 16 }} numberOfLines={1}>
                      {item.name}
                    </Text>

                    <Text style={{ width: 110, textAlign: "right", fontWeight: "700", color: "#111", fontSize: 16 }}>
                      {currency(item.price)}
                    </Text>

                    <TouchableOpacity
                      onPress={() => handleOptions(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{ paddingLeft: 10 }}
                    >
                      <MoreHorizontal size={20} color="#444" />
                    </TouchableOpacity>
                  </View>

                  {/* Menú contextual (solo web) */}
                  {isWeb && menuOpen && (
                    <>
                      {/* overlay para cerrar con clic fuera */}
                      <View
                        onTouchEnd={() => setOpenMenuId(null)}
                        // @ts-ignore RNW web
                        style={menuStyles.overlay}
                      />
                      <View style={menuStyles.menu}>
                        <TouchableOpacity onPress={() => openEdit(item)} style={menuStyles.menuItem}>
                          <Text style={menuStyles.menuText}>Editar</Text>
                        </TouchableOpacity>
                        <View style={menuStyles.divider} />
                        <TouchableOpacity onPress={() => confirmDeleteWeb(item)} style={menuStyles.menuItem}>
                          <Text style={[menuStyles.menuText, { color: "#b91c1c" }]}>Eliminar</Text>
                        </TouchableOpacity>
                        <View style={menuStyles.divider} />
                        <TouchableOpacity onPress={() => setOpenMenuId(null)} style={menuStyles.menuItem}>
                          <Text style={menuStyles.menuText}>Cancelar</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <BottomNav active="wishlist" />

      {/* MODAL EDITAR */}
      <Modal visible={!!editing} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={isIOS ? "padding" : undefined} keyboardVerticalOffset={isIOS ? insets.top + 12 : 0}>
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
                value={Number(onlyDigits(editPriceRaw) || "0") > 0 ? currency(Number(onlyDigits(editPriceRaw))) : ""}
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
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  label: { color: PURPLE, fontWeight: "700" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
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
  accessoryBtn: { color: PURPLE, fontWeight: "700", fontSize: 16 },
});

/* ====== Menú contextual WEB ====== */
const menuStyles = StyleSheet.create({
  overlay: {
    position: "fixed" as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
    backgroundColor: "rgba(0,0,0,0)",
  },
  menu: {
    position: "absolute",
    right: 0,
    top: 36,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    minWidth: 160,
    overflow: "hidden",
    zIndex: 9999,
  },
  menuItem: { paddingVertical: 10, paddingHorizontal: 12 },
  menuText: { color: "#111827", fontSize: 14, fontWeight: "600" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#E5E7EB" },
});
