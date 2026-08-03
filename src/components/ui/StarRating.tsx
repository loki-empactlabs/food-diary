import { useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/src/theme';

interface StarRatingProps {
  rating: number;
  size?: number;
  readonly?: boolean;
  onChange?: (rating: number) => void;
}

function AnimatedStar({
  index,
  filled,
  size,
  starColor,
  emptyColor,
  animate,
}: {
  index: number;
  filled: boolean;
  size: number;
  starColor: string;
  emptyColor: string;
  animate: boolean;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (animate && filled) {
      scale.value = withDelay(
        index * 40,
        withSequence(
          withSpring(1.2, { damping: 8, stiffness: 300 }),
          withSpring(1, { damping: 14, stiffness: 280 })
        )
      );
    }
  }, [filled, animate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons
        name={filled ? 'star' : 'star-outline'}
        size={size}
        color={filled ? starColor : emptyColor}
      />
    </Animated.View>
  );
}

export function StarRating({ rating, size = 20, readonly = false, onChange }: StarRatingProps) {
  const { colors } = useTheme();
  const starColor = '#FFB800';
  const emptyColor = colors.borderLight;
  const prevRating = useRef(rating);
  const hasMounted = useRef(false);

  // Track whether rating changed (for cascade animation)
  const shouldAnimate = prevRating.current !== rating || !hasMounted.current;
  prevRating.current = rating;
  hasMounted.current = true;

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => !readonly && onChange?.(star)}
          disabled={readonly}
          style={styles.star}
        >
          <AnimatedStar
            index={star - 1}
            filled={star <= rating}
            size={size}
            starColor={starColor}
            emptyColor={emptyColor}
            animate={shouldAnimate}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 2,
  },
});
