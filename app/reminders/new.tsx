import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useTransactions } from "../../src/context/TransactionsContext";

const COLORS = {
  background: "#F8FAFF",
  card: "#FFFFFF",
  primary: "#2563EB",
  border: "#E2E8F0",
  text: "#0F172A",
  muted: "#64748B",
};

export default function ReminderCreateScreen() {
  const router = useRouter();
  const { categories, addReminder } = useTransactions();
  const expenseCategories = useMemo(
    () => categories.filter((cat) => cat.type === "expense"),
    [categories]
  );

  const [kind, setKind] = useState<"income" | "expense">("income");
  const [title, setTitle] = useState("");
  const [incomeSubtype, setIncomeSubtype] = useState<"salary" | "stipend" | "other">("salary");
  const [selectedCategory, setSelectedCategory] = useState(expenseCategories[0]?.name ?? "");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [hour, setHour] = useState("9");

  const [startPickerVisible, setStartPickerVisible] = useState(Platform.OS === "ios");
  const [endPickerVisible, setEndPickerVisible] = useState(false);

  const handleStartChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setStartPickerVisible(false);
    if (date) {
      setStartDate(date);
      if (date > endDate) setEndDate(date);
    }
  };

  const handleEndChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setEndPickerVisible(false);
    if (date) setEndDate(date < startDate ? startDate : date);
  };

  const submitReminder = async () => {
    if (!title.trim()) {
      Alert.alert("Başlıq tələb olunur", "Xatırlatma üçün başlıq yazın.");
      return;
    }
    if (kind === "expense" && !selectedCategory) {
      Alert.alert("Kateqoriya seçin", "Ödəniş üçün kateqoriya seçin.");
      return;
    }
    const parsedHour = Number(hour);
    const safeHour = Number.isNaN(parsedHour) ? 9 : Math.min(Math.max(parsedHour, 0), 23);
    await addReminder({
      id: `${Date.now()}`,
      title: title.trim(),
      kind,
      action: kind === "income" ? "open_income_form" : "navigate_category",
      category: kind === "expense" ? selectedCategory : undefined,
      incomeSubtype: kind === "income" ? incomeSubtype : undefined,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      atHour: safeHour,
    });
    router.back();
  };

  const formatDate = (date: Date) =>
    `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${date.getFullYear()}`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Yeni xatırlatma</Text>
        <Text style={styles.subtitle}>
          Gəlir və ya ödəniş üçün təkrarlanan xatırlatma qurun. Bildirişə toxunduqda uyğun
          əməliyyat ekranı açılacaq.
        </Text>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Seçim</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleChip, kind === "income" && styles.toggleChipActive]}
              onPress={() => setKind("income")}
            >
              <Text
                style={[
                  styles.toggleChipText,
                  kind === "income" && styles.toggleChipTextActive,
                ]}
              >
                Gəlir
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleChip, kind === "expense" && styles.toggleChipActive]}
              onPress={() => setKind("expense")}
            >
              <Text
                style={[
                  styles.toggleChipText,
                  kind === "expense" && styles.toggleChipTextActive,
                ]}
              >
                Ödəniş
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Başlıq</Text>
          <TextInput
            style={styles.input}
            placeholder="Məs: Maaş daxil oldu?"
            value={title}
            onChangeText={setTitle}
          />

          {kind === "income" ? (
            <>
              <Text style={styles.fieldLabel}>Gəlir növü</Text>
              <View style={styles.chipRow}>
                {(["salary", "stipend", "other"] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.pill,
                      incomeSubtype === type && styles.pillActive,
                    ]}
                    onPress={() => setIncomeSubtype(type)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        incomeSubtype === type && styles.pillTextActive,
                      ]}
                    >
                      {type === "salary" ? "Maaş" : type === "stipend" ? "Stipendiya" : "Digər"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.fieldLabel}>Kateqoriya</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {expenseCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.pill,
                      selectedCategory === cat.name && styles.pillActive,
                    ]}
                    onPress={() => setSelectedCategory(cat.name)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        selectedCategory === cat.name && styles.pillTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={styles.fieldLabel}>Tarix aralığı</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateChip}
              onPress={() => setStartPickerVisible(true)}
            >
              <Ionicons name="calendar-outline" size={16} color={COLORS.text} />
              <Text style={styles.dateChipText}>{formatDate(startDate)}</Text>
            </TouchableOpacity>
            <Ionicons name="swap-horizontal" size={18} color={COLORS.muted} />
            <TouchableOpacity
              style={styles.dateChip}
              onPress={() => setEndPickerVisible(true)}
            >
              <Ionicons name="calendar-outline" size={16} color={COLORS.text} />
              <Text style={styles.dateChipText}>{formatDate(endDate)}</Text>
            </TouchableOpacity>
          </View>
          {startPickerVisible && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={handleStartChange}
            />
          )}
          {endPickerVisible && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={handleEndChange}
            />
          )}

          <Text style={styles.fieldLabel}>Saat</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={hour}
            onChangeText={setHour}
            placeholder="09"
          />

          <TouchableOpacity style={styles.submitBtn} onPress={submitReminder}>
            <Text style={styles.submitText}>Planlaşdır</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 80 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.text },
  subtitle: { color: COLORS.muted, marginTop: 6 },
  card: {
    marginTop: 20,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  fieldLabel: { marginTop: 16, fontSize: 13, fontWeight: "600", color: COLORS.muted },
  toggleRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  toggleChip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    alignItems: "center",
  },
  toggleChipActive: { borderColor: COLORS.primary, backgroundColor: "#E3ECFF" },
  toggleChipText: { color: COLORS.muted, fontWeight: "600" },
  toggleChipTextActive: { color: COLORS.primary },
  input: {
    marginTop: 8,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    color: COLORS.text,
  },
  chipRow: { flexDirection: "row", marginTop: 12 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    marginRight: 10,
  },
  pillActive: { backgroundColor: COLORS.primary },
  pillText: { color: COLORS.text, fontWeight: "600" },
  pillTextActive: { color: "#fff" },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  dateChipText: { color: COLORS.text, fontWeight: "600" },
  submitBtn: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
