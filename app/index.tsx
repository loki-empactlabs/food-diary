import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';

export default function Index() {
  const session = useAuthStore((s) => s.session);
  const isOnboarded = useAuthStore((s) => s.isOnboarded);

  if (!session) {
    return <Redirect href={isOnboarded ? '/(auth)/sign-in' : '/(auth)/onboarding'} />;
  }

  return <Redirect href="/(app)/(tabs)/home" />;
}
