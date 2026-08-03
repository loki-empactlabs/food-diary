import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { showToast } from '@/src/components/ui/Toast';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { StarRating } from '@/src/components/ui/StarRating';
import { RatingBottomSheet } from '@/src/components/ui/RatingBottomSheet';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';
import { usePostStore } from '@/src/stores/postStore';
import { useAuthStore } from '@/src/stores/authStore';

export default function CreatePostScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ imageUri?: string }>();

  const [imageUri, setImageUri] = useState<string | null>(params.imageUri ?? null);
  const [rating, setRating] = useState(0);
  const [menuName, setMenuName] = useState('');
  const [comment, setComment] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showRatingSheet, setShowRatingSheet] = useState(false);

  // AI food recognition
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiConfidence, setAiConfidence] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAiSuggestion, setSelectedAiSuggestion] = useState<string | null>(null);

  // Auto tag suggestion engine
  const TAG_MAP: Record<string, string[]> = {
    '피자': ['피자', '이탈리안', '치즈', '토마토소스'],
    '파스타': ['파스타', '이탈리안', '면요리'],
    '라멘': ['라멘', '일식', '면요리', '국물'],
    '초밥': ['초밥', '일식', '스시'],
    '케이크': ['케이크', '디저트', '카페'],
    '빵': ['빵', '베이커리', '카페'],
    '커피': ['커피', '카페', '음료'],
    '떡볶이': ['떡볶이', '분식', '매운맛'],
    '치킨': ['치킨', '야식', '배달'],
    '삼겹살': ['삼겹살', '고기', '한식'],
    '제육': ['제육볶음', '한식', '정식'],
    '비빔밥': ['비빔밥', '한식', '정식'],
    '김치찌개': ['김치찌개', '한식', '국물'],
    '마라탕': ['마라탕', '중식', '매운맛'],
    '햄버거': ['햄버거', '패스트푸드', '미식'],
    '샐러드': ['샐러드', '건강식', '다이어트'],
    '크레이프': ['크레이프', '디저트', '카페'],
    '타코': ['타코', '멕시칸', '스트리트푸드'],
  };
  const DEFAULT_TAGS = ['맛집', '점심', '저녁', '혼밥', '데이트', '강남맛집'];

  const suggestedTags = useMemo(() => {
    const suggestions = new Set<string>();
    const menuLower = menuName.toLowerCase();

    // Match against menu name keywords
    for (const [keyword, tagList] of Object.entries(TAG_MAP)) {
      if (menuLower.includes(keyword)) {
        tagList.forEach((t) => suggestions.add(t));
      }
    }

    // If no matches, show defaults
    if (suggestions.size === 0) {
      DEFAULT_TAGS.forEach((t) => suggestions.add(t));
    }

    // Filter out already-added tags
    return Array.from(suggestions).filter((t) => !tags.includes(t)).slice(0, 6);
  }, [menuName, tags]);

  const handleAddSuggestedTag = (tag: string) => {
    if (!tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
    }
  };

  // Mock AI food recognition results keyed by image
  const AI_MOCK: Record<string, { suggestions: string[]; confidence: number }> = {
    default: { suggestions: ['비빔밥', '돌솥비빔밥', '전주비빔밥'], confidence: 95 },
  };

  const runAiRecognition = (uri: string) => {
    setIsAnalyzing(true);
    setAiSuggestions([]);
    setAiConfidence(0);
    setSelectedAiSuggestion(null);
    // Simulate AI delay
    setTimeout(() => {
      const result = AI_MOCK.default;
      setAiSuggestions(result.suggestions);
      setAiConfidence(result.confidence);
      setIsAnalyzing(false);
    }, 800);
  };

  const handleSelectAiSuggestion = (suggestion: string) => {
    setSelectedAiSuggestion(suggestion);
    setMenuName(suggestion);
  };

  const handlePickImage = async () => {
    if (Platform.OS === 'web') {
      const uri = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';
      setImageUri(uri);
      runAiRecognition(uri);
      return;
    }
  };

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

  const handleSave = async () => {
    if (!imageUri) { showToast('음식 사진을 선택해주세요.'); return; }
    if (rating === 0) { showToast('별점을 선택해주세요.'); return; }

    setIsSaving(true);
    const user = useAuthStore.getState().user;
    const userId = user?.id ?? 'dev-user';

    usePostStore.getState().addPost({
      user_id: userId,
      restaurant_id: restaurantName ? `r-${Date.now()}` : null,
      image_urls: [imageUri],
      thumbnail_urls: [imageUri],
      rating,
      comment: comment.trim() || null,
      menu_name: menuName.trim() || null,
      price: null,
      tags,
      location: null,
      is_public: true,
      user: {
        id: userId,
        display_name: user?.user_metadata?.display_name ?? '김지우',
        avatar_url: null,
      },
      restaurant: restaurantName
        ? { id: `r-${Date.now()}`, name: restaurantName.trim(), address: null }
        : undefined,
      _count: { likes: 0, comments: 0 },
      is_liked: false,
    });

    setIsSaving(false);
    router.back();
  };

  const canSave = imageUri && rating > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        {/* Close button in fixed-width container for centering */}
        <View style={styles.closeWrap}>
          <AnimatedPressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.text} />
          </AnimatedPressable>
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>기록하기</Text>
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
        {/* Photo Area */}
        <AnimatedPressable onPress={handlePickImage}>
          {imageUri ? (
            <View style={styles.photoArea}>
              <Image source={{ uri: imageUri }} style={styles.photo} contentFit="cover" />
              <View style={styles.editBadge}>
                <Ionicons name="image-outline" size={16} color="#FFFFFF" />
                <Text style={styles.editBadgeText}>변경</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.photoPlaceholder, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Ionicons name="camera-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                사진을 선택하세요
              </Text>
            </View>
          )}
        </AnimatedPressable>

        {/* AI Food Recognition */}
        {imageUri && (aiSuggestions.length > 0 || isAnalyzing) && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.aiSection}>
            <View style={styles.aiHeader}>
              <Text style={styles.aiIcon}>✨</Text>
              <Text style={[styles.aiTitle, { color: colors.text }]}>AI가 인식한 음식</Text>
              {aiConfidence > 0 && (
                <View style={styles.aiConfBadge}>
                  <Text style={styles.aiConfText}>{aiConfidence}%</Text>
                </View>
              )}
            </View>
            {isAnalyzing ? (
              <Text style={[styles.aiAnalyzing, { color: colors.textTertiary }]}>분석 중...</Text>
            ) : (
              <>
                <View style={styles.aiChipsRow}>
                  {aiSuggestions.map((s) => {
                    const isSelected = selectedAiSuggestion === s;
                    return (
                      <AnimatedPressable
                        key={s}
                        onPress={() => handleSelectAiSuggestion(s)}
                        style={[
                          styles.aiChip,
                          isSelected
                            ? { backgroundColor: colors.primary }
                            : { backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.aiChipText,
                            { color: isSelected ? '#FFFFFF' : colors.text },
                            isSelected && { fontWeight: '600' },
                          ]}
                        >
                          {s}
                        </Text>
                        {isSelected && <Text style={styles.aiChipCheck}>✓</Text>}
                      </AnimatedPressable>
                    );
                  })}
                </View>
                <Text style={[styles.aiHint, { color: colors.textTertiary }]}>
                  탭하여 음식 이름을 선택하세요
                </Text>
              </>
            )}
          </Animated.View>
        )}

        {/* Form */}
        <View style={styles.formArea}>
          {/* Rating Section */}
          <Animated.View entering={FadeInDown.delay(40).duration(200)} style={styles.formSection}>
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
          </Animated.View>

          {/* Memo Section */}
          <Animated.View entering={FadeInDown.delay(80).duration(200)} style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>메모</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="이 음식에 대한 한 줄 메모"
              placeholderTextColor={colors.textTertiary}
              style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.borderLight, color: colors.text }]}
              maxLength={500}
            />
          </Animated.View>

          {/* Menu Name Section */}
          <Animated.View entering={FadeInDown.delay(120).duration(200)} style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>메뉴명</Text>
            <TextInput
              value={menuName}
              onChangeText={setMenuName}
              placeholder="예: 크림파스타, 마라탕"
              placeholderTextColor={colors.textTertiary}
              style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.borderLight, color: colors.text }]}
              maxLength={50}
            />
          </Animated.View>

          {/* Location Section */}
          <Animated.View entering={FadeInDown.delay(160).duration(200)} style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>위치</Text>
            <View style={[styles.locationInput, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <TextInput
                value={restaurantName}
                onChangeText={setRestaurantName}
                placeholder="서울 강남구 역삼동"
                placeholderTextColor={colors.textTertiary}
                style={[styles.locationTextInput, { color: colors.text }]}
                maxLength={50}
              />
              <Ionicons name="location" size={18} color={colors.primary} />
            </View>
          </Animated.View>

          {/* Auto Tag Suggestions */}
          {suggestedTags.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200).duration(200)} style={styles.formSection}>
              <View style={styles.suggestHeader}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>추천 태그</Text>
                <View style={[styles.aiBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.aiBadgeText, { color: colors.primary }]}>AI</Text>
                </View>
              </View>
              <View style={styles.tagsRow}>
                {suggestedTags.map((tag) => (
                  <Animated.View key={`suggest-${tag}`} entering={ZoomIn.duration(150)}>
                    <AnimatedPressable
                      onPress={() => handleAddSuggestedTag(tag)}
                      style={[styles.suggestChip, { backgroundColor: colors.primaryLight }]}
                      scaleTarget={0.9}
                    >
                      <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
                    </AnimatedPressable>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Tags Section */}
          <Animated.View entering={FadeInDown.delay(240).duration(200)} style={styles.formSection}>
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
          </Animated.View>
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
  container: {
    flex: 1,
  },
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveBtn: {
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  photoArea: {
    marginHorizontal: 20,
    height: 350,
    borderRadius: 34,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  editBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1A1ACC',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  editBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  photoPlaceholder: {
    marginHorizontal: 20,
    height: 350,
    borderRadius: 34,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    marginTop: 8,
  },
  formArea: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 24,
  },
  formSection: {
    gap: 10,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
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
  ratingNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  formInput: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  locationTextInput: {
    flex: 1,
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
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
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
  suggestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiBadge: {
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  suggestChip: {
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  aiSection: {
    marginHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiIcon: {
    fontSize: 16,
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  aiConfBadge: {
    backgroundColor: 'rgba(68, 221, 102, 0.13)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  aiConfText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#44DD66',
  },
  aiAnalyzing: {
    fontSize: 13,
  },
  aiChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  aiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  aiChipText: {
    fontSize: 14,
  },
  aiChipCheck: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  aiHint: {
    fontSize: 12,
  },
});
