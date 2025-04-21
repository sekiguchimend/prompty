-- フォロー機能のためのストアドプロシージャ

-- 関数: ユーザーがすでに別のユーザーをフォローしているかチェックする
CREATE OR REPLACE FUNCTION check_if_following(
  p_follower_id UUID,
  p_following_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_following BOOLEAN;
BEGIN
  -- 入力パラメータの検証
  IF p_follower_id IS NULL OR p_following_id IS NULL THEN
    RAISE EXCEPTION 'フォロワーIDとフォロー対象IDは必須です';
  END IF;
  
  -- 自分自身をフォローしようとしていないか確認
  IF p_follower_id = p_following_id THEN
    RETURN FALSE;
  END IF;

  -- フォロー状態をチェック
  SELECT EXISTS (
    SELECT 1
    FROM public.follows
    WHERE follower_id = p_follower_id
    AND following_id = p_following_id
  ) INTO v_following;
  
  RETURN v_following;
END;
$$;

-- 関数: ユーザーが別のユーザーをフォローする
CREATE OR REPLACE FUNCTION follow_user(
  p_follower_id UUID,
  p_following_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_success BOOLEAN := FALSE;
BEGIN
  -- 入力パラメータの検証
  IF p_follower_id IS NULL OR p_following_id IS NULL THEN
    RAISE EXCEPTION 'フォロワーIDとフォロー対象IDは必須です';
  END IF;
  
  -- 自分自身をフォローしようとしていないか確認
  IF p_follower_id = p_following_id THEN
    RAISE EXCEPTION '自分自身をフォローすることはできません';
  END IF;

  -- すでにフォローしている場合は何もせず成功を返す
  IF check_if_following(p_follower_id, p_following_id) THEN
    RETURN TRUE;
  END IF;

  -- フォロー関係を作成
  BEGIN
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (p_follower_id, p_following_id);
    v_success := TRUE;
  EXCEPTION
    WHEN unique_violation THEN
      -- すでにフォローしている場合（同時実行の場合など）
      v_success := TRUE;
    WHEN OTHERS THEN
      RAISE;
  END;
  
  RETURN v_success;
END;
$$;

-- 関数: ユーザーが別のユーザーのフォローを解除する
CREATE OR REPLACE FUNCTION unfollow_user(
  p_follower_id UUID,
  p_following_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_success BOOLEAN := FALSE;
  v_count INTEGER;
BEGIN
  -- 入力パラメータの検証
  IF p_follower_id IS NULL OR p_following_id IS NULL THEN
    RAISE EXCEPTION 'フォロワーIDとフォロー対象IDは必須です';
  END IF;
  
  -- 自分自身をフォロー解除しようとしていないか確認
  IF p_follower_id = p_following_id THEN
    RETURN TRUE; -- 自分自身はフォローしていないので、すでに解除済みと見なす
  END IF;

  -- フォロー関係を削除
  DELETE FROM public.follows
  WHERE follower_id = p_follower_id
  AND following_id = p_following_id
  RETURNING 1 INTO v_count;
  
  v_success := v_count > 0 OR NOT check_if_following(p_follower_id, p_following_id);
  
  RETURN v_success;
END;
$$; 