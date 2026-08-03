import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  total_posts: number;
  avg_rating: number;
  is_public: boolean;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isOnboarded: boolean;
}

interface AuthActions {
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setOnboarded: (value: boolean) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

// Use localStorage on web, lazy-load AsyncStorage on native
function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return {
      getItem: (name: string) => {
        const value = window.localStorage.getItem(name);
        return value ?? null;
      },
      setItem: (name: string, value: string) => {
        window.localStorage.setItem(name, value);
      },
      removeItem: (name: string) => {
        window.localStorage.removeItem(name);
      },
    };
  }
  // Return a no-op storage for SSR
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      profile: null,
      isLoading: true,
      isOnboarded: false,

      setSession: (session) =>
        set({
          session,
          user: session?.user ?? null,
          isLoading: false,
        }),
      setProfile: (profile) => set({ profile }),
      setOnboarded: (value) => set({ isOnboarded: value }),
      setLoading: (loading) => set({ isLoading: loading }),
      signOut: () =>
        set({
          session: null,
          user: null,
          profile: null,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => getStorage()),
      partialize: (state) => ({
        isOnboarded: state.isOnboarded,
      }),
    }
  )
);
