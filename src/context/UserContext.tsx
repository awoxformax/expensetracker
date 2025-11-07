import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getUserState, saveUserState } from '../lib/storage';

export type Persona = 'student' | 'worker' | 'family';
export type IncomeType = 'salary' | 'scholarship' | 'freelancer' | 'additional';

export type Category = {
  id: string;
  name: string;
  description?: string;
  period?: 'daily' | 'monthly';
  icon?: string;
};

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category?: string;
};

export type UserProfile = {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  persona?: Persona;
  incomeType?: IncomeType;
};

export type UserState = {
  profile: UserProfile;
  categories: Category[];
  transactions: Transaction[];
  budget?: number;
  onboardingPhase1Done?: boolean;
  profileCompleted?: boolean;
};

const createDefaultState = (): UserState => ({
  profile: {},
  categories: [],
  transactions: [],
});

const defaultState: UserState = createDefaultState();

type UserContextType = {
  state: UserState;
  loading: boolean;
  setPersona: (p: Persona) => void;
  setIncomeType: (i: IncomeType) => void;
  setCategories: (cats: Category[]) => void;
  addCategory: (cat: Omit<Category, 'id'>) => void;
  removeCategory: (id: string) => void;
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id'>>) => void;
  setName: (firstName: string, lastName: string) => void;
  setBirthDate: (birthDate: string) => void;
  setBudget: (budget: number) => void;
  completePhase1: () => void;
  completeProfile: () => void;
  reset: () => void;
};

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
  setBudget: () => {},
  completePhase1: () => {},
  completeProfile: () => {},
  reset: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<UserState>(createDefaultState());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await getUserState<UserState>();
      if (saved) setState(saved);
      setLoading(false);
    })();
  }, []);

  const persist = useCallback((updater: (prev: UserState) => UserState) => {
    setState(prev => {
      const next = updater(prev);
      // fire-and-forget persist
      saveUserState(next);
      return next;
    });
  }, []);

  const setPersona = useCallback((p: Persona) => {
    persist(prev => ({ ...prev, profile: { ...prev.profile, persona: p } }));
  }, [persist]);

  const setIncomeType = useCallback((i: IncomeType) => {
    persist(prev => ({ ...prev, profile: { ...prev.profile, incomeType: i } }));
  }, [persist]);

  const setCategories = useCallback((cats: Category[]) => {
    persist(prev => ({ ...prev, categories: cats }));
  }, [persist]);

  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    persist(prev => ({ ...prev, categories: [...prev.categories, { id, ...cat }] }));
  }, [persist]);

  const removeCategory = useCallback((id: string) => {
    persist(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }));
  }, [persist]);

  const updateCategory = useCallback((id: string, patch: Partial<Omit<Category, 'id'>>) => {
    persist(prev => ({
      ...prev,
      categories: prev.categories.map(c => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, [persist]);

  const setName = useCallback((firstName: string, lastName: string) => {
    persist(prev => ({ ...prev, profile: { ...prev.profile, firstName, lastName } }));
  }, [persist]);

  const setBirthDate = useCallback((birthDate: string) => {
    persist(prev => ({ ...prev, profile: { ...prev.profile, birthDate } }));
  }, [persist]);

  const setBudget = useCallback((budget: number) => {
    persist(prev => ({ ...prev, budget }));
  }, [persist]);

  const completePhase1 = useCallback(() => {
    persist(prev => ({ ...prev, onboardingPhase1Done: true }));
  }, [persist]);

  const completeProfile = useCallback(() => {
    persist(prev => ({ ...prev, profileCompleted: true }));
  }, [persist]);

  const reset = useCallback(() => {
    const fresh = createDefaultState();
    setState(fresh);
    saveUserState(fresh);
  }, []);

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
      setBudget,
      completePhase1,
      completeProfile,
      reset,
    }),
    [state, loading, setPersona, setIncomeType, setCategories, addCategory, removeCategory, updateCategory, setName, setBirthDate, setBudget, completePhase1, completeProfile, reset]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
