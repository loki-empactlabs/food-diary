// Mock Supabase client before importing the store
jest.mock('@/src/services/supabase/client', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(() => ({ select: jest.fn(), insert: jest.fn(), delete: jest.fn(), update: jest.fn() })),
  },
  isConfigured: false,
}));

jest.mock('@/src/services/supabase/storage', () => ({
  uploadFoodImage: jest.fn(),
  uploadThumbnail: jest.fn(),
}));

jest.mock('@/src/services/supabase/posts', () => ({
  fetchPosts: jest.fn(),
  createPost: jest.fn(),
  deletePost: jest.fn(),
  toggleLike: jest.fn(),
  fetchComments: jest.fn(),
  addComment: jest.fn(),
  deleteComment: jest.fn(),
  updatePost: jest.fn(),
}));

import { usePostStore } from '../postStore';

// In test environment, isConfigured === false, so stores use mock data.

// Helper to get a fresh snapshot of the store state
const getState = () => usePostStore.getState();

beforeEach(() => {
  // Reset the store to its initial state before each test.
  // Since isConfigured is false, the store initializes with MOCK_POSTS/MOCK_COMMENTS.
  usePostStore.setState({
    posts: [
      {
        id: '1',
        user_id: 'dev-user',
        restaurant_id: 'r1',
        image_urls: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80'],
        thumbnail_urls: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=60'],
        rating: 5,
        comment: '도우가 정말 바삭하고 치즈가 쭉쭉 늘어나요.',
        menu_name: '마르게리타 피자',
        price: 18000,
        tags: ['피자', '이탈리안', '강남맛집'],
        location: { latitude: 37.4979, longitude: 127.0276 },
        is_public: true,
        created_at: '2026-02-06T12:00:00Z',
        updated_at: '2026-02-06T12:00:00Z',
        user: { id: 'dev-user', display_name: '김지우', avatar_url: null },
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
        comment: '국물이 진하고 면발이 쫄깃해서 좋았어요.',
        menu_name: '돈코츠 라멘',
        price: 12000,
        tags: ['라멘', '일식', '홍대'],
        location: { latitude: 37.5563, longitude: 126.9236 },
        is_public: true,
        created_at: '2026-01-22T18:30:00Z',
        updated_at: '2026-01-22T18:30:00Z',
        user: { id: 'dev-user', display_name: '김지우', avatar_url: null },
        restaurant: { id: 'r2', name: '멘야하나비 홍대점', address: '서울 마포구' },
        _count: { likes: 8, comments: 1 },
        is_liked: true,
      },
    ],
    comments: [
      {
        id: 'c1',
        post_id: '1',
        user_id: 'user-2',
        content: '여기 피자 진짜 맛있죠!',
        parent_id: null,
        created_at: '2026-02-28T14:00:00Z',
        user: { id: 'user-2', display_name: '맛집헌터', avatar_url: null },
      },
      {
        id: 'c2',
        post_id: '1',
        user_id: 'user-3',
        content: '다른 메뉴도 추천해요?',
        parent_id: null,
        created_at: '2026-02-28T15:30:00Z',
        user: { id: 'user-3', display_name: '먹보킹', avatar_url: null },
      },
      {
        id: 'c3',
        post_id: '1',
        user_id: 'dev-user',
        content: '디아볼라도 맛있어요!',
        parent_id: 'c2',
        created_at: '2026-02-28T16:00:00Z',
        user: { id: 'dev-user', display_name: '김지우', avatar_url: null },
      },
    ],
    isLoaded: true,
  });
});

describe('postStore', () => {
  describe('initial state', () => {
    it('should have posts loaded', () => {
      const { posts, isLoaded } = getState();
      expect(isLoaded).toBe(true);
      expect(posts.length).toBe(2);
    });

    it('should have comments loaded', () => {
      const { comments } = getState();
      expect(comments.length).toBe(3);
    });
  });

  describe('loadPosts', () => {
    it('should be a no-op when Supabase is not configured', async () => {
      const postsBefore = getState().posts;
      await getState().loadPosts();
      // Posts remain the same since isConfigured is false
      expect(getState().posts).toBe(postsBefore);
    });
  });

  describe('getPost', () => {
    it('should return a post by id', () => {
      const post = getState().getPost('1');
      expect(post).toBeDefined();
      expect(post!.id).toBe('1');
      expect(post!.menu_name).toBe('마르게리타 피자');
    });

    it('should return undefined for non-existent post', () => {
      const post = getState().getPost('non-existent');
      expect(post).toBeUndefined();
    });
  });

  describe('addPost', () => {
    it('should add a new post to the beginning of the list', async () => {
      const initialCount = getState().posts.length;

      await getState().addPost({
        user_id: 'dev-user',
        restaurant_id: null,
        image_urls: ['https://example.com/photo.jpg'],
        thumbnail_urls: ['https://example.com/photo-thumb.jpg'],
        rating: 4,
        comment: 'Test comment',
        menu_name: 'Test Food',
        price: 10000,
        tags: ['test'],
        location: null,
        is_public: true,
        _count: { likes: 0, comments: 0 },
        is_liked: false,
      });

      const { posts } = getState();
      expect(posts.length).toBe(initialCount + 1);
      // New post should be first (prepended)
      expect(posts[0].menu_name).toBe('Test Food');
      expect(posts[0].rating).toBe(4);
      expect(posts[0].id).toMatch(/^temp-/);
    });

    it('should generate a temporary id and timestamps', async () => {
      await getState().addPost({
        user_id: 'dev-user',
        restaurant_id: null,
        image_urls: ['https://example.com/photo.jpg'],
        thumbnail_urls: [],
        rating: 3,
        comment: null,
        menu_name: null,
        price: null,
        tags: [],
        location: null,
        is_public: true,
        _count: { likes: 0, comments: 0 },
        is_liked: false,
      });

      const newPost = getState().posts[0];
      expect(newPost.id).toMatch(/^temp-\d+$/);
      expect(newPost.created_at).toBeDefined();
      expect(newPost.updated_at).toBeDefined();
    });
  });

  describe('deletePost', () => {
    it('should remove a post by id', () => {
      getState().deletePost('1');

      const { posts } = getState();
      expect(posts.length).toBe(1);
      expect(posts.find((p) => p.id === '1')).toBeUndefined();
    });

    it('should also remove comments for the deleted post', () => {
      // Post '1' has 3 comments (c1, c2, c3)
      getState().deletePost('1');

      const { comments } = getState();
      const postComments = comments.filter((c) => c.post_id === '1');
      expect(postComments.length).toBe(0);
    });

    it('should not affect other posts', () => {
      getState().deletePost('1');

      const post2 = getState().getPost('2');
      expect(post2).toBeDefined();
      expect(post2!.id).toBe('2');
    });
  });

  describe('toggleLike', () => {
    it('should toggle is_liked from false to true and increment likes count', () => {
      const post = getState().getPost('1')!;
      expect(post.is_liked).toBe(false);
      const originalLikes = post._count!.likes;

      getState().toggleLike('1');

      const updated = getState().getPost('1')!;
      expect(updated.is_liked).toBe(true);
      expect(updated._count!.likes).toBe(originalLikes + 1);
    });

    it('should toggle is_liked from true to false and decrement likes count', () => {
      // Post '2' starts with is_liked: true
      const post = getState().getPost('2')!;
      expect(post.is_liked).toBe(true);
      const originalLikes = post._count!.likes;

      getState().toggleLike('2');

      const updated = getState().getPost('2')!;
      expect(updated.is_liked).toBe(false);
      expect(updated._count!.likes).toBe(originalLikes - 1);
    });

    it('should toggle back and forth correctly', () => {
      const originalLikes = getState().getPost('1')!._count!.likes;

      getState().toggleLike('1'); // false -> true
      expect(getState().getPost('1')!.is_liked).toBe(true);
      expect(getState().getPost('1')!._count!.likes).toBe(originalLikes + 1);

      getState().toggleLike('1'); // true -> false
      expect(getState().getPost('1')!.is_liked).toBe(false);
      expect(getState().getPost('1')!._count!.likes).toBe(originalLikes);
    });
  });

  describe('updatePost', () => {
    it('should update the rating of a post', () => {
      getState().updatePost('1', { rating: 3 });

      const updated = getState().getPost('1')!;
      expect(updated.rating).toBe(3);
    });

    it('should update the comment of a post', () => {
      getState().updatePost('1', { comment: 'Updated comment' });

      const updated = getState().getPost('1')!;
      expect(updated.comment).toBe('Updated comment');
    });

    it('should update tags of a post', () => {
      getState().updatePost('1', { tags: ['new-tag', 'another'] });

      const updated = getState().getPost('1')!;
      expect(updated.tags).toEqual(['new-tag', 'another']);
    });

    it('should update the updated_at timestamp', () => {
      const before = getState().getPost('1')!.updated_at;

      getState().updatePost('1', { rating: 2 });

      const after = getState().getPost('1')!.updated_at;
      expect(after).not.toBe(before);
    });

    it('should not affect other fields', () => {
      getState().updatePost('1', { rating: 2 });

      const updated = getState().getPost('1')!;
      expect(updated.menu_name).toBe('마르게리타 피자');
      expect(updated.comment).toBe('도우가 정말 바삭하고 치즈가 쭉쭉 늘어나요.');
    });
  });

  describe('getComments', () => {
    it('should return comments for a specific post', () => {
      const comments = getState().getComments('1');
      expect(comments.length).toBe(3);
      comments.forEach((c) => {
        expect(c.post_id).toBe('1');
      });
    });

    it('should return empty array for post with no comments', () => {
      const comments = getState().getComments('2');
      expect(comments.length).toBe(0);
    });
  });

  describe('addComment', () => {
    it('should add a comment to the comments list', () => {
      const initialCount = getState().comments.length;

      getState().addComment('1', 'New comment here');

      const { comments } = getState();
      expect(comments.length).toBe(initialCount + 1);

      const newComment = comments[comments.length - 1];
      expect(newComment.content).toBe('New comment here');
      expect(newComment.post_id).toBe('1');
      expect(newComment.user_id).toBe('dev-user');
      expect(newComment.parent_id).toBeNull();
    });

    it('should add a reply comment with parent_id', () => {
      getState().addComment('1', 'This is a reply', 'c1');

      const { comments } = getState();
      const reply = comments[comments.length - 1];
      expect(reply.content).toBe('This is a reply');
      expect(reply.parent_id).toBe('c1');
    });

    it('should increment the post comment count', () => {
      const before = getState().getPost('1')!._count!.comments;

      getState().addComment('1', 'Increment test');

      const after = getState().getPost('1')!._count!.comments;
      expect(after).toBe(before + 1);
    });

    it('should assign a temporary id', () => {
      getState().addComment('1', 'Temp id test');

      const { comments } = getState();
      const newComment = comments[comments.length - 1];
      expect(newComment.id).toMatch(/^c-temp-/);
    });
  });

  describe('deleteComment', () => {
    it('should remove a comment by id', () => {
      const initialCount = getState().comments.length;

      getState().deleteComment('c1');

      expect(getState().comments.length).toBe(initialCount - 1);
      expect(getState().comments.find((c) => c.id === 'c1')).toBeUndefined();
    });

    it('should also remove child replies when deleting a parent comment', () => {
      // c3 has parent_id 'c2', so deleting c2 should also remove c3
      getState().deleteComment('c2');

      const { comments } = getState();
      expect(comments.find((c) => c.id === 'c2')).toBeUndefined();
      expect(comments.find((c) => c.id === 'c3')).toBeUndefined();
    });

    it('should decrement the post comment count', () => {
      const before = getState().getPost('1')!._count!.comments;

      getState().deleteComment('c1');

      const after = getState().getPost('1')!._count!.comments;
      expect(after).toBe(before - 1);
    });

    it('should decrement by correct amount when deleting parent with replies', () => {
      const before = getState().getPost('1')!._count!.comments;

      // c2 has one child (c3), so 2 comments deleted
      getState().deleteComment('c2');

      const after = getState().getPost('1')!._count!.comments;
      expect(after).toBe(before - 2);
    });

    it('should be a no-op for non-existent comment', () => {
      const initialCount = getState().comments.length;

      getState().deleteComment('non-existent');

      expect(getState().comments.length).toBe(initialCount);
    });
  });
});
