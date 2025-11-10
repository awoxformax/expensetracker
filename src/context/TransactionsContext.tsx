import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert, Platform, ToastAndroid } from "react-native";
import { API_BASE_URL } from "../lib/config";
import { useAuth } from "./AuthContext";
import { jget, jset } from "../lib/storage";
import { scheduleAt } from "../screens/main/notifications";
import { DEFAULT_CATEGORIES } from "../constants/categories";

// === Type definitions ===
export type TransactionRepeatRule = {
  freq: "daily" | "weekly" | "monthly";
  dayOfMonth?: number;
  weekday?: number;
};

export type Transaction = {
  _id: string;
  userId: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  note?: string;
  date: string;
  isRecurring: boolean;
  repeatRule?: TransactionRepeatRule;
  notify: boolean;
  nextTriggerAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateTransactionPayload = {
  type: "income" | "expense";
  category: string;
  amount: number;
  note?: string;
  date?: string;
  isRecurring?: boolean;
  repeatRule?: TransactionRepeatRule;
  notify?: boolean;
  nextTriggerAt?: string;
};

export type UpdateTransactionPatch = Partial<
  Pick<Transaction, "amount" | "category" | "note">
>;

export type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  limit?: number;
  spent?: number;
  builtIn?: boolean;
  icon?: string;
  color?: string;
};

export type Reminder = {
  id: string;
  title: string;
  kind: "income" | "expense";
  action: "open_income_form" | "navigate_category";
  category?: string;
  incomeSubtype?: "salary" | "stipend" | "other";
  startDate: string;
  endDate?: string;
  atHour?: number;
};

type ApiResponse<T> = { ok: boolean; data?: T; error?: string };

type TransactionsContextValue = {
  transactions: Transaction[];
  categories: Category[];
  reminders: Reminder[];

  loading: boolean;
  error: string | null;
  currentMonth: string | null;

  loadTransactions: (month: string) => Promise<void>;
  createTransaction: (payload: CreateTransactionPayload) => Promise<boolean>;
  updateTransaction: (id: string, patch: UpdateTransactionPatch) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;

  addCategory: (name: string, type: "income" | "expense", limit?: number) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  refreshLocalDerived: () => void;

  addReminder: (r: Reminder) => Promise<void>;
  removeReminder: (id: string) => Promise<void>;
};

// === Safe default values ===
const TransactionsContext = createContext<TransactionsContextValue>({
  transactions: [],
  categories: [],
  reminders: [],
  loading: false,
  error: null,
  currentMonth: null,

  loadTransactions: async () => {},
  createTransaction: async () => false,
  updateTransaction: async () => false,
  deleteTransaction: async () => false,

  addCategory: async () => {},
  removeCategory: async () => {},
  refreshLocalDerived: () => {},

  addReminder: async () => {},
  removeReminder: async () => {},
});

// === Local keys ===
const CKEY = "categories:v1";
const RKEY = "reminders:v1";
const TKEY = "transactions_cache:v1";

// === Provider ===
export const TransactionsProvider = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<string | null>(null);

  // === Derived categories ===
  const categories = useMemo(
    () => composeCategories(customCategories, transactions),
    [customCategories, transactions]
  );

  // === Load from storage (safe) ===
  useEffect(() => {
    (async () => {
      try {
        const [cats, rms, cache] = await Promise.all([
          jget<Category[]>(CKEY, []),
          jget<Reminder[]>(RKEY, []),
          jget<Transaction[]>(TKEY, []),
        ]);
        setCustomCategories(normalizeCustomCategories(cats || []));
        setReminders(rms || []);
        setTransactions(cache || []);
      } catch (err) {
        console.warn("Cache loading error:", err);
      }
    })();
  }, []);

  // === Toast helper ===
  const showToast = (msg: string) => {
    if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert("Bildiriş", msg);
  };

  // === Authenticated requests ===
  const authedRequest = useCallback(
    async <T,>(path: string, options: RequestInit = {}) => {
      if (!token) throw new Error("Sessiya yoxdur");
      const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(options.headers || {}),
        },
      });
      const data = (await res.json()) as ApiResponse<T>;
      return data;
    },
    [token]
  );

  // === CRUD operations ===
  const loadTransactions = useCallback(
    async (month: string) => {
      if (!month) return;
      setLoading(true);
      setError(null);
      try {
        const r = await authedRequest<Transaction[]>(`/api/transactions?month=${month}`, {
          method: "GET",
        });
        if (!r.ok) throw new Error(r.error || "Alınmadı");
        const list = r.data || [];
        setTransactions(list);
        setCurrentMonth(month);
        await jset(TKEY, list);
      } catch (e: any) {
        setError(e.message || "Xəta");
      } finally {
        setLoading(false);
      }
    },
    [authedRequest]
  );

  const createTransaction = useCallback(
    async (payload: CreateTransactionPayload) => {
      setLoading(true);
      setError(null);
      try {
        const r = await authedRequest<Transaction>("/api/transactions", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (!r.ok || !r.data) throw new Error(r.error || "Əlavə edilmədi");
        const tx = r.data;

        setTransactions((prev) => {
          const updated = [tx, ...prev].sort(
            (a, b) => +new Date(b.date) - +new Date(a.date)
          );
          jset(TKEY, updated);
          return updated;
        });
        return true;
      } catch (e: any) {
        setError(e.message || "Xəta");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [authedRequest]
  );

  const updateTransaction = useCallback(
    async (id: string, patch: UpdateTransactionPatch) => {
      setLoading(true);
      setError(null);
      try {
        const r = await authedRequest<Transaction>(`/api/transactions/${id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        if (!r.ok || !r.data) throw new Error(r.error || "Yenilənmədi");
        setTransactions((prev) => {
          const updated = prev.map((t) => (t._id === id ? r.data! : t));
          jset(TKEY, updated);
          return updated;
        });
        return true;
      } catch (e: any) {
        setError(e.message || "Xəta");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [authedRequest]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const r = await authedRequest<null>(`/api/transactions/${id}`, {
          method: "DELETE",
        });
        if (!r.ok) throw new Error(r.error || "Silinmədi");
        setTransactions((prev) => {
          const updated = prev.filter((t) => t._id !== id);
          jset(TKEY, updated);
          return updated;
        });
        return true;
      } catch (e: any) {
        setError(e.message || "Xəta");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [authedRequest]
  );

  // === Categories ===
  const addCategory = useCallback(async (name: string, type: "income" | "expense", limit?: number) => {
    const c: Category = {
      id: `custom-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      name,
      type,
      limit,
      builtIn: false,
    };
    setCustomCategories((prev) => {
      const next = [...prev, c];
      persistCustomCategories(next);
      return next;
    });
    showToast("Kateqoriya əlavə olundu");
  }, []);

  const removeCategory = useCallback(async (id: string) => {
    setCustomCategories((prev) => {
      const next = prev.filter((c) => c.id !== id);
      persistCustomCategories(next);
      return next;
    });
  }, []);

  const refreshLocalDerived = useCallback(() => {
    setCustomCategories((prev) => [...prev]);
  }, []);

  // === Reminders ===
  const addReminder = useCallback(async (r: Reminder) => {
    setReminders((prev) => {
      const next = [...prev, r];
      jset(RKEY, next);
      return next;
    });

    const start = new Date(r.startDate);
    const end = r.endDate ? new Date(r.endDate) : start;
    const scheduled: Promise<string>[] = [];

    for (
      let cursor = new Date(start.getTime());
      cursor.getTime() <= end.getTime();
      cursor.setDate(cursor.getDate() + 1)
    ) {
      const when = new Date(cursor.getTime());
      when.setHours(r.atHour ?? 9, 0, 0, 0);
      scheduled.push(
        scheduleAt(when, {
          title: r.title,
          body: r.kind === "income" ? "Gəliri daxil et" : `${r.category} xərcini daxil et`,
          data: { action: r.action, category: r.category, incomeSubtype: r.incomeSubtype },
        })
      );
    }

    await Promise.all(scheduled);
    showToast("Xatırlatma planlaşdırıldı");
  }, []);

  const removeReminder = useCallback(async (id: string) => {
    setReminders((prev) => {
      const updated = prev.filter((x) => x.id !== id);
      jset(RKEY, updated);
      return updated;
    });
  }, []);

  // === Context value ===
  const value = useMemo(
    () => ({
      transactions,
      categories,
      reminders,
      loading,
      error,
      currentMonth,
      loadTransactions,
      createTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      removeCategory,
      refreshLocalDerived,
      addReminder,
      removeReminder,
    }),
    [transactions, categories, reminders, loading, error, currentMonth]
  );

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
};

// === Hook ===
export const useTransactions = () => useContext(TransactionsContext);

// === Helpers ===
function normalizeCustomCategories(cats: Category[] = []): Category[] {
  return cats
    .filter(Boolean)
    .map((cat) => ({ ...cat, builtIn: false, spent: 0 }));
}

function composeCategories(customCats: Category[], txs: Transaction[]): Category[] {
  const map = new Map<string, Category>();
  const push = (cat: Category) => {
    const key = `${cat.type}:${cat.name.toLowerCase()}`;
    map.set(key, { ...cat, spent: 0 });
  };

  DEFAULT_CATEGORIES.forEach((cat) => push({ ...cat, builtIn: true }));
  customCats.forEach((cat) => push({ ...cat, builtIn: false }));

  for (const tx of txs) {
    if (tx.type !== "expense") continue;
    const key = `expense:${(tx.category || "").toLowerCase()}`;
    if (map.has(key)) {
      const current = map.get(key)!;
      map.set(key, {
        ...current,
        spent: (current.spent ?? 0) + Math.abs(tx.amount),
      });
    }
  }

  return Array.from(map.values());
}

function persistCustomCategories(list: Category[]) {
  const payload = list.map(({ spent, ...rest }) => rest);
  jset(CKEY, payload);
}
