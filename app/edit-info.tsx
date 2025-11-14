import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/ThemeProvider";
import { useUser } from "@/src/context/UserContext";

export default function EditInfoScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { state, setName, setPhone } = useUser();

  const [firstName, setFirstName] = useState(state.profile.firstName || "");
  const [lastName, setLastName] = useState(state.profile.lastName || "");
  const [phone, setPhoneLocal] = useState(state.profile.phone || "");

  useEffect(() => {
    setFirstName(state.profile.firstName || "");
    setLastName(state.profile.lastName || "");
    setPhoneLocal(state.profile.phone || "");
  }, [state.profile.firstName, state.profile.lastName, state.profile.phone]);

  const saveInfo = () => {
    setName(firstName.trim(), lastName.trim());
    setPhone(phone.trim());
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Geri qayıt düyməsi */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>Məlumatlarım</Text>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.subtext }]}>Ad</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Ad"
          placeholderTextColor={colors.subtext}
        />

        <Text style={[styles.label, { color: colors.subtext }]}>Soyad</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Soyad"
          placeholderTextColor={colors.subtext}
        />

        <Text style={[styles.label, { color: colors.subtext }]}>Nömrə</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          value={phone}
          onChangeText={setPhoneLocal}
          placeholder="+994..."
          keyboardType="phone-pad"
          placeholderTextColor={colors.subtext}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={saveInfo}>
          <Text style={styles.saveText}>Yadda saxla</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  backBtn: {
    position: "absolute",
    top: 20,
    left: 20,
    padding: 6,
    borderRadius: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
  },
  label: {
    fontSize: 13,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
  },
  saveBtn: {
    marginTop: 26,
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
