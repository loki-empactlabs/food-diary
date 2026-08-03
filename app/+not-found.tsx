import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme';

export default function NotFoundScreen() {
  const { colors, typography } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: '페이지를 찾을 수 없습니다' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[typography.h3, { color: colors.text }]}>404</Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: 8 }]}>
          존재하지 않는 페이지입니다.
        </Text>
        <Link href="/" style={{ marginTop: 20 }}>
          <Text style={[typography.bodyMedium, { color: colors.primary }]}>
            홈으로 돌아가기
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
