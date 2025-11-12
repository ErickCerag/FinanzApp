import React, { useRef, useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  InputAccessoryView,
  Keyboard,
  Modal,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Calendar } from "lucide-react-native";
import {
  crearWishlistSiNoExiste,
  agregarDeseo,
} from "@/Service/wishList/wishlist.service";
import { obtenerSesion } from "@/Service/user/user.service";

const PURPLE = "#6B21A8";
const GRAY_BORDER = "#E5E7EB";
const isIOS = Platform.OS === "ios";
const isWeb = Platform.OS === "web";

const onlyDigits = (s: string) => s.replace(/\D+/g, "");
const currency = (v: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(v);

function DoneBar({ nativeID, onDone }: { nativeID: string; onDone: () => void }) {
  if (!isIOS) return null;
  return (
    <InputAccessoryView nativeID={nativeID}>
      <View style={styles.accessoryBar}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onDone}>
          <Text style={styles.accessoryBtn}>Listo</Text>
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
}

export default function AddWish() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // 📌 usuario REAL desde sesión
  const [userId, setUserId] = useState<number | null>(null);
  useEffect(() => {
    (async () => {
      const u = await obtenerSesion();
      setUserId(u?.id_usuario ?? null);
    })();
  }, []);

  const [name, setName] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [fecha, setFecha] = useState<Date | null>(null);
  const [descripcion, setDescripcion] = useState("");

  const [showPicker, setShowPicker] = useState(false);

  const refMonto = useRef<TextInput>(null);
  const refDesc = useRef<TextInput>(null);

  /* === Guardar deseo === */
  const onSave = async () => {
    if (!userId) {
      Alert.alert("Sesión", "Primero inicia sesión para guardar tu deseo.");
      return;
    }

    const monto = Number(onlyDigits(amountRaw) || "0");
    const nombre = name.trim();
    if (!nombre || monto <= 0) {
      Alert.alert("Completa los datos", "Nombre y monto son obligatorios.");
      return;
    }

    try {
      const idWishlist = await crearWishlistSiNoExiste(userId);
      const fechaStr = fecha ? fecha.toISOString().slice(0, 10) : null;
      await agregarDeseo(idWishlist, nombre, monto, fechaStr, descripcion.trim() || null);
      Alert.alert("Listo", "Deseo agregado correctamente.");
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo guardar el deseo.");
    }
  };

  /* === Formato de fecha dd-MM-yyyy === */
  const formatFecha = (d?: Date | null) => {
    if (!d) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  /* ✅ Fecha segura para el DateTimePicker (evita 1969) */
  const pickerDate = useMemo(() => {
    if (fecha && !isNaN(fecha.getTime())) return fecha;
    return new Date();
  }, [fecha]);

  /* === Cálculo del plan sugerido === */
  const planSugerido = useMemo(() => {
    const monto = Number(onlyDigits(amountRaw) || "0");
    if (!fecha || monto <= 0) return null;

    const hoy = new Date();
    const diffMeses =
      fecha.getFullYear() * 12 +
      fecha.getMonth() -
      (hoy.getFullYear() * 12 + hoy.getMonth());
    const meses = diffMeses > 0 ? diffMeses : 1;
    const ahorroMensual = monto / meses;

    return {
      meses,
      ahorroMensual,
      texto: `Debes ahorrar ${currency(ahorroMensual)} al mes durante ${meses} mes${
        meses > 1 ? "es" : ""
      } para alcanzar tu meta.`,
    };
  }, [amountRaw, fecha]);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* HEADER */}
      <View
        style={{
          backgroundColor: PURPLE,
          paddingTop: insets.top + 10,
          paddingHorizontal: 16,
          paddingBottom: 18,
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
            style={{
              padding: 4,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.1)",
            }}
          >
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text
            style={{
              color: "#fff",
              fontSize: 24,
              fontWeight: "800",
              marginLeft: 12,
            }}
          >
            Registrar nuevo deseo
          </Text>
        </View>
      </View>

      {/* CONTENIDO */}
      <KeyboardAvoidingView
        behavior={isIOS ? "padding" : "height"}
        keyboardVerticalOffset={isIOS ? insets.top + 12 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 16,
            paddingBottom: (insets.bottom || 0) + 40,
          }}
        >
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ej: Computador nuevo"
            style={styles.input}
            returnKeyType="next"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Monto requerido</Text>
          <TextInput
            ref={refMonto}
            value={
              Number(onlyDigits(amountRaw) || "0") > 0
                ? currency(Number(onlyDigits(amountRaw)))
                : ""
            }
            onChangeText={(t) => setAmountRaw(onlyDigits(t))}
            placeholder="$ 0"
            keyboardType={isIOS ? "number-pad" : "numeric"}
            style={styles.input}
            inputAccessoryViewID={isIOS ? "acc-addwish" : undefined}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Fecha límite (Opcional)</Text>

          {isWeb ? (
            <input
              type="date"
              value={fecha ? fecha.toISOString().slice(0, 10) : ""}
              onChange={(e) => setFecha(new Date(e.target.value))}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: 16,
                borderWidth: 1,
                borderColor: GRAY_BORDER,
                borderRadius: 8,
              }}
            />
          ) : (
            <>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TextInput
                  value={formatFecha(fecha)}
                  editable={false}
                  placeholder="dd-mm-aaaa"
                  style={[styles.input, { flex: 1 }]}
                />
                <TouchableOpacity
                  onPress={() => setShowPicker(true)}
                  style={{ padding: 8, marginLeft: 8 }}
                >
                  <Calendar size={20} color={PURPLE} />
                </TouchableOpacity>
              </View>

              {showPicker && (
                <Modal transparent animationType="slide">
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "rgba(0,0,0,0.4)",
                      justifyContent: "flex-end",
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "#fff",
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        padding: 16,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <TouchableOpacity onPress={() => setShowPicker(false)}>
                          <Text style={{ color: "#666" }}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowPicker(false)}>
                          <Text style={{ color: PURPLE, fontWeight: "700" }}>Hecho</Text>
                        </TouchableOpacity>
                      </View>

                      <View
                        style={{
                          backgroundColor: "#fff",
                          borderRadius: 12,
                          overflow: "hidden",
                        }}
                      >
                        <DateTimePicker
                          value={pickerDate}   
                          mode="date"
                          display={Platform.OS === "ios" ? "spinner" : "calendar"}
                          textColor="#111"
                          themeVariant="light"
                          onChange={(event, selectedDate) => {
                            if (Platform.OS === "android") {
                              if (event.type === "set" && selectedDate) setFecha(selectedDate);
                              setShowPicker(false);
                            } else if (selectedDate) {
                              setFecha(selectedDate);
                            }
                          }}
                          style={{ backgroundColor: "#fff", height: 220 }}
                        />
                      </View>
                    </View>
                  </View>
                </Modal>
              )}
            </>
          )}

          {planSugerido && (
            <View
              style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: "#F9FAFB",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Text style={{ color: "#374151", fontSize: 14 }}>
                <Text style={{ color: PURPLE, fontWeight: "700" }}>Plan sugerido: </Text>
                {planSugerido.texto}
              </Text>
            </View>
          )}

          <Text style={[styles.label, { marginTop: 16 }]}>Descripción (Opcional)</Text>
          <TextInput
            ref={refDesc}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Escribe los detalles de tu deseo…"
            style={styles.textarea}
            multiline
            textAlignVertical="top"
            inputAccessoryViewID={isIOS ? "acc-addwish" : undefined}
          />

          <TouchableOpacity style={styles.btnPrimary} onPress={onSave}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Guardar</Text>
          </TouchableOpacity>
        </ScrollView>

        <DoneBar
          nativeID="acc-addwish"
          onDone={() => {
            refMonto.current?.blur();
            refDesc.current?.blur();
            Keyboard.dismiss();
          }}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

/* ==== Estilos ==== */
const styles = StyleSheet.create({
  label: {
    color: PURPLE,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: GRAY_BORDER,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
  },
  textarea: {
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    borderRadius: 12,
    padding: 12,
    minHeight: 140,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#fff",
  },
  btnPrimary: {
    backgroundColor: PURPLE,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  accessoryBar: {
    backgroundColor: "#F6F6F8",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#D1D5DB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  accessoryBtn: {
    color: PURPLE,
    fontWeight: "700",
    fontSize: 16,
  },
});
