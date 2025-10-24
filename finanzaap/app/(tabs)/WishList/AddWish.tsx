import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
// 👇 importa el picker (no falla en nativo; en web lo evitamos al renderizar)
import DateTimePicker from "@react-native-community/datetimepicker";
import { ArrowLeft, Calendar } from "lucide-react";

type WishlistItem = {
  name: string;
  amount: number;
  deadline?: string | null; // YYYY-MM-DD
  description?: string | null;
};

const saveWishlistItem = async (item: WishlistItem) => {
  await new Promise((r) => setTimeout(r, 800));
  return true;
};

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

  const [name, setName] = useState("Computador nuevo");
  const [amountRaw, setAmountRaw] = useState("750000");
  const [deadline, setDeadline] = useState("2025-10-24"); // yyyy-MM-dd
  const [description, setDescription] = useState("Notebook HP i5 de Temu");
  const [saving, setSaving] = useState(false);

  // 📅 control picker nativo
  const [showPicker, setShowPicker] = useState(false);
  const [dateObj, setDateObj] = useState(new Date(deadline));

  const amountNumber = Number(digitsOnly(amountRaw) || "0");
  const amountFormatted = amountNumber > 0 ? currencyCLP(amountNumber) : "";
  const isValid = name.trim().length > 0 && amountNumber > 0;

  const { monthsNeeded, monthlyAmount, warning } = useMemo(() => {
    try {
      const today = new Date();
      const end = deadline ? new Date(deadline) : null;
      if (!end) return { monthsNeeded: null, monthlyAmount: null, warning: "" };

      const months = diffMonthsInclusive(
        new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        new Date(end.getFullYear(), end.getMonth(), end.getDate())
      );

      const perMonth = amountNumber > 0 ? Math.ceil(amountNumber / months) : 0;

      let warn = "";
      if (end <= today) warn = "La fecha debe ser posterior a hoy; se considera 1 mes para el cálculo.";
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
      await saveWishlistItem({
        name: name.trim(),
        amount: amountNumber,
        deadline: deadline?.trim() || null,
        description: description?.trim() || null,
      });
      Alert.alert("Éxito", "Deseo guardado correctamente.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "No se pudo guardar el deseo.");
    } finally {
      setSaving(false);
    }
  };

  const onChangeDate = (_: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setDateObj(selectedDate);
      const formatted = selectedDate.toISOString().split("T")[0];
      setDeadline(formatted);
    }
  };

  // 👇 manejador para web (input date)
  const onChangeWebDate = (e: any) => {
    const val = e?.target?.value as string; // yyyy-MM-dd
    if (val) {
      setDeadline(val);
      setDateObj(new Date(val));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* AppBar */}
      <View
        style={{
          backgroundColor: "#6B21A8",
          paddingHorizontal: 16,
          paddingVertical: 20,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <ArrowLeft color="#fff" size={22} />
          </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700", marginLeft: 12 }}>
            Registrar nuevo deseo
          </Text>
        </View>
      </View>

      {/* Form */}
      <View style={{ padding: 18 }}>
        {/* Nombre */}
        <Text style={{ color: "#6B21A8", fontWeight: "700", marginBottom: 6, fontSize:20 }}>Nombre</Text>
        <TextInput placeholder="Ej. Bicicleta de ruta" value={name} onChangeText={setName} style={styles.input} />

        {/* Monto requerido */}
        <Text style={{ color: "#6B21A8", fontWeight: "700", marginTop: 18, marginBottom: 6 , fontSize:20}}>
          Monto requerido
        </Text>
        <TextInput
          placeholder="$ 0"
          keyboardType="numeric"
          value={amountFormatted ? ` ${amountFormatted}` : ""}
          onChangeText={(t) => setAmountRaw(digitsOnly(t))}
          style={styles.input}
        />

        {/* Fecha límite */}
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 18, marginBottom: 6 }}>
          <Text style={{ color: "#6B21A8", fontWeight: "700", flex: 1, fontSize:20 }}>Fecha límite (Opcional)</Text>
          <TouchableOpacity onPress={() => isNative ? setShowPicker(true) : null}>
          </TouchableOpacity>
        </View>

        {/* Campo de fecha */}
        {isNative ? (
          <>
            <TouchableOpacity onPress={() => setShowPicker(true)}>
              <TextInput value={deadline} editable={false} style={[styles.input, { color: "#111" }]} />
          
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                value={dateObj}
                mode="date"
                
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onChangeDate}
                
              />
            )}
          </>
        ) : (
          // 🌐 Web: input nativo del navegador
          // @ts-ignore  — usamos input HTML directamente en RN Web
          <input
            type="date"
            value={deadline}
            onChange={onChangeWebDate}
            style={{
              width: "100%",
              padding: "10px 0",
              border: "none",
              borderBottom: "1px solid #e5e7eb",
              fontSize: 18,
              color: "#111827",
              outline: "none",
              background: "transparent",
            }}
          />
        )}

        {/* Desglose de ahorro mensual */}
        {monthsNeeded != null && monthlyAmount != null && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 20, color: "#6B21A8", fontWeight: "700" }}>Plan sugerido</Text>
            <Text style={{ marginTop: 4, color: "#111", fontSize:16 }}>
              Debes ahorrar {currencyCLP(monthlyAmount)} al mes durante {monthsNeeded}{" "}
              {monthsNeeded === 1 ? "mes" : "meses"} para llegar a {currencyCLP(amountNumber)} el {deadline || "-"}.
            </Text>
            {!!warning && <Text style={{ marginTop: 4, color: "#b45309" }}>{warning}</Text>}
          </View>
        )}

        {/* Descripción */}
        <Text style={{ color: "#6B21A8", fontWeight: "700", marginTop: 18, marginBottom: 6,fontSize:20 }}>
          Descripción (Opcional)
        </Text>
        <TextInput
          placeholder="Notas del deseo…"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, { height: 80, textAlignVertical: "top" }]}
          multiline
          numberOfLines={4}
        />

        {/* Guardar */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isValid || saving}
          style={[styles.button, { opacity: !isValid || saving ? 0.6 : 1 }]}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize:20 }}>Guardar deseo</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = {
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
  } as const,
  button: {
    marginTop: 24,
    backgroundColor: "#6B21A8",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#6B21A8",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  } as const,
};
