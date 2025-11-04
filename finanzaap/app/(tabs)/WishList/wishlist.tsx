import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, CheckSquare, Square, ArrowLeft } from "lucide-react-native";
import { obtenerWishlistConItems } from "@/Service/wishList/wishlist.service.native";
import BottomNav from "@/components/BarraNav"; // ✅ tu nav global

// ==== Tipos ====
type UIItem = {
  id: number;
  name: string;
  price: number;
  done: boolean;
};

// ==== Constantes de estilo ====
const PURPLE = "#6B21A8";
const GRAY_BG = "#f4f4f5";
const GRAY_BORDER = "#E5E7EB";

export default function WishlistPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); // ✅ dentro del componente

  const [items, setItems] = useState<UIItem[]>([]);
  const [loading, setLoading] = useState(true);
  const usuarioId = 1; // usuario demo

  // ==== Carga de datos ====
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

  // ==== Helpers ====
  const currency = (v: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(v);

  const toggleDone = (id: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  // ==== Render principal ====
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* ===================== */}
      {/* 🔹 HEADER MORADO SEGURO 🔹 */}
      {/* ===================== */}
      <View
        style={{
          backgroundColor: PURPLE,
          paddingTop: insets.top + 10, // 👈 respeta notch / Dynamic Island
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
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} // 👈 área táctil ampliada
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

      {/* ===================== */}
      {/* 🔹 CONTENIDO PRINCIPAL 🔹 */}
      {/* ===================== */}
      <ScrollView
        style={{ paddingHorizontal: 16 }}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: (insets.bottom || 0) + 80, // deja espacio al BottomNav
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

        {/* Lista de deseos */}
        {loading ? (
          <View style={{ marginTop: 50, alignItems: "center" }}>
            <ActivityIndicator size="large" color={PURPLE} />
            <Text style={{ marginTop: 10, color: "#555" }}>
              Cargando tus deseos...
            </Text>
          </View>
        ) : items.length === 0 ? (
          <Text style={{ marginTop: 40, textAlign: "center", color: "#666" }}>
            No tienes deseos guardados aún.
          </Text>
        ) : (
          items.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => toggleDone(item.id)}
              activeOpacity={0.7}
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
              <View>
                {item.done ? (
                  <CheckSquare size={22} color={PURPLE} />
                ) : (
                  <Square size={22} color="#999" />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: 6,
                  }}
                >
                  <Text style={{ fontWeight: "700", color: "#111", fontSize: 16 }}>
                    {item.name}
                  </Text>
                  <Text style={{ fontWeight: "700", color: "#111", fontSize: 16 }}>
                    {currency(item.price)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* ===================== */}
      {/* 🔹 NAV INFERIOR 🔹 */}
      {/* ===================== */}
      <BottomNav active="wishlist" />
    </View>
  );
}
