import React from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useOnboarding } from '../../src/context/Onboarding';
import { useUser } from '../../src/context/UserContext';
import { ONBOARDING_DONE_KEY } from '../../src/constants/storage';
import { ONBOARDING_CATEGORIES } from '../../src/data/onboardingCategories';
import { PRE_HOME_BACKGROUND } from '../../src/constants/ui';

const toNumber = (value: string): number | null => {
  const normalized = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function FundsScreen() {
  const router = useRouter();
  const { colors, fonts } = useTheme();
  const { state, setBalance, setGoal, reset } = useOnboarding();
  const { setName, setPersona, setCategories, setBudget, completePhase1 } = useUser();

  const [balanceInput, setBalanceInput] = React.useState(state.balance != null ? state.balance.toString() : '');
  const [goalInput, setGoalInput] = React.useState(state.goal != null ? state.goal.toString() : '');
  const [skipping, setSkipping] = React.useState(false);

  const handleBalanceChange = (value: string) => {
    setBalanceInput(value);
    setBalance(toNumber(value));
  };

  const handleGoalChange = (value: string) => {
    setGoalInput(value);
    setGoal(toNumber(value));
  };

  const canContinue = (state.balance ?? 0) > 0 && (state.goal ?? 0) > 0;

  const selectedCategories = React.useMemo(
    () => ONBOARDING_CATEGORIES.filter(category => state.categories.includes(category.id)),
    [state.categories],
  );

  const handleNext = () => {
    if (!canContinue || skipping) return;
    router.push('/onboarding/done');
  };

  const handleSkip = async () => {
    if (skipping) return;
    try {
      setSkipping(true);
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
      setSkipping(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: '#F8FAFF', fontFamily: fonts.heading }]}>Büdcəni planlayaq</Text>
        <Text style={[styles.subtitle, { color: '#A5B4FC', fontFamily: fonts.body }]}>
          Cari balansını və yaxın maliyyə hədəfini qeyd et. Bu məlumatlar daha düzgün hesabatlar təqdim etməyə kömək edəcək.
        </Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: '#A5B4FC', fontFamily: fonts.body }]}>Cari balans (AZN)</Text>
          <TextInput
            placeholder="Məsələn, 1250"
            placeholderTextColor="#64748B"
            value={balanceInput}
            onChangeText={handleBalanceChange}
            style={[styles.input, { fontFamily: fonts.body }]}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: '#A5B4FC', fontFamily: fonts.body }]}>Maliyyə hədəfi (AZN)</Text>
          <TextInput
            placeholder="Məsələn, 5000"
            placeholderTextColor="#64748B"
            value={goalInput}
            onChangeText={handleGoalChange}
            style={[styles.input, { fontFamily: fonts.body }]}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSkip}
          disabled={skipping}
          style={({ pressed }) => [
            styles.skip,
            {
              opacity: pressed && !skipping ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[styles.skipText, { fontFamily: fonts.body }]}>{skipping ? 'Keçilir...' : 'Keç'}</Text>
        </Pressable>

        <Pressable
          onPress={handleNext}
          disabled={!canContinue || skipping}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: canContinue && !skipping ? '#4F8BFF' : '#1E293B',
              opacity: pressed && canContinue && !skipping ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[styles.ctaText, { color: canContinue && !skipping ? '#0B0D13' : '#4E5D7A', fontFamily: fonts.heading }]}>
            Davam et
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    padding: 24,
    backgroundColor: PRE_HOME_BACKGROUND,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 30,
  },
  field: {
    marginBottom: 22,
  },
  label: {
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F8FAFF',
    fontSize: 15,
  },
  footer: {
    gap: 16,
  },
  skip: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  skipText: {
    color: '#A5B4FC',
    fontSize: 14,
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
