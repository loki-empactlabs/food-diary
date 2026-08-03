import { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme';
import { usePostStore } from '@/src/stores/postStore';
import { useAuthStore } from '@/src/stores/authStore';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';

// Haversine distance in km
function getDistanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Mock current location (강남역 근처)
const CURRENT_LOCATION = { latitude: 37.498, longitude: 127.028 };

export default function NearbyScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const posts = usePostStore((s) => s.posts);
  const [currentAddr] = useState('서울 강남구 역삼동');

  const myPosts = useMemo(
    () => posts.filter((p) => p.user_id === (user?.id ?? 'dev-user')),
    [posts, user]
  );

  // Group by restaurant, pick highest rating, filter >= 4, sort by distance
  const nearbyRestaurants = useMemo(() => {
    const restaurantMap: Record<string, {
      name: string;
      rating: number;
      menuName: string;
      tags: string[];
      imageUrl: string;
      lat: number;
      lon: number;
      postId: string;
    }> = {};

    myPosts.forEach((p) => {
      if (p.rating < 4) return;
      if (!p.restaurant) return;
      const rId = p.restaurant.id;
      if (!restaurantMap[rId] || p.rating > restaurantMap[rId].rating) {
        restaurantMap[rId] = {
          name: p.restaurant.name,
          rating: p.rating,
          menuName: p.menu_name || '',
          tags: p.tags,
          imageUrl: p.thumbnail_urls?.[0] || p.image_urls[0],
          lat: p.location?.latitude ?? 0,
          lon: p.location?.longitude ?? 0,
          postId: p.id,
        };
      }
    });

    return Object.entries(restaurantMap)
      .map(([id, r]) => ({
        id,
        ...r,
        distance: getDistanceKm(
          CURRENT_LOCATION.latitude,
          CURRENT_LOCATION.longitude,
          r.lat,
          r.lon
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [myPosts]);

  const formatDistance = useCallback((km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  }, []);

  const getTagSummary = useCallback((menuName: string, tags: string[]) => {
    const parts: string[] = [];
    if (menuName) parts.push(menuName);
    const cuisineTags = tags.filter((t) =>
      ['이탈리안', '일식', '한식', '중식', '디저트', '카페'].includes(t)
    );
    if (cuisineTags.length > 0) parts.push(cuisineTags[0]);
    return parts.join(' · ') || '맛집';
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <AnimatedPressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>근처 맛집 추천</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Current Location */}
        <Animated.View entering={FadeInDown.duration(200)}>
          <View style={styles.locationCard}>
            <Text style={styles.locationIcon}>📍</Text>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>현재 위치</Text>
              <Text style={styles.locationAddr}>{currentAddr}</Text>
            </View>
            <Text style={styles.refreshIcon}>↻</Text>
          </View>
        </Animated.View>

        {/* Section Title */}
        <Animated.View entering={FadeInDown.delay(40).duration(200)}>
          <Text style={styles.sectionTitle}>⭐ 별점 4점 이상 근처 맛집</Text>
        </Animated.View>

        {/* Restaurant Cards */}
        {nearbyRestaurants.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyText}>
              별점 4점 이상 기록한 식당이 없어요
            </Text>
            <Text style={styles.emptyHint}>
              맛있는 곳을 기록하면 여기에 추천해드릴게요
            </Text>
          </View>
        ) : (
          nearbyRestaurants.map((r, index) => (
            <Animated.View key={r.id} entering={FadeInDown.delay((index + 2) * 40).duration(200)}>
              <AnimatedPressable
                style={styles.restaurantCard}
                onPress={() => router.push(`/restaurant/${r.id}` as any)}
              >
                <Image
                  source={{ uri: r.imageUrl }}
                  style={styles.thumbnail}
                />
                <View style={styles.cardInfo}>
                  <Text style={styles.restaurantName}>{r.name}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.ratingText}>⭐ {r.rating.toFixed(1)}</Text>
                    <Text style={styles.distanceText}>{formatDistance(r.distance)}</Text>
                  </View>
                  <Text style={styles.menuText}>
                    {getTagSummary(r.menuName, r.tags)}
                  </Text>
                </View>
              </AnimatedPressable>
            </Animated.View>
          ))
        )}

        {/* Hint */}
        <Animated.View entering={FadeInDown.delay(200).duration(200)}>
          <View style={styles.hintBox}>
            <Text style={styles.hintIcon}>💡</Text>
            <Text style={styles.hintText}>
              별점 4점 이상 기록한 식당 중 현재 위치에서 가까운 곳을 추천해드려요
            </Text>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 20,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#211F1E',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  locationIcon: {
    fontSize: 22,
  },
  locationInfo: {
    flex: 1,
    gap: 2,
  },
  locationLabel: {
    fontSize: 11,
    color: '#555555',
  },
  locationAddr: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  refreshIcon: {
    fontSize: 18,
    color: '#FF6B6B',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  restaurantCard: {
    flexDirection: 'row',
    backgroundColor: '#211F1E',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    alignItems: 'center',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#333333',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#FFB74D',
  },
  distanceText: {
    fontSize: 12,
    color: '#555555',
  },
  menuText: {
    fontSize: 12,
    color: '#777777',
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyHint: {
    fontSize: 13,
    color: '#555555',
  },
  hintBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'rgba(255,107,107,0.06)',
    borderRadius: 12,
  },
  hintIcon: {
    fontSize: 16,
  },
  hintText: {
    fontSize: 12,
    color: '#777777',
    flex: 1,
  },
});
