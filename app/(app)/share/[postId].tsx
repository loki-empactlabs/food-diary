import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { showToast } from '@/src/components/ui/Toast';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme';
import { usePostStore } from '@/src/stores/postStore';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';
import Animated, { FadeInDown } from 'react-native-reanimated';

type CardStyle = 'dark' | 'light' | 'accent';

const CARD_STYLES: { key: CardStyle; bg: string; text: string; subtext: string; swatch: string }[] = [
  { key: 'dark', bg: '#211F1E', text: '#FFFFFF', subtext: '#999999', swatch: '#211F1E' },
  { key: 'light', bg: '#FFFFFF', text: '#1A1A1A', subtext: '#666666', swatch: '#FFFFFF' },
  { key: 'accent', bg: '#FF6B6B', text: '#FFFFFF', subtext: 'rgba(255,255,255,0.7)', swatch: '#FF6B6B' },
];

function formatStars(rating: number): string {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function ShareCardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const post = usePostStore((s) => s.posts.find((p) => p.id === postId));
  const [cardStyle, setCardStyle] = useState<CardStyle>('dark');

  if (!post) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.statusBarSpacer} />
        <View style={styles.header}>
          <AnimatedPressable onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="close" size={20} color={colors.text} />
          </AnimatedPressable>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={{ color: colors.textSecondary }}>포스트를 찾을 수 없어요</Text>
        </View>
      </View>
    );
  }

  const style = CARD_STYLES.find((s) => s.key === cardStyle)!;
  const imageUrl = post.thumbnail_urls[0] || post.image_urls[0];

  const handleSave = () => {
    showToast('카드가 갤러리에 저장되었어요!');
  };

  const handleShare = () => {
    showToast('공유 시트가 열립니다.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.statusBarSpacer} />

      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </AnimatedPressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>공유 카드</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Card Preview */}
      <Animated.View entering={FadeInDown.duration(200)} style={styles.cardContainer}>
        <View style={[styles.card, { backgroundColor: style.bg }]}>
          {/* Food Photo */}
          <View style={styles.cardPhotoWrap}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.cardPhoto} contentFit="cover" />
            ) : (
              <View style={[styles.cardPhoto, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="image-outline" size={40} color={colors.textTertiary} />
              </View>
            )}
          </View>

          {/* Info overlay */}
          <View style={styles.cardInfo}>
            {post.menu_name ? (
              <Text style={[styles.cardMenuName, { color: style.text }]} numberOfLines={1}>
                {post.menu_name}
              </Text>
            ) : null}

            <View style={styles.cardRatingRow}>
              <Text style={[styles.cardStars, { color: '#FFB800' }]}>
                {formatStars(post.rating)}
              </Text>
              <Text style={[styles.cardScore, { color: style.text }]}>
                {post.rating.toFixed(1)}
              </Text>
            </View>

            {post.restaurant?.name ? (
              <View style={styles.cardLocationRow}>
                <Ionicons name="location-outline" size={14} color={style.subtext} />
                <Text style={[styles.cardLocation, { color: style.subtext }]} numberOfLines={1}>
                  {post.restaurant.name}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Branding */}
          <View style={styles.cardBrand}>
            <Text style={{ fontSize: 12 }}>🍽️</Text>
            <Text style={[styles.brandText, { color: style.subtext }]}>Food Diary</Text>
            <Text style={[styles.brandDate, { color: style.subtext }]}>
              · {formatDate(post.created_at)}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View entering={FadeInDown.delay(40).duration(200)} style={styles.btnRow}>
        <AnimatedPressable onPress={handleSave} style={[styles.actionBtn, { backgroundColor: colors.surface }]}>
          <Ionicons name="download-outline" size={18} color={colors.text} />
          <Text style={[styles.actionBtnText, { color: colors.text }]}>저장</Text>
        </AnimatedPressable>
        <AnimatedPressable onPress={handleShare} style={[styles.actionBtn, { backgroundColor: '#FF6B6B' }]}>
          <Ionicons name="share-outline" size={18} color="#FFFFFF" />
          <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>공유</Text>
        </AnimatedPressable>
      </Animated.View>

      {/* Style Selector */}
      <Animated.View entering={FadeInDown.delay(80).duration(200)} style={styles.styleSection}>
        <Text style={[styles.styleLabel, { color: colors.text }]}>카드 스타일</Text>
        <View style={styles.styleRow}>
          {CARD_STYLES.map((s) => (
            <AnimatedPressable
              key={s.key}
              onPress={() => setCardStyle(s.key)}
              style={[
                styles.styleBtn,
                { backgroundColor: s.swatch },
                s.key === 'light' && styles.styleBtnLight,
                cardStyle === s.key && styles.styleBtnActive,
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarSpacer: {
    height: 54,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 54,
    paddingHorizontal: 20,
  },
  closeBtn: {
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  card: {
    width: 320,
    height: 480,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardPhotoWrap: {
    width: 320,
    height: 300,
  },
  cardPhoto: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 6,
  },
  cardMenuName: {
    fontSize: 22,
    fontWeight: '700',
  },
  cardRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardStars: {
    fontSize: 16,
  },
  cardScore: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardLocation: {
    fontSize: 13,
  },
  cardBrand: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandText: {
    fontSize: 11,
    fontWeight: '600',
  },
  brandDate: {
    fontSize: 11,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 35,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  styleSection: {
    paddingHorizontal: 35,
    marginTop: 24,
    gap: 12,
  },
  styleLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  styleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  styleBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  styleBtnLight: {
    borderWidth: 1,
    borderColor: '#333333',
  },
  styleBtnActive: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
});
