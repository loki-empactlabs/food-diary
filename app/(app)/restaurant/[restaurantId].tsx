import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { usePostStore } from '@/src/stores/postStore';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';
import { AnimatedText } from '@/src/components/ui/AnimatedText';
import type { FoodPost } from '@/src/types/post';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 2;
const NUM_COLUMNS = 3;
const TILE_SIZE = (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export default function RestaurantDetailScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
  const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>();
  const posts = usePostStore((s) => s.posts);

  // Find all posts for this restaurant
  const restaurantPosts = posts.filter(
    (p) => p.restaurant_id === restaurantId || p.restaurant?.id === restaurantId
  );

  const restaurant = restaurantPosts[0]?.restaurant;
  const restaurantName = restaurant?.name ?? '식당 정보 없음';
  const restaurantAddress = restaurant?.address;

  // Compute stats
  const totalPosts = restaurantPosts.length;
  const avgRating =
    totalPosts > 0
      ? restaurantPosts.reduce((sum, p) => sum + p.rating, 0) / totalPosts
      : 0;
  const totalLikes = restaurantPosts.reduce(
    (sum, p) => sum + (p._count?.likes ?? 0),
    0
  );

  const renderGridItem = ({ item, index }: { item: FoodPost; index: number }) => (
    <Animated.View entering={FadeIn.delay(index * 30).duration(200)}>
      <AnimatedPressable
        onPress={() => router.push(`/(app)/post/${item.id}` as any)}
        scaleTarget={0.95}
      >
        <View style={{ width: TILE_SIZE, height: TILE_SIZE }}>
          <Image
            source={{ uri: item.thumbnail_urls?.[0] || item.image_urls?.[0] }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color="#FFB800" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
          <View style={styles.menuBadge}>
            <Text style={styles.menuText} numberOfLines={1}>
              {item.menu_name || '음식 기록'}
            </Text>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );

  const RestaurantHeader = () => (
    <View>
      {/* Info Section */}
      <Animated.View style={{ padding: spacing.base }} entering={FadeInDown.duration(200)}>
        {/* Name + Location */}
        <View style={styles.infoRow}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.primaryLight, borderRadius: radius.full },
            ]}
          >
            <Ionicons name="restaurant" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.base }}>
            <Text style={[typography.h3, { color: colors.text }]}>{restaurantName}</Text>
            {restaurantAddress && (
              <View style={[styles.addressRow, { marginTop: 4 }]}>
                <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                <Text
                  style={[
                    typography.bodySm,
                    { color: colors.textTertiary, marginLeft: 4, flex: 1 },
                  ]}
                >
                  {restaurantAddress}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View
          style={[
            styles.statsRow,
            {
              marginTop: spacing.base,
              paddingVertical: spacing.sm,
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              paddingHorizontal: spacing.base,
            },
          ]}
        >
          <View style={styles.statItem}>
            <AnimatedText style={[typography.h4, { color: colors.text }]} targetValue={totalPosts} />
            <Text style={[typography.caption, { color: colors.textSecondary }]}>기록</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.statItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="star" size={16} color="#FFB800" />
              <AnimatedText style={[typography.h4, { color: colors.text, marginLeft: 4 }]} targetValue={avgRating} decimals={1} />
            </View>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>평균별점</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.statItem}>
            <AnimatedText style={[typography.h4, { color: colors.text }]} targetValue={totalLikes} />
            <Text style={[typography.caption, { color: colors.textSecondary }]}>좋아요</Text>
          </View>
        </View>
      </Animated.View>

      {/* Grid Header */}
      <View
        style={[
          styles.gridHeader,
          {
            borderTopColor: colors.borderLight,
            borderBottomColor: colors.borderLight,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.base,
          },
        ]}
      >
        <Ionicons name="grid-outline" size={18} color={colors.primary} />
        <Text style={[typography.buttonSm, { color: colors.primary, marginLeft: spacing.xs }]}>
          음식 기록 ({totalPosts})
        </Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={[styles.emptyGrid, { paddingTop: spacing['3xl'] }]}>
      <Ionicons name="restaurant-outline" size={48} color={colors.borderLight} />
      <Text style={[typography.body, { color: colors.textTertiary, marginTop: spacing.sm }]}>
        이 식당의 기록이 없어요
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingHorizontal: spacing.base, borderBottomColor: colors.borderLight },
        ]}
      >
        <AnimatedPressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </AnimatedPressable>
        <Text
          style={[typography.h4, { color: colors.text, flex: 1, marginLeft: spacing.base }]}
          numberOfLines={1}
        >
          {restaurantName}
        </Text>
      </View>

      <FlatList
        data={restaurantPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderGridItem}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={RestaurantHeader}
        ListEmptyComponent={renderEmpty}
        columnWrapperStyle={{ gap: GRID_GAP }}
        contentContainerStyle={{ gap: GRID_GAP }}
        showsVerticalScrollIndicator={false}
      />
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  emptyGrid: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  ratingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  menuBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    maxWidth: '70%',
  },
  menuText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '600',
  },
});
