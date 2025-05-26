# GitHub Secrets 設定ガイド

## 必要なSecrets

GitHub リポジトリの `Settings > Secrets and variables > Actions` で以下のシークレットを設定してください：

### EC2接続用
- `EC2_HOST`: EC2インスタンスのパブリックIPアドレス
- `EC2_USER`: EC2のユーザー名（通常は `ec2-user`）
- `EC2_SSH_KEY`: EC2接続用のSSH秘密鍵（.pemファイルの内容）

### ドメイン設定
- `DOMAIN_NAME`: `prompty-ai.com` （本番ドメイン）

### Supabase設定
- `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトのURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabaseの匿名キー

### AWS設定（オプション）
- `AWS_ACCESS_KEY_ID`: AWSアクセスキーID
- `AWS_SECRET_ACCESS_KEY`: AWSシークレットアクセスキー
- `S3_BUCKET`: バックアップ用S3バケット名（オプション）

## ワークフローファイルについて

### 必要なファイル
- `ci-cd.yml` - メインのCI/CDパイプライン（必須）
- `deploy-ec2.yml` - EC2専用デプロイ（必須）
- `health-check.yml` - 定期ヘルスチェック（推奨）

### 不要なファイル（削除可能）
- `pr-check.yml` - プルリクエスト用チェック
  - 個人開発や小規模チームでは不要
  - 直接mainブランチにプッシュする場合は意味がない

## EC2サーバーの準備

EC2インスタンスで以下のコマンドを実行してください：

```bash
# Node.js 18のインストール
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# PM2のインストール
sudo npm install -g pm2

# ログディレクトリの作成
mkdir -p /home/ec2-user/logs

# アプリケーションディレクトリの作成
mkdir -p /home/ec2-user/prompty
cd /home/ec2-user/prompty

# Gitリポジトリのクローン
git clone https://github.com/your-username/your-repo.git .

# 依存関係のインストール
npm ci

# 環境変数の設定
sudo nano /etc/environment
# 以下を追加：
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
# NEXT_PUBLIC_DOMAIN=prompty-ai.com

# PM2の自動起動設定
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user
```

## ドメイン設定（prompty-ai.com）

### DNS設定
1. **Aレコード**: `prompty-ai.com` → EC2のパブリックIP
2. **CNAMEレコード**: `www.prompty-ai.com` → `prompty-ai.com`

### SSL証明書（Let's Encrypt推奨）
```bash
# Certbotのインストール
sudo yum install -y certbot

# SSL証明書の取得
sudo certbot certonly --standalone -d prompty-ai.com -d www.prompty-ai.com

# 自動更新の設定
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### Nginx設定（推奨）
```bash
# Nginxのインストール
sudo yum install -y nginx

# 設定ファイルの作成
sudo nano /etc/nginx/conf.d/prompty.conf
```

```nginx
server {
    listen 80;
    server_name prompty-ai.com www.prompty-ai.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name prompty-ai.com www.prompty-ai.com;

    ssl_certificate /etc/letsencrypt/live/prompty-ai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/prompty-ai.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## セキュリティグループの設定

EC2のセキュリティグループで以下のポートを開放してください：

- **ポート 22**: SSH接続用
- **ポート 80**: HTTP（SSL証明書取得・リダイレクト用）
- **ポート 443**: HTTPS（本番アクセス用）
- **ポート 3000**: Next.jsアプリケーション用（内部通信）

## デプロイの流れ

1. `main`ブランチにプッシュ
2. GitHub Actionsが自動実行
3. ビルドテストが成功すると、EC2にデプロイ
4. PM2でアプリケーションが再起動
5. https://prompty-ai.com でアクセス確認

## トラブルシューティング

### デプロイが失敗する場合
- EC2のSSH接続設定を確認
- GitHub Secretsの設定を確認
- EC2のディスク容量を確認

### ドメインにアクセスできない場合
- DNS設定を確認
- SSL証明書の状態を確認
- Nginxの設定を確認

### アプリケーションが起動しない場合
```bash
# EC2にSSH接続して確認
ssh -i your-key.pem ec2-user@your-ec2-ip

# PM2の状態確認
pm2 status

# ログの確認
pm2 logs prompty

# 手動でアプリケーションを起動
cd /home/ec2-user/prompty
npm run build
npm start
``` 