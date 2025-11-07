import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert, Platform, ToastAndroid } from 'react-native';
import { API_BASE_URL } from '../lib/config';
import { useAuth } from './AuthContext';

export type TransactionRepeatRule = {
  freq: 'daily' | 'weekly' | 'monthly';
  dayOfMonth?: number;
  weekday?: number;
};

export type Transaction = {
  _id: string;
  userId: string;
  type: 'income' | 'expense';
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
  type: 'income' | 'expense';
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
  Pick<Transaction, 'amount' | 'category' | 'note'>
>;

export type CategoryLimit = {
  _id: string;
  userId: string;
  category: string;
  monthlyLimit: number;
};

type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

type TransactionsContextValue = {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  currentMonth: string | null;
  limits: CategoryLimit[];
  loadTransactions: (month: string) => Promise<void>;
  refreshLimits: () => Promise<void>;
  createTransaction: (payload: CreateTransactionPayload) => Promise<boolean>;
  updateTransaction: (id: string, patch: UpdateTransactionPatch) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
};

const TransactionsContext = createContext<TransactionsContextValue>({
  transactions: [],
  loading: false,
  error: null,
  currentMonth: null,
  limits: [],
  loadTransactions: async () => {},
  refreshLimits: async () => {},
  createTransaction: async () => false,
  updateTransaction: async () => false,
  deleteTransaction: async () => false,
});

const formatMonthKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
};

export const TransactionsProvider = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<string | null>(null);
  const [limits, setLimits] = useState<CategoryLimit[]>([]);

  const showLimitNotification = useCallback((msg: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.LONG);
    } else {
      Alert.alert('Limit xəbərdarlığı', msg);
    }
  }, []);

  const authedRequest = useCallback(
    async <T,>(path: string, options: RequestInit = {}) => {
      if (!token) {
        throw new Error('Sessiya tapılmadı. Yenidən giriş edin.');
      }
      try {
        const res = await fetch(`${API_BASE_URL}${path}`, {
          ...options,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
        });
        const data = (await res.json()) as ApiResponse<T>;
        return data;
      } catch (err) {
        throw new Error('Şəbəkə xətası baş verdi');
      }
    },
    [token]
  );

  const refreshLimits = useCallback(async () => {
    if (!token) return;
    try {
      const result = await authedRequest<CategoryLimit[]>('/api/settings/limits', { method: 'GET' });
      if (result.ok && result.data) {
        setLimits(result.data);
      }
    } catch (err) {
      console.warn('Limits fetch failed', err);
    }
  }, [authedRequest, token]);

  useEffect(() => {
    if (token) {
      refreshLimits();
    } else {
      setLimits([]);
    }
  }, [token, refreshLimits]);

  const loadTransactions = useCallback(
    async (month: string) => {
      if (!month) return;
      setLoading(true);
      setError(null);
      try {
        const result = await authedRequest<Transaction[]>(
          `/api/transactions?month=${month}`,
          { method: 'GET' }
        );
        if (!result.ok) {
          throw new Error(result.error || 'Əməliyyatları almaq mümkün olmadı');
        }
        setTransactions(result.data || []);
        setCurrentMonth(month);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Naməlum xəta baş verdi');
      } finally {
        setLoading(false);
      }
    },
    [authedRequest]
  );

  const checkAndNotifyLimit = useCallback(
    async (transaction: Transaction, scopedTransactions?: Transaction[]) => {
      if (transaction.type !== 'expense' || !limits.length) return;
      const limitEntry = limits.find(
        (item) => item.category.toLowerCase() === (transaction.category || '').toLowerCase()
      );
      if (!limitEntry || limitEntry.monthlyLimit <= 0) return;
      const monthKey = formatMonthKey(transaction.date);
      if (!monthKey) return;
      let monthTransactions = scopedTransactions;
      if (!monthTransactions) {
        try {
          const result = await authedRequest<Transaction[]>(`/api/transactions?month=${monthKey}`, {
            method: 'GET',
          });
          if (!result.ok || !result.data) return;
          monthTransactions = result.data;
        } catch (err) {
          console.warn('Limit month fetch failed', err);
          return;
        }
      }

      const monthTotal = monthTransactions
        .filter(
          (tx) =>
            tx.type === 'expense' &&
            tx.category &&
            tx.category.toLowerCase() === (transaction.category || '').toLowerCase()
        )
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      if (monthTotal <= 0) return;
      const ratio = monthTotal / limitEntry.monthlyLimit;
      if (ratio >= 1) {
        showLimitNotification(
          `"${transaction.category}" limiti keçdi (${monthTotal.toFixed(2)} / ${limitEntry.monthlyLimit} AZN).`
        );
      } else if (ratio >= 0.8) {
        showLimitNotification(
          `"${transaction.category}" limiti ${Math.round(ratio * 100)}% doldu (${monthTotal.toFixed(
            2
          )} / ${limitEntry.monthlyLimit} AZN).`
        );
      }
    },
    [limits, authedRequest, showLimitNotification]
  );

  const createTransaction = useCallback(
    async (payload: CreateTransactionPayload) => {
      setError(null);
      setLoading(true);
      try {
        const result = await authedRequest<Transaction>('/api/transactions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!result.ok || !result.data) {
          throw new Error(result.error || 'Əməliyyat əlavə olunmadı');
        }
        const txMonth = formatMonthKey(result.data.date);
        let scopedTransactions: Transaction[] | undefined;
        if (currentMonth && txMonth === currentMonth) {
          setTransactions((prev) => {
            const updated = [result.data, ...prev].sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            scopedTransactions = updated;
            return updated;
          });
        }
        await checkAndNotifyLimit(result.data, scopedTransactions);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Əməliyyat əlavə edilə bilmədi');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [authedRequest, currentMonth, checkAndNotifyLimit]
  );

  const updateTransaction = useCallback(
    async (id: string, patch: UpdateTransactionPatch) => {
      setError(null);
      setLoading(true);
      try {
        const result = await authedRequest<Transaction>(`/api/transactions/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        });
        if (!result.ok || !result.data) {
          throw new Error(result.error || 'Əməliyyat yenilənmədi');
        }
        setTransactions((prev) =>
          prev.map((tx) => (tx._id === id ? result.data : tx))
        );
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Əməliyyatı yeniləmək olmadı');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [authedRequest]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      setError(null);
      setLoading(true);
      try {
        const result = await authedRequest<null>(`/api/transactions/${id}`, {
          method: 'DELETE',
        });
        if (!result.ok) {
          throw new Error(result.error || 'Əməliyyatı silmək olmadı');
        }
        setTransactions((prev) => prev.filter((tx) => tx._id !== id));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Əməliyyatı silmək olmadı');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [authedRequest]
  );

  const value = useMemo(
    () => ({
      transactions,
      loading,
      error,
      currentMonth,
      limits,
      loadTransactions,
      refreshLimits,
      createTransaction,
      updateTransaction,
      deleteTransaction,
    }),
    [
      transactions,
      loading,
      error,
      currentMonth,
      limits,
      loadTransactions,
      refreshLimits,
      createTransaction,
      updateTransaction,
      deleteTransaction,
    ]
  );

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
};

export const useTransactions = () => useContext(TransactionsContext);
