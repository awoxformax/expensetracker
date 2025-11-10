export type DefaultCategory = {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
};

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  { id: "base_food", name: "Qida", type: "expense", icon: "fast-food-outline", color: "#FDBA74" },
  { id: "base_transport", name: "Nəqliyyat", type: "expense", icon: "bus-outline", color: "#5BC0DE" },
  { id: "base_bills", name: "Kommunal", type: "expense", icon: "flash-outline", color: "#60A5FA" },
  { id: "base_entertainment", name: "Əyləncə", type: "expense", icon: "game-controller-outline", color: "#F472B6" },
  { id: "base_health", name: "Sağlamlıq", type: "expense", icon: "medkit-outline", color: "#34D399" },
  { id: "base_shopping", name: "Mağaza", type: "expense", icon: "cart-outline", color: "#FCD34D" },
  { id: "base_credit", name: "Kredit", type: "expense", icon: "card-outline", color: "#93C5FD" },
];

export const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
  { id: "base_salary", name: "Maaş", type: "income", icon: "wallet-outline", color: "#4ADE80" },
  { id: "base_stipend", name: "Stipendiya", type: "income", icon: "school-outline", color: "#A78BFA" },
  { id: "base_bonus", name: "Bonus", type: "income", icon: "gift-outline", color: "#F87171" },
  { id: "base_extra", name: "Əlavə gəlir", type: "income", icon: "trending-up-outline", color: "#60A5FA" },
];

export const DEFAULT_CATEGORIES = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
