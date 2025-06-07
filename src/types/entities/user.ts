export interface User {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
  updated_at: string;
  is_premium?: boolean;
  stripe_customer_id?: string | null;
  stripe_account_id?: string | null;
}

export interface UserSummary {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface UserProfile extends User {
  follower_users?: UserSummary[];
  following_users?: UserSummary[];
  recent_prompts?: any[];
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}