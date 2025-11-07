import React from 'react';
import { Text, View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, fonts } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.badge, { color: '#A5B4FC', borderColor: '#323B55', fontFamily: fonts.heading }]}>Expense Tracker</Text>
        <Text style={[styles.title, { color: '#F8FAFF', fontFamily: fonts.heading }]}>Xoş gəldin! 👋</Text>
        <Text style={[styles.subtitle, { color: '#A5B4FC', fontFamily: fonts.body }]}>
          Şəxsi maliyyəni izləmək və ağıllı qənaət planı qurmaq üçün sənə kömək edəcəyik. Başlayaq?
        </Text>
      </View>

      <Pressable
        onPress={() => router.push('/onboarding/categories')}
        style={({ pressed }) => [
          styles.cta,
          {
            backgroundColor: '#4F8BFF',
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Text style={[styles.ctaText, { fontFamily: fonts.heading }]}>Başlayaq</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  container: {
    marginTop: 60,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    fontSize: 12,
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    marginTop: 18,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 320,
  },
  cta: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: {
    color: '#0B0D13',
    fontSize: 16,
    fontWeight: '700',
  },
});

