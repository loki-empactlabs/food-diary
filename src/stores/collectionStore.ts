import { create } from 'zustand';
import { isConfigured } from '@/src/services/supabase/client';
import {
  fetchCollections,
  createCollection as createCollectionService,
  deleteCollection as deleteCollectionService,
  addPostToCollection as addPostToCollectionService,
  removePostFromCollection as removePostFromCollectionService,
} from '@/src/services/supabase/collections';

export interface Collection {
  id: string;
  name: string;
  post_ids: string[];
  created_at: string;
}

const MOCK_COLLECTIONS: Collection[] = [
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
  {
    id: 'c3',
    name: '회사 근처',
    post_ids: ['4'],
    created_at: '2026-02-24T00:00:00Z',
  },
];

interface CollectionState {
  collections: Collection[];
  isLoaded: boolean;
  loadCollections: (userId: string) => Promise<void>;
  addCollection: (name: string) => void;
  removeCollection: (id: string) => void;
  addPostToCollection: (collectionId: string, postId: string) => void;
  removePostFromCollection: (collectionId: string, postId: string) => void;
  getCollection: (id: string) => Collection | undefined;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: isConfigured ? [] : MOCK_COLLECTIONS,
  isLoaded: !isConfigured,

  loadCollections: async (userId: string) => {
    if (!isConfigured) return;
    const { data, error } = await fetchCollections(userId);
    if (error) {
      console.error('[collectionStore] loadCollections error:', error);
      return;
    }
    const mapped: Collection[] = (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      post_ids: c.post_ids,
      created_at: c.created_at,
    }));
    set({ collections: mapped, isLoaded: true });
  },

  addCollection: (name) => {
    const tempId = `col-temp-${Date.now()}`;
    const newCollection: Collection = {
      id: tempId,
      name,
      post_ids: [],
      created_at: new Date().toISOString(),
    };
    // Optimistic update
    set((state) => ({ collections: [...state.collections, newCollection] }));

    if (!isConfigured) return;

    createCollectionService(name)
      .then(({ data, error }) => {
        if (error || !data) {
          console.error('[collectionStore] addCollection error:', error);
          // Revert optimistic update
          set((state) => ({ collections: state.collections.filter((c) => c.id !== tempId) }));
          return;
        }
        // Replace temp with real
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === tempId
              ? { id: data.id, name: data.name, post_ids: data.post_ids, created_at: data.created_at }
              : c
          ),
        }));
      })
      .catch((err) => {
        console.error('[collectionStore] addCollection error:', err);
        set((state) => ({ collections: state.collections.filter((c) => c.id !== tempId) }));
      });
  },

  removeCollection: (id) => {
    if (id === 'all') return;
    // Optimistic update
    set((state) => ({ collections: state.collections.filter((c) => c.id !== id) }));

    if (isConfigured) {
      deleteCollectionService(id).catch((err) => {
        console.error('[collectionStore] removeCollection error:', err);
      });
    }
  },

  addPostToCollection: (collectionId, postId) => {
    // Optimistic update
    set((state) => ({
      collections: state.collections.map((c) => {
        if (c.id !== collectionId) return c;
        if (c.post_ids.includes(postId)) return c;
        return { ...c, post_ids: [...c.post_ids, postId] };
      }),
    }));

    if (isConfigured) {
      addPostToCollectionService(collectionId, postId).catch((err) => {
        console.error('[collectionStore] addPostToCollection error:', err);
      });
    }
  },

  removePostFromCollection: (collectionId, postId) => {
    // Optimistic update
    set((state) => ({
      collections: state.collections.map((c) => {
        if (c.id !== collectionId) return c;
        return { ...c, post_ids: c.post_ids.filter((id) => id !== postId) };
      }),
    }));

    if (isConfigured) {
      removePostFromCollectionService(collectionId, postId).catch((err) => {
        console.error('[collectionStore] removePostFromCollection error:', err);
      });
    }
  },

  getCollection: (id) => {
    return get().collections.find((c) => c.id === id);
  },
}));
