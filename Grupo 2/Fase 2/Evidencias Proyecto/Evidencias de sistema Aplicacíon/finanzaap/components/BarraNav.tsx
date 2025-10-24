// components/BarraNav.tsx  (o BottomNav.tsx)
import React from "react";
import { View, Text, TouchableOpacity, type TextStyle } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  active: "home" | "wishlist" | "balance" | "profile";
};

const PURPLE = "#6B21A8";
const INACTIVE = "black";

export default function BottomNav({ active }: Props) {
  const is = (k: Props["active"]) => active === k;
  const color = (k: Props["active"]) => (is(k) ? PURPLE : INACTIVE);

  // ✔ Devuelve un TextStyle válido (no string genérico)
  const labelStyle = (k: Props["active"]): TextStyle => ({
    fontSize: 20,
    color: color(k),
    fontWeight: (is(k) ? "600" : "400") as TextStyle["fontWeight"],
  });

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: 12,
        paddingHorizontal: 140,
        borderTopWidth: 1,
        borderColor: "#ddd",
        backgroundColor: "#fff",
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <Link href="/(tabs)" asChild>
        <TouchableOpacity style={{ alignItems: "center" }}>
          <Ionicons name="home" size={20} color={color("home")} />
          <Text style={labelStyle("home")}>Inicio</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/(tabs)/WishList/wishlist" asChild>
        <TouchableOpacity style={{ alignItems: "center" }}>
          <Ionicons name="star" size={20} color={color("wishlist")} />
          <Text style={labelStyle("wishlist")}>WishList</Text>
        </TouchableOpacity>
      </Link>

      {/* OJO: usa la ruta real que tienes hoy (Balanace.tsx con typo) */}
      <Link href="/(tabs)/Balanace" asChild>
        <TouchableOpacity style={{ alignItems: "center" }}>
          <Ionicons name="stats-chart" size={20} color={color("balance")} />
          <Text style={labelStyle("balance")}>Balance</Text>
        </TouchableOpacity>
      </Link>

      {/* Cuando exista la pantalla de perfil, cámbialo a <Link> */}
      <TouchableOpacity style={{ alignItems: "center" }}>
        <Ionicons name="person" size={20} color={color("profile")} />
        <Text style={labelStyle("profile")}>Perfil</Text>
      </TouchableOpacity>
    </View>
  );
}
