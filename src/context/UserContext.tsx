import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserState, saveUserState } from "../lib/storage";
import { useAuth } from "./AuthContext";
import {
  apiGetProfile,
  apiUpdateProfile,
  RemoteCategoryPayload,
  UserProfileResponse,
  UserProfileUpdatePayload,
} from "../lib/api";
import { ONBOARDING_DONE_KEY } from "../constants/storage";

// === Type definitions ===
export type Persona = "student" | "worker" | "family";
export type IncomeType = "salary" | "scholarship" | "freelancer" | "additional";

const PERSONA_VALUES: Persona[] = ["student", "worker", "family"];
const INCOME_VALUES: IncomeType[] = ["salary", "scholarship", "freelancer", "additional"];

export type Category = {
  id: string;
  name: string;
  description?: string;
  period?: "daily" | "monthly";
  icon?: string;
  type?: "income" | "expense";
};

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  category?: string;
};

export type UserProfile = {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  persona?: Persona;
  incomeType?: IncomeType;
  phone?: string; // ✅ phone əlavə olundu
};

export type UserState = {
  profile: UserProfile;
  categories: Category[];
  transactions: Transaction[];
  budget?: number;
  onboardingPhase1Done?: boolean;
  profileCompleted?: boolean;
};

const mapRemoteCategories = (list?: RemoteCategoryPayload[]): Category[] => {
  if (!Array.isArray(list)) return [];
  return list
    .map((cat) => ({
      id: cat.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: cat.name || "",
      description: cat.description,
      period: cat.period,
      icon: cat.icon,
      type: cat.type as Category["type"],
    }))
    .filter((cat) => cat.id && cat.name);
};

const createDefaultState = (): UserState => ({
  profile: {},
  categories: [],
  transactions: [],
});

const defaultState: UserState = createDefaultState();

export type UserContextType = {
  state: UserState;
  loading: boolean;

  setPersona: (p: Persona) => void;
  setIncomeType: (i: IncomeType) => void;
  setCategories: (cats: Category[]) => void;
  addCategory: (cat: Omit<Category, "id">) => void;
  removeCategory: (id: string) => void;
  updateCategory: (id: string, patch: Partial<Omit<Category, "id">>) => void;
  setName: (firstName: string, lastName: string) => void;
  setBirthDate: (birthDate: string) => void;
  setPhone: (phone: string) => void; // ✅ yeni metod
  setBudget: (budget: number) => void;
  completePhase1: () => void;
  completeProfile: () => void;
  reset: () => void;
};

// === Default Context ===
const UserContext = createContext<UserContextType>({
  state: defaultState,
  loading: true,

  setPersona: () => {},
  setIncomeType: () => {},
  setCategories: () => {},
  addCategory: () => {},
  removeCategory: () => {},
  updateCategory: () => {},
  setName: () => {},
  setBirthDate: () => {},
  setPhone: () => {},
  setBudget: () => {},
  completePhase1: () => {},
  completeProfile: () => {},
  reset: () => {},
});

// === Provider ===
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<UserState>(createDefaultState());
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  // Load from storage
  useEffect(() => {
    (async () => {
      const saved = await getUserState<UserState>();
      if (saved) setState(saved);
      setLoading(false);
    })();
  }, []);

  // Persist helper
  const persist = useCallback((updater: (prev: UserState) => UserState) => {
    setState((prev) => {
      const next = updater(prev);
      saveUserState(next);
      return next;
    });
  }, []);

  const applyRemoteProfile = useCallback(
    (payload?: UserProfileResponse["data"]) => {
      if (!payload) return;
      persist((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          firstName: payload.firstName ?? prev.profile.firstName,
          lastName: payload.lastName ?? prev.profile.lastName,
          phone: payload.phone ?? prev.profile.phone,
          persona:
            payload.persona && PERSONA_VALUES.includes(payload.persona as Persona)
              ? (payload.persona as Persona)
              : prev.profile.persona,
          incomeType:
            payload.incomeType && INCOME_VALUES.includes(payload.incomeType as IncomeType)
              ? (payload.incomeType as IncomeType)
              : prev.profile.incomeType,
        },
        categories: payload.categories ? mapRemoteCategories(payload.categories) : prev.categories,
        budget: payload.budget != null ? payload.budget : prev.budget,
        onboardingPhase1Done:
          payload.onboardingCompleted ?? prev.onboardingPhase1Done,
      }));
    },
    [persist]
  );

  useEffect(() => {
    if (!token) {
      const fresh = createDefaultState();
      setState(fresh);
      saveUserState(fresh);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await apiGetProfile();
        if (!response.ok || cancelled) return;
        applyRemoteProfile(response.data);
        if (response.data?.onboardingCompleted) {
          await AsyncStorage.setItem(ONBOARDING_DONE_KEY, "true");
        }
      } catch (err) {
        console.warn("Failed to load profile", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, applyRemoteProfile]);

  const pushProfileUpdate = useCallback(
    async (payload: UserProfileUpdatePayload) => {
      if (!token) return;
      try {
        await apiUpdateProfile(payload);
      } catch (err) {
        console.warn("Profile sync failed", err);
      }
    },
    [token]
  );

  // === Update methods ===
  const setPersona = useCallback(
    (p: Persona) => {
      persist((prev) => ({ ...prev, profile: { ...prev.profile, persona: p } }));
      pushProfileUpdate({ persona: p });
    },
    [persist, pushProfileUpdate]
  );

  const setIncomeType = useCallback(
    (i: IncomeType) => {
      persist((prev) => ({ ...prev, profile: { ...prev.profile, incomeType: i } }));
      pushProfileUpdate({ incomeType: i });
    },
    [persist, pushProfileUpdate]
  );

  const setCategories = useCallback(
    (cats: Category[]) => {
      persist((prev) => ({ ...prev, categories: cats }));
      pushProfileUpdate({ categories: cats });
    },
    [persist, pushProfileUpdate]
  );

  const addCategory = useCallback(
    (cat: Omit<Category, "id">) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      let snapshot: Category[] = [];
      persist((prev) => {
        snapshot = [...prev.categories, { id, ...cat }];
        return { ...prev, categories: snapshot };
      });
      pushProfileUpdate({ categories: snapshot });
    },
    [persist, pushProfileUpdate]
  );

  const removeCategory = useCallback(
    (id: string) => {
      let snapshot: Category[] = [];
      persist((prev) => {
        snapshot = prev.categories.filter((c) => c.id !== id);
        return { ...prev, categories: snapshot };
      });
      pushProfileUpdate({ categories: snapshot });
    },
    [persist, pushProfileUpdate]
  );

  const updateCategory = useCallback(
    (id: string, patch: Partial<Omit<Category, "id">>) => {
      let snapshot: Category[] = [];
      persist((prev) => {
        snapshot = prev.categories.map((c) => (c.id === id ? { ...c, ...patch } : c));
        return { ...prev, categories: snapshot };
      });
      pushProfileUpdate({ categories: snapshot });
    },
    [persist, pushProfileUpdate]
  );

  const setName = useCallback(
    (firstName: string, lastName: string) => {
      persist((prev) => ({
        ...prev,
        profile: { ...prev.profile, firstName, lastName },
      }));
      pushProfileUpdate({ firstName, lastName });
    },
    [persist, pushProfileUpdate]
  );

  const setBirthDate = useCallback(
    (birthDate: string) =>
      persist((prev) => ({
        ...prev,
        profile: { ...prev.profile, birthDate },
      })),
    [persist]
  );

  const setPhone = useCallback(
    (phone: string) => {
      persist((prev) => ({
        ...prev,
        profile: { ...prev.profile, phone },
      }));
      pushProfileUpdate({ phone });
    },
    [persist, pushProfileUpdate]
  );

  const setBudget = useCallback(
    (budget: number) => {
      persist((prev) => ({ ...prev, budget }));
      pushProfileUpdate({ budget });
    },
    [persist, pushProfileUpdate]
  );

  const completePhase1 = useCallback(() => {
    persist((prev) => ({ ...prev, onboardingPhase1Done: true }));
    pushProfileUpdate({ onboardingCompleted: true });
    AsyncStorage.setItem(ONBOARDING_DONE_KEY, "true").catch(() => {});
  }, [persist, pushProfileUpdate]);

  const completeProfile = useCallback(
    () => persist((prev) => ({ ...prev, profileCompleted: true })),
    [persist]
  );

  const reset = useCallback(() => {
    const fresh = createDefaultState();
    setState(fresh);
    saveUserState(fresh);
  }, []);

  // === Context Value ===
  const value = useMemo(
    () => ({
      state,
      loading,
      setPersona,
      setIncomeType,
      setCategories,
      addCategory,
      removeCategory,
      updateCategory,
      setName,
      setBirthDate,
      setPhone, // ✅ əlavə edildi
      setBudget,
      completePhase1,
      completeProfile,
      reset,
    }),
    [
      state,
      loading,
      setPersona,
      setIncomeType,
      setCategories,
      addCategory,
      removeCategory,
      updateCategory,
      setName,
      setBirthDate,
      setPhone,
      setBudget,
      completePhase1,
      completeProfile,
      reset,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
