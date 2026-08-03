// Mock Supabase client before importing the store
jest.mock('@/src/services/supabase/client', () => ({
  supabase: {},
  isConfigured: false,
}));

jest.mock('@/src/services/supabase/social', () => ({
  toggleFollow: jest.fn(() => Promise.resolve()),
  fetchNotifications: jest.fn(),
  markNotificationRead: jest.fn(() => Promise.resolve()),
  markAllNotificationsRead: jest.fn(() => Promise.resolve()),
}));

import { useSocialStore } from '../socialStore';

// In test environment, isConfigured === false, so stores use mock data.

const getState = () => useSocialStore.getState();

beforeEach(() => {
  // Reset the store to a known state before each test
  useSocialStore.setState({
    users: [
      {
        id: 'user-2',
        display_name: '맛집헌터',
        avatar_url: null,
        bio: '서울 맛집 탐험가',
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
        bio: '먹는 것에 진심인 사람',
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
        bio: '카페 & 디저트 중심 기록',
        total_posts: 63,
        avg_rating: 4.5,
        followers_count: 241,
        following_count: 58,
        is_following: false,
      },
    ],
    notifications: [
      {
        id: 'n1',
        type: 'like' as const,
        user_id: 'dev-user',
        actor: { id: 'user-2', display_name: '맛집헌터', avatar_url: null },
        post: { id: '1', menu_name: '마르게리타 피자', thumbnail_url: null },
        message: '맛집헌터님이 좋아요를 눌렀습니다',
        is_read: false,
        created_at: '2026-02-28T18:00:00Z',
      },
      {
        id: 'n2',
        type: 'comment' as const,
        user_id: 'dev-user',
        actor: { id: 'user-3', display_name: '먹보킹', avatar_url: null },
        post: { id: '1', menu_name: '마르게리타 피자', thumbnail_url: null },
        message: '먹보킹님이 댓글을 남겼습니다',
        is_read: false,
        created_at: '2026-02-28T15:30:00Z',
      },
      {
        id: 'n3',
        type: 'follow' as const,
        user_id: 'dev-user',
        actor: { id: 'user-4', display_name: '디저트러버', avatar_url: null },
        message: '디저트러버님이 팔로우했습니다',
        is_read: true,
        created_at: '2026-02-27T10:00:00Z',
      },
    ],
    isLoaded: true,
  });
});

describe('socialStore', () => {
  describe('initial state', () => {
    it('should have users loaded', () => {
      const { users } = getState();
      expect(users.length).toBe(3);
    });

    it('should have notifications loaded', () => {
      const { notifications, isLoaded } = getState();
      expect(isLoaded).toBe(true);
      expect(notifications.length).toBe(3);
    });
  });

  describe('loadNotifications', () => {
    it('should be a no-op when Supabase is not configured', async () => {
      const notifsBefore = getState().notifications;
      await getState().loadNotifications();
      // Notifications remain the same since isConfigured is false
      expect(getState().notifications).toBe(notifsBefore);
    });
  });

  describe('getUser', () => {
    it('should return a user by id', () => {
      const user = getState().getUser('user-2');
      expect(user).toBeDefined();
      expect(user!.display_name).toBe('맛집헌터');
      expect(user!.id).toBe('user-2');
    });

    it('should return undefined for non-existent user', () => {
      const user = getState().getUser('non-existent');
      expect(user).toBeUndefined();
    });

    it('should return correct user profile fields', () => {
      const user = getState().getUser('user-4')!;
      expect(user.display_name).toBe('디저트러버');
      expect(user.total_posts).toBe(63);
      expect(user.avg_rating).toBe(4.5);
      expect(user.followers_count).toBe(241);
      expect(user.following_count).toBe(58);
      expect(user.is_following).toBe(false);
    });
  });

  describe('toggleFollow', () => {
    it('should toggle is_following from false to true and increment followers_count', () => {
      const user = getState().getUser('user-2')!;
      expect(user.is_following).toBe(false);
      const originalFollowers = user.followers_count;

      getState().toggleFollow('user-2');

      const updated = getState().getUser('user-2')!;
      expect(updated.is_following).toBe(true);
      expect(updated.followers_count).toBe(originalFollowers + 1);
    });

    it('should toggle is_following from true to false and decrement followers_count', () => {
      // user-3 starts as is_following: true
      const user = getState().getUser('user-3')!;
      expect(user.is_following).toBe(true);
      const originalFollowers = user.followers_count;

      getState().toggleFollow('user-3');

      const updated = getState().getUser('user-3')!;
      expect(updated.is_following).toBe(false);
      expect(updated.followers_count).toBe(originalFollowers - 1);
    });

    it('should not affect other users', () => {
      const user4Before = getState().getUser('user-4')!;

      getState().toggleFollow('user-2');

      const user4After = getState().getUser('user-4')!;
      expect(user4After.is_following).toBe(user4Before.is_following);
      expect(user4After.followers_count).toBe(user4Before.followers_count);
    });

    it('should toggle back and forth correctly', () => {
      const originalFollowers = getState().getUser('user-2')!.followers_count;

      getState().toggleFollow('user-2'); // false -> true
      expect(getState().getUser('user-2')!.is_following).toBe(true);
      expect(getState().getUser('user-2')!.followers_count).toBe(originalFollowers + 1);

      getState().toggleFollow('user-2'); // true -> false
      expect(getState().getUser('user-2')!.is_following).toBe(false);
      expect(getState().getUser('user-2')!.followers_count).toBe(originalFollowers);
    });
  });

  describe('markNotificationRead', () => {
    it('should mark a notification as read', () => {
      const notif = getState().notifications.find((n) => n.id === 'n1')!;
      expect(notif.is_read).toBe(false);

      getState().markNotificationRead('n1');

      const updated = getState().notifications.find((n) => n.id === 'n1')!;
      expect(updated.is_read).toBe(true);
    });

    it('should not affect other notifications', () => {
      getState().markNotificationRead('n1');

      // n2 should still be unread
      const n2 = getState().notifications.find((n) => n.id === 'n2')!;
      expect(n2.is_read).toBe(false);

      // n3 should still be read
      const n3 = getState().notifications.find((n) => n.id === 'n3')!;
      expect(n3.is_read).toBe(true);
    });

    it('should be idempotent for already-read notifications', () => {
      // n3 is already read
      getState().markNotificationRead('n3');
      const n3 = getState().notifications.find((n) => n.id === 'n3')!;
      expect(n3.is_read).toBe(true);
    });
  });

  describe('markAllRead', () => {
    it('should mark all notifications as read', () => {
      // Before: n1 and n2 are unread
      expect(getState().notifications.filter((n) => !n.is_read).length).toBe(2);

      getState().markAllRead();

      const { notifications } = getState();
      notifications.forEach((n) => {
        expect(n.is_read).toBe(true);
      });
    });

    it('should be idempotent when all are already read', () => {
      getState().markAllRead();
      getState().markAllRead(); // Call again

      const { notifications } = getState();
      notifications.forEach((n) => {
        expect(n.is_read).toBe(true);
      });
    });
  });

  describe('unreadCount', () => {
    it('should return the number of unread notifications', () => {
      // n1 and n2 are unread
      expect(getState().unreadCount()).toBe(2);
    });

    it('should decrease when a notification is marked as read', () => {
      getState().markNotificationRead('n1');
      expect(getState().unreadCount()).toBe(1);
    });

    it('should be zero after markAllRead', () => {
      getState().markAllRead();
      expect(getState().unreadCount()).toBe(0);
    });
  });
});
