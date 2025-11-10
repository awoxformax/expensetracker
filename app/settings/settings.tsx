import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { setItem, getItem } from "@/src/lib/storage";
import { Stack } from "expo-router";

export default function Settings() {
  const [pin, setPin] = useState("");

  async function savePin() {
    if (pin.length < 4) return Alert.alert("Xəta", "PIN ən azı 4 rəqəm olmalıdır.");
    await setItem("userPIN", pin);
    Alert.alert("✅ Uğurlu", "PIN yadda saxlanıldı.");
  }

  async function enableBiometric() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return Alert.alert("Xəta", "Bu cihaz biometrik identifikasiyanı dəstəkləmir.");
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return Alert.alert("Xəbərdarlıq", "Barmaq izi əlavə edilməyib.");
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Barmaq izi ilə təsdiqlə",
    });
    result.success
      ? Alert.alert("✅ Aktiv edildi", "Biometrik giriş uğurla aktiv edildi.")
      : Alert.alert("❌ Uğursuz", "Təsdiqləmə alınmadı.");
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "PIN və biometrika" }} />
      <View style={styles.inner}>
        <Text style={styles.label}>Yeni PIN</Text>
        <TextInput
          value={pin}
          onChangeText={setPin}
          secureTextEntry
          keyboardType="numeric"
          maxLength={6}
          style={styles.input}
        />
        <TouchableOpacity style={styles.saveBtn} onPress={savePin}>
          <Text style={styles.saveText}>Yadda saxla</Text>
        </TouchableOpacity>

        <Text style={[styles.label, { marginTop: 20 }]}>Biometrik (barmaq izi)</Text>
        <TouchableOpacity style={styles.bioBtn} onPress={enableBiometric}>
          <Text style={styles.bioText}>Aktiv et</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6F9", alignItems: "center", justifyContent: "center" },
  inner: { width: "85%", backgroundColor: "#fff", padding: 20, borderRadius: 16, elevation: 3 },
  label: { color: "#0F172A", marginBottom: 6, fontWeight: "700" },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  bioBtn: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  bioText: { color: "#111827", fontWeight: "700" },
});
