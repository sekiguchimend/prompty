-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.account_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  show_creator_page boolean DEFAULT true,
  add_mentions_on_share boolean DEFAULT true,
  allow_reposts boolean DEFAULT true,
  show_recommended_creators boolean DEFAULT true,
  use_serif_font boolean DEFAULT false,
  accept_tips boolean DEFAULT true,
  allow_anonymous_purchase boolean DEFAULT true,
  opt_out_ai_training boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT account_settings_pkey PRIMARY KEY (id),
  CONSTRAINT account_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.analytics_summary (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL,
  date date NOT NULL,
  view_count integer DEFAULT 0,
  unique_viewer_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  bookmark_count integer DEFAULT 0,
  purchase_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT analytics_summary_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_summary_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id)
);
CREATE TABLE public.analytics_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL,
  visitor_id text NOT NULL,
  viewed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT analytics_views_pkey PRIMARY KEY (id)
);
CREATE TABLE public.announcement_reads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  announcement_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT announcement_reads_pkey PRIMARY KEY (user_id, announcement_id),
  CONSTRAINT announcement_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  icon text,
  icon_color text,
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT announcements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  description text,
  icon character varying,
  requirements text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT badges_pkey PRIMARY KEY (id)
);
CREATE TABLE public.bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  prompt_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bookmarks_pkey PRIMARY KEY (id),
  CONSTRAINT bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT bookmarks_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  parent_id uuid,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id)
);
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL,
  user_id uuid NOT NULL,
  parent_id uuid,
  content text NOT NULL CHECK (char_length(content) >= 1),
  is_edited boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id),
  CONSTRAINT comments_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id)
);
CREATE TABLE public.contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contacts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.contest_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL,
  prompt_id uuid NOT NULL,
  user_id uuid NOT NULL,
  score integer,
  rank integer,
  is_winner boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contest_entries_pkey PRIMARY KEY (id),
  CONSTRAINT contest_entries_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id),
  CONSTRAINT contest_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT contest_entries_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contests(id)
);
CREATE TABLE public.contests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text,
  rules text,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  prize text,
  banner_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contests_pkey PRIMARY KEY (id)
);
CREATE TABLE public.drafts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title character varying,
  description text,
  content text,
  thumbnail_url text,
  category_id uuid,
  price numeric DEFAULT 0,
  is_free boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT drafts_pkey PRIMARY KEY (id),
  CONSTRAINT drafts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  feedback_type text NOT NULL,
  email text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT feedback_pkey PRIMARY KEY (id)
);
CREATE TABLE public.follows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT follows_pkey PRIMARY KEY (id),
  CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.profiles(id),
  CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  prompt_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT likes_pkey PRIMARY KEY (id),
  CONSTRAINT likes_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id),
  CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.magazine_prompts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  magazine_id uuid NOT NULL,
  prompt_id uuid NOT NULL,
  order_index integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT magazine_prompts_pkey PRIMARY KEY (id),
  CONSTRAINT magazine_prompts_magazine_id_fkey FOREIGN KEY (magazine_id) REFERENCES public.magazines(id),
  CONSTRAINT magazine_prompts_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id)
);
CREATE TABLE public.magazines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title character varying NOT NULL CHECK (char_length(title::text) >= 3),
  description text,
  cover_url text,
  is_public boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT magazines_pkey PRIMARY KEY (id),
  CONSTRAINT magazines_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  likes_enabled boolean DEFAULT true,
  comments_enabled boolean DEFAULT true,
  follows_enabled boolean DEFAULT true,
  mentions_enabled boolean DEFAULT true,
  system_enabled boolean DEFAULT true,
  email_notifications_enabled boolean DEFAULT true,
  push_notifications_enabled boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.notification_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  likes_enabled boolean DEFAULT true,
  comments_enabled boolean DEFAULT true,
  follows_enabled boolean DEFAULT true,
  mentions_enabled boolean DEFAULT true,
  system_enabled boolean DEFAULT true,
  email_notifications_enabled boolean DEFAULT true,
  push_notifications_enabled boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notification_settings_pkey PRIMARY KEY (id),
  CONSTRAINT notification_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL,
  sender_id uuid,
  type character varying NOT NULL,
  content text,
  resource_type character varying,
  resource_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id),
  CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider character varying NOT NULL,
  token_id character varying NOT NULL,
  card_last4 character varying,
  card_brand character varying,
  expiry_month integer,
  expiry_year integer,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
  CONSTRAINT payment_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  amount bigint NOT NULL,
  currency text NOT NULL,
  intent_id text NOT NULL,
  status text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.payout_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_type character varying NOT NULL,
  account_holder character varying NOT NULL,
  account_details jsonb NOT NULL,
  is_default boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payout_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT payout_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  status character varying DEFAULT 'pending'::character varying,
  transaction_id character varying,
  payout_method character varying,
  notes text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payouts_pkey PRIMARY KEY (id),
  CONSTRAINT payouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.price_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  name character varying NOT NULL,
  description text,
  price numeric NOT NULL,
  billing_interval character varying DEFAULT 'month'::character varying,
  is_active boolean DEFAULT true,
  benefits jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT price_tiers_pkey PRIMARY KEY (id),
  CONSTRAINT price_tiers_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username character varying NOT NULL UNIQUE CHECK (char_length(username::text) >= 3),
  display_name character varying,
  email character varying NOT NULL UNIQUE,
  bio text,
  avatar_url text,
  banner_url text,
  website character varying,
  github character varying,
  location character varying,
  is_premium boolean DEFAULT false,
  premium_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_business boolean DEFAULT false,
  stripe_account_id text,
  status text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.prompt_executions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL,
  user_id uuid NOT NULL,
  input text,
  output text NOT NULL,
  model character varying,
  execution_time integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT prompt_executions_pkey PRIMARY KEY (id),
  CONSTRAINT prompt_executions_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id),
  CONSTRAINT prompt_executions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.prompt_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT prompt_tags_pkey PRIMARY KEY (id),
  CONSTRAINT prompt_tags_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id),
  CONSTRAINT prompt_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id)
);
CREATE TABLE public.prompts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title character varying NOT NULL CHECK (char_length(title::text) >= 5),
  description text,
  content text NOT NULL CHECK (char_length(content) >= 10),
  thumbnail_url text,
  category_id uuid,
  price numeric DEFAULT 0,
  is_free boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  is_premium boolean DEFAULT false,
  is_ai_generated boolean DEFAULT false,
  published boolean DEFAULT true,
  view_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  site_url text,
  prompt_title text,
  prompt_content text,
  like_count smallint DEFAULT '0'::smallint,
  stripe_product_id text,
  stripe_price_id text,
  stripe_error text,
  currency text DEFAULT 'jpy'::text,
  preview_lines integer DEFAULT 3 CHECK (preview_lines >= 1 AND preview_lines <= 20),
  ai_model character varying,
  media_type character varying DEFAULT 'image'::character varying,
  CONSTRAINT prompts_pkey PRIMARY KEY (id),
  CONSTRAINT prompts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  prompt_id uuid NOT NULL,
  amount numeric NOT NULL,
  status character varying DEFAULT 'completed'::character varying,
  payment_id character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  currency text DEFAULT 'JPY'::text,
  CONSTRAINT purchases_pkey PRIMARY KEY (id),
  CONSTRAINT purchases_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id),
  CONSTRAINT purchases_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id)
);
CREATE TABLE public.recently_viewed_prompts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  prompt_id uuid NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT recently_viewed_prompts_pkey PRIMARY KEY (id),
  CONSTRAINT recently_viewed_prompts_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id),
  CONSTRAINT recently_viewed_prompts_user_id_idx FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT recently_viewed_prompts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  target_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type = ANY (ARRAY['comment'::text, 'prompt'::text])),
  prompt_id uuid NOT NULL,
  reporter_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason = ANY (ARRAY['inappropriate'::text, 'spam'::text, 'harassment'::text, 'misinformation'::text, 'other'::text])),
  details text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'dismissed'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES auth.users(id)
);
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  status character varying DEFAULT 'active'::character varying,
  price_tier_id uuid,
  current_period_start timestamp with time zone NOT NULL,
  current_period_end timestamp with time zone NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  payment_method_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id),
  CONSTRAINT subscriptions_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.profiles(id),
  CONSTRAINT subscriptions_subscriber_id_fkey FOREIGN KEY (subscriber_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  slug character varying NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tags_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL,
  awarded_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_badges_pkey PRIMARY KEY (id),
  CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id)
);
CREATE TABLE public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  account_settings jsonb DEFAULT '{"use_mincho_font": false, "social_connections": {"apple": false, "google": false, "twitter": false}, "accept_tip_payments": true, "is_business_account": false, "restrict_ai_learning": false, "add_mention_when_shared": true, "show_recommended_articles": true, "invoice_registration_number": null, "display_account_on_creator_page": true, "allow_introduction_on_official_sns": true, "allow_purchase_by_non_registered_users": true}'::jsonb,
  notification_settings jsonb DEFAULT '{"push_notifications": {"likes": true, "follows": true, "comments": true, "mentions": true, "new_posts": true, "reactions": true}, "email_notifications": {"likes": true, "follows": true, "comments": true, "mentions": true, "new_posts": true, "reactions": true, "newsletter": true, "promotions": true}}'::jsonb,
  reaction_settings jsonb DEFAULT '{"like_display": "heart", "show_like_count": true, "like_notification": true, "allow_multiple_reactions": true, "auto_like_when_bookmarking": true}'::jsonb,
  comment_settings jsonb DEFAULT '{"allow_comments": true, "require_approval": false, "comment_notification": true, "allow_anonymous_comments": true}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_settings_pkey PRIMARY KEY (id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);