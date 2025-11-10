import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { setItem } from "@/src/lib/storage";
import { ui } from "@/src/lib/color";

export default function PinSetup() {
  const [pin, setPin] = useState("");
  const router = useRouter();

  async function onContinue() {
    if (pin.length < 4 || /\D/.test(pin)) return Alert.alert("Xəta","PIN 4+ rəqəm olmalıdır.");
    await setItem("pin", pin);
    await setItem("pinSet", true);
    router.replace("/"); // Home-a buraxırıq
  }

  return (
    <View style={{ flex:1, backgroundColor:ui.bg, padding:20, justifyContent:"center" }}>
      <Stack.Screen options={{ title:"PIN təyin et" }} />
      <Text style={{ color:ui.text, fontWeight:"800", fontSize:20, marginBottom:8 }}>Təhlükəsizlik üçün PIN təyin et</Text>
      <TextInput value={pin} onChangeText={setPin} keyboardType="number-pad" secureTextEntry
        style={{ backgroundColor:ui.card, borderColor:ui.cardBorder, borderWidth:1, borderRadius:12, padding:14, color:ui.text }} />
      <TouchableOpacity style={{ backgroundColor:ui.primary, padding:14, borderRadius:12, alignItems:"center", marginTop:12 }} onPress={onContinue}>
        <Text style={{ color:"#fff", fontWeight:"700" }}>Davam et</Text>
      </TouchableOpacity>
    </View>
  );
}
