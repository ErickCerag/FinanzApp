import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import * as Yup from "yup";
import { Eye, EyeOff } from "lucide-react-native";
import {
  obtenerUsuarioPorCorreo,
  iniciarSesion,
  _debugDumpUsuarios,
} from "@/Service/user/user.service";

const PURPLE = "#6B21A8";
const GRAY_BORDER = "#E5E7EB";

const schema = Yup.object({
  correo: Yup.string().trim().email("Correo inválido").required("Requerido"),
  contra: Yup.string().required("Requerido"),
});
const norm = (s?: string | null) => (s ?? "").normalize("NFKC").trim();

export default function LoginPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ backgroundColor: PURPLE, paddingTop: 48, paddingBottom: 20, paddingHorizontal: 20, alignItems: "center" }}>
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700" }}>FinanzApp</Text>
          <Text style={{ color: "#EDE9FE", marginTop: 4 }}>Tu compañero de ahorro</Text>
        </View>

        <View style={{ alignItems: "center", marginTop: 16, paddingHorizontal: 16 }}>
          <View style={{ width: "100%", maxWidth: 520, backgroundColor: "#fff", padding: 16, borderRadius: 14 }}>
            <Text style={{ fontSize: 20, color: "#111827", fontWeight: "600", marginBottom: 12 }}>Inicio de sesión</Text>

            <Formik
              initialValues={{ correo: "", contra: "" }}
              validationSchema={schema}
              onSubmit={async (values, { setSubmitting, setFieldError }) => {
                try {
                  const correoWanted = values.correo.trim().toLowerCase();
                  const u = await obtenerUsuarioPorCorreo(correoWanted);

                  console.log("[LOGIN DEBUG] input:", {
                    correo_input: values.correo,
                    pass_input_norm: norm(values.contra),
                  });

                  if (!u || norm(u.Contra) !== norm(values.contra)) {
                    await _debugDumpUsuarios();
                    setFieldError("correo", "Credenciales inválidas");
                    setFieldError("contra", " ");
                    return;
                  }

                  await iniciarSesion(u);
                  router.replace("/(tabs)");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
                <View style={{ gap: 14 }}>
                  <Field label="Correo">
                    <TextInput
                      style={inputStyle}
                      value={values.correo}
                      onChangeText={handleChange("correo")}
                      onBlur={handleBlur("correo")}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="ejemplo@email.com"
                      placeholderTextColor="#9CA3AF"
                    />
                    <ErrorText error={touched.correo && errors.correo} />
                  </Field>

                  <Field label="Contraseña">
                    <View style={{ position: "relative" }}>
                      <TextInput
                        style={{ ...inputStyle, paddingRight: 44 }}
                        value={values.contra}
                        onChangeText={handleChange("contra")}
                        onBlur={handleBlur("contra")}
                        secureTextEntry={!showPass}
                        placeholder="••••••••"
                        placeholderTextColor="#9CA3AF"
                      />
                      <TouchableOpacity
                        onPress={() => setShowPass((v) => !v)}
                        style={{ position: "absolute", right: 12, top: 12 }}
                        hitSlop={10}
                      >
                        {showPass ? <EyeOff color="#6B7280" size={22} /> : <Eye color="#6B7280" size={22} />}
                      </TouchableOpacity>
                    </View>
                    <ErrorText error={touched.contra && errors.contra} />
                  </Field>

                  <TouchableOpacity
                    onPress={() => handleSubmit()}
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: PURPLE,
                      borderRadius: 12,
                      paddingVertical: 14,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "700" }}>
                      {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push("/register")}
                    style={{
                      backgroundColor: PURPLE,
                      borderRadius: 12,
                      paddingVertical: 14,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "700" }}>Regístrate</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{label}</Text>
      {children}
    </View>
  );
}
function ErrorText({ error }: { error: any }) {
  if (!error) return null;
  return <Text style={{ marginTop: 6, color: "#DC2626", fontSize: 12 }}>{String(error)}</Text>;
}
const inputStyle = {
  paddingVertical: 14,
  paddingHorizontal: 14,
  borderWidth: 1,
  borderColor: GRAY_BORDER,
  borderRadius: 10,
} as const;
