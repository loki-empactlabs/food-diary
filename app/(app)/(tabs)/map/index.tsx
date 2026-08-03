import { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutDown, ZoomInEasyDown } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { usePostStore } from '@/src/stores/postStore';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';
import { StarRating } from '@/src/components/ui/StarRating';
import type { FoodPost } from '@/src/types/post';

// Native-only imports (tree-shaken on web by Metro)
import type MapViewType from 'react-native-maps';

type FilterMode = 'me' | 'following';

const SEOUL_REGION = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const mapDarkStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1f1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];

export default function MapScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const posts = usePostStore((s) => s.posts);
  const [selectedPost, setSelectedPost] = useState<FoodPost | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('me');
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<MapViewType | null>(null);

  const postsWithLocation = useMemo(() => {
    let filtered = posts.filter((p) => p.location);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.restaurant?.name?.toLowerCase().includes(q) ||
          p.menu_name?.toLowerCase().includes(q) ||
          p.comment?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [posts, filterMode, searchQuery]);

  // Request location permission on native and animate to user location
  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      try {
        const Location = await import('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          mapRef.current?.animateToRegion(
            {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            },
            800
          );
        }
      } catch {
        // Keep Seoul default region if location unavailable
      }
    })();
  }, []);

  const handleMarkerPress = (post: FoodPost) => {
    setSelectedPost(post);
  };

  const handleCardPress = () => {
    if (selectedPost) {
      router.push(`/(app)/post/${selectedPost.id}` as any);
    }
  };

  const getDisplayName = (post: FoodPost) => {
    if (post.restaurant?.name) return post.restaurant.name;
    if (post.restaurant?.address) return post.restaurant.address;
    return '위치 정보 없음';
  };

  const handleLocatePress = async () => {
    setSelectedPost(null);
    setSearchQuery('');
    if (Platform.OS !== 'web') {
      try {
        const Location = await import('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          mapRef.current?.animateToRegion(
            {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            },
            800
          );
        } else {
          mapRef.current?.animateToRegion(SEOUL_REGION, 800);
        }
      } catch {
        mapRef.current?.animateToRegion(SEOUL_REGION, 800);
      }
    }
  };

  // Custom marker view shared between native and web
  const renderMarkerContent = (post: FoodPost) => {
    const isSelected = selectedPost?.id === post.id;
    return (
      <View style={styles.markerInner}>
        <View
          style={[
            styles.markerCircle,
            {
              borderColor: isSelected ? colors.primary : 'rgba(255,255,255,0.12)',
              borderWidth: isSelected ? 2.5 : 2,
            },
          ]}
        >
          <Image
            source={{ uri: post.thumbnail_urls?.[0] || post.image_urls?.[0] }}
            style={styles.markerImage}
            contentFit="cover"
          />
        </View>
        <View
          style={[
            styles.markerPin,
            { borderTopColor: isSelected ? colors.primary : 'rgba(255,255,255,0.12)' },
          ]}
        />
        <View
          style={[
            styles.ratingBadge,
            {
              backgroundColor: isSelected
                ? colors.primary
                : post.rating >= 4
                  ? '#FFB800'
                  : '#FF8844',
            },
          ]}
        >
          <Ionicons name="star" size={9} color={isSelected ? '#FFF' : '#000'} />
          <Text style={[styles.ratingBadgeText, { color: isSelected ? '#FFF' : '#000' }]}>
            {post.rating}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Map area */}
      {Platform.OS !== 'web' ? (
        <NativeMap
          mapRef={mapRef}
          posts={postsWithLocation}
          selectedPost={selectedPost}
          onMarkerPress={handleMarkerPress}
          renderMarkerContent={renderMarkerContent}
        />
      ) : (
        <View style={styles.mapArea}>
          {/* Subtle grid lines */}
          {[200, 350, 500, 650].map((y) => (
            <View key={`h${y}`} style={[styles.gridLineH, { top: y - 54 }]} />
          ))}
          {[100, 200, 300].map((x) => (
            <View key={`v${x}`} style={[styles.gridLineV, { left: x }]} />
          ))}

          {/* Subtle road lines */}
          <View style={[styles.road, { top: 200, left: 30, width: 180, transform: [{ rotate: '-12deg' }] }]} />
          <View style={[styles.road, { top: 100, left: 180, width: 250, transform: [{ rotate: '72deg' }] }]} />
          <View style={[styles.road, { top: 400, left: 20, width: 350, transform: [{ rotate: '3deg' }] }]} />

          {/* Street labels */}
          <Text style={[styles.streetLabel, { top: 300, left: 100, transform: [{ rotate: '-12deg' }] }]}>
            강남대로
          </Text>
          <Text style={[styles.streetLabel, { top: 220, left: 240, transform: [{ rotate: '72deg' }] }]}>
            테헤란로
          </Text>

          {/* My location dot */}
          <View style={styles.myLocationRing} />
          <View style={styles.myLocationDot} />

          {/* Food markers */}
          {postsWithLocation.map((post, index) => {
            const isSelected = selectedPost?.id === post.id;
            const left = ((post.location!.longitude - 126.9) / 0.18) * 70 + 10;
            const top = ((37.58 - post.location!.latitude) / 0.12) * 60 + 10;

            return (
              <Animated.View
                key={post.id}
                entering={ZoomInEasyDown.delay(index * 40).duration(200)}
                style={[
                  styles.marker,
                  {
                    left: `${Math.min(Math.max(left, 5), 85)}%`,
                    top: `${Math.min(Math.max(top, 5), 75)}%`,
                    zIndex: isSelected ? 10 : 1,
                  },
                ]}
              >
                <AnimatedPressable
                  onPress={() => handleMarkerPress(post)}
                  style={styles.markerInner}
                >
                  {renderMarkerContent(post)}
                </AnimatedPressable>
              </Animated.View>
            );
          })}

          {/* Web placeholder label */}
          <View style={styles.mapLabel}>
            <Ionicons name="map" size={14} color="rgba(255,255,255,0.15)" />
            <Text style={styles.mapLabelText}>네이티브에서 실제 지도 표시</Text>
          </View>
        </View>
      )}

      {/* Locate button (overlaid on both platforms) */}
      <AnimatedPressable
        onPress={handleLocatePress}
        style={[
          styles.locateBtn,
          {
            backgroundColor: 'rgba(34,34,34,0.9)',
            borderColor: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(7.5px)',
            WebkitBackdropFilter: 'blur(7.5px)',
          } as any,
        ]}
      >
        <Ionicons name="locate" size={20} color="#4A90FF" />
      </AnimatedPressable>

      {/* Top overlay: search + filters */}
      <View style={styles.topOverlay}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: 'rgba(26,26,26,0.8)',
              borderColor: 'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(7.5px)',
              WebkitBackdropFilter: 'blur(7.5px)',
            } as any,
          ]}
        >
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="장소 또는 메뉴 검색"
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <AnimatedPressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </AnimatedPressable>
          )}
        </View>

        <View style={styles.filterRow}>
          <AnimatedPressable
            onPress={() => setFilterMode('me')}
            style={[
              styles.filterPill,
              filterMode === 'me'
                ? { backgroundColor: colors.primary }
                : {
                    backgroundColor: 'rgba(26,26,26,0.8)',
                    borderColor: 'rgba(255,255,255,0.07)',
                    borderWidth: 1,
                    backdropFilter: 'blur(7.5px)',
                    WebkitBackdropFilter: 'blur(7.5px)',
                  } as any,
            ]}
          >
            <Ionicons
              name="person"
              size={14}
              color={filterMode === 'me' ? '#FFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.filterText,
                { color: filterMode === 'me' ? '#FFF' : colors.textSecondary },
              ]}
            >
              나만
            </Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => setFilterMode('following')}
            style={[
              styles.filterPill,
              filterMode === 'following'
                ? { backgroundColor: colors.primary }
                : {
                    backgroundColor: 'rgba(26,26,26,0.8)',
                    borderColor: 'rgba(255,255,255,0.07)',
                    borderWidth: 1,
                    backdropFilter: 'blur(7.5px)',
                    WebkitBackdropFilter: 'blur(7.5px)',
                  } as any,
            ]}
          >
            <Ionicons
              name="people"
              size={14}
              color={filterMode === 'following' ? '#FFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.filterText,
                { color: filterMode === 'following' ? '#FFF' : colors.textSecondary },
              ]}
            >
              팔로잉 포함
            </Text>
          </AnimatedPressable>
        </View>
      </View>

      {/* Bottom sheet */}
      {selectedPost ? (
        <Animated.View
          key={`sheet-${selectedPost.id}`}
          entering={FadeInUp.duration(200)}
          exiting={FadeOutDown.duration(200)}
        >
          <AnimatedPressable
            onPress={handleCardPress}
            scaleTarget={0.98}
            style={[
              styles.bottomSheet,
              {
                backgroundColor: 'rgba(26,26,26,0.8)',
                borderColor: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(7.5px)',
                WebkitBackdropFilter: 'blur(7.5px)',
              } as any,
            ]}
          >
            <View style={styles.handle} />
            <View style={styles.cardRow}>
              <Image
                source={{ uri: selectedPost.thumbnail_urls?.[0] || selectedPost.image_urls?.[0] }}
                style={styles.cardImage}
                contentFit="cover"
              />
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                  {getDisplayName(selectedPost)}
                </Text>
                <StarRating rating={selectedPost.rating} size={14} readonly />
                {selectedPost.comment && (
                  <View style={styles.commentRow}>
                    <Ionicons name="chatbubble-outline" size={11} color={colors.textSecondary} />
                    <Text
                      style={[styles.commentText, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {selectedPost.comment}
                    </Text>
                  </View>
                )}
              </View>
              <View style={[styles.arrowBtn, { backgroundColor: colors.primary }]}>
                <Ionicons name="arrow-forward" size={16} color="#FFF" />
              </View>
            </View>
          </AnimatedPressable>
        </Animated.View>
      ) : (
        <View
          style={[
            styles.bottomHint,
            {
              backgroundColor: 'rgba(26,26,26,0.8)',
              borderColor: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(7.5px)',
              WebkitBackdropFilter: 'blur(7.5px)',
            } as any,
          ]}
        >
          <View style={styles.handle} />
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            마커를 탭하여 기록을 확인하세요
          </Text>
          <Text style={[styles.hintSub, { color: colors.textTertiary }]}>
            {postsWithLocation.length}개의 기록
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Native-only MapView component ───────────────────────────────────────────
// Defined outside the main component so Metro can tree-shake on web.
// The conditional `Platform.OS !== 'web'` guard in the parent ensures this is
// never rendered on web, so the dynamic import inside is fine.

type NativeMapProps = {
  mapRef: React.MutableRefObject<MapViewType | null>;
  posts: FoodPost[];
  selectedPost: FoodPost | null;
  onMarkerPress: (post: FoodPost) => void;
  renderMarkerContent: (post: FoodPost) => React.ReactNode;
};

function NativeMap({ mapRef, posts, selectedPost, onMarkerPress, renderMarkerContent }: NativeMapProps) {
  const { colors } = useTheme();
  const [MapView, setMapView] = useState<typeof import('react-native-maps').default | null>(null);
  const [Marker, setMarker] = useState<typeof import('react-native-maps').Marker | null>(null);

  useEffect(() => {
    import('react-native-maps').then((mod) => {
      setMapView(() => mod.default);
      setMarker(() => mod.Marker);
    });
  }, []);

  if (!MapView || !Marker) return null;

  return (
    <MapView
      ref={mapRef}
      style={styles.mapArea}
      initialRegion={SEOUL_REGION}
      customMapStyle={mapDarkStyle}
      showsUserLocation
      showsMyLocationButton={false}
      showsCompass={false}
      showsScale={false}
      showsPointsOfInterests={false}
      userInterfaceStyle="dark"
    >
      {posts.map((post) => {
        if (!post.location) return null;
        const isSelected = selectedPost?.id === post.id;
        return (
          <Marker
            key={post.id}
            coordinate={{
              latitude: post.location.latitude,
              longitude: post.location.longitude,
            }}
            onPress={() => onMarkerPress(post)}
            zIndex={isSelected ? 10 : 1}
            tracksViewChanges={isSelected}
          >
            {renderMarkerContent(post)}
          </Marker>
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#1A1F1A',
    position: 'relative',
    overflow: 'hidden',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  road: {
    position: 'absolute',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  streetLabel: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.08)',
  },
  myLocationRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(74,144,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(74,144,255,0.18)',
    top: '45%',
    left: '45%',
    marginLeft: -24,
    marginTop: -24,
  },
  myLocationDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4A90FF',
    borderWidth: 2,
    borderColor: '#FFF',
    top: '45%',
    left: '45%',
    marginLeft: -8,
    marginTop: -8,
    shadowColor: '#4A90FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  marker: {
    position: 'absolute',
    width: 56,
    height: 64,
    alignItems: 'center',
  },
  markerInner: {
    alignItems: 'center',
  },
  markerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  markerImage: {
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as const,
  },
  markerPin: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
    pointerEvents: 'none' as const,
  },
  ratingBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 9,
    pointerEvents: 'none' as const,
  },
  ratingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  locateBtn: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  mapLabel: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mapLabelText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.12)',
  },
  // Top overlay
  topOverlay: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    gap: 12,
    zIndex: 10,
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    borderRadius: 100,
    paddingHorizontal: 14,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Bottom sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
    zIndex: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentText: {
    fontSize: 12,
    flex: 1,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomHint: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  hintText: {
    fontSize: 13,
    marginTop: 4,
  },
  hintSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
