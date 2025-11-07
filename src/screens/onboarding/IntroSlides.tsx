import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Swiper from 'react-native-swiper';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';

const { width } = Dimensions.get('window');

export default function IntroSlides() {
  const nav = useNavigation();
  const { colors, fonts } = useTheme();
  const [index, setIndex] = useState(0);

  const handleStart = () => {
    (nav as any).reset({ index: 0, routes: [{ name: 'PortfolioSelect' }] });
  };

  const SLIDE_IMAGES = [
    require('../../assets/images/slide1.png'),
    require('../../assets/images/slide2.png'),
    require('../../assets/images/slide3.png'),
    require('../../assets/images/slide4.png'),
  ];

  const BG = colors.introGradients;

  return (
    <View style={styles.container}>
      <LinearGradient colors={BG[index]} style={StyleSheet.absoluteFill} />

      <Swiper
        loop={false}
        showsButtons={false}
        autoplay={false}
        dot={<View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />}
        activeDot={<View style={[styles.dot, { backgroundColor: colors.accent, width: 16 }]} />}
        onIndexChanged={(i) => setIndex(i)}
      >
        <SlideOne colors={colors} fonts={fonts} image={SLIDE_IMAGES[0]} />
        <SlideTwo colors={colors} fonts={fonts} image={SLIDE_IMAGES[1]} />
        <SlideThree colors={colors} fonts={fonts} image={SLIDE_IMAGES[2]} />
        <SlideFour colors={colors} fonts={fonts} image={SLIDE_IMAGES[3]} onStart={handleStart} />
      </Swiper>
    </View>
  );
}

function SlideOne({ colors, image, fonts }: any) {
  return (
    <View style={styles.slideWrap}>
      <Image source={image} style={styles.image} resizeMode="contain" />
      <NeonTitle title="Maliyyətinizi aydın şəkildə izləyin." font={fonts.heading} />
      <Text style={[styles.desc, { color: colors.textMuted }]}>Neon tonlarda smart izləmə təcrübəsi</Text>
    </View>
  );
}

function SlideTwo({ colors, image, fonts }: any) {
  return (
    <View style={styles.slideWrap}>
      <Image source={image} style={styles.image} resizeMode="contain" />
      <NeonTitle title="Gəlir və xərclərinizi real vaxtda idarə edin." font={fonts.heading} />
      <Text style={[styles.desc, { color: colors.textMuted }]}>Anlıq dəyişiklikləri qrafikdə görün</Text>
    </View>
  );
}

function SlideThree({ colors, image, fonts }: any) {
  return (
    <View style={styles.slideWrap}>
      <Image source={image} style={styles.image} resizeMode="contain" />
      <NeonTitle title="Smart bildirişlərlə büdcənizi qoruyun." font={fonts.heading} />
      <Text style={[styles.desc, { color: colors.textMuted }]}>Xəbərdar ol, nəzarətdə qal</Text>
    </View>
  );
}

function SlideFour({ colors, image, fonts, onStart }: any) {
  return (
    <View style={styles.slideWrap}>
      <Image source={image} style={styles.image} resizeMode="contain" />
      <NeonTitle title="İndi başlayın — nəzarət sizdədir." font={fonts.heading} />
      <View style={{ height: 40 }} />
      <TouchableOpacity activeOpacity={0.9} onPress={onStart}>
        <View style={styles.startBtn}>
          <LinearGradient colors={colors.ctaGradient} style={StyleSheet.absoluteFill} />
          <Text style={styles.startText}>Başla</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function NeonTitle({ title, font }: { title: string; font?: string }) {
  return (
    <Text style={[styles.title, font ? { fontFamily: font } : null]}>
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slideWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: {
    color: '#E5E7EB',
    fontSize: 24,
    textAlign: 'center',
    fontWeight: '800',
    textShadowColor: 'rgba(59,130,246,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 18,
  },
  desc: { fontSize: 14, textAlign: 'center', marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, margin: 4 },
  image: { width: width * 0.8, height: width * 0.8, marginBottom: 12 },
  startBtn: { width: 200, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  startText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
