export type OnboardingCategory = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
};

export const ONBOARDING_CATEGORIES: OnboardingCategory[] = [
  {
    id: 'food',
    name: 'Qida və içkilər',
    description: 'Yeməkxana, fast food, qəlyanaltı',
    icon: 'fast-food-outline',
    color: '#FFAD60',
  },
  {
    id: 'transport',
    name: 'Nəqliyyat',
    description: 'Avtobus, metro, taksi',
    icon: 'bus-outline',
    color: '#5BC0DE',
  },
  {
    id: 'education',
    name: 'Təhsil materialları',
    description: 'Kitab, dəftər və çap',
    icon: 'book-outline',
    color: '#A07AFF',
  },
  {
    id: 'entertainment',
    name: 'Əyləncə',
    description: 'Oyun, kino, dostlarla görüş',
    icon: 'game-controller-outline',
    color: '#FF708B',
  },
  {
    id: 'bills',
    name: 'Kommunal',
    description: 'İşıq, qaz, internet',
    icon: 'flash-outline',
    color: '#4F8BFF',
  },
  {
    id: 'savings',
    name: 'Yığım & qənaət',
    description: 'Depozit, investisiya, ehtiyat',
    icon: 'trending-up-outline',
    color: '#34D399',
  },
];

