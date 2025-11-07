import React, { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useTransactions } from '../../src/context/TransactionsContext';
import { useAuth } from '../../src/context/AuthContext';
import { API_BASE_URL } from '../../src/lib/config';
import { scheduleLocal, scheduleRecurringReminder } from '../../src/lib/notify';

const showToast = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert(message);
  }
};

const formatInputDate = (date: Date) => date.toISOString().split('T')[0];

const parseInputDate = (value: string) => {
  const [year, month, day] = value.split('-').map((v) => Number(v));
  if (!year || !month || !day) {
    return null;
  }
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

type Frequency = 'monthly' | 'weekly';

export default function TransactionsRoute() {
  const today = useMemo(() => formatInputDate(new Date()), []);
  const { colors, fonts } = useTheme();
  const { token } = useAuth();
  const { createTransaction, loading, error } = useTransactions();
  const inputBorderColor = useMemo(() => `${colors.textMuted}55`, [colors.textMuted]);

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [dateValue, setDateValue] = useState(today);
  const [remind, setRemind] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [localError, setLocalError] = useState<string | null>(null);
  const [notificationId, setNotificationId] = useState<string | null>(null);
  const [submittingRecurring, setSubmittingRecurring] = useState(false);

  const isSubmitting = loading || submittingRecurring;

  const resetForm = () => {
    setCategory('');
    setAmount('');
    setNote('');
    setRemind(false);
    setIsRecurring(false);
    setFrequency('monthly');
  };

  const handleRecurringSubmit = async (
    parsedDate: Date,
    payload: {
      type: 'income' | 'expense';
      category: string;
      amount: number;
      note?: string;
      date: string;
      notify: boolean;
    }
  ) => {
    if (!token) {
      setLocalError('Sessiya tapılmadı, yenidən giriş edin.');
      return;
    }
    const repeatRule =
      frequency === 'monthly'
        ? { freq: 'monthly', dayOfMonth: parsedDate.getDate() }
        : { freq: 'weekly', weekday: parsedDate.getDay() };

    setSubmittingRecurring(true);
    setLocalError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/recurring`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          repeatRule,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Müntəzəm əməliyyatı yaratmaq olmadı');
      }

      if (payload.notify && data.data?._id) {
        const scheduledId = await scheduleRecurringReminder(
          data.data._id,
          type,
          parsedDate,
          'Xatırlatma',
          `${payload.category} əməliyyatını unutma`
        );
        setNotificationId(scheduledId);
        showToast('Xatırlatma quruldu');
      }

      showToast('Müntəzəm əməliyyat əlavə olundu');
      resetForm();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Xəta baş verdi');
    } finally {
      setSubmittingRecurring(false);
    }
  };

  const handleSubmit = async () => {
    const numericAmount = Number(amount);
    if (!category.trim()) {
      setLocalError('Kateqoriya tələb olunur');
      return;
    }
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      setLocalError('Məbləği düzgün daxil edin');
      return;
    }
    const parsedDate = parseInputDate(dateValue);
    if (!parsedDate) {
      setLocalError('Tarix formatı YYYY-MM-DD olmalıdır');
      return;
    }
    setLocalError(null);

    const basePayload = {
      type,
      category: category.trim(),
      amount: numericAmount,
      note: note.trim() || undefined,
      date: parsedDate.toISOString(),
      notify: remind,
    };

    if (isRecurring) {
      await handleRecurringSubmit(parsedDate, basePayload);
      return;
    }

    const success = await createTransaction(basePayload);
    if (!success) return;

    if (remind) {
      try {
        const id = await scheduleLocal(
          type,
          parsedDate,
          'Xatırlatma',
          `${basePayload.category} əməliyyatını unutma`
        );
        setNotificationId(id);
        showToast('Xatırlatma quruldu');
      } catch (err) {
        console.warn('Failed to schedule local reminder', err);
      }
    }

    showToast('Əməliyyat əlavə olundu');
    resetForm();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.heading }]}>Əməliyyat əlavə et</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
          Müntəzəm və ya tək əməliyyatları buradan yarat, istəsən xatırlatma qur.
        </Text>

        <View style={styles.segmented}>
          {(['expense', 'income'] as const).map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.segmentButton,
                {
                  backgroundColor: type === item ? colors.primary : colors.card,
                },
              ]}
              onPress={() => setType(item)}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: type === item ? '#fff' : colors.text,
                  },
                ]}
              >
                {item === 'expense' ? 'Xərc' : 'Gəlir'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Kateqoriya</Text>
          <TextInput
            style={[styles.input, { borderColor: inputBorderColor, color: colors.text }]}
            placeholder="məs: Qida"
            placeholderTextColor={colors.textMuted}
            value={category}
            onChangeText={setCategory}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Məbləğ</Text>
          <TextInput
            style={[styles.input, { borderColor: inputBorderColor, color: colors.text }]}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Tarix (YYYY-MM-DD)</Text>
          <TextInput
            style={[styles.input, { borderColor: inputBorderColor, color: colors.text }]}
            placeholder={today}
            placeholderTextColor={colors.textMuted}
            value={dateValue}
            onChangeText={setDateValue}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Qeyd</Text>
          <TextInput
            style={[styles.input, { borderColor: inputBorderColor, color: colors.text, height: 80 }]}
            placeholder="Qısa qeyd"
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
          />
        </View>

        <View style={styles.toggleRow}>
          <View>
            <Text style={[styles.label, { color: colors.text }]}>Müntəzəm</Text>
            <Text style={[styles.helper, { color: colors.textMuted }]}>
              Həftəlik və ya aylıq təkrarlanan əməliyyat yarat
            </Text>
          </View>
          <Switch value={isRecurring} onValueChange={setIsRecurring} />
        </View>

        {isRecurring && (
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Dövrilik</Text>
            <View style={styles.segmented}>
              {(['monthly', 'weekly'] as const).map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.segmentButton,
                    {
                      backgroundColor: frequency === item ? colors.primary : colors.card,
                    },
                  ]}
                  onPress={() => setFrequency(item)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: frequency === item ? '#fff' : colors.text,
                      },
                    ]}
                  >
                    {item === 'monthly' ? 'Aylıq' : 'Həftəlik'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.toggleRow}>
          <View>
            <Text style={[styles.label, { color: colors.text }]}>Xatırlatma</Text>
            <Text style={[styles.helper, { color: colors.textMuted }]}>
              Tarixdə 10:00-da yerli bildiriş al
            </Text>
          </View>
          <Switch value={remind} onValueChange={setRemind} />
        </View>

        {(localError || error) && (
          <Text style={styles.errorText}>{localError || error}</Text>
        )}

        {notificationId && (
          <Text style={[styles.helper, { color: colors.textMuted }]}>
            Son xatırlatma ID: {notificationId}
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: isSubmitting ? colors.card : colors.primary },
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitText}>{isSubmitting ? 'Göndərilir...' : 'Əlavə et'}</Text>
        </TouchableOpacity>
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
    paddingBottom: 80,
    gap: 16,
  },
  title: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  segmented: {
    flexDirection: 'row',
    gap: 12,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  helper: {
    fontSize: 12,
  },
  submitButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
  },
});
