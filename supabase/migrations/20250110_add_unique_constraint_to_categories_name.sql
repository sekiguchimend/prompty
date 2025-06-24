-- カテゴリの重複作成防止：nameフィールドにUNIQUE制約を追加

-- まず、既存の重複データを確認し、必要に応じて手動で解決する必要があります
-- 重複するカテゴリ名を確認するクエリ（実行前の確認用）
-- SELECT name, COUNT(*) 
-- FROM categories 
-- GROUP BY LOWER(TRIM(name)) 
-- HAVING COUNT(*) > 1;

-- 既存の重複データがある場合は、以下のような手順で解決する：
-- 1. 重複するカテゴリのIDを確認
-- 2. 使用されていない方を削除、または名前を変更
-- 3. プロンプトが参照している場合は、より適切な方に統合

-- UNIQUE制約を追加（大文字小文字を区別しない）
-- 注意: 既存の重複データがある場合、このクエリは失敗します
-- その場合は先に重複データを解決してからこのマイグレーションを実行してください

-- nameフィールドに部分インデックスとUNIQUE制約を追加
-- LOWER(TRIM())で大文字小文字と前後の空白を無視した重複を防ぐ
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_unique_ci_idx 
ON categories (LOWER(TRIM(name)));

-- コメントを追加してインデックスの目的を明記
COMMENT ON INDEX categories_name_unique_ci_idx IS 'カテゴリ名の重複防止（大文字小文字・前後空白を無視）';

-- 既存のslugのUNIQUE制約も確認（念のため）
-- slugが存在しない場合のみインデックスを作成
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'categories_slug_unique_idx'
    ) THEN
        CREATE UNIQUE INDEX categories_slug_unique_idx ON categories (slug);
        COMMENT ON INDEX categories_slug_unique_idx IS 'カテゴリスラッグの一意性保証';
    END IF;
END $$;

-- カテゴリ作成時のトリガー関数を作成（名前の正規化）
CREATE OR REPLACE FUNCTION normalize_category_name()
RETURNS TRIGGER AS $$
BEGIN
    -- 名前をトリミングして正規化
    NEW.name = TRIM(NEW.name);
    
    -- 空の名前を防ぐ
    IF LENGTH(NEW.name) = 0 THEN
        RAISE EXCEPTION 'カテゴリ名は空にできません';
    END IF;
    
    -- 名前が長すぎる場合の制限
    IF LENGTH(NEW.name) > 100 THEN
        RAISE EXCEPTION 'カテゴリ名は100文字以下にしてください';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを設定
DROP TRIGGER IF EXISTS normalize_category_name_trigger ON categories;
CREATE TRIGGER normalize_category_name_trigger
    BEFORE INSERT OR UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION normalize_category_name();

-- トリガーにコメントを追加
COMMENT ON TRIGGER normalize_category_name_trigger ON categories IS 'カテゴリ名の正規化と検証'; 