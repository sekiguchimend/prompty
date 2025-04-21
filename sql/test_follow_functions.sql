-- 関数のテスト用SQLスクリプト
-- Supabase SQLエディタで実行してください

-- テストデータの挿入
INSERT INTO auth.users (id, email)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'test_user1@example.com'),
  ('00000000-0000-0000-0000-000000000002', 'test_user2@example.com')
ON CONFLICT (id) DO NOTHING;

-- 既存のフォローデータをクリア（テスト用）
DELETE FROM public.follows
WHERE follower_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
AND following_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- 現在のフォローテーブルの内容を確認
SELECT * FROM public.follows;

-- ===== テスト 1: フォロー状態の確認（まだフォローしていない） =====
SELECT 
  check_if_following(
    '00000000-0000-0000-0000-000000000001', 
    '00000000-0000-0000-0000-000000000002'
  ) AS is_following;

-- ===== テスト 2: フォロー実行 =====
SELECT 
  follow_user(
    '00000000-0000-0000-0000-000000000001', 
    '00000000-0000-0000-0000-000000000002'
  ) AS follow_result;

-- ===== テスト 3: フォロー状態の確認（フォロー後） =====
SELECT 
  check_if_following(
    '00000000-0000-0000-0000-000000000001', 
    '00000000-0000-0000-0000-000000000002'
  ) AS is_following_after_follow;

-- ===== テスト 4: 重複フォロー実行（エラーにならないことを確認） =====
SELECT 
  follow_user(
    '00000000-0000-0000-0000-000000000001', 
    '00000000-0000-0000-0000-000000000002'
  ) AS duplicate_follow_result;

-- ===== テスト 5: フォロー解除 =====
SELECT 
  unfollow_user(
    '00000000-0000-0000-0000-000000000001', 
    '00000000-0000-0000-0000-000000000002'
  ) AS unfollow_result;

-- ===== テスト 6: フォロー状態の確認（フォロー解除後） =====
SELECT 
  check_if_following(
    '00000000-0000-0000-0000-000000000001', 
    '00000000-0000-0000-0000-000000000002'
  ) AS is_following_after_unfollow;

-- 実際のテーブルの内容を確認
SELECT * FROM public.follows;

-- 本番データを使用したテスト
-- 実際のユーザーIDに置き換えてください
/*
SELECT 
  check_if_following(
    '実際のフォロワーID', 
    '実際のフォロー対象ID'
  ) AS actual_follow_check;

SELECT 
  follow_user(
    '実際のフォロワーID', 
    '実際のフォロー対象ID'
  ) AS actual_follow_result;
*/ 