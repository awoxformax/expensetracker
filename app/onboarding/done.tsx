import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useOnboarding } from '../../src/context/Onboarding';
import { ONBOARDING_DONE_KEY } from '../../src/constants/storage';
import { ONBOARDING_CATEGORIES } from '../../src/data/onboardingCategories';
import { useUser } from '../../src/context/UserContext';

export default function DoneScreen() {
  const router = useRouter();
  const { colors, fonts } = useTheme();
  const { state, reset } = useOnboarding();
  const { setName, setPersona, setCategories, setBudget, completePhase1 } = useUser();
  const [saving, setSaving] = useState(false);

  const selectedCategories = useMemo(
    () => ONBOARDING_CATEGORIES.filter(category => state.categories.includes(category.id)),
    [state.categories],
  );

  const handleFinish = async () => {
    if (saving) return;
    try {
      setSaving(true);
      if (state.name.trim()) {
        const parts = state.name.trim().split(/\s+/);
        const firstName = parts.shift() ?? '';
        const lastName = parts.join(' ');
        setName(firstName, lastName);
      }
      if (state.profile) {
        setPersona(state.profile);
      }
      if (selectedCategories.length) {
        setCategories(
          selectedCategories.map(category => ({
            id: category.id,
            name: category.name,
            description: category.description,
            icon: category.icon,
          })),
        );
      }
      if (state.balance != null) {
        setBudget(state.balance);
      }
      completePhase1();
      await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true');
      reset();
      router.replace('/(tabs)/home');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: '#F8FAFF', fontFamily: fonts.heading }]}>Hazırsan! 🎉</Text>
        <Text style={[styles.subtitle, { color: '#A5B4FC', fontFamily: fonts.body }]}>
          Qısa bir xülasə hazırladıq. İstədiyin zaman bu məlumatları tətbiq daxilində yeniləyə bilərsən.
        </Text>

        <View style={styles.summaryCard}>
          <Text style={[styles.summaryTitle, { fontFamily: fonts.heading }]}>Profil</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontFamily: fonts.body }]}>Ad</Text>
            <Text style={[styles.summaryValue, { fontFamily: fonts.heading }]}>{state.name || '—'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontFamily: fonts.body }]}>Profil tipi</Text>
            <Text style={[styles.summaryValue, { fontFamily: fonts.heading }]}>
              {state.profile === 'student' ? 'Tələbə' : state.profile === 'worker' ? 'İşçi' : state.profile === 'family' ? 'Ailə' : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={[styles.summaryTitle, { fontFamily: fonts.heading }]}>Maliyyə</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontFamily: fonts.body }]}>Cari balans</Text>
            <Text style={[styles.summaryValue, { fontFamily: fonts.heading }]}>{state.balance != null ? `${state.balance} AZN` : '—'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontFamily: fonts.body }]}>Maliyyə hədəfi</Text>
            <Text style={[styles.summaryValue, { fontFamily: fonts.heading }]}>{state.goal != null ? `${state.goal} AZN` : '—'}</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={[styles.summaryTitle, { fontFamily: fonts.heading, marginBottom: 12 }]}>Seçilmiş kateqoriyalar</Text>
          {selectedCategories.length ? (
            selectedCategories.map(category => (
              <View key={category.id} style={styles.categoryRow}>
                <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                <Text style={[styles.categoryLabel, { fontFamily: fonts.body }]}>{category.name}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.summaryLabel, { fontFamily: fonts.body }]}>Kateqoriya seçilməyib</Text>
          )}
        </View>
      </ScrollView>

      <Pressable
        onPress={handleFinish}
        disabled={saving}
        style={({ pressed }) => [
          styles.cta,
          {
            backgroundColor: '#4F8BFF',
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Text style={[styles.ctaText, { fontFamily: fonts.heading }]}>{saving ? 'Yüklənir...' : 'Bitir və başla'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    padding: 24,
  },
  content: {
    paddingBottom: 160,
    gap: 18,
  },
  title: {
    fontSize: 28,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: 'rgba(15,23,42,0.65)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(79,139,255,0.12)',
    padding: 18,
    gap: 12,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#F8FAFF',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: '#A5B4FC',
    fontSize: 13,
  },
  summaryValue: {
    color: '#F8FAFF',
    fontSize: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryLabel: {
    color: '#F8FAFF',
    fontSize: 13,
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
