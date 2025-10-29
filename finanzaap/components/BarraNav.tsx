// components/BarraNav.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, type TextStyle } from "react-native";
import { Link, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  active: "home" | "wishlist" | "balance" | "profile";
};

const PURPLE = "#6B21A8";
const INACTIVE = "#111";

export default function BottomNav({ active }: Props) {
  const insets = useSafeAreaInsets();
  const is = (k: Props["active"]) => active === k;
  const color = (k: Props["active"]) => (is(k) ? PURPLE : INACTIVE);
  const labelStyle = (k: Props["active"]): TextStyle => ({
    fontSize: 11,               // más pequeño para pantallas chicas
    color: color(k),
    fontWeight: (is(k) ? "600" : "400") as TextStyle["fontWeight"],
    marginTop: 4,
  });

  return (
    <View
      style={[
        styles.wrap,
        { paddingBottom: Math.max(insets.bottom, 6) } // respeta el “home indicator” de iPhone
      ]}
    >
      {/* Cada item ocupa 1/4 del ancho */}
      <Link href={"/" as Href} asChild>
        <TouchableOpacity style={styles.item}>
          <Ionicons name="home" size={22} color={color("home")} />
          <Text style={labelStyle("home")} numberOfLines={1}>Inicio</Text>
        </TouchableOpacity>
      </Link>

      <Link href={"/WishList/wishlist" as Href} asChild>
        <TouchableOpacity style={styles.item}>
          <Ionicons name="star" size={22} color={color("wishlist")} />
          <Text style={labelStyle("wishlist")} numberOfLines={1}>WishList</Text>
        </TouchableOpacity>
      </Link>

      {/* Si tu archivo aún es Balanace.tsx, usa "/balanace" mientras lo renombras */}
      <Link href={"/Balanace" as Href} asChild>
        <TouchableOpacity style={styles.item}>
          <Ionicons name="stats-chart" size={22} color={color("balance")} />
          <Text style={labelStyle("balance")} numberOfLines={1}>Balance</Text>
        </TouchableOpacity>
      </Link>

      <Link href={"/Perfil" as Href} asChild>
        <TouchableOpacity style={styles.item}>
          <Ionicons name="person" size={22} color={color("profile")} />
          <Text style={labelStyle("profile")} numberOfLines={1}>Perfil</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    paddingTop: 8,
    paddingHorizontal: 12,        // 🔁 ancho fluido (antes 140 fijo)
    flexDirection: "row",
  },
  item: {
    flex: 1,                       // 🔁 reparte el ancho entre 4
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,            // mejora área táctil
  },
});
