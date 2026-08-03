import { create } from 'zustand';
import type { FoodPost, Comment } from '@/src/types/post';
import { supabase, isConfigured } from '@/src/services/supabase/client';
import { uploadFoodImage, uploadThumbnail } from '@/src/services/supabase/storage';
import {
  fetchPosts,
  createPost as createPostService,
  deletePost as deletePostService,
  toggleLike as toggleLikeService,
  fetchComments,
  addComment as addCommentService,
  deleteComment as deleteCommentService,
  updatePost as updatePostService,
} from '@/src/services/supabase/posts';

// Mock data for development (used when Supabase not configured)
const MOCK_POSTS: FoodPost[] = [
  {
    id: '1',
    user_id: 'dev-user',
    restaurant_id: 'r1',
    image_urls: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80'],
    thumbnail_urls: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=60'],
    rating: 5,
    comment: '도우가 정말 바삭하고 치즈가 쭉쭉 늘어나요. 토핑도 신선하고 양이 넉넉해서 만족!',
    menu_name: '마르게리타 피자',
    price: 18000,
    tags: ['피자', '이탈리안', '강남맛집'],
    location: { latitude: 37.4979, longitude: 127.0276 },
    is_public: true,
    created_at: '2026-02-06T12:00:00Z',
    updated_at: '2026-02-06T12:00:00Z',
    user: { id: 'dev-user', display_name: 'Food Explorer', avatar_url: null },
    restaurant: { id: 'r1', name: '라 피아차 강남점', address: '서울 강남구' },
    _count: { likes: 12, comments: 3 },
    is_liked: false,
  },
  {
    id: '2',
    user_id: 'dev-user',
    restaurant_id: 'r2',
    image_urls: ['https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&q=80'],
    thumbnail_urls: ['https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&q=60'],
    rating: 4,
    comment: '국물이 진하고 면발이 쫄깃해서 좋았어요. 차슈도 부드럽고 맛있음.',
    menu_name: '돈코츠 라멘',
    price: 12000,
    tags: ['라멘', '일식', '홍대'],
    location: { latitude: 37.5563, longitude: 126.9236 },
    is_public: true,
    created_at: '2026-01-22T18:30:00Z',
    updated_at: '2026-01-22T18:30:00Z',
    user: { id: 'dev-user', display_name: 'Food Explorer', avatar_url: null },
    restaurant: { id: 'r2', name: '멘야하나비 홍대점', address: '서울 마포구' },
    _count: { likes: 8, comments: 1 },
    is_liked: true,
  },
  {
    id: '3',
    user_id: 'dev-user',
    restaurant_id: 'r3',
    image_urls: ['https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80'],
    thumbnail_urls: ['https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=60'],
    rating: 5,
    comment: '크림이 가볍고 딸기가 정말 달아요. 비주얼도 예쁘고 맛도 최고!',
    menu_name: '딸기 크레이프 케이크',
    price: 8500,
    tags: ['디저트', '케이크', '성수'],
    location: { latitude: 37.5445, longitude: 127.0567 },
    is_public: true,
    created_at: '2026-02-26T15:00:00Z',
    updated_at: '2026-02-26T15:00:00Z',
    user: { id: 'dev-user', display_name: 'Food Explorer', avatar_url: null },
    restaurant: { id: 'r3', name: '르 크레이프 성수', address: '서울 성동구' },
    _count: { likes: 24, comments: 5 },
    is_liked: false,
  },
  {
    id: '4',
    user_id: 'dev-user',
    restaurant_id: 'r4',
    image_urls: ['https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=800&q=80'],
    thumbnail_urls: ['https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=400&q=60'],
    rating: 3,
    comment: '양은 많은데 맛이 평범해요. 가성비는 좋지만 재방문은 글쎄.',
    menu_name: '제육볶음 정식',
    price: 9000,
    tags: ['한식', '정식', '회사밥'],
    location: { latitude: 37.5012, longitude: 127.0396 },
    is_public: true,
    created_at: '2026-02-25T12:30:00Z',
    updated_at: '2026-02-25T12:30:00Z',
    user: { id: 'dev-user', display_name: 'Food Explorer', avatar_url: null },
    restaurant: { id: 'r4', name: '엄마손 정식', address: '서울 강남구' },
    _count: { likes: 2, comments: 0 },
    is_liked: false,
  },
];

// Mock comments
const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    post_id: '1',
    user_id: 'user-2',
    content: '여기 피자 진짜 맛있죠! 저도 자주 가요 👍',
    parent_id: null,
    created_at: '2026-02-28T14:00:00Z',
    user: { id: 'user-2', display_name: '맛집헌터', avatar_url: null },
  },
  {
    id: 'c2',
    post_id: '1',
    user_id: 'user-3',
    content: '마르게리타 말고 다른 메뉴도 추천해요?',
    parent_id: null,
    created_at: '2026-02-28T15:30:00Z',
    user: { id: 'user-3', display_name: '먹보킹', avatar_url: null },
  },
  {
    id: 'c3',
    post_id: '1',
    user_id: 'dev-user',
    content: '디아볼라도 맛있어요! 매콤한 거 좋아하시면 추천!',
    parent_id: 'c2',
    created_at: '2026-02-28T16:00:00Z',
    user: { id: 'dev-user', display_name: 'Food Explorer', avatar_url: null },
  },
  {
    id: 'c4',
    post_id: '3',
    user_id: 'user-2',
    content: '우와 이거 비주얼 대박이다 🍓',
    parent_id: null,
    created_at: '2026-02-26T16:00:00Z',
    user: { id: 'user-2', display_name: '맛집헌터', avatar_url: null },
  },
  {
    id: 'c5',
    post_id: '3',
    user_id: 'user-4',
    content: '성수 가면 꼭 들려야겠다!',
    parent_id: null,
    created_at: '2026-02-26T17:00:00Z',
    user: { id: 'user-4', display_name: '디저트러버', avatar_url: null },
  },
  {
    id: 'c6',
    post_id: '3',
    user_id: 'user-3',
    content: '가격이 착하네요. 다음주에 가볼게요',
    parent_id: null,
    created_at: '2026-02-26T18:00:00Z',
    user: { id: 'user-3', display_name: '먹보킹', avatar_url: null },
  },
  {
    id: 'c7',
    post_id: '3',
    user_id: 'user-2',
    content: '저도 같이 가요! 맛집 투어 ㄱㄱ',
    parent_id: 'c6',
    created_at: '2026-02-26T18:30:00Z',
    user: { id: 'user-2', display_name: '맛집헌터', avatar_url: null },
  },
  {
    id: 'c8',
    post_id: '2',
    user_id: 'user-4',
    content: '홍대 라멘 맛집이군요. 메모!',
    parent_id: null,
    created_at: '2026-02-27T20:00:00Z',
    user: { id: 'user-4', display_name: '디저트러버', avatar_url: null },
  },
];

interface PostState {
  posts: FoodPost[];
  comments: Comment[];
  isLoaded: boolean;
  loadPosts: () => Promise<void>;
  loadComments: (postId: string) => Promise<void>;
  addPost: (post: Omit<FoodPost, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  toggleLike: (postId: string) => void;
  deletePost: (postId: string) => void;
  updatePost: (postId: string, updates: Partial<Pick<FoodPost, 'rating' | 'comment' | 'menu_name' | 'tags'>>) => void;
  getPost: (postId: string) => FoodPost | undefined;
  getComments: (postId: string) => Comment[];
  addComment: (postId: string, content: string, parentId?: string) => void;
  deleteComment: (commentId: string) => void;
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: isConfigured ? [] : MOCK_POSTS,
  comments: isConfigured ? [] : MOCK_COMMENTS,
  isLoaded: !isConfigured,

  loadPosts: async () => {
    if (!isConfigured) return;
    const { data, error } = await fetchPosts();
    if (error) {
      console.error('[postStore] loadPosts error:', error);
      return;
    }
    const mapped: FoodPost[] = (data || []).map((post: any) => ({
      ...post,
      thumbnail_urls: post.thumbnail_urls
        ? post.thumbnail_urls
        : post.thumbnail_url
          ? [post.thumbnail_url]
          : [],
      _count: {
        likes: post.likes_count ?? post._count?.likes ?? 0,
        comments: post.comments_count ?? post._count?.comments ?? 0,
      },
      is_liked: post.is_liked ?? false,
    }));
    set({ posts: mapped, isLoaded: true });
  },

  loadComments: async (postId: string) => {
    if (!isConfigured) return;
    const { data, error } = await fetchComments(postId);
    if (error) {
      console.error('[postStore] loadComments error:', error);
      return;
    }
    const fetched = (data || []) as Comment[];
    set((state) => ({
      comments: [
        ...state.comments.filter((c) => c.post_id !== postId),
        ...fetched,
      ],
    }));
  },

  addPost: async (postData) => {
    const tempId = `temp-${Date.now()}`;
    const newPost: FoodPost = {
      ...postData,
      id: tempId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    // Optimistic update
    set((state) => ({ posts: [newPost, ...state.posts] }));

    if (!isConfigured) return;

    // Upload images to storage if configured
    let imageUrls = postData.image_urls;
    let thumbnailUrl = postData.thumbnail_urls?.[0];

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (userId) {
        const tempPostId = `post-${Date.now()}`;
        for (let i = 0; i < postData.image_urls.length; i++) {
          const uri = postData.image_urls[i];
          if (uri.startsWith('http')) continue;

          const { url, error: uploadError } = await uploadFoodImage(userId, uri, tempPostId, i);
          if (url && !uploadError) {
            imageUrls = [...imageUrls];
            imageUrls[i] = url;
          } else {
            console.error('[postStore] uploadFoodImage error:', uploadError);
          }

          if (i === 0) {
            const { url: thumbUrl } = await uploadThumbnail(userId, uri, tempPostId, i);
            if (thumbUrl) thumbnailUrl = thumbUrl;
          }
        }
      }
    } catch (uploadErr) {
      console.error('[postStore] image upload failed, proceeding with original URIs:', uploadErr);
    }

    const { data, error } = await createPostService({
      image_urls: imageUrls,
      thumbnail_url: thumbnailUrl,
      rating: postData.rating,
      comment: postData.comment ?? undefined,
      menu_name: postData.menu_name ?? undefined,
      price: postData.price ?? undefined,
      tags: postData.tags,
      restaurant_id: postData.restaurant_id ?? undefined,
      location: postData.location ?? undefined,
    });

    if (error || !data) {
      console.error('[postStore] addPost error:', error);
      // Revert optimistic update
      set((state) => ({ posts: state.posts.filter((p) => p.id !== tempId) }));
      return;
    }

    // Replace temp post with real one
    const realPost: FoodPost = {
      ...(data as any),
      thumbnail_urls: (data as any).thumbnail_urls ?? [(data as any).thumbnail_url].filter(Boolean),
      _count: { likes: 0, comments: 0 },
      is_liked: false,
    };
    set((state) => ({
      posts: state.posts.map((p) => (p.id === tempId ? realPost : p)),
    }));
  },

  toggleLike: (postId) => {
    // Optimistic update
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id !== postId) return post;
        const isLiked = !post.is_liked;
        return {
          ...post,
          is_liked: isLiked,
          _count: {
            ...post._count!,
            likes: post._count!.likes + (isLiked ? 1 : -1),
          },
        };
      }),
    }));

    // Fire-and-forget Supabase call
    if (isConfigured) {
      toggleLikeService(postId).catch((err) => {
        console.error('[postStore] toggleLike error:', err);
      });
    }
  },

  deletePost: (postId) => {
    // Optimistic update
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== postId),
      comments: state.comments.filter((c) => c.post_id !== postId),
    }));

    if (isConfigured) {
      deletePostService(postId).catch((err) => {
        console.error('[postStore] deletePost error:', err);
      });
    }
  },

  updatePost: (postId, updates) => {
    // Optimistic update
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          ...updates,
          updated_at: new Date().toISOString(),
        };
      }),
    }));

    if (isConfigured) {
      const serviceUpdates: { rating?: number; comment?: string; menu_name?: string; tags?: string[] } = {
        rating: updates.rating,
        menu_name: updates.menu_name ?? undefined,
        tags: updates.tags,
        comment: updates.comment === null ? undefined : updates.comment,
      };
      updatePostService(postId, serviceUpdates).catch((err) => {
        console.error('[postStore] updatePost error:', err);
      });
    }
  },

  getPost: (postId) => {
    return get().posts.find((p) => p.id === postId);
  },

  getComments: (postId) => {
    return get().comments.filter((c) => c.post_id === postId);
  },

  addComment: (postId, content, parentId) => {
    const tempId = `c-temp-${Date.now()}`;
    const newComment: Comment = {
      id: tempId,
      post_id: postId,
      user_id: 'dev-user',
      content,
      parent_id: parentId ?? null,
      created_at: new Date().toISOString(),
      user: { id: 'dev-user', display_name: 'Food Explorer', avatar_url: null },
    };
    // Optimistic update
    set((state) => ({
      comments: [...state.comments, newComment],
      posts: state.posts.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          _count: {
            ...post._count!,
            comments: (post._count?.comments ?? 0) + 1,
          },
        };
      }),
    }));

    if (isConfigured) {
      addCommentService(postId, content, parentId)
        .then(({ data, error }) => {
          if (error || !data) {
            console.error('[postStore] addComment error:', error);
            return;
          }
          // Replace temp comment with real one
          set((state) => ({
            comments: state.comments.map((c) =>
              c.id === tempId ? (data as Comment) : c
            ),
          }));
        })
        .catch((err) => {
          console.error('[postStore] addComment error:', err);
        });
    }
  },

  deleteComment: (commentId) => {
    const comment = get().comments.find((c) => c.id === commentId);
    if (!comment) return;
    // Optimistic update
    set((state) => ({
      comments: state.comments.filter((c) => c.id !== commentId && c.parent_id !== commentId),
      posts: state.posts.map((post) => {
        if (post.id !== comment.post_id) return post;
        const deletedCount = state.comments.filter(
          (c) => c.id === commentId || c.parent_id === commentId
        ).length;
        return {
          ...post,
          _count: {
            ...post._count!,
            comments: Math.max(0, (post._count?.comments ?? 0) - deletedCount),
          },
        };
      }),
    }));

    if (isConfigured) {
      deleteCommentService(commentId).catch((err) => {
        console.error('[postStore] deleteComment error:', err);
      });
    }
  },
}));
