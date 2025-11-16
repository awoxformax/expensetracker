import React from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { ProfileType, useOnboarding } from '../../src/context/Onboarding';
import { PRE_HOME_BACKGROUND } from '../../src/constants/ui';

const PROFILES: { label: string; value: ProfileType; description: string }[] = [
  { label: 'Tələbə', value: 'student', description: 'Təhsil və gündəlik xərclərə fokuslan.' },
  { label: 'İşçi', value: 'worker', description: 'Gəlir və büdcəni balanslı saxla.' },
  { label: 'Ailə', value: 'family', description: 'Bütün ailənin büdcəsini idarə et.' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, fonts } = useTheme();
  const { state, setName, setProfile } = useOnboarding();

  const canContinue = state.name.trim().length > 1 && state.profile;

  const handleNext = () => {
    if (!canContinue) return;
    router.push('/onboarding/funds');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: '#F8FAFF', fontFamily: fonts.heading }]}>Səni tanıyaq</Text>
        <Text style={[styles.subtitle, { color: '#A5B4FC', fontFamily: fonts.body }]}>
          Adını və əsas rolunu qeyd et ki, sənə uyğun tövsiyələr təqdim edək.
        </Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: '#A5B4FC', fontFamily: fonts.body }]}>Adın və soyadın</Text>
          <TextInput
            placeholder="Məsələn, Aygün Məmmədova"
            placeholderTextColor="#64748B"
            value={state.name}
            onChangeText={setName}
            style={[styles.input, { fontFamily: fonts.body }]}
          />
        </View>

        <Text style={[styles.label, { color: '#A5B4FC', fontFamily: fonts.body, marginTop: 24 }]}>Profil tipi</Text>
        <View style={styles.profileGroup}>
          {PROFILES.map(item => {
            const active = state.profile === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => setProfile(item.value)}
                style={({ pressed }) => [
                  styles.profileCard,
                  {
                    borderColor: active ? '#4F8BFF' : 'rgba(148,163,184,0.2)',
                    backgroundColor: active ? 'rgba(79,139,255,0.18)' : 'rgba(15,23,42,0.6)',
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <Text style={[styles.profileTitle, { color: '#F8FAFF', fontFamily: fonts.heading }]}>{item.label}</Text>
                <Text style={[styles.profileDesc, { color: '#A5B4FC', fontFamily: fonts.body }]}>{item.description}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={handleNext}
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
    marginBottom: 26,
  },
  field: {
    marginBottom: 12,
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
  profileGroup: {
    gap: 12,
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 18,
  },
  profileTitle: {
    fontSize: 16,
    marginBottom: 6,
  },
  profileDesc: {
    fontSize: 13,
    lineHeight: 20,
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
