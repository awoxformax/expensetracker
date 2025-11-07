import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useUser } from '../../src/context/UserContext';
import { useAuth } from '../../src/context/AuthContext';
import { API_BASE_URL } from '../../src/lib/config';
import { CategoryLimit, useTransactions } from '../../src/context/TransactionsContext';

const showToast = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert(message);
  }
};

export default function CategoryLimitsScreen() {
  const { colors, fonts } = useTheme();
  const router = useRouter();
  const { state } = useUser();
  const { token } = useAuth();
  const { refreshLimits } = useTransactions();

  const categories = state.categories ?? [];
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.name || '');
  const [limitValue, setLimitValue] = useState('');
  const [limits, setLimits] = useState<CategoryLimit[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCategory && categories.length) {
      setSelectedCategory(categories[0].name);
    }
  }, [categories, selectedCategory]);

  const headers = useMemo(() => {
    if (!token) return undefined;
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, [token]);

  const fetchLimits = useCallback(async () => {
    if (!headers) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/limits`, {
        method: 'GET',
        headers,
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Limiti yükləmək mümkün olmadı');
      }
      setLimits(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Naməlum xəta baş verdi');
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  const handleSave = useCallback(async () => {
    if (!headers) {
      setError('Sessiya tapılmadı. Yenidən daxil olun.');
      return;
    }
    if (!selectedCategory) {
      setError('Kateqoriya seçilməyib');
      return;
    }
    const numeric = Number(limitValue);
    if (Number.isNaN(numeric) || numeric <= 0) {
      setError('Limit məbləğini düzgün daxil edin');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/limits`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ category: selectedCategory, monthlyLimit: numeric }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Limit saxlanılmadı');
      }
      setLimits((prev) => {
        const exists = prev.find((item) => item._id === data.data._id);
        if (exists) {
          return prev.map((item) => (item._id === data.data._id ? data.data : item));
        }
        return [data.data, ...prev];
      });
      await refreshLimits();
      showToast('Limit saxlanıldı');
      setLimitValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Limit saxlanılmadı');
    } finally {
      setSaving(false);
    }
  }, [headers, limitValue, refreshLimits, selectedCategory]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!headers) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/settings/limits/${id}`, {
          method: 'DELETE',
          headers,
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Silmək mümkün olmadı');
        }
        setLimits((prev) => prev.filter((item) => item._id !== id));
        await refreshLimits();
        showToast('Limit silindi');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Limit silinmədi');
      }
    },
    [headers, refreshLimits]
  );

  const hasCategories = categories.length > 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text, fontFamily: fonts.heading }]}>
            Limitlər
          </Text>
          <View style={{ width: 32 }} />
        </View>
        <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
          Kateqoriya üçün aylıq xərc limitini təyin edin. Limitə yaxınlaşdıqda xəbərdarlıq alacaqsınız.
        </Text>

        {!hasCategories ? (
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            Əvvəlcə kateqoriya əlavə etməlisiniz.
          </Text>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Kateqoriya seç</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {categories.map((cat) => {
                const active = selectedCategory === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primary : colors.card,
                      },
                    ]}
                    onPress={() => setSelectedCategory(cat.name)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? '#fff' : colors.text },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.inputGroup}>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Limit məbləği (AZN)</Text>
              <TextInput
                style={[styles.input, { borderColor: `${colors.textMuted}55`, color: colors.text }]}
                placeholder="məs: 300"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={limitValue}
                onChangeText={setLimitValue}
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: saving ? colors.card : colors.primary },
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveText}>{saving ? 'Saxlanılır...' : 'Limiti saxla'}</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: colors.text }]}>Mövcud limitlər</Text>
          {loading && <ActivityIndicator size="small" color={colors.text} />}
        </View>

        {limits.length === 0 && !loading ? (
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            Hələ limit təyin etməmisiniz.
          </Text>
        ) : (
          limits.map((item) => (
            <View key={item._id} style={[styles.limitRow, { borderColor: `${colors.textMuted}33` }]}>
              <View>
                <Text style={[styles.limitCategory, { color: colors.text }]}>{item.category}</Text>
                <Text style={[styles.limitValue, { color: colors.textMuted }]}>
                  {item.monthlyLimit} AZN / ay
                </Text>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 16,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b11',
  },
  title: { fontSize: 22 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '600' },
  chipRow: { marginVertical: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginRight: 10,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  inputGroup: { marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginTop: 6,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: { color: '#ef4444', fontSize: 13 },
  infoText: { fontSize: 13 },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  listTitle: { fontSize: 16, fontWeight: '600' },
  limitRow: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  limitCategory: { fontSize: 15, fontWeight: '600' },
  limitValue: { fontSize: 13, marginTop: 2 },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef44440a',
  },
});

