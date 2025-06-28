-- バッジシステムの初期設定とマスターデータ
-- 2025/01/24 作成

-- 既存のバッジデータをクリア（開発環境用）
DELETE FROM user_badges;
DELETE FROM badges;

-- バッジマスターデータを挿入
INSERT INTO badges (name, description, icon, requirements) VALUES
(
  'ファーストポスト',
  '初めての投稿を行いました',
  'award',
  '{"type": "first_post", "condition": "user_post_count >= 1", "trigger_event": "prompt_insert"}'
),
(
  '10いいね達成',
  '投稿が合計10いいねを獲得しました',
  'heart',
  '{"type": "total_likes", "condition": "user_total_likes >= 10", "trigger_event": "like_insert"}'
),
(
  '100ビュー達成',
  '投稿が合計100ビューを達成しました',
  'eye',
  '{"type": "total_views", "condition": "user_total_views >= 100", "trigger_event": "view_update"}'
),
(
  '1000ビュー達成',
  '投稿が合計1000ビューを達成しました',
  'eye',
  '{"type": "total_views", "condition": "user_total_views >= 1000", "trigger_event": "view_update"}'
),
(
  'コメントゲッター',
  '5件以上のコメントを獲得しました',
  'message-square',
  '{"type": "total_comments", "condition": "user_total_comments >= 5", "trigger_event": "comment_insert"}'
);

-- バッジ付与用のヘルパー関数
CREATE OR REPLACE FUNCTION award_badge_if_eligible(
  p_user_id UUID,
  p_badge_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_badge_id UUID;
  v_requirements JSONB;
  v_condition_type TEXT;
  v_threshold INTEGER;
  v_current_count INTEGER;
  v_already_awarded BOOLEAN;
BEGIN
  -- バッジ情報を取得
  SELECT id, requirements::jsonb
  INTO v_badge_id, v_requirements
  FROM badges
  WHERE name = p_badge_name;
  
  IF v_badge_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- すでに付与済みかチェック
  SELECT EXISTS(
    SELECT 1 FROM user_badges 
    WHERE user_id = p_user_id AND badge_id = v_badge_id
  ) INTO v_already_awarded;
  
  IF v_already_awarded THEN
    RETURN FALSE;
  END IF;
  
  -- 条件をチェック
  v_condition_type := v_requirements->>'type';
  
  CASE v_condition_type
    WHEN 'first_post' THEN
      -- 投稿数をチェック
      SELECT COUNT(*)
      INTO v_current_count
      FROM prompts
      WHERE author_id = p_user_id AND published = true;
      
      IF v_current_count >= 1 THEN
        INSERT INTO user_badges (user_id, badge_id, awarded_at)
        VALUES (p_user_id, v_badge_id, NOW());
        RETURN TRUE;
      END IF;
      
    WHEN 'total_likes' THEN
      -- 総いいね数をチェック
      SELECT COALESCE(SUM(like_count), 0)
      INTO v_current_count
      FROM prompts
      WHERE author_id = p_user_id;
      
      IF v_current_count >= 10 THEN
        INSERT INTO user_badges (user_id, badge_id, awarded_at)
        VALUES (p_user_id, v_badge_id, NOW());
        RETURN TRUE;
      END IF;
      
    WHEN 'total_views' THEN
      -- 総ビュー数をチェック
      SELECT COALESCE(SUM(view_count), 0)
      INTO v_current_count
      FROM prompts
      WHERE author_id = p_user_id;
      
      v_threshold := CASE 
        WHEN p_badge_name = '100ビュー達成' THEN 100
        WHEN p_badge_name = '1000ビュー達成' THEN 1000
        ELSE 0
      END;
      
      IF v_current_count >= v_threshold THEN
        INSERT INTO user_badges (user_id, badge_id, awarded_at)
        VALUES (p_user_id, v_badge_id, NOW());
        RETURN TRUE;
      END IF;
      
    WHEN 'total_comments' THEN
      -- 総コメント数をチェック
      SELECT COUNT(*)
      INTO v_current_count
      FROM comments c
      JOIN prompts p ON c.prompt_id = p.id
      WHERE p.author_id = p_user_id;
      
      IF v_current_count >= 5 THEN
        INSERT INTO user_badges (user_id, badge_id, awarded_at)
        VALUES (p_user_id, v_badge_id, NOW());
        RETURN TRUE;
      END IF;
  END CASE;
  
  RETURN FALSE;
END;
$$;

-- 投稿時のバッジチェック関数
CREATE OR REPLACE FUNCTION check_post_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- ファーストポストバッジをチェック
  PERFORM award_badge_if_eligible(NEW.author_id, 'ファーストポスト');
  
  RETURN NEW;
END;
$$;

-- いいね時のバッジチェック関数
CREATE OR REPLACE FUNCTION check_like_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_author_id UUID;
BEGIN
  -- いいねされた投稿の作成者を取得
  SELECT author_id INTO v_author_id
  FROM prompts
  WHERE id = NEW.prompt_id;
  
  IF v_author_id IS NOT NULL THEN
    -- 10いいね達成バッジをチェック
    PERFORM award_badge_if_eligible(v_author_id, '10いいね達成');
  END IF;
  
  RETURN NEW;
END;
$$;

-- トリガーを作成
DROP TRIGGER IF EXISTS trigger_check_post_badges ON prompts;
CREATE TRIGGER trigger_check_post_badges
  AFTER INSERT ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION check_post_badges();

DROP TRIGGER IF EXISTS trigger_check_like_badges ON likes;
CREATE TRIGGER trigger_check_like_badges
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION check_like_badges();

-- プロンプトのlike_count更新時にもバッジをチェック
CREATE OR REPLACE FUNCTION check_like_count_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- like_countが増加した場合のみチェック
  IF NEW.like_count > OLD.like_count THEN
    PERFORM award_badge_if_eligible(NEW.author_id, '10いいね達成');
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_like_count_badges ON prompts;
CREATE TRIGGER trigger_check_like_count_badges
  AFTER UPDATE OF like_count ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION check_like_count_badges(); 