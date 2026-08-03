import { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';
import { STAGGER_DELAY } from '@/src/utils/animations';
import type { FoodPost } from '@/src/types/post';

interface FoodCardProps {
  post: FoodPost;
  index?: number;
}

export function FoodCard({ post, index = 0 }: FoodCardProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    router.push(`/(app)/post/${post.id}` as any);
  };

  const imageUrl = post.thumbnail_urls?.[0] || post.image_urls?.[0];

  const enterDelay = index < 6 ? index * STAGGER_DELAY : 0;
  const translateY = useSharedValue(60);
  const opacity = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      translateY.value = 60;
      opacity.value = 0;
      const spring = { damping: 28, stiffness: 400, mass: 0.9 };
      translateY.value = withDelay(enterDelay, withSpring(0, spring));
      opacity.value = withDelay(enterDelay, withSpring(1, spring));
    }, [])
  );

  const enterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={enterStyle}>
      <AnimatedPressable onPress={handlePress}>
        <View style={styles.card}>
          {/* Full photo */}
          <Image
            source={{ uri: imageUrl }}
            style={styles.photo}
            contentFit="cover"
            placeholder={{ blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH' }}
            transition={200}
          />

          {/* Glassmorphism overlay card */}
          <View style={[styles.floatCard, { borderColor: colors.cardGlassBorder, backdropFilter: 'blur(7.5px)', WebkitBackdropFilter: 'blur(7.5px)' } as any]}>
            {/* Left: rating + memo */}
            <View style={styles.floatTextArea}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={colors.starFilled} />
                <Text style={styles.ratingText}>{post.rating.toFixed(1)}</Text>
              </View>
              {post.comment ? (
                <Text style={styles.memoText} numberOfLines={1}>
                  {post.comment}
                </Text>
              ) : (
                <Text style={styles.memoText} numberOfLines={1}>
                  {post.menu_name || '음식 기록'}
                </Text>
              )}
            </View>

            {/* Right: arrow button */}
            <View style={styles.arrowBtn}>
              <Ionicons name="arrow-forward" size={18} color="#0D0D0D" />
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    aspectRatio: 4 / 3,
    borderRadius: 36,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  floatCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A99',
    borderRadius: 34,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  floatTextArea: {
    flex: 1,
    marginRight: 12,
    gap: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  memoText: {
    color: '#FFFFFFAA',
    fontSize: 13,
  },
  arrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
