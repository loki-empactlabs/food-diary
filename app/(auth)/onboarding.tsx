import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { useAuthStore } from '@/src/stores/authStore';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';

interface OnboardingSlide {
  emoji: string;
  title: string;
  description: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    emoji: '📸',
    title: '음식을 사진으로 기록',
    description: '맛있는 음식을 발견하면\n사진 한 장으로 간편하게 기록하세요.',
  },
  {
    emoji: '⭐',
    title: '별점과 코멘트',
    description: '1~5점 별점과 한줄평으로\n나만의 음식 평가를 남겨보세요.',
  },
  {
    emoji: '🗺️',
    title: '지도에서 한눈에',
    description: '내가 먹은 음식들을 지도에서 확인하고\n근처 맛집을 다시 찾아보세요.',
  },
  {
    emoji: '🔔',
    title: '재방문 알림',
    description: '자주 가는 식당 근처에 가면\n과거 기록을 알려드려요.',
  },
];

// Animated dot indicator
function AnimatedDot({ isActive, color, inactiveColor }: { isActive: boolean; color: string; inactiveColor: string }) {
  const width = useSharedValue(isActive ? 24 : 8);

  useEffect(() => {
    width.value = withSpring(isActive ? 24 : 8, { damping: 18, stiffness: 280 });
  }, [isActive]);

  const animStyle = useAnimatedStyle(() => ({
    width: width.value,
    backgroundColor: isActive ? color : inactiveColor,
  }));

  return <Animated.View style={[styles.dot, animStyle]} />;
}

export default function OnboardingScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
  const setOnboarded = useAuthStore((s) => s.setOnboarded);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleGetStarted = () => {
    setOnboarded(true);
    router.replace('/(auth)/sign-in');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingHorizontal: spacing.base }]}>
        <View style={{ width: 60 }} />
        <Text style={[typography.h4, { color: colors.primary }]}>Food Diary</Text>
        {!isLast ? (
          <AnimatedPressable onPress={handleSkip} hitSlop={8}>
            <Text style={[typography.body, { color: colors.textTertiary }]}>건너뛰기</Text>
          </AnimatedPressable>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* Slide Content */}
      <View style={styles.slideContent}>
        <Animated.View
          key={`slide-${currentIndex}`}
          entering={SlideInRight.duration(200)}
          exiting={SlideOutLeft.duration(200)}
        >
          <View style={styles.slideInner}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primaryLight, borderRadius: radius.full },
              ]}
            >
              <Text style={{ fontSize: 56 }}>{slide.emoji}</Text>
            </View>
            <Animated.View entering={FadeIn.delay(80).duration(200)}>
              <Text
                style={[typography.h2, { color: colors.text, textAlign: 'center', marginTop: spacing.xl }]}
              >
                {slide.title}
              </Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(150).duration(200)}>
              <Text
                style={[
                  typography.body,
                  {
                    color: colors.textSecondary,
                    textAlign: 'center',
                    marginTop: spacing.base,
                    lineHeight: 24,
                    paddingHorizontal: spacing['2xl'],
                  },
                ]}
              >
                {slide.description}
              </Text>
            </Animated.View>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Section */}
      <View style={[styles.bottom, { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }]}>
        {/* Animated Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <AnimatedDot
              key={i}
              isActive={i === currentIndex}
              color={colors.primary}
              inactiveColor={colors.borderLight}
            />
          ))}
        </View>

        {/* Button */}
        <AnimatedPressable
          onPress={handleNext}
          style={[
            styles.button,
            {
              backgroundColor: colors.primary,
              borderRadius: radius.lg,
              paddingVertical: spacing.base,
              marginTop: spacing.xl,
            },
          ]}
        >
          <Text style={[typography.button, { color: colors.textOnPrimary }]}>
            {isLast ? '시작하기' : '다음'}
          </Text>
          {!isLast && (
            <Ionicons
              name="arrow-forward"
              size={18}
              color={colors.textOnPrimary}
              style={{ marginLeft: 8 }}
            />
          )}
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  slideInner: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  bottom: {},
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
