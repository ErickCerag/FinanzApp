import { useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter, Link } from "expo-router";
import { Plus, CheckSquare, Square, Home, Star, Wallet, User, ArrowLeft } from "lucide-react";

export default function WishlistPage() {
  const router = useRouter();

  const items = [
    { id: 1, name: "Computador nuevo", price: 750000, savedGap: 0, done: true, note: "Felicitaciones, ¡lo lograste!" },
    { id: 2, name: "Bicicleta", price: 300000, savedGap: 50000, done: false, note: "Estás a $ 50.000 de obtenerlo" },
    { id: 3, name: "Entrada Concierto", price: 480000, savedGap: 90000, done: false, note: "Estás a $ 90.000 de obtenerlo" },
  ];

  const currency = (v: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(v);

  const progress = useMemo(() => {
    const total = items.reduce((a, b) => a + b.price, 0);
    const achieved = items.filter((x) => x.done).reduce((a, b) => a + b.price, 0);
    return { total, achieved };
  }, [items]);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Top Bar */}
      <View style={{ backgroundColor: "#6B21A8", paddingVertical: 20, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color="#fff" size={22} />
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600", marginLeft: 12 }}>Lista de deseos</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={{ paddingHorizontal: 16, paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20, marginBottom: 10 }}>
          <Text style={{ color: "#6B21A8", fontSize: 16, fontWeight: "500" }}>Nuevo deseo</Text>
          
          <TouchableOpacity
  onPress={() => router.push("/add_deseo")}
  style={{ padding: 6, borderRadius: 6, backgroundColor: "#eee" }}
  accessibilityLabel="Agregar deseo"
>
  <Plus size={18} color="#333" />
</TouchableOpacity>

        </View>

        {/* Total progress */}
        <View style={{ backgroundColor: "#f3e8ff", padding: 16, borderRadius: 12, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6B21A8", fontWeight: "500" }}>Meta total</Text>
            <Text style={{ fontWeight: "600", color: "#4B0082" }}>{currency(progress.total)}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
            <Text style={{ fontSize: 12, color: "#666" }}>Logrado</Text>
            <Text style={{ fontSize: 12, color: "#333" }}>{currency(progress.achieved)}</Text>
          </View>
        </View>

        {/* Items */}
        {items.map((item) => (
          <View
            key={item.id}
            style={{
              backgroundColor: "#f4f4f5",
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
              <View>{item.done ? <CheckSquare size={22} color="#6B21A8" /> : <Square size={22} color="#999" />}</View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontWeight: "600" }}>{item.name}</Text>
                  <Text style={{ fontWeight: "700" }}>{currency(item.price)}</Text>
                </View>
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    color: item.done ? "#16a34a" : "#444",
                  }}
                >
                  {item.note}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Navigation */}
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
