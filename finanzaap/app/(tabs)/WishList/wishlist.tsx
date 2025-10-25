import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useFocusEffect, useRouter, Link } from "expo-router";
import { Plus, CheckSquare, Square, Home, Star, Wallet, User, ArrowLeft } from "lucide-react-native";
import { obtenerWishlistConItems } from "@/Service/wishList/wishlist.service.native";

// 👇 Importa la que trae los items


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

  // Usuario ficticio (hasta tener login)
  const usuarioId = 1;

  const loadItems = async () => {
    try {
      setLoading(true);

      // Trae wishlist + items desde la BD
      const { wishlist, items: dbItems } = await obtenerWishlistConItems(usuarioId);

      // dbItems tiene: id_wishlistDetalle, Nombre, Monto, FechaLimite, Descripcion
      // Mapeamos al modelo de UI que usa el render
      const mapped: UIItem[] = (dbItems ?? []).map(it => ({
        id: it.id_wishlistDetalle,
        name: it.Nombre,
        price: Number(it.Monto ?? 0),
        done: false, // por ahora sólo visual
      }));

      setItems(mapped);
      // Si quieres usar el total de la wishlist en la vista, está en wishlist?.Total
      console.log("Total wishlist:", wishlist?.Total ?? 0);
    } catch (error) {
      console.error("❌ Error cargando los deseos:", error);
      setItems([]); // defensivo
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
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Barra superior */}
      <View style={{ backgroundColor: "#6B21A8", paddingVertical: 20, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color="#fff" size={22} />
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600", marginLeft: 12 }}>
            Lista de deseos
          </Text>
        </View>
      </View>

      {/* Contenido principal */}
      <ScrollView style={{ paddingHorizontal: 16, paddingBottom: 100 }}>
        {/* Encabezado */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20, marginBottom: 10 }}>
          <Text style={{ color: "#6B21A8", fontSize: 16, fontWeight: "500" }}>Nuevo deseo</Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/WishList/AddWish")}
            style={{ padding: 6, borderRadius: 6, backgroundColor: "#eee" }}
          >
            <Plus size={18} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Indicador de carga / Lista */}
        {loading ? (
          <View style={{ marginTop: 50, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#6B21A8" />
            <Text style={{ marginTop: 10, color: "#555" }}>Cargando tus deseos...</Text>
          </View>
        ) : items.length === 0 ? (
          <Text style={{ marginTop: 40, textAlign: "center", color: "#666" }}>
            No tienes deseos guardados aún.
          </Text>
        ) : (
          items.map(item => (
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
                {item.done ? <CheckSquare size={22} color="#6B21A8" /> : <Square size={22} color="#999" />}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontWeight: "600" }}>{item.name}</Text>
                  <Text style={{ fontWeight: "700" }}>{currency(item.price)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Navegación inferior */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderTopWidth: 1,
          borderColor: "#ddd",
          backgroundColor: "#fff",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Link href="/(tabs)" asChild>
          <TouchableOpacity style={{ alignItems: "center" }}>
            <Home size={20} />
            <Text style={{ fontSize: 12 }}>Inicio</Text>
          </TouchableOpacity>
        </Link>

        <TouchableOpacity style={{ alignItems: "center" }}>
          <Star size={20} color="#6B21A8" />
          <Text style={{ fontSize: 12, color: "#6B21A8", fontWeight: "500" }}>WishList</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ alignItems: "center" }}>
          <Wallet size={20} />
          <Text style={{ fontSize: 12 }}>Balance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ alignItems: "center" }}>
          <User size={20} />
          <Text style={{ fontSize: 12 }}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
