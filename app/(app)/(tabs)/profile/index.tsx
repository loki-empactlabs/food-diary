import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { ZoomIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { useAuthStore } from '@/src/stores/authStore';
import { usePostStore } from '@/src/stores/postStore';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';
import { AnimatedText } from '@/src/components/ui/AnimatedText';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const posts = usePostStore((s) => s.posts);
  const isLoaded = usePostStore((s) => s.isLoaded);
  const loadPosts = usePostStore((s) => s.loadPosts);

  useEffect(() => {
    if (!isLoaded) loadPosts();
  }, [isLoaded]);

  const myPosts = posts.filter((p) => p.user_id === (user?.id ?? 'dev-user'));
  const totalPosts = myPosts.length;
  const avgRating = totalPosts > 0
    ? parseFloat((myPosts.reduce((sum, p) => sum + p.rating, 0) / totalPosts).toFixed(1))
    : 0;

  const displayName = user?.user_metadata?.display_name ?? '맛집헌터';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Status bar spacer */}
      <View style={styles.statusBarSpacer} />

      {/* Settings button (top right) */}
      <AnimatedPressable
        onPress={() => router.push('/(app)/settings' as any)}
        hitSlop={8}
        style={[styles.settingsBtn, { backgroundColor: colors.surface }]}
      >
        <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
      </AnimatedPressable>

      {/* Profile header - centered */}
      <View style={styles.profileSection}>
        <Animated.View
          entering={ZoomIn.duration(200)}
          style={[styles.avatar, { backgroundColor: colors.surface }]}
        >
          {user?.user_metadata?.avatar_url ? (
            <Image
              source={{ uri: user.user_metadata.avatar_url }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <Ionicons name="person" size={40} color={colors.textSecondary} />
          )}
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(50).duration(200)}>
          <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
        </Animated.View>
      </View>

      {/* Stats row - centered */}
      <Animated.View entering={FadeInDown.delay(100).duration(200)} style={styles.statsRow}>
        <View style={styles.statItem}>
          <AnimatedText
            targetValue={totalPosts}
            style={[styles.statNumber, { color: colors.text }]}
          />
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>기록</Text>
        </View>
        <View style={styles.statItem}>
          <AnimatedText
            targetValue={avgRating}
            decimals={1}
            style={[styles.statNumber, { color: colors.text }]}
          />
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>평균별점</Text>
        </View>
      </Animated.View>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <AnimatedPressable
          onPress={() => router.push('/(app)/statistics' as any)}
          style={[styles.statsButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="bar-chart-outline" size={18} color="#FF6B6B" />
          <Text style={[styles.statsButtonText, { color: colors.text }]}>통계 보기</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => router.push('/(app)/collections' as any)}
          style={[styles.statsButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="albums-outline" size={18} color="#FF6B6B" />
          <Text style={[styles.statsButtonText, { color: colors.text }]}>컬렉션</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => router.push('/(app)/taste-profile' as any)}
          style={[styles.statsButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="restaurant-outline" size={18} color="#FF6B6B" />
          <Text style={[styles.statsButtonText, { color: colors.text }]}>맛 프로필</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => router.push('/(app)/revisit' as any)}
          style={[styles.statsButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="time-outline" size={18} color="#FF6B6B" />
          <Text style={[styles.statsButtonText, { color: colors.text }]}>재방문 알림</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => router.push('/(app)/nearby' as any)}
          style={[styles.statsButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="navigate-outline" size={18} color="#FF6B6B" />
          <Text style={[styles.statsButtonText, { color: colors.text }]}>근처 맛집 추천</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarSpacer: {
    height: 54,
  },
  settingsBtn: {
    position: 'absolute',
    top: 61,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 24,
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 60,
    marginTop: 24,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
  },
  actionButtons: {
    marginTop: 32,
    marginHorizontal: 24,
    gap: 10,
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  statsButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
});
