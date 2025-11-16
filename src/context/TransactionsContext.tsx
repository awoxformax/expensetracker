import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, Platform, ToastAndroid } from "react-native";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import type { AxiosError, AxiosRequestConfig } from "axios";
import { useAuth } from "./AuthContext";
import { jget, jset } from "../lib/storage";
import { scheduleAt } from "../screens/main/notifications";
import { DEFAULT_CATEGORIES } from "../constants/categories";
import { http } from "../lib/http";

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
  pendingSync?: boolean;
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

export type CategoryLimit = {
  _id: string;
  category: string;
  monthlyLimit: number;
  spent?: number;
  createdAt?: string;
  updatedAt?: string;
};

type ApiResponse<T> = { ok: boolean; data?: T; error?: string };

type PendingTransactionOp =
  | {
      id: string;
      kind: "create";
      clientId: string;
      payload: CreateTransactionPayload;
      local: Transaction;
    }
  | {
      id: string;
      kind: "update";
      transactionId: string;
      patch: UpdateTransactionPatch;
    }
  | {
      id: string;
      kind: "delete";
      transactionId: string;
    };

type TransactionsContextValue = {
  transactions: Transaction[];
  categories: Category[];
  reminders: Reminder[];
  categoryLimits: CategoryLimit[];

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
  refreshLimits: () => Promise<CategoryLimit[]>;

  addReminder: (r: Reminder) => Promise<void>;
  removeReminder: (id: string) => Promise<void>;
};

// === Safe default values ===
const TransactionsContext = createContext<TransactionsContextValue>({
  transactions: [],
  categories: [],
  reminders: [],
  categoryLimits: [],
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
  refreshLimits: async () => [],

  addReminder: async () => {},
  removeReminder: async () => {},
});

// === Local keys ===
const CKEY = "categories:v1";
const RKEY = "reminders:v1";
const TKEY = "transactions:v1";
const QKEY = "transactions_queue:v1";


// === Provider ===
export const TransactionsProvider = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();

  const [serverTransactions, setServerTransactions] = useState<Transaction[]>([]);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [categoryLimits, setCategoryLimits] = useState<CategoryLimit[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<string | null>(null);
  const [pendingOperations, setPendingOperations] = useState<PendingTransactionOp[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const pendingRef = useRef<PendingTransactionOp[]>([]);
  const syncingQueueRef = useRef(false);

  const transactions = useMemo(
    () => applyPendingOperations(serverTransactions, pendingOperations),
    [serverTransactions, pendingOperations]
  );

  // === Derived categories ===
  const categories = useMemo(
    () => composeCategories(customCategories, transactions),
    [customCategories, transactions]
  );

  // === Load from storage (safe) ===
  useEffect(() => {
    (async () => {
      try {
        const [cats, rms, cache, queue] = await Promise.all([
          jget<Category[]>(CKEY, []),
          jget<Reminder[]>(RKEY, []),
          jget<Transaction[]>(TKEY, []),
          jget<PendingTransactionOp[]>(QKEY, []),
        ]);
        setCustomCategories(normalizeCustomCategories(cats || []));
        setReminders(rms || []);
        setServerTransactions(cache || []);
        setPendingOperations(queue || []);
      } catch (err) {
        console.warn("Cache loading error:", err);
      }
    })();
  }, []);

  useEffect(() => {
    pendingRef.current = pendingOperations;
    jset(QKEY, pendingOperations);
  }, [pendingOperations]);

  useEffect(() => {
    jset(TKEY, serverTransactions);
  }, [serverTransactions]);

  const enqueueOperation = useCallback((operation: PendingTransactionOp) => {
    setPendingOperations((prev) => [...prev, operation]);
  }, []);

  const removeOperation = useCallback((operationId: string) => {
    setPendingOperations((prev) => prev.filter((item) => item.id !== operationId));
  }, []);

  // === Connectivity listener ===
  useEffect(() => {
    const syncState = (state: NetInfoState) => {
      setIsConnected(Boolean(state.isConnected && state.isInternetReachable !== false));
    };
    const unsubscribe = NetInfo.addEventListener(syncState);
    NetInfo.fetch().then(syncState).catch(() => {});
    return () => {
      unsubscribe();
    };
  }, []);

  // === Migration from old key (for recovering lost data) ===
  useEffect(() => {
  (async () => {
    try {
      const oldData = await jget("transactions_cache:v1", []);
      const currentData = await jget("transactions:v1", []);
      if (!currentData.length && oldData.length) {
        await jset("transactions:v1", oldData);
        setServerTransactions(oldData);
        console.log("✅ Köhnə əməliyyatlar bərpa olundu (migrasiya tamamlandı).");
      }
    } catch (err) {
      console.warn("Migration error:", err);
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
    async <T,>(path: string, options: AxiosRequestConfig = {}) => {
      if (!token) throw new Error("Sessiya yoxdur");
      try {
        const response = await http.request<ApiResponse<T>>({
          url: path,
          ...options,
        });
        return response.data;
      } catch (err) {
        const axiosError = err as AxiosError<ApiResponse<T>>;
        if (axiosError.response?.data) {
          return axiosError.response.data;
        }
        throw err;
      }
    },
    [token]
  );

  const refreshLimits = useCallback(async () => {
    const response = await authedRequest<CategoryLimit[]>("/api/settings/limits", {
      method: "GET",
    });
    if (!response.ok) {
      throw new Error(response.error || "Limitləri yükləmək mümkün olmadı");
    }
    const data = response.data || [];
    setCategoryLimits(data);
    return data;
  }, [authedRequest]);

  // === CRUD operations ===
  const loadTransactions = useCallback(
    async (month: string) => {
      if (!month) return;
      setLoading(true);
      setError(null);
      try {
        const r = await authedRequest<Transaction[]>("/api/transactions", {
          method: "GET",
          params: { month },
        });
        if (!r.ok) throw new Error(r.error || "Alınmadı");
        const list = sortTransactions(r.data || []);
        setServerTransactions(list);
        setCurrentMonth(month);
      } catch (e: any) {
        setError(e.message || "Xəta");
      } finally {
        setLoading(false);
      }
    },
    [authedRequest]
  );

  const queueCreate = useCallback(
    (payload: CreateTransactionPayload) => {
      const clientId = `local-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      const now = new Date().toISOString();
      const localTx: Transaction = {
        _id: clientId,
        userId: token || "offline",
        type: payload.type,
        category: payload.category,
        amount: payload.amount,
        note: payload.note,
        date: payload.date || now,
        isRecurring: payload.isRecurring ?? false,
        repeatRule: payload.repeatRule,
        notify: payload.notify ?? false,
        nextTriggerAt: payload.nextTriggerAt,
        createdAt: now,
        updatedAt: now,
        pendingSync: true,
      };
      enqueueOperation({
        id: `${clientId}:create`,
        kind: "create",
        clientId,
        payload,
        local: localTx,
      });
      return localTx;
    },
    [enqueueOperation, token]
  );

  const queueUpdate = useCallback(
    (transactionId: string, patch: UpdateTransactionPatch) => {
      enqueueOperation({
        id: `${transactionId}:update:${Date.now()}`,
        kind: "update",
        transactionId,
        patch,
      });
    },
    [enqueueOperation]
  );

  const queueDelete = useCallback(
    (transactionId: string) => {
      enqueueOperation({
        id: `${transactionId}:delete:${Date.now()}`,
        kind: "delete",
        transactionId,
      });
    },
    [enqueueOperation]
  );

  const processPendingQueue = useCallback(async () => {
    if (!token || !isConnected || syncingQueueRef.current) return;
    if (!pendingRef.current.length) return;
    syncingQueueRef.current = true;
    try {
      for (const op of [...pendingRef.current]) {
        try {
          if (op.kind === "create") {
            const response = await authedRequest<Transaction>("/api/transactions", {
              method: "POST",
              data: op.payload,
            });
            if (!response.ok || !response.data) {
              throw new Error(response.error || "Əlavə edilmədi");
            }
            setServerTransactions((prev) => {
              const filtered = prev.filter((t) => t._id !== response.data!._id);
              return sortTransactions([response.data!, ...filtered]);
            });
            removeOperation(op.id);
          } else if (op.kind === "update") {
            const response = await authedRequest<Transaction>(`/api/transactions/${op.transactionId}`, {
              method: "PATCH",
              data: op.patch,
            });
            if (!response.ok || !response.data) {
              throw new Error(response.error || "Yenilənmədi");
            }
            setServerTransactions((prev) =>
              sortTransactions(prev.map((t) => (t._id === op.transactionId ? response.data! : t)))
            );
            removeOperation(op.id);
          } else if (op.kind === "delete") {
            const response = await authedRequest<null>(`/api/transactions/${op.transactionId}`, {
              method: "DELETE",
            });
            if (!response.ok) {
              throw new Error(response.error || "Silinmədi");
            }
            setServerTransactions((prev) => prev.filter((t) => t._id !== op.transactionId));
            removeOperation(op.id);
          }
        } catch (err) {
          console.warn("Queue sync error", err);
          break;
        }
      }
    } finally {
      syncingQueueRef.current = false;
    }
  }, [authedRequest, isConnected, removeOperation, token]);

  useEffect(() => {
    processPendingQueue();
  }, [processPendingQueue, isConnected, pendingOperations.length, token]);

  const createTransaction = useCallback(
    async (payload: CreateTransactionPayload) => {
      if (!isConnected) {
        queueCreate(payload);
        showToast("Offline saxlanıldı");
        return true;
      }
      setLoading(true);
      setError(null);
      try {
        const r = await authedRequest<Transaction>("/api/transactions", {
          method: "POST",
          data: payload,
        });
        if (!r.ok || !r.data) throw new Error(r.error || "Əlavə edilmədi");
        const tx = r.data;

        setServerTransactions((prev) => {
          const filtered = prev.filter((item) => item._id !== tx._id);
          return sortTransactions([tx, ...filtered]);
        });
        return true;
      } catch (e: any) {
        if (isNetworkOnlyError(e)) {
          queueCreate(payload);
          showToast("Offline saxlanıldı");
          return true;
        }
        setError(e.message || "Xəta");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [authedRequest, isConnected, queueCreate]
  );

  const updateTransaction = useCallback(
    async (id: string, patch: UpdateTransactionPatch) => {
      if (!isConnected) {
        queueUpdate(id, patch);
        showToast("Offline saxlanıldı");
        return true;
      }
      setLoading(true);
      setError(null);
      try {
        const r = await authedRequest<Transaction>(`/api/transactions/${id}`, {
          method: "PATCH",
          data: patch,
        });
        if (!r.ok || !r.data) throw new Error(r.error || "Yenilənmədi");
        setServerTransactions((prev) =>
          prev.map((t) => (t._id === id ? r.data! : t))
        );
        return true;
      } catch (e: any) {
        if (isNetworkOnlyError(e)) {
          queueUpdate(id, patch);
          showToast("Offline saxlanıldı");
          return true;
        }
        setError(e.message || "Xəta");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [authedRequest, isConnected, queueUpdate]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!isConnected) {
        queueDelete(id);
        showToast("Offline saxlanıldı");
        return true;
      }
      setLoading(true);
      setError(null);
      try {
        const r = await authedRequest<null>(`/api/transactions/${id}`, {
          method: "DELETE",
        });
        if (!r.ok) throw new Error(r.error || "Silinmədi");
        setServerTransactions((prev) => prev.filter((t) => t._id !== id));
        return true;
      } catch (e: any) {
        if (isNetworkOnlyError(e)) {
          queueDelete(id);
          showToast("Offline saxlanıldı");
          return true;
        }
        setError(e.message || "Xəta");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [authedRequest, isConnected, queueDelete]
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
      categoryLimits,
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
      refreshLimits,
      addReminder,
      removeReminder,
    }),
    [transactions, categories, reminders, categoryLimits, loading, error, currentMonth, refreshLimits]
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

function sortTransactions(list: Transaction[]): Transaction[] {
  return [...list].sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

function applyPendingOperations(
  base: Transaction[],
  ops: PendingTransactionOp[]
): Transaction[] {
  const map = new Map<string, Transaction>();
  base.forEach((tx) => map.set(tx._id, tx));

  for (const op of ops) {
    if (op.kind === "create") {
      map.set(op.clientId, op.local);
    } else if (op.kind === "update") {
      if (map.has(op.transactionId)) {
        const current = map.get(op.transactionId)!;
        map.set(op.transactionId, {
          ...current,
          ...op.patch,
          pendingSync: true,
        });
      }
    } else if (op.kind === "delete") {
      map.delete(op.transactionId);
    }
  }

  return sortTransactions(Array.from(map.values()));
}

function isNetworkOnlyError(error: unknown): boolean {
  if (!error) return false;
  const axiosError = error as AxiosError;
  if (axiosError && typeof axiosError === "object" && "isAxiosError" in axiosError) {
    return axiosError.isAxiosError && !axiosError.response;
  }
  const message = String((error as Error)?.message || "").toLowerCase();
  return message.includes("network");
}
