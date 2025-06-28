-- データベーストリガーで自動通知を送信する設定

-- 1. Webhookを作成（Edge Functionを呼び出し）
CREATE OR REPLACE FUNCTION notify_auto_notification()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  payload jsonb;
BEGIN
  -- auto-notification Edge Functionを呼び出し
  SELECT extensions.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/auto-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    )
  ) INTO request_id;
END;
$$;

-- 2. コメント投稿時の通知トリガー
CREATE OR REPLACE FUNCTION trigger_comment_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- auto-notification Edge Functionを呼び出し
  SELECT extensions.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/auto-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'comments',
      'record', row_to_json(NEW)
    )
  ) INTO request_id;
  
  RETURN NEW;
END;
$$;

-- 3. いいね時の通知トリガー  
CREATE OR REPLACE FUNCTION trigger_like_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- auto-notification Edge Functionを呼び出し
  SELECT extensions.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/auto-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'likes',
      'record', row_to_json(NEW)
    )
  ) INTO request_id;
  
  RETURN NEW;
END;
$$;

-- 4. フォロー時の通知トリガー
CREATE OR REPLACE FUNCTION trigger_follow_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- auto-notification Edge Functionを呼び出し
  SELECT extensions.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/auto-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'follows',
      'record', row_to_json(NEW)
    )
  ) INTO request_id;
  
  RETURN NEW;
END;
$$;

-- 5. お知らせ投稿時の通知トリガー
CREATE OR REPLACE FUNCTION trigger_announcement_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- auto-notification Edge Functionを呼び出し
  SELECT extensions.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/auto-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'announcements',
      'record', row_to_json(NEW)
    )
  ) INTO request_id;
  
  RETURN NEW;
END;
$$;

-- 6. トリガーを各テーブルに設定

-- コメントテーブルのトリガー
DROP TRIGGER IF EXISTS on_comment_insert_notification ON comments;
CREATE TRIGGER on_comment_insert_notification
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_comment_notification();

-- いいねテーブルのトリガー
DROP TRIGGER IF EXISTS on_like_insert_notification ON likes;
CREATE TRIGGER on_like_insert_notification
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_like_notification();

-- フォローテーブルのトリガー
DROP TRIGGER IF EXISTS on_follow_insert_notification ON follows;
CREATE TRIGGER on_follow_insert_notification
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION trigger_follow_notification();

-- お知らせテーブルのトリガー
DROP TRIGGER IF EXISTS on_announcement_insert_notification ON announcements;
CREATE TRIGGER on_announcement_insert_notification
  AFTER INSERT ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION trigger_announcement_notification();

-- 7. 設定値をセット（実際の値に置き換える必要があります）
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key'; 