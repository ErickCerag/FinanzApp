// app/register.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import * as Yup from "yup";
import { Eye, EyeOff, Calendar } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

// ⬇️ Servicio de usuarios
import {
  registrarUsuario,
  obtenerUsuarioPorCorreo,
  upsertUsuario,
  obtenerUsuario,
  iniciarSesion,
} from "@/Service/user/user.service";

const PURPLE = "#6B21A8";
const GRAY_BORDER = "#E5E7EB";

const schema = Yup.object({
  nombre: Yup.string().trim().required("Requerido"),
  apellido: Yup.string().trim().required("Requerido"),
  fechaNac: Yup.string().required("Requerido"),
  correo: Yup.string().trim().email("Correo inválido").required("Requerido"),
  contra: Yup.string().min(6, "Mínimo 6 caracteres").required("Requerido"),
});

export default function RegisterPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // Helpers formato fecha
  const formatDisplayDate = (iso?: string) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}-${m}-${y}`;
  };
  const toISO = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header morado */}
        <View
          style={{
            backgroundColor: PURPLE,
            paddingTop: 48,
            paddingBottom: 20,
            paddingHorizontal: 20,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700" }}>
            FinanzApp
          </Text>
          <Text style={{ color: "#EDE9FE", marginTop: 4 }}>
            Tu compañero de ahorro
          </Text>
        </View>

        <View
          style={{
            alignItems: "center",
            marginTop: 16,
            paddingHorizontal: 16,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 520,
              backgroundColor: "#fff",
              padding: 16,
              borderRadius: 14,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                color: "#111827",
                fontWeight: "600",
                marginBottom: 12,
              }}
            >
              Registro
            </Text>

            <Formik
              initialValues={{
                nombre: "",
                apellido: "",
                fechaNac: "",
                correo: "",
                contra: "",
                // Si ya tienes UI para avatar en registro, puedes
                // agregar aquí un campo avatarUri y usarlo más abajo.
                avatarUri: "" as string | undefined,
              }}
              validationSchema={schema}
              onSubmit={async (values, { setSubmitting, setFieldError }) => {
                try {
                  // 1) Validar que el correo no exista
                  const existe = await obtenerUsuarioPorCorreo(values.correo);
                  if (existe) {
                    setFieldError("correo", "Ya existe una cuenta con este correo");
                    return;
                  }

                  // 2) Insertar usuario real
                  const newId = await registrarUsuario({
                    nombre: values.nombre,
                    apellido: values.apellido,
                    fechaNac: values.fechaNac,
                    correo: values.correo,
                    contra: values.contra,
                  });

                  // 3) (Opcional) Si tienes avatar en el registro, súbelo al usuario real
                  if (values.avatarUri) {
                    await upsertUsuario({
                      id_usuario: newId,
                      Nombre: values.nombre,
                      Correo: values.correo.toLowerCase(),
                      Avatar: values.avatarUri,
                      Apellido: values.apellido,
                      FechaNacim: values.fechaNac,
                      Contra: null,
                    });
                  }

                  // 4) Cargar el usuario recién creado y ponerlo en sesión
                  const u = await obtenerUsuario(newId);
                  if (u) {
                    await iniciarSesion(u);      // ← Esto “inyecta” snapshot id=1 con Avatar/Nombre, etc.
                  }

                  // 5) Ir a tabs (o a donde apunte tu inicio)
                  router.replace("/(tabs)");
                } catch (e) {
                  setFieldError("correo", "No se pudo registrar. Intenta nuevamente.");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                isSubmitting,
                setFieldValue,
              }) => (
                <View style={{ gap: 14 }}>
                  {/* Nombre */}
                  <Field label="Nombre">
                    <TextInput
                      style={inputStyle}
                      value={values.nombre}
                      onChangeText={handleChange("nombre")}
                      onBlur={handleBlur("nombre")}
                      placeholder="Tu nombre"
                      placeholderTextColor="#9CA3AF"
                    />
                    <ErrorText error={touched.nombre && errors.nombre} />
                  </Field>

                  {/* Apellido */}
                  <Field label="Apellido">
                    <TextInput
                      style={inputStyle}
                      value={values.apellido}
                      onChangeText={handleChange("apellido")}
                      onBlur={handleBlur("apellido")}
                      placeholder="Tu apellido"
                      placeholderTextColor="#9CA3AF"
                    />
                    <ErrorText error={touched.apellido && errors.apellido} />
                  </Field>

                  {/* Fecha de nacimiento */}
                  <Field label="Fecha de nacimiento">
                    {Platform.OS === "web" ? (
                      <input
                        type="date"
                        value={values.fechaNac}
                        onChange={(e: any) => setFieldValue("fechaNac", e.target.value)}
                        style={{
                          width: "100%",
                          padding: 14,
                          border: "1px solid #E5E7EB",
                          borderRadius: 10,
                          outline: "none",
                        }}
                      />
                    ) : (
                      <>
                        <TouchableOpacity
                          onPress={() => setShowPicker(true)}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderWidth: 1,
                            borderColor: GRAY_BORDER,
                            borderRadius: 10,
                            paddingVertical: 14,
                            paddingHorizontal: 14,
                          }}
                        >
                          <Text
                            style={{
                              color: values.fechaNac ? "#111827" : "#9CA3AF",
                            }}
                          >
                            {values.fechaNac
                              ? formatDisplayDate(values.fechaNac)
                              : "Selecciona una fecha"}
                          </Text>
                          <Calendar size={20} color="#6B7280" />
                        </TouchableOpacity>

                        {showPicker && (
                          <DateTimePicker
                            value={values.fechaNac ? new Date(values.fechaNac) : new Date()}
                            mode="date"
                            display={Platform.OS === "ios" ? "inline" : "calendar"}
                            maximumDate={new Date()}
                            onChange={(_, selectedDate) => {
                              setShowPicker(false);
                              if (selectedDate) {
                                setFieldValue("fechaNac", toISO(selectedDate));
                              }
                            }}
                          />
                        )}
                      </>
                    )}
                    <ErrorText error={touched.fechaNac && errors.fechaNac} />
                  </Field>

                  {/* Correo */}
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

                  {/* Contraseña */}
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

                  {/* Botón */}
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
                      {isSubmitting ? "Registrando..." : "Registrarse"}
                    </Text>
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
  return (
    <Text style={{ marginTop: 6, color: "#DC2626", fontSize: 12 }}>
      {String(error)}
    </Text>
  );
}

const inputStyle = {
  paddingVertical: 14,
  paddingHorizontal: 14,
  borderWidth: 1,
  borderColor: GRAY_BORDER,
  borderRadius: 10,
} as const;
