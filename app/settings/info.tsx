import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { Stack } from "expo-router";
import { getItem, setItem } from "@/src/lib/storage";

type Profile = { firstName: string; lastName: string; phone: string };

export default function Info() {
  const [data, setData] = useState<Profile>({ firstName: "Məmməd", lastName: "Əhmədli", phone: "+994102284679" });

  useEffect(() => {
    (async () => {
      const saved = await getItem<Profile>("profile", data);
      setData(saved);
    })();
  }, []);

  async function save() {
    await setItem("profile", data);
    // TODO: backend-ə POST/PUT göndər (əgər server var)
    Alert.alert("Uğurlu", "Məlumatlar yadda saxlanıldı.");
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F4F6F9", padding: 20 }}>
      <Stack.Screen options={{ title: "Məlumatlarım" }} />
      <Field label="Ad" value={data.firstName} onChange={(v) => setData({ ...data, firstName: v })} />
      <Field label="Soyad" value={data.lastName} onChange={(v) => setData({ ...data, lastName: v })} />
      <Field label="Nömrə" value={data.phone} onChange={(v) => setData({ ...data, phone: v })} keyboardType="phone-pad" />
      <TouchableOpacity style={{ backgroundColor: "#2563EB", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 6 }} onPress={save}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>Yadda saxla</Text>
      </TouchableOpacity>
    </View>
  );
}

function Field({ label, value, onChange, keyboardType }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: "#0F172A", marginBottom: 6, fontWeight: "700" }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E9EEF5", borderWidth: 1, borderRadius: 12, padding: 12, color: "#0F172A" }}
      />
    </View>
  );
}
