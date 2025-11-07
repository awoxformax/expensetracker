import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ProfileType = 'student' | 'worker' | 'family';

export type OnboardingState = {
  categories: string[];
  name: string;
  profile: ProfileType | null;
  balance: number | null;
  goal: number | null;
};

type OnboardingContextValue = {
  state: OnboardingState;
  setCategories: (next: string[]) => void;
  toggleCategory: (id: string) => void;
  setName: (value: string) => void;
  setProfile: (value: ProfileType | null) => void;
  setBalance: (value: number | null) => void;
  setGoal: (value: number | null) => void;
  reset: () => void;
};

const defaultState: OnboardingState = {
  categories: [],
  name: '',
  profile: null,
  balance: null,
  goal: null,
};

const OnboardingContext = createContext<OnboardingContextValue>({
  state: defaultState,
  setCategories: () => {},
  toggleCategory: () => {},
  setName: () => {},
  setProfile: () => {},
  setBalance: () => {},
  setGoal: () => {},
  reset: () => {},
});

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<OnboardingState>(defaultState);

  const setCategories = useCallback((next: string[]) => {
    setState(prev => ({ ...prev, categories: next }));
  }, []);

  const toggleCategory = useCallback((id: string) => {
    setState(prev => {
      const exists = prev.categories.includes(id);
      const categories = exists
        ? prev.categories.filter(value => value !== id)
        : [...prev.categories, id];
      return { ...prev, categories };
    });
  }, []);

  const setName = useCallback((value: string) => {
    setState(prev => ({ ...prev, name: value }));
  }, []);

  const setProfile = useCallback((value: ProfileType | null) => {
    setState(prev => ({ ...prev, profile: value }));
  }, []);

  const setBalance = useCallback((value: number | null) => {
    setState(prev => ({ ...prev, balance: value }));
  }, []);

  const setGoal = useCallback((value: number | null) => {
    setState(prev => ({ ...prev, goal: value }));
  }, []);

  const reset = useCallback(() => {
    setState(defaultState);
  }, []);

  const value = useMemo(
    () => ({
      state,
      setCategories,
      toggleCategory,
      setName,
      setProfile,
      setBalance,
      setGoal,
      reset,
    }),
    [state, setBalance, setCategories, setGoal, setName, setProfile, toggleCategory, reset],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = () => useContext(OnboardingContext);

