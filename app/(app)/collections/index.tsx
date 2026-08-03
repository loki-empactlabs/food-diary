import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { showToast } from '@/src/components/ui/Toast';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme';
import { useCollectionStore } from '@/src/stores/collectionStore';
import { usePostStore } from '@/src/stores/postStore';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';

export default function CollectionsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const collections = useCollectionStore((s) => s.collections);
  const posts = usePostStore((s) => s.posts);

  // Get cover image for a collection (first post's thumbnail)
  const getCoverImage = (postIds: string[]): string | null => {
    for (const id of postIds) {
      const post = posts.find((p) => p.id === id);
      if (post) return post.thumbnail_urls[0] || post.image_urls[0] || null;
    }
    return null;
  };

  // Build 2-column rows
  const rows = useMemo(() => {
    const result: (typeof collections[number] | null)[][] = [];
    for (let i = 0; i < collections.length; i += 2) {
      result.push([
        collections[i],
        i + 1 < collections.length ? collections[i + 1] : null,
      ]);
    }
    return result;
  }, [collections]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.statusBarSpacer} />

      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </AnimatedPressable>

        <Text style={[styles.title, { color: colors.text }]}>컬렉션</Text>

        <AnimatedPressable
          onPress={() => showToast('컬렉션 만들기 기능은 준비 중입니다.')}
          style={[styles.addBtn, { backgroundColor: 'rgba(255,107,107,0.15)' }]}
        >
          <Ionicons name="add" size={20} color="#FF6B6B" />
        </AnimatedPressable>
      </View>

      {/* Collections Grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {rows.map((row, rowIndex) => (
          <Animated.View key={rowIndex} style={styles.row} entering={FadeInDown.delay(rowIndex * 40).duration(200)}>
            {row.map((collection, colIndex) => {
              if (!collection) {
                return <View key={`empty-${colIndex}`} style={styles.cardWrapper} />;
              }

              const coverImage = getCoverImage(collection.post_ids);

              return (
                <AnimatedPressable
                  key={collection.id}
                  style={styles.cardWrapper}
                  onPress={() =>
                    router.push(`/(app)/collections/${collection.id}` as any)
                  }
                >
                  <View style={[styles.thumb, { backgroundColor: colors.surface }]}>
                    {coverImage ? (
                      <Image
                        source={{ uri: coverImage }}
                        style={styles.thumbImage}
                        contentFit="cover"
                      />
                    ) : (
                      <Ionicons name="images-outline" size={32} color={colors.textTertiary} />
                    )}
                  </View>
                  <View style={styles.cardInfo}>
                    <Text
                      style={[styles.cardName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {collection.name}
                    </Text>
                    <Text style={[styles.cardCount, { color: colors.textSecondary }]}>
                      {collection.post_ids.length}개
                    </Text>
                  </View>
                </AnimatedPressable>
              );
            })}
          </Animated.View>
        ))}
      </ScrollView>
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  cardWrapper: {
    flex: 1,
  },
  thumb: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    paddingHorizontal: 4,
    paddingTop: 8,
    gap: 2,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardCount: {
    fontSize: 12,
  },
});
