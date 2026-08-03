import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { env } from '@/src/config/env';

const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-key';

const isConfigured =
  !!env.SUPABASE_URL &&
  !!env.SUPABASE_ANON_KEY &&
  env.SUPABASE_URL !== PLACEHOLDER_URL;

// Dynamically import AsyncStorage only in client context (not during SSR)
function getStorage() {
  if (typeof window === 'undefined') return undefined;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@react-native-async-storage/async-storage').default;
}

export const supabase: SupabaseClient = createClient(
  env.SUPABASE_URL || PLACEHOLDER_URL,
  env.SUPABASE_ANON_KEY || PLACEHOLDER_KEY,
  {
    auth: {
      storage: getStorage(),
      autoRefreshToken: true,
      persistSession: Platform.OS !== 'web' || typeof window !== 'undefined',
      detectSessionInUrl: false,
    },
  }
);

export { isConfigured };
