import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import { useUser, Persona } from '../../context/UserContext';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PERSONAS: Array<{ key: Persona; label: string; description: string; image: any }> = [
  {
    key: 'student',
    label: 'Tələbə',
    description: 'Dərs xərcləri, kampus həyatı və gündəlik büdcə',
    image: require('../../assets/images/student.png'),
  },
  {
    key: 'worker',
    label: 'İşçi',
    description: 'Maaş planlaması, yol və gündəlik xərclər üçün',
    image: require('../../assets/images/worker.png'),
  },
  {
    key: 'family',
    label: 'Ailə başçısı',
    description: 'Evin büdcəsi, uşaqlar və aylıq öhdəliklər',
    image: require('../../assets/images/family.png'),
  },
];

export default function PortfolioSelect() {
  const { colors, fonts } = useTheme();
  const { state, setPersona } = useUser();
  const nav = useNavigation();
  const initialPersona = useMemo(() => state.profile.persona ?? null, [state.profile.persona]);
  const [choice, setChoice] = useState<Persona | null>(initialPersona);

  const handleSelect = (p: Persona) => {
    setChoice(p);
    setPersona(p);
    setTimeout(() => {
      (nav as any).navigate('CategorySelect');
    }, 320);
  };

  return (
    <LinearGradient colors={colors.bgGradient} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, fontFamily: fonts.heading }]}>Profil növünü seç</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>Sənə uyğun ssenarini seç, kateqoriyalar avtomatik uyğunlaşsın.</Text>
        </View>

        <View style={styles.cardList}>
          {PERSONAS.map((persona) => (
            <PersonaCard
              key={persona.key}
              persona={persona}
              active={choice === persona.key}
              onPress={() => handleSelect(persona.key)}
            />
          ))}
        </View>

        <Text style={[styles.helper, { color: colors.textMuted }]}>Seçiminizdən sonra kateqoriya addımı avtomatik açılacaq.</Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

type PersonaCardProps = {
  persona: { key: Persona; label: string; description: string; image: any };
  active: boolean;
  onPress: () => void;
};

function PersonaCard({ persona, active, onPress }: PersonaCardProps) {
  const { colors } = useTheme();
  const scale = React.useRef(new Animated.Value(active ? 1.05 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: active ? 1.05 : 1,
      useNativeDriver: true,
      damping: 12,
      stiffness: 120,
      mass: 1,
    }).start();
  }, [active, scale]);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 18, bounciness: 6 }),
      Animated.spring(scale, { toValue: 1.05, useNativeDriver: true, speed: 18, bounciness: 6 }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
      <Animated.View style={[styles.cardWrapper, { transform: [{ scale }] }]}> 
        <LinearGradient
          colors={active ? colors.ctaGradient : ['rgba(15,23,42,0.85)', 'rgba(30,41,59,0.65)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, active ? styles.cardActive : null]}
        >
          <View style={styles.imageBadge}>
            <Image source={persona.image} style={{ width: 56, height: 56 }} resizeMode="contain" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{persona.label}</Text>
            <Text style={styles.cardDesc}>{persona.description}</Text>
          </View>
          <View style={[styles.statusChip, active ? styles.statusChipActive : null]}>
            <Text style={[styles.statusText, active ? styles.statusTextActive : null]}>{active ? 'Seçildi' : 'Seç'}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  cardList: { gap: 18 },
  cardWrapper: {
    borderRadius: 22,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  card: {
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  cardActive: {
    borderColor: 'rgba(255,255,255,0.45)',
    shadowColor: 'rgba(96,165,250,0.55)',
  },
  imageBadge: {
    width: 70,
    height: 70,
    borderRadius: 20,
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: '#F8FAFC', fontWeight: '800', fontSize: 18, marginBottom: 4 },
  cardDesc: { color: 'rgba(241,245,249,0.75)', fontSize: 12, lineHeight: 16 },
  statusChip: {
    marginLeft: 16,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(15,23,42,0.4)',
  },
  statusChipActive: {
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statusText: { color: '#E2E8F0', fontWeight: '700', fontSize: 12 },
  statusTextActive: { color: '#0F172A' },
  helper: { fontSize: 12, textAlign: 'center', marginTop: 32 },
});

