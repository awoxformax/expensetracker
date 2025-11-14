import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/ThemeProvider";
import { useLang } from "@/src/context/LangContext";
import { useAuth } from "@/src/context/AuthContext";
import { useUser } from "@/src/context/UserContext";
import { t } from "@/src/data/strings";

export default function MoreScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { lang } = useLang();
  const { logout } = useAuth();
  const { state } = useUser();
  const router = useRouter();
  const fullName =
    [state.profile.firstName, state.profile.lastName].filter(Boolean).join(" ").trim() ||
    "Profil";
  const phoneNumber = state.profile.phone || "+000000000";

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      {/* Profil */}
      <View style={styles.profileBox}>
        <TouchableOpacity onPress={() => router.push("/edit-info")}>
          <Text style={[styles.name, { color: colors.text }]}>{fullName}</Text>
          <Text style={[styles.phone, { color: colors.subtext }]}>
            {phoneNumber}
          </Text>
        </TouchableOpacity>

        <View
          style={[
            styles.banner,
            { backgroundColor: isDark ? "#1E293B" : "#000" },
          ]}
        >
          <Text style={styles.bannerText}>EXPENSE TRACKER</Text>
        </View>
      </View>

      {/* Ayarlar */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        {/* Dark Mode */}
        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Ionicons
              name={isDark ? "moon" : "sunny"}
              size={22}
              color={colors.text}
            />
            <Text style={[styles.optionText, { color: colors.text }]}>
              {isDark ? "İşıqlı rejim" : "Qaranlıq rejim"}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            thumbColor={isDark ? "#2563EB" : "#f4f4f5"}
            trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
          />
        </View>

        {/* Dil seçimi */}
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => router.push("/settings/language")}
        >
          <View style={styles.optionLeft}>
            <Ionicons name="language" size={22} color={colors.text} />
            <Text style={[styles.optionText, { color: colors.text }]}>
              Dil seçimi
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
        </TouchableOpacity>

        {/* PIN və Biometrika */}
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => router.push("../settings/pin-setup")}
        >
          <View style={styles.optionLeft}>
            <Ionicons name="lock-closed" size={22} color={colors.text} />
            <Text style={[styles.optionText, { color: colors.text }]}>
              Təhlükəsizlik ayarları
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
        </TouchableOpacity>
      </View>

      {/* Sosial linklər */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => console.log("Open WhatsApp")}
        >
          <View style={styles.optionLeft}>
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            <Text style={[styles.optionText, { color: colors.text }]}>
              WhatsApp ilə əlaqə
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => console.log("Open Instagram")}
        >
          <View style={styles.optionLeft}>
            <Ionicons name="logo-instagram" size={22} color="#E1306C" />
            <Text style={[styles.optionText, { color: colors.text }]}>
              Instagram səhifəsi
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Çıxış */}
      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: colors.border }]}
        onPress={() => {
          logout();
          router.replace("/auth/login");
        }}
      >
        <Ionicons name="log-out-outline" size={20} color="#dc2626" />
        <Text style={styles.logoutText}>Çıxış</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: colors.subtext }]}>
        ExpenseTracker version 1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileBox: {
    alignItems: "center",
    marginTop: 20,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  phone: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  banner: {
    marginTop: 16,
    paddingVertical: 24,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  bannerText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 1,
    fontSize: 16,
  },
  section: {
    marginTop: 28,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  logoutButton: {
    marginTop: 30,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: {
    color: "#dc2626",
    fontWeight: "600",
    fontSize: 16,
  },
  version: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 13,
  },
});
