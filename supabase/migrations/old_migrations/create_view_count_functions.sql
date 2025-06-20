-- view_countを安全にインクリメントするRPC関数
-- 競合状態を避けるためにlockとatomic更新を使用
CREATE OR REPLACE FUNCTION increment_view_count(prompt_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- ROW EXCLUSIVEロックを取得して他のトランザクションからの同時更新を防ぐ
  UPDATE prompts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = prompt_id;
END;
$$;

-- RPC関数のアクセス権を設定
GRANT EXECUTE ON FUNCTION increment_view_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_view_count(UUID) TO service_role;

-- 閲覧数を正確に取得するためのRPC関数
-- analytics_viewsテーブルとpromptsテーブルの両方を考慮する
CREATE OR REPLACE FUNCTION get_accurate_view_count(prompt_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prompt_view_count INTEGER;
  analytics_count INTEGER;
BEGIN
  -- promptsテーブルからview_countを取得
  SELECT COALESCE(view_count, 0) INTO prompt_view_count
  FROM prompts
  WHERE id = prompt_id;
  
  -- analytics_viewsテーブルからカウントを取得
  SELECT COUNT(*) INTO analytics_count
  FROM analytics_views
  WHERE prompt_id = get_accurate_view_count.prompt_id;
  
  -- より大きい方の値を返す
  RETURN GREATEST(prompt_view_count, analytics_count);
END;
$$;

-- RPC関数のアクセス権を設定
GRANT EXECUTE ON FUNCTION get_accurate_view_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_accurate_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_accurate_view_count(UUID) TO service_role; 