import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { getItem, setItem } from "@/src/lib/storage";

type Profile = { firstName: string; lastName: string; phone: string };

export default function Info() {
  const [data, setData] = useState<Profile>({
    firstName: "Məmməd",
    lastName: "Əhmədli",
    phone: "+994102284679",
  });

  useEffect(() => {
    (async () => {
      const saved = await getItem<Profile>("profile", data);
      setData(saved);
    })();
  }, []);

  async function save() {
    await setItem("profile", data);
    Alert.alert("✅ Uğurlu", "Məlumatlar yadda saxlanıldı.");
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Məlumatlarım" }} />
      <View style={styles.inner}>
        <Field label="Ad" value={data.firstName} onChange={(v) => setData({ ...data, firstName: v })} />
        <Field label="Soyad" value={data.lastName} onChange={(v) => setData({ ...data, lastName: v })} />
        <Field
          label="Nömrə"
          value={data.phone}
          onChange={(v) => setData({ ...data, phone: v })}
          keyboardType="phone-pad"
        />
        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveText}>Yadda saxla</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Field({ label, value, onChange, keyboardType }: any) {
  return (
    <View style={{ marginBottom: 15, width: "100%" }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        style={styles.input}
      />
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
    color: "#111827",
  },
  saveBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
