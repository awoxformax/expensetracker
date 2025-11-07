import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function TabsLayout() {
  const { colors, fonts } = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: 'rgba(255,255,255,0.08)',
          paddingTop: 8,
          paddingBottom: 12,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: fonts.body,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
            home: { active: 'home', inactive: 'home-outline' },
            stats: { active: 'stats-chart', inactive: 'stats-chart-outline' },
            transactions: { active: 'swap-horizontal', inactive: 'swap-horizontal-outline' },
            more: { active: 'apps', inactive: 'apps-outline' },
          };
          const iconSet = icons[route.name] ?? icons.home;
          const iconName = focused ? iconSet.active : iconSet.inactive;
          return <Ionicons name={iconName} color={color} size={size} />;
        },
      })}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Əsas',
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Statistika',
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Əməliyyatlar',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Daha çox',
        }}
      />
    </Tabs>
  );
}
