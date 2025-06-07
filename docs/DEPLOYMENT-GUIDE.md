# 🚀 デプロイメントガイド

Promptyアプリケーションを本番環境にデプロイするための完全ガイドです。複数のプラットフォームに対応し、初心者でも安全にデプロイできるよう詳しく説明します。

## 📑 目次

1. [🎯 デプロイ戦略](#-デプロイ戦略)
2. [🔧 事前準備](#-事前準備)
3. [☁️ Vercel デプロイ（推奨）](#-vercel-デプロイ推奨)
4. [🌐 Netlify デプロイ](#-netlify-デプロイ)
5. [🐳 Docker デプロイ](#-docker-デプロイ)
6. [🖥️ VPS/専用サーバー デプロイ](#-vps専用サーバー-デプロイ)
7. [☁️ AWS デプロイ](#-aws-デプロイ)
8. [🔒 セキュリティ設定](#-セキュリティ設定)
9. [📊 監視・ログ設定](#-監視ログ設定)
10. [🔄 CI/CD 設定](#-cicd-設定)
11. [📈 パフォーマンス最適化](#-パフォーマンス最適化)
12. [❓ トラブルシューティング](#-トラブルシューティング)

---

## 🎯 デプロイ戦略

### プラットフォーム比較

| プラットフォーム | 難易度 | コスト | 推奨用途 |
|----------------|--------|--------|----------|
| **Vercel** | ⭐ 簡単 | 無料〜 | 個人・小規模 |
| **Netlify** | ⭐⭐ 簡単 | 無料〜 | 静的サイト中心 |
| **Docker** | ⭐⭐⭐ 中級 | インフラ依存 | 汎用性重視 |
| **VPS** | ⭐⭐⭐⭐ 上級 | $5〜/月 | 完全制御 |
| **AWS** | ⭐⭐⭐⭐⭐ 専門 | 従量課金 | エンタープライズ |

### 推奨フロー
```
開発環境 → ステージング環境 → 本番環境
     ↓           ↓            ↓
  localhost   Vercel Preview  Vercel Production
```

---

## 🔧 事前準備

### 1. 環境変数の整理

本番環境用の環境変数を準備：

```bash
# .env.production (サンプル)
# ========================================
# データベース (Supabase)
# ========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# ========================================
# AI API (Claude)
# ========================================
CLAUDE_API_KEY=sk-ant-api03...

# ========================================
# 決済 (Stripe)
# ========================================
STRIPE_SECRET_KEY=sk_live_...  # 本番キー！
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # 本番キー！

# ========================================
# セキュリティ
# ========================================
CSRF_SECRET=your-256-bit-secret
ADMIN_API_KEY=your-admin-key
JWT_SECRET=your-jwt-secret
NEXTAUTH_SECRET=your-nextauth-secret

# ========================================
# 本番環境設定
# ========================================
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. セキュリティチェックリスト

デプロイ前に必ず確認：

- [ ] 本番用のAPIキーに変更済み
- [ ] デバッグログが無効化されている
- [ ] セキュリティヘッダーが設定されている
- [ ] HTTPS が有効化されている
- [ ] 環境変数が適切に設定されている
- [ ] 不要なファイルが除外されている

### 3. ビルドテスト

```bash
# 本番ビルドをローカルでテスト
npm run build

# ビルド成果物の確認
npm start

# エラーがないことを確認
```

---

## ☁️ Vercel デプロイ（推奨）

Vercelは Next.js に最適化されており、最も簡単にデプロイできます。

### Step 1: GitHubリポジトリ準備

```bash
# 1. GitHubにリポジトリ作成
# https://github.com/new

# 2. ローカルコードをプッシュ
git add .
git commit -m "Initial commit for production"
git remote add origin https://github.com/username/prompty.git
git push -u origin main
```

### Step 2: Vercelアカウント設定

```
1. https://vercel.com にアクセス
2. GitHubアカウントでサインアップ
3. 「Continue with GitHub」をクリック
```

### Step 3: プロジェクトインポート

```
1. Vercelダッシュボードで「Add New...」→「Project」
2. GitHubリポジトリを選択
3. プロジェクト設定:
   - Project Name: prompty
   - Framework Preset: Next.js
   - Root Directory: ./
```

### Step 4: 環境変数設定

```
1. Project Settings → Environment Variables
2. 以下をすべて追加:
```

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Production, Preview, Development |
| `CLAUDE_API_KEY` | `sk-ant-api03...` | Production, Preview, Development |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Production, Preview |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Production, Preview |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Production, Preview |
| `CSRF_SECRET` | `your-256-bit-secret` | Production, Preview, Development |
| `ADMIN_API_KEY` | `your-admin-key` | Production, Preview, Development |

### Step 5: カスタムドメイン設定

```
1. Project Settings → Domains
2. 「Add」をクリック
3. ドメイン名を入力: your-domain.com
4. DNS設定:
   - Type: CNAME
   - Name: @
   - Value: cname.vercel-dns.com
```

### Step 6: デプロイ実行

```
1. 「Deploy」ボタンをクリック
2. ビルドログを確認
3. 完了後、生成されたURLにアクセスして動作確認
```

### Vercel設定ファイル（vercel.json）

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "functions": {
    "src/pages/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

---

## 🌐 Netlify デプロイ

### Step 1: ビルド設定

```toml
# netlify.toml
[build]
  command = "npm run build && npm run export"
  publish = "out"

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### Step 2: Next.js設定調整

```javascript
// next.config.js (Netlify用)
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  trailingSlash: true,
  output: 'export',
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
```

### Step 3: デプロイ実行

```bash
# 1. Netlify CLIインストール
npm install -g netlify-cli

# 2. ログイン
netlify login

# 3. 初回デプロイ
netlify deploy --prod --dir=out
```

---

## 🐳 Docker デプロイ

コンテナ化によりポータブルなデプロイが可能です。

### Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  prompty:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
      - CSRF_SECRET=${CSRF_SECRET}
      - ADMIN_API_KEY=${ADMIN_API_KEY}
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - prompty
    restart: unless-stopped
```

### 実行コマンド

```bash
# ビルド
docker-compose build

# 起動
docker-compose up -d

# ログ確認
docker-compose logs -f prompty

# 停止
docker-compose down
```

---

## 🖥️ VPS/専用サーバー デプロイ

### サーバー準備（Ubuntu 22.04）

```bash
# 1. システム更新
sudo apt update && sudo apt upgrade -y

# 2. Node.js インストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Nginx インストール
sudo apt install nginx -y

# 4. PM2 インストール（プロセス管理）
sudo npm install -g pm2

# 5. Git インストール
sudo apt install git -y

# 6. 証明書管理（Let's Encrypt）
sudo apt install certbot python3-certbot-nginx -y
```

### アプリケーションデプロイ

```bash
# 1. アプリケーションクローン
cd /var/www
sudo git clone https://github.com/username/prompty.git
cd prompty

# 2. 依存関係インストール
sudo npm ci --production

# 3. 環境変数設定
sudo nano .env.local
# 環境変数を設定

# 4. ビルド
sudo npm run build

# 5. 所有者変更
sudo chown -R www-data:www-data /var/www/prompty

# 6. PM2で起動
sudo pm2 start npm --name "prompty" -- start
sudo pm2 startup
sudo pm2 save
```

### Nginx設定

```nginx
# /etc/nginx/sites-available/prompty
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL設定
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # セキュリティヘッダー
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; connect-src 'self' https:;" always;

    # 静的ファイル
    location /_next/static {
        alias /var/www/prompty/.next/static;
        expires 365d;
        access_log off;
    }

    # メイン アプリケーション
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

### SSL証明書設定

```bash
# 1. 証明書取得
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 2. 自動更新設定
sudo crontab -e
# 以下を追加
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## ☁️ AWS デプロイ

### AWS Amplify（推奨）

```bash
# 1. Amplify CLI インストール
npm install -g @aws-amplify/cli

# 2. 初期化
amplify init

# 3. ホスティング追加
amplify add hosting

# 4. デプロイ
amplify publish
```

### EC2 + RDS + CloudFront

詳細なAWS構成は別途専用ガイドを参照してください。

---

## 🔒 セキュリティ設定

### 1. 環境変数の保護

```bash
# サーバー上での環境変数暗号化
sudo apt install gpg

# 暗号化
gpg --symmetric --cipher-algo AES256 .env.local

# 復号化（デプロイ時）
gpg --decrypt .env.local.gpg > .env.local
```

### 2. ファイアウォール設定

```bash
# UFW設定（Ubuntu）
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 3. 自動セキュリティ更新

```bash
# Ubuntu
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4. ログ監視

```bash
# Fail2ban インストール
sudo apt install fail2ban

# 設定
sudo nano /etc/fail2ban/jail.local
```

```ini
# /etc/fail2ban/jail.local
[DEFAULT]
bantime = 10m
findtime = 10m
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/*error.log
findtime = 600
maxretry = 10
```

---

## 📊 監視・ログ設定

### 1. アプリケーション監視

```javascript
// lib/monitoring.ts
export const trackError = (error: Error, context?: any) => {
  console.error('Application Error:', error, context);
  
  // Sentry, LogRocket等のサービスと連携
  if (process.env.NODE_ENV === 'production') {
    // 外部監視サービスに送信
  }
};

export const trackPageView = (page: string) => {
  // Google Analytics等と連携
};
```

### 2. サーバー監視

```bash
# システム監視ツールインストール
sudo apt install htop iotop nethogs

# ログローテーション設定
sudo nano /etc/logrotate.d/prompty
```

```
# /etc/logrotate.d/prompty
/var/log/prompty/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload prompty
    endscript
}
```

### 3. アラート設定

```bash
# ディスク容量監視スクリプト
cat > /usr/local/bin/disk-alert.sh << 'EOF'
#!/bin/bash
THRESHOLD=90
USAGE=$(df / | awk 'NR==2 {print $5}' | cut -d'%' -f1)

if [ $USAGE -gt $THRESHOLD ]; then
    echo "ディスク使用量が${USAGE}%に達しました" | mail -s "ディスク容量アラート" admin@your-domain.com
fi
EOF

chmod +x /usr/local/bin/disk-alert.sh

# Cronで定期実行
echo "0 */6 * * * /usr/local/bin/disk-alert.sh" | crontab -
```

---

## 🔄 CI/CD 設定

### GitHub Actions（推奨）

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run linting
      run: npm run lint
    
    - name: Type check
      run: npm run type-check
    
    - name: Build
      run: npm run build

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Vercel (Preview)
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Vercel (Production)
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

### デプロイメント戦略

```
feature/new-feature → PR → staging → review → main → production
```

---

## 📈 パフォーマンス最適化

### 1. Next.js 最適化

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 本番最適化
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  // 画像最適化
  images: {
    domains: ['your-cdn-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // バンドル分析
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // 本番ビルドでバンドルサイズ最適化
      config.optimization.splitChunks.chunks = 'all';
    }
    return config;
  },
  
  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 2. CDN設定

```javascript
// lib/cdn.ts
const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

export const getCDNUrl = (path: string): string => {
  if (!CDN_BASE_URL) return path;
  return `${CDN_BASE_URL}${path}`;
};

// 使用例
const imageUrl = getCDNUrl('/images/logo.png');
```

### 3. キャッシュ戦略

```nginx
# Nginx キャッシュ設定
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

location ~* \.(html)$ {
    expires 1h;
    add_header Cache-Control "public";
}
```

---

## ❓ トラブルシューティング

### よくある問題と解決方法

#### 🔧 ビルドエラー

**症状**: ビルド時にメモリ不足エラー
```
JavaScript heap out of memory
```

**解決方法**:
```bash
# Node.jsメモリ制限を増加
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

#### 🔐 環境変数が読み込まれない

**症状**: 本番環境で環境変数が undefined
```
Error: Missing environment variable
```

**解決方法**:
```bash
# 1. 環境変数名の確認（NEXT_PUBLIC_ プレフィックス）
echo $NEXT_PUBLIC_SUPABASE_URL

# 2. プラットフォームの設定確認
# Vercel: Project Settings → Environment Variables
# Netlify: Site settings → Environment variables

# 3. ビルド時環境変数の確認
npm run build 2>&1 | grep -i "environment"
```

#### 🌐 CORS エラー

**症状**: API呼び出し時にCORSエラー
```
Access to fetch blocked by CORS policy
```

**解決方法**:
```javascript
// next.config.js
async headers() {
  return [
    {
      source: "/api/(.*)",
      headers: [
        { key: "Access-Control-Allow-Origin", value: "https://your-domain.com" },
        { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
      ],
    },
  ];
}
```

#### 📊 データベース接続エラー

**症状**: Supabase接続エラー
```
Database connection failed
```

**解決方法**:
```bash
# 1. 接続情報確認
curl -I $NEXT_PUBLIC_SUPABASE_URL

# 2. APIキー確認
# Supabase Dashboard → Settings → API

# 3. ネットワーク確認
ping your-project.supabase.co

# 4. RLSポリシー確認
# Supabase Dashboard → Authentication → Policies
```

#### 💳 決済エラー

**症状**: Stripe決済が動作しない
```
Payment processing failed
```

**解決方法**:
```bash
# 1. APIキー確認（本番 vs テスト）
echo $STRIPE_SECRET_KEY | grep -o '^sk_[a-z]*'
# sk_live_... (本番) または sk_test_... (テスト)

# 2. Webhookエンドポイント確認
curl -X POST https://your-domain.com/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 3. Stripe Dashboard確認
# https://dashboard.stripe.com/webhooks
```

### パフォーマンス問題

#### 📈 読み込み速度改善

```bash
# 1. バンドルサイズ分析
npm install --save-dev @next/bundle-analyzer

# next.config.js に追加
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

# 実行
ANALYZE=true npm run build

# 2. Lighthouse監査
npm install -g lighthouse
lighthouse https://your-domain.com --output html --output-path report.html
```

#### 🔍 メモリリーク調査

```bash
# Node.js メモリ使用量監視
node --inspect --inspect-port=9229 server.js

# Chrome DevTools で chrome://inspect からデバッグ
```

### ログ分析

#### 📋 エラーログ収集

```bash
# PM2 ログ
pm2 logs prompty --lines 100

# Nginx エラーログ
sudo tail -f /var/log/nginx/error.log

# システムログ
sudo journalctl -u nginx -f
```

#### 📊 アクセス解析

```bash
# Nginx アクセスログ解析
sudo cat /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -nr | head -10

# エラー率計算
sudo grep -c "HTTP/1.1\" [45]" /var/log/nginx/access.log
```

---

## 🎯 本番運用チェックリスト

### デプロイ前チェック

- [ ] すべてのテストが通過している
- [ ] セキュリティ監査を実施済み
- [ ] 本番用環境変数が設定済み
- [ ] SSL証明書が有効
- [ ] バックアップ体制が整っている
- [ ] 監視・アラート設定が完了
- [ ] ドキュメントが最新

### デプロイ後チェック

- [ ] 全ページが正常に表示される
- [ ] ユーザー認証が動作する
- [ ] 決済機能が正常に動作する
- [ ] API応答速度が正常範囲内
- [ ] セキュリティヘッダーが設定されている
- [ ] ログ出力が正常
- [ ] 監視アラートが動作する

### 定期メンテナンス

- [ ] 週次: セキュリティ更新確認
- [ ] 月次: パフォーマンス分析
- [ ] 四半期: セキュリティ監査
- [ ] 年次: 災害復旧テスト

---

## 📞 サポート・リソース

### 公式ドキュメント
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)

### コミュニティ
- [Next.js Discord](https://discord.gg/nextjs)
- [Supabase Discord](https://discord.supabase.com/)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

### 緊急時連絡先
- セキュリティ問題: security@prompty.com
- システム障害: ops@prompty.com

---

*最終更新: 2024年6月7日*
*バージョン: 1.0.0*

🚀 **本番環境へのデプロイ準備完了！安全で高性能なアプリケーションをユーザーに提供しましょう。**