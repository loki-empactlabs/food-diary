import { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme';
import { useCollectionStore } from '@/src/stores/collectionStore';
import { usePostStore } from '@/src/stores/postStore';
import { FoodCard } from '@/src/components/food/FoodCard';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';
import type { FoodPost } from '@/src/types/post';

export default function CollectionDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { collectionId } = useLocalSearchParams<{ collectionId: string }>();

  const collection = useCollectionStore((s) =>
    s.collections.find((c) => c.id === collectionId)
  );
  const allPosts = usePostStore((s) => s.posts);

  const collectionPosts = useMemo(() => {
    if (!collection) return [];
    return collection.post_ids
      .map((id) => allPosts.find((p) => p.id === id))
      .filter(Boolean) as FoodPost[];
  }, [collection, allPosts]);

  if (!collection) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.statusBarSpacer} />
        <View style={styles.header}>
          <AnimatedPressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </AnimatedPressable>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            컬렉션을 찾을 수 없어요
          </Text>
        </View>
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: FoodPost; index: number }) => (
    <View style={styles.cardWrapper}>
      <FoodCard post={item} index={index} />
    </View>
  );

  const ListHeader = () => (
    <Animated.View style={styles.listHeader} entering={FadeInDown.delay(0).duration(200)}>
      <Text style={[styles.countText, { color: colors.textSecondary }]}>
        {collectionPosts.length}개의 기록
      </Text>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.statusBarSpacer} />

      <View style={styles.header}>
        <AnimatedPressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </AnimatedPressable>

        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {collection.name}
        </Text>

        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={collectionPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={
          collectionPosts.length === 0 ? { flex: 1 } : { paddingBottom: 40 }
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📷</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              아직 기록이 없어요
            </Text>
          </View>
        }
      />
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  countText: {
    fontSize: 13,
  },
  cardWrapper: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
