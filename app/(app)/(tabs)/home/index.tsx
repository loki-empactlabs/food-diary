import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { FoodCard } from '@/src/components/food/FoodCard';
import { usePostStore } from '@/src/stores/postStore';
import { useAuthStore } from '@/src/stores/authStore';
import { useRouter } from 'expo-router';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';
import type { FoodPost } from '@/src/types/post';

function getDateString(): { label: string; detail: string } {
  const now = new Date();
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const day = days[now.getDay()];
  return { label: '오늘', detail: `${month}월 ${date}일 ${day}` };
}

export default function HomeScreen() {
  const { colors, typography, spacing } = useTheme();
  const posts = usePostStore((s) => s.posts);
  const isLoaded = usePostStore((s) => s.isLoaded);
  const loadPosts = usePostStore((s) => s.loadPosts);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoaded) loadPosts();
  }, [isLoaded]);

  // Refresh indicator animation
  const spinRotation = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);
  const indicatorHeight = useSharedValue(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    spinRotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
    indicatorOpacity.value = withSpring(1, { damping: 15, stiffness: 200 });
    indicatorHeight.value = withSpring(56, { damping: 15, stiffness: 200 });

    loadPosts().finally(() => {
      setRefreshing(false);
      spinRotation.value = 0;
      indicatorOpacity.value = withTiming(0, { duration: 200 });
      indicatorHeight.value = withTiming(0, { duration: 200 });
    });
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinRotation.value}deg` }],
  }));

  const indicatorContainerStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
    height: indicatorHeight.value,
    overflow: 'hidden' as const,
  }));

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return [...posts];
    const q = searchQuery.trim().replace(/^#/, '').toLowerCase();
    return posts.filter(
      (p) =>
        p.tags?.some((t) => t.toLowerCase().includes(q)) ||
        p.menu_name?.toLowerCase().includes(q) ||
        p.comment?.toLowerCase().includes(q)
    );
  }, [posts, searchQuery]);

  const dateInfo = useMemo(() => getDateString(), []);

  const displayName = user?.user_metadata?.display_name ?? '맛집헌터';

  const renderItem = ({ item, index }: { item: FoodPost; index: number }) => (
    <View style={styles.cardWrapper}>
      <FoodCard post={item} index={index} />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={{ fontSize: 48, marginBottom: spacing.base }}>📷</Text>
      <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.xs }]}>
        아직 기록이 없어요
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
        하단의 + 버튼을 눌러{'\n'}첫 번째 음식을 기록해보세요!
      </Text>
    </View>
  );

  const ListHeader = () => (
    <View style={styles.headerSection}>
      {/* Pull-to-refresh indicator */}
      <Animated.View style={[styles.refreshIndicator, indicatorContainerStyle]}>
        <Animated.Text style={[styles.refreshIcon, spinStyle]}>🍽️</Animated.Text>
        <Text style={[styles.refreshText, { color: '#FF6B6B' }]}>새로고침 중...</Text>
      </Animated.View>

      {/* Header: Avatar + Info + Menu Button */}
      <Animated.View style={styles.headerRow} entering={FadeInDown.duration(200)}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
            {user?.user_metadata?.avatar_url ? (
              <Image
                source={{ uri: user.user_metadata.avatar_url }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Ionicons name="person" size={22} color={colors.textSecondary} />
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerLocation}>
              <Text style={{ fontSize: 13 }}>📍 </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>서울</Text>
            </Text>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {displayName}의 기록
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <AnimatedPressable
            onPress={() => router.push('/(app)/calendar' as any)}
            style={[styles.menuBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.text} />
          </AnimatedPressable>
          <AnimatedPressable
            onPress={() => router.push('/(app)/notifications' as any)}
            style={[styles.menuBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
          </AnimatedPressable>
        </View>
      </Animated.View>

      {/* Search bar */}
      <Animated.View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.borderLight }]} entering={FadeInDown.delay(40).duration(200)}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="태그 또는 메뉴명 검색"
          placeholderTextColor={colors.textTertiary}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <AnimatedPressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </AnimatedPressable>
        )}
      </Animated.View>

      {/* Date header — tap to refresh */}
      <AnimatedPressable onPress={onRefresh} style={styles.dateRow}>
        <Text style={[styles.dateLabel, { color: colors.text }]}>
          {searchQuery.trim() ? `"${searchQuery.trim()}" 검색 결과` : dateInfo.label}
        </Text>
        {!searchQuery.trim() && (
          <Text style={[styles.dateDetail, { color: colors.textTertiary }]}>{dateInfo.detail}</Text>
        )}
      </AnimatedPressable>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={filteredPosts.length === 0 ? { flex: 1 } : { paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 54, // status bar space
  },
  headerSection: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 44,
    height: 44,
  },
  headerInfo: {
    gap: 2,
  },
  headerLocation: {
    fontSize: 13,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  dateDetail: {
    fontSize: 13,
  },
  cardWrapper: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  headerRight: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  refreshIcon: {
    fontSize: 20,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
