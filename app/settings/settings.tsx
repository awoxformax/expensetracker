import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { ui } from "@/src/lib/color";
import { getItem, setItem } from "@/src/lib/storage";
import { Stack } from "expo-router";

export default function Settings() {
  const [pin, setPin] = useState("");
  const [biometric, setBiometric] = useState(false);

  useEffect(()=>{
    (async ()=>{
      const savedPin = await getItem<string>("pin", "");
      if (savedPin) setPin("••••"); // göstərmirik
      const bio = await getItem<boolean>("biometric", false);
      setBiometric(bio);
    })();
  },[]);

  async function savePin() {
    if (pin.length < 4 || /\D/.test(pin)) return Alert.alert("Xəta","PIN 4+ rəqəm olmalıdır.");
    await setItem("pin", pin);
    Alert.alert("Uğurlu","PIN təyin olundu.");
  }

  async function enableBiometric() {
    const has = await LocalAuthentication.hasHardwareAsync();
    if (!has) return Alert.alert("Xəta","Cihaz biometrik dəstəkləmir.");
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return Alert.alert("Xəbərdarlıq","Cihazda biometrik qeyd yoxdur.");
    await setItem("biometric", true);
    setBiometric(true);
    Alert.alert("Uğurlu","Barmaq izi aktivdir.");
  }

  return (
    <View style={{ flex:1, backgroundColor:ui.bg, padding:20 }}>
      <Stack.Screen options={{ title:"Tənzimləmələr" }} />

      <Text style={{ color:ui.text, fontWeight:"700", marginBottom:8 }}>PIN təyin et</Text>
      <TextInput placeholder="Yeni PIN" secureTextEntry keyboardType="number-pad" onChangeText={setPin}
        style={{ backgroundColor:ui.card, borderColor:ui.cardBorder, borderWidth:1, borderRadius:12, padding:12, color:ui.text, marginBottom:8 }} />
      <TouchableOpacity style={{ backgroundColor:ui.primary, padding:14, borderRadius:12, alignItems:"center" }} onPress={savePin}>
        <Text style={{ color:"#fff", fontWeight:"700" }}>Yadda saxla</Text>
      </TouchableOpacity>

      <View style={{ height:24 }} />

      <Text style={{ color:ui.text, fontWeight:"700", marginBottom:8 }}>Biometrik (barmaq izi)</Text>
      <TouchableOpacity style={{ backgroundColor: biometric ? ui.success : ui.card, padding:14, borderRadius:12, alignItems:"center",
        borderWidth:1, borderColor:ui.cardBorder }} onPress={enableBiometric}>
        <Text style={{ color: biometric ? "#fff" : ui.text }}>Aktiv et</Text>
      </TouchableOpacity>
    </View>
  );
}
