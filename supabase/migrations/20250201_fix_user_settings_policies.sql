-- user_settingsテーブルのRLSポリシーを修正
-- 406 Not Acceptableエラーの解決

-- 既存のポリシーを削除（もしあれば）
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON user_settings;

-- 1. ユーザーは自分の設定を閲覧可能
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 2. ユーザーは自分の設定を挿入可能
CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 3. ユーザーは自分の設定を更新可能
CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. ユーザーは自分の設定を削除可能
CREATE POLICY "Users can delete their own settings" ON user_settings
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 5. Service Roleは全てアクセス可能（管理用）
CREATE POLICY "Service role can manage all user settings" ON user_settings
  FOR ALL 
  USING (current_setting('role') = 'service_role')
  WITH CHECK (current_setting('role') = 'service_role'); 