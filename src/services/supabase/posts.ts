import { supabase, isConfigured } from './client';
import type { FoodPost } from '@/src/types/post';

interface FetchPostsOptions {
  limit?: number;
  offset?: number;
  userId?: string;
}

/**
 * Fetch posts feed (newest first) with user + restaurant + counts
 */
export async function fetchPosts({ limit = 20, offset = 0, userId }: FetchPostsOptions = {}) {
  if (!isConfigured) return { data: [], error: null };

  let query = supabase
    .from('food_posts')
    .select(`
      *,
      user:profiles!user_id(id, display_name, avatar_url),
      restaurant:restaurants!restaurant_id(id, name, address)
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  return { data: data as FoodPost[] | null, error };
}

/**
 * Fetch a single post by ID
 */
export async function fetchPost(postId: string) {
  if (!isConfigured) return { data: null, error: null };

  const { data, error } = await supabase
    .from('food_posts')
    .select(`
      *,
      user:profiles!user_id(id, display_name, avatar_url),
      restaurant:restaurants!restaurant_id(id, name, address)
    `)
    .eq('id', postId)
    .single();

  return { data: data as FoodPost | null, error };
}

/**
 * Create a new food post
 */
export async function createPost(post: {
  image_urls: string[];
  thumbnail_url?: string;
  rating: number;
  comment?: string;
  menu_name?: string;
  price?: number;
  tags?: string[];
  restaurant_id?: string;
  location?: { latitude: number; longitude: number };
}) {
  if (!isConfigured) return { data: null, error: new Error('Supabase not configured') };

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: null, error: new Error('Not authenticated') };

  const insertData: any = {
    user_id: userData.user.id,
    image_urls: post.image_urls,
    thumbnail_url: post.thumbnail_url || null,
    rating: post.rating,
    comment: post.comment || null,
    menu_name: post.menu_name || null,
    price: post.price || null,
    tags: post.tags || [],
    restaurant_id: post.restaurant_id || null,
    is_public: true,
  };

  if (post.location) {
    insertData.location = `POINT(${post.location.longitude} ${post.location.latitude})`;
  }

  const { data, error } = await supabase
    .from('food_posts')
    .insert(insertData)
    .select()
    .single();

  return { data: data as FoodPost | null, error };
}

/**
 * Delete a food post
 */
export async function deletePost(postId: string) {
  if (!isConfigured) return { error: null };

  const { error } = await supabase
    .from('food_posts')
    .delete()
    .eq('id', postId);

  return { error };
}

/**
 * Fetch comments for a post
 */
export async function fetchComments(postId: string) {
  if (!isConfigured) return { data: [], error: null };
  const { data, error } = await supabase
    .from('comments')
    .select('*, user:profiles!user_id(id, display_name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  return { data, error };
}

/**
 * Add a comment to a post
 */
export async function addComment(postId: string, content: string, parentId?: string) {
  if (!isConfigured) return { data: null, error: null };
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: null, error: new Error('Not authenticated') };
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userData.user.id, content, parent_id: parentId || null })
    .select('*, user:profiles!user_id(id, display_name, avatar_url)')
    .single();
  return { data, error };
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string) {
  if (!isConfigured) return { error: null };
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  return { error };
}

/**
 * Update a food post
 */
export async function updatePost(postId: string, updates: { rating?: number; comment?: string; menu_name?: string; tags?: string[] }) {
  if (!isConfigured) return { data: null, error: null };
  const { data, error } = await supabase
    .from('food_posts')
    .update(updates)
    .eq('id', postId)
    .select()
    .single();
  return { data, error };
}

/**
 * Toggle like on a post
 */
export async function toggleLike(postId: string) {
  if (!isConfigured) return { liked: false, error: null };

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { liked: false, error: new Error('Not authenticated') };

  // Check if already liked
  const { data: existing } = await supabase
    .from('likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (existing) {
    // Unlike
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userData.user.id);
    return { liked: false, error };
  } else {
    // Like
    const { error } = await supabase
      .from('likes')
      .insert({ post_id: postId, user_id: userData.user.id });
    return { liked: true, error };
  }
}
