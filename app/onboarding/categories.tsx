import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useOnboarding } from '../../src/context/Onboarding';
import { ONBOARDING_CATEGORIES } from '../../src/data/onboardingCategories';
import { PRE_HOME_BACKGROUND } from '../../src/constants/ui';

export default function CategorySelectScreen() {
  const router = useRouter();
  const { colors, fonts } = useTheme();
  const { state, toggleCategory } = useOnboarding();

  const canContinue = state.categories.length > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    router.push('/onboarding/profile');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: '#F8FAFF', fontFamily: fonts.heading }]}>Kateqoriyalarını seç</Text>
        <Text style={[styles.subtitle, { color: '#A5B4FC', fontFamily: fonts.body }]}>
          Gündəlik və aylıq xərclərini izləmək istədiyin kateqoriyaları işarələ. Sonradan daha çox kateqoriya əlavə edə bilərsən.
        </Text>

        <View style={styles.list}>
          {ONBOARDING_CATEGORIES.map(category => {
            const active = state.categories.includes(category.id);
            return <CategoryCard key={category.id} data={category} active={active} onToggle={() => toggleCategory(category.id)} fonts={fonts} />;
          })}
        </View>
      </ScrollView>

      <Pressable
        onPress={handleContinue}
        disabled={!canContinue}
        style={({ pressed }) => [
          styles.cta,
          {
            backgroundColor: canContinue ? '#4F8BFF' : '#1E293B',
            opacity: pressed && canContinue ? 0.85 : 1,
          },
        ]}
      >
        <Text style={[styles.ctaText, { color: canContinue ? '#0B0D13' : '#4E5D7A', fontFamily: fonts.heading }]}>Davam et</Text>
      </Pressable>
    </SafeAreaView>
  );
}

type CategoryProps = {
  data: (typeof ONBOARDING_CATEGORIES)[number];
  active: boolean;
  onToggle: () => void;
  fonts: { heading: string; body: string };
};

function CategoryCard({ data, active, onToggle, fonts }: CategoryProps) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 20, bounciness: 4 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 180 }),
    ]).start();
    onToggle();
  };

  return (
    <Pressable onPress={handleToggle} style={{ marginBottom: 14 }}>
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale }],
            borderColor: active ? data.color : 'rgba(255,255,255,0.06)',
            backgroundColor: active ? 'rgba(79,139,255,0.15)' : 'rgba(15,23,42,0.6)',
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${data.color}22` }]}>
          <Ionicons name={data.icon as any} size={24} color={data.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { fontFamily: fonts.heading }]}>{data.name}</Text>
          <Text style={[styles.cardDesc, { fontFamily: fonts.body }]}>{data.description}</Text>
        </View>
        <View style={styles.checkWrap}>
          {active ? (
            <Ionicons name="checkmark-circle" size={22} color={data.color} />
          ) : (
            <View style={styles.checkPlaceholder} />
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    padding: 24,
    backgroundColor: PRE_HOME_BACKGROUND,
  },
  scroll: {
    paddingBottom: 140,
  },
  title: {
    fontSize: 28,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  list: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    color: '#F8FAFF',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#A5B4FC',
  },
  checkWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.4)',
  },
  cta: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
