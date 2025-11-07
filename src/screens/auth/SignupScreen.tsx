import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeProvider';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../../context/Onboarding';
import { ONBOARDING_DONE_KEY } from '../../constants/storage';

export default function SignupScreen() {
  const { signup } = useAuth();
  const { colors, fonts } = useTheme();
  const router = useRouter();
  const { reset: resetOnboarding } = useOnboarding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    const success = await signup(email, password);
    if (success) {
      resetOnboarding();
      await AsyncStorage.removeItem(ONBOARDING_DONE_KEY);
      router.replace('/onboarding/tutorial');
    }
  };

  return (
    <LinearGradient colors={colors.bgGradient} style={styles.gradient}>
      <KeyboardAvoidingWidget>
        <View style={styles.card}>
          <Text style={[styles.title, { color: colors.text, fontFamily: fonts.heading }]}>Qeydiyyat</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>Hesab yarat və başla</Text>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#8892a6" style={styles.inputIcon} />
              <TextInput
              style={[styles.input, { fontFamily: fonts.body }]}
              placeholder="ornek@mail.com"
              placeholderTextColor="#8892a6"
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Şifrə</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#8892a6" style={styles.inputIcon} />
              <TextInput
              style={[styles.input, { fontFamily: fonts.body }]}
              placeholder="••••••••"
              placeholderTextColor="#8892a6"
              secureTextEntry
              onChangeText={setPassword}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleSignup}>
            <LinearGradient colors={colors.ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Qeydiyyatdan keç</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={[styles.switchText]}>Artıq hesabın var? Giriş et</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingWidget>
    </LinearGradient>
  );
}

function KeyboardAvoidingWidget({ children }: { children: React.ReactNode }) {
  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        {children}
      </KeyboardAvoidingView>
    );
  }
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 12, marginBottom: 6 },
  inputWrap: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 14, top: 15 },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    paddingLeft: 40,
    paddingRight: 14,
    backgroundColor: 'rgba(17,24,39,0.6)',
    color: '#e5e7eb',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  button: { marginTop: 8 },
  buttonGradient: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  switchText: { color: '#94a3b8', textAlign: 'center', marginTop: 14 },
});
