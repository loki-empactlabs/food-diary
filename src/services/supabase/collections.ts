import { supabase, isConfigured } from './client';

export interface CollectionRow {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  post_ids: string[];
}

/**
 * Fetch all collections for a user, with their post_ids derived from collection_posts
 */
export async function fetchCollections(userId: string): Promise<{ data: CollectionRow[] | null; error: Error | null }> {
  if (!isConfigured) return { data: null, error: null };

  const { data: cols, error: colsErr } = await supabase
    .from('collections')
    .select('id, user_id, name, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (colsErr || !cols) return { data: null, error: colsErr as Error | null };

  if (cols.length === 0) return { data: [], error: null };

  const collectionIds = cols.map((c) => c.id);
  const { data: links, error: linksErr } = await supabase
    .from('collection_posts')
    .select('collection_id, post_id')
    .in('collection_id', collectionIds);

  if (linksErr) return { data: null, error: linksErr as Error };

  const linkMap: Record<string, string[]> = {};
  for (const link of links ?? []) {
    if (!linkMap[link.collection_id]) linkMap[link.collection_id] = [];
    linkMap[link.collection_id].push(link.post_id);
  }

  const result: CollectionRow[] = cols.map((c) => ({
    ...c,
    post_ids: linkMap[c.id] ?? [],
  }));

  return { data: result, error: null };
}

/**
 * Create a new collection for the authenticated user
 */
export async function createCollection(name: string): Promise<{ data: CollectionRow | null; error: Error | null }> {
  if (!isConfigured) return { data: null, error: new Error('Supabase not configured') };

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: null, error: new Error('Not authenticated') };

  const { data, error } = await supabase
    .from('collections')
    .insert({ user_id: userData.user.id, name })
    .select('id, user_id, name, created_at, updated_at')
    .single();

  if (error || !data) return { data: null, error: error as Error | null };

  return { data: { ...data, post_ids: [] }, error: null };
}

/**
 * Delete a collection by ID
 */
export async function deleteCollection(id: string): Promise<{ error: Error | null }> {
  if (!isConfigured) return { error: null };

  const { error } = await supabase.from('collections').delete().eq('id', id);
  return { error: error as Error | null };
}

/**
 * Add a post to a collection
 */
export async function addPostToCollection(collectionId: string, postId: string): Promise<{ error: Error | null }> {
  if (!isConfigured) return { error: null };

  const { error } = await supabase
    .from('collection_posts')
    .insert({ collection_id: collectionId, post_id: postId });
  return { error: error as Error | null };
}

/**
 * Remove a post from a collection
 */
export async function removePostFromCollection(collectionId: string, postId: string): Promise<{ error: Error | null }> {
  if (!isConfigured) return { error: null };

  const { error } = await supabase
    .from('collection_posts')
    .delete()
    .eq('collection_id', collectionId)
    .eq('post_id', postId);
  return { error: error as Error | null };
}
