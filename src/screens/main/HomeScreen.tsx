import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../theme/ThemeProvider";
import { useUser } from "../../context/UserContext";
import { useTransactions } from "../../context/TransactionsContext";
import { LinearGradient } from "expo-linear-gradient";

export default function HomeScreen() {
  const router = useRouter();
  const { logout, token } = useAuth();
  const { colors, fonts } = useTheme();
  const { state } = useUser();
  const { transactions, loading, loadTransactions } = useTransactions();
  const [showBalance, setShowBalance] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

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

  const incomes = transactions.filter((t) => t.type === "income");
  const expenses = transactions.filter((t) => t.type === "expense");
  const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const displayBalance = showBalance ? balance.toFixed(2) : "****";
  const hasData = transactions.length > 0;
  const fullName =
    [state.profile.firstName, state.profile.lastName]
      .filter(Boolean)
      .join(" ") || "İstifadəçi";
  const recentTransactions = useMemo(() => {
    if (!transactions.length) return [];
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [transactions]);
  const formatTransactionDate = useCallback((value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${day}.${month}.${date.getFullYear()}`;
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [hasData]);

  return (
    <View style={styles.container}>
      {/* === HEADER === */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {fullName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.userName}>Salam, {fullName.split(" ")[0]} 👋</Text>
                <Text style={styles.userSub}>Xoş gəlmisən</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Hazırkı vəsait</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceValue}>{displayBalance}</Text>
              <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
                <Ionicons
                  name={showBalance ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#fff"
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
              <Text style={styles.balanceCurrency}>AZN</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* === BODY === */}
      <SafeAreaView style={styles.body}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {loading && !hasData ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Emeliyyatlar yuklenir...</Text>
              </View>
            ) : !hasData ? (
              <LinearGradient
                colors={["#E0E7FF", "#F9FAFB"]}
                style={styles.emptyCard}
              >
                <Ionicons name="sparkles-outline" size={28} color="#2563EB" />
                <Text style={styles.emptyTitle}>Heç bir əməliyyat yoxdur</Text>
                <Text style={styles.emptySub}>
                  Başlamaq üçün gəlir və ya xərc əlavə et
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => router.push("/transactions")}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>Əməliyyat əlavə et</Text>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <>
                {/* Quick actions */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#DCFCE7" }]}
                    onPress={() => router.push("/transactions?type=income")}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={22}
                      color="#16A34A"
                    />
                    <Text style={styles.actionText}>Gəlir əlavə et</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#FEE2E2" }]}
                    onPress={() => router.push("/transactions?type=expense")}
                  >
                    <Ionicons
                      name="remove-circle-outline"
                      size={22}
                      color="#DC2626"
                    />
                    <Text style={styles.actionText}>Xərc əlavə et</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#DBEAFE" }]}
                    onPress={() => router.push("/stats")}
                  >
                    <Ionicons
                      name="stats-chart-outline"
                      size={22}
                      color="#2563EB"
                    />
                    <Text style={styles.actionText}>Statistika</Text>
                  </TouchableOpacity>
                </View>

                {/* Balans xülasəsi */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Gəlir</Text>
                    <Text style={[styles.summaryValue, { color: "#16A34A" }]}>
                      {totalIncome.toFixed(2)} AZN
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Xərc</Text>
                    <Text style={[styles.summaryValue, { color: "#DC2626" }]}>
                      {totalExpense.toFixed(2)} AZN
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Qaliq</Text>
                    <Text style={[styles.summaryValue, { color: "#2563EB" }]}>
                      {balance.toFixed(2)} AZN
                    </Text>
                  </View>
                </View>

                {/* Son əməliyyatlar */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Son əməliyyatlar</Text>
                  {recentTransactions.map((t) => (
                    <View key={t._id || `${t.category}-${t.date}`} style={styles.transactionCard}>
                      <View style={styles.transactionRow}>
                        <Ionicons
                          name={
                            t.type === "income"
                              ? "arrow-down-circle-outline"
                              : "arrow-up-circle-outline"
                          }
                          size={22}
                          color={t.type === "income" ? "#16A34A" : "#DC2626"}
                        />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.transactionTitle}>
                            {t.note?.trim() ||
                              t.category ||
                              (t.type === "income" ? "Gelir" : "Xerc")}
                          </Text>
                          <Text style={styles.transactionDate}>
                            {formatTransactionDate(t.date)}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.transactionAmount,
                            {
                              color:
                                t.type === "income" ? "#16A34A" : "#DC2626",
                            },
                          ]}
                        >
                          {t.type === "income" ? "+" : "-"}
                          {Math.abs(t.amount).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </Animated.View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={16} color="#DC2626" />
            <Text style={styles.logoutText}>Hesabdan çıx</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    backgroundColor: "#1E5EFF",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  userName: { color: "#fff", fontWeight: "700", fontSize: 15 },
  userSub: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  balanceSection: { alignItems: "center", marginTop: 20 },
  balanceLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  balanceRow: { flexDirection: "row", alignItems: "center" },
  balanceValue: { color: "#fff", fontSize: 36, fontWeight: "800" },
  balanceCurrency: { color: "#fff", fontSize: 14, marginLeft: 4 },
  body: { flex: 1, paddingHorizontal: 20 },
  loadingCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    marginTop: 80,
    backgroundColor: "#fff",
    shadowColor: "#CBD5E1",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 4,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "600",
  },
  emptyCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    marginTop: 80,
    shadowColor: "#CBD5E1",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 5,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#1E3A8A", marginTop: 12 },
  emptySub: { fontSize: 13, color: "#475569", marginTop: 4, textAlign: "center" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E5EFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 18,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { fontSize: 13, fontWeight: "600", color: "#1E293B", marginTop: 4 },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    shadowColor: "#CBD5E1",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  summaryLabel: { color: "#475569", fontSize: 13 },
  summaryValue: { fontWeight: "700", fontSize: 15 },
  section: { marginTop: 26 },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: "#1E293B",
    marginBottom: 10,
  },
  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#E2E8F0",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 3,
  },
  transactionRow: { flexDirection: "row", alignItems: "center" },
  transactionTitle: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  transactionDate: { fontSize: 12, color: "#64748B" },
  transactionAmount: { fontSize: 14, fontWeight: "700" },
  logoutBtn: {
    marginTop: 40,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239,68,68,0.12)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  logoutText: { color: "#DC2626", fontWeight: "700", fontSize: 13 },
});

