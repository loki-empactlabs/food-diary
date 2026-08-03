import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { usePostStore } from '@/src/stores/postStore';
import { useSocialStore } from '@/src/stores/socialStore';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';
import type { FoodPost, UserProfile } from '@/src/types/post';

const SCREEN_WIDTH = Dimensions.get('window').width;
type SearchTab = '기록' | '식당' | '유저';
const TABS: SearchTab[] = ['기록', '식당', '유저'];

export default function SearchScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
  const posts = usePostStore((s) => s.posts);
  const users = useSocialStore((s) => s.users);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('기록');

  const q = query.trim().toLowerCase();

  // Search posts
  const postResults = useMemo(() => {
    if (!q) return [];
    return posts.filter(
      (p) =>
        p.menu_name?.toLowerCase().includes(q) ||
        p.restaurant?.name?.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.comment?.toLowerCase().includes(q)
    );
  }, [posts, q]);

  // Search restaurants (unique from posts)
  const restaurantResults = useMemo(() => {
    if (!q) return [];
    const restaurantMap = new Map<string, { id: string; name: string; address: string | null; postCount: number; avgRating: number }>();
    posts.forEach((p) => {
      if (!p.restaurant) return;
      const key = p.restaurant.id;
      if (!restaurantMap.has(key)) {
        restaurantMap.set(key, {
          id: p.restaurant.id,
          name: p.restaurant.name,
          address: p.restaurant.address,
          postCount: 0,
          avgRating: 0,
        });
      }
      const r = restaurantMap.get(key)!;
      r.postCount++;
      r.avgRating = (r.avgRating * (r.postCount - 1) + p.rating) / r.postCount;
    });
    return Array.from(restaurantMap.values()).filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.address?.toLowerCase().includes(q)
    );
  }, [posts, q]);

  // Search users
  const userResults = useMemo(() => {
    if (!q) return [];
    return users.filter(
      (u) =>
        u.display_name.toLowerCase().includes(q) ||
        u.bio?.toLowerCase().includes(q)
    );
  }, [users, q]);

  const resultCounts = {
    '기록': postResults.length,
    '식당': restaurantResults.length,
    '유저': userResults.length,
  };

  const renderPostItem = ({ item, index }: { item: FoodPost; index: number }) => {
    const tileSize = (SCREEN_WIDTH - spacing.base * 2 - 4) / 3;
    return (
      <Animated.View entering={FadeIn.delay(index * 20).duration(200)}>
        <AnimatedPressable
          onPress={() => router.push(`/(app)/post/${item.id}` as any)}
          style={[styles.gridTile, { width: tileSize, height: tileSize, borderRadius: radius.sm, overflow: 'hidden' }]}
          scaleTarget={0.95}
        >
          <Image
            source={{ uri: item.thumbnail_urls?.[0] || item.image_urls[0] }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View style={styles.gridOverlay}>
            <Text style={styles.gridMenuName} numberOfLines={1}>{item.menu_name || '음식 기록'}</Text>
            <View style={styles.gridRating}>
              <Ionicons name="star" size={10} color="#FFB800" />
              <Text style={styles.gridRatingText}>{item.rating}</Text>
            </View>
          </View>
        </AnimatedPressable>
      </Animated.View>
    );
  };

  const renderRestaurantItem = ({ item, index }: { item: { id: string; name: string; address: string | null; postCount: number; avgRating: number }; index: number }) => (
    <Animated.View entering={FadeIn.delay(index * 25).duration(200)}>
      <AnimatedPressable
        onPress={() => router.push(`/(app)/restaurant/${item.id}` as any)}
        style={[styles.listItem, { paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderBottomColor: colors.borderLight }]}
      >
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={[typography.bodyMedium, { color: colors.text }]}>{item.name}</Text>
          {item.address && (
            <Text style={[typography.caption, { color: colors.textTertiary }]}>{item.address}</Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="star" size={12} color={colors.starFilled} />
            <Text style={[typography.bodySm, { color: colors.text, marginLeft: 2 }]}>
              {item.avgRating.toFixed(1)}
            </Text>
          </View>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            기록 {item.postCount}
          </Text>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );

  const renderUserItem = ({ item, index }: { item: UserProfile; index: number }) => (
    <Animated.View entering={FadeIn.delay(index * 25).duration(200)}>
      <AnimatedPressable
        onPress={() => router.push(`/(app)/user/${item.id}` as any)}
        style={[styles.listItem, { paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderBottomColor: colors.borderLight }]}
      >
        <View style={[styles.userAvatar, { backgroundColor: colors.primaryLight }]}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.userAvatar} />
          ) : (
            <Ionicons name="person" size={18} color={colors.primary} />
          )}
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={[typography.bodyMedium, { color: colors.text }]}>{item.display_name}</Text>
          {item.bio && (
            <Text style={[typography.caption, { color: colors.textTertiary }]} numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
            기록 {item.total_posts}
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            팔로워 {item.followers_count}
          </Text>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {!q ? (
        <>
          <Ionicons name="search" size={40} color={colors.textTertiary} />
          <Text style={[typography.body, { color: colors.textTertiary, marginTop: spacing.sm }]}>
            메뉴, 식당, 유저를 검색하세요
          </Text>
        </>
      ) : (
        <>
          <Ionicons name="search" size={40} color={colors.textTertiary} />
          <Text style={[typography.body, { color: colors.textTertiary, marginTop: spacing.sm }]}>
            검색 결과가 없습니다
          </Text>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.base, borderBottomColor: colors.borderLight }]}>
        <AnimatedPressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </AnimatedPressable>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
              marginLeft: spacing.sm,
            },
          ]}
        >
          <Ionicons name="search" size={16} color={colors.textTertiary} style={{ marginLeft: spacing.sm }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="메뉴, 식당, 유저 검색..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text, ...typography.bodySm }]}
            autoFocus
          />
          {query.length > 0 && (
            <Animated.View entering={ZoomIn.duration(150)} exiting={ZoomOut.duration(150)}>
              <AnimatedPressable onPress={() => setQuery('')} hitSlop={8} style={{ marginRight: spacing.sm }}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </AnimatedPressable>
            </Animated.View>
          )}
        </View>
      </View>

      {/* Tabs */}
      {q.length > 0 && (
        <View style={[styles.tabRow, { paddingHorizontal: spacing.base, borderBottomColor: colors.borderLight }]}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            const count = resultCounts[tab];
            return (
              <AnimatedPressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tab,
                  { borderBottomColor: isActive ? colors.primary : 'transparent' },
                ]}
                scaleTarget={0.95}
              >
                <Text
                  style={[
                    typography.bodySm,
                    {
                      color: isActive ? colors.primary : colors.textSecondary,
                      fontWeight: isActive ? '600' : '400',
                    },
                  ]}
                >
                  {tab} {count > 0 ? count : ''}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>
      )}

      {/* Results */}
      {activeTab === '기록' && (
        <FlatList
          data={q ? postResults : []}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={{ gap: 2, paddingHorizontal: spacing.base }}
          contentContainerStyle={{ paddingTop: spacing.sm, gap: 2 }}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
      {activeTab === '식당' && (
        <FlatList
          data={q ? restaurantResults : []}
          renderItem={renderRestaurantItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
      {activeTab === '유저' && (
        <FlatList
          data={q ? userResults : []}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 8,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridTile: {
    position: 'relative',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  gridMenuName: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  gridRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  gridRatingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
});
