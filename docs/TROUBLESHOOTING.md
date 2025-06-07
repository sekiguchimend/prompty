# 🔧 トラブルシューティングガイド

Promptyアプリケーションでよく発生する問題とその解決方法を詳しく説明します。問題解決のプロセスを段階的に説明し、初心者でも対処できるようにしています。

## 📑 目次

1. [🚨 緊急時対応](#-緊急時対応)
2. [🔧 開発環境の問題](#-開発環境の問題)
3. [🔐 認証・権限の問題](#-認証権限の問題)
4. [📊 データベースの問題](#-データベースの問題)
5. [💳 決済システムの問題](#-決済システムの問題)
6. [🤖 AI機能の問題](#-ai機能の問題)
7. [🌐 デプロイメントの問題](#-デプロイメントの問題)
8. [📈 パフォーマンスの問題](#-パフォーマンスの問題)
9. [🛡️ セキュリティの問題](#-セキュリティの問題)
10. [🔍 診断ツール](#-診断ツール)

---

## 🚨 緊急時対応

### サイトが完全にダウンしている場合

#### **症状**: サイトにアクセスできない
```
This site can't be reached
ERR_CONNECTION_REFUSED
```

#### **緊急対応手順**:

1. **サーバー状態確認**
```bash
# VPS/専用サーバーの場合
ssh user@your-server
sudo systemctl status nginx
sudo systemctl status pm2

# プロセス確認
pm2 status
```

2. **Vercel/Netlifyの場合**
```
1. プラットフォームのステータスページを確認
   - Vercel: https://vercel-status.com/
   - Netlify: https://netlifystatus.com/

2. デプロイメント履歴を確認
   - ダッシュボードで最新デプロイの状態を確認
```

3. **DNS確認**
```bash
# DNS解決確認
nslookup your-domain.com
dig your-domain.com

# 結果例（正常）:
# your-domain.com. IN A 76.76.19.123
```

4. **緊急復旧手順**
```bash
# アプリケーション再起動
pm2 restart prompty

# Nginx再起動
sudo systemctl restart nginx

# ログ確認
pm2 logs prompty
sudo tail -f /var/log/nginx/error.log
```

#### **エスカレーション**
```
1. 15分以内に復旧しない場合
   → インフラプロバイダーに連絡

2. データ損失の可能性がある場合
   → 緊急連絡先に即座に連絡
```

---

## 🔧 開発環境の問題

### Node.js / npm の問題

#### **症状**: `npm install` が失敗する
```bash
npm ERR! network request failed
npm ERR! network This is most likely not a problem with npm itself
```

**解決手順**:
```bash
# 1. ネットワーク確認
ping registry.npmjs.org

# 2. npm キャッシュクリア
npm cache clean --force

# 3. node_modules 削除して再インストール
rm -rf node_modules package-lock.json
npm install

# 4. npm レジストリ確認
npm config get registry
# 結果: https://registry.npmjs.org/

# 5. プロキシ設定確認（企業環境の場合）
npm config get proxy
npm config get https-proxy
```

#### **症状**: Node.js バージョンエラー
```bash
error Unsupported engine: wanted: {"node":">=18.0.0"} (current: {"node":"16.14.0"})
```

**解決手順**:
```bash
# 1. 現在のバージョン確認
node --version
npm --version

# 2. Node.js 18+ インストール
# 公式サイトからダウンロード: https://nodejs.org/

# 3. nvm使用（推奨）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
nvm alias default 18

# 4. 確認
node --version  # v18.x.x であることを確認
```

### 開発サーバーの問題

#### **症状**: `npm run dev` でサーバーが起動しない
```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**解決手順**:
```bash
# 1. ポート使用状況確認
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# 2. プロセス停止
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# 3. 別ポートで起動
npm run dev -- -p 3001

# 4. 環境変数でポート指定
echo "PORT=3001" >> .env.local
npm run dev
```

#### **症状**: Hot Reload が動作しない
```
Changes not reflected in browser
```

**解決手順**:
```bash
# 1. ブラウザキャッシュクリア
# Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (macOS)

# 2. Next.js設定確認
# next.config.js
module.exports = {
  experimental: {
    esmExternals: false  // 追加
  }
}

# 3. ファイル監視の問題（WSL2の場合）
export CHOKIDAR_USEPOLLING=true
npm run dev

# 4. 開発者ツールでネットワーク確認
# F12 → Network タブ → Disable cache
```

---

## 🔐 認証・権限の問題

### ログインできない

#### **症状**: ログイン試行で認証エラー
```json
{
  "error": "Invalid login credentials",
  "code": "invalid_credentials"
}
```

**診断手順**:
```bash
# 1. Supabase接続確認
curl -H "apikey: YOUR_ANON_KEY" \
  $NEXT_PUBLIC_SUPABASE_URL/rest/v1/

# 2. 環境変数確認
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. ブラウザでSupabaseダッシュボード確認
# https://app.supabase.com/project/YOUR_PROJECT_ID
```

**解決手順**:
```typescript
// 1. 認証状態デバッグ
const debugAuth = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  console.log('Session:', session);
  console.log('Error:', error);
};

// 2. 手動認証テスト
const testAuth = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'testpassword'
  });
  console.log('Auth result:', data, error);
};
```

#### **症状**: 認証後にリダイレクトされない
```
User authenticated but stuck on login page
```

**解決手順**:
```typescript
// 1. リダイレクト設定確認
// Supabase Dashboard → Authentication → URL Configuration
// Site URL: https://your-domain.com
// Redirect URLs: https://your-domain.com/auth/callback

// 2. コールバック処理確認
// pages/auth/callback.tsx
export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (data.session) {
        router.push('/dashboard');
      } else {
        router.push('/login?error=callback_failed');
      }
    };

    handleAuthCallback();
  }, [router]);

  return <div>認証処理中...</div>;
}
```

### 権限エラー

#### **症状**: API呼び出しで403エラー
```json
{
  "error": "Insufficient permissions",
  "code": "permission_denied"
}
```

**診断手順**:
```typescript
// 1. ユーザー情報確認
const checkUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('Current user:', user);
  console.log('User role:', user?.user_metadata?.role);
};

// 2. RLSポリシー確認
// Supabase Dashboard → Table Editor → RLS Policies
// 各テーブルの SELECT, INSERT, UPDATE, DELETE ポリシーを確認
```

**解決手順**:
```sql
-- 3. RLSポリシー例（prompts テーブル）
-- 全ユーザーが公開プロンプトを読み取り可能
CREATE POLICY "Anyone can read published prompts" ON prompts
FOR SELECT USING (published = true AND is_public = true);

-- 認証ユーザーが自分のプロンプトを管理
CREATE POLICY "Users can manage own prompts" ON prompts
FOR ALL USING (auth.uid() = author_id);

-- 管理者が全アクセス可能
CREATE POLICY "Admins can access all prompts" ON prompts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);
```

---

## 📊 データベースの問題

### 接続エラー

#### **症状**: データベース接続失敗
```
Database connection failed: connect ECONNREFUSED
```

**診断手順**:
```bash
# 1. Supabaseプロジェクト状態確認
# https://app.supabase.com/project/YOUR_PROJECT_ID
# Status: Healthy であることを確認

# 2. 接続テスト
curl -I $NEXT_PUBLIC_SUPABASE_URL

# 3. APIキー確認
# Dashboard → Settings → API
# anon key と service_role key が正しいことを確認
```

**解決手順**:
```typescript
// 1. 接続設定の再確認
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
}

// 2. 手動接続テスト
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    console.log('Connection test:', data, error);
  } catch (err) {
    console.error('Connection failed:', err);
  }
};
```

### クエリエラー

#### **症状**: データ取得クエリが失敗
```json
{
  "error": "relation \"prompts\" does not exist",
  "code": "42P01"
}
```

**解決手順**:
```sql
-- 1. テーブル存在確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 2. 必要なテーブル作成（例：prompts）
CREATE TABLE IF NOT EXISTS prompts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. RLS有効化
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
```

#### **症状**: INSERT/UPDATE クエリが失敗
```json
{
  "error": "new row violates row-level security policy",
  "code": "42501"
}
```

**解決手順**:
```sql
-- 1. RLSポリシー確認
SELECT * FROM pg_policies WHERE tablename = 'prompts';

-- 2. 適切なポリシー作成
CREATE POLICY "Users can insert own prompts" ON prompts
FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own prompts" ON prompts
FOR UPDATE USING (auth.uid() = author_id);
```

---

## 💳 決済システムの問題

### Stripe 設定エラー

#### **症状**: 決済処理が初期化できない
```javascript
IntegrationError: Invalid value for stripe.confirmPayment intent_secret parameter
```

**診断手順**:
```javascript
// 1. Stripe キー確認
console.log('Stripe Publishable Key:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
console.log('Key type:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_'));

// 2. Stripe ダッシュボード確認
// https://dashboard.stripe.com/apikeys
// テスト環境: pk_test_... / sk_test_...
// 本番環境: pk_live_... / sk_live_...
```

**解決手順**:
```typescript
// 1. 環境別キー設定
const stripeKey = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE
  : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST;

// 2. Stripe初期化確認
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(stripeKey!);

// 3. Payment Intent作成テスト
const testPaymentIntent = async () => {
  const response = await fetch('/api/payments/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 1000,
      currency: 'jpy'
    })
  });
  
  const { client_secret } = await response.json();
  console.log('Payment Intent created:', client_secret);
};
```

### Webhook エラー

#### **症状**: Stripe Webhook が受信されない
```
Webhook endpoint returned non-2xx status code
```

**診断手順**:
```bash
# 1. Webhook エンドポイント確認
curl -X POST https://your-domain.com/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{"type": "test"}'

# 2. Stripe CLI でローカルテスト
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger payment_intent.succeeded
```

**解決手順**:
```typescript
// 1. Webhook 署名検証確認
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
    
    console.log('Webhook event:', event.type);
    
    // イベント処理
    switch (event.type) {
      case 'payment_intent.succeeded':
        // 決済成功処理
        break;
      // その他のイベント
    }
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook Error', { status: 400 });
  }
}
```

---

## 🤖 AI機能の問題

### Claude API エラー

#### **症状**: Claude API呼び出しが失敗
```json
{
  "error": "Invalid API key provided",
  "type": "authentication_error"
}
```

**診断手順**:
```bash
# 1. APIキー確認
echo $CLAUDE_API_KEY | grep -o '^sk-ant-'

# 2. API接続テスト
curl -X POST https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $CLAUDE_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**解決手順**:
```typescript
// 1. APIクライアント再構築
class ClaudeClient {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY!;
    
    if (!this.apiKey || !this.apiKey.startsWith('sk-ant-')) {
      throw new Error('Invalid Claude API key');
    }
  }
  
  async generateResponse(prompt: string) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Claude API call failed:', error);
      throw error;
    }
  }
}
```

### レート制限エラー

#### **症状**: API呼び出し制限に達した
```json
{
  "error": "Rate limit exceeded",
  "type": "rate_limit_error"
}
```

**解決手順**:
```typescript
// 1. 指数バックオフ実装
const exponentialBackoff = async (fn: Function, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.type === 'rate_limit_error' && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

// 2. 使用例
const generateWithRetry = async (prompt: string) => {
  return exponentialBackoff(() => claudeClient.generateResponse(prompt));
};
```

---

## 🌐 デプロイメントの問題

### Vercel デプロイエラー

#### **症状**: ビルドが失敗する
```
Build failed with exit code 1
Module not found: Can't resolve 'some-module'
```

**解決手順**:
```bash
# 1. ローカルビルドテスト
npm run build

# 2. 依存関係確認
npm ls --depth=0

# 3. package.json 確認
cat package.json | jq '.dependencies, .devDependencies'

# 4. Vercel設定調整
# vercel.json
{
  "functions": {
    "src/pages/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  }
}
```

#### **症状**: 環境変数が読み込まれない
```
Error: Missing required environment variable
```

**解決手順**:
```bash
# 1. Vercel CLI確認
npx vercel env ls

# 2. 環境変数追加
npx vercel env add CLAUDE_API_KEY production

# 3. ダッシュボード確認
# https://vercel.com/your-team/your-project/settings/environment-variables

# 4. 再デプロイ
npx vercel --prod
```

### DNS/ドメイン問題

#### **症状**: カスタムドメインにアクセスできない
```
This site can't be reached
DNS_PROBE_FINISHED_NXDOMAIN
```

**解決手順**:
```bash
# 1. DNS設定確認
nslookup your-domain.com
dig your-domain.com

# 2. Vercel DNS設定
# Project Settings → Domains
# DNS設定例:
# Type: CNAME
# Name: @
# Value: cname.vercel-dns.com

# 3. DNS伝播確認
# https://dnschecker.org/

# 4. TTL設定確認（低めに設定）
# TTL: 300 (5分)
```

---

## 📈 パフォーマンスの問題

### 読み込み速度が遅い

#### **症状**: ページ読み込みに時間がかかる
```
Time to first byte (TTFB): > 3s
First contentful paint (FCP): > 3s
```

**診断手順**:
```bash
# 1. Lighthouse分析
lighthouse https://your-domain.com --output html

# 2. バンドルサイズ分析
npm install --save-dev @next/bundle-analyzer
ANALYZE=true npm run build

# 3. ネットワーク分析
# Chrome DevTools → Network タブ
# Slow 3G でテスト
```

**解決手順**:
```typescript
// 1. 動的インポート
const DynamicComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
});

// 2. 画像最適化
import Image from 'next/image';

<Image
  src="/large-image.jpg"
  alt="Description"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
  priority // Above the fold の画像のみ
/>

// 3. APIレスポンス最適化
export const getStaticProps = async () => {
  const data = await fetchData();
  
  return {
    props: { data },
    revalidate: 3600 // 1時間キャッシュ
  };
};
```

### メモリリーク

#### **症状**: メモリ使用量が継続的に増加
```
JavaScript heap out of memory
```

**診断手順**:
```bash
# 1. Node.js メモリ監視
node --inspect server.js
# Chrome で chrome://inspect

# 2. メモリ使用量確認
process.memoryUsage()
```

**解決手順**:
```typescript
// 1. イベントリスナー適切な削除
useEffect(() => {
  const handleScroll = () => {
    // scroll handler
  };
  
  window.addEventListener('scroll', handleScroll);
  
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}, []);

// 2. インターバル・タイマー清理
useEffect(() => {
  const interval = setInterval(() => {
    // periodic task
  }, 1000);
  
  return () => clearInterval(interval);
}, []);

// 3. WeakMap使用（適切な場面で）
const cache = new WeakMap();
```

---

## 🛡️ セキュリティの問題

### XSS攻撃対策

#### **症状**: 悪意のあるスクリプトが実行される
```html
<script>alert('XSS')</script>
```

**対策手順**:
```typescript
// 1. 入力サニタイゼーション
import DOMPurify from 'dompurify';

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  });
};

// 2. CSP設定強化
// next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

// 3. React での安全な出力
const SafeComponent = ({ userContent }: { userContent: string }) => {
  return (
    <div>
      {/* 危険 */}
      {/* <div dangerouslySetInnerHTML={{ __html: userContent }} /> */}
      
      {/* 安全 */}
      <div>{userContent}</div>
    </div>
  );
};
```

### CSRF攻撃対策

#### **症状**: 意図しないリクエストが送信される

**対策手順**:
```typescript
// 1. CSRFトークン実装
import { csrfProtection } from '../lib/security/csrf-protection';

// API ルート
export default csrfProtection.middleware()(async (req, res) => {
  // API 処理
});

// 2. フロントエンド実装
const useCSRFToken = () => {
  const [token, setToken] = useState<string>('');
  
  useEffect(() => {
    const fetchToken = async () => {
      const response = await fetch('/api/csrf-token');
      const { token } = await response.json();
      setToken(token);
    };
    
    fetchToken();
  }, []);
  
  return token;
};

// 3. リクエスト送信時
const makeSecureRequest = async (data: any) => {
  const csrfToken = useCSRFToken();
  
  return fetch('/api/secure-endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(data)
  });
};
```

---

## 🔍 診断ツール

### デバッグ用ヘルスチェックAPI

```typescript
// pages/api/health.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    checks: {
      database: await checkDatabase(),
      ai_service: await checkAIService(),
      payment: await checkPaymentService(),
      storage: await checkStorage()
    }
  };
  
  const allHealthy = Object.values(health.checks).every(check => check.status === 'ok');
  
  res.status(allHealthy ? 200 : 500).json(health);
}

async function checkDatabase() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    return error ? { status: 'error', message: error.message } : { status: 'ok' };
  } catch (error) {
    return { status: 'error', message: 'Database unreachable' };
  }
}
```

### ログ分析スクリプト

```bash
#!/bin/bash
# log-analyzer.sh

echo "=== Prompty ログ分析 ==="
echo "分析日時: $(date)"
echo

# エラー率計算
echo "--- エラー率 ---"
TOTAL_REQUESTS=$(grep -c "HTTP/1.1" /var/log/nginx/access.log)
ERROR_REQUESTS=$(grep -c "HTTP/1.1\" [45]" /var/log/nginx/access.log)
ERROR_RATE=$(echo "scale=2; $ERROR_REQUESTS * 100 / $TOTAL_REQUESTS" | bc)
echo "総リクエスト数: $TOTAL_REQUESTS"
echo "エラーリクエスト数: $ERROR_REQUESTS"
echo "エラー率: $ERROR_RATE%"
echo

# 最頻アクセス IP
echo "--- アクセス TOP 10 IP ---"
grep -o '^[^ ]*' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10
echo

# レスポンス時間分析
echo "--- 応答時間分析 ---"
awk '{print $NF}' /var/log/nginx/access.log | sort -n | awk '
  BEGIN { count = 0; sum = 0 }
  {
    times[++count] = $1
    sum += $1
  }
  END {
    if (count > 0) {
      print "平均: " sum/count "ms"
      print "中央値: " times[int(count/2)] "ms"
      print "95%ile: " times[int(count*0.95)] "ms"
    }
  }
'
```

### システム監視ダッシュボード

```html
<!-- monitoring-dashboard.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Prompty 監視ダッシュボード</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
</head>
<body>
    <h1>Prompty システム監視</h1>
    
    <div id="cpu-chart" style="width:100%;height:300px;"></div>
    <div id="memory-chart" style="width:100%;height:300px;"></div>
    <div id="error-rate-chart" style="width:100%;height:300px;"></div>
    
    <script>
        // リアルタイム監視データの表示
        async function updateCharts() {
            const response = await fetch('/api/monitoring/metrics');
            const data = await response.json();
            
            // CPU使用率
            Plotly.newPlot('cpu-chart', [{
                x: data.timestamps,
                y: data.cpu_usage,
                type: 'scatter',
                mode: 'lines',
                name: 'CPU使用率'
            }], {
                title: 'CPU使用率',
                yaxis: { title: '使用率 (%)' }
            });
            
            // メモリ使用量
            Plotly.newPlot('memory-chart', [{
                x: data.timestamps,
                y: data.memory_usage,
                type: 'scatter',
                mode: 'lines',
                name: 'メモリ使用量'
            }], {
                title: 'メモリ使用量',
                yaxis: { title: '使用量 (MB)' }
            });
            
            // エラー率
            Plotly.newPlot('error-rate-chart', [{
                x: data.timestamps,
                y: data.error_rate,
                type: 'scatter',
                mode: 'lines',
                name: 'エラー率'
            }], {
                title: 'エラー率',
                yaxis: { title: 'エラー率 (%)' }
            });
        }
        
        // 10秒間隔で更新
        setInterval(updateCharts, 10000);
        updateCharts();
    </script>
</body>
</html>
```

---

## 📞 サポート体制

### エスカレーションフロー

```
レベル1: 自己解決 (このガイド、ドキュメント)
    ↓ 30分で解決しない
レベル2: コミュニティサポート (Discord, GitHub Issues)
    ↓ 2時間で解決しない
レベル3: 技術サポート (support@prompty.com)
    ↓ 緊急時・重大障害
レベル4: 緊急対応 (emergency@prompty.com)
```

### 問題報告テンプレート

```markdown
## 問題の概要
<!-- 何が起きているかを簡潔に説明 -->

## 再現手順
1. 
2. 
3. 

## 期待される動作
<!-- 本来どうなるべきか -->

## 実際の動作
<!-- 実際に何が起きているか -->

## 環境情報
- OS: 
- ブラウザ: 
- Node.js版: 
- 環境: (development/staging/production)

## エラーログ
```
<!-- エラーメッセージやログを貼り付け -->
```

## スクリーンショット
<!-- 必要に応じて画像を添付 -->

## 試した解決策
<!-- 既に試したことがあれば記載 -->
```

---

## 🎯 予防保守

### 定期チェック項目

**日次**:
- [ ] エラーログ確認
- [ ] レスポンス時間確認
- [ ] ディスク使用量確認

**週次**:
- [ ] セキュリティ更新確認
- [ ] バックアップ動作確認
- [ ] パフォーマンステスト

**月次**:
- [ ] 依存関係更新
- [ ] セキュリティスキャン
- [ ] 災害復旧テスト

**四半期**:
- [ ] アーキテクチャレビュー
- [ ] 容量計画見直し
- [ ] セキュリティ監査

---

*最終更新: 2024年6月7日*

🔧 **問題が解決しない場合は、遠慮なくサポートにお問い合わせください。技術チームが迅速に対応いたします！**