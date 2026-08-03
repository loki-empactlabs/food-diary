import { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { useSocialStore } from '@/src/stores/socialStore';
import { AnimatedPressable } from '@/src/components/ui/AnimatedPressable';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Notification } from '@/src/types/post';

const NOTIFICATION_ICONS: Record<Notification['type'], { name: string; color: string }> = {
  like: { name: 'heart', color: '#FF3B30' },
  comment: { name: 'chatbubble', color: '#007AFF' },
  follow: { name: 'person-add', color: '#34C759' },
  revisit: { name: 'location', color: '#FF9500' },
};

export default function NotificationsScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
  const notifications = useSocialStore((s) => s.notifications);
  const markNotificationRead = useSocialStore((s) => s.markNotificationRead);
  const markAllRead = useSocialStore((s) => s.markAllRead);
  const unreadCount = useSocialStore((s) => s.unreadCount());
  const isLoaded = useSocialStore((s) => s.isLoaded);
  const loadNotifications = useSocialStore((s) => s.loadNotifications);

  useEffect(() => {
    if (!isLoaded) loadNotifications();
  }, [isLoaded]);

  const handleNotificationPress = (notification: Notification) => {
    markNotificationRead(notification.id);

    if (notification.post) {
      router.push(`/(app)/post/${notification.post.id}` as any);
    } else if (notification.actor && notification.type === 'follow') {
      router.push(`/(app)/user/${notification.actor.id}` as any);
    }
  };

  const renderNotification = ({ item, index }: { item: Notification; index: number }) => {
    const icon = NOTIFICATION_ICONS[item.type];
    const timeAgo = formatDistanceToNow(new Date(item.created_at), {
      addSuffix: true,
      locale: ko,
    });

    return (
      <Animated.View entering={FadeInRight.delay(index * 30).duration(200)}>
      <AnimatedPressable
        onPress={() => handleNotificationPress(item)}
        style={[
          styles.notificationItem,
          {
            backgroundColor: item.is_read ? 'transparent' : colors.primaryLight + '20',
            paddingHorizontal: spacing.base,
            paddingVertical: spacing.sm,
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        {/* Icon */}
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: icon.color + '15',
              borderRadius: radius.full,
            },
          ]}
        >
          <Ionicons name={icon.name as any} size={16} color={icon.color} />
        </View>

        {/* Content */}
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text
            style={[
              typography.bodySm,
              {
                color: colors.text,
                fontWeight: item.is_read ? '400' : '600',
              },
            ]}
            numberOfLines={2}
          >
            {item.message}
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
            {timeAgo}
          </Text>
        </View>

        {/* Post thumbnail */}
        {item.post?.thumbnail_url && (
          <Image
            source={{ uri: item.post.thumbnail_url }}
            style={[styles.thumbnail, { borderRadius: radius.sm, marginLeft: spacing.sm }]}
            contentFit="cover"
          />
        )}

        {/* Unread dot */}
        {!item.is_read && (
          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
        )}
      </AnimatedPressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingHorizontal: spacing.base, borderBottomColor: colors.borderLight },
        ]}
      >
        <AnimatedPressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </AnimatedPressable>
        <Text style={[typography.h4, { color: colors.text, flex: 1, marginLeft: spacing.base }]}>
          알림
        </Text>
        {unreadCount > 0 && (
          <AnimatedPressable onPress={markAllRead} hitSlop={8}>
            <Text style={[typography.bodySm, { color: colors.primary }]}>모두 읽음</Text>
          </AnimatedPressable>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ paddingVertical: spacing['3xl'], alignItems: 'center' }}>
            <Ionicons name="notifications-off-outline" size={40} color={colors.textTertiary} />
            <Text
              style={[
                typography.body,
                { color: colors.textTertiary, marginTop: spacing.sm },
              ]}
            >
              알림이 없습니다
            </Text>
          </View>
        }
      />
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
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconCircle: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: 44,
    height: 44,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 12,
    left: 12,
  },
});
