import { supabase, isConfigured } from './client';

// Fetch user profile
export async function fetchUserProfile(userId: string) {
  if (!isConfigured) return { data: null, error: null };
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

// Fetch follow counts for a user
export async function fetchFollowCounts(userId: string) {
  if (!isConfigured) return { followers: 0, following: 0 };
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);
  return { followers: followers ?? 0, following: following ?? 0 };
}

// Check if current user follows target
export async function checkIsFollowing(targetUserId: string) {
  if (!isConfigured) return false;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;
  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', userData.user.id)
    .eq('following_id', targetUserId)
    .maybeSingle();
  return !!data;
}

// Toggle follow
export async function toggleFollow(targetUserId: string) {
  if (!isConfigured) return { following: false, error: null };
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { following: false, error: new Error('Not authenticated') };

  const isFollowing = await checkIsFollowing(targetUserId);
  if (isFollowing) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', userData.user.id)
      .eq('following_id', targetUserId);
    return { following: false, error };
  } else {
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: userData.user.id, following_id: targetUserId });
    return { following: true, error };
  }
}

// Fetch notifications
export async function fetchNotifications() {
  if (!isConfigured) return { data: [], error: null };
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  return { data: data ?? [], error };
}

// Mark notification as read
export async function markNotificationRead(notificationId: string) {
  if (!isConfigured) return;
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
}

// Mark all notifications as read
export async function markAllNotificationsRead() {
  if (!isConfigured) return;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userData.user.id)
    .eq('is_read', false);
}
