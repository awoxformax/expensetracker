import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useTheme } from "@/src/theme/ThemeProvider";
import { useLang } from "@/src/context/LangContext";

type LanguageCode = "az" | "en" | "ru";

const LANGUAGE_FLAGS: Record<LanguageCode, string> = {
  az: "🇦🇿",
  en: "🇬🇧",
  ru: "🇷🇺",
};

const OPTIONS: LanguageCode[] = ["az", "en", "ru"];

export default function LanguageScreen() {
  const { colors } = useTheme();
  const { lang, setLang, t } = useLang();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}
    >
      <Stack.Screen options={{ title: t("language_title") }} />
      <View style={styles.wrapper}>
        {OPTIONS.map((code) => {
          const active = lang === code;
          return (
            <TouchableOpacity
              key={code}
              onPress={() => setLang(code)}
              style={[
                styles.item,
                {
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.card : colors.background,
                },
              ]}
              activeOpacity={0.9}
            >
              <Text style={styles.flag}>{LANGUAGE_FLAGS[code]}</Text>
              <Text style={[styles.name, { color: colors.text }]}>
                {t(`language_option_${code}`)}
              </Text>
              <Text style={[styles.code, { color: active ? colors.primary : colors.subtext }]}>
                {active ? t("language_selected") : code.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  wrapper: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 16,
  },
  item: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  flag: { fontSize: 26 },
  name: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    marginHorizontal: 16,
  },
  code: {
    fontSize: 13,
    fontWeight: "600",
  },
});
