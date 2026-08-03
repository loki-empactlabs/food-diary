import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme';
import { usePostStore } from '@/src/stores/postStore';
import { useAuthStore } from '@/src/stores/authStore';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';

const TAG_COLORS: Record<string, string> = {
  '이탈리안': '#FF6B6B',
  '피자': '#FF6B6B',
  '디저트': '#FFB74D',
  '케이크': '#FFB74D',
  '카페': '#FFB74D',
  '일식': '#42A5F5',
  '라멘': '#42A5F5',
  '한식': '#66BB6A',
  '정식': '#66BB6A',
  '중식': '#EF5350',
  '매운맛': '#EF5350',
  '면요리': '#42A5F5',
  '고기': '#FF8A65',
};

const TASTE_KEYWORDS: { tag: string; emoji: string; label: string; color: string }[] = [
  { tag: '치즈', emoji: '🧀', label: '치즈 좋아', color: '#FF6B6B' },
  { tag: '면요리', emoji: '🍜', label: '면요리 팬', color: '#42A5F5' },
  { tag: '디저트', emoji: '🍰', label: '달콤함 선호', color: '#FFB74D' },
  { tag: '한식', emoji: '🍚', label: '밥심 든든', color: '#66BB6A' },
  { tag: '매운맛', emoji: '🌶️', label: '매운맛 도전', color: '#EF5350' },
  { tag: '카페', emoji: '☕', label: '카페 탐방', color: '#8D6E63' },
  { tag: '고기', emoji: '🥩', label: '육식파', color: '#FF8A65' },
];

export default function TasteProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const posts = usePostStore((s) => s.posts);

  const myPosts = useMemo(
    () => posts.filter((p) => p.user_id === (user?.id ?? 'dev-user')),
    [posts, user]
  );

  const avgRating = useMemo(() => {
    if (myPosts.length === 0) return 0;
    return myPosts.reduce((sum, p) => sum + p.rating, 0) / myPosts.length;
  }, [myPosts]);

  // Tag frequency analysis
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    myPosts.forEach((p) => p.tags.forEach((t) => {
      counts[t] = (counts[t] || 0) + 1;
    }));
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);
  }, [myPosts]);

  const maxTagCount = tagCounts.length > 0 ? tagCounts[0][1] : 1;

  // Top cuisine insight
  const topCuisine = tagCounts.length > 0 ? tagCounts[0][0] : '없음';
  const secondCuisine = tagCounts.length > 1 ? tagCounts[1][0] : null;

  // Matching taste keywords
  const matchedKeywords = useMemo(() => {
    const allTags = new Set(myPosts.flatMap((p) => p.tags));
    return TASTE_KEYWORDS.filter((kw) => allTags.has(kw.tag));
  }, [myPosts]);

  const displayName = user?.user_metadata?.display_name ?? 'Dev User';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <AnimatedPressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>맛 프로필</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Summary Card */}
        <Animated.View entering={FadeInDown.duration(200)}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>🍽️ {displayName}의 맛 프로필</Text>
            <Text style={styles.summaryDesc}>
              총 {myPosts.length}개 기록 기반으로 분석했어요
            </Text>

            <View style={styles.insightRow}>
              <View style={[styles.insightBox, { backgroundColor: 'rgba(255,107,107,0.08)' }]}>
                <Text style={styles.insightIcon}>🇮🇹</Text>
                <Text style={styles.insightLabel}>{topCuisine}</Text>
                <Text style={[styles.insightSub, { color: '#FF6B6B' }]}>가장 좋아해요</Text>
              </View>
              <View style={[styles.insightBox, { backgroundColor: 'rgba(68,221,102,0.08)' }]}>
                <Text style={styles.insightIcon}>⭐</Text>
                <Text style={styles.insightLabel}>평균 {avgRating.toFixed(1)}</Text>
                <Text style={[styles.insightSub, { color: '#44DD66' }]}>
                  {avgRating >= 4 ? '높은 기준!' : '보통이에요'}
                </Text>
              </View>
              <View style={[styles.insightBox, { backgroundColor: 'rgba(255,183,77,0.08)' }]}>
                <Text style={styles.insightIcon}>🔥</Text>
                <Text style={styles.insightLabel}>{secondCuisine || '탐험중'}</Text>
                <Text style={[styles.insightSub, { color: '#FFB74D' }]}>자주 먹어요</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Tag Distribution */}
        <Animated.View entering={FadeInDown.delay(40).duration(200)}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>태그 분포</Text>
            {tagCounts.map(([tag, count]) => {
              const barColor = TAG_COLORS[tag] || '#FF6B6B';
              const barWidth = (count / maxTagCount) * 100;
              return (
                <View key={tag} style={styles.barRow}>
                  <Text style={styles.barLabel}>{tag}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[styles.barFill, { width: `${barWidth}%`, backgroundColor: barColor } as any]}
                    />
                  </View>
                  <Text style={styles.barCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Taste Keywords */}
        {matchedKeywords.length > 0 && (
          <Animated.View entering={FadeInDown.delay(80).duration(200)}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>맛 키워드</Text>
              <View style={styles.keywordRow}>
                {matchedKeywords.map((kw) => (
                  <View
                    key={kw.tag}
                    style={[styles.keywordChip, { backgroundColor: `${kw.color}20` }]}
                  >
                    <Text style={[styles.keywordText, { color: kw.color }]}>
                      {kw.emoji} {kw.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 24,
  },
  summaryCard: {
    backgroundColor: '#211F1E',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryDesc: {
    fontSize: 13,
    color: '#555555',
  },
  insightRow: {
    flexDirection: 'row',
    gap: 8,
  },
  insightBox: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  insightIcon: {
    fontSize: 28,
  },
  insightLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  insightSub: {
    fontSize: 11,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barLabel: {
    fontSize: 13,
    color: '#999999',
    width: 65,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#211F1E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  barCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    width: 20,
    textAlign: 'right',
  },
  keywordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keywordChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  keywordText: {
    fontSize: 13,
  },
});
