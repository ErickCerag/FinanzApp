import { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  InputAccessoryView,
  Keyboard,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ArrowLeft, Calendar } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { agregarDeseo, crearWishlistSiNoExiste } from "@/Service/wishList/wishlist.service";

const PURPLE = "#6B21A8";
const accessoryId = "add-deseo-accessory"; // barra nativa iOS para inputs (excepto monto)

const currencyCLP = (n: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);

const digitsOnly = (s: string) => s.replace(/\D+/g, "");

function diffMonthsInclusive(start: Date, end: Date) {
  if (end <= start) return 1;
  const y1 = start.getFullYear();
  const m1 = start.getMonth();
  const d1 = start.getDate();
  const y2 = end.getFullYear();
  const m2 = end.getMonth();
  const d2 = end.getDate();
  let months = (y2 - y1) * 12 + (m2 - m1);
  if (d2 > d1) months += 1;
  return Math.max(1, months);
}

const isNative = Platform.OS === "ios" || Platform.OS === "android";

export default function AddDeseo() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const nameRef = useRef<TextInput>(null);
  const amountRef = useRef<TextInput>(null);
  const descRef = useRef<TextInput>(null);

  const [name, setName] = useState("Computador nuevo");
  const [amountRaw, setAmountRaw] = useState("750000");
  const [deadline, setDeadline] = useState("2025-10-10");
  const [description, setDescription] = useState("Notebook HP i5 de Temu");
  const [saving, setSaving] = useState(false);

  const [showPicker, setShowPicker] = useState(false);
  const [dateObj, setDateObj] = useState(new Date(deadline));
  const [iosTempDate, setIosTempDate] = useState(dateObj);

  // === Estado para barra "Listo" propia (aparece cuando Monto está enfocado) ===
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);

  useEffect(() => {
    const sh = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hd = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      sh.remove();
      hd.remove();
    };
  }, []);

  const amountNumber = Number(digitsOnly(amountRaw) || "0");
  const amountFormatted = amountNumber > 0 ? currencyCLP(amountNumber) : "";
  const isValid = name.trim().length > 0 && amountNumber > 0;

  const { monthsNeeded, monthlyAmount, warning } = useMemo(() => {
    try {
      const today = new Date();
      const end = deadline ? new Date(deadline) : null;
      if (!end) return { monthsNeeded: null, monthlyAmount: null, warning: "" };

      const months = diffMonthsInclusive(today, end);
      const perMonth = amountNumber > 0 ? Math.ceil(amountNumber / months) : 0;
      let warn = "";
      if (end <= today)
        warn = "La fecha debe ser posterior a hoy; se considera 1 mes para el cálculo.";
      return { monthsNeeded: months, monthlyAmount: perMonth, warning: warn };
    } catch {
      return { monthsNeeded: null, monthlyAmount: null, warning: "" };
    }
  }, [amountNumber, deadline]);

  const handleSave = async () => {
    if (!isValid) {
      Alert.alert("Faltan datos", "Nombre y monto son obligatorios.");
      return;
    }
    try {
      setSaving(true);
      const usuarioId = 1;
      const wishlistId = await crearWishlistSiNoExiste(usuarioId);
      await agregarDeseo(
        wishlistId,
        name.trim(),
        amountNumber,
        deadline?.trim() || null,
        description?.trim() || null
      );
      Alert.alert("✅ Éxito", "Deseo guardado correctamente.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("❌ Error al guardar el deseo:", error);
      Alert.alert("Error", "No se pudo guardar el deseo.");
    } finally {
      setSaving(false);
    }
  };

  const onChangeDateAndroid = (_: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setDateObj(selectedDate);
      setDeadline(selectedDate.toISOString().split("T")[0]);
      setIosTempDate(selectedDate);
    }
  };

  const onChangeWebDate = (e: any) => {
    const val = e?.target?.value as string;
    if (val) {
      setDeadline(val);
      const d = new Date(val);
      setDateObj(d);
      setIosTempDate(d);
    }
  };

  // Mostrar barra propia cuando el campo monto está activo + teclado visible
  const showOwnToolbar = amountFocused && keyboardVisible;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: PURPLE,
          paddingTop: insets.top + 10,
          paddingHorizontal: 16,
          paddingBottom: 18,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          elevation: 2,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{
              padding: 4,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.1)",
            }}
          >
            <ArrowLeft color="#fff" size={28} />
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontSize: 25, fontWeight: "700", marginLeft: 12 }}>
            Registrar nuevo deseo
          </Text>
        </View>
      </View>

      {/* Contenido */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 200 }}
      >
        {/* Nombre */}
        <Text style={{ color: PURPLE, fontWeight: "700", marginBottom: 6 }}>Nombre</Text>
        <TextInput
          ref={nameRef}
          placeholder="Ej. Bicicleta de ruta"
          value={name}
          onChangeText={setName}
          style={styles.input}
          returnKeyType="next"
          onSubmitEditing={() => amountRef.current?.focus()}
          inputAccessoryViewID={Platform.OS === "ios" ? accessoryId : undefined}
        />

        {/* Monto */}
        <Text style={{ color: PURPLE, fontWeight: "700", marginTop: 18, marginBottom: 6 }}>
          Monto requerido
        </Text>
        <TextInput
          ref={amountRef}
          placeholder="$ 0"
          keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
          value={amountFormatted ? ` ${amountFormatted}` : ""}
          onChangeText={(t) => setAmountRaw(digitsOnly(t))}
          style={styles.input}
          inputAccessoryViewID={Platform.OS === "ios" ? accessoryId : undefined}
          onFocus={() => setAmountFocused(true)}
          onBlur={() => setAmountFocused(false)}
        />

        {/* Fecha */}
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 18, marginBottom: 6 }}>
          <Text style={{ color: PURPLE, fontWeight: "700", flex: 1 }}>Fecha límite (Opcional)</Text>
          <TouchableOpacity
            onPress={() => {
              if (isNative) {
                setIosTempDate(dateObj);
                setShowPicker(true);
                Keyboard.dismiss();
              }
            }}
          >
            <Calendar size={20} color={PURPLE} />
          </TouchableOpacity>
        </View>

        {isNative ? (
          <>
            <TouchableOpacity
              onPress={() => {
                setIosTempDate(dateObj);
                setShowPicker(true);
                Keyboard.dismiss();
              }}
            >
              <TextInput
                value={deadline}
                editable={false}
                style={[styles.input, { color: "#111" }]}
              />
            </TouchableOpacity>

            {/* Android */}
            {showPicker && Platform.OS === "android" && (
              <DateTimePicker
                value={dateObj}
                mode="date"
                display="default"
                onChange={onChangeDateAndroid}
              />
            )}

            {/* iOS con botones Cancelar/Listo */}
            {showPicker && Platform.OS === "ios" && (
              <View
                style={{
                  marginTop: 8,
                  borderRadius: 12,
                  backgroundColor: "#fff",
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                }}
              >
                <DateTimePicker
                  value={iosTempDate}
                  mode="date"
                  display="spinner"
                  themeVariant="light"
                  style={{ height: 216, backgroundColor: "#fff" }}
                  onChange={(_e, d) => {
                    if (d) setIosTempDate(d);
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    padding: 8,
                    gap: 16,
                    borderTopWidth: 1,
                    borderTopColor: "#e5e7eb",
                    backgroundColor: "#fff",
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setShowPicker(false);
                      setIosTempDate(dateObj);
                    }}
                  >
                    <Text style={{ color: "#666" }}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setShowPicker(false);
                      setDateObj(iosTempDate);
                      setDeadline(iosTempDate.toISOString().split("T")[0]);
                    }}
                  >
                    <Text style={{ color: PURPLE, fontWeight: "700" }}>Listo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : (
          // Web
          // @ts-ignore
          <input
            type="date"
            value={deadline}
            onChange={onChangeWebDate}
            style={{
              width: "100%",
              padding: "10px 0",
              border: "none",
              borderBottom: "1px solid #e5e7eb",
              fontSize: 16,
              color: "#111827",
              outline: "none",
              background: "transparent",
            }}
          />
        )}

        {/* Plan sugerido */}
        {monthsNeeded != null && monthlyAmount != null && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 12, color: PURPLE, fontWeight: "700" }}>
              Plan sugerido
            </Text>
            <Text style={{ marginTop: 4, color: "#111" }}>
              Debes ahorrar {currencyCLP(monthlyAmount)} al mes durante {monthsNeeded}{" "}
              {monthsNeeded === 1 ? "mes" : "meses"} para llegar a {currencyCLP(amountNumber)} el{" "}
              {deadline || "-"}.
            </Text>
            {!!warning && <Text style={{ marginTop: 4, color: "#b45309" }}>{warning}</Text>}
          </View>
        )}

        {/* Descripción */}
        <Text style={{ color: PURPLE, fontWeight: "700", marginTop: 18, marginBottom: 6 }}>
          Descripción (Opcional)
        </Text>
        <TextInput
          ref={descRef}
          placeholder="Notas del deseo…"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, { height: 100, textAlignVertical: "top" }]}
          multiline
          returnKeyType="done"
          blurOnSubmit
          onSubmitEditing={() => Keyboard.dismiss()}
          inputAccessoryViewID={Platform.OS === "ios" ? accessoryId : undefined}
        />

        {/* Botón Guardar */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isValid || saving}
          style={[styles.button, { opacity: !isValid || saving ? 0.6 : 1 }]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700" }}>Guardar deseo</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Barra nativa iOS para inputs (Nombre/Descripción) */}
      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={accessoryId}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              padding: 10,
              backgroundColor: "#F8F8F8",
              borderTopWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <TouchableOpacity onPress={() => Keyboard.dismiss()}>
              <Text style={{ color: PURPLE, fontWeight: "700" }}>Listo</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}

      {/* ✅ Barra propia “Cancelar / Listo” para MONTO (numérico) – iOS & Android */}
      {showOwnToolbar && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: insets.bottom,
            backgroundColor: "#F8F8F8",
            borderTopWidth: 1,
            borderColor: "#e5e7eb",
            paddingHorizontal: 12,
            paddingVertical: 10,
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              amountRef.current?.blur();
              Keyboard.dismiss();
            }}
          >
            <Text style={{ color: "#666" }}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              amountRef.current?.blur();
              Keyboard.dismiss();
            }}
          >
            <Text style={{ color: PURPLE, fontWeight: "700" }}>Listo</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = {
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 10,
    fontSize: 20,
    color: "#111827",
  } as const,
  button: {
    marginTop: 24,
    backgroundColor: PURPLE,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: PURPLE,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  } as const,
};
