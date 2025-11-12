import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const { fonts } = useTheme();
  const router = useRouter();

  const go = (route: 'Login' | 'Signup') => {
    router.push(route === 'Login' ? '/auth/login' : '/auth/signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.inner}>
          <Text style={[styles.title, { fontFamily: fonts.bold }]}>Expense Tracker</Text>
          <Text style={[styles.subtitle, { fontFamily: fonts.body }]}>Başlamaq üçün yeni hesab yarat və ya daxil ol.</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => go('Login')}>
            <LinearGradient colors={['#2563EB', '#1D4ED8']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.btn}>
              <Text style={styles.btnText}>Giriş et</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.9} onPress={() => go('Signup')}>
            <LinearGradient colors={['#38BDF8', '#2563EB']} start={{x:0,y:0}} end={{x:1,y:1}} style={[styles.btn, styles.btnSecondary]}>
              <Text style={styles.btnText}>Qeydiyyat</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F4F6FB', justifyContent: 'center' },
  content: { alignItems: 'center', width: '100%' },
  inner: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: '#1D4ED8', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#475569', textAlign: 'center' },
  actions: { width: '100%', maxWidth: 320 },
  btn: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  btnSecondary: { marginTop: 12 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
