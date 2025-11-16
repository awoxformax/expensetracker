import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTransactions, Category, Reminder } from "../../src/context/TransactionsContext";
import { useTheme } from "../../src/theme/ThemeProvider";

type FormConfig = {
  visible: boolean;
  type: "income" | "expense";
  presetCategory?: string;
};

const amountLabel = (value?: number) => `${(value ?? 0).toFixed(2)} AZN`;

export default function TransactionsScreen() {
  const router = useRouter();
  const { categories, reminders, createTransaction, addCategory, addReminder } = useTransactions();
  const { colors, isDark } = useTheme();
  const palette = useMemo(
    () => ({
      background: colors.background,
      card: colors.card,
      text: colors.text,
      muted: colors.textMuted,
      border: colors.border,
      primary: colors.primary ?? "#2563EB",
      secondary: isDark ? "rgba(255,255,255,0.08)" : "#EEF2FF",
      shadow: isDark ? "rgba(0,0,0,0.45)" : "rgba(15,23,42,0.08)",
      surfaceMuted: isDark ? "rgba(148,163,184,0.15)" : "#E0EAFF",
    }),
    [colors, isDark]
  );
  const styles = useMemo(() => createStyles(palette), [palette]);
  const incomeSubtypeLabels: Record<"salary" | "stipend" | "other", string> = {
    salary: "Maaş",
    stipend: "Stipendiya",
    other: "Digər gəlir",
  };
  const creditProfileLabels: Record<"student" | "family" | "other", string> = {
    student: "Tələbə",
    family: "Ailə başçısı",
    other: "Digər",
  };

  const expenseCategories = useMemo(
    () => categories.filter((cat) => cat.type === "expense"),
    [categories]
  );
  const incomeCategories = useMemo(
    () => categories.filter((cat) => cat.type === "income"),
    [categories]
  );

  const [formConfig, setFormConfig] = useState<FormConfig>({ visible: false, type: "expense" });
  const [formCategory, setFormCategory] = useState<string>("");
  const [formAmount, setFormAmount] = useState<string>("");
  const [formNote, setFormNote] = useState<string>("");
  const [formDate, setFormDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(Platform.OS === "ios");

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"income" | "expense">("expense");
  const [newCatLimit, setNewCatLimit] = useState("");

  const params = useLocalSearchParams<{
    newReminder?: string;
    captureIncome?: string;
    subtype?: string;
    captureExpense?: string;
    category?: string;
    type?: string;
  }>();

  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [reminderKind, setReminderKind] = useState<"income" | "expense">("income");
  const [incomeSubtype, setIncomeSubtype] = useState<"salary" | "stipend" | "other">("salary");
  const [creditProfile, setCreditProfile] = useState<"student" | "family" | "other">("student");
  const [reminderStart, setReminderStart] = useState<Date>(new Date());
  const [reminderEnd, setReminderEnd] = useState<Date>(new Date());
  const [reminderDue, setReminderDue] = useState<Date>(new Date());
  const [showReminderStartPicker, setShowReminderStartPicker] = useState<boolean>(false);
  const [showReminderEndPicker, setShowReminderEndPicker] = useState<boolean>(false);
  const [showReminderDuePicker, setShowReminderDuePicker] = useState<boolean>(false);

  const openReminderModal = useCallback(() => {
    const now = new Date();
    setReminderKind("income");
    setIncomeSubtype("salary");
    setCreditProfile("student");
    setReminderStart(now);
    setReminderEnd(now);
    setReminderDue(now);
    setShowReminderStartPicker(Platform.OS === "ios");
    setShowReminderEndPicker(Platform.OS === "ios");
    setShowReminderDuePicker(Platform.OS === "ios");
    setReminderModalVisible(true);
  }, []);

  const closeReminderModal = () => setReminderModalVisible(false);

  const openTransactionForm = useCallback(
    (type: "income" | "expense", preset?: string) => {
      const fallbackCategory =
        type === "expense" ? expenseCategories[0]?.name : incomeCategories[0]?.name;
      setFormConfig({ visible: true, type, presetCategory: preset });
      setFormCategory(preset || fallbackCategory || "");
      setFormAmount("");
      setFormNote("");
      setFormDate(new Date());
      setShowDatePicker(Platform.OS === "ios");
    },
    [expenseCategories, incomeCategories]
  );

  const closeTransactionForm = () => setFormConfig((prev) => ({ ...prev, visible: false }));

  const handleDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selected) setFormDate(selected);
  };

  const handleReminderStartChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowReminderStartPicker(false);
    if (selected) {
      setReminderStart(selected);
      if (selected > reminderEnd) setReminderEnd(selected);
    }
  };

  const handleReminderEndChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowReminderEndPicker(false);
    if (selected) setReminderEnd(selected);
  };

  const handleReminderDueChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowReminderDuePicker(false);
    if (selected) setReminderDue(selected);
  };

  const submitTransaction = async () => {
    const numericAmount = Number((formAmount || "").replace(",", "."));
    if (!formCategory) {
      Alert.alert("Kateqoriya seçin", "Əvvəlcə kateqoriya seçməlisiniz.");
      return;
    }
    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Məbləğ tələb olunur", "Düzgün məbləğ daxil edin.");
      return;
    }
    const ok = await createTransaction({
      type: formConfig.type,
      category: formCategory,
      amount: numericAmount,
      note: formNote.trim() || undefined,
      date: formDate.toISOString(),
    });
    if (ok) {
      closeTransactionForm();
    }
  };

  const submitCategory = async () => {
    if (!newCatName.trim()) {
      Alert.alert("Boş kateqoriya", "Kateqoriya adı daxil edin.");
      return;
    }
    const parsedLimit = newCatLimit ? Number(newCatLimit.replace(",", ".")) : undefined;
    if (parsedLimit !== undefined && (Number.isNaN(parsedLimit) || parsedLimit <= 0)) {
      Alert.alert("Limit səhvdir", "Limit müsbət rəqəm olmalıdır.");
      return;
    }
    await addCategory(newCatName.trim(), newCatType, parsedLimit);
    setNewCatName("");
    setNewCatLimit("");
    setCategoryModalVisible(false);
  };

  const submitReminder = async () => {
    if (reminderKind === "income" && reminderEnd.getTime() < reminderStart.getTime()) {
      Alert.alert("Tarixlər uyğunsuzdur", "Başlanğıc tarixi bitiş tarixindən böyük ola bilməz.");
      return;
    }

    const reminderPayload: Reminder = {
      id: `rem-${Date.now()}`,
      kind: reminderKind,
      title:
        reminderKind === "income"
          ? `${incomeSubtypeLabels[incomeSubtype]} xatırlatması`
          : `Kredit (${creditProfileLabels[creditProfile]})`,
      action: reminderKind === "income" ? "open_income_form" : "navigate_category",
      category: reminderKind === "expense" ? "Kredit" : undefined,
      incomeSubtype: reminderKind === "income" ? incomeSubtype : undefined,
      startDate: reminderKind === "income" ? reminderStart.toISOString() : reminderDue.toISOString(),
      endDate: reminderKind === "income" ? reminderEnd.toISOString() : undefined,
      atHour: reminderKind === "income" ? 9 : 8,
    };

    await addReminder(reminderPayload);
    closeReminderModal();
  };

  useEffect(() => {
    if (params.newReminder && !reminderModalVisible) {
      openReminderModal();
      router.replace("/(tabs)/transactions");
    }
  }, [params.newReminder, reminderModalVisible, openReminderModal, router]);

  useEffect(() => {
    if (params.captureIncome && !formConfig.visible) {
      const subtype = (params.subtype as "salary" | "stipend" | "other") || "salary";
      const matchByName = (needle: string) =>
        incomeCategories.find((cat) => cat.name.toLowerCase().includes(needle))?.name;
      const presetName =
        (subtype === "stipend" ? matchByName("stip") : undefined) ||
        (subtype === "salary" ? matchByName("maa") : undefined) ||
        incomeCategories[0]?.name ||
        "";

      Alert.alert(
        "Maaşınız köçdü?",
        "Məbləği qeyd etmək istəyirsiniz?",
        [
          {
            text: "Daha sonra",
            style: "cancel",
            onPress: () => router.replace("/(tabs)/transactions"),
          },
          {
            text: "Bəli",
            onPress: () => {
              openTransactionForm("income", presetName);
              setFormNote(incomeSubtypeLabels[subtype]);
              router.replace("/(tabs)/transactions");
            },
          },
        ]
      );
    }
  }, [
    params.captureIncome,
    params.subtype,
    formConfig.visible,
    incomeCategories,
    incomeSubtypeLabels,
    openTransactionForm,
    router,
  ]);

  useEffect(() => {
    if (params.captureExpense && !formConfig.visible) {
      const categoryParam = (params.category as string) || "Kredit";
      const matched =
        expenseCategories.find((cat) =>
          cat.name.toLowerCase().includes(categoryParam.toLowerCase())
        )?.name || categoryParam;

      Alert.alert(
        "Kredit ödənişi",
        "Ödənişi qeyd etmək istəyirsiniz?",
        [
          {
            text: "Sonra",
            style: "cancel",
            onPress: () => router.replace("/(tabs)/transactions"),
          },
          {
            text: "İndi qeyd et",
            onPress: () => {
              openTransactionForm("expense", matched);
              setFormNote("Kredit ödənişi");
              router.replace("/(tabs)/transactions");
            },
          },
        ]
      );
    }
  }, [
    params.captureExpense,
    params.category,
    formConfig.visible,
    expenseCategories,
    openTransactionForm,
    router,
  ]);

  useEffect(() => {
    if (params.type && !formConfig.visible) {
      const presetType = params.type === "income" ? "income" : "expense";
      openTransactionForm(presetType);
      router.replace("/(tabs)/transactions");
    }
  }, [params.type, formConfig.visible, openTransactionForm, router]);

  useEffect(() => {
    if (reminderKind === "income") {
      setShowReminderDuePicker(false);
    } else {
      setShowReminderStartPicker(false);
      setShowReminderEndPicker(false);
    }
  }, [reminderKind]);

  const recentReminders = useMemo(
    () =>
      reminders
        .slice()
        .sort(
          (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        )
        .slice(0, 3),
    [reminders]
  );

  const reminderLabel = (dateISO: string) => {
    const d = new Date(dateISO);
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}.${d.getFullYear()}`;
  };

  const renderCategoryCard = (cat: Category) => {
    const progress =
      cat.limit && cat.limit > 0 ? Math.min((cat.spent ?? 0) / cat.limit, 1) : 0;
    return (
      <View key={cat.id} style={styles.categoryCard}>
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: cat.color ?? palette.secondary }]}>
            <Ionicons name={(cat.icon as any) || "pricetag-outline"} size={18} color={palette.text} />
          </View>
          <Text style={styles.categoryTitle}>{cat.name}</Text>
        </View>
        <Text style={styles.categoryMeta}>
          {cat.limit
            ? `${amountLabel(cat.spent)} / ${cat.limit.toFixed(2)} AZN`
            : `${amountLabel(cat.spent)} bu ay`}
        </Text>
        {cat.limit ? (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        ) : (
          <View style={styles.spacer} />
        )}
        <TouchableOpacity
          style={styles.cardButton}
          onPress={() => openTransactionForm("expense", cat.name)}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.cardButtonText}>Xərc əlavə et</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const categoryOptions =
    formConfig.type === "expense" ? expenseCategories : incomeCategories;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Əməliyyatlar</Text>
            <Text style={styles.heroSub}>
              Gəlir və xərcləri izləyin, kateqoriyalara limit qoyun və hamısı sinxron qalsın.
            </Text>
          </View>
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={[styles.heroButton, styles.heroButtonPrimary]}
              onPress={() => openTransactionForm("income")}
            >
              <Ionicons name="trending-up-outline" size={18} color="#fff" />
              <Text style={styles.heroButtonTextPrimary}>Gəlir əlavə et</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.heroButton, styles.heroButtonSecondary]}
              onPress={() => openTransactionForm("expense")}
            >
              <Ionicons name="cash-outline" size={18} color={palette.primary} />
              <Text style={styles.heroButtonTextSecondary}>Xərc əlavə et</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Əsas kateqoriyalar</Text>
            <Text style={styles.sectionSub}>Bütün seçimlərdə avtomatik görünəcək.</Text>
          </View>
          <TouchableOpacity
            style={styles.addChip}
            onPress={() => setCategoryModalVisible(true)}
          >
            <Ionicons name="add" size={18} color={palette.primary} />
            <Text style={styles.addChipText}>Yeni</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoryGrid}>
          {expenseCategories.map(renderCategoryCard)}
        </View>

        <View style={styles.incomePillSection}>
          <Text style={styles.sectionTitle}>Gəlir kateqoriyaları</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {incomeCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.pill,
                  formConfig.visible &&
                    formConfig.type === "income" &&
                    formCategory === cat.name &&
                    styles.pillActive,
                ]}
                onPress={() => openTransactionForm("income", cat.name)}
              >
                <Text
                  style={[
                    styles.pillText,
                    formConfig.visible &&
                      formConfig.type === "income" &&
                      formCategory === cat.name &&
                      styles.pillTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.reminderCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Xatırlatmalar</Text>
              <Text style={styles.sectionSub}>Gəlir və ödənişləri planlaşdır.</Text>
            </View>
            <TouchableOpacity style={styles.addChip} onPress={openReminderModal}>
              <Ionicons name="calendar-outline" size={16} color={palette.primary} />
              <Text style={styles.addChipText}>Yeni</Text>
            </TouchableOpacity>
          </View>
          {recentReminders.length ? (
            recentReminders.map((reminder) => (
              <View key={reminder.id} style={styles.reminderRow}>
                <View style={styles.reminderIcon}>
                  <Ionicons
                    name={reminder.kind === "income" ? "trending-up-outline" : "card-outline"}
                    size={18}
                    color={palette.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderTitle}>{reminder.title}</Text>
                  <Text style={styles.reminderMeta}>
                    {reminderLabel(reminder.startDate)}
                    {reminder.endDate ? ` • ${reminderLabel(reminder.endDate)}` : ""} •{" "}
                    {reminder.kind === "income" ? "Gəlir" : "Ödəniş"}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Hələ xatırlatma yoxdur.</Text>
          )}
        </View>
      </ScrollView>

      <Modal visible={formConfig.visible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {formConfig.type === "income" ? "Gəlir əlavə et" : "Xərc əlavə et"}
              </Text>
              <TouchableOpacity onPress={closeTransactionForm}>
                <Ionicons name="close" size={24} color={palette.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>Kateqoriya</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
                {categoryOptions.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.pill,
                      formCategory === cat.name && styles.pillActive,
                    ]}
                    onPress={() => setFormCategory(cat.name)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        formCategory === cat.name && styles.pillTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.modalLabel}>Məbləğ</Text>
              <TextInput
                value={formAmount}
                onChangeText={setFormAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                style={styles.input}
              />

              <Text style={[styles.modalLabel, { marginTop: 16 }]}>Qeyd</Text>
              <TextInput
                value={formNote}
                onChangeText={setFormNote}
                placeholder="Opsional"
                style={[styles.input, { height: 42 }]}
              />

              <View style={styles.dateRow}>
                <Text style={styles.modalLabel}>Tarix</Text>
                <TouchableOpacity
                  style={styles.dateChip}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={16} color={palette.text} />
                  <Text style={styles.dateChipText}>{reminderLabel(formDate.toISOString())}</Text>
                </TouchableOpacity>
              </View>
              {showDatePicker && (
                <DateTimePicker
                  value={formDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={handleDateChange}
                />
              )}
            </ScrollView>

            <TouchableOpacity style={styles.submitBtn} onPress={submitTransaction}>
              <Text style={styles.submitText}>Yadda saxla</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={reminderModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni xatırlatma</Text>
              <TouchableOpacity onPress={closeReminderModal}>
                <Ionicons name="close" size={24} color={palette.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleChip, reminderKind === "income" && styles.toggleChipActive]}
                onPress={() => setReminderKind("income")}
              >
                <Text
                  style={[
                    styles.toggleChipText,
                    reminderKind === "income" && styles.toggleChipTextActive,
                  ]}
                >
                  Gəlir
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleChip, reminderKind === "expense" && styles.toggleChipActive]}
                onPress={() => setReminderKind("expense")}
              >
                <Text
                  style={[
                    styles.toggleChipText,
                    reminderKind === "expense" && styles.toggleChipTextActive,
                  ]}
                >
                  Ödəniş
                </Text>
              </TouchableOpacity>
            </View>

            {reminderKind === "income" ? (
              <>
                <Text style={styles.modalLabel}>Gəlir növü</Text>
                <View style={styles.toggleRow}>
                  {(["salary", "stipend", "other"] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.toggleChip,
                        incomeSubtype === option && styles.toggleChipActive,
                      ]}
                      onPress={() => setIncomeSubtype(option)}
                    >
                      <Text
                        style={[
                          styles.toggleChipText,
                          incomeSubtype === option && styles.toggleChipTextActive,
                        ]}
                      >
                        {incomeSubtypeLabels[option]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.dateRow}>
                  <Text style={styles.modalLabel}>Başlanğıc</Text>
                  <TouchableOpacity
                    style={styles.dateChip}
                    onPress={() => setShowReminderStartPicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={16} color={palette.text} />
                    <Text style={styles.dateChipText}>{reminderLabel(reminderStart.toISOString())}</Text>
                  </TouchableOpacity>
                </View>
                {showReminderStartPicker && (
                  <DateTimePicker
                    value={reminderStart}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={handleReminderStartChange}
                  />
                )}

                <View style={[styles.dateRow, { marginTop: 14 }]}>
                  <Text style={styles.modalLabel}>Bitmə tarixi</Text>
                  <TouchableOpacity
                    style={styles.dateChip}
                    onPress={() => setShowReminderEndPicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={16} color={palette.text} />
                    <Text style={styles.dateChipText}>{reminderLabel(reminderEnd.toISOString())}</Text>
                  </TouchableOpacity>
                </View>
                {showReminderEndPicker && (
                  <DateTimePicker
                    value={reminderEnd}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={handleReminderEndChange}
                  />
                )}

                <Text style={styles.reminderInfo}>
                  Seçilən tarix aralığında hər gün səhər 09:00-da xatırlatma göndəriləcək.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.modalLabel}>Kredit portfeli</Text>
                <View style={styles.toggleRow}>
                  {(["student", "family", "other"] as const).map((profile) => (
                    <TouchableOpacity
                      key={profile}
                      style={[
                        styles.toggleChip,
                        creditProfile === profile && styles.toggleChipActive,
                      ]}
                      onPress={() => setCreditProfile(profile)}
                    >
                      <Text
                        style={[
                          styles.toggleChipText,
                          creditProfile === profile && styles.toggleChipTextActive,
                        ]}
                      >
                        {creditProfileLabels[profile]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.dateRow}>
                  <Text style={styles.modalLabel}>Ödəniş günü</Text>
                  <TouchableOpacity
                    style={styles.dateChip}
                    onPress={() => setShowReminderDuePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={16} color={palette.text} />
                    <Text style={styles.dateChipText}>{reminderLabel(reminderDue.toISOString())}</Text>
                  </TouchableOpacity>
                </View>
                {showReminderDuePicker && (
                  <DateTimePicker
                    value={reminderDue}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={handleReminderDueChange}
                  />
                )}

                <Text style={styles.reminderInfo}>
                  Kredit üçün seçdiyiniz gündə saat 08:00-da bildiriş alacaqsınız.
                </Text>
              </>
            )}

            <TouchableOpacity style={[styles.submitBtn, { marginTop: 24 }]} onPress={submitReminder}>
              <Text style={styles.submitText}>Planlaşdır</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={categoryModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni kateqoriya</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={24} color={palette.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Kateqoriya adı"
              value={newCatName}
              onChangeText={setNewCatName}
            />
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.toggleChip,
                  newCatType === "expense" && styles.toggleChipActive,
                ]}
                onPress={() => setNewCatType("expense")}
              >
                <Text
                  style={[
                    styles.toggleChipText,
                    newCatType === "expense" && styles.toggleChipTextActive,
                  ]}
                >
                  Xərc
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleChip,
                  newCatType === "income" && styles.toggleChipActive,
                ]}
                onPress={() => setNewCatType("income")}
              >
                <Text
                  style={[
                    styles.toggleChipText,
                    newCatType === "income" && styles.toggleChipTextActive,
                  ]}
                >
                  Gəlir
                </Text>
              </TouchableOpacity>
            </View>
            {newCatType === "expense" && (
              <TextInput
                style={[styles.input, { marginTop: 12 }]}
                placeholder="Aylıq limit (opsional)"
                keyboardType="numeric"
                value={newCatLimit}
                onChangeText={setNewCatLimit}
              />
            )}
            <TouchableOpacity style={styles.submitBtn} onPress={submitCategory}>
              <Text style={styles.submitText}>Əlavə et</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: TransactionsPalette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    scroll: { padding: 20, paddingBottom: 120 },
    hero: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 20,
      shadowColor: theme.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
    },
    heroTitle: { fontSize: 22, fontWeight: "800", color: theme.text },
    heroSub: { color: theme.muted, marginTop: 6 },
    heroActions: { flexDirection: "row", marginTop: 18, gap: 12, flexWrap: "wrap" },
    heroButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    heroButtonPrimary: { backgroundColor: theme.primary },
    heroButtonSecondary: { backgroundColor: theme.secondary },
    heroButtonTextPrimary: { color: "#fff", fontWeight: "700" },
    heroButtonTextSecondary: { color: theme.primary, fontWeight: "700" },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 28,
    },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: theme.text },
    sectionSub: { fontSize: 12, color: theme.muted, marginTop: 4 },
    addChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 6,
      backgroundColor: theme.surfaceMuted,
    },
    addChipText: { color: theme.primary, fontWeight: "600" },
    categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16 },
    categoryCard: {
      width: "48%",
      backgroundColor: theme.card,
      borderRadius: 18,
      padding: 16,
      shadowColor: theme.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 1,
    },
    categoryHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    categoryIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    categoryTitle: { fontWeight: "700", color: theme.text },
    categoryMeta: { marginTop: 8, color: theme.muted, fontSize: 12 },
    progressTrack: {
      marginTop: 10,
      height: 6,
      borderRadius: 999,
      backgroundColor: theme.border,
    },
    progressFill: {
      height: 6,
      borderRadius: 999,
      backgroundColor: theme.primary,
    },
    spacer: { height: 12 },
    cardButton: {
      marginTop: 12,
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingVertical: 10,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
    },
    cardButtonText: { color: "#fff", fontWeight: "600" },
    incomePillSection: { marginTop: 28 },
    pill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.secondary,
      marginRight: 10,
    },
    pillActive: { backgroundColor: theme.primary },
    pillText: { color: theme.text, fontWeight: "600" },
    pillTextActive: { color: "#fff" },
    reminderCard: {
      marginTop: 30,
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 20,
      shadowColor: theme.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    reminderRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    reminderIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: theme.secondary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    reminderTitle: { fontWeight: "600", color: theme.text },
    reminderMeta: { color: theme.muted, fontSize: 12, marginTop: 2 },
    emptyText: { textAlign: "center", color: theme.muted, marginTop: 12 },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.35)",
      justifyContent: "flex-end",
      padding: 16,
    },
    modalCard: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    modalTitle: { fontSize: 18, fontWeight: "700", color: theme.text },
    modalLabel: { fontSize: 13, fontWeight: "600", color: theme.muted, marginTop: 8 },
    input: {
      marginTop: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      height: 44,
      color: theme.text,
    },
    dateRow: {
      marginTop: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dateChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.secondary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
    },
    dateChipText: { color: theme.text, fontWeight: "600" },
    submitBtn: {
      backgroundColor: theme.primary,
      borderRadius: 14,
      paddingVertical: 14,
      marginTop: 20,
      alignItems: "center",
    },
    submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    toggleRow: {
      flexDirection: "row",
      marginTop: 12,
      gap: 10,
    },
    toggleChip: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: 10,
      alignItems: "center",
    },
    toggleChipActive: { borderColor: theme.primary, backgroundColor: theme.secondary },
    toggleChipText: { color: theme.muted, fontWeight: "600" },
    toggleChipTextActive: { color: theme.primary },
    reminderInfo: { marginTop: 14, fontSize: 12, color: theme.muted },
  });

type TransactionsPalette = {
  background: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  secondary: string;
  shadow: string;
  surfaceMuted: string;
};
