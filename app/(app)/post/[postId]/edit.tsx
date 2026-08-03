import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { showToast } from '@/src/components/ui/Toast';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { StarRating } from '@/src/components/ui/StarRating';
import { RatingBottomSheet } from '@/src/components/ui/RatingBottomSheet';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';
import { usePostStore } from '@/src/stores/postStore';

export default function EditPostScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const post = usePostStore((s) => s.getPost(postId ?? ''));
  const updatePost = usePostStore((s) => s.updatePost);

  const [rating, setRating] = useState(post?.rating ?? 0);
  const [menuName, setMenuName] = useState(post?.menu_name ?? '');
  const [comment, setComment] = useState(post?.comment ?? '');
  const [tags, setTags] = useState<string[]>(post?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showRatingSheet, setShowRatingSheet] = useState(false);

  if (!post) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={{ color: colors.textSecondary }}>게시물을 찾을 수 없습니다.</Text>
        </View>
      </View>
    );
  }

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = () => {
    if (rating === 0) { showToast('별점을 선택해주세요.'); return; }

    setIsSaving(true);
    updatePost(post.id, {
      rating,
      comment: comment.trim() || null,
      menu_name: menuName.trim() || null,
      tags,
    });
    setIsSaving(false);
    router.back();
  };

  const canSave = rating > 0;
  const imageUri = post.image_urls[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.closeWrap}>
          <AnimatedPressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.text} />
          </AnimatedPressable>
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>수정하기</Text>
        <AnimatedPressable
          onPress={handleSave}
          disabled={!canSave || isSaving}
          style={[
            styles.saveBtn,
            { backgroundColor: canSave ? colors.primary : colors.borderLight },
          ]}
        >
          <Text style={[styles.saveBtnText, { color: canSave ? '#FFFFFF' : colors.textTertiary }]}>
            {isSaving ? '저장 중...' : '저장'}
          </Text>
        </AnimatedPressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo (read-only display) */}
        <View style={styles.photoArea}>
          <Image source={{ uri: imageUri }} style={styles.photo} contentFit="cover" />
        </View>

        {/* Form */}
        <View style={styles.formArea}>
          {/* Rating */}
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>별점</Text>
            <AnimatedPressable
              onPress={() => setShowRatingSheet(true)}
              style={[
                styles.ratingCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: rating > 0 ? colors.primary : colors.borderLight,
                },
              ]}
              scaleTarget={0.98}
            >
              <View style={styles.ratingLeft}>
                <StarRating rating={Math.round(rating)} size={22} readonly />
                <Text style={[styles.ratingNumber, { color: rating > 0 ? colors.primary : colors.textTertiary }]}>
                  {rating > 0 ? rating.toFixed(1) : '0.0'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </AnimatedPressable>
          </View>

          {/* Memo */}
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>메모</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="이 음식에 대한 한 줄 메모"
              placeholderTextColor={colors.textTertiary}
              style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.borderLight, color: colors.text }]}
              maxLength={500}
            />
          </View>

          {/* Menu Name */}
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>메뉴명</Text>
            <TextInput
              value={menuName}
              onChangeText={setMenuName}
              placeholder="예: 크림파스타, 마라탕"
              placeholderTextColor={colors.textTertiary}
              style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.borderLight, color: colors.text }]}
              maxLength={50}
            />
          </View>

          {/* Tags */}
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>태그</Text>
            <View style={styles.tagsRow}>
              {tags.map((tag) => (
                <Animated.View key={tag} entering={ZoomIn.duration(150)} exiting={ZoomOut.duration(200)}>
                  <AnimatedPressable
                    onPress={() => handleRemoveTag(tag)}
                    style={[styles.tagChip, { backgroundColor: colors.primaryLight }]}
                    scaleTarget={0.9}
                  >
                    <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
                    <Ionicons name="close" size={12} color={colors.primary} style={{ marginLeft: 4 }} />
                  </AnimatedPressable>
                </Animated.View>
              ))}
              <View style={[styles.addTagChip, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <TextInput
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="+ 추가"
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.tagInputText, { color: colors.text }]}
                  onSubmitEditing={handleAddTag}
                  returnKeyType="done"
                  maxLength={20}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <RatingBottomSheet
        visible={showRatingSheet}
        initialRating={rating}
        onClose={() => setShowRatingSheet(false)}
        onConfirm={(newRating) => {
          setRating(newRating);
          setShowRatingSheet(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 54,
    paddingHorizontal: 20,
  },
  closeWrap: {
    width: 66,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  saveBtn: {
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  saveBtnText: { fontSize: 14, fontWeight: '700' },
  scrollContent: { paddingBottom: 40 },
  photoArea: {
    marginHorizontal: 20,
    height: 280,
    borderRadius: 34,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  formArea: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 24,
  },
  formSection: { gap: 10 },
  formLabel: { fontSize: 13, fontWeight: '600' },
  ratingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  ratingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingNumber: { fontSize: 16, fontWeight: '700' },
  formInput: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
  },
  tagText: { fontSize: 13, fontWeight: '600' },
  addTagChip: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  tagInputText: {
    fontSize: 13,
    paddingVertical: 6,
    minWidth: 50,
  },
});
