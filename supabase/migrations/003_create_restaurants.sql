CREATE TABLE public.restaurants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  address       TEXT,

  -- PostGIS location (SRID 4326 = WGS84 GPS coordinates)
  location      GEOGRAPHY(POINT, 4326) NOT NULL,

  -- External place API integration
  place_id      TEXT,
  place_source  TEXT,  -- 'google'
  category      TEXT,

  -- Aggregated stats (denormalized)
  avg_rating    DECIMAL(2,1) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,

  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for location-based queries
CREATE INDEX idx_restaurants_location ON public.restaurants USING GIST (location);

-- Trigram index for name search
CREATE INDEX idx_restaurants_name_trgm ON public.restaurants USING GIN (name gin_trgm_ops);
