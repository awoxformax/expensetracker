import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Animated,
  Easing,
  useWindowDimensions,
  LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTransactions } from "../../../src/context/TransactionsContext";

/** ----- Dizayn rəngləri (light) ----- */
const C = {
  bg: "#F6F7FB",
  card: "#FFFFFF",
  text: "#0F172A",
  muted: "#64748B",
  border: "#E5E7EB",
  blue: "#357BFF",
  red: "#FF6B6B",
  green: "#00C897",
  shadow: "rgba(15,23,42,0.08)",
};

const MONTH_LABEL = (d: Date) =>
  d.toLocaleString("en-US", { month: "long" }); // label üçün (Azərbaycan dilinə çevirmək istəyərsən: 'az-AZ')

/** Bu ayın YYYY-MM açarı */
const monthKeyFromDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export default function StatsScreen() {
  const { transactions, loadTransactions, loading } = useTransactions();
  const router = useRouter();
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // ay seçimi
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const currentMonthKey = useMemo(() => monthKeyFromDate(cursorDate), [cursorDate]);

  // bar animasiyaları
  const incomeH = useRef(new Animated.Value(0)).current;
  const expenseH = useRef(new Animated.Value(0)).current;

  // Payments "expand" animasiyası (0..1)
  const sheet = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);
  const [topSectionHeight, setTopSectionHeight] = useState(0);
  const topPadding = useMemo(() => Math.max(insets.top, 18), [insets.top]);

  const toggleSheet = useCallback(() => {
    setExpanded((p) => !p);
  }, []);

  useEffect(() => {
    Animated.timing(sheet, {
      toValue: expanded ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [expanded, sheet]);

  // ay dəyişdikdə datanı çək
  useEffect(() => {
    loadTransactions(currentMonthKey);
  }, [currentMonthKey, loadTransactions]);

  // həmin aya aid gəlir/xərc/toplamlar
  const { income, expense, list } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    const sorted = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (const t of sorted) {
      if (t.type === "income") inc += Math.abs(t.amount);
      else exp += Math.abs(t.amount);
    }
    return { income: inc, expense: exp, list: sorted };
  }, [transactions]);

  // bar-ların nisbəti və animasiyası
  useEffect(() => {
    const max = Math.max(income, expense, 1);
    const ih = (income / max) * 160;   // maksimum 160px
    const eh = (expense / max) * 160;

    Animated.timing(incomeH, {
      toValue: ih,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.timing(expenseH, {
      toValue: eh,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [income, expense, incomeH, expenseH]);

  // Payments "sheet" ölçüsü (kartdan tam ekrana qədər)
  const collapsedHeight = useMemo(
    () => Math.max(screenHeight - topSectionHeight, 340),
    [screenHeight, topSectionHeight]
  );
  const expandedHeight = useMemo(
    () => Math.max(screenHeight - 120, collapsedHeight + 80),
    [screenHeight, collapsedHeight]
  );
  const sheetRadius = useMemo(
    () =>
      sheet.interpolate({
        inputRange: [0, 1],
        outputRange: [16, 0],
      }),
    [sheet]
  );
  const sheetHeight = useMemo(
    () =>
      sheet.interpolate({
        inputRange: [0, 1],
        outputRange: [collapsedHeight, expandedHeight],
        extrapolate: "clamp",
      }),
    [sheet, collapsedHeight, expandedHeight]
  );

  const changeMonth = (dir: -1 | 1) => {
    const d = new Date(cursorDate);
    d.setMonth(d.getMonth() + dir);
    setCursorDate(d);
  };
  const handleTopLayout = useCallback(
    (evt: LayoutChangeEvent) => {
      const h = evt.nativeEvent.layout.height;
      if (Math.abs(h - topSectionHeight) > 2) {
        setTopSectionHeight(h);
      }
    },
    [topSectionHeight]
  );

  return (
    <SafeAreaView style={st.safe}>
      <View style={[st.topSection, { paddingTop: topPadding }]} onLayout={handleTopLayout}>
        {/* Header / Month selector */}
        <View style={st.header}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={st.monthBtn}>
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>

          <View style={st.monthPill}>
            <Text style={st.monthTxt}>{MONTH_LABEL(cursorDate)}</Text>
          </View>

          <TouchableOpacity onPress={() => changeMonth(1)} style={st.monthBtn}>
            <Ionicons name="chevron-forward" size={20} color={C.text} />
          </TouchableOpacity>
        </View>

        {/* Top summary (expenses / income) */}
        <View style={st.summaryRow}>
          <View style={st.summaryCol}>
            <Text style={st.sLabel}>Expenses</Text>
            <Text style={[st.sValue, { color: C.red }]}>
              {expense.toFixed(2)} ₼
            </Text>
          </View>
          <View style={st.summaryCol}>
            <Text style={st.sLabel}>Income</Text>
            <Text style={[st.sValue, { color: C.green }]}>
              {income.toFixed(2)} ₼
            </Text>
          </View>
        </View>

        {/* Chart Card (ABB stilinə bənzər) */}
        <View style={st.card}>
          <View style={st.cardHead}>
            <Text style={st.cardTitle}>Gəlir və Xərc</Text>
            <TouchableOpacity
              style={st.detailBtn}
              onPress={() => router.push("/(tabs)/stats/detail")}
              activeOpacity={0.8}
            >
              <Text style={st.detailText}>Detallar</Text>
              <Ionicons name="arrow-forward-circle" size={18} color={C.blue} />
            </TouchableOpacity>
          </View>

          <View style={st.chartArea}>
            {/* Income column */}
            <View style={st.barWrap}>
              <Text style={st.barLabel}>Gəlir</Text>
              <View style={st.barBase}>
                <Animated.View
                  style={[
                    st.bar,
                    { backgroundColor: C.blue, height: incomeH },
                  ]}
                />
              </View>
              <Text style={[st.barAmount, { color: C.blue }]}>
                {income.toFixed(2)} AZN
              </Text>
            </View>

            {/* Expense column */}
            <View style={st.barWrap}>
              <Text style={st.barLabel}>Xərc</Text>
              <View style={st.barBase}>
                <Animated.View
                  style={[
                    st.bar,
                    { backgroundColor: C.red, height: expenseH },
                  ]}
                />
              </View>
              <Text style={[st.barAmount, { color: C.red }]}>
                {expense.toFixed(2)} AZN
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Payments (expandable sheet) */}
      <Animated.View
        style={[
          st.sheet,
          {
            height: sheetHeight,
            borderTopLeftRadius: sheetRadius,
            borderTopRightRadius: sheetRadius,
          },
        ]}
      >
        <TouchableOpacity onPress={toggleSheet} activeOpacity={0.8} style={st.sheetHandle}>
          <View style={st.handleBar} />
          <Text style={st.sheetTitle}>Payments</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={st.tag}>
              <Text style={st.tagTxt}>Expense: {expense.toFixed(2)} ₼</Text>
            </View>
            <View style={st.tag}>
              <Text style={st.tagTxt}>Income: {income.toFixed(2)} ₼</Text>
            </View>
          </View>
        </TouchableOpacity>

        <FlatList
          data={list}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={st.txRow}>
              <View style={st.txIconWrap}>
                <Ionicons
                  name={item.type === "income" ? "arrow-down-circle" : "arrow-up-circle"}
                  size={20}
                  color={item.type === "income" ? C.green : C.red}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.txTitle}>
                  {item.note?.trim() || item.category || (item.type === "income" ? "Gəlir" : "Xərc")}
                </Text>
                <Text style={st.txMeta}>
                  {new Date(item.date).toLocaleString("az-AZ", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <Text
                style={[
                  st.txAmount,
                  { color: item.type === "income" ? C.green : C.red },
                ]}
              >
                {item.type === "income" ? "+" : "-"}
                {Math.abs(item.amount).toFixed(2)}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ padding: 16 }}>
              <Text style={{ textAlign: "center", color: C.muted }}>
                {loading ? "Yüklənir..." : "Hələ əməliyyat yoxdur."}
              </Text>
            </View>
          }
        />
      </Animated.View>
    </SafeAreaView>
  );
}

/* -------------------- STYLES -------------------- */
const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  topSection: {
    paddingBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
    paddingTop: 6,
    gap: 12,
    alignSelf: "center",
    width: "80%",
  },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: C.shadow,
  },
  monthPill: {
    paddingHorizontal: 18,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: C.shadow,
    minWidth: 120,
    maxWidth: 200,
    flexShrink: 1,
  },
  monthTxt: { fontSize: 14, fontWeight: "700", color: C.text, textAlign: "center" },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 12,
  },
  summaryCol: {
    width: "48%",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    elevation: 2,
    shadowColor: C.shadow,
  },
  sLabel: { fontSize: 12, color: C.muted, marginBottom: 4 },
  sValue: { fontSize: 18, fontWeight: "800" },

  card: {
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: C.shadow,
  },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
  },
  detailText: { color: C.blue, fontWeight: "600", fontSize: 12 },

  chartArea: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "flex-end",
    paddingVertical: 18,
  },
  barWrap: { alignItems: "center", width: 120 },
  barLabel: { fontSize: 12, color: C.muted, marginBottom: 6 },
  barBase: {
    width: 48,
    height: 160,
    borderRadius: 12,
    backgroundColor: "#EBEEF5",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 12,
  },
  barAmount: {
    marginTop: 8,
    fontWeight: "700",
    fontSize: 13,
  },

  sheet: {
    marginTop: 14,
    backgroundColor: C.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: C.shadow,
  },
  sheetHandle: {
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },
  sheetTitle: { fontWeight: "700", color: C.text, marginTop: 4 },
  tag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagTxt: { fontSize: 12, color: C.muted },

  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txTitle: { color: C.text, fontWeight: "600" },
  txMeta: { color: C.muted, fontSize: 12, marginTop: 2 },
  txAmount: { fontWeight: "700", marginLeft: 10 },
});
