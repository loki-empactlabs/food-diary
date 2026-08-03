import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Platform, Text, TextInput } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-reanimated';
import * as Sentry from '@sentry/react-native';
import { PostHogProvider } from 'posthog-react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/src/theme';
import { useAuthListener } from '@/src/hooks/useAuth';
import { useAuthStore } from '@/src/stores/authStore';
import { ToastProvider } from '@/src/components/ui/Toast';
import { env } from '@/src/config/env';

Sentry.init({
  dsn: env.SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
});

export { ErrorBoundary } from 'expo-router';

// Set Pretendard as default font for all Text and TextInput
const defaultTextStyle = { fontFamily: 'Pretendard-Regular' };
(Text as any).defaultProps = { ...((Text as any).defaultProps || {}), style: defaultTextStyle };
(TextInput as any).defaultProps = { ...((TextInput as any).defaultProps || {}), style: defaultTextStyle };

// Only prevent splash on native (not web)
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  useAuthListener();

  const isLoading = useAuthStore((s) => s.isLoading);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!isLoading && Platform.OS !== 'web') {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  // On web, wait for client-side hydration
  if (!hydrated || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF9644" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    'Pretendard-Regular': require('@/assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('@/assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('@/assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('@/assets/fonts/Pretendard-Bold.otf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF9644" />
      </View>
    );
  }

  const content = (
    <PostHogProvider
      apiKey={env.POSTHOG_API_KEY}
      options={{ host: env.POSTHOG_HOST, disabled: !env.POSTHOG_API_KEY }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthGate>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
                <Stack.Screen name="+not-found" />
              </Stack>
            </AuthGate>
            <ToastProvider />
          </ThemeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </PostHogProvider>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#000' }}>
        <View style={{ flex: 1, width: '100%', maxWidth: 390 }}>
          {content}
        </View>
      </View>
    );
  }

  return content;
}
