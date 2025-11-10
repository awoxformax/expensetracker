import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { setItem, getItem } from "@/src/lib/storage";
import { Stack } from "expo-router";

export default function Language() {
  const [lang, setLang] = useState("az");
  const languages = [
    { code: "az", name: "Azərbaycan" },
    { code: "en", name: "English" },
    { code: "ru", name: "Русский" },
  ];

  useEffect(() => {
    (async () => {
      const stored = await getItem("appLang", "az");
      setLang(stored);
    })();
  }, []);

  async function changeLang(code: string) {
    setLang(code);
    await setItem("appLang", code);
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Dil seçimi" }} />
      {languages.map((item) => (
        <TouchableOpacity
          key={item.code}
          style={[
            styles.item,
            { backgroundColor: lang === item.code ? "#E0E7FF" : "#fff" },
          ]}
          onPress={() => changeLang(item.code)}
        >
          <Text style={styles.text}>{item.name}</Text>
          {lang === item.code && <Text style={styles.selected}>Seçildi</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6F9", padding: 20 },
  item: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  text: { color: "#0F172A", fontWeight: "600" },
  selected: { color: "#2563EB", fontWeight: "700" },
});
