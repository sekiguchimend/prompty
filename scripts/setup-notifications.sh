#!/bin/bash

# Push通知システムセットアップスクリプト

echo "🚀 Push通知システムをセットアップしています..."

# 環境変数チェック
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL環境変数が設定されていません"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY環境変数が設定されていません"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_FIREBASE_VAPID_KEY" ]; then
    echo "⚠️  NEXT_PUBLIC_FIREBASE_VAPID_KEY環境変数が設定されていません"
    echo "   Firebaseコンソールで生成して設定してください"
fi

echo "✅ 環境変数チェック完了"

# 1. データベースマイグレーション実行
echo "📊 データベースマイグレーションを実行しています..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ マイグレーション完了"
else
    echo "❌ マイグレーション失敗"
    exit 1
fi

# 2. Edge Functions デプロイ
echo "⚡ Edge Functionsをデプロイしています..."

# send-notification function
echo "📤 send-notification function をデプロイ中..."
supabase functions deploy send-notification

if [ $? -eq 0 ]; then
    echo "✅ send-notification デプロイ完了"
else
    echo "❌ send-notification デプロイ失敗"
    exit 1
fi

# auto-notification function
echo "🔔 auto-notification function をデプロイ中..."
supabase functions deploy auto-notification

if [ $? -eq 0 ]; then
    echo "✅ auto-notification デプロイ完了"
else
    echo "❌ auto-notification デプロイ失敗"
    exit 1
fi

# 3. データベース設定値をセット
echo "⚙️  データベース設定値を設定しています..."

# Supabase CLIを使用してSQLを実行
supabase db reset --linked
psql "$DATABASE_URL" -c "ALTER DATABASE postgres SET app.settings.supabase_url = '$NEXT_PUBLIC_SUPABASE_URL';" 2>/dev/null
psql "$DATABASE_URL" -c "ALTER DATABASE postgres SET app.settings.service_role_key = '$SUPABASE_SERVICE_ROLE_KEY';" 2>/dev/null

echo "✅ データベース設定完了"

# 4. セットアップ完了メッセージ
echo ""
echo "🎉 Push通知システムのセットアップが完了しました！"
echo ""
echo "📋 次の手順:"
echo "   1. .env.local に NEXT_PUBLIC_FIREBASE_VAPID_KEY を設定"
echo "   2. アプリを再起動"
echo "   3. 設定画面で「通知を有効にする」をクリック"
echo "   4. 「テスト送信」で動作確認"
echo ""
echo "🔧 使用可能な機能:"
echo "   ✅ 手動通知送信"
echo "   ✅ コメント時の自動通知"
echo "   ✅ いいね時の自動通知"
echo "   ✅ フォロー時の自動通知"
echo "   ✅ お知らせ時の自動通知"
echo ""
echo "📚 詳細は fcm.md を参照してください" 