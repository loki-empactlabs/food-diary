/**
 * Environment variables with type safety.
 * Values come from app.json extra or .env via expo-constants.
 */
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const env = {
  SUPABASE_URL: (extra.supabaseUrl as string) || process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY:
    (extra.supabaseAnonKey as string) || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  SENTRY_DSN: process.env.SENTRY_DSN || process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  POSTHOG_API_KEY: process.env.POSTHOG_API_KEY || process.env.EXPO_PUBLIC_POSTHOG_API_KEY || '',
  POSTHOG_HOST: process.env.POSTHOG_HOST || process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
} as const;
