import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from "react-native";
import { Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/ThemeProvider";
import { useAuth } from "@/src/context/AuthContext";
import { useUser } from "@/src/context/UserContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLang } from "@/src/context/LangContext";

export default function MoreScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { state } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLang();

  const rawName = [state.profile.firstName, state.profile.lastName].filter(Boolean).join(" ").trim();
  const fullName = rawName || t("more_profileFallback");
  const friendlyName = fullName.split(" ")[0] || fullName;
  const phoneNumber = state.profile.phone || "+000000000";
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "PR";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 24, paddingBottom: 48 },
      ]}
    >
      <View
        style={[
          styles.profileBox,
          {
            backgroundColor: colors.card,
            shadowColor: isDark ? "#000" : "rgba(15,23,42,0.15)",
          },
        ]}
      >
        <View
          style={[
            styles.avatar,
            { backgroundColor: isDark ? "#1E293B" : "#E0EAFF" },
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              { color: isDark ? "#E2E8F0" : "#0F172A" },
            ]}
          >
            {initials}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.profileInfo}
          onPress={() => router.push("/edit-info")}
          activeOpacity={0.85}
        >
          <Text style={[styles.name, { color: colors.text }]}>{fullName}</Text>
          <Text style={[styles.phone, { color: colors.subtext }]}>
            {phoneNumber}
          </Text>
          <Text style={[styles.profileHint, { color: colors.subtext }]}>
            {t("more_profileHint", { name: friendlyName })}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.9}
          onPress={() => router.push("/edit-info")}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.editText}>{t("more_editProfile")}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Ionicons
              name={isDark ? "moon" : "sunny"}
              size={22}
              color={colors.text}
            />
            <Text style={[styles.optionText, { color: colors.text }]}>
              {t(isDark ? "more_theme_light" : "more_theme_dark")}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            thumbColor={isDark ? "#16a34a" : "#f4f4f5"}
            trackColor={{ false: "#d1d5db", true: "#bbf7d0" }}
          />
        </View>

        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => router.push("/settings/language")}
        >
          <View style={styles.optionLeft}>
            <Ionicons name="language" size={22} color={colors.text} />
            <Text style={[styles.optionText, { color: colors.text }]}>
              {t("more_language")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => router.push("/settings/settings")}
        >
          <View style={styles.optionLeft}>
            <Ionicons name="lock-closed" size={22} color={colors.text} />
            <Text style={[styles.optionText, { color: colors.text }]}>
              {t("more_security")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => Linking.openURL("https://wa.me/994102284679")}
        >
          <View style={styles.optionLeft}>
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            <Text style={[styles.optionText, { color: colors.text }]}>
              {t("more_whatsapp")}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => Linking.openURL("https://instagram.com/onlymamed")}
        >
          <View style={styles.optionLeft}>
            <Ionicons name="logo-instagram" size={22} color="#E1306C" />
            <Text style={[styles.optionText, { color: colors.text }]}>
              {t("more_instagram")}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: colors.border }]}
        onPress={() => {
          logout();
          router.replace("/auth/login");
        }}
      >
        <Ionicons name="log-out-outline" size={20} color="#dc2626" />
        <Text style={styles.logoutText}>{t("more_logout")}</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: colors.subtext }]}>
        {t("more_version", { version: "1.0.0" })}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    gap: 28,
  },
  profileBox: {
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  profileInfo: { alignItems: "center" },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: { fontSize: 28, fontWeight: "700" },
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
  profileHint: {
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  editButton: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#16a34a",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  editText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  section: {
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
    marginTop: -6,
    fontSize: 13,
  },
});
