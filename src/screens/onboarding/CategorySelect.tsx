import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Animated, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { Persona, useUser } from '../../context/UserContext';
import type { AppTheme } from '../../theme/colors';

type CategoryTone = 'food' | 'transport' | 'education' | 'entertainment' | 'default';

type CategoryTemplate = {
  id: string;
  name: string;
  description: string;
  period: 'daily' | 'monthly';
  icon: string;
  tone?: CategoryTone;
};

type DisplayCategory = CategoryTemplate & { custom?: boolean };

type CategorySelectRouteParams = {
  onConfirm?: (ids: string[]) => void;
  preselectedIds?: string[];
};

type CategorySelectRoute = RouteProp<{ CategorySelect: CategorySelectRouteParams | undefined }, 'CategorySelect'>;

const ICON_COLOR_MAP: Record<CategoryTone, string> = {
  food: '#FFAD60',
  transport: '#5BC0DE',
  education: '#A07AFF',
  entertainment: '#FF708B',
  default: '#8EA3FF',
};

const PERIOD_LABEL: Record<'daily' | 'monthly', string> = {
  daily: 'Gündəlik',
  monthly: 'Aylıq',
};

const PERSONA_LABELS: Record<Persona, string> = {
  student: 'Tələbə',
  worker: 'İşçi',
  family: 'Ailə başçısı',
};

const AI_SUGGESTION: DisplayCategory = {
  id: 'ai_cafe_daily',
  name: 'Kafe & çayxana',
  description: 'Sürətli kofe və isti içkilər üçün ideal xərclər.',
  period: 'daily',
  icon: 'cafe-outline',
  tone: 'food',
  custom: true,
};

const ACTIVE_CARD_SCALE = 1;
const INACTIVE_CARD_SCALE = 0.98;

const BASE_CATEGORIES: Record<Persona, CategoryTemplate[]> = {
  student: [
    { id: 'student_food', name: 'Qida və içkilər', description: 'Yeməkxana, fast food, qəlyanaltı', period: 'daily', icon: 'fast-food-outline', tone: 'food' },
    { id: 'student_transport', name: 'Nəqliyyat', description: 'Avtobus, metro, taksi', period: 'daily', icon: 'bus-outline', tone: 'transport' },
    { id: 'student_materials', name: 'Təhsil materialları', description: 'Kitab, dəftər və çap', period: 'monthly', icon: 'book-outline', tone: 'education' },
    { id: 'student_entertainment', name: 'Ələncə', description: 'Oyun, kino, dostlarla görüş', period: 'monthly', icon: 'game-controller-outline', tone: 'entertainment' },
  ],
  worker: [
    { id: 'worker_food', name: 'Naharlama', description: 'Kafe, restoran, qəhvə', period: 'daily', icon: 'cafe-outline', tone: 'food' },
    { id: 'worker_commute', name: 'Yol xərcləri', description: 'Yanacaq və ictimai nəqliyyat', period: 'daily', icon: 'car-outline', tone: 'transport' },
    { id: 'worker_bills', name: 'Kommunal', description: 'İşıq, qaz, internet', period: 'monthly', icon: 'flash-outline', tone: 'default' },
    { id: 'worker_credit', name: 'Kredit ödənişləri', description: 'Bank, ipoteka, kredit kartı', period: 'monthly', icon: 'card-outline', tone: 'default' },
  ],
  family: [
    { id: 'family_food', name: 'Ev ərzağı', description: 'Market, supermarket, ehtiyat', period: 'daily', icon: 'cart-outline', tone: 'food' },
    { id: 'family_transport', name: 'Nəqliyyat', description: 'Yanacaq, servis, taksi', period: 'daily', icon: 'car-sport-outline', tone: 'transport' },
    { id: 'family_children', name: 'Uşaqlar', description: 'Məktəb, geyim, fəaliyyətlər', period: 'monthly', icon: 'balloon-outline', tone: 'education' },
    { id: 'family_debt', name: 'Öhdəliklər', description: 'Kredit, ipoteka, kirayə', period: 'monthly', icon: 'wallet-outline', tone: 'default' },
  ],
};

const withOpacity = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '');
  const expanded = sanitized.length === 3 ? sanitized.split('').map(char => char + char).join('') : sanitized;
  const parsed = Number.parseInt(expanded, 16);
  if (Number.isNaN(parsed)) {
    return `rgba(255,255,255,${alpha})`;
  }
  const r = (parsed >> 16) & 255;
  const g = (parsed >> 8) & 255;
  const b = parsed & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function CategorySelect() {
  const { colors, fonts } = useTheme();
  const { state, setCategories, completePhase1 } = useUser();
  const nav = useNavigation();
  const route = useRoute<CategorySelectRoute>();
  const params = route.params ?? {};
  const externalOnConfirm = params.onConfirm;
  const preselectedIds = params.preselectedIds;

  const persona = useMemo(() => (state.profile.persona || 'student') as Persona, [state.profile.persona]);

  const baseForPersona = useMemo(() => BASE_CATEGORIES[persona].map(category => ({ ...category })), [persona]);

  const [categories, setCategoriesList] = useState<DisplayCategory[]>(() => baseForPersona);
  const [selected, setSelected] = useState<Set<string>>(() => {
    if (preselectedIds?.length) {
      return new Set(preselectedIds);
    }
    return new Set(baseForPersona.map(category => category.id));
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('sparkles-outline');
  const [catPeriod, setCatPeriod] = useState<'daily' | 'monthly'>('daily');
  const [suggestionHidden, setSuggestionHidden] = useState(false);

  useEffect(() => {
    setCategoriesList(current => {
      const custom = current.filter(category => category.custom);
      return [...baseForPersona, ...custom];
    });
  }, [baseForPersona]);

  useEffect(() => {
    if (preselectedIds?.length) {
      setSelected(new Set(preselectedIds));
      return;
    }
    setSelected(new Set(baseForPersona.map(category => category.id)));
  }, [baseForPersona, preselectedIds]);

  const toggleCategory = useCallback((id: string) => {
    Haptics.selectionAsync().catch(() => undefined);
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const openModal = useCallback(() => {
    setCatName('');
    setCatDesc('');
    setCatIcon('sparkles-outline');
    setCatPeriod('daily');
    setModalVisible(true);
  }, []);

  const handleAddCategory = useCallback(() => {
    const name = catName.trim();
    if (!name) {
      return;
    }
    const id = `custom_${Date.now()}`;
    const newCategory: DisplayCategory = {
      id,
      name,
      description: catDesc.trim(),
      period: catPeriod,
      icon: catIcon.trim() || 'sparkles-outline',
      tone: 'default',
      custom: true,
    };
    setCategoriesList(prev => [...prev, newCategory]);
    setSelected(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }, [catDesc, catIcon, catName, catPeriod]);

  const renderIcon = useCallback((icon: string, size: number, color: string) => {
    if (Ionicons.glyphMap[icon]) {
      return <Ionicons name={icon as any} size={size} color={color} />;
    }
    return <Text style={{ fontSize: size, color }}>{icon}</Text>;
  }, []);

  const canContinue = selected.size > 0;

  const handleContinue = useCallback(() => {
    if (!selected.size) {
      return;
    }
    const selectedIds = Array.from(selected);

    if (externalOnConfirm) {
      externalOnConfirm(selectedIds);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      if ((nav as any).canGoBack?.()) {
        (nav as any).goBack();
      }
      return;
    }

    const chosen = categories
      .filter(category => selected.has(category.id))
      .map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        period: category.period,
        icon: category.icon,
      }));

    setCategories(chosen);
    completePhase1();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    (nav as any).reset({ index: 0, routes: [{ name: 'Home' }] });
  }, [categories, completePhase1, externalOnConfirm, nav, selected, setCategories]);

  const showSuggestion = useMemo(
    () => !suggestionHidden && !categories.some(category => category.id === AI_SUGGESTION.id),
    [categories, suggestionHidden],
  );

  const handleAddSuggestion = useCallback(() => {
    setCategoriesList(prev => {
      if (prev.some(category => category.id === AI_SUGGESTION.id)) {
        return prev;
      }
      return [...prev, AI_SUGGESTION];
    });
    setSelected(prev => {
      const next = new Set(prev);
      next.add(AI_SUGGESTION.id);
      return next;
    });
    setSuggestionHidden(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }, []);

  const dismissSuggestion = useCallback(() => {
    setSuggestionHidden(true);
  }, []);

  return (
    <LinearGradient colors={colors.bgGradient} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, fontFamily: fonts.heading }]}>Kateqoriyalarını seç</Text>
          <Text style={[styles.subtitle, { color: '#A0A0A0', fontFamily: fonts.body }]}>Profil: {PERSONA_LABELS[persona]} — gündəlik və aylıq xərcləri seçə və ya yenisini əlavə edə bilərsən.</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces
        >
          {showSuggestion && (
            <View style={[styles.aiBanner, { borderColor: withOpacity(colors.text, 0.08) }]}>
              <View style={styles.aiBannerRow}>
                <View style={styles.aiBadge}>
                  <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                  <Text style={[styles.aiBadgeText, { color: colors.primary, fontFamily: fonts.body }]}>AI təklifi</Text>
                </View>
                <TouchableOpacity onPress={dismissSuggestion} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <Ionicons name="close" size={18} color={withOpacity(colors.textMuted, 0.8)} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.aiBannerText, { color: colors.text, fontFamily: fonts.heading }]}>Bu profildə tez-tez əlavə olunur: <Text style={[styles.aiHighlight, { color: ICON_COLOR_MAP.food }]}>☕ “Kafe & çayxana”</Text></Text>
              <Text style={[styles.aiBannerSub, { color: colors.textMuted, fontFamily: fonts.body }]}>Bir toxunuşla siyahına əlavə et və izləməyə başla.</Text>
              <Pressable
                onPress={handleAddSuggestion}
                style={({ pressed }) => [
                  styles.aiActionPill,
                  {
                    backgroundColor: withOpacity(colors.primary, pressed ? 0.22 : 0.12),
                    borderColor: withOpacity(colors.primary, 0.28),
                  },
                ]}
              >
                <Text style={[styles.aiActionText, { color: colors.primary, fontFamily: fonts.body }]}>Əlavə et</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </Pressable>
            </View>
          )}

          {categories.map(category => (
            <CategoryCard
              key={category.id}
              category={category}
              active={selected.has(category.id)}
              onToggle={() => toggleCategory(category.id)}
              renderIcon={renderIcon}
              colors={colors}
              fonts={fonts}
            />
          ))}

          <TouchableOpacity activeOpacity={0.9} style={styles.addBox} onPress={openModal}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addInner}
            >
              <Ionicons name="add-circle" size={22} color="#fff" style={{ marginRight: 10 }} />
              <Text style={[styles.addText, { fontFamily: fonts.heading }]}>Yeni kateqoriya əlavə et</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.continueWrap}>
          <Pressable
            disabled={!canContinue}
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.continueBtn,
              {
                borderColor: withOpacity(colors.primary, 0.65),
                backgroundColor: pressed && canContinue ? withOpacity(colors.primary, 0.16) : 'transparent',
              },
              !canContinue ? styles.continueBtnDisabled : null,
            ]}
          >
            <Text style={[styles.continueText, { color: colors.primary, fontFamily: fonts.heading }]}>Davam et</Text>
          </Pressable>
        </View>

        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={[styles.modalTitle, { fontFamily: fonts.heading }]}>Yeni kateqoriya</Text>
              <View style={styles.segmented}>
                <TouchableOpacity
                  style={[styles.segment, catPeriod === 'daily' && styles.segmentActive]}
                  onPress={() => setCatPeriod('daily')}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      catPeriod === 'daily' && styles.segmentTextActive,
                      { fontFamily: fonts.body },
                    ]}
                  >
                    Gündəlik
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segment, catPeriod === 'monthly' && styles.segmentActive]}
                  onPress={() => setCatPeriod('monthly')}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      catPeriod === 'monthly' && styles.segmentTextActive,
                      { fontFamily: fonts.body },
                    ]}
                  >
                    Aylıq
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Kateqoriya adı"
                placeholderTextColor="#94A3B8"
                value={catName}
                onChangeText={setCatName}
                style={[styles.modalInput, { fontFamily: fonts.body }]}
              />
              <TextInput
                placeholder="İzah (opsional)"
                placeholderTextColor="#94A3B8"
                value={catDesc}
                onChangeText={setCatDesc}
                style={[styles.modalInput, { height: 72, fontFamily: fonts.body }]}
                multiline
              />
              <TextInput
                placeholder="Icon (Ionicons adı və ya emoji)"
                placeholderTextColor="#94A3B8"
                value={catIcon}
                onChangeText={setCatIcon}
                style={[styles.modalInput, { fontFamily: fonts.body }]}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                  <Text style={[styles.modalCancelText, { fontFamily: fonts.body }]}>Bağla</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirm} onPress={handleAddCategory}>
                  <Text style={[styles.modalConfirmText, { fontFamily: fonts.heading }]}>Əlavə et</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

type CategoryCardProps = {
  category: DisplayCategory;
  active: boolean;
  onToggle: () => void;
  renderIcon: (icon: string, size: number, color: string) => React.ReactNode;
  colors: AppTheme;
  fonts: { heading: string; body: string };
};

function CategoryCard({ category, active, onToggle, renderIcon, colors, fonts }: CategoryCardProps) {
  const tone = category.tone ?? 'default';
  const toneColor = ICON_COLOR_MAP[tone] || colors.primary;
  const scale = React.useRef(new Animated.Value(active ? ACTIVE_CARD_SCALE : INACTIVE_CARD_SCALE)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: active ? ACTIVE_CARD_SCALE : INACTIVE_CARD_SCALE,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
      mass: 0.9,
    }).start();
  }, [active, scale]);

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: INACTIVE_CARD_SCALE - 0.02, useNativeDriver: true, speed: 24, bounciness: 0 }),
      Animated.spring(scale, { toValue: ACTIVE_CARD_SCALE, useNativeDriver: true, damping: 16, stiffness: 220 }),
    ]).start();
    onToggle();
  }, [onToggle, scale]);

  const gradientColors = active
    ? [withOpacity(toneColor, 0.26), withOpacity(toneColor, 0.08)]
    : ['rgba(15,23,42,0.75)', 'rgba(30,41,59,0.45)'];

  const borderColor = active ? withOpacity(toneColor, 0.9) : 'rgba(255,255,255,0.06)';

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
      <Animated.View
        style={[
          styles.categoryOuter,
          {
            transform: [{ scale }],
            shadowColor: withOpacity(toneColor, 0.5),
          },
        ]}
      >
        <LinearGradient
          colors={gradientColors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.categoryCard, { borderColor, borderWidth: active ? 1.5 : 1 }]}
        >
          <View style={styles.cardContent}>
            <View style={[styles.categoryIcon, { backgroundColor: withOpacity(toneColor, active ? 0.18 : 0.12) }]}>
              {renderIcon(category.icon, 26, toneColor)}
            </View>
            <View style={styles.categoryBody}>
              <Text style={[styles.categoryTitle, { color: colors.text, fontFamily: fonts.heading }]}>{category.name}</Text>
              {!!category.description && (
                <Text style={[styles.categoryDesc, { color: colors.textMuted, fontFamily: fonts.body }]} numberOfLines={2}>
                  {category.description}
                </Text>
              )}
            </View>
            <View style={styles.categoryMeta}>
              <View
                style={[
                  styles.periodChip,
                  {
                    backgroundColor: withOpacity(toneColor, 0.12),
                    borderColor: withOpacity(toneColor, 0.32),
                  },
                ]}
              >
                <Text style={[styles.periodText, { color: withOpacity(toneColor, 0.9), fontFamily: fonts.body }]}>{PERIOD_LABEL[category.period]}</Text>
              </View>
              <View style={styles.checkWrap}>
                {active ? (
                  <Ionicons name="checkmark-circle" size={24} color={toneColor} />
                ) : (
                  <View style={[styles.checkPlaceholder, { borderColor: 'rgba(255,255,255,0.12)' }]} />
                )}
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 460,
  },
  header: { marginBottom: 24, gap: 8 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.2 },
  subtitle: { fontSize: 13, lineHeight: 20 },
  scrollContent: { paddingBottom: 180, gap: 18 },
  aiBanner: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#FFFFFF0D',
    borderWidth: 1,
    gap: 12,
  },
  aiBannerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  aiBadgeText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  aiBannerText: { fontSize: 14, lineHeight: 20 },
  aiHighlight: { fontWeight: '700' },
  aiBannerSub: { fontSize: 12, lineHeight: 18 },
  aiActionPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  aiActionText: { fontSize: 13, fontWeight: '700' },
  categoryOuter: {
    borderRadius: 24,
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  categoryCard: {
    borderRadius: 24,
    padding: 18,
    overflow: 'hidden',
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBody: { flex: 1, gap: 4 },
  categoryTitle: { fontSize: 16, fontWeight: '800' },
  categoryDesc: { fontSize: 12, lineHeight: 18 },
  categoryMeta: { alignItems: 'flex-end', gap: 10 },
  periodChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  periodText: { fontSize: 11, fontWeight: '700' },
  checkWrap: { height: 24, alignItems: 'center', justifyContent: 'center' },
  checkPlaceholder: { width: 24, height: 24, borderRadius: 12, borderWidth: 1 },
  addBox: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 6,
  },
  addInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  addText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  continueWrap: { position: 'absolute', left: 20, right: 20, bottom: 34 },
  continueBtn: {
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  continueBtnDisabled: { opacity: 0.45 },
  continueText: { fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(3,7,18,0.82)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(13,18,33,0.98)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    gap: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, color: '#fff' },
  segmented: {
    flexDirection: 'row',
    backgroundColor: 'rgba(148,163,184,0.16)',
    borderRadius: 16,
    padding: 4,
    gap: 4,
    marginBottom: 16,
  },
  segment: { flex: 1, borderRadius: 12, paddingVertical: 8, alignItems: 'center' },
  segmentActive: { backgroundColor: 'rgba(59,130,246,0.22)' },
  segmentText: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  segmentTextActive: { color: '#fff' },
  modalInput: {
    backgroundColor: 'rgba(15,23,42,0.55)',
    color: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 14, marginTop: 12 },
  modalCancel: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(148,163,184,0.12)' },
  modalCancelText: { fontSize: 13, fontWeight: '700', color: '#CBD5F5' },
  modalConfirm: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: '#2563EB' },
  modalConfirmText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
