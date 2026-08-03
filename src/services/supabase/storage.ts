import { supabase, isConfigured } from './client';
import { Platform } from 'react-native';

/**
 * Upload a food image to Supabase Storage
 * Returns the public URL of the uploaded image
 */
export async function uploadFoodImage(
  userId: string,
  imageUri: string,
  postId: string,
  index: number = 0
): Promise<{ url: string | null; error: Error | null }> {
  if (!isConfigured) return { url: null, error: new Error('Supabase not configured') };

  const fileExt = 'webp';
  const filePath = `${userId}/${postId}/${index}.${fileExt}`;

  try {
    let fileData: any;

    if (Platform.OS === 'web') {
      // On web, fetch the image and convert to blob
      const response = await fetch(imageUri);
      fileData = await response.blob();
    } else {
      // On native, use the URI directly
      fileData = {
        uri: imageUri,
        type: `image/${fileExt}`,
        name: `${index}.${fileExt}`,
      };
    }

    const { error: uploadError } = await supabase.storage
      .from('food-images')
      .upload(filePath, fileData, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (uploadError) {
      return { url: null, error: uploadError };
    }

    const { data: urlData } = supabase.storage
      .from('food-images')
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl, error: null };
  } catch (err) {
    return { url: null, error: err as Error };
  }
}

/**
 * Upload a thumbnail image
 */
export async function uploadThumbnail(
  userId: string,
  imageUri: string,
  postId: string,
  index: number = 0
): Promise<{ url: string | null; error: Error | null }> {
  if (!isConfigured) return { url: null, error: new Error('Supabase not configured') };

  const fileExt = 'webp';
  const filePath = `${userId}/${postId}/${index}.${fileExt}`;

  try {
    let fileData: any;

    if (Platform.OS === 'web') {
      const response = await fetch(imageUri);
      fileData = await response.blob();
    } else {
      fileData = {
        uri: imageUri,
        type: `image/${fileExt}`,
        name: `thumb_${index}.${fileExt}`,
      };
    }

    const { error: uploadError } = await supabase.storage
      .from('food-thumbnails')
      .upload(filePath, fileData, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (uploadError) {
      return { url: null, error: uploadError };
    }

    const { data: urlData } = supabase.storage
      .from('food-thumbnails')
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl, error: null };
  } catch (err) {
    return { url: null, error: err as Error };
  }
}

/**
 * Delete images for a post
 */
export async function deletePostImages(userId: string, postId: string) {
  if (!isConfigured) return;

  const { data: files } = await supabase.storage
    .from('food-images')
    .list(`${userId}/${postId}`);

  if (files?.length) {
    const paths = files.map((f) => `${userId}/${postId}/${f.name}`);
    await supabase.storage.from('food-images').remove(paths);
  }

  const { data: thumbs } = await supabase.storage
    .from('food-thumbnails')
    .list(`${userId}/${postId}`);

  if (thumbs?.length) {
    const paths = thumbs.map((f) => `${userId}/${postId}/${f.name}`);
    await supabase.storage.from('food-thumbnails').remove(paths);
  }
}
