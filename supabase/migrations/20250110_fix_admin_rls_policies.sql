-- 管理者用のRLSポリシーを追加・修正

-- 管理者メールアドレスの定義
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'email') = ANY (ARRAY[
      'queue@queuetech.jp',
      'admin@queuetech.jp', 
      'admin@example.com',
      'taniguchi.kouhei@gmail.com'
    ])
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND status = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- reportsテーブルの管理者ポリシー
DROP POLICY IF EXISTS "admin_can_manage_reports" ON reports;
CREATE POLICY "admin_can_manage_reports" 
ON reports
FOR ALL 
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- ユーザーは自分のレポートを作成できる
DROP POLICY IF EXISTS "users_can_create_reports" ON reports;
CREATE POLICY "users_can_create_reports" 
ON reports
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- announcementsテーブルの管理者ポリシー（既存のポリシーを更新）
DROP POLICY IF EXISTS "Only admins can manage announcements" ON announcements;
CREATE POLICY "admin_can_manage_announcements" 
ON announcements
FOR ALL 
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- contactsテーブルの管理者ポリシー（既存のポリシーを更新）
DROP POLICY IF EXISTS "admin_all_permissions" ON contacts;
CREATE POLICY "admin_can_manage_contacts" 
ON contacts
FOR ALL 
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- feedbackテーブルの管理者ポリシー（既存のポリシーを更新）
DROP POLICY IF EXISTS "Allow admin by domain" ON feedback;
DROP POLICY IF EXISTS "Allow admin read/update" ON feedback;
CREATE POLICY "admin_can_manage_feedback" 
ON feedback
FOR ALL 
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- 管理者が全てのプロフィールを見ることができるポリシーを追加
DROP POLICY IF EXISTS "admin_can_view_all_profiles" ON profiles;
CREATE POLICY "admin_can_view_all_profiles" 
ON profiles
FOR SELECT 
TO authenticated
USING (is_admin_user());

-- 管理者が全てのプロンプトを見ることができるポリシーを追加
DROP POLICY IF EXISTS "admin_can_view_all_prompts" ON prompts;
CREATE POLICY "admin_can_view_all_prompts" 
ON prompts
FOR SELECT 
TO authenticated
USING (is_admin_user());

-- 既存のポリシーは維持（各テーブルの既存の公開読み取りポリシーなど） 