import { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme';
import { usePostStore } from '@/src/stores/postStore';
import { useAuthStore } from '@/src/stores/authStore';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';
import type { FoodPost } from '@/src/types/post';

const REVISIT_DAYS_OPTIONS = [14, 30, 60, 90];

function getDaysAgo(dateStr: string): number {
  const now = new Date();
  const then = new Date(dateStr);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function formatStars(rating: number): string {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
}

function RevisitCard({ post, onPress }: { post: FoodPost; onPress: () => void }) {
  const daysAgo = getDaysAgo(post.created_at);
  const imageUrl = post.thumbnail_urls[0] || post.image_urls[0];

  return (
    <AnimatedPressable onPress={onPress} style={styles.card}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.cardImage} contentFit="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Ionicons name="image-outline" size={28} color="#555555" />
        </View>
      )}
      <View style={styles.cardInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.menuName} numberOfLines={1}>
            {post.menu_name || '음식'}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{daysAgo}일 전</Text>
          </View>
        </View>
        {post.restaurant?.name ? (
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {post.restaurant.name}
            </Text>
          </View>
        ) : null}
        <View style={styles.ratingRow}>
          <Text style={styles.stars}>{formatStars(post.rating)}</Text>
          <Text style={styles.ratingNum}>{post.rating.toFixed(1)}</Text>
          <Text style={styles.dateText}>· {formatDate(post.created_at)}</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default function RevisitScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const posts = usePostStore((s) => s.posts);

  const [revisitEnabled, setRevisitEnabled] = useState(true);
  const [highRatingOnly, setHighRatingOnly] = useState(false);
  const [revisitDaysIdx, setRevisitDaysIdx] = useState(1); // default 30 days
  const revisitDays = REVISIT_DAYS_OPTIONS[revisitDaysIdx];
  const scrollRef = useRef<ScrollView>(null);

  const cycleRevisitDays = () => {
    setRevisitDaysIdx((prev) => (prev + 1) % REVISIT_DAYS_OPTIONS.length);
  };

  const revisitPosts = useMemo(() => {
    const myPosts = posts.filter((p) => p.user_id === (user?.id ?? 'dev-user'));
    return myPosts
      .filter((p) => {
        const daysAgo = getDaysAgo(p.created_at);
        const meetsAge = daysAgo >= revisitDays;
        const meetsRating = highRatingOnly ? p.rating >= 4 : true;
        return meetsAge && meetsRating;
      })
      .sort((a, b) => getDaysAgo(a.created_at) - getDaysAgo(b.created_at));
  }, [posts, user, revisitDays, highRatingOnly]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <AnimatedPressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>재방문 알림</Text>
        <AnimatedPressable onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          <Text style={styles.headerRight}>설정</Text>
        </AnimatedPressable>
      </View>

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Recommendation section */}
        <Animated.View entering={FadeInDown.duration(200)}>
          <Text style={styles.sectionTitle}>오늘의 재방문 추천</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(200)}>
          {revisitPosts.length > 0 ? (
            revisitPosts.map((post) => (
              <RevisitCard
                key={post.id}
                post={post}
                onPress={() => router.push(`/(app)/post/${post.id}` as any)}
              />
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle-outline" size={40} color="#333333" />
              <Text style={styles.emptyText}>최근에 다 재방문했어요!</Text>
              <Text style={styles.emptySubtext}>
                {revisitDays}일 이상 지난 기록이 없습니다
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Hint */}
        <Animated.View entering={FadeInDown.delay(40).duration(200)}>
          <View style={styles.hint}>
            <Text style={styles.hintIcon}>🔔</Text>
            <Text style={styles.hintText}>
              {revisitDays}일 이상 지난 맛집만 추천해드려요
            </Text>
          </View>
        </Animated.View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Settings section */}
        <Animated.View entering={FadeInDown.delay(80).duration(200)}>
          <Text style={styles.sectionTitle}>알림 설정</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(200)}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>재방문 알림 받기</Text>
            <Switch
              value={revisitEnabled}
              onValueChange={setRevisitEnabled}
              trackColor={{ false: '#333333', true: '#FF6B6B' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <AnimatedPressable onPress={cycleRevisitDays} style={styles.settingRow}>
            <Text style={styles.settingLabel}>알림 주기</Text>
            <View style={styles.settingValue}>
              <Text style={styles.periodText}>{revisitDays}일</Text>
              <Ionicons name="chevron-forward" size={16} color="#555555" />
            </View>
          </AnimatedPressable>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>높은 별점만 (4점 이상)</Text>
            <Switch
              value={highRatingOnly}
              onValueChange={setHighRatingOnly}
              trackColor={{ false: '#333333', true: '#FF6B6B' }}
              thumbColor={highRatingOnly ? '#FFFFFF' : '#999999'}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerRight: {
    fontSize: 14,
    color: '#FF6B6B',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#211F1E',
    borderRadius: 16,
    padding: 14,
    gap: 14,
    alignItems: 'center',
  },
  cardImage: {
    width: 92,
    height: 92,
    borderRadius: 12,
  },
  cardImagePlaceholder: {
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  badge: {
    backgroundColor: 'rgba(255, 107, 107, 0.13)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationIcon: {
    fontSize: 12,
  },
  locationText: {
    fontSize: 13,
    color: '#999999',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stars: {
    fontSize: 12,
    color: '#FF6B6B',
  },
  ratingNum: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dateText: {
    fontSize: 12,
    color: '#555555',
  },
  emptyCard: {
    backgroundColor: '#211F1E',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#555555',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  hintIcon: {
    fontSize: 14,
  },
  hintText: {
    fontSize: 13,
    color: '#555555',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  periodText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B6B',
  },
});
