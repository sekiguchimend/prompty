export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  post_count: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithStats extends Category {
  recent_prompts_count: number;
  trending_score: number;
}