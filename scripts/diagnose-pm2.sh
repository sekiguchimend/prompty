#!/bin/bash

echo "================================"
echo "🔍 PM2設定診断ツール"
echo "================================"

echo ""
echo "📋 現在のPM2プロセス一覧:"
pm2 list

echo ""
echo "📋 promptyプロセスの詳細情報:"
pm2 show prompty 2>/dev/null || echo "❌ promptyプロセスが見つかりません"

echo ""
echo "📋 PM2ログ（最新20行）:"
pm2 logs prompty --lines 20 2>/dev/null || echo "❌ ログが取得できません"

echo ""
echo "📋 システム環境変数確認:"
echo "STRIPE_SECRET_KEY存在: $([ -n "$STRIPE_SECRET_KEY" ] && echo "✅ あり (${STRIPE_SECRET_KEY:0:7}...)" || echo "❌ なし")"
echo "NODE_ENV: ${NODE_ENV:-未設定}"

echo ""
echo "📋 .envファイル確認:"
if [ -f "/home/ec2-user/prompty/.env" ]; then
    echo "✅ .envファイルが存在します"
    echo "STRIPE_SECRET_KEY in .env: $(grep STRIPE_SECRET_KEY /home/ec2-user/prompty/.env | head -1 | cut -d'=' -f1)=***"
else
    echo "❌ .envファイルが存在しません"
fi

echo ""
echo "📋 PM2設定ファイル確認:"
echo "ecosystem.config.js: $([ -f "/home/ec2-user/prompty/scripts/ecosystem.config.js" ] && echo "✅ 存在" || echo "❌ なし")"
echo "ecosystem-env.config.js: $([ -f "/home/ec2-user/prompty/scripts/ecosystem-env.config.js" ] && echo "✅ 存在" || echo "❌ なし")"

echo ""
echo "🔧 推奨する修正方法:"
echo "1. 現在のプロセスを停止: pm2 delete prompty"
echo "2. 正しい設定で起動: pm2 start scripts/ecosystem-env.config.js --env production"
echo "3. 保存: pm2 save"
echo "" 