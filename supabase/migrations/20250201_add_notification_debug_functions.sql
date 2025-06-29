-- 通知関連のトリガー情報を取得するRPC関数
CREATE OR REPLACE FUNCTION get_notification_triggers()
RETURNS TABLE (
  trigger_name text,
  table_name text,
  function_name text,
  event text,
  timing text,
  enabled boolean
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT 
    tgname::text as trigger_name,
    c.relname::text as table_name,
    p.proname::text as function_name,
    CASE tgtype::int & 66
      WHEN 2 THEN 'BEFORE'
      WHEN 64 THEN 'INSTEAD OF'
      ELSE 'AFTER'
    END as timing,
    CASE tgtype::int & 28
      WHEN 4 THEN 'INSERT'
      WHEN 8 THEN 'DELETE'
      WHEN 16 THEN 'UPDATE'
      WHEN 12 THEN 'INSERT, DELETE'
      WHEN 20 THEN 'INSERT, UPDATE'
      WHEN 24 THEN 'DELETE, UPDATE'
      WHEN 28 THEN 'INSERT, DELETE, UPDATE'
    END as event,
    tgenabled = 'O' as enabled
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_proc p ON t.tgfoid = p.oid
  WHERE t.tgname LIKE '%notification%'
    AND c.relname IN ('follows', 'likes', 'comments', 'announcements')
  ORDER BY c.relname, t.tgname;
$$;

-- 通知キューの統計情報を取得するRPC関数
CREATE OR REPLACE FUNCTION get_notification_queue_stats()
RETURNS TABLE (
  total_count bigint,
  processed_count bigint,
  unprocessed_count bigint,
  error_count bigint,
  oldest_unprocessed timestamptz,
  newest_entry timestamptz
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT 
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE processed = true) as processed_count,
    COUNT(*) FILTER (WHERE processed = false) as unprocessed_count,
    COUNT(*) FILTER (WHERE error_message IS NOT NULL) as error_count,
    MIN(created_at) FILTER (WHERE processed = false) as oldest_unprocessed,
    MAX(created_at) as newest_entry
  FROM notification_queue;
$$; 