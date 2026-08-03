import { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';
import * as ImagePicker from 'expo-image-picker';

// Only import CameraView on native
let CameraView: any = null;
let useCameraPermissions: any = null;
if (Platform.OS !== 'web') {
  const expoCameraModule = require('expo-camera');
  CameraView = expoCameraModule.CameraView;
  useCameraPermissions = expoCameraModule.useCameraPermissions;
}

type FilterKey = 'original' | 'warm' | 'vivid' | 'vintage' | 'clean';

interface FilterPreset {
  key: FilterKey;
  name: string;
  // CSS filter for web preview thumbnails
  cssFilter: string;
  // GLSL fragment adjustments (for native GL rendering)
  glsl: {
    redMul: number;
    greenMul: number;
    blueMul: number;
    saturation: number;
    brightness: number;
  };
}

const FILTERS: FilterPreset[] = [
  {
    key: 'original',
    name: '원본',
    cssFilter: 'none',
    glsl: { redMul: 1.0, greenMul: 1.0, blueMul: 1.0, saturation: 1.0, brightness: 1.0 },
  },
  {
    key: 'warm',
    name: '따뜻한',
    cssFilter: 'sepia(0.2) saturate(1.3) brightness(1.05)',
    glsl: { redMul: 1.15, greenMul: 1.05, blueMul: 0.9, saturation: 1.3, brightness: 1.05 },
  },
  {
    key: 'vivid',
    name: '선명한',
    cssFilter: 'saturate(1.6) contrast(1.1)',
    glsl: { redMul: 1.0, greenMul: 1.0, blueMul: 1.0, saturation: 1.6, brightness: 1.05 },
  },
  {
    key: 'vintage',
    name: '빈티지',
    cssFilter: 'sepia(0.35) saturate(1.1) brightness(0.95) contrast(0.95)',
    glsl: { redMul: 1.1, greenMul: 1.0, blueMul: 0.85, saturation: 0.9, brightness: 0.95 },
  },
  {
    key: 'clean',
    name: '클린',
    cssFilter: 'brightness(1.15) saturate(0.95)',
    glsl: { redMul: 1.0, greenMul: 1.0, blueMul: 1.02, saturation: 0.95, brightness: 1.15 },
  },
];

// Placeholder food images for filter previews
const PREVIEW_IMAGE = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=120&h=120&fit=crop';

// Web version (no camera permissions needed)
function WebCameraScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('original');
  const [flashOn, setFlashOn] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);

  const currentFilter = FILTERS.find((f) => f.key === selectedFilter)!;

  const handleShutter = useCallback(() => {
    router.push('/(app)/post/create');
  }, [router]);

  const handleGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.9,
    });
    if (!result.canceled && result.assets.length > 0) {
      router.push({
        pathname: '/(app)/post/create',
        params: { imageUri: result.assets[0].uri },
      });
    }
  }, [router]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Camera Preview Area */}
      <View style={styles.cameraPreview}>
        <View style={styles.webPlaceholder}>
          <Ionicons name="camera" size={64} color="#333333" />
          <Text style={styles.webPlaceholderText}>
            {isFrontCamera ? '전면 카메라' : '후면 카메라'} 미리보기
          </Text>
          <Text style={styles.webPlaceholderSub}>네이티브 앱에서 실시간 필터가 적용됩니다</Text>
        </View>

        {/* Floating top controls */}
        <View style={styles.topBar}>
          <AnimatedPressable onPress={handleClose} style={styles.topBtn}>
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </AnimatedPressable>
          <AnimatedPressable onPress={() => setFlashOn(!flashOn)} style={styles.topBtn}>
            <Ionicons
              name={flashOn ? 'flash' : 'flash-off'}
              size={20}
              color={flashOn ? '#FFD700' : '#FFFFFF'}
            />
          </AnimatedPressable>
        </View>

        {/* Active filter label overlay */}
        {selectedFilter !== 'original' && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{currentFilter.name}</Text>
          </View>
        )}
      </View>

      {/* Filter Section */}
      <Animated.View style={styles.filterSection} entering={FadeInUp.duration(200)}>
        <Text style={styles.filterLabel}>필터</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((filter) => {
            const isActive = selectedFilter === filter.key;
            return (
              <AnimatedPressable
                key={filter.key}
                onPress={() => setSelectedFilter(filter.key)}
                style={styles.filterItem}
              >
                <View
                  style={[
                    styles.filterThumb,
                    isActive && styles.filterThumbActive,
                  ]}
                >
                  <Image
                    source={{ uri: PREVIEW_IMAGE }}
                    style={[
                      styles.filterThumbImage,
                      { filter: filter.cssFilter } as any,
                    ]}
                    contentFit="cover"
                  />
                </View>
                <Text
                  style={[
                    styles.filterName,
                    isActive && styles.filterNameActive,
                  ]}
                >
                  {filter.name}
                </Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Bottom Controls */}
      <Animated.View style={styles.bottomBar} entering={FadeInUp.delay(40).duration(200)}>
        {/* Gallery thumbnail */}
        <AnimatedPressable onPress={handleGallery} style={styles.galleryThumb}>
          <Ionicons name="images" size={22} color="#FFFFFF" />
        </AnimatedPressable>

        {/* Shutter button */}
        <AnimatedPressable onPress={handleShutter} style={styles.shutterOuter}>
          <View style={styles.shutterInner} />
        </AnimatedPressable>

        {/* Flip camera */}
        <AnimatedPressable onPress={() => setIsFrontCamera(!isFrontCamera)} style={styles.flipBtn}>
          <Ionicons name="camera-reverse-outline" size={24} color={isFrontCamera ? '#FFD700' : '#FFFFFF'} />
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

// Native version with real CameraView
function NativeCameraScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('original');
  const [flashOn, setFlashOn] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  const currentFilter = FILTERS.find((f) => f.key === selectedFilter)!;

  const handleShutter = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync();
      router.push({
        pathname: '/(app)/post/create',
        params: { imageUri: photo.uri },
      });
    } catch (e) {
      // If capture fails, navigate without image
      router.push('/(app)/post/create');
    }
  }, [router]);

  const handleGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.9,
    });
    if (!result.canceled && result.assets.length > 0) {
      router.push({
        pathname: '/(app)/post/create',
        params: { imageUri: result.assets[0].uri },
      });
    }
  }, [router]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  // Permission not yet determined
  if (!permission) {
    return <View style={styles.container} />;
  }

  // Permission denied - show request UI
  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <Ionicons name="camera-outline" size={64} color="#555555" />
        <Text style={styles.permissionTitle}>카메라 접근 권한 필요</Text>
        <Text style={styles.permissionSub}>음식 사진을 찍으려면 카메라 접근을 허용해 주세요</Text>
        <AnimatedPressable onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={styles.permissionBtnText}>권한 허용</Text>
        </AnimatedPressable>
        <AnimatedPressable onPress={handleClose} style={styles.permissionSkipBtn}>
          <Text style={styles.permissionSkipText}>건너뛰기</Text>
        </AnimatedPressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera Preview Area */}
      <View style={styles.cameraPreview}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={isFrontCamera ? 'front' : 'back'}
          flash={flashOn ? 'on' : 'off'}
        />

        {/* Floating top controls */}
        <View style={styles.topBar}>
          <AnimatedPressable onPress={handleClose} style={styles.topBtn}>
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </AnimatedPressable>
          <AnimatedPressable onPress={() => setFlashOn(!flashOn)} style={styles.topBtn}>
            <Ionicons
              name={flashOn ? 'flash' : 'flash-off'}
              size={20}
              color={flashOn ? '#FFD700' : '#FFFFFF'}
            />
          </AnimatedPressable>
        </View>

        {/* Active filter label overlay */}
        {selectedFilter !== 'original' && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{currentFilter.name}</Text>
          </View>
        )}
      </View>

      {/* Filter Section */}
      <Animated.View style={styles.filterSection} entering={FadeInUp.duration(200)}>
        <Text style={styles.filterLabel}>필터</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((filter) => {
            const isActive = selectedFilter === filter.key;
            return (
              <AnimatedPressable
                key={filter.key}
                onPress={() => setSelectedFilter(filter.key)}
                style={styles.filterItem}
              >
                <View
                  style={[
                    styles.filterThumb,
                    isActive && styles.filterThumbActive,
                  ]}
                >
                  <Image
                    source={{ uri: PREVIEW_IMAGE }}
                    style={styles.filterThumbImage}
                    contentFit="cover"
                  />
                </View>
                <Text
                  style={[
                    styles.filterName,
                    isActive && styles.filterNameActive,
                  ]}
                >
                  {filter.name}
                </Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Bottom Controls */}
      <Animated.View style={styles.bottomBar} entering={FadeInUp.delay(40).duration(200)}>
        {/* Gallery thumbnail */}
        <AnimatedPressable onPress={handleGallery} style={styles.galleryThumb}>
          <Ionicons name="images" size={22} color="#FFFFFF" />
        </AnimatedPressable>

        {/* Shutter button */}
        <AnimatedPressable onPress={handleShutter} style={styles.shutterOuter}>
          <View style={styles.shutterInner} />
        </AnimatedPressable>

        {/* Flip camera */}
        <AnimatedPressable onPress={() => setIsFrontCamera(!isFrontCamera)} style={styles.flipBtn}>
          <Ionicons name="camera-reverse-outline" size={24} color={isFrontCamera ? '#FFD700' : '#FFFFFF'} />
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

export default function CameraScreen() {
  if (Platform.OS === 'web') {
    return <WebCameraScreen />;
  }
  return <NativeCameraScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraPreview: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    position: 'relative',
  },
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  webPlaceholderText: {
    color: '#555555',
    fontSize: 16,
    fontWeight: '600',
  },
  webPlaceholderSub: {
    color: '#333333',
    fontSize: 12,
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionSub: {
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionBtn: {
    marginTop: 8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  permissionSkipBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  permissionSkipText: {
    color: '#666666',
    fontSize: 14,
  },
  topBar: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  topBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  filterSection: {
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  filterLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    paddingLeft: 20,
  },
  filterRow: {
    paddingHorizontal: 20,
    gap: 16,
  },
  filterItem: {
    alignItems: 'center',
    gap: 6,
  },
  filterThumb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterThumbActive: {
    borderColor: '#FF6B6B',
  },
  filterThumbImage: {
    width: '100%',
    height: '100%',
  },
  filterName: {
    color: '#999999',
    fontSize: 11,
  },
  filterNameActive: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  galleryThumb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2826',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  flipBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
