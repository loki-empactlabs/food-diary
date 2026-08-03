import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme';
import { usePostStore } from '@/src/stores/postStore';
import { useAuthStore } from '@/src/stores/authStore';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';
import Animated, { FadeInDown } from 'react-native-reanimated';

const RATING_COLORS = ['#FF4444', '#FF8844', '#FFBB33', '#88CC44', '#44DD66'];

type PeriodKey = 'all' | 'month' | 'week';
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'month', label: '이번 달' },
  { key: 'week', label: '이번 주' },
];

function isWithinPeriod(dateStr: string, period: PeriodKey): boolean {
  if (period === 'all') return true;
  const now = new Date();
  const d = new Date(dateStr);
  if (period === 'month') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  // week: last 7 days
  const diff = now.getTime() - d.getTime();
  return diff <= 7 * 24 * 60 * 60 * 1000 && diff >= 0;
}

export default function StatisticsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const posts = usePostStore((s) => s.posts);
  const [period, setPeriod] = useState<PeriodKey>('all');

  const myPosts = useMemo(() =>
    posts.filter((p) => p.user_id === (user?.id ?? 'dev-user') && isWithinPeriod(p.created_at, period)),
    [posts, user, period]
  );
  const totalPosts = myPosts.length;
  const avgRating =
    totalPosts > 0
      ? (myPosts.reduce((sum, p) => sum + p.rating, 0) / totalPosts).toFixed(1)
      : '0.0';
  const fiveStarCount = myPosts.filter((p) => p.rating === 5).length;

  // Rating distribution
  const ratingDist = [0, 0, 0, 0, 0];
  myPosts.forEach((p) => {
    const idx = Math.min(Math.max(Math.round(p.rating) - 1, 0), 4);
    ratingDist[idx]++;
  });
  const maxDist = Math.max(...ratingDist, 1);

  // Top restaurants
  const restaurantVisits: Record<string, { count: number; totalRating: number; name: string }> = {};
  myPosts.forEach((p) => {
    const name = p.restaurant?.name || p.restaurant?.address || '기타';
    if (!restaurantVisits[name]) {
      restaurantVisits[name] = { count: 0, totalRating: 0, name };
    }
    restaurantVisits[name].count++;
    restaurantVisits[name].totalRating += p.rating;
  });
  const topRestaurants = Object.values(restaurantVisits)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Status bar spacer */}
      <View style={styles.statusBar} />

      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </AnimatedPressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>통계</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Period filters */}
        <Animated.View entering={FadeInDown.duration(200)} style={styles.periodRow}>
          {PERIODS.map((p) => {
            const isActive = period === p.key;
            return (
              <AnimatedPressable
                key={p.key}
                onPress={() => setPeriod(p.key)}
                style={[
                  styles.periodPill,
                  isActive
                    ? styles.periodActive
                    : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                ]}
              >
                <Text style={isActive ? styles.periodActiveText : [styles.periodText, { color: colors.textSecondary }]}>
                  {p.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </Animated.View>

        {/* Summary cards */}
        <Animated.View entering={FadeInDown.delay(40).duration(200)} style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryNumber, { color: colors.text }]}>{totalPosts}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>총 기록</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryNumber, { color: '#FFB800' }]}>{avgRating}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>평균 평점</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryNumber, { color: '#FF6B6B' }]}>{fiveStarCount}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>5점 기록</Text>
          </View>
        </Animated.View>

        {/* Rating distribution */}
        <Animated.View entering={FadeInDown.delay(80).duration(200)} style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>별점 분포</Text>
          <View style={styles.distChart}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDist[star - 1];
              const pct = maxDist > 0 ? (count / maxDist) * 100 : 0;
              return (
                <View key={star} style={styles.distRow}>
                  <Text style={[styles.distLabel, { color: colors.textSecondary }]}>{star}점</Text>
                  <View style={[styles.distBarBg, { backgroundColor: '#1C1B1A' }]}>
                    <View
                      style={[
                        styles.distBarFill,
                        {
                          backgroundColor: RATING_COLORS[star - 1],
                          width: `${Math.max(pct, 4)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.distCount, { color: colors.text }]}>{count}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Top restaurants */}
        <Animated.View entering={FadeInDown.delay(120).duration(200)} style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>자주 간 식당 TOP 5</Text>
          {topRestaurants.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              아직 기록이 없어요
            </Text>
          ) : (
            topRestaurants.map((r, i) => (
              <View key={r.name} style={styles.restaurantRow}>
                <Text style={[styles.rank, i === 0 ? { color: '#FF6B6B' } : { color: colors.text }]}>
                  {i + 1}
                </Text>
                <View style={styles.restaurantInfo}>
                  <Text style={[styles.restaurantName, { color: colors.text }]}>{r.name}</Text>
                  <Text style={[styles.restaurantSub, { color: colors.textSecondary }]}>
                    {r.count}회 방문 · 평균 ★ {(r.totalRating / r.count).toFixed(1)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    height: 54,
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    gap: 24,
    paddingBottom: 40,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  periodPill: {
    height: 34,
    borderRadius: 100,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodActive: {
    backgroundColor: '#FF6B6B',
  },
  periodActiveText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  periodText: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  distChart: {
    gap: 10,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distLabel: {
    width: 28,
    fontSize: 12,
    fontWeight: '500',
  },
  distBarBg: {
    flex: 1,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  distBarFill: {
    height: 24,
    borderRadius: 12,
  },
  distCount: {
    width: 24,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rank: {
    width: 20,
    fontSize: 16,
    fontWeight: '800',
  },
  restaurantInfo: {
    flex: 1,
    gap: 2,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '600',
  },
  restaurantSub: {
    fontSize: 12,
  },
});
