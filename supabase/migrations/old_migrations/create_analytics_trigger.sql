-- view_countを更新するトリガー関数
CREATE OR REPLACE FUNCTION update_prompt_view_count()
RETURNS TRIGGER AS $$
BEGIN
  -- analytics_viewsへの新規追加時にprompts.view_countを更新
  -- INSERTの場合のみ実行（重複エラーの場合はトリガーされない）
  IF (TG_OP = 'INSERT') THEN
    -- 対応するpromptsテーブルのview_countを更新
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
$$ LANGUAGE plpgsql;

-- 古いトリガーを削除（存在する場合）
DROP TRIGGER IF EXISTS update_view_count_trigger ON analytics_views;

-- 新しいトリガーを追加
CREATE TRIGGER update_view_count_trigger
AFTER INSERT ON analytics_views
FOR EACH ROW
EXECUTE FUNCTION update_prompt_view_count(); 