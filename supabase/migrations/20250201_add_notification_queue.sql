-- 通知キュー管理テーブルの作成
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_notification_queue_processed ON notification_queue(processed);
CREATE INDEX IF NOT EXISTS idx_notification_queue_created_at ON notification_queue(created_at);

-- RLS（Row Level Security）の設定
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- 管理者のみアクセス可能（service roleでのアクセス）
CREATE POLICY "Only service role can manage notification queue" ON notification_queue
  FOR ALL USING (current_setting('role') = 'service_role'); 