#!/bin/bash

# Nginx 40GBアップロード制限修正スクリプト
# 使用方法: sudo ./fix-nginx-upload-limit.sh

echo "=== Nginx 40GBアップロード制限修正スクリプト ==="
echo ""

# rootユーザーチェック
if [ "$EUID" -ne 0 ]; then
    echo "❌ このスクリプトはsudo権限で実行してください"
    echo "   使用方法: sudo ./fix-nginx-upload-limit.sh"
    exit 1
fi

# Nginxインストール確認
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginxがインストールされていません"
    echo "   インストール方法:"
    echo "   Ubuntu/Debian: sudo apt update && sudo apt install nginx"
    echo "   CentOS/RHEL: sudo yum install nginx"
    echo "   macOS: brew install nginx"
    exit 1
fi

echo "✅ Nginxが見つかりました"

# 設定ファイルパスの検出
NGINX_CONF=""
if [ -f "/etc/nginx/nginx.conf" ]; then
    NGINX_CONF="/etc/nginx/nginx.conf"
elif [ -f "/usr/local/etc/nginx/nginx.conf" ]; then
    NGINX_CONF="/usr/local/etc/nginx/nginx.conf"
elif [ -f "/opt/homebrew/etc/nginx/nginx.conf" ]; then
    NGINX_CONF="/opt/homebrew/etc/nginx/nginx.conf"
else
    echo "❌ Nginx設定ファイルが見つかりません"
    echo "   以下のパスを確認してください:"
    echo "   - /etc/nginx/nginx.conf"
    echo "   - /usr/local/etc/nginx/nginx.conf"
    echo "   - /opt/homebrew/etc/nginx/nginx.conf"
    exit 1
fi

echo "✅ Nginx設定ファイル: $NGINX_CONF"

# バックアップ作成
BACKUP_FILE="${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
echo "📄 設定ファイルをバックアップ: $BACKUP_FILE"
cp "$NGINX_CONF" "$BACKUP_FILE"

# 現在の設定確認
echo ""
echo "=== 現在の設定状況 ==="
if grep -q "client_max_body_size" "$NGINX_CONF"; then
    echo "📋 現在のclient_max_body_size設定:"
    grep -n "client_max_body_size" "$NGINX_CONF" | head -5
else
    echo "📋 client_max_body_sizeの設定が見つかりません"
fi

echo ""
echo "=== 設定を更新しています ==="

# プロジェクトのnginx.confをコピー
if [ -f "./nginx.conf" ]; then
    echo "✅ プロジェクトのnginx.confを適用"
    cp "./nginx.conf" "$NGINX_CONF"
else
    echo "⚠️  プロジェクトのnginx.confが見つかりません"
    echo "   手動で以下の設定を追加してください:"
    echo ""
    echo "   http {"
    echo "       client_max_body_size 40G;"
    echo "       client_body_timeout 300s;"
    echo "       proxy_request_buffering off;"
    echo ""
    echo "       server {"
    echo "           client_max_body_size 40G;"
    echo "           location /api/media/ {"
    echo "               client_max_body_size 40G;"
    echo "               client_body_timeout 600s;"
    echo "               proxy_request_buffering off;"
    echo "               proxy_max_temp_file_size 0;"
    echo "           }"
    echo "       }"
    echo "   }"
fi

# 設定ファイルの構文チェック
echo ""
echo "=== 設定ファイルの構文チェック ==="
if nginx -t; then
    echo "✅ 設定ファイルの構文は正常です"
else
    echo "❌ 設定ファイルに構文エラーがあります"
    echo "   バックアップから復元します: $BACKUP_FILE"
    cp "$BACKUP_FILE" "$NGINX_CONF"
    exit 1
fi

# Nginxリロード
echo ""
echo "=== Nginxをリロード ==="
if systemctl reload nginx; then
    echo "✅ Nginxの設定をリロードしました"
elif service nginx reload; then
    echo "✅ Nginxの設定をリロードしました"
else
    echo "❌ Nginxのリロードに失敗しました"
    echo "   手動でリロードしてください: sudo systemctl reload nginx"
    exit 1
fi

# 確認
echo ""
echo "=== 修正完了 ==="
echo "✅ Nginxのアップロード制限を40GBに修正しました"
echo ""
echo "📋 適用された設定:"
echo "   - client_max_body_size: 40G"
echo "   - client_body_timeout: 300s (一般) / 600s (メディア)"
echo "   - proxy_request_buffering: off"
echo "   - proxy_max_temp_file_size: 0 (メディアAPI)"
echo ""
echo "🔄 変更を反映するにはWebサーバーも再起動してください:"
echo "   npm restart または pm2 restart all"
echo ""
echo "📁 バックアップファイル: $BACKUP_FILE"
echo "   問題が発生した場合は以下のコマンドで復元できます:"
echo "   sudo cp $BACKUP_FILE $NGINX_CONF && sudo systemctl reload nginx" 