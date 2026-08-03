import { supabase, isConfigured } from './client';
import type { FoodPost } from '@/src/types/post';

/**
 * Find nearby food posts within a radius (uses PostGIS function)
 */
export async function fetchNearbyPosts(
  latitude: number,
  longitude: number,
  radiusMeters: number = 1000
) {
  if (!isConfigured) return { data: [], error: null };

  const { data, error } = await supabase.rpc('nearby_posts', {
    lat: latitude,
    lng: longitude,
    radius_meters: radiusMeters,
  });

  return { data: data as FoodPost[] | null, error };
}

/**
 * Check if user has visited a nearby restaurant before
 */
export async function checkRevisit(
  userId: string,
  latitude: number,
  longitude: number
) {
  if (!isConfigured) return { data: [], error: null };

  const { data, error } = await supabase.rpc('check_revisit', {
    p_user_id: userId,
    lat: latitude,
    lng: longitude,
  });

  return { data, error };
}

/**
 * Find or create a restaurant by location
 */
export async function findOrCreateRestaurant(params: {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  placeId?: string;
}) {
  if (!isConfigured) return { data: null, error: new Error('Supabase not configured') };

  // Try to find existing restaurant nearby with same name
  const { data: existing } = await supabase
    .from('restaurants')
    .select('*')
    .ilike('name', params.name)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { data: existing, error: null };
  }

  // Create new restaurant
  const { data, error } = await supabase
    .from('restaurants')
    .insert({
      name: params.name,
      address: params.address || null,
      location: `POINT(${params.longitude} ${params.latitude})`,
      place_id: params.placeId || null,
    })
    .select()
    .single();

  return { data, error };
}
