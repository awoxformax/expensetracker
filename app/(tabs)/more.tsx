import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function MoreRoute() {
  const { colors, fonts } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.heading }]}>Daha çox</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
        Buradan əlavə funksiyaları idarə edə bilərsiniz.
      </Text>

      <View style={styles.cardList}>
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => router.push('/settings/limits')}>
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Kateqoriya limitləri</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
              Xərc kateqoriyalarına aylıq limit təyin edin.
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  cardList: {
    marginTop: 12,
    gap: 12,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { fontSize: 13, marginTop: 6 },
});
