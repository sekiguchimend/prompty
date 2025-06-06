

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."account_settings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."account_settings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_follows_table_if_not_exists"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- follows 繝・・繝悶Ν縺悟ｭ伜惠縺吶ｋ縺九メ繧ｧ繝・け
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'follows') THEN
    -- 繝輔か繝ｭ繝ｼ繝・・繝悶Ν繧剃ｽ懈・
    CREATE TABLE public.follows (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      
      -- 荳諢丞宛邏・ｒ霑ｽ蜉・亥酔縺倥ヵ繧ｩ繝ｭ繝ｼ髢｢菫ゅ・1縺､縺縺托ｼ・
      CONSTRAINT unique_follower_following UNIQUE (follower_id, following_id)
    );
    
    -- 繧､繝ｳ繝・ャ繧ｯ繧ｹ繧定ｿｽ蜉・医ヱ繝輔か繝ｼ繝槭Φ繧ｹ蜷台ｸ奇ｼ・
    CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
    CREATE INDEX idx_follows_following_id ON public.follows(following_id);
    
    -- RLS繝昴Μ繧ｷ繝ｼ繧定ｨｭ螳・
    ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
    
    -- 縺吶∋縺ｦ縺ｮ繝ｦ繝ｼ繧ｶ繝ｼ縺ｫ隱ｭ縺ｿ蜿悶ｊ讓ｩ髯舌ｒ莉倅ｸ・
    CREATE POLICY "繝輔か繝ｭ繝ｼ髢｢菫ゅｒ縺吶∋縺ｦ縺ｮ繝ｦ繝ｼ繧ｶ繝ｼ縺碁夢隕ｧ蜿ｯ閭ｽ" 
      ON public.follows FOR SELECT
      USING (true);
      
    -- 繝輔か繝ｭ繝ｼ逋ｻ骭ｲ縺ｯ隱崎ｨｼ貂医∩繝ｦ繝ｼ繧ｶ繝ｼ縺ｮ縺ｿ蜿ｯ閭ｽ
    CREATE POLICY "隱崎ｨｼ貂医∩繝ｦ繝ｼ繧ｶ繝ｼ縺ｮ縺ｿ繝輔か繝ｭ繝ｼ縺ｧ縺阪ｋ"
      ON public.follows FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = follower_id);
      
    -- 閾ｪ蛻・′繝輔か繝ｭ繝ｼ縺励◆繧ゅ・縺縺大炎髯､蜿ｯ閭ｽ
    CREATE POLICY "閾ｪ蛻・・繝輔か繝ｭ繝ｼ縺ｮ縺ｿ蜑企勁蜿ｯ閭ｽ"
      ON public.follows FOR DELETE
      USING (auth.uid() = follower_id);
    
    -- 繧ｳ繝｡繝ｳ繝郁ｿｽ蜉
    COMMENT ON TABLE public.follows IS '繝ｦ繝ｼ繧ｶ繝ｼ髢薙・繝輔か繝ｭ繝ｼ髢｢菫ゅｒ譬ｼ邏阪☆繧九ユ繝ｼ繝悶Ν';
    COMMENT ON COLUMN public.follows.follower_id IS '繝輔か繝ｭ繝ｼ縺吶ｋ繝ｦ繝ｼ繧ｶ繝ｼ縺ｮID';
    COMMENT ON COLUMN public.follows.following_id IS '繝輔か繝ｭ繝ｼ縺輔ｌ繧九Θ繝ｼ繧ｶ繝ｼ縺ｮID';
    
    RAISE NOTICE 'follows 繝・・繝悶Ν繧剃ｽ懈・縺励∪縺励◆';
  ELSE
    RAISE NOTICE 'follows 繝・・繝悶Ν縺ｯ譌｢縺ｫ蟄伜惠縺励∪縺・;
  END IF;
END;
$$;


ALTER FUNCTION "public"."create_follows_table_if_not_exists"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification_preferences"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_notification_preferences"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_old_avatar"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- 蜿､縺・い繝舌ち繝ｼURL縺後≠繧翫∵眠縺励＞繧｢繝舌ち繝ｼURL縺ｨ逡ｰ縺ｪ繧句ｴ蜷・
  IF OLD.avatar_url IS NOT NULL AND OLD.avatar_url != NEW.avatar_url THEN
    -- URL縺九ｉ繝輔ぃ繧､繝ｫ蜷阪ｒ謚ｽ蜃ｺ縺励※蜑企勁
    PERFORM FROM storage.objects
    WHERE bucket_id = 'avatars' AND name = SUBSTRING(OLD.avatar_url FROM 'avatars/(.*)');
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."delete_old_avatar"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_old_thumbnail"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  old_file_name TEXT;
BEGIN
  -- thumbnail_url縺悟､画峩縺輔ｌ縲∝商縺ФRL縺後≠繧句ｴ蜷・
  IF OLD.thumbnail_url IS DISTINCT FROM NEW.thumbnail_url AND OLD.thumbnail_url IS NOT NULL THEN
    -- URL縺九ｉ繝輔ぃ繧､繝ｫ蜷阪ｒ謚ｽ蜃ｺ
    old_file_name := SPLIT_PART(OLD.thumbnail_url, '/', -1);
    
    -- 繝輔ぃ繧､繝ｫ蜷阪′驕ｩ蛻・↑蠖｢蠑上°繝√ぉ繝・け
    IF old_file_name LIKE 'thumbnail-%' THEN
      -- 蜑企勁蜃ｦ逅・ｼ域ｨｩ髯舌・蝠城｡後〒螟ｱ謨励☆繧句庄閭ｽ諤ｧ縺後≠繧九◆繧√∽ｾ句､悶ｒ繧ｭ繝｣繝・メ・・
      BEGIN
        DELETE FROM storage.objects
        WHERE bucket_id = 'prompt-thumbnails' AND name = old_file_name;
      EXCEPTION WHEN OTHERS THEN
        -- 繧ｨ繝ｩ繝ｼ繧堤┌隕厄ｼ医Ο繧ｰ縺ｫ險倬鹸縺吶ｋ縺薙→繧ょ庄閭ｽ・・
        NULL;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."delete_old_thumbnail"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_thumbnail_on_prompt_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  thumbnail_file_name TEXT;
BEGIN
  IF OLD.thumbnail_url IS NOT NULL THEN
    thumbnail_file_name := SPLIT_PART(OLD.thumbnail_url, '/', -1);
    IF thumbnail_file_name LIKE 'thumbnail-%' THEN
      BEGIN
        DELETE FROM storage.objects
        WHERE bucket_id = 'prompt-thumbnails' AND name = thumbnail_file_name;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;
  END IF;
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."delete_thumbnail_on_prompt_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_accurate_view_count"("prompt_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  prompt_view_count INTEGER;
  analytics_count INTEGER;
BEGIN
  -- prompts繝・・繝悶Ν縺九ｉview_count繧貞叙蠕・
  SELECT COALESCE(view_count, 0) INTO prompt_view_count
  FROM prompts
  WHERE id = prompt_id;
  
  -- analytics_views繝・・繝悶Ν縺九ｉ繧ｫ繧ｦ繝ｳ繝医ｒ蜿門ｾ・
  SELECT COUNT(*) INTO analytics_count
  FROM analytics_views
  WHERE prompt_id = get_accurate_view_count.prompt_id;
  
  -- 繧医ｊ螟ｧ縺阪＞譁ｹ縺ｮ蛟､繧定ｿ斐☆
  RETURN GREATEST(prompt_view_count, analytics_count);
END;
$$;


ALTER FUNCTION "public"."get_accurate_view_count"("prompt_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feedback_type" "text" NOT NULL,
    "email" "text",
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."feedback" OWNER TO "postgres";


COMMENT ON TABLE "public"."feedback" IS 'Stores user feedback, feature requests, and bug reports';



CREATE OR REPLACE FUNCTION "public"."get_all_feedback"() RETURNS SETOF "public"."feedback"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.feedback
  ORDER BY created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_all_feedback"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_all_feedback"() IS 'Returns all feedback entries for administrators';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- 荳譎ら噪縺ｪ繝ｦ繝ｼ繧ｶ繝ｼ蜷阪ｒ險ｭ螳夲ｼ亥ｾ後〒繝ｦ繝ｼ繧ｶ繝ｼ縺悟､画峩縺ｧ縺阪ｋ・・
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id, 
    'user_' || REPLACE(NEW.id::TEXT, '-', ''), -- 荳譎ら噪縺ｪ繝ｦ繝ｼ繧ｶ繝ｼ蜷・
    NEW.email
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment"("count" integer) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN count + 1;
END;
$$;


ALTER FUNCTION "public"."increment"("count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_view_count"("prompt_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- ROW EXCLUSIVE繝ｭ繝・け繧貞叙蠕励＠縺ｦ莉悶・繝医Λ繝ｳ繧ｶ繧ｯ繧ｷ繝ｧ繝ｳ縺九ｉ縺ｮ蜷梧凾譖ｴ譁ｰ繧帝亟縺・
  UPDATE prompts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = prompt_id;
END;
$$;


ALTER FUNCTION "public"."increment_view_count"("prompt_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_contact"("p_name" "text", "p_email" "text", "p_subject" "text", "p_message" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Insert the contact and return the result
  INSERT INTO public.contacts (
    name,
    email,
    subject,
    message,
    is_read
  ) VALUES (
    p_name,
    p_email,
    p_subject,
    p_message,
    false
  )
  RETURNING jsonb_build_object(
    'id', id,
    'name', name,
    'email', email,
    'subject', subject,
    'message', message,
    'created_at', created_at
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."insert_contact"("p_name" "text", "p_email" "text", "p_subject" "text", "p_message" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."insert_contact"("p_name" "text", "p_email" "text", "p_subject" "text", "p_message" "text") IS 'Inserts a new contact/inquiry and returns the created record';



CREATE OR REPLACE FUNCTION "public"."insert_feedback"("p_feedback_type" "text", "p_email" "text", "p_message" "text", "p_is_read" boolean DEFAULT false) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Insert the feedback and return the result
  INSERT INTO public.feedback (
    feedback_type,
    email,
    message,
    is_read
  ) VALUES (
    p_feedback_type,
    p_email,
    p_message,
    p_is_read
  )
  RETURNING jsonb_build_object(
    'id', id,
    'feedback_type', feedback_type,
    'email', email,
    'message', message,
    'created_at', created_at
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."insert_feedback"("p_feedback_type" "text", "p_email" "text", "p_message" "text", "p_is_read" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."insert_feedback"("p_feedback_type" "text", "p_email" "text", "p_message" "text", "p_is_read" boolean) IS 'Inserts a new feedback entry and returns the created record';



CREATE OR REPLACE FUNCTION "public"."insert_notification"("recipient_id" "uuid", "type" "text", "content" "text", "sender_id" "uuid" DEFAULT NULL::"uuid", "resource_type" "text" DEFAULT NULL::"text", "resource_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  notification_id UUID;
  recipient_preferences RECORD;
BEGIN
  -- Check if recipient has enabled notifications of this type
  SELECT * FROM public.notification_preferences 
  WHERE user_id = recipient_id
  INTO recipient_preferences;
  
  -- If recipient exists and has this notification type enabled
  IF FOUND THEN
    IF (
      (type = 'like' AND recipient_preferences.likes_enabled) OR
      (type = 'comment' AND recipient_preferences.comments_enabled) OR
      (type = 'follow' AND recipient_preferences.follows_enabled) OR
      (type = 'mention' AND recipient_preferences.mentions_enabled) OR
      (type = 'system' AND recipient_preferences.system_enabled) OR
      (type NOT IN ('like', 'comment', 'follow', 'mention', 'system'))
    ) THEN
      -- Insert the notification
      INSERT INTO public.notifications (
        recipient_id, 
        sender_id, 
        type, 
        content,
        resource_type,
        resource_id
      )
      VALUES (
        recipient_id,
        sender_id,
        type,
        content,
        resource_type,
        resource_id
      )
      RETURNING id INTO notification_id;
      
      RETURN notification_id;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."insert_notification"("recipient_id" "uuid", "type" "text", "content" "text", "sender_id" "uuid", "resource_type" "text", "resource_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_as_read"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE public.notifications
  SET 
    is_read = true,
    updated_at = now()
  WHERE 
    recipient_id = auth.uid() AND
    is_read = false
  RETURNING 1 INTO affected_rows;
  
  RETURN affected_rows;
END;
$$;


ALTER FUNCTION "public"."mark_all_notifications_as_read"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_notification_as_read"("notification_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE public.notifications
  SET 
    is_read = true,
    updated_at = now()
  WHERE 
    id = notification_id AND
    recipient_id = auth.uid()
  RETURNING 1 INTO affected_rows;
  
  RETURN affected_rows = 1;
END;
$$;


ALTER FUNCTION "public"."mark_notification_as_read"("notification_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_prompt_view_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE prompts
    SET view_count = (
      SELECT COUNT(*)
      FROM analytics_views
      WHERE prompt_id = NEW.prompt_id
    )
    WHERE id = NEW.prompt_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_prompt_view_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_reports_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_reports_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_timestamp"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."account_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "show_creator_page" boolean DEFAULT true,
    "add_mentions_on_share" boolean DEFAULT true,
    "allow_reposts" boolean DEFAULT true,
    "show_recommended_creators" boolean DEFAULT true,
    "use_serif_font" boolean DEFAULT false,
    "accept_tips" boolean DEFAULT true,
    "allow_anonymous_purchase" boolean DEFAULT true,
    "opt_out_ai_training" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."account_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_summary" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prompt_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "view_count" integer DEFAULT 0,
    "unique_viewer_count" integer DEFAULT 0,
    "like_count" integer DEFAULT 0,
    "comment_count" integer DEFAULT 0,
    "bookmark_count" integer DEFAULT 0,
    "purchase_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."analytics_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prompt_id" "uuid" NOT NULL,
    "visitor_id" "text" NOT NULL,
    "viewed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."announcement_reads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "announcement_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."announcement_reads" OWNER TO "postgres";


COMMENT ON TABLE "public"."announcement_reads" IS '繝ｦ繝ｼ繧ｶ繝ｼ縺ｮ縺顔衍繧峨○譌｢隱ｭ迥ｶ諷九ｒ邂｡逅・☆繧九ユ繝ｼ繝悶Ν縲ゅΘ繝ｼ繧ｶ繝ｼID縺ｨ縺顔衍繧峨○ID縺ｮ邨・∩蜷医ｏ縺帙〒荳諢上↓隴伜挨縺輔ｌ繧九・;



CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "icon" "text",
    "icon_color" "text",
    "start_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end_date" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


COMMENT ON TABLE "public"."announcements" IS 'Stores system announcements and notifications';



CREATE TABLE IF NOT EXISTS "public"."badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "icon" character varying(255),
    "requirements" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookmarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "prompt_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."bookmarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "parent_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prompt_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "content" "text" NOT NULL,
    "is_edited" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "content_length" CHECK (("char_length"("content") >= 1))
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


COMMENT ON TABLE "public"."contacts" IS '繝ｦ繝ｼ繧ｶ繝ｼ縺九ｉ縺ｮ蝠上＞蜷医ｏ縺・;



CREATE TABLE IF NOT EXISTS "public"."contest_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contest_id" "uuid" NOT NULL,
    "prompt_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "score" integer,
    "rank" integer,
    "is_winner" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contest_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "rules" "text",
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "prize" "text",
    "banner_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drafts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "title" character varying(255),
    "description" "text",
    "content" "text",
    "thumbnail_url" "text",
    "category_id" "uuid",
    "price" numeric(10,2) DEFAULT 0,
    "is_free" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."drafts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "prompt_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."magazine_prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "magazine_id" "uuid" NOT NULL,
    "prompt_id" "uuid" NOT NULL,
    "order_index" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."magazine_prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."magazines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "cover_url" "text",
    "is_public" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "title_length" CHECK (("char_length"(("title")::"text") >= 3))
);


ALTER TABLE "public"."magazines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "likes_enabled" boolean DEFAULT true,
    "comments_enabled" boolean DEFAULT true,
    "follows_enabled" boolean DEFAULT true,
    "mentions_enabled" boolean DEFAULT true,
    "system_enabled" boolean DEFAULT true,
    "email_notifications_enabled" boolean DEFAULT true,
    "push_notifications_enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


COMMENT ON TABLE "public"."notification_preferences" IS 'Stores user notification preferences for different types of notifications';



CREATE TABLE IF NOT EXISTS "public"."notification_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "likes_enabled" boolean DEFAULT true,
    "comments_enabled" boolean DEFAULT true,
    "follows_enabled" boolean DEFAULT true,
    "mentions_enabled" boolean DEFAULT true,
    "system_enabled" boolean DEFAULT true,
    "email_notifications_enabled" boolean DEFAULT true,
    "push_notifications_enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notification_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "sender_id" "uuid",
    "type" character varying(50) NOT NULL,
    "content" "text",
    "resource_type" character varying(50),
    "resource_id" "uuid",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'Stores user notifications for various events like likes, comments, follows, etc.';



CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" character varying(50) NOT NULL,
    "token_id" character varying(255) NOT NULL,
    "card_last4" character varying(4),
    "card_brand" character varying(50),
    "expiry_month" integer,
    "expiry_year" integer,
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "amount" bigint NOT NULL,
    "currency" "text" NOT NULL,
    "intent_id" "text" NOT NULL,
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payout_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "account_type" character varying(50) NOT NULL,
    "account_holder" character varying(255) NOT NULL,
    "account_details" "jsonb" NOT NULL,
    "is_default" boolean DEFAULT false,
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payout_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "transaction_id" character varying(255),
    "payout_method" character varying(50),
    "notes" "text",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."price_tiers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "billing_interval" character varying(50) DEFAULT 'month'::character varying,
    "is_active" boolean DEFAULT true,
    "benefits" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."price_tiers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" character varying(255) NOT NULL,
    "display_name" character varying(255),
    "email" character varying(255) NOT NULL,
    "bio" "text",
    "avatar_url" "text",
    "banner_url" "text",
    "website" character varying(255),
    "github" character varying(255),
    "location" character varying(255),
    "is_premium" boolean DEFAULT false,
    "premium_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_business" boolean DEFAULT false,
    "stripe_account_id" "text",
    CONSTRAINT "username_length" CHECK (("char_length"(("username")::"text") >= 3))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prompt_executions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prompt_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "input" "text",
    "output" "text" NOT NULL,
    "model" character varying(255),
    "execution_time" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."prompt_executions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "content" "text" NOT NULL,
    "thumbnail_url" "text",
    "category_id" "uuid",
    "price" numeric(10,2) DEFAULT 0,
    "is_free" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "is_premium" boolean DEFAULT false,
    "is_ai_generated" boolean DEFAULT false,
    "published" boolean DEFAULT true,
    "view_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "site_url" "text",
    "prompt_title" "text",
    "prompt_content" "text",
    "like_count" smallint DEFAULT '0'::smallint,
    "stripe_product_id" "text",
    "stripe_price_id" "text",
    "stripe_error" "text",
    CONSTRAINT "content_length" CHECK (("char_length"("content") >= 10)),
    CONSTRAINT "title_length" CHECK (("char_length"(("title")::"text") >= 5))
);


ALTER TABLE "public"."prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "prompt_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "status" character varying(50) DEFAULT 'completed'::character varying,
    "payment_id" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."purchases" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."prompt_stats" AS
 SELECT "p"."id" AS "prompt_id",
    "p"."title",
    "p"."author_id",
    "p"."view_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."likes"
          WHERE ("likes"."prompt_id" = "p"."id")) AS "like_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."bookmarks"
          WHERE ("bookmarks"."prompt_id" = "p"."id")) AS "bookmark_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."comments"
          WHERE ("comments"."prompt_id" = "p"."id")) AS "comment_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."purchases"
          WHERE ("purchases"."prompt_id" = "p"."id")) AS "purchase_count"
   FROM "public"."prompts" "p";


ALTER TABLE "public"."prompt_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prompt_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prompt_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."prompt_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recently_viewed_prompts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "prompt_id" "uuid" NOT NULL,
    "viewed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."recently_viewed_prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "target_id" "uuid" NOT NULL,
    "target_type" "text" NOT NULL,
    "prompt_id" "uuid" NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "details" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reports_reason_check" CHECK (("reason" = ANY (ARRAY['inappropriate'::"text", 'spam'::"text", 'harassment'::"text", 'misinformation'::"text", 'other'::"text"]))),
    CONSTRAINT "reports_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'reviewed'::"text", 'dismissed'::"text"]))),
    CONSTRAINT "reports_target_type_check" CHECK (("target_type" = ANY (ARRAY['comment'::"text", 'prompt'::"text"])))
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscriber_id" "uuid" NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "status" character varying(50) DEFAULT 'active'::character varying,
    "price_tier_id" "uuid",
    "current_period_start" timestamp with time zone NOT NULL,
    "current_period_end" timestamp with time zone NOT NULL,
    "cancel_at_period_end" boolean DEFAULT false,
    "payment_method_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "no_self_subscription" CHECK (("subscriber_id" <> "creator_id"))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "badge_id" "uuid" NOT NULL,
    "awarded_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "account_settings" "jsonb" DEFAULT '{"use_mincho_font": false, "social_connections": {"apple": false, "google": false, "twitter": false}, "accept_tip_payments": true, "is_business_account": false, "restrict_ai_learning": false, "add_mention_when_shared": true, "show_recommended_articles": true, "invoice_registration_number": null, "display_account_on_creator_page": true, "allow_introduction_on_official_sns": true, "allow_purchase_by_non_registered_users": true}'::"jsonb",
    "notification_settings" "jsonb" DEFAULT '{"push_notifications": {"likes": true, "follows": true, "comments": true, "mentions": true, "new_posts": true, "reactions": true}, "email_notifications": {"likes": true, "follows": true, "comments": true, "mentions": true, "new_posts": true, "reactions": true, "newsletter": true, "promotions": true}}'::"jsonb",
    "reaction_settings" "jsonb" DEFAULT '{"like_display": "heart", "show_like_count": true, "like_notification": true, "allow_multiple_reactions": true, "auto_like_when_bookmarking": true}'::"jsonb",
    "comment_settings" "jsonb" DEFAULT '{"allow_comments": true, "require_approval": false, "comment_notification": true, "allow_anonymous_comments": true}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."account_settings"
    ADD CONSTRAINT "account_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."account_settings"
    ADD CONSTRAINT "account_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."analytics_summary"
    ADD CONSTRAINT "analytics_summary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_summary"
    ADD CONSTRAINT "analytics_summary_prompt_id_date_key" UNIQUE ("prompt_id", "date");



ALTER TABLE ONLY "public"."analytics_views"
    ADD CONSTRAINT "analytics_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."announcement_reads"
    ADD CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("user_id", "announcement_id");



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_user_id_prompt_id_key" UNIQUE ("user_id", "prompt_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contest_entries"
    ADD CONSTRAINT "contest_entries_contest_id_prompt_id_key" UNIQUE ("contest_id", "prompt_id");



ALTER TABLE ONLY "public"."contest_entries"
    ADD CONSTRAINT "contest_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contests"
    ADD CONSTRAINT "contests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drafts"
    ADD CONSTRAINT "drafts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_user_id_prompt_id_key" UNIQUE ("user_id", "prompt_id");



ALTER TABLE ONLY "public"."magazine_prompts"
    ADD CONSTRAINT "magazine_prompts_magazine_id_prompt_id_key" UNIQUE ("magazine_id", "prompt_id");



ALTER TABLE ONLY "public"."magazine_prompts"
    ADD CONSTRAINT "magazine_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."magazines"
    ADD CONSTRAINT "magazines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payout_accounts"
    ADD CONSTRAINT "payout_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."price_tiers"
    ADD CONSTRAINT "price_tiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."prompt_executions"
    ADD CONSTRAINT "prompt_executions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompt_tags"
    ADD CONSTRAINT "prompt_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompt_tags"
    ADD CONSTRAINT "prompt_tags_prompt_id_tag_id_key" UNIQUE ("prompt_id", "tag_id");



ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_buyer_id_prompt_id_key" UNIQUE ("buyer_id", "prompt_id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recently_viewed_prompts"
    ADD CONSTRAINT "recently_viewed_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recently_viewed_prompts"
    ADD CONSTRAINT "recently_viewed_prompts_user_id_prompt_id_key" UNIQUE ("user_id", "prompt_id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."analytics_views"
    ADD CONSTRAINT "unique_analytics_view" UNIQUE ("prompt_id", "visitor_id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "unique_follower_following" UNIQUE ("follower_id", "following_id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "unique_user_target" UNIQUE ("reporter_id", "target_id", "target_type");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_badge_id_key" UNIQUE ("user_id", "badge_id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_key" UNIQUE ("user_id");



CREATE INDEX "account_settings_user_id_idx" ON "public"."account_settings" USING "btree" ("user_id");



CREATE INDEX "analytics_summary_date_idx" ON "public"."analytics_summary" USING "btree" ("date" DESC);



CREATE INDEX "analytics_summary_prompt_id_idx" ON "public"."analytics_summary" USING "btree" ("prompt_id");



CREATE INDEX "bookmarks_prompt_id_idx" ON "public"."bookmarks" USING "btree" ("prompt_id");



CREATE INDEX "bookmarks_user_id_idx" ON "public"."bookmarks" USING "btree" ("user_id");



CREATE INDEX "categories_created_by_idx" ON "public"."categories" USING "btree" ("created_by");



CREATE INDEX "categories_parent_id_idx" ON "public"."categories" USING "btree" ("parent_id");



CREATE INDEX "categories_slug_idx" ON "public"."categories" USING "btree" ("slug");



CREATE INDEX "comments_parent_id_idx" ON "public"."comments" USING "btree" ("parent_id");



CREATE INDEX "comments_prompt_id_idx" ON "public"."comments" USING "btree" ("prompt_id");



CREATE INDEX "comments_user_id_idx" ON "public"."comments" USING "btree" ("user_id");



CREATE INDEX "contest_entries_contest_id_idx" ON "public"."contest_entries" USING "btree" ("contest_id");



CREATE INDEX "contest_entries_prompt_id_idx" ON "public"."contest_entries" USING "btree" ("prompt_id");



CREATE INDEX "contest_entries_user_id_idx" ON "public"."contest_entries" USING "btree" ("user_id");



CREATE INDEX "drafts_author_id_idx" ON "public"."drafts" USING "btree" ("author_id");



CREATE INDEX "idx_analytics_views_prompt_id" ON "public"."analytics_views" USING "btree" ("prompt_id");



CREATE INDEX "idx_follows_follower_id" ON "public"."follows" USING "btree" ("follower_id");



CREATE INDEX "idx_follows_following_id" ON "public"."follows" USING "btree" ("following_id");



CREATE INDEX "likes_prompt_id_idx" ON "public"."likes" USING "btree" ("prompt_id");



CREATE INDEX "likes_user_id_idx" ON "public"."likes" USING "btree" ("user_id");



CREATE INDEX "magazine_prompts_magazine_id_idx" ON "public"."magazine_prompts" USING "btree" ("magazine_id");



CREATE INDEX "magazine_prompts_prompt_id_idx" ON "public"."magazine_prompts" USING "btree" ("prompt_id");



CREATE INDEX "magazines_author_id_idx" ON "public"."magazines" USING "btree" ("author_id");



CREATE INDEX "notifications_created_at_idx" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "notifications_recipient_id_idx" ON "public"."notifications" USING "btree" ("recipient_id");



CREATE INDEX "payments_intent_id_idx" ON "public"."payments" USING "btree" ("intent_id");



CREATE INDEX "payments_status_idx" ON "public"."payments" USING "btree" ("status");



CREATE INDEX "payments_user_id_idx" ON "public"."payments" USING "btree" ("user_id");



CREATE INDEX "payout_accounts_user_id_idx" ON "public"."payout_accounts" USING "btree" ("user_id");



CREATE INDEX "payouts_status_idx" ON "public"."payouts" USING "btree" ("status");



CREATE INDEX "payouts_user_id_idx" ON "public"."payouts" USING "btree" ("user_id");



CREATE INDEX "price_tiers_creator_id_idx" ON "public"."price_tiers" USING "btree" ("creator_id");



CREATE INDEX "prompt_executions_prompt_id_idx" ON "public"."prompt_executions" USING "btree" ("prompt_id");



CREATE INDEX "prompt_executions_user_id_idx" ON "public"."prompt_executions" USING "btree" ("user_id");



CREATE INDEX "prompt_tags_prompt_id_idx" ON "public"."prompt_tags" USING "btree" ("prompt_id");



CREATE INDEX "prompt_tags_tag_id_idx" ON "public"."prompt_tags" USING "btree" ("tag_id");



CREATE INDEX "prompts_author_id_idx" ON "public"."prompts" USING "btree" ("author_id");



CREATE INDEX "prompts_category_id_idx" ON "public"."prompts" USING "btree" ("category_id");



CREATE INDEX "prompts_created_at_idx" ON "public"."prompts" USING "btree" ("created_at" DESC);



CREATE INDEX "purchases_buyer_id_idx" ON "public"."purchases" USING "btree" ("buyer_id");



CREATE INDEX "purchases_prompt_id_idx" ON "public"."purchases" USING "btree" ("prompt_id");



CREATE INDEX "reports_prompt_id_idx" ON "public"."reports" USING "btree" ("prompt_id");



CREATE INDEX "reports_reporter_id_idx" ON "public"."reports" USING "btree" ("reporter_id");



CREATE INDEX "reports_status_idx" ON "public"."reports" USING "btree" ("status");



CREATE INDEX "reports_target_id_idx" ON "public"."reports" USING "btree" ("target_id");



CREATE INDEX "reports_target_type_idx" ON "public"."reports" USING "btree" ("target_type");



CREATE INDEX "subscriptions_creator_id_idx" ON "public"."subscriptions" USING "btree" ("creator_id");



CREATE INDEX "subscriptions_status_idx" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "subscriptions_subscriber_id_idx" ON "public"."subscriptions" USING "btree" ("subscriber_id");



CREATE INDEX "user_badges_badge_id_idx" ON "public"."user_badges" USING "btree" ("badge_id");



CREATE INDEX "user_badges_user_id_idx" ON "public"."user_badges" USING "btree" ("user_id");



CREATE INDEX "user_settings_user_id_idx" ON "public"."user_settings" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "create_notification_preferences_for_new_user" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."create_notification_preferences"();



CREATE OR REPLACE TRIGGER "delete_old_avatar_trigger" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW WHEN (("old"."avatar_url" IS DISTINCT FROM "new"."avatar_url")) EXECUTE FUNCTION "public"."delete_old_avatar"();



CREATE OR REPLACE TRIGGER "delete_old_thumbnail_trigger" AFTER UPDATE ON "public"."prompts" FOR EACH ROW WHEN (("old"."thumbnail_url" IS DISTINCT FROM "new"."thumbnail_url")) EXECUTE FUNCTION "public"."delete_old_thumbnail"();



CREATE OR REPLACE TRIGGER "delete_thumbnail_on_prompt_delete_trigger" BEFORE DELETE ON "public"."prompts" FOR EACH ROW EXECUTE FUNCTION "public"."delete_thumbnail_on_prompt_delete"();



CREATE OR REPLACE TRIGGER "set_account_settings_updated_at" BEFORE UPDATE ON "public"."account_settings" FOR EACH ROW EXECUTE FUNCTION "public"."account_settings_updated_at"();



CREATE OR REPLACE TRIGGER "set_reports_updated_at" BEFORE UPDATE ON "public"."reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_reports_updated_at"();



CREATE OR REPLACE TRIGGER "update_analytics_summary_updated_at" BEFORE UPDATE ON "public"."analytics_summary" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_contests_updated_at" BEFORE UPDATE ON "public"."contests" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_drafts_updated_at" BEFORE UPDATE ON "public"."drafts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_magazines_updated_at" BEFORE UPDATE ON "public"."magazines" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_notification_settings_updated_at" BEFORE UPDATE ON "public"."notification_settings" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_payment_methods_updated_at" BEFORE UPDATE ON "public"."payment_methods" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_payout_accounts_updated_at" BEFORE UPDATE ON "public"."payout_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_payouts_updated_at" BEFORE UPDATE ON "public"."payouts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_price_tiers_updated_at" BEFORE UPDATE ON "public"."price_tiers" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_prompts_updated_at" BEFORE UPDATE ON "public"."prompts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_subscriptions_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_settings_timestamp" BEFORE UPDATE ON "public"."user_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp"();



CREATE OR REPLACE TRIGGER "update_view_count_trigger" AFTER INSERT ON "public"."analytics_views" FOR EACH ROW EXECUTE FUNCTION "public"."update_prompt_view_count"();



ALTER TABLE ONLY "public"."account_settings"
    ADD CONSTRAINT "account_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics_summary"
    ADD CONSTRAINT "analytics_summary_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."announcement_reads"
    ADD CONSTRAINT "announcement_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contest_entries"
    ADD CONSTRAINT "contest_entries_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contest_entries"
    ADD CONSTRAINT "contest_entries_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contest_entries"
    ADD CONSTRAINT "contest_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."drafts"
    ADD CONSTRAINT "drafts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."magazine_prompts"
    ADD CONSTRAINT "magazine_prompts_magazine_id_fkey" FOREIGN KEY ("magazine_id") REFERENCES "public"."magazines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."magazine_prompts"
    ADD CONSTRAINT "magazine_prompts_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."magazines"
    ADD CONSTRAINT "magazines_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payout_accounts"
    ADD CONSTRAINT "payout_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."price_tiers"
    ADD CONSTRAINT "price_tiers_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompt_executions"
    ADD CONSTRAINT "prompt_executions_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompt_executions"
    ADD CONSTRAINT "prompt_executions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompt_tags"
    ADD CONSTRAINT "prompt_tags_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompt_tags"
    ADD CONSTRAINT "prompt_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recently_viewed_prompts"
    ADD CONSTRAINT "recently_viewed_prompts_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recently_viewed_prompts"
    ADD CONSTRAINT "recently_viewed_prompts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recently_viewed_prompts"
    ADD CONSTRAINT "recently_viewed_prompts_user_id_idx" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can select analytics" ON "public"."analytics_views" FOR SELECT TO "authenticated" USING ((("auth"."role"() = 'service_role'::"text") OR ("auth"."role"() = 'supabase_admin'::"text")));



CREATE POLICY "Allow admin by domain" ON "public"."feedback" TO "authenticated" USING (((("auth"."jwt"() ->> 'email'::"text") ~~ '%@queuetech.jp'::"text") OR (("auth"."jwt"() ->> 'email'::"text") ~~ '%@queue-tech.jp'::"text")));



CREATE POLICY "Allow admin read/update" ON "public"."feedback" TO "authenticated" USING (((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['admin@example.com'::"text", 'taniguchi.kouhei@gmail.com'::"text", 'queue@queuetech.jp'::"text", 'admin@queuetech.jp'::"text", 'queue@queue-tech.jp'::"text"])) OR (("auth"."jwt"() ->> 'email'::"text") ~~ '%@queuetech.jp'::"text") OR (("auth"."jwt"() ->> 'email'::"text") ~~ '%@queue-tech.jp'::"text")));



CREATE POLICY "Allow anonymous insert" ON "public"."feedback" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow authenticated insert" ON "public"."feedback" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Anyone can insert analytics" ON "public"."analytics_views" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can read active announcements" ON "public"."announcements" FOR SELECT USING ((("is_active" = true) AND (("end_date" IS NULL) OR ("end_date" > "now"()))));



CREATE POLICY "Only admins can manage announcements" ON "public"."announcements" TO "authenticated" USING (((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['queue@queuetech.jp'::"text", 'admin@queuetech.jp'::"text", 'queue@queue-tech.jp'::"text", 'admin@example.com'::"text", 'taniguchi.kouhei@gmail.com'::"text"])) OR (("auth"."jwt"() ->> 'email'::"text") ~~ '%@queuetech.jp'::"text") OR (("auth"."jwt"() ->> 'email'::"text") ~~ '%@queue-tech.jp'::"text")));



CREATE POLICY "Users can delete their own announcement reads" ON "public"."announcement_reads" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own announcement reads" ON "public"."announcement_reads" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own announcement reads" ON "public"."announcement_reads" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own announcement reads" ON "public"."announcement_reads" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."account_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_all_permissions" ON "public"."contacts" TO "authenticated" USING (((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['queue@queuetech.jp'::"text", 'admin@queuetech.jp'::"text", 'queue@queue-tech.jp'::"text", 'admin@example.com'::"text", 'taniguchi.kouhei@gmail.com'::"text"])) OR (("auth"."jwt"() ->> 'email'::"text") ~~ '%@queuetech.jp'::"text") OR (("auth"."jwt"() ->> 'email'::"text") ~~ '%@queue-tech.jp'::"text")));



ALTER TABLE "public"."analytics_summary" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."announcement_reads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anon_can_insert" ON "public"."contacts" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "auth_can_insert" ON "public"."contacts" FOR INSERT TO "authenticated" WITH CHECK (true);



ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookmarks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contest_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drafts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "follows_insert_policy" ON "public"."follows" FOR INSERT TO "authenticated" WITH CHECK (true);



ALTER TABLE "public"."likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."magazine_prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."magazines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payout_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."price_tiers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prompt_executions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prompt_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prompts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "prompts_insert_policy" ON "public"."prompts" FOR INSERT WITH CHECK ((("is_free" = true) OR ("price" IS NULL) OR ("price" = (0)::numeric) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."stripe_account_id" IS NOT NULL))))));



ALTER TABLE "public"."purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recently_viewed_prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "縺・＞縺ｭ縺ｯ隱ｰ縺ｧ繧ょ盾辣ｧ蜿ｯ閭ｽ" ON "public"."likes" FOR SELECT USING (true);



CREATE POLICY "繧ｫ繝・ざ繝ｪ縺ｮ隱ｭ縺ｿ蜿悶ｊ繧貞・蜩｡縺ｫ險ｱ蜿ｯ" ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "繧ｯ繝ｪ繧ｨ繧､繧ｿ繝ｼ縺ｯ閾ｪ蛻・・萓｡譬ｼ繝励Λ繝ｳ縺ｮ縺ｿ菴懈・蜿ｯ閭ｽ" ON "public"."price_tiers" FOR INSERT WITH CHECK (("auth"."uid"() = "creator_id"));



CREATE POLICY "繧ｯ繝ｪ繧ｨ繧､繧ｿ繝ｼ縺ｯ閾ｪ蛻・・萓｡譬ｼ繝励Λ繝ｳ縺ｮ縺ｿ蜑企勁蜿ｯ閭ｽ" ON "public"."price_tiers" FOR DELETE USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "繧ｯ繝ｪ繧ｨ繧､繧ｿ繝ｼ縺ｯ閾ｪ蛻・・萓｡譬ｼ繝励Λ繝ｳ縺ｮ縺ｿ譖ｴ譁ｰ蜿ｯ閭ｽ" ON "public"."price_tiers" FOR UPDATE USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "繧ｯ繝ｪ繧ｨ繧､繧ｿ繝ｼ縺ｯ閾ｪ蛻・∈縺ｮ雉ｼ隱ｭ繧貞盾辣ｧ蜿ｯ閭ｽ" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "繧ｳ繝｡繝ｳ繝医・隱ｰ縺ｧ繧ょ盾辣ｧ蜿ｯ閭ｽ" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "繧ｳ繝ｳ繝・せ繝医・隱ｰ縺ｧ繧ょ盾辣ｧ蜿ｯ閭ｽ" ON "public"."contests" FOR SELECT USING (true);



CREATE POLICY "繧ｳ繝ｳ繝・せ繝亥ｿ懷供縺ｯ隱ｰ縺ｧ繧ょ盾辣ｧ蜿ｯ閭ｽ" ON "public"."contest_entries" FOR SELECT USING (true);



CREATE POLICY "繧ｷ繧ｹ繝・Β縺ｮ縺ｿ繝ｦ繝ｼ繧ｶ繝ｼ繝舌ャ繧ｸ菴懈・蜿ｯ閭ｽ" ON "public"."user_badges" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "繧ｷ繧ｹ繝・Β縺ｯ邨ｱ險医し繝槭Μ繝ｼ菴懈・蜿ｯ閭ｽ" ON "public"."analytics_summary" FOR INSERT WITH CHECK (true);



CREATE POLICY "繧ｷ繧ｹ繝・Β縺ｯ邨ｱ險医し繝槭Μ繝ｼ譖ｴ譁ｰ蜿ｯ閭ｽ" ON "public"."analytics_summary" FOR UPDATE USING (true);



CREATE POLICY "繧ｷ繧ｹ繝・Β縺ｯ雉ｼ蜈･螻･豁ｴ菴懈・蜿ｯ閭ｽ" ON "public"."purchases" FOR INSERT WITH CHECK (true);



CREATE POLICY "繧ｷ繧ｹ繝・Β縺ｯ騾夂衍菴懈・蜿ｯ閭ｽ" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "繧ｿ繧ｰ縺ｯ隱ｰ縺ｧ繧ょ盾辣ｧ蜿ｯ閭ｽ" ON "public"."tags" FOR SELECT USING (true);



CREATE POLICY "繝舌ャ繧ｸ縺ｯ隱ｰ縺ｧ繧ょ盾辣ｧ蜿ｯ閭ｽ" ON "public"."badges" FOR SELECT USING (true);



CREATE POLICY "繝輔か繝ｭ繝ｼ髢｢菫ゅｒ縺吶∋縺ｦ縺ｮ繝ｦ繝ｼ繧ｶ繝ｼ縺碁夢隕ｧ蜿ｯ閭ｽ" ON "public"."follows" FOR SELECT USING (true);



CREATE POLICY "繝励Ο繝輔ぅ繝ｼ繝ｫ縺ｯ隱ｰ縺ｧ繧ょ盾辣ｧ蜿ｯ閭ｽ" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "繝励Ο繝ｳ繝励ヨ縺ｯ菴懆・・縺ｿ蜑企勁蜿ｯ閭ｽ" ON "public"."prompts" FOR DELETE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "繝励Ο繝ｳ繝励ヨ縺ｯ菴懆・・縺ｿ譖ｴ譁ｰ蜿ｯ閭ｽ" ON "public"."prompts" FOR UPDATE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "繝励Ο繝ｳ繝励ヨ繧ｿ繧ｰ縺ｯ隱ｰ縺ｧ繧ょ盾辣ｧ蜿ｯ閭ｽ" ON "public"."prompt_tags" FOR SELECT USING (true);



CREATE POLICY "繝励Ο繝ｳ繝励ヨ菴懆・・縺ｿ繧ｿ繧ｰ莉倥￠蜿ｯ閭ｽ" ON "public"."prompt_tags" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."prompts"
  WHERE (("prompts"."id" = "prompt_tags"."prompt_id") AND ("prompts"."author_id" = "auth"."uid"())))));



CREATE POLICY "繝励Ο繝ｳ繝励ヨ菴懆・・縺ｿ繧ｿ繧ｰ蜑企勁蜿ｯ閭ｽ" ON "public"."prompt_tags" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."prompts"
  WHERE (("prompts"."id" = "prompt_tags"."prompt_id") AND ("prompts"."author_id" = "auth"."uid"())))));



CREATE POLICY "繝励Ο繝ｳ繝励ヨ菴懆・・閾ｪ蛻・・蝠・刀縺ｮ雉ｼ蜈･螻･豁ｴ蜿ら・蜿ｯ" ON "public"."purchases" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."prompts"
  WHERE (("prompts"."id" = "purchases"."prompt_id") AND ("prompts"."author_id" = "auth"."uid"())))));



CREATE POLICY "繝槭ぎ繧ｸ繝ｳ縺ｯ菴懆・・縺ｿ蜑企勁蜿ｯ閭ｽ" ON "public"."magazines" FOR DELETE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "繝槭ぎ繧ｸ繝ｳ縺ｯ菴懆・・縺ｿ譖ｴ譁ｰ蜿ｯ閭ｽ" ON "public"."magazines" FOR UPDATE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "繝槭ぎ繧ｸ繝ｳ繝励Ο繝ｳ繝励ヨ髢｢騾｣縺ｯ隱ｰ縺ｧ繧ょ盾辣ｧ蜿ｯ閭ｽ" ON "public"."magazine_prompts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."magazines"
  WHERE (("magazines"."id" = "magazine_prompts"."magazine_id") AND ("magazines"."is_public" = true)))));



CREATE POLICY "繝槭ぎ繧ｸ繝ｳ菴懆・・縺ｿ繝励Ο繝ｳ繝励ヨ蜑企勁蜿ｯ閭ｽ" ON "public"."magazine_prompts" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."magazines"
  WHERE (("magazines"."id" = "magazine_prompts"."magazine_id") AND ("magazines"."author_id" = "auth"."uid"())))));



CREATE POLICY "繝槭ぎ繧ｸ繝ｳ菴懆・・縺ｿ繝励Ο繝ｳ繝励ヨ霑ｽ蜉蜿ｯ閭ｽ" ON "public"."magazine_prompts" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."magazines"
  WHERE (("magazines"."id" = "magazine_prompts"."magazine_id") AND ("magazines"."author_id" = "auth"."uid"())))));



CREATE POLICY "繝槭ぎ繧ｸ繝ｳ菴懆・・縺ｿ繝励Ο繝ｳ繝励ヨ鬆・ｺ乗峩譁ｰ蜿ｯ閭ｽ" ON "public"."magazine_prompts" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."magazines"
  WHERE (("magazines"."id" = "magazine_prompts"."magazine_id") AND ("magazines"."author_id" = "auth"."uid"())))));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・縺・＞縺ｭ縺ｮ縺ｿ蜑企勁蜿ｯ閭ｽ" ON "public"."likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・繧｢繧ｫ繧ｦ繝ｳ繝郁ｨｭ螳壹・縺ｿ菴懈・蜿ｯ閭ｽ" ON "public"."account_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・繧｢繧ｫ繧ｦ繝ｳ繝郁ｨｭ螳壹・縺ｿ蜑企勁蜿ｯ閭ｽ" ON "public"."account_settings" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・繧｢繧ｫ繧ｦ繝ｳ繝郁ｨｭ螳壹・縺ｿ蜿ら・蜿ｯ閭ｽ" ON "public"."account_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・繧｢繧ｫ繧ｦ繝ｳ繝郁ｨｭ螳壹・縺ｿ譖ｴ譁ｰ蜿ｯ閭ｽ" ON "public"."account_settings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・繧ｳ繝｡繝ｳ繝医・縺ｿ蜑企勁蜿ｯ閭ｽ" ON "public"."comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・繧ｳ繝｡繝ｳ繝医・縺ｿ譖ｴ譁ｰ蜿ｯ閭ｽ" ON "public"."comments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・繧ｵ繝悶せ繧ｯ繝ｪ繝励す繝ｧ繝ｳ縺ｮ縺ｿ蜿ら・" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "subscriber_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・繧ｵ繝悶せ繧ｯ繝ｪ繝励す繝ｧ繝ｳ縺ｮ縺ｿ譖ｴ譁ｰ" ON "public"."subscriptions" FOR UPDATE USING (("auth"."uid"() = "subscriber_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・繝悶ャ繧ｯ繝槭・繧ｯ縺ｮ縺ｿ蜑企勁蜿ｯ閭ｽ" ON "public"."bookmarks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・繝悶ャ繧ｯ繝槭・繧ｯ縺ｮ縺ｿ蜿ら・蜿ｯ閭ｽ" ON "public"."bookmarks" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・繝励Ο繝輔ぅ繝ｼ繝ｫ縺ｮ縺ｿ蜑企勁蜿ｯ閭ｽ" ON "public"."profiles" FOR DELETE USING (("auth"."uid"() = "id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・繝励Ο繝輔ぅ繝ｼ繝ｫ縺ｮ縺ｿ譖ｴ譁ｰ蜿ｯ閭ｽ" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・蜿｣蠎ｧ諠・ｱ縺ｮ縺ｿ蜑企勁蜿ｯ閭ｽ" ON "public"."payout_accounts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・蜿｣蠎ｧ諠・ｱ縺ｮ縺ｿ蜿ら・蜿ｯ閭ｽ" ON "public"."payout_accounts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・蜿｣蠎ｧ諠・ｱ縺ｮ縺ｿ譖ｴ譁ｰ蜿ｯ閭ｽ" ON "public"."payout_accounts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・蠢懷供縺ｮ縺ｿ蜑企勁蜿ｯ閭ｽ" ON "public"."contest_entries" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・謾ｯ謇輔＞譁ｹ豕輔・縺ｿ蜑企勁蜿ｯ閭ｽ" ON "public"."payment_methods" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・謾ｯ謇輔＞譁ｹ豕輔・縺ｿ蜿ら・蜿ｯ閭ｽ" ON "public"."payment_methods" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・謾ｯ謇輔＞譁ｹ豕輔・縺ｿ譖ｴ譁ｰ蜿ｯ閭ｽ" ON "public"."payment_methods" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・謾ｯ謇輔＞險倬鹸縺ｮ縺ｿ蜿ら・蜿ｯ閭ｽ" ON "public"."payouts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・險ｭ螳壹ｒ蜑企勁縺ｧ縺阪ｋ" ON "public"."user_settings" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・險ｭ螳壹ｒ蜿ら・縺ｧ縺阪ｋ" ON "public"."user_settings" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・險ｭ螳壹ｒ譖ｴ譁ｰ縺ｧ縺阪ｋ" ON "public"."user_settings" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・險ｭ螳壹ｒ霑ｽ蜉縺ｧ縺阪ｋ" ON "public"."user_settings" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・雉ｼ蜈･螻･豁ｴ縺ｮ縺ｿ蜿ら・蜿ｯ閭ｽ" ON "public"."purchases" FOR SELECT USING (("auth"."uid"() = "buyer_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・騾夂衍險ｭ螳壹・縺ｿ菴懈・蜿ｯ閭ｽ" ON "public"."notification_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・騾夂衍險ｭ螳壹・縺ｿ蜿ら・蜿ｯ閭ｽ" ON "public"."notification_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・騾夂衍險ｭ螳壹・縺ｿ譖ｴ譁ｰ蜿ｯ閭ｽ" ON "public"."notification_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・騾夂衍險ｭ螳壹・縺ｿ譖ｴ譁ｰ蜿ｯ閭ｽ" ON "public"."notification_settings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・騾夂衍險ｭ螳壹・縺ｿ髢ｲ隕ｧ蜿ｯ閭ｽ" ON "public"."notification_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・髢ｲ隕ｧ螻･豁ｴ縺ｮ縺ｿ蜑企勁蜿ｯ閭ｽ" ON "public"."recently_viewed_prompts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・髢ｲ隕ｧ螻･豁ｴ縺ｮ縺ｿ蜿ら・蜿ｯ閭ｽ" ON "public"."recently_viewed_prompts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・髢ｲ隕ｧ螻･豁ｴ縺ｮ縺ｿ譖ｴ譁ｰ蜿ｯ閭ｽ" ON "public"."recently_viewed_prompts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・・髢ｲ隕ｧ螻･豁ｴ繧定ｿｽ蜉蜿ｯ閭ｽ" ON "public"."recently_viewed_prompts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・ｮ帙・騾夂衍縺ｮ縺ｿ蜑企勁蜿ｯ閭ｽ" ON "public"."notifications" FOR DELETE USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・ｮ帙・騾夂衍縺ｮ縺ｿ蜿ら・蜿ｯ閭ｽ" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・ｮ帙・騾夂衍縺ｮ縺ｿ譖ｴ譁ｰ蜿ｯ閭ｽ" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ閾ｪ蛻・ｮ帙・騾夂衍縺ｮ縺ｿ髢ｲ隕ｧ蜿ｯ閭ｽ" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "繝ｦ繝ｼ繧ｶ繝ｼ繝舌ャ繧ｸ縺ｯ隱ｰ縺ｧ繧ょ盾辣ｧ蜿ｯ閭ｽ" ON "public"."user_badges" FOR SELECT USING (true);



CREATE POLICY "繝ｬ繝昴・繝井ｽ懈・閠・′閾ｪ蛻・・繝ｬ繝昴・繝医ｒ髢ｲ隕ｧ縺ｧ縺阪ｋ" ON "public"."reports" FOR SELECT TO "authenticated" USING ((("reporter_id" = "auth"."uid"()) OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "荳区嶌縺阪・菴懆・・縺ｿ蜑企勁蜿ｯ閭ｽ" ON "public"."drafts" FOR DELETE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "荳区嶌縺阪・菴懆・・縺ｿ蜿ら・蜿ｯ閭ｽ" ON "public"."drafts" FOR SELECT USING (("auth"."uid"() = "author_id"));



CREATE POLICY "荳区嶌縺阪・菴懆・・縺ｿ譖ｴ譁ｰ蜿ｯ閭ｽ" ON "public"."drafts" FOR UPDATE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "萓｡譬ｼ繝励Λ繝ｳ縺ｯ隱ｰ縺ｧ繧ょ盾辣ｧ蜿ｯ閭ｽ" ON "public"."price_tiers" FOR SELECT USING (true);



CREATE POLICY "蜈ｨ縺ｦ縺ｮ隱崎ｨｼ繝ｦ繝ｼ繧ｶ繝ｼ縺後Ξ繝昴・繝医ｒ菴懈・縺ｧ縺阪ｋ" ON "public"."reports" FOR INSERT TO "authenticated" WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "蜈ｬ髢九・繝ｭ繝ｳ繝励ヨ縺ｯ隱ｰ縺ｧ繧ょ盾辣ｧ蜿ｯ閭ｽ" ON "public"."prompts" FOR SELECT USING (("published" = true));



CREATE POLICY "蜈ｬ髢九・繧ｬ繧ｸ繝ｳ縺ｯ隱ｰ縺ｧ繧ょ盾辣ｧ蜿ｯ閭ｽ" ON "public"."magazines" FOR SELECT USING (("is_public" = true));



CREATE POLICY "螳溯｡檎ｵ先棡縺ｯ菴懈・閠・・縺ｿ蜑企勁蜿ｯ閭ｽ" ON "public"."prompt_executions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "螳溯｡檎ｵ先棡縺ｯ隱ｰ縺ｧ繧ょ盾辣ｧ蜿ｯ閭ｽ" ON "public"."prompt_executions" FOR SELECT USING (true);



CREATE POLICY "邂｡逅・・・縺ｿ繧ｳ繝ｳ繝・せ繝井ｽ懈・蜿ｯ閭ｽ" ON "public"."contests" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "邂｡逅・・・縺ｿ繧ｳ繝ｳ繝・せ繝亥炎髯､蜿ｯ閭ｽ" ON "public"."contests" FOR DELETE USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "邂｡逅・・・縺ｿ繧ｳ繝ｳ繝・せ繝域峩譁ｰ蜿ｯ閭ｽ" ON "public"."contests" FOR UPDATE USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "邂｡逅・・・縺ｿ繝舌ャ繧ｸ菴懈・蜿ｯ閭ｽ" ON "public"."badges" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "邂｡逅・・・縺ｿ繝舌ャ繧ｸ譖ｴ譁ｰ蜿ｯ閭ｽ" ON "public"."badges" FOR UPDATE USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "邂｡逅・・・縺ｿ繝ｬ繝昴・繝医ｒ蜑企勁縺ｧ縺阪ｋ" ON "public"."reports" FOR DELETE TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "邂｡逅・・・縺ｿ繝ｬ繝昴・繝医ｒ譖ｴ譁ｰ縺ｧ縺阪ｋ" ON "public"."reports" FOR UPDATE TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "邂｡逅・・・繧ｳ繝ｳ繝・せ繝亥ｿ懷供譖ｴ譁ｰ蜿ｯ閭ｽ" ON "public"."contest_entries" FOR UPDATE USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "邂｡逅・・・謾ｯ謇輔＞險倬鹸菴懈・蜿ｯ閭ｽ" ON "public"."payouts" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "邂｡逅・・・謾ｯ謇輔＞險倬鹸譖ｴ譁ｰ蜿ｯ閭ｽ" ON "public"."payouts" FOR UPDATE USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "邨ｱ險医し繝槭Μ繝ｼ縺ｯ繧ｳ繝ｳ繝・Φ繝・ｽ懆・・縺ｿ蜿ら・蜿ｯ閭ｽ" ON "public"."analytics_summary" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."prompts"
  WHERE (("prompts"."id" = "analytics_summary"."prompt_id") AND ("prompts"."author_id" = "auth"."uid"())))));



CREATE POLICY "閾ｪ蛻・〒菴懈・縺励◆繧ｫ繝・ざ繝ｪ縺ｮ蜑企勁繧定ｨｱ蜿ｯ" ON "public"."categories" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "閾ｪ蛻・〒菴懈・縺励◆繧ｫ繝・ざ繝ｪ縺ｮ譖ｴ譁ｰ繧定ｨｱ蜿ｯ" ON "public"."categories" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "閾ｪ蛻・・繝輔か繝ｭ繝ｼ縺ｮ縺ｿ蜑企勁蜿ｯ閭ｽ" ON "public"."follows" FOR DELETE USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "隱崎ｨｼ貂医∩繝ｦ繝ｼ繧ｶ繝ｼ縺ｮ縺ｿ繝輔か繝ｭ繝ｼ縺ｧ縺阪ｋ" ON "public"."follows" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "隱崎ｨｼ貂医∩繝ｦ繝ｼ繧ｶ繝ｼ縺ｮ繧ｫ繝・ざ繝ｪ菴懈・繧定ｨｱ蜿ｯ" ON "public"."categories" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "隱崎ｨｼ貂医∩繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ縺・＞縺ｭ蜿ｯ閭ｽ" ON "public"."likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "隱崎ｨｼ貂医∩繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ繧ｳ繝｡繝ｳ繝亥庄閭ｽ" ON "public"."comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "隱崎ｨｼ貂医∩繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ繧ｳ繝ｳ繝・せ繝亥ｿ懷供蜿ｯ閭ｽ" ON "public"."contest_entries" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."prompts"
  WHERE (("prompts"."id" = "contest_entries"."prompt_id") AND ("prompts"."author_id" = "auth"."uid"()))))));



CREATE POLICY "隱崎ｨｼ貂医∩繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ繧ｵ繝悶せ繧ｯ繝ｪ繝励す繝ｧ繝ｳ菴懈・蜿ｯ" ON "public"."subscriptions" FOR INSERT WITH CHECK (("auth"."uid"() = "subscriber_id"));



CREATE POLICY "隱崎ｨｼ貂医∩繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ繧ｿ繧ｰ菴懈・蜿ｯ閭ｽ" ON "public"."tags" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "隱崎ｨｼ貂医∩繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ繝悶ャ繧ｯ繝槭・繧ｯ蜿ｯ閭ｽ" ON "public"."bookmarks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "隱崎ｨｼ貂医∩繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ繝励Ο繝ｳ繝励ヨ菴懈・蜿ｯ閭ｽ" ON "public"."prompts" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "隱崎ｨｼ貂医∩繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ繝槭ぎ繧ｸ繝ｳ菴懈・蜿ｯ閭ｽ" ON "public"."magazines" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "隱崎ｨｼ貂医∩繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ荳区嶌縺堺ｽ懈・蜿ｯ閭ｽ" ON "public"."drafts" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "隱崎ｨｼ貂医∩繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ蜿｣蠎ｧ諠・ｱ菴懈・蜿ｯ閭ｽ" ON "public"."payout_accounts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "隱崎ｨｼ貂医∩繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ螳溯｡檎ｵ先棡菴懈・蜿ｯ閭ｽ" ON "public"."prompt_executions" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "隱崎ｨｼ貂医∩繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ謾ｯ謇輔＞譁ｹ豕穂ｽ懈・蜿ｯ閭ｽ" ON "public"."payment_methods" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "隱崎ｨｼ貂医∩繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ騾夂衍險ｭ螳壻ｽ懈・蜿ｯ閭ｽ" ON "public"."notification_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "髱槫・髢九・繝ｭ繝ｳ繝励ヨ縺ｯ菴懆・・縺ｿ蜿ら・蜿ｯ閭ｽ" ON "public"."prompts" FOR SELECT USING (("auth"."uid"() = "author_id"));



CREATE POLICY "髱槫・髢九・繧ｬ繧ｸ繝ｳ縺ｮ繝励Ο繝ｳ繝励ヨ髢｢騾｣縺ｯ菴懆・・縺ｿ蜿・ ON "public"."magazine_prompts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."magazines"
  WHERE (("magazines"."id" = "magazine_prompts"."magazine_id") AND ("magazines"."author_id" = "auth"."uid"())))));



CREATE POLICY "髱槫・髢九・繧ｬ繧ｸ繝ｳ縺ｯ菴懆・・縺ｿ蜿ら・蜿ｯ閭ｽ" ON "public"."magazines" FOR SELECT USING (("auth"."uid"() = "author_id"));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."account_settings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."account_settings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."account_settings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_follows_table_if_not_exists"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_follows_table_if_not_exists"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_follows_table_if_not_exists"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification_preferences"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification_preferences"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification_preferences"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_old_avatar"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_old_avatar"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_old_avatar"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_old_thumbnail"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_old_thumbnail"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_old_thumbnail"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_thumbnail_on_prompt_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_thumbnail_on_prompt_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_thumbnail_on_prompt_delete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_accurate_view_count"("prompt_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_accurate_view_count"("prompt_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_accurate_view_count"("prompt_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "anon";
GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_feedback"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_feedback"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_feedback"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment"("count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment"("count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment"("count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_view_count"("prompt_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_view_count"("prompt_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_view_count"("prompt_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_contact"("p_name" "text", "p_email" "text", "p_subject" "text", "p_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_contact"("p_name" "text", "p_email" "text", "p_subject" "text", "p_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_contact"("p_name" "text", "p_email" "text", "p_subject" "text", "p_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_feedback"("p_feedback_type" "text", "p_email" "text", "p_message" "text", "p_is_read" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_feedback"("p_feedback_type" "text", "p_email" "text", "p_message" "text", "p_is_read" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_feedback"("p_feedback_type" "text", "p_email" "text", "p_message" "text", "p_is_read" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_notification"("recipient_id" "uuid", "type" "text", "content" "text", "sender_id" "uuid", "resource_type" "text", "resource_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_notification"("recipient_id" "uuid", "type" "text", "content" "text", "sender_id" "uuid", "resource_type" "text", "resource_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_notification"("recipient_id" "uuid", "type" "text", "content" "text", "sender_id" "uuid", "resource_type" "text", "resource_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"() TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_notification_as_read"("notification_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notification_as_read"("notification_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notification_as_read"("notification_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_prompt_view_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_prompt_view_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_prompt_view_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_reports_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_reports_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_reports_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "service_role";



GRANT ALL ON TABLE "public"."account_settings" TO "anon";
GRANT ALL ON TABLE "public"."account_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."account_settings" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_summary" TO "anon";
GRANT ALL ON TABLE "public"."analytics_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_summary" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_views" TO "anon";
GRANT ALL ON TABLE "public"."analytics_views" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_views" TO "service_role";



GRANT ALL ON TABLE "public"."announcement_reads" TO "anon";
GRANT ALL ON TABLE "public"."announcement_reads" TO "authenticated";
GRANT ALL ON TABLE "public"."announcement_reads" TO "service_role";



GRANT ALL ON TABLE "public"."announcements" TO "anon";
GRANT ALL ON TABLE "public"."announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."announcements" TO "service_role";



GRANT ALL ON TABLE "public"."badges" TO "anon";
GRANT ALL ON TABLE "public"."badges" TO "authenticated";
GRANT ALL ON TABLE "public"."badges" TO "service_role";



GRANT ALL ON TABLE "public"."bookmarks" TO "anon";
GRANT ALL ON TABLE "public"."bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."bookmarks" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."contest_entries" TO "anon";
GRANT ALL ON TABLE "public"."contest_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."contest_entries" TO "service_role";



GRANT ALL ON TABLE "public"."contests" TO "anon";
GRANT ALL ON TABLE "public"."contests" TO "authenticated";
GRANT ALL ON TABLE "public"."contests" TO "service_role";



GRANT ALL ON TABLE "public"."drafts" TO "anon";
GRANT ALL ON TABLE "public"."drafts" TO "authenticated";
GRANT ALL ON TABLE "public"."drafts" TO "service_role";



GRANT ALL ON TABLE "public"."follows" TO "anon";
GRANT ALL ON TABLE "public"."follows" TO "authenticated";
GRANT ALL ON TABLE "public"."follows" TO "service_role";



GRANT ALL ON TABLE "public"."likes" TO "anon";
GRANT ALL ON TABLE "public"."likes" TO "authenticated";
GRANT ALL ON TABLE "public"."likes" TO "service_role";



GRANT ALL ON TABLE "public"."magazine_prompts" TO "anon";
GRANT ALL ON TABLE "public"."magazine_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."magazine_prompts" TO "service_role";



GRANT ALL ON TABLE "public"."magazines" TO "anon";
GRANT ALL ON TABLE "public"."magazines" TO "authenticated";
GRANT ALL ON TABLE "public"."magazines" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."notification_settings" TO "anon";
GRANT ALL ON TABLE "public"."notification_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_settings" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."payout_accounts" TO "anon";
GRANT ALL ON TABLE "public"."payout_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."payout_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."payouts" TO "anon";
GRANT ALL ON TABLE "public"."payouts" TO "authenticated";
GRANT ALL ON TABLE "public"."payouts" TO "service_role";



GRANT ALL ON TABLE "public"."price_tiers" TO "anon";
GRANT ALL ON TABLE "public"."price_tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."price_tiers" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."prompt_executions" TO "anon";
GRANT ALL ON TABLE "public"."prompt_executions" TO "authenticated";
GRANT ALL ON TABLE "public"."prompt_executions" TO "service_role";



GRANT ALL ON TABLE "public"."prompts" TO "anon";
GRANT ALL ON TABLE "public"."prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."prompts" TO "service_role";



GRANT ALL ON TABLE "public"."purchases" TO "anon";
GRANT ALL ON TABLE "public"."purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases" TO "service_role";



GRANT ALL ON TABLE "public"."prompt_stats" TO "anon";
GRANT ALL ON TABLE "public"."prompt_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."prompt_stats" TO "service_role";



GRANT ALL ON TABLE "public"."prompt_tags" TO "anon";
GRANT ALL ON TABLE "public"."prompt_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."prompt_tags" TO "service_role";



GRANT ALL ON TABLE "public"."recently_viewed_prompts" TO "anon";
GRANT ALL ON TABLE "public"."recently_viewed_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."recently_viewed_prompts" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."user_badges" TO "anon";
GRANT ALL ON TABLE "public"."user_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."user_badges" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;
