-- 通知トリガー関数の作成
CREATE OR REPLACE FUNCTION trigger_auto_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- auto-notification Edge Functionを非同期で呼び出し
  PERFORM
    net.http_post(
      url := concat(current_setting('app.settings.supabase_url'), '/functions/v1/auto-notification'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', concat('Bearer ', current_setting('app.settings.service_role_key'))
      ),
      body := jsonb_build_object(
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW)
      )
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- コメント投稿時の通知トリガー
CREATE TRIGGER comments_notification_trigger
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_notification();

-- いいね追加時の通知トリガー
CREATE TRIGGER likes_notification_trigger
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_notification();

-- フォロー時の通知トリガー
CREATE TRIGGER follows_notification_trigger
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_notification();

-- お知らせ投稿時の通知トリガー
CREATE TRIGGER announcements_notification_trigger
  AFTER INSERT ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_notification(); 