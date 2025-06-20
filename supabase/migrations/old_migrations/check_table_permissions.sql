-- テーブルの権限を確認するSQL

-- promptsテーブルの権限ポリシーを確認
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
  tablename = 'prompts';

-- Row Level Security (RLS)が有効か確認
SELECT
  tablename,
  rowsecurity
FROM
  pg_tables
WHERE
  tablename = 'prompts';

-- 権限設定の確認
SELECT
  grantee,
  table_name,
  privilege_type
FROM
  information_schema.role_table_grants
WHERE
  table_name = 'prompts';

-- analytics_viewsテーブルの権限も確認
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
  tablename = 'analytics_views'; 