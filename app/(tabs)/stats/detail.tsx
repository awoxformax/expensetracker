import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTransactions, Transaction } from "../../../src/context/TransactionsContext";

const MONTH_NAMES = ["Yan", "Fev", "Mar", "Apr", "May", "İyun", "İyul", "Avq", "Sen", "Okt", "Noy", "Dek"];
const PIE_COLORS = ["#357BFF", "#00C897", "#FF6B6B", "#F59E0B", "#A855F7"];

const formatMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getMonthLabel = (date: Date) => `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

const computeTotals = (transactions: Transaction[]) =>
  transactions.reduce(
    (acc, tx) => {
      if (tx.type === "income") acc.income += Math.abs(tx.amount);
      else acc.expense += Math.abs(tx.amount);
      return acc;
    },
    { income: 0, expense: 0 }
  );

const computeCategoriesShare = (transactions: Transaction[]) => {
  const expenses = transactions.filter((t) => t.type === "expense");
  if (!expenses.length) return [];
  const totals = expenses.reduce((map, tx) => {
    const key = tx.category || "Digər";
    map[key] = (map[key] || 0) + Math.abs(tx.amount);
    return map;
  }, {} as Record<string, number>);

  const total = Object.values(totals).reduce((a, b) => a + b, 0);
  return Object.entries(totals).map(([label, amount], idx) => ({
    label,
    value: ((amount / total) * 100).toFixed(1),
    color: PIE_COLORS[idx % PIE_COLORS.length],
  }));
};

const computeInsight = (transactions: Transaction[]) => {
  const expenses = transactions.filter((t) => t.type === "expense");
  if (!transactions.length) {
    return "AI analizi üçün kifayət qədər məlumat yoxdur.";
  }
  if (!expenses.length) {
    return "Bu ay xərc qeyd etməmisiniz – balans stabil görünür.";
  }
  const totals = expenses.reduce((map, tx) => {
    const key = tx.category || "Digər";
    map[key] = (map[key] || 0) + Math.abs(tx.amount);
    return map;
  }, {} as Record<string, number>);

  const totalExpense = Object.values(totals).reduce((a, b) => a + b, 0);
  const [topCategory, topAmount] = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  const share = ((topAmount / Math.max(totalExpense, 1)) * 100).toFixed(1);

  return `${topCategory} xərcləri bu ay ümumi xərcin ${share}% təşkil edir. Daha balanslı büdcə üçün limiti izləyin.`;
};

export default function DetailScreen() {
  const router = useRouter();
  const { transactions, loadTransactions, loading, error } = useTransactions();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const monthKey = useMemo(() => formatMonthKey(selectedDate), [selectedDate]);

  useEffect(() => {
    loadTransactions(monthKey);
  }, [monthKey, loadTransactions]);

  const totals = useMemo(() => computeTotals(transactions), [transactions]);
  const categoriesShare = useMemo(() => computeCategoriesShare(transactions), [transactions]);
  const aiMessage = useMemo(() => computeInsight(transactions), [transactions]);

  const incomeHeight = useRef(new Animated.Value(0)).current;
  const expenseHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const maxVal = Math.max(totals.income, totals.expense, 1);
    Animated.parallel([
      Animated.timing(incomeHeight, {
        toValue: (totals.income / maxVal) * 160,
        duration: 500,
        useNativeDriver: false,
      }),
      Animated.timing(expenseHeight, {
        toValue: (totals.expense / maxVal) * 160,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
  }, [incomeHeight, expenseHeight, totals]);

  const goNext = useCallback(() => {
    const today = new Date();
    setSelectedDate((prev) => {
      const candidate = new Date(prev);
      candidate.setMonth(candidate.getMonth() + 1);
      if (candidate > today) return prev;
      return candidate;
    });
  }, []);

  const goPrev = useCallback(() => {
    setSelectedDate((prev) => {
      const candidate = new Date(prev);
      candidate.setMonth(candidate.getMonth() - 1);
      return candidate;
    });
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 15,
        onPanResponderRelease: (_, { dx }) => {
          if (dx < -40) {
            goNext();
          } else if (dx > 40) {
            goPrev();
          }
        },
      }),
    [goNext, goPrev]
  );

  const monthLabel = getMonthLabel(selectedDate);
  const today = new Date();
  const isNextDisabled =
    selectedDate.getFullYear() === today.getFullYear() && selectedDate.getMonth() === today.getMonth();

  return (
    <View style={styles.gestureWrapper} {...panResponder.panHandlers}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={["#F5F9FF", "#FFFFFF"]} style={styles.header}>
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={22} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Aylıq balansın</Text>
            <Ionicons name="stats-chart-outline" size={20} color="#1E293B" />
          </View>

          <View style={styles.monthRow}>
            <TouchableOpacity onPress={goPrev} style={styles.monthControl}>
              <Ionicons name="chevron-back" size={20} color="#1E293B" />
            </TouchableOpacity>
            <View style={styles.monthActive}>
              <Text style={styles.monthActiveText}>{monthLabel}</Text>
            </View>
            <TouchableOpacity onPress={goNext} disabled={isNextDisabled} style={styles.monthControl}>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isNextDisabled ? "#CBD5F5" : "#1E293B"}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.col}>
              <Text style={styles.label}>Xərc</Text>
              <Text style={[styles.value, { color: "#FF6B6B" }]}>
                {totals.expense.toFixed(2)} AZN
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Gəlir</Text>
              <Text style={[styles.value, { color: "#00C897" }]}>
                {totals.income.toFixed(2)} AZN
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statusRow}>
          {loading && <Text style={styles.statusText}>Yüklənir...</Text>}
          {!!error && <Text style={[styles.statusText, { color: "#FF6B6B" }]}>{error}</Text>}
        </View>

        <View style={styles.chartArea}>
          <View style={styles.barGroup}>
            <Animated.View style={[styles.bar, { backgroundColor: "#FF6B6B", height: expenseHeight }]} />
            <Text style={styles.barLabel}>Xərc</Text>
          </View>
          <View style={styles.barGroup}>
            <Animated.View style={[styles.bar, { backgroundColor: "#00C897", height: incomeHeight }]} />
            <Text style={styles.barLabel}>Gəlir</Text>
          </View>
        </View>

        <Text style={styles.totalText}>
          Xərc: {totals.expense.toFixed(2)} AZN | Gəlir: {totals.income.toFixed(2)} AZN
        </Text>

        <View style={styles.categoriesCard}>
          <Text style={styles.categoriesTitle}>Kateqoriya üzrə pay</Text>
          {categoriesShare.length ? (
            categoriesShare.map((cat, idx) => (
              <View key={idx} style={styles.categoryRow}>
                <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                <Text style={styles.categoryLabel}>{cat.label}</Text>
                <Text style={styles.categoryValue}>{cat.value}%</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyState}>Bu ay xərc kateqoriyası yoxdur.</Text>
          )}
        </View>

        <View style={styles.aiBox}>
          <Ionicons name="sparkles-outline" size={20} color="#1E90FF" style={{ marginRight: 8 }} />
          <Text style={styles.aiText}>{aiMessage}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  gestureWrapper: { flex: 1 },
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 25,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: { padding: 4, borderRadius: 999 },
  headerTitle: { fontSize: 15, fontWeight: "600", color: "#1E293B" },
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
  },
  monthControl: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: "#EEF4FF",
  },
  monthActive: {
    backgroundColor: "#E0EDFF",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
  monthActiveText: { color: "#1E90FF", fontWeight: "600" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  col: { alignItems: "center" },
  label: { fontSize: 13, color: "#64748B" },
  value: { fontSize: 22, fontWeight: "700" },
  statusRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  statusText: {
    fontSize: 12,
    color: "#64748B",
  },
  chartArea: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "flex-end",
    height: 220,
    marginTop: 15,
  },
  barGroup: { alignItems: "center" },
  bar: { width: 40, borderRadius: 10 },
  barLabel: { marginTop: 8, fontSize: 13, color: "#475569" },
  totalText: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 13,
    color: "#475569",
  },
  categoriesCard: {
    marginTop: 20,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#F8FAFF",
  },
  categoriesTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
    color: "#0F172A",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  categoryLabel: { flex: 1, fontSize: 13, color: "#1E293B" },
  categoryValue: { fontSize: 13, color: "#475569", fontWeight: "600" },
  emptyState: {
    textAlign: "center",
    fontSize: 13,
    color: "#94A3B8",
  },
  aiBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "rgba(53,123,255,0.08)",
  },
  aiText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#1E293B",
  },
});
