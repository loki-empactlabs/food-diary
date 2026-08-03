-- Nearby posts search (distance in meters)
CREATE OR REPLACE FUNCTION nearby_posts(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 5000,
  page_limit INTEGER DEFAULT 20,
  page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  image_urls TEXT[],
  thumbnail_url TEXT,
  rating SMALLINT,
  comment TEXT,
  menu_name TEXT,
  restaurant_name TEXT,
  distance_meters DOUBLE PRECISION,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fp.id,
    fp.user_id,
    fp.image_urls,
    fp.thumbnail_url,
    fp.rating,
    fp.comment,
    fp.menu_name,
    r.name AS restaurant_name,
    ST_Distance(fp.location, ST_MakePoint(lng, lat)::geography) AS distance_meters,
    fp.created_at
  FROM public.food_posts fp
  LEFT JOIN public.restaurants r ON fp.restaurant_id = r.id
  WHERE
    fp.is_public = true
    AND ST_DWithin(fp.location, ST_MakePoint(lng, lat)::geography, radius_meters)
  ORDER BY distance_meters ASC
  LIMIT page_limit
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revisit detection: find past visits near current location
CREATE OR REPLACE FUNCTION check_revisit(
  p_user_id UUID,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_meters INTEGER DEFAULT 100
)
RETURNS TABLE (
  restaurant_id UUID,
  restaurant_name TEXT,
  last_visit TIMESTAMPTZ,
  visit_count BIGINT,
  last_rating SMALLINT,
  last_comment TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS restaurant_id,
    r.name AS restaurant_name,
    MAX(vh.visited_at) AS last_visit,
    COUNT(vh.id) AS visit_count,
    (SELECT fp.rating FROM public.food_posts fp
     WHERE fp.restaurant_id = r.id AND fp.user_id = p_user_id
     ORDER BY fp.created_at DESC LIMIT 1) AS last_rating,
    (SELECT fp.comment FROM public.food_posts fp
     WHERE fp.restaurant_id = r.id AND fp.user_id = p_user_id
     ORDER BY fp.created_at DESC LIMIT 1) AS last_comment
  FROM public.restaurants r
  INNER JOIN public.visit_history vh
    ON vh.restaurant_id = r.id AND vh.user_id = p_user_id
  WHERE ST_DWithin(r.location, ST_MakePoint(p_lng, p_lat)::geography, p_radius_meters)
  GROUP BY r.id, r.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
