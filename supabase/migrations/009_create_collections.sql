CREATE TABLE public.collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.collection_posts (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  post_id       UUID NOT NULL REFERENCES public.food_posts(id) ON DELETE CASCADE,
  added_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (collection_id, post_id)
);

CREATE INDEX idx_collections_user ON public.collections(user_id);
CREATE INDEX idx_collection_posts_post ON public.collection_posts(post_id);
