-- 現在のview_countの値を確認
SELECT id, view_count
FROM prompts
WHERE id = '760c01ec-c28b-48f2-868d-83787527dae6';

-- analytics_viewsテーブルのレコード数を確認
SELECT COUNT(*) as total_views
FROM analytics_views
WHERE prompt_id = '760c01ec-c28b-48f2-868d-83787527dae6';

-- prompts テーブルの view_count を直接更新するSQL
-- (これはSQL Editorから管理者権限で実行する必要があります)
UPDATE prompts
SET view_count = (
  SELECT COUNT(*)
  FROM analytics_views
  WHERE prompt_id = '760c01ec-c28b-48f2-868d-83787527dae6'
)
WHERE id = '760c01ec-c28b-48f2-868d-83787527dae6';

-- 更新後の値を確認
SELECT id, view_count
FROM prompts
WHERE id = '760c01ec-c28b-48f2-868d-83787527dae6'; 