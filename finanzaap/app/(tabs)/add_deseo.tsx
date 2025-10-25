import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { ArrowLeft, Calendar } from "lucide-react-native";
import { useRouter } from "expo-router";
import { agregarDeseo, crearWishlistSiNoExiste } from "@/Service/wishList/wishlist.service";


export default function AddDeseoScreen() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [saving, setSaving] = useState(false);

  const parseMonto = (s: string) => Number((s || "").replace(/\D+/g, "")) || 0;

  const onGuardar = async () => {
    if (!nombre.trim() || !monto.trim()) {
      Alert.alert("Faltan datos", "Por favor ingresa el nombre y el monto del deseo.");
      return;
    }
    console.log("mamalo")
    try {
      setSaving(true);

      // 👇 Usuario ficticio (aún no hay login)
      const usuarioId = 1;
      const wishlistId = await crearWishlistSiNoExiste(usuarioId);

      const montoNum = parseMonto(monto);
      await agregarDeseo(wishlistId, nombre.trim(), montoNum, fecha.trim() || null, descripcion.trim() || null);

      Alert.alert("Listo", "El deseo fue guardado correctamente.");
      router.back(); // volver a la lista
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo guardar el deseo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View className="bg-violet-700 px-6 pt-12 pb-5 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-4 p-2 rounded-xl">
          <ArrowLeft size={22} color="white" />
        </Pressable>
        <Text className="text-white text-lg font-semibold">Registrar nuevo deseo</Text>
      </View>

      <ScrollView className="px-6" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Nombre */}
        <Text className="mt-6 text-sm text-neutral-700 font-medium">Nombre</Text>
        <TextInput
          value={nombre}
          onChangeText={setNombre}
          placeholder="Computador nuevo"
          className="border-b border-neutral-300 py-2 text-base"
        />

        {/* Monto */}
        <Text className="mt-6 text-sm text-neutral-700 font-medium">Monto requerido</Text>
        <TextInput
          value={monto}
          onChangeText={setMonto}
          keyboardType="numeric"
          placeholder="$ 750.000"
          className="border-b border-neutral-300 py-2 text-base"
        />

        {/* Fecha límite */}
        <Text className="mt-6 text-sm text-neutral-700 font-medium">
          Fecha límite <Text className="text-neutral-500">(Opcional)</Text>
        </Text>
        <View className="flex-row items-center border-b border-neutral-300">
          <TextInput
            value={fecha}
            onChangeText={setFecha}
            placeholder="10/10/2025"
            className="flex-1 py-2 text-base"
          />
          <Calendar size={20} color="#888" />
        </View>

        {/* Descripción */}
        <Text className="mt-6 text-sm text-neutral-700 font-medium">
          Descripción <Text className="text-neutral-500">(Opcional)</Text>
        </Text>
        <TextInput
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Notebook HP i5 de Temu"
          className="border-b border-neutral-300 py-2 text-base"
        />

        {/* Botón */}
        <Pressable
          onPress={onGuardar}
          disabled={saving}
          className="mt-10 bg-violet-700 rounded-xl py-3 items-center shadow-lg active:opacity-90"
        >
          <Text className="text-white font-medium">{saving ? "Guardando..." : "Guardar deseo"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
