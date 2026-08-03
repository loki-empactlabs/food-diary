import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { showToast } from '@/src/components/ui/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { useAuthStore } from '@/src/stores/authStore';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';
import { supabase } from '@/src/services/supabase/client';

export default function SettingsScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    useAuthStore.getState().signOut();
    router.replace('/');
  };

  const SettingRow = ({
    icon,
    label,
    value,
    onPress,
    showArrow = true,
    danger = false,
  }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    showArrow?: boolean;
    danger?: boolean;
  }) => (
    <AnimatedPressable
      onPress={onPress}
      style={[
        styles.settingRow,
        { borderBottomColor: colors.borderLight, paddingVertical: spacing.base, paddingHorizontal: spacing.base },
      ]}
    >
      <Ionicons name={icon as any} size={20} color={danger ? colors.error : colors.icon} />
      <Text
        style={[
          typography.body,
          { color: danger ? colors.error : colors.text, flex: 1, marginLeft: spacing.sm },
        ]}
      >
        {label}
      </Text>
      {value && (
        <Text style={[typography.bodySm, { color: colors.textTertiary, marginRight: spacing.xs }]}>
          {value}
        </Text>
      )}
      {showArrow && <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />}
    </AnimatedPressable>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Animated.View
      entering={FadeInDown.duration(200)}
      style={{
        paddingHorizontal: spacing.base,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xs,
      }}
    >
      <Text style={[typography.caption, { color: colors.textTertiary, textTransform: 'uppercase', fontWeight: '600' }]}>
        {title}
      </Text>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.base, borderBottomColor: colors.borderLight }]}>
        <AnimatedPressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </AnimatedPressable>
        <Text style={[typography.h4, { color: colors.text, marginLeft: spacing.base }]}>설정</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Account */}
        <SectionHeader title="계정" />
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <SettingRow
            icon="person-outline"
            label="프로필 편집"
            value={user?.user_metadata?.display_name ?? 'Dev User'}
            onPress={() => showToast('프로필 편집 기능은 준비 중입니다.')}
          />
          <SettingRow icon="mail-outline" label="이메일" value={user?.email ?? 'dev@fooddiary.local'} showArrow={false} />
        </View>

        {/* Notifications */}
        <SectionHeader title="알림" />
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <SettingRow icon="notifications-outline" label="푸시 알림" showArrow={false} />
          <SettingRow icon="location-outline" label="재방문 알림" onPress={() => router.push('/(app)/revisit' as any)} />
        </View>

        {/* About */}
        <SectionHeader title="정보" />
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <SettingRow icon="information-circle-outline" label="버전" value="1.0.0" showArrow={false} />
          <SettingRow icon="document-text-outline" label="이용약관" onPress={() => showToast('이용약관 페이지는 준비 중입니다.')} />
          <SettingRow icon="shield-outline" label="개인정보처리방침" onPress={() => showToast('개인정보처리방침 페이지는 준비 중입니다.')} />
          <SettingRow icon="help-circle-outline" label="고객센터" onPress={() => showToast('고객센터는 준비 중입니다.')} />
        </View>

        {/* Danger Zone */}
        <SectionHeader title="" />
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <SettingRow icon="log-out-outline" label="로그아웃" onPress={handleSignOut} showArrow={false} danger />
        </View>

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
