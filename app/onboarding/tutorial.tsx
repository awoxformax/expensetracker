import React, { useRef, useState } from 'react';
import { Image, Text, View, StyleSheet, Dimensions, Pressable, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { PRE_HOME_BACKGROUND } from '../../src/constants/ui';

const { width } = Dimensions.get('window');

type Slide = {
  title: string;
  description: string;
  image: any;
};

const slides: Slide[] = [
  {
    title: 'Xərclərini izləməyə başla 💰',
    description: 'Gündəlik xərclərini bir ekranda gör, nəyi hara xərclədiyini anında analiz et.',
    image: require('../../src/assets/images/slide1.png'),
  },
  {
    title: 'Balansını və gəlirlərini idarə et 💳',
    description: 'Balans, gəlir və borclarını bir paneldən idarə et, nəzarət həmişə səndə olsun.',
    image: require('../../src/assets/images/slide2.png'),
  },
  {
    title: 'Ağıllı qənaət planı qur ✨',
    description: 'Hədəflər təyin et, süni zəka təklifləri ilə qənaət planını inkişaf etdir.',
    image: require('../../src/assets/images/slide3.png'),
  },
];

export default function TutorialScreen() {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const { colors, fonts } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  const handleContinue = () => {
    if (index < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
      return;
    }
    router.replace('/onboarding/welcome');
  };

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    const nextIndex = Math.round(offset / width);
    setIndex(nextIndex);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrapper}>
        <View style={styles.carousel}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumEnd}
            scrollEventThrottle={16}
          >
            {slides.map(slide => (
              <View key={slide.title} style={[styles.slide, { width }]}>
                <Image source={slide.image} resizeMode="contain" style={styles.slideImage} />
                <Text style={[styles.slideTitle, { color: '#F8FAFF', fontFamily: fonts.heading }]}>{slide.title}</Text>
                <Text style={[styles.slideDescription, { color: '#A5B4FC', fontFamily: fonts.body }]}>{slide.description}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.pagination}>
            {slides.map((_, idx) => (
              <View key={idx} style={[styles.dot, idx === index && styles.dotActive]} />
            ))}
          </View>
        </View>
        <View style={styles.footer}>
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.cta,
              {
                opacity: pressed ? 0.85 : 1,
                backgroundColor: '#4F8BFF',
              },
            ]}
          >
            <Text style={[styles.ctaText, { fontFamily: fonts.heading }]}>
              {index === slides.length - 1 ? 'Başlayaq' : 'Davam et'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PRE_HOME_BACKGROUND,
  },
  wrapper: {
    flex: 1,
  },
  carousel: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 24,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  slideImage: {
    width: width * 0.75,
    height: width * 0.75,
    marginBottom: 32,
  },
  slideTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  slideDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: width * 0.82,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  cta: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: {
    color: '#0B0D13',
    fontSize: 16,
    fontWeight: '700',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E293B',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#4F8BFF',
    width: 18,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
});
