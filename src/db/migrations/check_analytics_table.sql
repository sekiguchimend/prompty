-- analytics_viewsテーブルの存在確認と列構造の確認のためのSQL

-- テーブル一覧を取得（analytics_viewsが存在するか確認）
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- analytics_viewsテーブルの列構造を取得（実際の列名を確認）
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'analytics_views'
ORDER BY ordinal_position;

-- analytics_viewsテーブルのユニーク制約を確認
SELECT
    tc.constraint_name,
    string_agg(kcu.column_name, ', ') AS column_names
FROM
    information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_schema = kcu.constraint_schema
        AND tc.constraint_name = kcu.constraint_name
WHERE
    tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'analytics_views'
GROUP BY
    tc.constraint_name;

-- analytics_viewsテーブルのRLSポリシーを確認
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename = 'analytics_views';

-- テーブルの行数を確認
SELECT COUNT(*) FROM analytics_views; 