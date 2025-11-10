import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/theme/ThemeProvider";

export default function MoreScreen() {
  const { colors } = useTheme();
  const [progress] = useState(0.6);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Profil başlığı */}
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

        {/* Logo tam çərçivəni tutur */}
<View style={styles.logoFullWrapper}>
  <Image
    source={require("../../src/assets/images/logo.png")}
    style={styles.fullLogo}
  />
</View>



        {/* Profilini tamamla */}
        <TouchableOpacity style={styles.completeCard} activeOpacity={0.9}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressText}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.completeTitle}>Profilini tamamla</Text>
            <Text style={styles.completeSub}>
              Gəl, profilini tam hazır edək!
            </Text>
          </View>
          <Ionicons
            name="chevron-forward-outline"
            size={20}
            color="#64748B"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>

        {/* Grid menyular */}
        <View style={styles.gridContainer}>
          <MenuBox
            icon="person-outline"
            label="Məlumatlarım"
            sub="Ad, nömrə, FİN, CINS"
          />
          <MenuBox
            icon="settings-outline"
            label="Tənzimləmələr"
            sub="PIN-i dəyişmək, biometrika"
          />
          <MenuBox
            icon="document-text-outline"
            label="Sənədlər"
            sub="Daha ətraflı"
          />
          <MenuBox
            icon="language-outline"
            label="Dil"
            sub="Azərbaycan"
            flag="🇦🇿"
          />
        </View>

        {/* Kartlarım */}
        <View style={styles.cardsSection}>
          <Text style={styles.sectionTitle}>Kartlarım</Text>
          <View style={styles.cardsRow}>
            <View style={[styles.cardDesign, { backgroundColor: "#10B981" }]} />
            <View style={[styles.cardDesign, { backgroundColor: "#3B82F6" }]} />
            <View style={[styles.cardDesign, { backgroundColor: "#F59E0B" }]} />
          </View>
        </View>

        {/* Dəstək */}
        <TouchableOpacity style={styles.supportCard} activeOpacity={0.9}>
          <Ionicons name="chatbubbles-outline" size={22} color="#2563EB" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.supportTitle}>Dəstək</Text>
            <Text style={styles.supportSub}>Əlaqə, Tez-tez verilən suallar</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color="#64748B" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuBox({ icon, label, sub, flag }: any) {
  return (
    <TouchableOpacity style={styles.menuBox} activeOpacity={0.9}>
      <Ionicons name={icon} size={22} color="#2563EB" />
      <View style={{ marginLeft: 8, flex: 1 }}>
        <Text style={styles.menuLabel}>{label}</Text>
        {sub && <Text style={styles.menuSub}>{sub}</Text>}
      </View>
      {flag && <Text style={styles.flag}>{flag}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    fontSize: 30,
    fontWeight: "800",
    marginTop: 8,
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
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 30,
  },
  name: { fontSize: 17, fontWeight: "600" },
  phone: { fontSize: 13 },

  // 🔹 LOGO tam çərçivəni tutur
logoFullWrapper: {
  marginHorizontal: 20,
  borderRadius: 22,
  overflow: "hidden",
  height: 180,
  marginTop: 10,
  elevation: 3,
  alignItems: "center",
  justifyContent: "center",
},
fullLogo: {
  width: "100%",
  height: "115%", // yazını bir az aşağı gətirir
  resizeMode: "cover",
  transform: [{ translateY: 10 }], // 10px aşağı çəkir
},

  completeCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 16,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
  },
  progressCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 5,
    borderColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  progressText: { fontWeight: "700", color: "#1E293B" },
  completeTitle: { fontWeight: "700", fontSize: 15, color: "#1E293B" },
  completeSub: { color: "#64748B", fontSize: 13, marginTop: 3 },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 16,
  },
  menuBox: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    elevation: 2,
  },
  menuLabel: { fontWeight: "600", fontSize: 14, color: "#1E293B" },
  menuSub: { fontSize: 11, color: "#64748B" },
  flag: { fontSize: 16 },

  cardsSection: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: "#1E293B",
    marginBottom: 10,
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardDesign: {
    width: 100,
    height: 60,
    borderRadius: 12,
  },

  supportCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    elevation: 2,
  },
  supportTitle: { fontWeight: "700", color: "#1E293B" },
  supportSub: { color: "#64748B", fontSize: 12, marginTop: 2 },
});
