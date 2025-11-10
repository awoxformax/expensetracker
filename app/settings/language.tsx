import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ui } from "@/src/lib/color";
import { getItem, setItem } from "@/src/lib/storage";
import { Stack } from "expo-router";

const langs = [
  { code:"az", name:"Azərbaycan" },
  { code:"en", name:"English" },
  { code:"ru", name:"Русский" },
];

export default function Language() {
  const [cur, setCur] = useState("az");
  useEffect(()=>{ (async()=> setCur(await getItem("lang","az")))(); },[]);
  async function pick(code:string){
    setCur(code); await setItem("lang", code);
  }
  return (
    <View style={{ flex:1, backgroundColor:ui.bg, padding:20 }}>
      <Stack.Screen options={{ title:"Dil" }} />
      {langs.map(l=>(
        <TouchableOpacity key={l.code} onPress={()=>pick(l.code)}
          style={{ backgroundColor:ui.card, borderColor:ui.cardBorder, borderWidth:1, borderRadius:12, padding:14, marginBottom:10,
          flexDirection:"row", justifyContent:"space-between" }}>
          <Text style={{ color:ui.text }}>{l.name}</Text>
          <Text style={{ color: cur===l.code ? ui.primary : ui.textMuted }}>{cur===l.code ? "Seçildi" : ""}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
