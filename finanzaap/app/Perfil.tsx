// app/Perfil.tsx  (o donde tengas tu pantalla de perfil)
import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Image, ScrollView,
  KeyboardAvoidingView, Platform, Alert, StyleSheet, SafeAreaView,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft } from "lucide-react-native";
import BottomNav from "@/components/BarraNav";
import {
  obtenerSesion, upsertUsuario, logoutLocal, getRealUserIdFromSession,
} from "@/Service/user/user.service";
import { Href } from "expo-router";

const PURPLE = "#6B21A8";
const GRAY = "#9CA3AF";
const BORDER = "#E5E7EB";
const BG = "#F9FAFB";

export default function PerfilPage() {
  const router = useRouter();

  const [realId, setRealId] = useState<number | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); // ← aquí sí mostramos el correo real
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Cargar datos guardados DEL USUARIO REAL (no snapshot)
  useEffect(() => {
    const load = async () => {
      const u = await obtenerSesion();         // ← devuelve el real
      const rid = await getRealUserIdFromSession();
      setRealId(rid);
      if (u) {
        setName(u.Nombre || "");
        setEmail(u.Correo || "");
        setAvatar(u.Avatar || null);
      } else {
        setName("");
        setEmail("");
        setAvatar(null);
      }
    };
    load();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Autoriza el acceso a tu galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) setAvatar(result.assets[0].uri);
  };

  const onSave = async () => {
    if (!realId) {
      Alert.alert("Sesión", "No hay sesión activa.");
      return;
    }
    try {
      setSaving(true);
      // ⚠️ Guardamos contra el usuario REAL, no el snapshot (id=1)
      await upsertUsuario({
        id_usuario: realId,
        Nombre: name.trim(),
        Correo: email?.trim().toLowerCase() || null, // puedes permitir editar si quieres
        Avatar: avatar ?? null,
        Apellido: null,
        FechaNacim: null,
        Contra: null, // no cambiamos contraseña aquí
      });
      Alert.alert("Listo", "Datos guardados correctamente.");
    } catch (e: any) {
      console.error(e);
      const msg = String(e?.message ?? e);
      if (/UNIQUE|duplicado/i.test(msg)) {
        Alert.alert("Correo en uso", "Ese correo ya está registrado por otro usuario.");
      } else {
        Alert.alert("Error", "No se pudieron guardar los datos.");
      }
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutLocal();                 // limpia snapshot y session
      await new Promise(r => setTimeout(r, 50));
      router.dismissAll?.();
      router.replace("/login" as Href);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo cerrar sesión.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
        {/* Header morado */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft color="white" size={40} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi perfil</Text>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ ...styles.container, paddingBottom: 140 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              <TouchableOpacity onPress={pickImage} style={styles.avatarButton}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={{ color: GRAY, fontSize: 28 }}>👤</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={pickImage}>
                <Text style={styles.editPhoto}>Editar foto</Text>
              </TouchableOpacity>
            </View>

            {/* Nombre */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Tu nombre"
                style={styles.input}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Correo (del REAL). Puedes dejarlo editable o deshabilitarlo si prefieres. */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Correo</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="correo@dominio.com"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Guardar */}
            <TouchableOpacity onPress={onSave} disabled={saving}
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}>
              <Text style={styles.saveText}>{saving ? "Guardando..." : "Guardar datos"}</Text>
            </TouchableOpacity>

            {/* Cerrar sesión */}
            <TouchableOpacity onPress={onLogout} disabled={loggingOut}
              style={[
                styles.saveBtn,
                { backgroundColor: "#EF4444", marginTop: 10 },
                loggingOut && { opacity: 0.7 },
              ]}>
              <Text style={styles.saveText}>
                {loggingOut ? "Cerrando..." : "Cerrar sesión"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        <BottomNav active="profile" />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: PURPLE,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
  },
  headerTitle: {
    color: "white",
    fontSize: 30,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  container: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    rowGap: 18,
  },
  avatarWrap: { alignItems: "center", gap: 8, width: "100%" },
  avatarButton: {
    width: 112, height: 112, borderRadius: 999,
    borderColor: BORDER, borderWidth: 1, overflow: "hidden", backgroundColor: "white",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  editPhoto: { color: PURPLE, fontSize: 12, textDecorationLine: "underline", marginTop: 6 },
  fieldGroup: { width: "90%", maxWidth: 520 },
  label: { color: GRAY, fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: "white", borderColor: BORDER, borderWidth: 1,
    borderRadius: 12, paddingHorizontal: 14, height: 44, fontSize: 16,
  },
  saveBtn: {
    width: "90%", maxWidth: 520, backgroundColor: PURPLE, borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6, elevation: 1, marginTop: 8,
  },
  saveText: { color: "white", fontWeight: "700" },
});
