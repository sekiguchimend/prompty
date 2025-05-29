-- feedbackテーブルの管理者ポリシーを更新して、profiles.statusが"admin"のユーザーも含める

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Allow admin read/update" ON "public"."feedback";
DROP POLICY IF EXISTS "Allow admin by domain" ON "public"."feedback";

-- 新しいポリシーを作成（既存の条件 + profiles.statusが"admin"の条件を追加）
CREATE POLICY "Allow admin read/update" ON "public"."feedback" 
FOR ALL 
TO "authenticated" 
USING (
  -- 既存の条件（特定のメールアドレスまたは特定のドメイン）
  (
    (("auth"."jwt"() ->> 'email'::text) = ANY (ARRAY['admin@example.com'::text, 'taniguchi.kouhei@gmail.com'::text, 'queue@queuetech.jp'::text, 'admin@queuetech.jp'::text, 'queue@queue-tech.jp'::text]))
    OR (("auth"."jwt"() ->> 'email'::text) ~~ '%@queuetech.jp'::text)
    OR (("auth"."jwt"() ->> 'email'::text) ~~ '%@queue-tech.jp'::text)
  )
  OR 
  -- 新しい条件（profiles.statusが"admin"のユーザー）
  (
    EXISTS (
      SELECT 1 FROM "public"."profiles" 
      WHERE "id" = "auth"."uid"() 
      AND "status" = 'admin'
    )
  )
) 
WITH CHECK (
  -- WITH CHECKでも同じ条件を適用
  (
    (("auth"."jwt"() ->> 'email'::text) = ANY (ARRAY['admin@example.com'::text, 'taniguchi.kouhei@gmail.com'::text, 'queue@queuetech.jp'::text, 'admin@queuetech.jp'::text, 'queue@queue-tech.jp'::text]))
    OR (("auth"."jwt"() ->> 'email'::text) ~~ '%@queuetech.jp'::text)
    OR (("auth"."jwt"() ->> 'email'::text) ~~ '%@queue-tech.jp'::text)
  )
  OR 
  (
    EXISTS (
      SELECT 1 FROM "public"."profiles" 
      WHERE "id" = "auth"."uid"() 
      AND "status" = 'admin'
    )
  )
);

-- Allow admin by domainポリシーも同様に更新（念のため、統合されたポリシーで十分だが、既存のものがある場合に備えて）
CREATE POLICY "Allow admin by domain" ON "public"."feedback" 
FOR SELECT 
TO "authenticated" 
USING (
  (
    (("auth"."jwt"() ->> 'email'::text) ~~ '%@queuetech.jp'::text) 
    OR (("auth"."jwt"() ->> 'email'::text) ~~ '%@queue-tech.jp'::text)
  )
  OR 
  (
    EXISTS (
      SELECT 1 FROM "public"."profiles" 
      WHERE "id" = "auth"."uid"() 
      AND "status" = 'admin'
    )
  )
); 