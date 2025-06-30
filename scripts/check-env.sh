#!/bin/bash
# 環境変数確認スクリプト

echo "🔍 環境変数チェック"
echo "===================="

echo ""
echo "📋 システム環境変数:"
echo "STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY:0:10}..." 
echo "NEXT_PUBLIC_VAPID_KEY: ${NEXT_PUBLIC_VAPID_KEY:0:10}..."
echo "NODE_ENV: $NODE_ENV"

echo ""
echo "🔧 PM2プロセス状況:"
pm2 list

echo ""
echo "📊 PM2環境変数確認:"
echo "=== Stripe関連 ==="
pm2 env prompty | grep STRIPE || echo "❌ STRIPE環境変数が見つかりません"

echo ""
echo "=== Firebase/VAPID関連 ==="
pm2 env prompty | grep VAPID || echo "❌ VAPID環境変数が見つかりません"

echo ""
echo "🧪 実際の接続テスト:"
echo "1. Stripe: デプロイ後に /api/debug/env-check にアクセス"
echo "2. VAPID: 設定画面で「通知を有効にする」をテスト"

echo ""
echo "✅ 設定完了後の手順:"
echo "1. pm2 restart all --env production"
echo "2. ブラウザで決済機能をテスト"
echo "3. ブラウザで通知機能をテスト"

echo ""
echo "⚠️ 注意："
echo "- STRIPE_SECRET_KEY: sk_live_ で始まる（本番用）"
echo "- NEXT_PUBLIC_VAPID_KEY: B で始まる88文字（Firebase Web Push用）" 