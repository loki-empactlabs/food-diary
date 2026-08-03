import { create } from 'zustand';
import type { UserProfile, Notification } from '@/src/types/post';
import { isConfigured } from '@/src/services/supabase/client';
import {
  toggleFollow as supabaseToggleFollow,
  fetchNotifications,
  markNotificationRead as supabaseMarkNotificationRead,
  markAllNotificationsRead,
} from '@/src/services/supabase/social';

// Mock user profiles
const MOCK_USERS: UserProfile[] = [
  {
    id: 'user-2',
    display_name: '맛집헌터',
    avatar_url: null,
    bio: '서울 맛집 탐험가 🍜 매일 새로운 맛을 찾아다닙니다',
    total_posts: 47,
    avg_rating: 4.2,
    followers_count: 128,
    following_count: 95,
    is_following: false,
  },
  {
    id: 'user-3',
    display_name: '먹보킹',
    avatar_url: null,
    bio: '먹는 것에 진심인 사람 👑 가성비 맛집 전문',
    total_posts: 31,
    avg_rating: 3.8,
    followers_count: 76,
    following_count: 112,
    is_following: true,
  },
  {
    id: 'user-4',
    display_name: '디저트러버',
    avatar_url: null,
    bio: '카페 & 디저트 중심 기록 🍰☕',
    total_posts: 63,
    avg_rating: 4.5,
    followers_count: 241,
    following_count: 58,
    is_following: false,
  },
  {
    id: 'dev-user',
    display_name: 'Food Explorer',
    avatar_url: null,
    bio: '음식 기록의 시작',
    total_posts: 4,
    avg_rating: 4.3,
    followers_count: 12,
    following_count: 23,
    is_following: false,
  },
];

// Mock notifications
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'like',
    user_id: 'dev-user',
    actor: { id: 'user-2', display_name: '맛집헌터', avatar_url: null },
    post: { id: '1', menu_name: '마르게리타 피자', thumbnail_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&q=60' },
    message: '맛집헌터님이 마르게리타 피자에 좋아요를 눌렀습니다',
    is_read: false,
    created_at: '2026-02-28T18:00:00Z',
  },
  {
    id: 'n2',
    type: 'comment',
    user_id: 'dev-user',
    actor: { id: 'user-3', display_name: '먹보킹', avatar_url: null },
    post: { id: '1', menu_name: '마르게리타 피자', thumbnail_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&q=60' },
    message: '먹보킹님이 댓글을 남겼습니다: "마르게리타 말고 다른 메뉴도 추천해요?"',
    is_read: false,
    created_at: '2026-02-28T15:30:00Z',
  },
  {
    id: 'n3',
    type: 'follow',
    user_id: 'dev-user',
    actor: { id: 'user-4', display_name: '디저트러버', avatar_url: null },
    message: '디저트러버님이 회원님을 팔로우했습니다',
    is_read: true,
    created_at: '2026-02-27T10:00:00Z',
  },
  {
    id: 'n4',
    type: 'like',
    user_id: 'dev-user',
    actor: { id: 'user-4', display_name: '디저트러버', avatar_url: null },
    post: { id: '3', menu_name: '딸기 크레이프 케이크', thumbnail_url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=100&q=60' },
    message: '디저트러버님이 딸기 크레이프 케이크에 좋아요를 눌렀습니다',
    is_read: true,
    created_at: '2026-02-26T20:00:00Z',
  },
  {
    id: 'n5',
    type: 'comment',
    user_id: 'dev-user',
    actor: { id: 'user-2', display_name: '맛집헌터', avatar_url: null },
    post: { id: '3', menu_name: '딸기 크레이프 케이크', thumbnail_url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=100&q=60' },
    message: '맛집헌터님이 댓글을 남겼습니다: "우와 이거 비주얼 대박이다 🍓"',
    is_read: true,
    created_at: '2026-02-26T16:00:00Z',
  },
  {
    id: 'n6',
    type: 'revisit',
    user_id: 'dev-user',
    post: { id: '2', menu_name: '돈코츠 라멘', thumbnail_url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=100&q=60' },
    message: '멘야하나비 홍대점 근처에 있어요! 지난번에 돈코츠 라멘을 드셨죠?',
    is_read: true,
    created_at: '2026-02-25T12:00:00Z',
  },
];

interface SocialState {
  users: UserProfile[];
  notifications: Notification[];
  isLoaded: boolean;
  getUser: (userId: string) => UserProfile | undefined;
  toggleFollow: (userId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllRead: () => void;
  unreadCount: () => number;
  loadNotifications: () => Promise<void>;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  users: MOCK_USERS,
  notifications: isConfigured ? [] : MOCK_NOTIFICATIONS,
  isLoaded: !isConfigured,

  getUser: (userId) => {
    return get().users.find((u) => u.id === userId);
  },

  toggleFollow: (userId) => {
    // Optimistic update
    set((state) => ({
      users: state.users.map((user) => {
        if (user.id !== userId) return user;
        const isFollowing = !user.is_following;
        return {
          ...user,
          is_following: isFollowing,
          followers_count: user.followers_count + (isFollowing ? 1 : -1),
        };
      }),
    }));
    // Fire-and-forget Supabase call
    supabaseToggleFollow(userId).catch(() => {
      // Revert on error
      set((state) => ({
        users: state.users.map((user) => {
          if (user.id !== userId) return user;
          const isFollowing = !user.is_following;
          return {
            ...user,
            is_following: isFollowing,
            followers_count: user.followers_count + (isFollowing ? 1 : -1),
          };
        }),
      }));
    });
  },

  markNotificationRead: (notificationId) => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ),
    }));
    // Fire-and-forget Supabase call
    supabaseMarkNotificationRead(notificationId).catch(() => {});
  },

  markAllRead: () => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
    }));
    // Fire-and-forget Supabase call
    markAllNotificationsRead().catch(() => {});
  },

  unreadCount: () => {
    return get().notifications.filter((n) => !n.is_read).length;
  },

  loadNotifications: async () => {
    if (!isConfigured) return;
    const { data } = await fetchNotifications();
    set({ notifications: data as Notification[], isLoaded: true });
  },
}));
