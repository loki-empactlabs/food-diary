import React, { useCallback, useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  useWindowDimensions,
  LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';

// ── Types ──
interface RatingBottomSheetProps {
  visible: boolean;
  initialRating?: number;
  onClose: () => void;
  onConfirm: (rating: number) => void;
}

// ── Constants ──
const MIN_RATING = 1;
const MAX_RATING = 5.0;
const STEP = 0.5;
const CONTENT_PADDING = 28;
const SHEET_HEIGHT = 520;

// Emoji faces for each integer level
const EMOJI_STAGES = ['😢', '😕', '😐', '😋', '🤩'] as const;

// Spring config for satisfying snap
const SNAP_SPRING = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
};

// Colors for the gradient fill
const RATING_COLORS = [
  '#FF4444', // 1 - red
  '#FF8844', // 2 - orange
  '#FFBB33', // 3 - yellow
  '#88CC44', // 4 - lime
  '#44DD66', // 5 - green
];

// ── Helpers ──
function snapToStep(value: number): number {
  'worklet';
  const snapped = Math.round(value / STEP) * STEP;
  return Math.max(MIN_RATING, Math.min(MAX_RATING, snapped));
}

function getEmojiIndex(rating: number): number {
  if (rating <= 1.5) return 0;
  if (rating <= 2.5) return 1;
  if (rating <= 3.5) return 2;
  if (rating <= 4.5) return 3;
  return 4;
}

function getRatingLabel(rating: number): string {
  if (rating <= 1.0) return '별로예요';
  if (rating <= 2.0) return '그저 그래요';
  if (rating <= 3.0) return '괜찮아요';
  if (rating <= 4.0) return '맛있어요';
  return '최고예요!';
}

function getRatingColor(rating: number): string {
  'worklet';
  const idx = Math.min(4, Math.max(0, Math.floor((rating - 0.5) / 1)));
  return RATING_COLORS[idx];
}

// ── Web Confetti (Reanimated-based particles) ──
const CONFETTI_COLORS = ['#FF4444', '#FF8844', '#FFBB33', '#88CC44', '#44DD66', '#FF69B4', '#7B68EE', '#00BFFF', '#FFD700'];
const CONFETTI_COUNT = 50;

function ConfettiParticle({ index, onDone }: { index: number; onDone?: () => void }) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(-30);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0);

  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const startX = (Math.random() - 0.5) * 700;
  const targetY = 200 + Math.random() * 400;
  const targetX = startX + (Math.random() - 0.5) * 300;
  const duration = 1400 + Math.random() * 1000;
  const delay = Math.random() * 400;
  const size = 8 + Math.random() * 8;
  const shape = Math.random();

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 8, stiffness: 200 }));
    translateY.value = withDelay(delay, withTiming(targetY, { duration }));
    translateX.value = withDelay(delay, withTiming(targetX, { duration }));
    rotate.value = withDelay(delay, withTiming(360 * (2 + Math.random() * 3), { duration }));
    opacity.value = withDelay(delay + duration * 0.5, withTiming(0, { duration: duration * 0.5 }));
    if (index === 0 && onDone) {
      setTimeout(onDone, 2500);
    }
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const w = shape < 0.33 ? size : shape < 0.66 ? size * 0.7 : size;
  const h = shape < 0.33 ? size : shape < 0.66 ? size * 1.8 : size;
  const br = shape < 0.33 ? size / 2 : shape < 0.66 ? 3 : size / 4;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: w,
          height: h,
          backgroundColor: color,
          borderRadius: br,
          top: -30,
          left: '50%',
          marginLeft: startX,
        },
        animStyle,
      ]}
    />
  );
}

function ConfettiEffect({ onDone }: { onDone: () => void }) {
  return (
    <View style={styles.confettiContainer} pointerEvents="none">
      {Array.from({ length: CONFETTI_COUNT }, (_, i) => (
        <ConfettiParticle key={i} index={i} onDone={i === 0 ? onDone : undefined} />
      ))}
    </View>
  );
}

// ── Rain Effect (1-star) ──
const RAIN_COLORS = ['#4A90D9', '#5BA3E8', '#6CB5F7', '#7DC8FF', '#3B7BBF'];
const RAIN_COUNT = 40;

function RainDrop({ index, onDone }: { index: number; onDone?: () => void }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);

  const color = RAIN_COLORS[index % RAIN_COLORS.length];
  const startX = (Math.random() - 0.5) * 500;
  const drift = (Math.random() - 0.5) * 40;
  const targetY = 300 + Math.random() * 300;
  const duration = 800 + Math.random() * 600;
  const delay = Math.random() * 800;
  const width = 2 + Math.random() * 2;
  const height = 12 + Math.random() * 16;

  useEffect(() => {
    opacity.value = withDelay(delay, withSequence(
      withTiming(0.8, { duration: 80 }),
      withTiming(0.8, { duration: duration * 0.6 }),
      withTiming(0, { duration: duration * 0.3 }),
    ));
    translateY.value = withDelay(delay, withTiming(targetY, { duration, easing: Easing.in(Easing.quad) }));
    translateX.value = withDelay(delay, withTiming(drift, { duration }));
    if (index === 0 && onDone) {
      setTimeout(onDone, 2200);
    }
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width,
          height,
          backgroundColor: color,
          borderRadius: width / 2,
          top: -30,
          left: '50%',
          marginLeft: startX,
        },
        animStyle,
      ]}
    />
  );
}

function RainEffect({ onDone }: { onDone: () => void }) {
  return (
    <View style={styles.confettiContainer} pointerEvents="none">
      {Array.from({ length: RAIN_COUNT }, (_, i) => (
        <RainDrop key={i} index={i} onDone={i === 0 ? onDone : undefined} />
      ))}
    </View>
  );
}

// ── Component ──
export function RatingBottomSheet({
  visible,
  initialRating = 0,
  onClose,
  onConfirm,
}: RatingBottomSheetProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const effectiveWidth = Platform.OS === 'web' ? Math.min(screenWidth, 390) : screenWidth;
  const fallbackTrackWidth = effectiveWidth - (CONTENT_PADDING * 2);

  // ── Animated values ──
  const trackWidthSV = useSharedValue(fallbackTrackWidth);
  const rating = useSharedValue(initialRating || 2.5);
  const displayRating = useSharedValue(initialRating || 2.5);
  const isDragging = useSharedValue(false);
  const thumbScale = useSharedValue(1);
  const emojiScale = useSharedValue(1);
  const sheetTranslateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.95);
  const handleOpacity = useSharedValue(0.5);
  const lastHapticInt = useSharedValue(Math.floor(initialRating || 2.5));
  const lastHapticHalf = useSharedValue(Math.round((initialRating || 2.5) / 0.5));

  // ── State ──
  const [currentRating, setCurrentRating] = React.useState(initialRating || 2.5);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [showRain, setShowRain] = React.useState(false);

  useEffect(() => {
    if (visible) {
      const r = initialRating || 2.5;
      rating.value = r;
      displayRating.value = r;
      setCurrentRating(r);
      setShowConfetti(false);
      setShowRain(false);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      sheetTranslateY.value = withSpring(0, { damping: 28, stiffness: 400, mass: 0.9 });
      contentScale.value = withSpring(1, { damping: 28, stiffness: 400, mass: 0.9 });
      handleOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      sheetTranslateY.value = withTiming(SHEET_HEIGHT, { duration: 250 });
      contentScale.value = 0.95;
      handleOpacity.value = 0.5;
    }
  }, [visible, initialRating]);

  // ── Haptic helpers ──
  const triggerHeavyHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, []);

  const triggerMediumHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const triggerLightHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, []);

  const triggerSuccessHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const updateCurrentRating = useCallback((r: number) => {
    setCurrentRating(r);
  }, []);

  const handleSliderLayout = useCallback((e: LayoutChangeEvent) => {
    trackWidthSV.value = e.nativeEvent.layout.width;
  }, []);

  const [confettiKey, setConfettiKey] = useState(0);

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
    setConfettiKey((k) => k + 1);
  }, []);

  const [rainKey, setRainKey] = useState(0);

  const triggerRain = useCallback(() => {
    setShowRain(true);
    setRainKey((k) => k + 1);
  }, []);

  // ── Gesture ──
  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      'worklet';
      isDragging.value = true;
      thumbScale.value = withSpring(1.3, SNAP_SPRING);
      const x = e.x;
      const pct = Math.max(0, Math.min(1, x / trackWidthSV.value));
      const rawRating = MIN_RATING + pct * (MAX_RATING - MIN_RATING);
      rating.value = rawRating;
      displayRating.value = rawRating;
      runOnJS(triggerMediumHaptic)();
    })
    .onUpdate((e) => {
      'worklet';
      const x = e.x;
      const pct = Math.max(0, Math.min(1, x / trackWidthSV.value));
      const rawRating = MIN_RATING + pct * (MAX_RATING - MIN_RATING);
      rating.value = rawRating;
      displayRating.value = rawRating;

      const currentHalf = Math.round(rawRating / 0.5);
      if (currentHalf !== lastHapticHalf.value) {
        lastHapticHalf.value = currentHalf;
        const currentInt = Math.floor(rawRating + 0.25);
        if (currentInt !== lastHapticInt.value) {
          lastHapticInt.value = currentInt;
          runOnJS(triggerMediumHaptic)();
          emojiScale.value = withSequence(
            withSpring(1.2, { damping: 8, stiffness: 300 }),
            withSpring(1, { damping: 14, stiffness: 280 })
          );
        } else {
          runOnJS(triggerLightHaptic)();
        }
      }

      runOnJS(updateCurrentRating)(snapToStep(rawRating));

      if (rawRating >= 4.75) {
        runOnJS(triggerConfetti)();
      } else if (rawRating <= 1.25) {
        runOnJS(triggerRain)();
      }
    })
    .onEnd(() => {
      'worklet';
      isDragging.value = false;
      thumbScale.value = withSpring(1, SNAP_SPRING);
      const snapped = snapToStep(rating.value);
      rating.value = withSpring(snapped, SNAP_SPRING);
      displayRating.value = withSpring(snapped, SNAP_SPRING);
      runOnJS(updateCurrentRating)(snapped);
      if (snapped >= 5.0) {
        runOnJS(triggerSuccessHaptic)();
      } else {
        runOnJS(triggerHeavyHaptic)();
      }
    });

  const tapGesture = Gesture.Tap()
    .onEnd((e) => {
      'worklet';
      const x = e.x;
      const pct = Math.max(0, Math.min(1, x / trackWidthSV.value));
      const rawRating = MIN_RATING + pct * (MAX_RATING - MIN_RATING);
      const snapped = snapToStep(rawRating);
      rating.value = withSpring(snapped, SNAP_SPRING);
      displayRating.value = withSpring(snapped, SNAP_SPRING);
      emojiScale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 14, stiffness: 280 })
      );
      thumbScale.value = withSpring(1, SNAP_SPRING);
      runOnJS(triggerMediumHaptic)();
      runOnJS(updateCurrentRating)(snapped);
      if (snapped >= 5.0) {
        runOnJS(triggerConfetti)();
        runOnJS(triggerSuccessHaptic)();
      } else if (snapped <= 1.0) {
        runOnJS(triggerRain)();
      }
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  // ── Animated Styles ──
  const thumbPosition = useAnimatedStyle(() => {
    const pct = (displayRating.value - MIN_RATING) / (MAX_RATING - MIN_RATING);
    return {
      transform: [
        { translateX: pct * trackWidthSV.value },
        { scale: thumbScale.value },
      ],
    };
  });

  const fillStyle = useAnimatedStyle(() => {
    const pct = (displayRating.value - MIN_RATING) / (MAX_RATING - MIN_RATING);
    return {
      width: `${pct * 100}%`,
      backgroundColor: getRatingColor(displayRating.value),
    };
  });

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
  }));

  const handleAnimStyle = useAnimatedStyle(() => ({
    opacity: handleOpacity.value,
  }));

  // ── Star number labels ──
  const starIndicators = useMemo(() => {
    const activeNum = Math.round(currentRating);
    return [1, 2, 3, 4, 5].map((star) => {
      const pct = ((star - MIN_RATING) / (MAX_RATING - MIN_RATING)) * 100;
      const isActive = star === activeNum;
      return (
        <Text
          key={star}
          style={[
            styles.starLabel,
            {
              left: `${pct}%`,
              color: isActive ? colors.text : colors.textTertiary,
              fontWeight: isActive ? '700' : '600',
            },
          ]}
        >
          {star}
        </Text>
      );
    });
  }, [colors.text, colors.textTertiary, currentRating]);

  const handleConfirm = useCallback(() => {
    triggerHeavyHaptic();
    onConfirm(currentRating);
  }, [currentRating, onConfirm, triggerHeavyHaptic]);

  const emojiIndex = getEmojiIndex(currentRating);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View style={[styles.backdrop, backdropAnimStyle]} />
        </Pressable>

        {/* Web container to constrain width */}
        <View style={Platform.OS === 'web' ? styles.webContainer : undefined}>

        {/* Confetti */}
        {showConfetti && (
          <ConfettiEffect key={confettiKey} onDone={() => setShowConfetti(false)} />
        )}

        {/* Rain */}
        {showRain && (
          <RainEffect key={rainKey} onDone={() => setShowRain(false)} />
        )}

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface },
            sheetStyle,
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <Animated.View style={[styles.handle, { backgroundColor: colors.textTertiary }, handleAnimStyle]} />
          </View>

          <Animated.View style={[styles.content, contentAnimStyle]}>

            {/* Emoji */}
            <Animated.View style={[styles.emojiCircle, { backgroundColor: '#F5F2ED' }, emojiStyle]}>
              <Text style={styles.emoji}>{EMOJI_STAGES[emojiIndex]}</Text>
            </Animated.View>

            {/* Rating number */}
            <Text style={[styles.ratingNumber, { color: getRatingColor(currentRating) }]}>
              {currentRating.toFixed(1)}
            </Text>

            {/* Rating label */}
            <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>
              {getRatingLabel(currentRating)}
            </Text>

            {/* Slider */}
            <GestureDetector gesture={composedGesture}>
              <View style={styles.sliderContainer} onLayout={handleSliderLayout}>
                <View style={styles.trackArea}>
                  <View style={[styles.track, { backgroundColor: colors.border }]}>
                    <Animated.View style={[styles.trackFill, fillStyle]} />
                  </View>
                  <Animated.View style={[styles.thumb, thumbPosition]}>
                    <View
                      style={[
                        styles.thumbInner,
                        {
                          backgroundColor: '#F5F2ED',
                          borderColor: getRatingColor(currentRating),
                        },
                      ]}
                    >
                      <Text style={styles.thumbEmoji}>{EMOJI_STAGES[emojiIndex]}</Text>
                    </View>
                  </Animated.View>
                  <View style={styles.starLabelsRow}>{starIndicators}</View>
                </View>
              </View>
            </GestureDetector>

            {/* Quick select */}
            <View style={styles.quickSelect}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = Math.round(currentRating) === star;
                const starColor = getRatingColor(star);
                return (
                  <AnimatedPressable
                    key={star}
                    onPress={() => {
                      rating.value = withSpring(star, SNAP_SPRING);
                      displayRating.value = withSpring(star, SNAP_SPRING);
                      setCurrentRating(star);
                      triggerMediumHaptic();
                      emojiScale.value = withSequence(
                        withSpring(1.4, { damping: 6, stiffness: 300 }),
                        withSpring(1, SNAP_SPRING)
                      );
                      if (star <= 1) {
                        triggerRain();
                      } else if (star >= 5) {
                        triggerConfetti();
                        triggerSuccessHaptic();
                      }
                    }}
                    scaleTarget={0.9}
                    style={[
                      styles.quickBtn,
                      {
                        backgroundColor: isActive
                          ? starColor + '20'
                          : colors.backgroundSecondary,
                        borderColor: isActive ? starColor : 'transparent',
                      },
                    ]}
                  >
                    <View style={[styles.quickBtnFace, { backgroundColor: '#F5F2ED' }]}>
                      <Text style={styles.quickBtnEmoji}>{EMOJI_STAGES[star - 1]}</Text>
                    </View>
                    <Text
                      style={[
                        styles.quickBtnText,
                        { color: isActive ? starColor : colors.textSecondary },
                      ]}
                    >
                      {star}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>

            {/* Confirm button */}
            <AnimatedPressable
              onPress={handleConfirm}
              style={[styles.confirmBtn, { backgroundColor: getRatingColor(currentRating) }]}
            >
              <Text style={styles.confirmText}>
                {currentRating.toFixed(1)}점으로 기록하기
              </Text>
            </AnimatedPressable>
          </Animated.View>
        </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ──
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  webContainer: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 390,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 28,
    paddingBottom: 28,
    gap: 6,
  },
  confettiContainer: {
    position: 'absolute',
    bottom: SHEET_HEIGHT - 40,
    left: 0,
    right: 0,
    height: 300,
    overflow: 'visible',
    zIndex: 999,
  },
  emojiCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 40,
  },
  ratingNumber: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -3,
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  sliderContainer: {
    width: '100%',
    overflow: 'visible',
  },
  trackArea: {
    position: 'relative',
    marginTop: 24,
    overflow: 'visible',
  },
  track: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  trackFill: {
    height: '100%',
    borderRadius: 5,
  },
  starLabelsRow: {
    position: 'relative',
    height: 20,
    marginTop: 8,
  },
  starLabel: {
    position: 'absolute',
    fontSize: 12,
    marginLeft: -5,
  },
  thumb: {
    position: 'absolute',
    top: -19, // centers 48px thumb on 10px track: -(48-10)/2
    marginLeft: -24,
    zIndex: 10,
  },
  thumbInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  thumbEmoji: {
    fontSize: 22,
  },
  quickSelect: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 12,
  },
  quickBtn: {
    width: 56,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 4,
  },
  quickBtnFace: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickBtnEmoji: {
    fontSize: 20,
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  confirmBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
