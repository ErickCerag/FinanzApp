import { useState, useMemo, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter, Link } from "expo-router";
import { Plus, CheckSquare, Square, Home, Star, Wallet, User, ArrowLeft } from "lucide-react";
import BottomNav from "../../../components/BarraNav";



// 🧠 Simula una llamada al backend o servicio
const fetchWishlistItems = async () => {
  // Simulamos un retraso de red (2 segundos)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Datos ficticios (simulan venir de una API o base de datos)
  return [
    {
      id: 1,
      name: "Computador nuevo",
      price: 750000,
      savedGap: 0,
      done: true,
      note: "Felicitaciones, ¡lo lograste!",
    },
    {
      id: 2,
      name: "Bicicleta",
      price: 300000,
      savedGap: 50000,
      done: false,
      note: "Estás a $ 50.000 de obtenerlo",
    },
    {
      id: 3,
      name: "Entrada Concierto",
      price: 480000,
      savedGap: 90000,
      done: false,
      note: "Estás a $ 90.000 de obtenerlo",
    },
  ];
};

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔁 Cargar los datos simulados
  useEffect(() => {
    const loadItems = async () => {
      try {
        const data = await fetchWishlistItems();
        setItems(data);
      } catch (error) {
        console.error("Error cargando los deseos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  // 💰 Formateador de moneda
  const currency = (v: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(v);

  // 📊 Calcular progreso total
  const progress = useMemo(() => {
    const total = items.reduce((a, b) => a + b.price, 0);
    const achieved = items.filter((x) => x.done).reduce((a, b) => a + b.price, 0);
    return { total, achieved };
  }, [items]);

  // ✅ Alternar estado done
  const toggleDone = (id: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              done: !item.done,
              note: !item.done
                ? "Felicitaciones, ¡lo lograste!"
                : `Estás a $ ${item.savedGap.toLocaleString("es-CL")} de obtenerlo`,
            }
          : item
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
          <Text style={{ color: "#fff", fontSize: 26, fontWeight: "600", marginLeft: 12 }}>
            Lista de deseos
          </Text>
        </View>
      </View>

      {/* Contenido principal */}
      <ScrollView style={{ paddingHorizontal: 16, paddingBottom: 100 }}>
        {/* Encabezado */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20, marginBottom: 10 }}>
          <Text style={{ color: "#6B21A8", fontSize: 20, fontWeight: "500" }}>Nuevo deseo</Text>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/WishList/AddWish")}
            style={{ padding: 6, borderRadius: 6, backgroundColor: "#eee" }}
            accessibilityLabel="Agregar deseo"
          >
            <Plus size={20} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Indicador de carga */}
        {loading ? (
          <View style={{ marginTop: 50, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#6B21A8" />
            <Text style={{ marginTop: 10, color: "#555" }}>Cargando tus deseos...</Text>
          </View>
        ) : (
          <>
            {/* Progreso total */}
            <View style={{ backgroundColor: "#f3e8ff", padding: 16, borderRadius: 12, marginBottom: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#6B21A8", fontWeight: "500",fontSize: 20 }}>Meta total</Text>
                <Text style={{ fontWeight: "600", color: "#4B0082" , fontSize:18}}>{currency(progress.total)}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                <Text style={{ fontSize: 18, color: "#666"  }}>Logrado</Text>
                <Text style={{ fontSize: 18, color: "#333" }}>{currency(progress.achieved)}</Text>
              </View>
            </View>

            {/* Lista de deseos */}
            {items.map((item) => (
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
                <View>{item.done ? <CheckSquare size={22} color="#6B21A8" /> : <Square size={22} color="#999" />}</View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontWeight: "600", fontSize:20 }}>{item.name}</Text>
                    <Text style={{ fontWeight: "700" ,fontSize: 20}}>{currency(item.price)}</Text>
                  </View>
                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: 17,
                      color: item.done ? "#16a34a" : "#444",
                    }}
                  >
                    {item.note}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      {/* Navegación inferior */}
      <BottomNav active="wishlist" />
    </View>
  );
}
