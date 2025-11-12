// app/index.tsx  (Inicio/Home) — versión completa con carrusel basado en Wishlist real

import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useFocusEffect } from "expo-router";
import { initDb } from "@/Service/DB_Conector";
import { obtenerSesion } from "@/Service/user/user.service";
import { fetchIncomes, fetchExpenses } from "@/Service/budget/budget.service";
import { obtenerWishlistConItems } from "@/Service/wishList/wishlist.service";
import BottomNav from "@/components/BarraNav";

/* Solo una vez */
const { width: screenWidth } = Dimensions.get("window");

/* Fallback por si no hay deseos aún */
const DEFAULT_CAROUSEL = [
  { title: "Bicicleta", price: "$300.000", message: "Estás a $50.000 de obtenerlo" },
  { title: "Viaje",     price: "$1.500.000", message: "Estás a $500.000 de obtenerlo" },
];

const currency = (v: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(v);

type CarouselItem = { title: string; price: string; message: string };

export default function HomeScreen() {
  const [booting, setBooting] = React.useState(true);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [nombre, setNombre] = React.useState<string>("Usuario");
  const [avatar, setAvatar] = React.useState<string | null>(null);

  const [totalIncome, setTotalIncome] = React.useState(0);
  const [totalExpenses, setTotalExpenses] = React.useState(0);

  // 👇 ahora el carrusel es dinámico (pero con mismo layout y estilos)
  const [carouselItems, setCarouselItems] = React.useState<CarouselItem[]>(DEFAULT_CAROUSEL);

  const loadData = React.useCallback(async () => {
    await initDb();

    // Usuario real (con id/Avatar para ambas plataformas)
    const u = await obtenerSesion();
    if (u?.Nombre) setNombre(u.Nombre);
    setAvatar(u?.Avatar ?? null);

    // Presupuesto real (tú ya tienes fetchIncomes/fetchExpenses)
    try {
      const [ins, exps] = await Promise.all([fetchIncomes(), fetchExpenses()]);
      setTotalIncome(ins.reduce((a: number, b: any) => a + (b.amount || 0), 0));
      setTotalExpenses(exps.reduce((a: number, b: any) => a + (b.amount || 0), 0));
    } catch {
      setTotalIncome(0);
      setTotalExpenses(0);
    }

    // Wishlist del usuario → poblar carrusel
    try {
      const userId = u?.id_usuario ?? 1; // fallback defensivo
      const { items } = await obtenerWishlistConItems(userId);

      if (items && items.length > 0) {
        // Tomamos los últimos agregados primero (o los primeros, según tu consulta)
        const mapped: CarouselItem[] = items.slice(0, 5).map((it) => ({
          title: it.Nombre,
          price: currency(Number(it.Monto || 0)),
          // Mensaje breve manteniendo el mismo estilo del carrusel
          message: it.FechaLimite
            ? `Meta al ${new Date(it.FechaLimite).toLocaleDateString("es-CL")}`
            : "Guardado en tu wishlist",
        }));

        setCarouselItems(mapped);
      } else {
        setCarouselItems(DEFAULT_CAROUSEL);
      }
    } catch {
      setCarouselItems(DEFAULT_CAROUSEL);
    }

    setBooting(false);
  }, []);

  // Carga inicial
  React.useEffect(() => {
    let alive = true;
    (async () => {
      await loadData();
      if (!alive) return;
    })();
    return () => {
      alive = false;
    };
  }, [loadData]);

  // Refrescar al volver desde Wishlist/AddWish/Perfil
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

  const nextItem = () => setActiveIndex((p) => (p + 1) % carouselItems.length);
  const prevItem = () => setActiveIndex((p) => (p === 0 ? carouselItems.length - 1 : p - 1));

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#6B21A8" />
        <Text style={{ marginTop: 8, color: "#6b7280" }}>Cargando…</Text>
      </View>
    );
  }

  const current = carouselItems[activeIndex] ?? DEFAULT_CAROUSEL[0];

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Header con avatar y saludo */}
        <View style={styles.headerBox}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.headerAvatar} />
          ) : (
            <Ionicons name="person-circle" size={72} color="white" style={{ marginBottom: 8 }} />
          )}
          <Text style={styles.headerTitle}>Hola {nombre}</Text>
          <Text style={styles.headerSub}>Mi presupuesto</Text>
          <Text style={styles.headerAmount}>{currency(totalIncome)}</Text>
          <Text style={styles.headerSub}>Mis gastos</Text>
          <Text style={styles.headerAmount}>{currency(totalExpenses)}</Text>
        </View>

        <View style={styles.optionsRow}>
          <Link href="/(tabs)/Presupueto" asChild>
            <TouchableOpacity style={styles.optionCard}>
              <Text style={styles.optionText}>Gestionar presupuesto</Text>
              <Ionicons name="chevron-forward" size={20} color="#4B0082" />
            </TouchableOpacity>
          </Link>

          <Link href="/WishList/wishlist" asChild>
            <TouchableOpacity style={styles.optionCard}>
              <Text style={styles.optionText}>Mi lista de deseos</Text>
              <Ionicons name="chevron-forward" size={20} color="#4B0082" />
            </TouchableOpacity>
          </Link>
        </View>

        {/* Carrusel (misma UI, solo cambia la data) */}
        <View style={styles.carouselContainer}>
          <View style={styles.carouselCard}>
            <Text style={styles.carouselTitle}>{current.title}</Text>
            <Text style={styles.carouselPrice}>{current.price}</Text>
            <Text style={styles.carouselMessage}>{current.message}</Text>
          </View>
          <View style={styles.carouselControls}>
            <TouchableOpacity onPress={prevItem}>
              <Ionicons name="chevron-back" size={18} color="black" />
            </TouchableOpacity>
            <Ionicons name="ellipse" size={10} color="black" style={{ marginHorizontal: 6 }} />
            <TouchableOpacity onPress={nextItem}>
              <Ionicons name="chevron-forward" size={18} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        <BottomNav active="home" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, backgroundColor: "#F8F8F8", justifyContent: "space-between" },
  container: { flex: 1, alignItems: "center", paddingVertical: 24, paddingBottom: 80 },
  headerBox: {
    backgroundColor: "#6418C3",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    alignItems: "center",
  },
  headerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
  headerTitle: { fontSize: 18, color: "white", fontWeight: "bold" },
  headerSub: { fontSize: 14, color: "white", marginTop: 6 },
  headerAmount: { fontSize: 16, color: "white", fontWeight: "bold" },
  optionsRow: {
    flexDirection: screenWidth > 700 ? "row" : "column",
    width: "90%",
    justifyContent: "space-between",
    marginVertical: 20,
    gap: 12,
  },
  optionCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 10,
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  },
  optionText: { fontSize: 15, color: "#4B0082" },
  carouselContainer: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
    elevation: 2,
  },
  carouselCard: { alignItems: "center" },
  carouselTitle: { fontWeight: "bold", fontSize: 16 },
  carouselPrice: { fontWeight: "bold", fontSize: 16, marginTop: 4 },
  carouselMessage: { marginTop: 4, fontSize: 13, color: "gray" },
  carouselControls: { flexDirection: "row", marginTop: 12, alignItems: "center" },
});
