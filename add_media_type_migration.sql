-- promptsテーブルにmedia_typeカラムを追加
-- 既存のデータはすべてimageとして扱う

ALTER TABLE prompts 
ADD COLUMN media_type VARCHAR(10) DEFAULT 'image';

-- 既存のレコードをすべてimageに設定
UPDATE prompts 
SET media_type = 'image' 
WHERE media_type IS NULL;

-- media_typeにインデックスを追加（検索性能向上のため）
CREATE INDEX idx_prompts_media_type ON prompts(media_type);

-- コメント追加
COMMENT ON COLUMN prompts.media_type IS 'メディアタイプ: image または video'; 