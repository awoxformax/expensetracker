import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useLang } from "../../src/context/LangContext";
import { t } from "../../src/data/strings";

const ACTIVE_COLOR = "rgba(37,99,235,0.95)";
const INACTIVE_COLOR = "rgba(156,163,175,0.7)";

const ICONS: Record<
  string,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  home: { active: "home", inactive: "home-outline" },
  stats: { active: "stats-chart", inactive: "stats-chart-outline" },
  transactions: { active: "swap-horizontal", inactive: "swap-horizontal-outline" },
  more: { active: "apps", inactive: "apps-outline" },
};

export default function TabsLayout() {
  const { fonts, isDark } = useTheme();
  const { lang } = useLang();

  return (
    <Tabs
      key={lang} // dil dəyişəndə tam re-render olur
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: [
          styles.tabBar,
          { backgroundColor: isDark ? "#111827" : "rgba(249,250,251,0.97)" },
        ],
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 2,
          fontWeight: "500",
          textAlign: "center",
          flexWrap: "nowrap",
          includeFontPadding: false,
          fontFamily: fonts.body,
        },
        tabBarIcon: ({ color, focused }) => (
          <TabIcon
            iconName={
              (focused
                ? ICONS[route.name]?.active
                : ICONS[route.name]?.inactive) ?? "ellipse"
            }
            color={color}
            focused={focused}
          />
        ),
      })}
    >
      <Tabs.Screen name="home" options={{ title: t("home", lang) }} />
      <Tabs.Screen name="stats" options={{ title: t("statistics", lang) }} />
      <Tabs.Screen name="transactions" options={{ title: t("transactions", lang) }} />
      <Tabs.Screen name="more" options={{ title: t("more", lang) }} />
    </Tabs>
  );
}

function TabIcon({
  iconName,
  color,
  focused,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={styles.iconWrapper}>
      <Ionicons name={iconName} size={22} color={color} />
      <View style={[styles.indicator, focused && styles.indicatorActive]} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0,
    borderTopColor: "transparent",
    paddingBottom: 10,
    paddingTop: 6,
    height: 74,
    shadowColor: "rgba(0,0,0,0.06)",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 12,
  },
  tabBarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: { alignItems: "center", justifyContent: "center" },
  indicator: {
    width: 26,
    height: 2,
    borderRadius: 999,
    marginTop: 4,
    backgroundColor: "transparent",
  },
  indicatorActive: { backgroundColor: ACTIVE_COLOR },
});
