CREATE TABLE public.food_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,

  -- Images (up to 5)
  image_urls    TEXT[] NOT NULL,
  thumbnail_url TEXT,

  -- Rating
  rating        SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment       TEXT,
  menu_name     TEXT,
  price         INTEGER,  -- in KRW

  -- Location (photo capture location, separate from restaurant)
  location      GEOGRAPHY(POINT, 4326),

  -- Metadata
  is_public     BOOLEAN DEFAULT true,
  tags          TEXT[],

  -- Social counts (denormalized)
  likes_count   INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_food_posts_user ON public.food_posts(user_id);
CREATE INDEX idx_food_posts_restaurant ON public.food_posts(restaurant_id);
CREATE INDEX idx_food_posts_location ON public.food_posts USING GIST (location);
CREATE INDEX idx_food_posts_created ON public.food_posts(created_at DESC);
CREATE INDEX idx_food_posts_rating ON public.food_posts(rating);
CREATE INDEX idx_food_posts_tags ON public.food_posts USING GIN (tags);
