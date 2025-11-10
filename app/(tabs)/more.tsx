import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/theme/ThemeProvider";

export default function MoreScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  // Linkləri açmaq funksiyası
  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: "#F4F6F9" }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Başlıq */}
        <Text style={[styles.header, { color: colors.text }]}>Profil</Text>

        {/* Profil məlumatları */}
        <View style={styles.profileRow}>
          <Image
            source={{ uri: "https://i.pravatar.cc/150?img=7" }}
            style={styles.avatar}
          />
          <View>
            <Text style={[styles.name, { color: colors.text }]}>
              Məmməd Əhmədli
            </Text>
            <Text style={[styles.phone, { color: colors.textMuted }]}>
              +994102284679
            </Text>
          </View>
        </View>

        {/* Logo */}
        <View style={styles.logoFullWrapper}>
          <Image
            source={require("../../src/assets/images/logo.png")}
            style={styles.fullLogo}
          />
        </View>

        {/* Grid menyular */}
        <View style={styles.gridContainer}>
          <MenuBox
            icon="person-outline"
            label="Məlumatlarım"
            sub="Ad, Nömrə"
            onPress={() => router.push("/settings/info")}
          />
          <MenuBox
            icon="settings-outline"
            label="Tənzimləmələr"
            sub="PIN və biometrika"
            onPress={() => router.push("/settings/settings")}
          />
          <MenuBox
            icon="document-text-outline"
            label="Sənədlər"
            sub="Boşdur"
          />
          <MenuBox
            icon="language-outline"
            label="Dil"
            sub="Azərbaycan"
            flag="🇦🇿"
            onPress={() => router.push("/settings/language")}
          />
        </View>

        {/* Dəstək bölməsi */}
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Dəstək</Text>

          {/* WhatsApp */}
          <TouchableOpacity
            style={styles.supportCard}
            activeOpacity={0.9}
            onPress={() => openLink("https://wa.me/994102284679")}
          >
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.supportTitle}>WhatsApp</Text>
              <Text style={styles.supportSub}>
                +994 10 228 46 79 ilə əlaqə
              </Text>
            </View>
          </TouchableOpacity>

          {/* Instagram */}
          <TouchableOpacity
            style={styles.supportCard}
            activeOpacity={0.9}
            onPress={() => openLink("https://instagram.com/onlymamed")}
          >
            <Ionicons name="logo-instagram" size={24} color="#C13584" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.supportTitle}>Instagram</Text>
              <Text style={styles.supportSub}>@onlymamed səhifəsi</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Biz hər yerdəyik */}
        <View style={styles.socialsSection}>
          <Text style={styles.socialTitle}>Biz hər yerdəyik</Text>
          <View style={styles.socialRow}>
            <TouchableOpacity onPress={() => openLink("https://instagram.com/onlymamed")}>
              <Ionicons name="logo-instagram" size={28} color="#C13584" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openLink("https://wa.me/994102284679")}
            >
              <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Versiya */}
        <Text style={styles.version}>ExpenseTracker version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuBox({ icon, label, sub, flag, onPress }: any) {
  return (
    <TouchableOpacity style={styles.menuBox} activeOpacity={0.9} onPress={onPress}>
      <Ionicons name={icon} size={22} color="#2563EB" />
      <View style={{ marginLeft: 8, flex: 1 }}>
        <Text style={styles.menuLabel}>{label}</Text>
        {!!sub && <Text style={styles.menuSub}>{sub}</Text>}
      </View>
      {flag && <Text style={styles.flag}>{flag}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    fontSize: 30,
    fontWeight: "800",
    marginTop: 18,
    marginHorizontal: 20,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    gap: 14,
  },
  avatar: { width: 58, height: 58, borderRadius: 30 },
  name: { fontSize: 17, fontWeight: "600" },
  phone: { fontSize: 13 },

  logoFullWrapper: {
    marginHorizontal: 20,
    borderRadius: 22,
    overflow: "hidden",
    height: 180,
    marginTop: 10,
    elevation: 2,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E9EEF5",
  },
  fullLogo: { width: "100%", height: "100%", resizeMode: "cover" },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 12,
  },
  menuBox: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9EEF5",
  },
  menuLabel: { fontWeight: "700", fontSize: 14, color: "#0F172A" },
  menuSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  flag: { fontSize: 16 },

  supportSection: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: "#0F172A",
    marginBottom: 10,
  },
  supportCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E9EEF5",
  },
  supportTitle: { fontWeight: "700", color: "#0F172A" },
  supportSub: { color: "#6B7280", fontSize: 12, marginTop: 2 },

  socialsSection: {
    marginTop: 20,
    alignItems: "center",
  },
  socialTitle: {
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
    fontSize: 15,
  },
  socialRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 10,
  },

  version: {
    textAlign: "center",
    color: "#9CA3AF",
    marginTop: 10,
    marginBottom: 20,
  },
});
