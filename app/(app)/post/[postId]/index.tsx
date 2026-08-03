import { useCallback, useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { usePostStore } from '@/src/stores/postStore';
import { useAuthStore } from '@/src/stores/authStore';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';
import { formatDistanceToNow, format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function PostDetailScreen() {
  const { colors, typography } = useTheme();
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const post = usePostStore((s) => s.getPost(postId ?? ''));
  const toggleLike = usePostStore((s) => s.toggleLike);
  const deletePost = usePostStore((s) => s.deletePost);
  const storeComments = usePostStore((s) => s.comments);
  const addComment = usePostStore((s) => s.addComment);
  const deleteComment = usePostStore((s) => s.deleteComment);
  const currentUser = useAuthStore((s) => s.user);

  const allComments = useMemo(
    () => storeComments.filter((c) => c.post_id === postId),
    [storeComments, postId]
  );

  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  // Bottom sheet style entrance for info card
  const sheetTranslateY = useSharedValue(300);
  const sheetOpacity = useSharedValue(0);

  useEffect(() => {
    sheetTranslateY.value = withSpring(0, { damping: 28, stiffness: 400, mass: 0.9 });
    sheetOpacity.value = withSpring(1, { damping: 28, stiffness: 400, mass: 0.9 });
  }, []);

  const sheetEnterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
    opacity: sheetOpacity.value,
  }));

  // Heart animation
  const heartScale = useSharedValue(1);
  const glowScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const handleLike = useCallback(() => {
    const willLike = !post?.is_liked;
    toggleLike(post!.id);
    if (willLike) {
      heartScale.value = withSequence(
        withSpring(1.3, { damping: 6, stiffness: 300 }),
        withSpring(1, { damping: 14, stiffness: 280 })
      );
      glowScale.value = 0.5;
      glowOpacity.value = 0.6;
      glowScale.value = withSpring(2.5, { damping: 12, stiffness: 200 });
      glowOpacity.value = withSpring(0, { damping: 12, stiffness: 200 });
    } else {
      heartScale.value = withSequence(
        withSpring(0.85, { damping: 10, stiffness: 300 }),
        withSpring(1, { damping: 14, stiffness: 280 })
      );
    }
  }, [post?.is_liked, post?.id, toggleLike]);

  const organizedComments = useMemo(() => {
    const topLevel = allComments.filter((c) => !c.parent_id);
    return topLevel.map((comment) => ({
      ...comment,
      replies: allComments.filter((c) => c.parent_id === comment.id),
    }));
  }, [allComments]);

  const handleSubmitComment = () => {
    const text = commentText.trim();
    if (!text || !postId) return;
    addComment(postId, text, replyTo?.id);
    setCommentText('');
    setReplyTo(null);
  };

  if (!post) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <AnimatedPressable onPress={() => router.back()} style={[styles.overlayBtn, { top: 16, left: 20 }]}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </AnimatedPressable>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            게시물을 찾을 수 없습니다.
          </Text>
        </View>
      </View>
    );
  }

  const isOwner = currentUser?.id === post.user_id || post.user_id === 'dev-user';
  const createdDate = new Date(post.created_at);
  const dateString = format(createdDate, 'yyyy년 M월 d일 EEEE', { locale: ko });
  const timeString = format(createdDate, 'a h:mm', { locale: ko });

  const handleDelete = () => {
    Alert.alert('삭제 확인', '이 기록을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => { deletePost(post.id); router.back(); } },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Photo with overlay buttons */}
        <View style={styles.photoSection}>
          <Image
            source={{ uri: post.image_urls[0] }}
            style={styles.detailPhoto}
            contentFit="cover"
            transition={200}
          />
          {/* Back button */}
          <AnimatedPressable onPress={() => router.back()} style={[styles.overlayBtn, { top: 16, left: 20, backdropFilter: 'blur(7.5px)', WebkitBackdropFilter: 'blur(7.5px)' } as any]}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </AnimatedPressable>
          {/* Edit button (owner only) */}
          {isOwner && (
            <AnimatedPressable
              onPress={() => router.push(`/(app)/post/${post.id}/edit` as any)}
              style={[styles.overlayBtn, { top: 16, right: 68, backdropFilter: 'blur(7.5px)', WebkitBackdropFilter: 'blur(7.5px)' } as any]}
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
            </AnimatedPressable>
          )}
          {/* More button */}
          <AnimatedPressable
            onPress={isOwner ? handleDelete : undefined}
            style={[styles.overlayBtn, { top: 16, right: 20, backdropFilter: 'blur(7.5px)', WebkitBackdropFilter: 'blur(7.5px)' } as any]}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color="#FFFFFF" />
          </AnimatedPressable>
        </View>

        {/* Info + Comments - bottom sheet style entrance */}
        <Animated.View style={sheetEnterStyle}>

        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          {/* Top row: menu name + rating badge */}
          <View style={styles.topRow}>
            <Text style={[styles.menuName, { color: colors.text }]} numberOfLines={2}>
              {post.menu_name || '음식 기록'}
            </Text>
            <View style={[styles.ratingBadge, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="star" size={14} color={colors.starFilled} />
              <Text style={[styles.ratingBadgeText, { color: colors.primary }]}>
                {post.rating.toFixed(1)}
              </Text>
            </View>
          </View>

          {/* Memo area */}
          {post.comment && (
            <View style={styles.memoArea}>
              <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>메모</Text>
              <Text style={[styles.memoText, { color: colors.text }]}>{post.comment}</Text>
            </View>
          )}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Restaurant row */}
          {post.restaurant?.name && (
            <>
              <AnimatedPressable
                onPress={() => router.push(`/(app)/restaurant/${post.restaurant_id}` as any)}
                style={styles.infoRow}
              >
                <View style={[styles.infoIconBg, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="location" size={20} color={colors.primary} />
                </View>
                <View style={styles.infoTextArea}>
                  <Text style={[styles.infoTitle, { color: colors.text }]}>{post.restaurant.name}</Text>
                  {post.restaurant.address && (
                    <Text style={[styles.infoSubtitle, { color: colors.textSecondary }]}>{post.restaurant.address}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </AnimatedPressable>
              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
            </>
          )}

          {/* Date row */}
          <View style={styles.infoRow}>
            <View style={[styles.infoIconBg, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.infoTextArea}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>{dateString}</Text>
              <Text style={[styles.infoSubtitle, { color: colors.textSecondary }]}>{timeString}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={[styles.actionsRow, { borderTopColor: colors.borderLight }]}>
            <AnimatedPressable onPress={handleLike} style={styles.actionBtn}>
              <View style={styles.heartContainer}>
                <Animated.View style={[styles.heartGlow, { backgroundColor: colors.error }, glowAnimatedStyle]} />
                <Animated.View style={heartAnimatedStyle}>
                  <Ionicons
                    name={post.is_liked ? 'heart' : 'heart-outline'}
                    size={22}
                    color={post.is_liked ? colors.error : colors.icon}
                  />
                </Animated.View>
              </View>
              <Text style={[styles.actionText, { color: post.is_liked ? colors.error : colors.textSecondary }]}>
                {(post._count?.likes ?? 0) > 0 ? post._count!.likes : '좋아요'}
              </Text>
            </AnimatedPressable>
            <AnimatedPressable style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.icon} />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                {allComments.length > 0 ? allComments.length : '댓글'}
              </Text>
            </AnimatedPressable>
            <AnimatedPressable onPress={() => router.push(`/(app)/share/${post.id}` as any)} style={styles.actionBtn}>
              <Ionicons name="share-outline" size={20} color={colors.icon} />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>공유</Text>
            </AnimatedPressable>
          </View>
        </View>

        {/* Comments Section */}
        <View style={[styles.commentsSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.commentsTitle, { color: colors.text }]}>
            댓글 {allComments.length > 0 ? allComments.length : ''}
          </Text>

          {organizedComments.length === 0 ? (
            <View style={styles.emptyComments}>
              <Ionicons name="chatbubble-outline" size={32} color={colors.textTertiary} />
              <Text style={{ color: colors.textTertiary, fontSize: 13, marginTop: 8 }}>
                첫 번째 댓글을 남겨보세요
              </Text>
            </View>
          ) : (
            organizedComments.map((comment, commentIndex) => {
              const commentTime = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ko });
              const isMyComment = comment.user_id === currentUser?.id || comment.user_id === 'dev-user';

              return (
                <View key={comment.id}>
                  <View style={[styles.commentItem, { borderBottomColor: colors.borderLight }]}>
                    <View style={[styles.commentAvatar, { backgroundColor: colors.primaryLight }]}>
                      <Ionicons name="person" size={12} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <View style={styles.commentHeader}>
                        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>
                          {comment.user?.display_name ?? '익명'}
                        </Text>
                        <Text style={{ color: colors.textTertiary, fontSize: 11, marginLeft: 4 }}>
                          {commentTime}
                        </Text>
                        {isMyComment && (
                          <AnimatedPressable onPress={() => deleteComment(comment.id)} hitSlop={8} style={{ marginLeft: 'auto' }}>
                            <Ionicons name="close" size={14} color={colors.textTertiary} />
                          </AnimatedPressable>
                        )}
                      </View>
                      <Text style={{ color: colors.text, fontSize: 13, marginTop: 2 }}>{comment.content}</Text>
                      <AnimatedPressable onPress={() => setReplyTo({ id: comment.id, name: comment.user?.display_name ?? '익명' })} style={{ marginTop: 4 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 11 }}>답글</Text>
                      </AnimatedPressable>
                    </View>
                  </View>

                  {comment.replies.map((reply) => {
                    const replyTime = formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: ko });
                    const isMyReply = reply.user_id === currentUser?.id || reply.user_id === 'dev-user';
                    return (
                      <View key={reply.id} style={[styles.commentItem, { paddingLeft: 44, borderBottomColor: colors.borderLight }]}>
                        <View style={[styles.replyAvatar, { backgroundColor: colors.surfaceSecondary }]}>
                          <Ionicons name="person" size={10} color={colors.textSecondary} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 4 }}>
                          <View style={styles.commentHeader}>
                            <Text style={{ color: colors.text, fontSize: 11, fontWeight: '600' }}>{reply.user?.display_name ?? '익명'}</Text>
                            <Text style={{ color: colors.textTertiary, fontSize: 11, marginLeft: 4 }}>{replyTime}</Text>
                            {isMyReply && (
                              <AnimatedPressable onPress={() => deleteComment(reply.id)} hitSlop={8} style={{ marginLeft: 'auto' }}>
                                <Ionicons name="close" size={14} color={colors.textTertiary} />
                              </AnimatedPressable>
                            )}
                          </View>
                          <Text style={{ color: colors.text, fontSize: 13, marginTop: 2 }}>{reply.content}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}
        </View>

        </Animated.View>
      </ScrollView>

      {/* Comment Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.commentInputContainer, { backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
          {replyTo && (
            <View style={[styles.replyBanner, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={{ color: colors.textSecondary, fontSize: 11, flex: 1 }}>{replyTo.name}님에게 답글</Text>
              <AnimatedPressable onPress={() => setReplyTo(null)} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
              </AnimatedPressable>
            </View>
          )}
          <View style={styles.commentInputRow}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder={replyTo ? '답글을 입력하세요...' : '댓글을 입력하세요...'}
              placeholderTextColor={colors.textTertiary}
              style={[styles.commentInput, { backgroundColor: colors.surfaceSecondary, color: colors.text }]}
              multiline
              maxLength={500}
            />
            <AnimatedPressable
              onPress={handleSubmitComment}
              disabled={!commentText.trim()}
              style={[styles.sendButton, { backgroundColor: commentText.trim() ? colors.primary : colors.surfaceSecondary }]}
            >
              <Ionicons name="arrow-up" size={18} color={commentText.trim() ? '#FFFFFF' : colors.textTertiary} />
            </AnimatedPressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoSection: { position: 'relative' },
  detailPhoto: { width: '100%', height: 420 },
  overlayBtn: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1ACC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    marginTop: -36,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 28,
    paddingHorizontal: 24,
    gap: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuName: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 12 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ratingBadgeText: { fontSize: 14, fontWeight: '700' },
  memoArea: { gap: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '600' },
  memoText: { fontSize: 15, lineHeight: 22.5 },
  divider: { height: 1 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextArea: { flex: 1, gap: 3 },
  infoTitle: { fontSize: 15, fontWeight: '600' },
  infoSubtitle: { fontSize: 13 },
  actionsRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    paddingBottom: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  heartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartGlow: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  actionText: { fontSize: 13 },
  commentsSection: {
    marginTop: 8,
    padding: 24,
    paddingTop: 20,
  },
  commentsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  emptyComments: { alignItems: 'center', paddingVertical: 20 },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center' },
  commentInputContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentInputRow: { flexDirection: 'row', alignItems: 'flex-end' },
  commentInput: {
    flex: 1,
    maxHeight: 80,
    fontSize: 14,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 4,
    marginBottom: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
