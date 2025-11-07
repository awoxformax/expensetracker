export type AppTheme = {
  background: string;
  card: string;
  text: string;
  textMuted: string;
  primary: string;
  accent: string;
  bgGradient: [string, string];
  ctaGradient: [string, string];
  introGradients: [string, string][];
};

export type PresetName = 'crypto' | 'abyss' | 'emerald' | 'sunset';

export const Themes: Record<PresetName, AppTheme> = {
  crypto: {
    background: '#0B0F14',
    card: '#10151C',
    text: '#E6F0FF',
    textMuted: '#91A3C0',
    primary: '#00E0FF',
    accent: '#6C5CE7',
    bgGradient: ['#0B0F14', '#0A0E16'],
    ctaGradient: ['#00E0FF', '#6C5CE7'],
    introGradients: [
      ['#0B0F14', '#102033'],
      ['#0A0E16', '#0F2742'],
      ['#0F2742', '#0B0F14'],
      ['#0D1420', '#0A0E16'],
    ],
  },
  abyss: {
    background: '#0b1220',
    card: '#101826',
    text: '#E5E7EB',
    textMuted: '#94A3B8',
    primary: '#3B82F6',
    accent: '#8B5CF6',
    bgGradient: ['#0f172a', '#0b1220'],
    ctaGradient: ['#3B82F6', '#8B5CF6'],
    introGradients: [
      ['#1A1A2E', '#16213E'],
      ['#16213E', '#0F3460'],
      ['#0F3460', '#1A1A2E'],
      ['#101826', '#0B1220'],
    ],
  },
  emerald: {
    background: '#0b1f1a',
    card: '#10211c',
    text: '#E5F3EF',
    textMuted: '#9AC7BB',
    primary: '#10B981',
    accent: '#34D399',
    bgGradient: ['#0b1f1a', '#071510'],
    ctaGradient: ['#10B981', '#34D399'],
    introGradients: [
      ['#0b1f1a', '#0e2a22'],
      ['#0e2a22', '#134236'],
      ['#134236', '#0b1f1a'],
      ['#0f2720', '#0a1a15'],
    ],
  },
  sunset: {
    background: '#1e1416',
    card: '#26191c',
    text: '#FFEFEF',
    textMuted: '#E7B5B5',
    primary: '#FB7185',
    accent: '#F59E0B',
    bgGradient: ['#1e1416', '#2b1a1d'],
    ctaGradient: ['#FB7185', '#F59E0B'],
    introGradients: [
      ['#2b1a1d', '#3b1d21'],
      ['#3b1d21', '#4a1f23'],
      ['#4a1f23', '#2b1a1d'],
      ['#301b1f', '#231417'],
    ],
  },
};

export const DEFAULT_PRESET: PresetName = 'crypto';
