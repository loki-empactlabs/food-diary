import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/services/supabase/client';
import { useAuthStore } from '@/src/stores/authStore';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';
import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [devLoading, setDevLoading] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const redirectUrl = AuthSession.makeRedirectUri();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) {
        Alert.alert('로그인 실패', error?.message ?? 'Google 인증 URL을 가져올 수 없습니다.');
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success') {
        const url = new URL(result.url);
        // Handle both hash fragment (#) and query params (?)
        const params = url.hash
          ? new URLSearchParams(url.hash.substring(1))
          : url.searchParams;
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken ?? '',
          });
          if (sessionError) {
            Alert.alert('로그인 실패', sessionError.message);
            return;
          }
          router.replace('/(app)/(tabs)/home');
        }
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      Alert.alert('오류', '로그인 중 오류가 발생했습니다.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = () => {
    // TODO: Implement Apple sign in
    console.log('Apple sign in');
  };

  const loginWithMockSession = () => {
    const mockSession = {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'dev-user-001',
        email: 'dev@fooddiary.app',
        app_metadata: {},
        user_metadata: { display_name: '김지우' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      },
    } as any;
    useAuthStore.getState().setSession(mockSession);
    router.replace('/(app)/(tabs)/home');
  };

  const handleDevLogin = async () => {
    setDevLoading(true);
    try {
      // Race between Supabase auth and a 5-second timeout
      const authPromise = supabase.auth.signInWithPassword({
        email: 'dev@fooddiary.app',
        password: 'devtest123!',
      });
      const timeoutPromise = new Promise<{ error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ error: { message: 'Timeout' } }), 5000)
      );

      const { error: signInError } = await Promise.race([authPromise, timeoutPromise]);

      if (signInError) {
        // Network failure or timeout: fall back to mock session
        if (signInError.message.includes('Failed to fetch') || signInError.message.includes('NetworkError') || signInError.message === 'Timeout') {
          console.warn('Supabase unreachable, using mock session');
          loginWithMockSession();
          return;
        }
        // If user doesn't exist, try sign-up
        if (signInError.message.includes('Invalid login credentials')) {
          const { error: signUpError } = await supabase.auth.signUp({
            email: 'dev@fooddiary.app',
            password: 'devtest123!',
            options: { data: { display_name: '김지우', full_name: '김지우' } },
          });
          if (signUpError) {
            console.error('Dev sign up error:', signUpError.message);
            Alert.alert('로그인 실패', signUpError.message);
            return;
          }
        } else {
          console.error('Dev sign in error:', signInError.message);
          Alert.alert('로그인 실패', signInError.message);
          return;
        }
      }

      router.replace('/(app)/(tabs)/home');
    } catch (err) {
      console.warn('Supabase unreachable, using mock session');
      loginWithMockSession();
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Hero Area */}
      <View style={styles.heroArea}>
        <Animated.View entering={ZoomIn.duration(200)} style={styles.emojiCircle}>
          <Text style={styles.emoji}>🍽️</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(50).duration(200)}>
          <Text style={styles.appTitle}>Food Diary</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(100).duration(200)}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            나의 맛있는 순간을 기록하세요
          </Text>
        </Animated.View>
      </View>

      {/* Button Area */}
      <Animated.View entering={FadeInDown.delay(150).duration(200)} style={styles.btnArea}>
        <AnimatedPressable onPress={handleGoogleSignIn} style={styles.googleBtn} disabled={googleLoading}>
          {googleLoading ? (
            <ActivityIndicator size="small" color="#1A1A1A" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#1A1A1A" />
              <Text style={styles.googleText}>Google로 계속하기</Text>
            </>
          )}
        </AnimatedPressable>

        <AnimatedPressable onPress={handleAppleSignIn} style={styles.appleBtn}>
          <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
          <Text style={styles.appleText}>Apple로 계속하기</Text>
        </AnimatedPressable>

        <AnimatedPressable onPress={handleDevLogin} style={styles.devBtn} disabled={devLoading}>
          {devLoading ? (
            <ActivityIndicator size="small" color="#FF6B6B" />
          ) : (
            <Text style={styles.devText}>이메일로 로그인 (개발용)</Text>
          )}
        </AnimatedPressable>
      </Animated.View>

      {/* Footer */}
      <Animated.View entering={FadeInDown.delay(200).duration(200)} style={styles.footer}>
        <Text style={styles.termsText}>
          로그인 시 이용약관과 개인정보처리방침에 동의하게 됩니다.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 200,
    paddingBottom: 50,
  },
  heroArea: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  emojiCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#211F1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
  },
  btnArea: {
    paddingHorizontal: 24,
    gap: 14,
  },
  googleBtn: {
    height: 54,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  appleBtn: {
    height: 54,
    borderRadius: 100,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  appleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  devBtn: {
    height: 44,
    borderRadius: 100,
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  devText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FF6B6B',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  termsText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#555555',
    textAlign: 'center',
  },
});
