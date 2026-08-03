import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';

export default function AppLayout() {
  const session = useAuthStore((s) => s.session);

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animationDuration: 300 }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="post/create"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="post/[postId]/index"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="restaurant/[restaurantId]"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="settings/index"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="user/[userId]"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="notifications/index"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="search/index"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="statistics/index"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="calendar/index"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="collections/index"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="collections/[collectionId]"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="share/[postId]"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="revisit/index"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="taste-profile/index"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="nearby/index"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="post/[postId]/edit"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack>
  );
}
