import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeProvider';
import { getItem } from '@/src/lib/storage';
import { PIN_KEY, BIOMETRIC_KEY } from '@/src/constants/security';
import { useAuth } from '@/src/context/AuthContext';

export default function UnlockScreen() {
  const { colors, fonts, isDark } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const savedPin = await getItem<string | null>(PIN_KEY, null);
      if (!mounted) return;
      if (!savedPin || savedPin.length < 4) {
        router.replace('/pin-setup');
        return;
      }
      setStoredPin(savedPin);
      const enabled = await getItem<boolean>(BIOMETRIC_KEY, false);
      if (!mounted) return;
      if (enabled) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const supported = hasHardware
          ? await LocalAuthentication.supportedAuthenticationTypesAsync()
          : [];
        if (!mounted) return;
        setBiometricReady(enabled && hasHardware && supported.length > 0);
      }
      setChecking(false);
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleUnlock = async () => {
    if (submitting) return;
    if (!storedPin) return;
    if (!/^\d+$/.test(pin) || pin.length < 4) {
      Alert.alert('Xəta', 'PIN ən azı 4 rəqəm olmalıdır.');
      return;
    }
    setSubmitting(true);
    try {
      if (pin === storedPin) {
        router.replace('/(tabs)/home');
      } else {
        Alert.alert('Uyğun deyil', 'Daxil etdiyin PIN yanlışdır.');
      }
    } finally {
      setSubmitting(false);
      setPin('');
    }
  };

  const handleBiometricUnlock = async () => {
    if (!biometricReady || bioLoading) return;
    setBioLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Biometrik təsdiq',
      });
      if (result.success) {
        router.replace('/(tabs)/home');
      } else {
        Alert.alert('Uğursuz oldu', 'Biometrik identifikasiya tamamlanmadı.');
      }
    } finally {
      setBioLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/auth/welcome');
  };

  if (checking) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
          Təhlükəsizliyi aç
        </Text>
        <Text style={[styles.subtitle, { color: colors.subtext, fontFamily: fonts.body }]}>
          Son dəfə qeydiyyatdan keçdiyin üçün yalnız PIN və ya biometrik təsdiqlə daxil ola bilərsən.
        </Text>

        <View style={styles.card}>
          <Text style={[styles.label, { color: colors.subtext, fontFamily: fonts.body }]}>
            PIN daxil et
          </Text>
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
                borderColor: colors.border,
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                color: colors.text,
                fontFamily: fonts.body,
              },
            ]}
            onSubmitEditing={handleUnlock}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={handleUnlock}
            activeOpacity={0.9}
          >
            <Text style={[styles.primaryText, { fontFamily: fonts.heading }]}>
              {submitting ? 'Yoxlanılır...' : 'Daxil ol'}
            </Text>
          </TouchableOpacity>

          {biometricReady && (
            <TouchableOpacity
              style={styles.bioBtn}
              onPress={handleBiometricUnlock}
              activeOpacity={0.85}
            >
              <Ionicons
                name="finger-print"
                size={22}
                color={bioLoading ? colors.subtext : colors.primary}
              />
              <Text
                style={[
                  styles.bioText,
                  {
                    color: bioLoading ? colors.subtext : colors.primary,
                    fontFamily: fonts.body,
                  },
                ]}
              >
                {bioLoading ? 'Biometrik yoxlanır...' : 'Biometrik girişdən istifadə et'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.8}>
          <Text style={[styles.logout, { color: colors.subtext, fontFamily: fonts.body }]}>
            Başqa hesabla daxil ol
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    gap: 24,
  },
  title: {
    fontSize: 26,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'rgba(15,23,42,0.05)',
    gap: 12,
  },
  label: {
    fontSize: 13,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    letterSpacing: 6,
  },
  primaryBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bioBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'center',
  },
  bioText: {
    fontSize: 15,
    fontWeight: '600',
  },
  logout: {
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
