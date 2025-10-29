import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRouter, Link } from "expo-router";
import { Plus, CheckSquare, Square, ArrowLeft } from "lucide-react-native";
import { obtenerWishlistConItems } from "@/Service/wishList/wishlist.service.native";
import BottomNav from "@/components/BarraNav"; // 👈 usa tu componente global

type UIItem = {
  id: number;
  name: string;
  price: number;
  done: boolean;
};

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<UIItem[]>([]);
  const [loading, setLoading] = useState(true);
  const usuarioId = 1; // usuario ficticio

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

  const currency = (v: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(v);

  const toggleDone = (id: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* 🔹 Barra superior */}
      <View
        style={{
          backgroundColor: "#6B21A8",
          paddingVertical: 20,
          paddingHorizontal: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color="#fff" size={40} />
          </TouchableOpacity>
          <Text
            style={{
              color: "#fff",
              fontSize: 30,
              fontWeight: "600",
              marginLeft: 12,
            }}
          >
            Lista de deseos
          </Text>
        </View>
      </View>

      {/* 🔹 Contenido principal */}
      <ScrollView
        style={{ paddingHorizontal: 16, paddingBottom: 100 }}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Encabezado */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 20,
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              color: "#6B21A8",
              fontSize: 16,
              fontWeight: "500",
            }}
          >
            Nuevo deseo
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/WishList/AddWish")}
            style={{
              padding: 6,
              borderRadius: 6,
              backgroundColor: "#eee",
            }}
          >
            <Plus size={18} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Lista */}
        {loading ? (
          <View style={{ marginTop: 50, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#6B21A8" />
            <Text style={{ marginTop: 10, color: "#555" }}>
              Cargando tus deseos...
            </Text>
          </View>
        ) : items.length === 0 ? (
          <Text
            style={{
              marginTop: 40,
              textAlign: "center",
              color: "#666",
            }}
          >
            No tienes deseos guardados aún.
          </Text>
        ) : (
          items.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => toggleDone(item.id)}
              activeOpacity={0.7}
              style={{
                backgroundColor: "#f4f4f5",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <View>
                {item.done ? (
                  <CheckSquare size={22} color="#6B21A8" />
                ) : (
                  <Square size={22} color="#999" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ fontWeight: "600" }}>{item.name}</Text>
                  <Text style={{ fontWeight: "700" }}>
                    {currency(item.price)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* 🔹 Usa el mismo nav global */}
      <BottomNav active="wishlist" />
    </View>
  );
}
