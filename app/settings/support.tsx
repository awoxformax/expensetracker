import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { ui } from "@/src/lib/color";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const PHONE = "+994102284679";

export default function Support() {
  const openWA = () => Linking.openURL(`whatsapp://send?phone=${PHONE.replace(/\D/g,"")}`);
  const openIG = () => Linking.openURL("https://instagram.com/onlymamed");

  return (
    <View style={{ flex:1, backgroundColor:ui.bg, padding:20 }}>
      <Stack.Screen options={{ title:"Dəstək" }} />

      <TouchableOpacity onPress={openWA}
        style={{ backgroundColor:ui.card, borderColor:ui.cardBorder, borderWidth:1, borderRadius:12, padding:14, flexDirection:"row", alignItems:"center", marginBottom:12 }}>
        <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
        <Text style={{ marginLeft:10, color:ui.text }}>{PHONE}</Text>
      </TouchableOpacity>

      <View style={{ alignItems:"center", marginTop:20 }}>
        <Text style={{ color:ui.textMuted }}>Biz hər yerdəyik</Text>
        <View style={{ flexDirection:"row", marginTop:10 }}>
          <TouchableOpacity onPress={openIG} style={{ marginRight:18 }}>
            <Ionicons name="logo-instagram" size={26} color="#C13584" />
          </TouchableOpacity>
          <TouchableOpacity onPress={openWA}>
            <Ionicons name="logo-whatsapp" size={26} color="#25D366" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={{ textAlign:"center", color:"#9CA3AF", marginTop:24 }}>
        ExpenseTracker version 1.0.0
      </Text>
    </View>
  );
}
