// Mock Supabase client before importing the store
jest.mock('@/src/services/supabase/client', () => ({
  supabase: {},
  isConfigured: false,
}));

jest.mock('@/src/services/supabase/collections', () => ({
  fetchCollections: jest.fn(),
  createCollection: jest.fn(),
  deleteCollection: jest.fn(),
  addPostToCollection: jest.fn(),
  removePostFromCollection: jest.fn(),
}));

import { useCollectionStore } from '../collectionStore';

// In test environment, isConfigured === false, so stores use mock data.

const getState = () => useCollectionStore.getState();

beforeEach(() => {
  // Reset the store to a known state before each test
  useCollectionStore.setState({
    collections: [
      {
        id: 'all',
        name: '전체 기록',
        post_ids: ['1', '2', '3', '4'],
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'c1',
        name: '맛집 TOP',
        post_ids: ['1', '3'],
        created_at: '2026-02-20T00:00:00Z',
      },
      {
        id: 'c2',
        name: '디저트 모음',
        post_ids: ['3'],
        created_at: '2026-02-22T00:00:00Z',
      },
    ],
    isLoaded: true,
  });
});

describe('collectionStore', () => {
  describe('initial state', () => {
    it('should have collections loaded', () => {
      const { collections, isLoaded } = getState();
      expect(isLoaded).toBe(true);
      expect(collections.length).toBe(3);
    });
  });

  describe('loadCollections', () => {
    it('should be a no-op when Supabase is not configured', async () => {
      const collsBefore = getState().collections;
      await getState().loadCollections('dev-user');
      // Collections remain the same since isConfigured is false
      expect(getState().collections).toBe(collsBefore);
    });
  });

  describe('getCollection', () => {
    it('should return a collection by id', () => {
      const coll = getState().getCollection('c1');
      expect(coll).toBeDefined();
      expect(coll!.name).toBe('맛집 TOP');
      expect(coll!.post_ids).toEqual(['1', '3']);
    });

    it('should return the "all" collection', () => {
      const coll = getState().getCollection('all');
      expect(coll).toBeDefined();
      expect(coll!.name).toBe('전체 기록');
      expect(coll!.post_ids.length).toBe(4);
    });

    it('should return undefined for non-existent collection', () => {
      const coll = getState().getCollection('non-existent');
      expect(coll).toBeUndefined();
    });
  });

  describe('addCollection', () => {
    it('should add a new collection', () => {
      const initialCount = getState().collections.length;

      getState().addCollection('New Collection');

      const { collections } = getState();
      expect(collections.length).toBe(initialCount + 1);

      const newColl = collections[collections.length - 1];
      expect(newColl.name).toBe('New Collection');
      expect(newColl.post_ids).toEqual([]);
      expect(newColl.id).toMatch(/^col-temp-/);
    });

    it('should generate a temporary id and timestamp', () => {
      getState().addCollection('Temp Test');

      const { collections } = getState();
      const newColl = collections[collections.length - 1];
      expect(newColl.id).toMatch(/^col-temp-\d+$/);
      expect(newColl.created_at).toBeDefined();
    });

    it('should start with empty post_ids', () => {
      getState().addCollection('Empty Collection');

      const { collections } = getState();
      const newColl = collections[collections.length - 1];
      expect(newColl.post_ids).toEqual([]);
    });
  });

  describe('removeCollection', () => {
    it('should remove a collection by id', () => {
      const initialCount = getState().collections.length;

      getState().removeCollection('c1');

      const { collections } = getState();
      expect(collections.length).toBe(initialCount - 1);
      expect(collections.find((c) => c.id === 'c1')).toBeUndefined();
    });

    it('should NOT remove the "all" collection', () => {
      const initialCount = getState().collections.length;

      getState().removeCollection('all');

      const { collections } = getState();
      expect(collections.length).toBe(initialCount);
      expect(collections.find((c) => c.id === 'all')).toBeDefined();
    });

    it('should not affect other collections', () => {
      getState().removeCollection('c1');

      const c2 = getState().getCollection('c2');
      expect(c2).toBeDefined();
      expect(c2!.name).toBe('디저트 모음');
    });
  });

  describe('addPostToCollection', () => {
    it('should add a post id to the collection', () => {
      getState().addPostToCollection('c2', '1');

      const coll = getState().getCollection('c2')!;
      expect(coll.post_ids).toContain('1');
      expect(coll.post_ids).toContain('3'); // original post still there
    });

    it('should not add duplicate post ids', () => {
      // c2 already contains '3'
      const before = getState().getCollection('c2')!.post_ids.length;

      getState().addPostToCollection('c2', '3');

      const after = getState().getCollection('c2')!.post_ids.length;
      expect(after).toBe(before);
    });

    it('should not affect other collections', () => {
      const allBefore = getState().getCollection('all')!.post_ids.slice();

      getState().addPostToCollection('c2', '1');

      const allAfter = getState().getCollection('all')!.post_ids;
      expect(allAfter).toEqual(allBefore);
    });
  });

  describe('removePostFromCollection', () => {
    it('should remove a post id from the collection', () => {
      getState().removePostFromCollection('c1', '1');

      const coll = getState().getCollection('c1')!;
      expect(coll.post_ids).not.toContain('1');
      expect(coll.post_ids).toContain('3'); // other post still there
    });

    it('should be a no-op for post not in collection', () => {
      const before = getState().getCollection('c2')!.post_ids.slice();

      getState().removePostFromCollection('c2', '99');

      const after = getState().getCollection('c2')!.post_ids;
      expect(after).toEqual(before);
    });

    it('should not affect other collections', () => {
      const allBefore = getState().getCollection('all')!.post_ids.slice();

      getState().removePostFromCollection('c1', '1');

      const allAfter = getState().getCollection('all')!.post_ids;
      expect(allAfter).toEqual(allBefore);
    });
  });
});
