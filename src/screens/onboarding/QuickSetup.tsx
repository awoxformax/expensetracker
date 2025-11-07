import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import { useUser, Persona, IncomeType, Category } from '../../context/UserContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const PersonaLabels: Record<Persona, string> = {
  student: 'Tələbə',
  worker: 'İşçi',
  family: 'Ailə başçısı',
};

const IncomeLabels: Record<IncomeType, string> = {
  salary: 'Maaş',
  scholarship: 'Təqaüd',
  freelancer: 'Frilanser',
  additional: 'Əlavə gəlir',
};

export default function QuickSetup() {
  const { colors, fonts } = useTheme();
  const nav = useNavigation();
  const route = useRoute<any>();
  const { state, setPersona, setIncomeType, setCategories, completePhase1 } = useUser();

  const startAt = (route.params && route.params.startAt) ? route.params.startAt as 1|2|3 : 1;
  const [step, setStep] = useState<1 | 2 | 3>(startAt);
  const [persona, setPersonaLocal] = useState<Persona | undefined>(state.profile.persona);
  const [income, setIncomeLocal] = useState<IncomeType | undefined>(state.profile.incomeType);
  const defaultCats = useMemo(() => baseCategoriesFor(persona), [persona]);
  const [cats, setCats] = useState<Category[]>(() => defaultCats);

  useEffect(() => {
    setCats(baseCategoriesFor(persona));
  }, [persona]);

  const canNext = () => {
    if (step === 1) return !!persona;
    if (step === 2) return !!income;
    if (step === 3) return cats.length > 0 && cats.every(c => c.name.trim().length > 0);
    return false;
  };

  const onNext = () => {
    if (step === 1) return setStep(2);
    if (step === 2) return setStep(3);
    if (persona) setPersona(persona);
    if (income) setIncomeType(income);
    setCategories(cats);
    completePhase1();
    (nav as any).reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <LinearGradient colors={colors.bgGradient} style={styles.gradient}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.container}>
            <StepHeader step={step} colors={colors} />

            {step === 1 && (
              <StepPersona persona={persona} onSelect={setPersonaLocal} colors={colors} fonts={fonts} />
            )}
            {step === 2 && (
              <StepIncome income={income} onSelect={setIncomeLocal} colors={colors} fonts={fonts} />
            )}
            {step === 3 && (
              <StepCategories cats={cats} setCats={setCats} colors={colors} fonts={fonts} persona={persona} />
            )}

            <View style={styles.navRow}>
              {step > 1 ? (
                <TouchableOpacity style={[styles.ghostBtn]} onPress={() => setStep((s) => (s - 1) as any)}>
                  <Text style={styles.ghostText}>Geri</Text>
                </TouchableOpacity>
              ) : <View style={{ width: 110 }} />}

              <TouchableOpacity disabled={!canNext()} onPress={onNext} style={{ width: 180 }}>
                <LinearGradient colors={canNext() ? colors.ctaGradient : ['#4b5563', '#4b5563']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.ctaBtn}>
                  <Text style={styles.ctaText}>{step === 3 ? 'Yadda saxla' : 'Davam et'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function StepHeader({ step, colors }: any) {
  return (
    <View style={styles.stepHeader}>
      {[1,2,3].map((i) => (
        <View key={i} style={[styles.stepDot, i <= step ? { backgroundColor: colors.accent, width: i === step ? 28 : 18 } : null]} />
      ))}
    </View>
  );
}

function StepPersona({ persona, onSelect, colors, fonts }: any) {
  return (
    <View>
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.heading }]}>Necə istifadə edəcəksən?</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>Sadəcə özünü tanıdan 2 klik</Text>
      <View style={styles.cardRow}>
        <PersonaCard label={PersonaLabels.student} image={require('../../assets/images/student.png')} selected={persona === 'student'} onPress={() => onSelect('student')} />
        <PersonaCard label={PersonaLabels.worker} image={require('../../assets/images/worker.png')} selected={persona === 'worker'} onPress={() => onSelect('worker')} />
        <PersonaCard label={PersonaLabels.family} image={require('../../assets/images/family.png')} selected={persona === 'family'} onPress={() => onSelect('family')} />
      </View>
    </View>
  );
}

function StepIncome({ income, onSelect, colors, fonts }: any) {
  const items: IncomeType[] = ['salary', 'scholarship', 'freelancer', 'additional'];
  const icons: Record<IncomeType, keyof typeof Feather.glyphMap> = {
    salary: 'briefcase',
    scholarship: 'book',
    freelancer: 'code',
    additional: 'dollar-sign',
  } as const;
  return (
    <View>
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.heading }]}>Gəlir növü seç</Text>
      <View style={styles.chipsWrap}>
        {items.map((i) => (
          <TouchableOpacity key={i} onPress={() => onSelect(i)} activeOpacity={0.9}>
            <LinearGradient colors={income === i ? colors.ctaGradient : ['#1F2937', '#1F2937']} start={{x:0,y:0}} end={{x:1,y:1}} style={[styles.chip, income === i ? styles.chipActive : null]}>
              <Feather name={icons[i]} size={16} color={income === i ? '#fff' : '#CBD5E1'} style={{ marginRight: 8 }} />
              <Text style={[styles.chipText, income === i ? styles.chipTextActive : null]}>{IncomeLabels[i]}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function StepCategories({ cats, setCats, colors, fonts, persona }: any) {
  const remove = (id: string) => setCats((prev: Category[]) => prev.filter(c => c.id !== id));
  const update = (id: string, patch: Partial<Omit<Category, 'id'>>) => setCats((prev: Category[]) => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));
  const add = () => setCats((prev: Category[]) => ([...prev, { id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, name: '', description: '' }]));

  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.heading }]}>Xərclərin kateqoriyaları</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>İstədiyin kimi əlavə et və ya azald</Text>
      <ScrollView style={{ maxHeight: 420 }}>
        {cats.map((c: Category) => (
          <View key={c.id} style={styles.catCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="tag" color="#93C5FD" size={16} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Kateqoriya adı (məs: Market)"
                placeholderTextColor="#9CA3AF"
                value={c.name}
                onChangeText={(t) => update(c.id, { name: t })}
                style={[styles.input, { flex: 1 }]}
              />
              <TouchableOpacity onPress={() => remove(c.id)} style={styles.iconBtn}>
                <Feather name="trash-2" size={18} color="#FCA5A5" />
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="İzah (opsional)"
              placeholderTextColor="#9CA3AF"
              value={c.description || ''}
              onChangeText={(t) => update(c.id, { description: t })}
              style={[styles.input, { marginTop: 10 }]}
            />
          </View>
        ))}
        <TouchableOpacity onPress={add} activeOpacity={0.9}>
          <LinearGradient colors={colors.ctaGradient} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.addBtn}>
            <Feather name="plus" color="#fff" size={18} style={{ marginRight: 8 }} />
            <Text style={styles.addText}>Kateqoriya əlavə et</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function PersonaCard({ label, image, selected, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.personaCard, selected ? styles.personaCardActive : null]}>
      <View style={styles.personaImgWrap}>
        <Image source={image} style={{ width: 56, height: 56 }} resizeMode="contain" />
        {selected ? (
          <View style={styles.checkBadge}>
            <Feather name="check" size={14} color="#fff" />
          </View>
        ) : null}
      </View>
      <Text style={[styles.personaText, selected ? styles.personaTextActive : null]}>{label}</Text>
    </TouchableOpacity>
  );
}

function baseCategoriesFor(persona?: Persona): Category[] {
  const base: string[] = ['Nəqliyyat', 'Market alış-verişi', 'Aptek', 'Kredit ödənişləri'];
  if (persona === 'student') base.push('Təhsil ödənişləri');
  if (persona === 'family') base.push('Benzin');
  return base.map((name, idx) => ({ id: `def_${idx}_${name}`.replace(/\s+/g, '_'), name }));
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gradient: { flex: 1 },
  container: { flex: 1, padding: 20, paddingTop: 12 },
  stepHeader: { flexDirection: 'row', justifyContent: 'center', marginBottom: 18 },
  stepDot: { height: 8, width: 8, borderRadius: 999, backgroundColor: '#334155', marginHorizontal: 6 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 13, marginBottom: 18 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  personaCard: { width: '31%', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  personaCardActive: { borderColor: 'rgba(255,255,255,0.22)', backgroundColor: 'rgba(255,255,255,0.06)' },
  personaImgWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', marginBottom: 10, position: 'relative' },
  checkBadge: { position: 'absolute', right: -2, top: -2, backgroundColor: '#10B981', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0b1220' },
  personaText: { color: '#D1D5DB', fontWeight: '700', textAlign: 'center' },
  personaTextActive: { color: '#FFFFFF' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 999, marginRight: 8, marginBottom: 10 },
  chipActive: { },
  chipText: { color: '#E5E7EB', fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  catCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  input: { backgroundColor: 'rgba(255,255,255,0.04)', color: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  iconBtn: { marginLeft: 8, backgroundColor: 'rgba(252,165,165,0.12)', padding: 8, borderRadius: 10 },
  addBtn: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, marginTop: 6, marginBottom: 80 },
  addText: { color: '#fff', fontWeight: '800' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  ghostBtn: { width: 110, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.03)' },
  ghostText: { color: '#E5E7EB', fontWeight: '800' },
  ctaBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800' },
});
