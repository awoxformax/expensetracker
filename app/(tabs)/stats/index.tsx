import React, { useEffect, useMemo, useRef } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { useTransactions } from "../../../src/context/TransactionsContext";

const INCOME_COLOR = "#357BFF";
const EXPENSE_COLOR = "#FF6B6B";
const PIE_COLORS = ["#357BFF", "#00C897", "#FF6B6B", "#F59E0B", "#A855F7"];

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function StatsScreen() {
  const { colors, fonts } = useTheme();
  const router = useRouter();
  const { transactions, loadTransactions, loading, error } = useTransactions();
  const initializedRef = useRef(false);
  const incomeHeight = useRef(new Animated.Value(0)).current;
  const expenseHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      loadTransactions(getCurrentMonthKey());
    }
  }, [loadTransactions]);

  const hasTransactions = transactions.length > 0;

  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, tx) => {
        if (tx.type === "income") acc.income += Math.abs(tx.amount);
        else acc.expense += Math.abs(tx.amount);
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [transactions]);

  const categoriesShare = useMemo(() => {
    if (!hasTransactions) return [];
    const expenses = transactions.filter((t) => t.type === "expense");
    if (!expenses.length) return [];

    const totalsMap = expenses.reduce((map, tx) => {
      const key = tx.category || "Digər";
      map[key] = (map[key] || 0) + Math.abs(tx.amount);
      return map;
    }, {} as Record<string, number>);

    const totalSum = Object.values(totalsMap).reduce((a, b) => a + b, 0);
    return Object.entries(totalsMap).map(([label, amount], i) => ({
      label,
      value: ((amount / totalSum) * 100).toFixed(1),
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [transactions, hasTransactions]);

  useEffect(() => {
    const maxVal = Math.max(totals.income, totals.expense, 1);
    Animated.parallel([
      Animated.timing(incomeHeight, {
        toValue: (totals.income / maxVal) * 120,
        duration: 500,
        useNativeDriver: false,
      }),
      Animated.timing(expenseHeight, {
        toValue: (totals.expense / maxVal) * 120,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
  }, [incomeHeight, expenseHeight, totals]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.heading }]}>Statistika</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Aylıq maliyyəni izləyin
        </Text>

        <TouchableOpacity onPress={() => router.push("/(tabs)/stats/detail")}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Gəlir və xərc</Text>
              <Ionicons name="chevron-forward-outline" size={18} color={colors.textMuted} />
            </View>

            {loading && !hasTransactions ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Yüklənir...</Text>
            ) : hasTransactions ? (
              <View style={styles.barSummary}>
                <View style={styles.barColumn}>
                  <Animated.View style={[styles.summaryBar, { backgroundColor: INCOME_COLOR, height: incomeHeight }]} />
                  <Text style={[styles.barLabel, { color: colors.text }]}>Gəlir</Text>
                  <Text style={[styles.barValue, { color: colors.text }]}>{totals.income.toFixed(2)} AZN</Text>
                </View>
                <View style={styles.barColumn}>
                  <Animated.View
                    style={[styles.summaryBar, { backgroundColor: EXPENSE_COLOR, height: expenseHeight }]}
                  />
                  <Text style={[styles.barLabel, { color: colors.text }]}>Xərc</Text>
                  <Text style={[styles.barValue, { color: colors.text }]}>{totals.expense.toFixed(2)} AZN</Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Əməliyyat əlavə etdikcə qrafik görünəcək.
              </Text>
            )}

            {!!error && (
              <Text style={[styles.errorText, { color: EXPENSE_COLOR }]}>{error}</Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Kateqoriya üzrə pay</Text>
          {categoriesShare.length > 0 ? (
            <View style={styles.pieRow}>
              <Svg width={120} height={120}>
                <Circle
                  cx={60}
                  cy={60}
                  r={50}
                  stroke="#2D3748"
                  strokeWidth={10}
                  fill="transparent"
                />
                {categoriesShare.map((cat, i) => {
                  const radius = 50;
                  const circumference = 2 * Math.PI * radius;
                  const offset = (i / categoriesShare.length) * circumference;
                  const arc = (Number(cat.value) / 100) * circumference;
                  return (
                    <Circle
                      key={i}
                      cx={60}
                      cy={60}
                      r={radius}
                      stroke={cat.color}
                      strokeWidth={10}
                      strokeDasharray={`${arc} ${circumference - arc}`}
                      strokeDashoffset={-offset}
                      rotation="-90"
                      origin="60,60"
                    />
                  );
                })}
              </Svg>
              <View style={styles.legend}>
                {categoriesShare.map((cat, i) => (
                  <View key={i} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                    <Text style={[styles.legendText, { color: colors.text }]}>{cat.label}</Text>
                    <Text style={[styles.legendValue, { color: colors.text }]}>{cat.value}%</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Xərc əməliyyatları əlavə etdikcə burda paylar görünəcək.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  title: { fontSize: 24 },
  subtitle: { fontSize: 14, marginTop: 4 },
  card: {
    borderRadius: 20,
    padding: 16,
    marginTop: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 16 },
  barSummary: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 18,
  },
  barColumn: { alignItems: "center" },
  summaryBar: { width: 32, borderRadius: 16 },
  barLabel: { fontSize: 13, marginTop: 8 },
  barValue: { fontSize: 13, marginTop: 4, fontWeight: "600" },
  pieRow: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  legend: { marginLeft: 16, flex: 1 },
  legendRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { flex: 1, marginLeft: 8, fontSize: 13 },
  legendValue: { fontSize: 13 },
  emptyText: { textAlign: "center", fontSize: 13, marginTop: 12 },
  errorText: { textAlign: "center", marginTop: 8, fontSize: 12 },
});

