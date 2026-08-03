import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { useSocialStore } from '@/src/stores/socialStore';
import { usePostStore } from '@/src/stores/postStore';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';
import { AnimatedText } from '@/src/components/ui/AnimatedText';
import { useMemo } from 'react';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function UserProfileScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const storeUsers = useSocialStore((s) => s.users);
  const toggleFollow = useSocialStore((s) => s.toggleFollow);
  const posts = usePostStore((s) => s.posts);

  const user = useMemo(() => storeUsers.find((u) => u.id === userId), [storeUsers, userId]);
  const userPosts = useMemo(() => posts.filter((p) => p.user_id === userId), [posts, userId]);

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingHorizontal: spacing.base, borderBottomColor: colors.borderLight }]}>
          <AnimatedPressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </AnimatedPressable>
        </View>
        <View style={styles.centered}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            사용자를 찾을 수 없습니다.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const tileSize = (SCREEN_WIDTH - spacing.base * 2 - 4) / 3;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.base, borderBottomColor: colors.borderLight }]}>
        <AnimatedPressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </AnimatedPressable>
        <Text style={[typography.h4, { color: colors.text, marginLeft: spacing.base }]} numberOfLines={1}>
          {user.display_name}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={{ alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.base }}>
          {/* Avatar */}
          <Animated.View entering={ZoomIn.duration(200)} style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <Ionicons name="person" size={32} color={colors.primary} />
            )}
          </Animated.View>

          {/* Name */}
          <Animated.Text entering={FadeInDown.delay(50).duration(200)} style={[typography.h3, { color: colors.text, marginTop: spacing.sm }]}>
            {user.display_name}
          </Animated.Text>

          {/* Bio */}
          {user.bio && (
            <Text style={[typography.bodySm, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, paddingHorizontal: spacing.lg }]}>
              {user.bio}
            </Text>
          )}

          {/* Stats Row */}
          <Animated.View entering={FadeInDown.delay(100).duration(200)} style={[styles.statsRow, { marginTop: spacing.base }]}>
            <View style={styles.statItem}>
              <AnimatedText style={[typography.h4, { color: colors.text }]} targetValue={user.total_posts} />
              <Text style={[typography.caption, { color: colors.textTertiary }]}>기록</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <View style={styles.statItem}>
              <AnimatedText style={[typography.h4, { color: colors.text }]} targetValue={user.followers_count} />
              <Text style={[typography.caption, { color: colors.textTertiary }]}>팔로워</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <View style={styles.statItem}>
              <AnimatedText style={[typography.h4, { color: colors.text }]} targetValue={user.following_count} />
              <Text style={[typography.caption, { color: colors.textTertiary }]}>팔로잉</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <View style={styles.statItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="star" size={14} color={colors.starFilled} />
                <AnimatedText style={[typography.h4, { color: colors.text, marginLeft: 2 }]} targetValue={user.avg_rating} decimals={1} />
              </View>
              <Text style={[typography.caption, { color: colors.textTertiary }]}>평균</Text>
            </View>
          </Animated.View>

          {/* Follow Button */}
          <AnimatedPressable
            onPress={() => toggleFollow(user.id)}
            style={[
              styles.followButton,
              {
                backgroundColor: user.is_following ? colors.surface : colors.primary,
                borderColor: user.is_following ? colors.border : colors.primary,
                borderRadius: radius.md,
                marginTop: spacing.base,
              },
            ]}
          >
            <Ionicons
              name={user.is_following ? 'person-remove-outline' : 'person-add-outline'}
              size={16}
              color={user.is_following ? colors.text : colors.textOnPrimary}
            />
            <Text
              style={[
                typography.bodyMedium,
                {
                  color: user.is_following ? colors.text : colors.textOnPrimary,
                  marginLeft: spacing.xs,
                },
              ]}
            >
              {user.is_following ? '팔로잉' : '팔로우'}
            </Text>
          </AnimatedPressable>
        </View>

        {/* Posts Grid */}
        <View style={[styles.gridHeader, { paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderTopColor: colors.borderLight }]}>
          <Ionicons name="grid-outline" size={16} color={colors.textSecondary} />
          <Text style={[typography.bodyMedium, { color: colors.text, marginLeft: spacing.xs }]}>
            기록 {userPosts.length}
          </Text>
        </View>

        {userPosts.length === 0 ? (
          <View style={{ paddingVertical: spacing['3xl'], alignItems: 'center' }}>
            <Ionicons name="camera-outline" size={40} color={colors.textTertiary} />
            <Text style={[typography.bodySm, { color: colors.textTertiary, marginTop: spacing.sm }]}>
              아직 기록이 없습니다
            </Text>
          </View>
        ) : (
          <View style={[styles.grid, { paddingHorizontal: spacing.base }]}>
            {userPosts.map((post, index) => (
              <Animated.View key={post.id} entering={FadeIn.delay(index * 30).duration(200)}>
                <AnimatedPressable
                  onPress={() => router.push(`/(app)/post/${post.id}` as any)}
                  style={[styles.gridTile, { width: tileSize, height: tileSize, borderRadius: radius.sm, overflow: 'hidden' }]}
                  scaleTarget={0.95}
                >
                  <Image
                    source={{ uri: post.thumbnail_urls?.[0] || post.image_urls[0] }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                  <View style={[styles.gridOverlay, { borderRadius: radius.sm }]}>
                    <View style={styles.gridRating}>
                      <Ionicons name="star" size={10} color="#FFB800" />
                      <Text style={styles.gridRatingText}>{post.rating}</Text>
                    </View>
                  </View>
                </AnimatedPressable>
              </Animated.View>
            ))}
          </View>
        )}

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    width: '80%',
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  gridTile: {
    position: 'relative',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 4,
  },
  gridRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  gridRatingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
});
