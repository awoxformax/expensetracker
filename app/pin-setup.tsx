import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeProvider';
import { PIN_KEY, BIOMETRIC_KEY } from '@/src/constants/security';
import { getItem, setItem } from '@/src/lib/storage';

const MIN_PIN_LENGTH = 4;

export default function PinSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, fonts, isDark } = useTheme();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const existingPin = await getItem<string | null>(PIN_KEY, null);
      if (!mounted) return;
      if (existingPin && existingPin.length >= MIN_PIN_LENGTH) {
        router.replace('/auth/unlock');
        return;
      }
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware || !mounted) return;
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (!mounted) return;
      if (!types.length) return;
      setBiometricSupported(true);
      const enabled = await getItem<boolean>(BIOMETRIC_KEY, false);
      if (!mounted) return;
      setBiometricEnabled(enabled);
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSave = async () => {
    if (saving) return;
    if (!/^\d+$/.test(pin) || pin.length < MIN_PIN_LENGTH) {
      Alert.alert('Xəta', 'PIN ən azı 4 rəqəmdən ibarət olmalıdır.');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('Xəta', 'PIN və təsdiq sahələri eyni olmalıdır.');
      return;
    }
    setSaving(true);
    try {
      await setItem(PIN_KEY, pin);
      Alert.alert('Hazırdır', 'PIN uğurla yadda saxlanıldı.');
      router.replace('/(tabs)/home');
    } finally {
      setSaving(false);
    }
  };

  const toggleBiometric = async () => {
    if (!biometricSupported) {
      Alert.alert('Biometrik dəstək yoxdur', 'Bu cihaz biometrik identifikasiya dəstəkləmir.');
      return;
    }
    if (bioLoading) return;
    setBioLoading(true);
    try {
      if (biometricEnabled) {
        await setItem(BIOMETRIC_KEY, false);
        setBiometricEnabled(false);
        Alert.alert('Söndürüldü', 'Biometrik giriş deaktiv edildi. Daha sonra ayarlardan aktivləşdirə bilərsən.');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Biometrik təsdiq',
      });
      if (!result.success) {
        Alert.alert('Uğursuz oldu', 'Biometrik təsdiq baş tutmadı.');
        return;
      }
      await setItem(BIOMETRIC_KEY, true);
      setBiometricEnabled(true);
      Alert.alert('Hazırdır', 'Biometrik giriş aktiv edildi.');
    } finally {
      setBioLoading(false);
    }
  };

  const helperText = useMemo(() => {
    if (!biometricSupported) {
      return 'Cihazında biometrik sensor tapılmadı. Bu addımı saxla və yalnız PIN istifadə et.';
    }
    return biometricEnabled
      ? 'Biometrik giriş aktivdir. İstədiyin zaman Təhlükəsizlik bölməsindən dəyişə bilərsən.'
      : 'İstəsən indi biometrik identifikasiya əlavə edə bilərsən. Bu addım məcburi deyil.';
  }, [biometricSupported, biometricEnabled]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.heading }]}>
          PIN təyin et
        </Text>
        <Text style={[styles.description, { color: colors.subtext, fontFamily: fonts.body }]}>
          İlk qeydiyyatdan sonra tətbiqi qorumaq üçün minimum 4 rəqəmli PIN yarat və istəsən biometrik
          girişi də aktiv et.
        </Text>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.subtext, fontFamily: fonts.body }]}>PIN</Text>
          <TextInput
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            placeholder="••••"
            placeholderTextColor={colors.subtext}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                fontFamily: fonts.body,
              },
            ]}
          />
          <Text style={[styles.label, { color: colors.subtext, fontFamily: fonts.body }]}>Təsdiq et</Text>
          <TextInput
            value={confirmPin}
            onChangeText={setConfirmPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            placeholder="••••"
            placeholderTextColor={colors.subtext}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                fontFamily: fonts.body,
              },
            ]}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.9}
            onPress={handleSave}
          >
            <Text style={[styles.primaryText, { fontFamily: fonts.heading }]}>
              {saving ? 'Yadda saxlanılır...' : 'PIN-i yadda saxla'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
          <View style={styles.cardHeader}>
            <Ionicons
              name={biometricEnabled ? 'finger-print' : 'finger-print-outline'}
              size={22}
              color={colors.primary}
            />
            <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.heading }]}>
              Biometrik giriş
            </Text>
          </View>
          <Text style={[styles.helper, { color: colors.subtext, fontFamily: fonts.body }]}>
            {helperText}
          </Text>
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              { borderColor: colors.primary, backgroundColor: 'transparent' },
            ]}
            onPress={toggleBiometric}
            activeOpacity={0.9}
          >
            <Text style={[styles.secondaryText, { color: colors.primary, fontFamily: fonts.heading }]}>
              {bioLoading ? 'Gözləyin...' : biometricEnabled ? 'Söndür' : 'Aktiv et (istəyə bağlı)'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    gap: 24,
  },
  title: {
    fontSize: 28,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 13,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    letterSpacing: 6,
  },
  primaryBtn: {
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
  },
  helper: {
    fontSize: 13,
    lineHeight: 20,
  },
  secondaryBtn: {
    marginTop: 6,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
