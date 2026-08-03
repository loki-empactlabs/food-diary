-- Comments with reply support
CREATE TABLE public.comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES public.food_posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  parent_id   UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON public.comments(post_id, created_at);

-- Likes (one per user per post)
CREATE TABLE public.likes (
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES public.food_posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- Follows
CREATE TABLE public.follows (
  follower_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Notifications
CREATE TABLE public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,  -- 'revisit' | 'comment' | 'like' | 'follow'
  title        TEXT NOT NULL,
  body         TEXT,
  data         JSONB,
  is_read      BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

-- Visit history (for revisit detection)
CREATE TABLE public.visit_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  post_id       UUID REFERENCES public.food_posts(id) ON DELETE SET NULL,
  visited_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_visit_history_user_restaurant
  ON public.visit_history(user_id, restaurant_id, visited_at DESC);
