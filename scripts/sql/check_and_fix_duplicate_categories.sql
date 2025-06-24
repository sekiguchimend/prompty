-- カテゴリの重複データを確認・修正するためのスクリプト
-- 実行前に必ずデータのバックアップを取ってください

-- 1. 重複するカテゴリ名を確認
SELECT 
    LOWER(TRIM(name)) as normalized_name,
    COUNT(*) as duplicate_count,
    STRING_AGG(name || ' (ID: ' || id || ')', ', ') as duplicates
FROM categories 
GROUP BY LOWER(TRIM(name)) 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 2. 具体的な重複レコードの詳細を確認
WITH duplicate_names AS (
    SELECT LOWER(TRIM(name)) as normalized_name
    FROM categories 
    GROUP BY LOWER(TRIM(name)) 
    HAVING COUNT(*) > 1
)
SELECT 
    c.id,
    c.name,
    c.slug,
    c.created_at,
    c.created_by,
    (SELECT COUNT(*) FROM prompts WHERE category_id = c.id) as prompt_count
FROM categories c
INNER JOIN duplicate_names dn ON LOWER(TRIM(c.name)) = dn.normalized_name
ORDER BY LOWER(TRIM(c.name)), c.created_at;

-- 3. 重複カテゴリのうち、使用されていない（プロンプトが0件）のものを削除
-- 注意: 実行前に必ず確認してください
-- DELETE FROM categories 
-- WHERE id IN (
--     WITH duplicate_categories AS (
--         SELECT 
--             id,
--             name,
--             ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(name)) ORDER BY created_at) as rn,
--             (SELECT COUNT(*) FROM prompts WHERE category_id = categories.id) as prompt_count
--         FROM categories
--     )
--     SELECT id 
--     FROM duplicate_categories 
--     WHERE rn > 1 AND prompt_count = 0
-- );

-- 4. 重複カテゴリで使用されているものの統合
-- 以下は手動実行が必要なサンプル（具体的なIDは実際のデータに応じて変更）
-- UPDATE prompts 
-- SET category_id = '正しいカテゴリID' 
-- WHERE category_id = '削除予定のカテゴリID';

-- 5. 統合後の不要カテゴリを削除
-- DELETE FROM categories WHERE id = '削除予定のカテゴリID';

-- 6. 最後に重複チェックを再実行
-- 上記のクエリ1を再実行して、重複が解消されていることを確認 