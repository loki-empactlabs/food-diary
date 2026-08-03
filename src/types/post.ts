export interface FoodPost {
  id: string;
  user_id: string;
  restaurant_id: string | null;
  image_urls: string[];
  thumbnail_urls: string[];
  rating: number; // 1-5
  comment: string | null;
  menu_name: string | null;
  price: number | null;
  tags: string[];
  location: {
    latitude: number;
    longitude: number;
  } | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  user?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  restaurant?: {
    id: string;
    name: string;
    address: string | null;
  };
  _count?: {
    likes: number;
    comments: number;
  };
  is_liked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null; // for replies
  created_at: string;
  user?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  total_posts: number;
  avg_rating: number;
  followers_count: number;
  following_count: number;
  is_following?: boolean;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'revisit';
  user_id: string; // recipient
  actor?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  post?: {
    id: string;
    menu_name: string;
    thumbnail_url: string | null;
  };
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CreatePostInput {
  image_uris: string[]; // local URIs before upload
  rating: number;
  comment?: string;
  menu_name?: string;
  price?: number;
  tags?: string[];
  restaurant_name?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}
