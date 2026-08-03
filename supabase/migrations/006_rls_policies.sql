-- =====================
-- Profiles RLS
-- =====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================
-- Restaurants RLS
-- =====================
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurants are viewable by everyone"
  ON public.restaurants FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create restaurants"
  ON public.restaurants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================
-- Food Posts RLS
-- =====================
ALTER TABLE public.food_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public posts are viewable by everyone"
  ON public.food_posts FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Authenticated users can create posts"
  ON public.food_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.food_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.food_posts FOR DELETE
  USING (auth.uid() = user_id);

-- =====================
-- Comments RLS
-- =====================
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- =====================
-- Likes RLS
-- =====================
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone"
  ON public.likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own likes"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- =====================
-- Follows RLS
-- =====================
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT USING (true);

CREATE POLICY "Users can follow"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- =====================
-- Notifications RLS
-- =====================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================
-- Visit History RLS
-- =====================
ALTER TABLE public.visit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own visit history"
  ON public.visit_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own visit history"
  ON public.visit_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);
