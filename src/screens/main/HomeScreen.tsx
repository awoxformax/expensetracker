import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../theme/ThemeProvider";
import { useUser } from "../../context/UserContext";
import { useTransactions } from "../../context/TransactionsContext";

const PRIMARY = "#2563EB";
const PRIMARY_DARK = "#1E40AF";
const BG = "#F8F9FB";
const TEXT_DARK = "#1F2937";
const TEXT_MUTED = "#6B7280";

type QuickAction = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export default function HomeScreen() {
  const router = useRouter();
  const { logout, token } = useAuth();
  const { fonts } = useTheme();
  const { state } = useUser();
  const { transactions, reminders, loading, loadTransactions } = useTransactions();
  const insets = useSafeAreaInsets();

  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      loadTransactions(currentMonthKey);
    }, [loadTransactions, currentMonthKey, token])
  );

  const onRefresh = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      await loadTransactions(currentMonthKey);
    } finally {
      setRefreshing(false);
    }
  }, [loadTransactions, currentMonthKey, token]);

  const incomes = (transactions ?? []).filter((t) => t.type === "income");
  const expenses = (transactions ?? []).filter((t) => t.type === "expense");
  const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const fullName =
     [state?.profile?.firstName, state?.profile?.lastName].filter(Boolean).join(" ") || "Ehmedli";
  const friendlyName = fullName.split(" ")[0] || fullName;
  const initials = fullName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase() || "E";

const recentTransactions = useMemo(() => {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  return safeTransactions
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
}, [transactions]);



  const transactionAnimations = useRef<Animated.Value[]>([]);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!recentTransactions.length) {
      transactionAnimations.current = [];
      return;
    }

    transactionAnimations.current = recentTransactions.map(() => new Animated.Value(0));
    Animated.stagger(
      90,
      transactionAnimations.current.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      )
    ).start();
  }, [recentTransactions]);

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    return () => {
      pulseLoop.stop();
    };
  }, [pulseAnim]);

  const heroActions: QuickAction[] = useMemo(
    () => [
      {
        label: "Gəlir əlavə et",
        icon: "trending-up-outline",
        onPress: () => router.push({ pathname: "/(tabs)/transactions", params: { type: "income" } }),
      },
      {
        label: "Xərc əlavə et",
        icon: "trending-down-outline",
        onPress: () => router.push({ pathname: "/(tabs)/transactions", params: { type: "expense" } }),
      },
      { label: "Statistika", icon: "stats-chart-outline", onPress: () => router.push("/(tabs)/stats") },
    ],
    [router]
  );

  const upcomingReminders = useMemo(
    () =>
      reminders
        .slice()
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 3),
    [reminders]
  );

  const goToReminderBuilder = useCallback(() => {
    router.push({ pathname: "/(tabs)/transactions", params: { newReminder: "1" } });
  }, [router]);

  const formatDate = useCallback((value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}.${mm}.${d.getFullYear()}`;
  }, []);

  const emojiForCategory = useCallback((category?: string) => {
    if (!category) return "•";
    const key = category.toLowerCase();
    if (key.includes("qida") || key.includes("food")) return "🍽️";
    if (key.includes("neqliyat") || key.includes("transport")) return "⛽️";
    if (key.includes("kommunal") || key.includes("bill") || key.includes("utility")) return "💡";
    if (key.includes("maas") || key.includes("salary")) return "💼";
    if (key.includes("market") || key.includes("shop")) return "🛒";
    if (key.includes("eylence") || key.includes("fun") || key.includes("game")) return "🎧";
    return "•";
  }, []);

  const reminderDescription = useCallback(
    (reminder: { startDate: string; endDate?: string; kind: "income" | "expense" }) => {
      const rangeStart = formatDate(reminder.startDate);
      const rangeEnd = reminder.endDate ? formatDate(reminder.endDate) : null;
      const typeLabel = reminder.kind === "income" ? "Gəlir" : "Ödəniş";
      return rangeEnd && rangeEnd !== rangeStart ? `${rangeStart} – ${rangeEnd} • ${typeLabel}` : `${rangeStart} • ${typeLabel}`;
    },
    [formatDate]
  );

return (
<View style={styles.root}>
  <LinearGradient
    colors={["#00C853", "#009624"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 0, y: 1 }}
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 280,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
    }}
  />
    <StatusBar style="light" translucent backgroundColor="transparent" />

    {/* SafeAreaView artıq transparent olur */}
    <SafeAreaView style={[styles.safe, { backgroundColor: "transparent" }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Burdan aşağı sənin mövcud LinearGradient header kodun davam edir */}

{/* ✅ Yeni gradient və header bölməsi */}
<LinearGradient
  colors={["#00C853", "#009624"]}
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}
  style={[
    StyleSheet.absoluteFillObject,
    { height: 260, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  ]}
/>

<View style={[styles.header, { paddingTop: insets.top + 16 }]}>
  <View style={styles.headerBubble} />
  <View style={styles.headerBubbleSecondary} />

  <View style={styles.profileRow}>
    <View style={styles.profileInfo}>
      <View style={styles.avatar}>
        <Text style={[styles.avatarText, { fontFamily: fonts.heading }]}>{initials}</Text>
      </View>
      <View>
        <Text style={[styles.greeting, styles.profileName]}>{fullName}</Text>
        <Text style={styles.profileStatus}>Səni gördüyümüzə şad olduq, {friendlyName}</Text>
      </View>
    </View>

    <View style={styles.headerActions}>
      <TouchableOpacity style={styles.circleIcon} onPress={() => router.push("/(tabs)/more")}>
        <Ionicons name="qr-code-outline" size={18} color="#E5E7FF" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.circleIcon} onPress={() => router.push("/notifications" as any)}>
        <Ionicons name="notifications-outline" size={18} color="#E5E7FF" />
      </TouchableOpacity>
    </View>
  </View>

  <View style={styles.balanceHero}>
    <View style={styles.balanceValueRow}>
      <Text style={[styles.balanceValue, { fontFamily: fonts.heading }]}>
        {showBalance ? balance.toFixed(2) : "***"}
      </Text>
      <Text style={styles.balanceCurrencyInline}>₼</Text>
    </View>
    <TouchableOpacity style={styles.eyeHero} onPress={() => setShowBalance((prev) => !prev)}>
      <Ionicons
        name={showBalance ? "eye-outline" : "eye-off-outline"}
        size={20}
        color="#E5E7FF"
      />
    </TouchableOpacity>
  </View>
</View>


          <View style={styles.bodyCard}>
            <View style={styles.heroActionsWrapper}>
              {heroActions.map((action) => (
                <Pressable
                  key={action.label}
                  style={({ pressed }) => [styles.heroActionCard, pressed && styles.heroActionCardPressed]}
                  onPress={action.onPress}
                >
                  <View style={styles.heroActionIcon}>
                    <Ionicons name={action.icon} size={20} color="#006E2E" />
                  </View>
                  <Text style={styles.heroActionText}>{action.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.sectionIntro}>
              <Text style={styles.sectionTitleDark}>Xatırlatmalarım</Text>
              <TouchableOpacity style={styles.addCardPill} onPress={goToReminderBuilder}>
                <Ionicons name="calendar-outline" size={16} color="#2563EB" />
                <Text style={styles.addCardText}>Xatırlatma əlavə et</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.autoCard}>
              <View style={styles.autoCardHeader}>
                <View>
                  <Text style={styles.autoTitle}>Xatırlatmalar</Text>
                  <Text style={styles.autoSubtitle}>Gəlir və ödənişləri planlaşdır.</Text>
                </View>
                <TouchableOpacity style={styles.autoBadge} onPress={goToReminderBuilder}>
                  <Ionicons name="add-outline" size={16} color="#1E40AF" />
                  <Text style={styles.autoBadgeText}>Yeni</Text>
                </TouchableOpacity>
              </View>
              {upcomingReminders.length ? (
                upcomingReminders.map((item) => (
                  <View key={item.id} style={styles.reminderPreviewRow}>
                    <View style={styles.reminderPreviewIcon}>
                      <Ionicons
                        name={item.kind === "income" ? "trending-up-outline" : "card-outline"}
                        size={16}
                        color="#2563EB"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reminderPreviewTitle}>{item.title}</Text>
                      <Text style={styles.reminderPreviewMeta}>{reminderDescription(item)}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.reminderEmpty}>Hələ xatırlatma yoxdur.</Text>
              )}
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Likvidlik xülasəsi</Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/stats")}>
                  <Text style={styles.sectionLink}>Statistika</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.summaryRow}>
                <View>
                  <Text style={styles.summaryLabel}>Son 30 gün</Text>
                  <Text style={styles.summaryValue}>
                    {recentTransactions.length ? `${recentTransactions.length} əməliyyat` : "Məlumat yoxdur"}
                  </Text>
                </View>
                {loading && <ActivityIndicator size="small" color={PRIMARY} />}
              </View>
            </View>

            <View style={[styles.sectionCard, styles.transactionsCard]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Son əməliyyatlar</Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
                  <Text style={styles.sectionLink}>Hamısı</Text>
                </TouchableOpacity>
              </View>
              {recentTransactions.length ? (
                recentTransactions.map((item, index) => {
                  const rowAnimation = transactionAnimations.current[index];
                  const animatedRowStyle = rowAnimation
                    ? {
                        opacity: rowAnimation,
                        transform: [
                          {
                            translateY: rowAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [12, 0],
                            }),
                          },
                          {
                            scale: rowAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.98, 1],
                            }),
                          },
                        ],
                      }
                    : undefined;
                  const isIncome = item.type === "income";
                  const amountColor = isIncome ? "#10B981" : "#EF4444";
                  const pulseStyle = {
                    backgroundColor: isIncome ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)",
                    transform: [
                      {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.85, 1.35],
                        }),
                      },
                    ],
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 0],
                    }),
                  };

                  return (
                    <Animated.View
                      key={item._id}
                      style={[
                        styles.transactionRow,
                        index !== recentTransactions.length - 1 && styles.transactionDivider,
                        animatedRowStyle,
                      ]}
                    >
                      <View style={styles.transactionEmojiWrapper}>
                        <Animated.View style={[styles.transactionPulse, pulseStyle]} pointerEvents="none" />
                        <View
                          style={[
                            styles.transactionEmojiBadge,
                            { backgroundColor: isIncome ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)" },
                          ]}
                        >
                          <Text style={styles.transactionEmoji}>{emojiForCategory(item.category)}</Text>
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.transactionTitle}>{item.category || "Kateqoriya"}</Text>
                        <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
                      </View>
                      <Text
                        style={[
                          styles.transactionAmount,
                          { color: amountColor },
                        ]}
                      >
                        {isIncome ? "+" : "-"}
                        {Math.abs(item.amount).toFixed(2)} AZN
                      </Text>
                    </Animated.View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>Əməliyyat tapılmadı.</Text>
              )}
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Ionicons name="log-out-outline" size={16} color="#EF4444" />
              <Text style={styles.logoutText}>Çıxış</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  safe: { flex: 1, backgroundColor: "transparent" },
  scrollContent: { paddingBottom: 32, backgroundColor: BG },
  headerWrapper: { backgroundColor: "#009624" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  headerBubble: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.12)",
    top: -60,
    right: -40,
  },
  headerBubbleSecondary: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(0,0,0,0.08)",
    bottom: -40,
    left: -20,
  },
  profileRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  profileInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontSize: 18 },
  greeting: { fontSize: 14, color: "rgba(249,250,251,0.95)" },
  profileName: { fontSize: 16, fontWeight: "600" },
  profileStatus: { fontSize: 12, color: "rgba(255,255,255,0.65)" },
  headerActions: { flexDirection: "row", gap: 10 },
  circleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(15,23,42,0.35)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
  },
  balanceHero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    gap: 16,
  },
  balanceValueRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  balanceValue: {
    fontSize: 42,
    color: "#F9FAFB",
    fontWeight: "700",
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
  },
  balanceCurrencyInline: {
    fontSize: 18,
    color: "rgba(249,250,251,0.9)",
    fontWeight: "600",
    marginBottom: 8,
  },
  eyeHero: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroActionsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: -58,
    marginBottom: 12,
  },
  heroActionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
    shadowColor: "rgba(15,23,42,0.08)",
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  heroActionCardPressed: { transform: [{ scale: 0.98 }] },
  heroActionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(0,150,36,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroActionText: { fontSize: 13, fontWeight: "600", color: "#1E293B" },
  bodyCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -20,
    paddingTop: 72,
    paddingHorizontal: 20,
    paddingBottom: 28,
    minHeight: 520,
    shadowColor: "rgba(15,23,42,0.05)",
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
  },
  sectionIntro: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitleDark: { fontSize: 17, fontWeight: "700", color: TEXT_DARK },
  addCardPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
  },
  addCardText: { color: "#1E40AF", fontWeight: "600", fontSize: 13 },
  autoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 18,
  },
  autoCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  autoTitle: { fontSize: 16, fontWeight: "700", color: TEXT_DARK },
  autoSubtitle: { color: TEXT_MUTED, fontSize: 13, marginTop: 4 },
  autoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#E0EAFF",
  },
  autoBadgeText: { color: "#1E40AF", fontWeight: "600" },
  reminderPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    gap: 12,
  },
  reminderPreviewIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#E4ECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  reminderPreviewTitle: { fontSize: 14, fontWeight: "600", color: TEXT_DARK },
  reminderPreviewMeta: { fontSize: 12, color: TEXT_MUTED, marginTop: 4 },
  reminderEmpty: { marginTop: 16, color: TEXT_MUTED, fontSize: 13 },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  transactionsCard: { borderWidth: 0, paddingVertical: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: TEXT_DARK },
  sectionLink: { color: PRIMARY, fontWeight: "600", fontSize: 13, textDecorationLine: "underline" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { color: TEXT_MUTED, fontSize: 13 },
  summaryValue: { color: TEXT_DARK, fontWeight: "600", fontSize: 16, fontVariant: ["tabular-nums"] },
  transactionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  transactionDivider: { borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  transactionEmojiWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionEmojiBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionPulse: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  transactionEmoji: { fontSize: 20 },
  transactionTitle: { fontSize: 14, fontWeight: "600", color: TEXT_DARK },
  transactionDate: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  transactionAmount: { fontSize: 14, fontWeight: "700", textAlign: "right", minWidth: 92, fontVariant: ["tabular-nums"] },
  emptyText: { color: TEXT_MUTED, fontSize: 13 },
  logoutBtn: {
    marginTop: 28,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  logoutText: { color: "#EF4444", fontWeight: "600" },
});
