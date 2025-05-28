# 🚀 Prompty - AI プロンプト共有・販売プラットフォーム

<div align="center">

![Prompty Logo](https://via.placeholder.com/200x80/4F46E5/FFFFFF?text=Prompty)

**次世代のAIプロンプト共有・販売プラットフォーム**

[![Next.js](https://img.shields.io/badge/Next.js-14.2.28-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-18.1.0-purple?style=for-the-badge&logo=stripe)](https://stripe.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.11-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

[🌐 ライブデモ](https://prompty.vercel.app) | [📖 ドキュメント](https://docs.prompty.com) | [🐛 バグ報告](https://github.com/sekiguchimend/prompty/issues)

</div>

---

## 📋 目次

- [✨ 特徴](#-特徴)
- [🛠️ 技術スタック](#️-技術スタック)
- [🚀 クイックスタート](#-クイックスタート)
- [📁 プロジェクト構造](#-プロジェクト構造)
- [🔧 環境設定](#-環境設定)
- [💳 Stripe連携設定](#-stripe連携設定)
- [🗄️ データベース設定](#️-データベース設定)
- [📱 主要機能](#-主要機能)
- [🎨 UI/UXデザイン](#-uiuxデザイン)
- [🔐 セキュリティ](#-セキュリティ)
- [📊 パフォーマンス](#-パフォーマンス)
- [🚀 デプロイメント](#-デプロイメント)
- [🧪 テスト](#-テスト)
- [🤝 コントリビューション](#-コントリビューション)
- [📄 ライセンス](#-ライセンス)

---

## ✨ 特徴

### 🎯 コア機能
- **🤖 AIプロンプト共有**: 高品質なプロンプトの投稿・共有・発見
- **💰 収益化システム**: Stripe統合による有料プロンプト販売
- **👥 コミュニティ機能**: フォロー、いいね、コメント、評価システム
- **🔍 高度な検索**: タグ、カテゴリ、キーワードによる詳細検索
- **📊 分析ダッシュボード**: 売上、閲覧数、エンゲージメント分析
- **🏆 コンテスト機能**: 定期的なプロンプトコンテストの開催

### 🎨 ユーザーエクスペリエンス
- **📱 レスポンシブデザイン**: モバイルファーストの美しいUI
- **🌙 ダークモード対応**: ユーザー好みに応じたテーマ切替
- **⚡ 高速パフォーマンス**: Next.js 14の最新機能を活用
- **♿ アクセシビリティ**: WCAG 2.1準拠のインクルーシブデザイン
- **🔔 リアルタイム通知**: 即座のフィードバックとアップデート

---

## 🛠️ 技術スタック

### フロントエンド
```typescript
// Core Framework
Next.js 14.2.28          // React フレームワーク
TypeScript 5.8.3         // 型安全性
React 18.3.1             // UIライブラリ

// Styling & UI
Tailwind CSS 3.4.11     // ユーティリティファーストCSS
shadcn/ui                // モダンUIコンポーネント
Radix UI                 // アクセシブルプリミティブ
Framer Motion 12.7.3     // アニメーション
Lucide React 0.462.0     // アイコンライブラリ

// State Management
TanStack Query 5.56.2    // サーバー状態管理
React Hook Form 7.53.0   // フォーム管理
Zod 3.23.8              // スキーマバリデーション
```

### バックエンド & インフラ
```typescript
// Database & Auth
Supabase 2.49.4          // BaaS (Database, Auth, Storage)
PostgreSQL               // リレーショナルデータベース
Row Level Security       // データセキュリティ

// Payment & API
Stripe 18.1.0           // 決済処理
Next.js API Routes      // サーバーサイドAPI
Edge Functions          // サーバーレス関数

// Development & Build
ESLint 8.57.1           // コード品質
Prettier                // コードフォーマット
TypeScript ESLint       // TypeScript用リンター
```

---

## 🚀 クイックスタート

### 前提条件
- **Node.js** 18.0.0 以上
- **npm** または **bun** パッケージマネージャー
- **Git** バージョン管理
- **Supabase** アカウント
- **Stripe** アカウント（決済機能使用時）

### インストール手順

```bash
# 1. リポジトリのクローン
git clone https://github.com/sekiguchimend/prompty.git
cd prompty

# 2. 依存関係のインストール
npm install
# または
bun install

# 3. 環境変数の設定
cp .env.example .env.local
# .env.local ファイルを編集して必要な環境変数を設定

# 4. データベースのセットアップ
npm run db:setup

# 5. 開発サーバーの起動
npm run dev
# または
bun run dev
```

### 🌐 アクセス
開発サーバーが起動したら、ブラウザで以下にアクセス:
- **フロントエンド**: http://localhost:3000
- **API**: http://localhost:3000/api

---

## 📁 プロジェクト構造

```
prompty/
├── 📁 src/                          # ソースコード
│   ├── 📁 components/               # 再利用可能なUIコンポーネント
│   │   ├── 📁 ui/                   # shadcn/ui基本コンポーネント
│   │   ├── 📁 layout/               # レイアウトコンポーネント
│   │   ├── 📁 forms/                # フォームコンポーネント
│   │   └── 📁 features/             # 機能別コンポーネント
│   ├── 📁 pages/                    # Next.js ページコンポーネント
│   │   ├── 📁 api/                  # API ルート
│   │   ├── 📁 auth/                 # 認証関連ページ
│   │   ├── 📁 dashboard/            # ダッシュボード
│   │   └── 📁 prompts/              # プロンプト関連ページ
│   ├── 📁 lib/                      # ユーティリティ関数
│   │   ├── 📄 supabase.ts           # Supabase クライアント
│   │   ├── 📄 stripe.ts             # Stripe 設定
│   │   └── 📄 utils.ts              # 汎用ユーティリティ
│   ├── 📁 hooks/                    # カスタムReactフック
│   ├── 📁 types/                    # TypeScript型定義
│   ├── 📁 data/                     # データ層・API呼び出し
│   ├── 📁 styles/                   # グローバルスタイル
│   └── 📁 db/                       # データベース関連
│       ├── 📁 migrations/           # マイグレーションファイル
│       └── 📁 seeds/                # シードデータ
├── 📁 public/                       # 静的ファイル
│   ├── 📁 images/                   # 画像ファイル
│   ├── 📁 icons/                    # アイコンファイル
│   └── 📄 favicon.ico               # ファビコン
├── 📁 docs/                         # ドキュメント
├── 📁 supabase/                     # Supabase設定
│   ├── 📁 functions/                # Edge Functions
│   └── 📁 migrations/               # データベースマイグレーション
├── 📄 package.json                  # プロジェクト設定
├── 📄 next.config.js                # Next.js設定
├── 📄 tailwind.config.ts            # Tailwind CSS設定
├── 📄 tsconfig.json                 # TypeScript設定
└── 📄 README.md                     # このファイル
```

---

## 🔧 環境設定

### 環境変数設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください:

```bash
# Supabase 設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe 設定
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# アプリケーション設定
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# その他の設定
NODE_ENV=development
```

### 開発用スクリプト

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm run start

# リンター実行
npm run lint

# 型チェック
npm run type-check

# データベースリセット
npm run db:reset

# マイグレーション実行
npm run db:migrate
```

---

## 💳 Stripe連携設定

### 1. Stripe アカウント設定

1. [Stripe Dashboard](https://dashboard.stripe.com/) にログイン
2. API キーを取得（公開可能キー・秘密キー）
3. Webhook エンドポイントを設定

### 2. Webhook 設定

```bash
# Webhook URL
https://your-domain.com/api/webhooks/stripe

# 監視イベント
- payment_intent.succeeded
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
```

### 3. 商品・価格設定

```typescript
// Stripe 商品作成例
const product = await stripe.products.create({
  name: 'プロンプト名',
  description: 'プロンプトの説明',
  metadata: {
    prompt_id: 'prompt_uuid'
  }
});

const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 1000, // 10.00 USD
  currency: 'jpy',
});
```

---

## 🗄️ データベース設定

### Supabase セットアップ

1. **プロジェクト作成**
   ```bash
   # Supabase CLI インストール
   npm install -g supabase
   
   # プロジェクト初期化
   supabase init
   
   # ローカル開発環境起動
   supabase start
   ```

2. **マイグレーション実行**
   ```bash
   # マイグレーション作成
   supabase migration new create_prompts_table
   
   # マイグレーション適用
   supabase db push
   ```

### 主要テーブル構造

```sql
-- ユーザープロフィール
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  stripe_account_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- プロンプト
CREATE TABLE prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  price DECIMAL(10,2),
  is_free BOOLEAN DEFAULT true,
  author_id UUID REFERENCES profiles(id),
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- いいね
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  prompt_id UUID REFERENCES prompts(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);
```

---

## 📱 主要機能

### 🔐 認証システム
- **ソーシャルログイン**: Google, GitHub, Discord
- **メール認証**: 安全なメールベース認証
- **パスワードリセット**: セキュアなパスワード復旧
- **プロフィール管理**: ユーザー情報の編集・更新

### 📝 プロンプト管理
- **投稿作成**: リッチテキストエディタでの投稿作成
- **カテゴリ分類**: 詳細なカテゴリとタグシステム
- **価格設定**: 無料・有料プロンプトの柔軟な価格設定
- **バージョン管理**: プロンプトの履歴管理

### 💰 収益化機能
- **Stripe統合**: 安全な決済処理
- **売上分析**: 詳細な収益レポート
- **手数料管理**: 透明な手数料システム
- **支払い履歴**: 完全な取引履歴

### 🔍 検索・発見
- **全文検索**: 高速な全文検索エンジン
- **フィルタリング**: 価格、カテゴリ、評価による絞り込み
- **レコメンデーション**: AI駆動の推奨システム
- **トレンド表示**: 人気・注目のプロンプト

---

## 🎨 UI/UXデザイン

### デザインシステム

```typescript
// カラーパレット
const colors = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    900: '#1e3a8a'
  },
  gray: {
    50: '#f9fafb',
    500: '#6b7280',
    900: '#111827'
  }
};

// タイポグラフィ
const typography = {
  h1: 'text-4xl font-bold',
  h2: 'text-3xl font-semibold',
  body: 'text-base',
  caption: 'text-sm text-gray-600'
};
```

### レスポンシブブレークポイント

```css
/* Tailwind CSS ブレークポイント */
sm: 640px   /* スマートフォン */
md: 768px   /* タブレット */
lg: 1024px  /* ラップトップ */
xl: 1280px  /* デスクトップ */
2xl: 1536px /* 大型ディスプレイ */
```

### アクセシビリティ

- **キーボードナビゲーション**: 完全なキーボード操作対応
- **スクリーンリーダー**: ARIA属性による支援技術対応
- **カラーコントラスト**: WCAG 2.1 AA準拠のコントラスト比
- **フォーカス管理**: 明確なフォーカスインジケーター

---

## 🔐 セキュリティ

### 認証・認可
- **JWT トークン**: 安全なトークンベース認証
- **Row Level Security**: Supabase RLSによるデータ保護
- **CSRF 保護**: クロスサイトリクエストフォージェリ対策
- **XSS 対策**: クロスサイトスクリプティング防止

### データ保護
```sql
-- RLS ポリシー例
CREATE POLICY "Users can only see their own prompts"
ON prompts FOR SELECT
USING (auth.uid() = author_id);

CREATE POLICY "Users can only update their own prompts"
ON prompts FOR UPDATE
USING (auth.uid() = author_id);
```

### API セキュリティ
- **レート制限**: API呼び出し頻度制限
- **入力検証**: Zodスキーマによる厳密な検証
- **SQL インジェクション対策**: パラメータ化クエリ
- **暗号化**: 機密データの暗号化保存

---

## 📊 パフォーマンス

### 最適化戦略

```typescript
// 画像最適化
import Image from 'next/image';

<Image
  src="/prompt-thumbnail.jpg"
  alt="プロンプトサムネイル"
  width={300}
  height={200}
  priority
  placeholder="blur"
/>

// 動的インポート
const DynamicComponent = dynamic(
  () => import('../components/HeavyComponent'),
  { loading: () => <Skeleton /> }
);

// メモ化
const MemoizedPromptCard = memo(PromptCard);
```

### パフォーマンス指標
- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Lighthouse Score**: 90+ (Performance, Accessibility, Best Practices, SEO)
- **Bundle Size**: < 250KB (gzipped)
- **Time to Interactive**: < 3s

---

## 🚀 デプロイメント

### Vercel デプロイ

```bash
# Vercel CLI インストール
npm install -g vercel

# プロジェクトデプロイ
vercel

# 本番環境デプロイ
vercel --prod
```

### 環境別設定

```javascript
// next.config.js
module.exports = {
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  images: {
    domains: ['example.com'],
  },
  async redirects() {
    return [
      {
        source: '/old-path',
        destination: '/new-path',
        permanent: true,
      },
    ];
  },
};
```

### CI/CD パイプライン

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
```

---

## 🧪 テスト

### テスト戦略

```typescript
// Jest + React Testing Library
import { render, screen } from '@testing-library/react';
import { PromptCard } from '../components/PromptCard';

test('プロンプトカードが正しく表示される', () => {
  const mockPrompt = {
    id: '1',
    title: 'テストプロンプト',
    description: 'テスト説明',
    price: 1000
  };

  render(<PromptCard prompt={mockPrompt} />);
  
  expect(screen.getByText('テストプロンプト')).toBeInTheDocument();
  expect(screen.getByText('¥1,000')).toBeInTheDocument();
});
```

### テスト実行

```bash
# 単体テスト
npm run test

# カバレッジ付きテスト
npm run test:coverage

# E2Eテスト
npm run test:e2e

# 型チェック
npm run type-check
```

---

## 🤝 コントリビューション

### 開発フロー

1. **Issue作成**: バグ報告や機能要望
2. **Fork**: リポジトリをフォーク
3. **ブランチ作成**: `feature/new-feature` または `fix/bug-fix`
4. **開発**: コードの実装とテスト
5. **Pull Request**: 詳細な説明付きでPR作成
6. **レビュー**: コードレビューと修正
7. **マージ**: 承認後のマージ

### コーディング規約

```typescript
// ESLint + Prettier 設定
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "prefer-const": "error",
    "no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### コミットメッセージ

```bash
# 形式: type(scope): description
feat(auth): ソーシャルログイン機能を追加
fix(ui): プロンプトカードのレスポンシブ表示を修正
docs(readme): セットアップ手順を更新
style(components): コードフォーマットを統一
refactor(api): API エンドポイントを最適化
test(prompts): プロンプト作成のテストを追加
```

---

## 📞 サポート

### ヘルプ・サポート
- **📧 Email**: support@prompty.com
- **💬 Discord**: [Prompty Community](https://discord.gg/prompty)
- **📖 Documentation**: [docs.prompty.com](https://docs.prompty.com)
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/sekiguchimend/prompty/issues)

### よくある質問

<details>
<summary><strong>Q: 開発環境でStripe Webhookをテストするには？</strong></summary>

```bash
# Stripe CLI をインストール
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# テスト用のWebhookシークレットを取得
stripe listen --print-secret
```
</details>

<details>
<summary><strong>Q: データベースをリセットするには？</strong></summary>

```bash
# ローカルデータベースリセット
supabase db reset

# 本番環境は慎重に！
# マイグレーションファイルを確認してから実行
```
</details>

---

## 📄 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

```
MIT License

Copyright (c) 2024 Prompty Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**🌟 Promptyで、AIの可能性を最大限に引き出そう！ 🌟**

[⭐ Star this repo](https://github.com/sekiguchimend/prompty) | [🐛 Report Bug](https://github.com/sekiguchimend/prompty/issues) | [💡 Request Feature](https://github.com/sekiguchimend/prompty/issues)

Made with ❤️ by the Prompty Team

</div> 