# 🚀 Prompty - 初心者完全ガイド

Promptyへようこそ！このガイドでは、プログラミング初心者でも簡単にPromptyアプリケーションを理解し、開発・運用できるよう詳しく説明します。

## 📖 目次

1. [🔰 はじめに](#-はじめに)
2. [🏗️ プロジェクト構成](#-プロジェクト構成)
3. [⚙️ 環境設定](#-環境設定)
4. [🚀 クイックスタート](#-クイックスタート)
5. [📚 基本概念](#-基本概念)
6. [🔧 開発方法](#-開発方法)
7. [🛡️ セキュリティ](#-セキュリティ)
8. [🚢 デプロイ方法](#-デプロイ方法)
9. [❓ トラブルシューティング](#-トラブルシューティング)
10. [📞 サポート](#-サポート)

---

## 🔰 はじめに

### Promptyとは？

Promptyは、AIプロンプトを共有・売買できる次世代プラットフォームです。

**主な機能：**
- 💡 プロンプトの作成・投稿
- 🛒 プロンプトの購入・販売
- 👥 ユーザーフォロー・コミュニティ
- 🤖 AI生成コード機能
- 💳 Stripe決済システム

### 必要な知識レベル

- **初心者レベル**: このガイドで十分です
- **必要なスキル**: コピー&ペーストができれば大丈夫！
- **推奨知識**: 基本的なウェブの仕組み（知らなくても問題なし）

---

## 🏗️ プロジェクト構成

### フォルダ構造の説明

```
prompty/
├── 📁 src/                    # メインのソースコード
│   ├── 📁 components/         # 見た目のパーツ
│   │   ├── 📁 features/       # 機能別のパーツ
│   │   ├── 📁 shared/         # 共通パーツ
│   │   ├── 📁 layout/         # レイアウト
│   │   └── 📁 ui/             # 基本パーツ
│   ├── 📁 pages/              # ページ
│   │   ├── 📁 api/            # API（データ処理）
│   │   └── *.tsx              # 各ページファイル
│   ├── 📁 lib/                # 便利な機能
│   │   ├── 📁 clients/        # 外部サービス接続
│   │   ├── 📁 services/       # ビジネスロジック
│   │   ├── 📁 repositories/   # データベース操作
│   │   └── 📁 security/       # セキュリティ機能
│   └── 📁 types/              # データの型定義
├── 📁 public/                 # 画像やファイル
├── 📁 docs/                   # ドキュメント（このファイルも含む）
└── 📄 package.json            # プロジェクト設定
```

### 各フォルダの役割

| フォルダ | 役割 | 例 |
|----------|------|-----|
| `components/features/` | 機能別のUI部品 | ログイン画面、プロンプト一覧 |
| `pages/api/` | サーバー側の処理 | データ保存、決済処理 |
| `lib/services/` | ビジネスロジック | プロンプト作成、ユーザー管理 |
| `lib/security/` | セキュリティ機能 | 認証、入力検証 |

---

## ⚙️ 環境設定

### 1. 必要なツール

以下のツールをインストールしてください：

#### Node.js のインストール
```bash
# 1. Node.js公式サイトからダウンロード
# https://nodejs.org/ → LTSバージョンを選択

# 2. インストール確認
node --version  # v18.0.0 以上であることを確認
npm --version   # v8.0.0 以上であることを確認
```

#### Git のインストール
```bash
# 1. Git公式サイトからダウンロード
# https://git-scm.com/

# 2. インストール確認
git --version
```

### 2. 環境変数の設定

プロジェクトのルートディレクトリに `.env.local` ファイルを作成：

```env
# データベース (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI API (Claude)
CLAUDE_API_KEY=your_claude_api_key

# 決済 (Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# セキュリティ
CSRF_SECRET=your_csrf_secret
ADMIN_API_KEY=your_admin_api_key
JWT_SECRET=your_jwt_secret

# 次のステップで取得方法を説明します
```

### 3. 外部サービスの設定

#### 🗄️ Supabase（データベース）の設定

1. **アカウント作成**
   ```
   1. https://supabase.com にアクセス
   2. 「Start your project」をクリック
   3. GitHubアカウントでサインアップ
   ```

2. **プロジェクト作成**
   ```
   1. 「New project」をクリック
   2. プロジェクト名: prompty
   3. データベースパスワードを設定
   4. リージョン: Northeast Asia (Tokyo)
   ```

3. **環境変数取得**
   ```
   1. プロジェクトダッシュボードで「Settings」→「API」
   2. URL をコピー → NEXT_PUBLIC_SUPABASE_URL
   3. anon public をコピー → NEXT_PUBLIC_SUPABASE_ANON_KEY  
   4. service_role をコピー → SUPABASE_SERVICE_ROLE_KEY
   ```

#### 🤖 Claude API の設定

1. **アカウント作成**
   ```
   1. https://console.anthropic.com にアクセス
   2. アカウント作成・ログイン
   ```

2. **APIキー取得**
   ```
   1. 「API Keys」セクション
   2. 「Create Key」をクリック
   3. 生成されたキーをコピー → CLAUDE_API_KEY
   ```

#### 💳 Stripe（決済）の設定

1. **アカウント作成**
   ```
   1. https://stripe.com にアクセス
   2. アカウント作成
   ```

2. **APIキー取得**
   ```
   1. ダッシュボードで「Developers」→「API keys」
   2. Publishable key をコピー → NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   3. Secret key をコピー → STRIPE_SECRET_KEY
   ```

---

## 🚀 クイックスタート

### 1. プロジェクトのダウンロード

```bash
# 1. プロジェクトをクローン
git clone <your-repository-url>
cd prompty

# 2. 依存関係をインストール
npm install

# 3. 環境変数ファイルを作成
cp .env.example .env.local
# .env.local を編集して上記の環境変数を設定
```

### 2. データベースの設定

```bash
# 1. Supabaseプロジェクトに接続
npx supabase login

# 2. テーブル作成（初回のみ）
npx supabase db push
```

### 3. 開発サーバー起動

```bash
# 開発サーバーを起動
npm run dev

# ブラウザで http://localhost:3000 を開く
```

### 4. 初回セットアップ確認

ブラウザでアクセスして以下を確認：

1. ✅ ページが正常に表示される
2. ✅ ユーザー登録ができる
3. ✅ ログイン・ログアウトができる
4. ✅ プロンプト投稿ができる

---

## 📚 基本概念

### アーキテクチャの理解

Promptyは以下の層で構成されています：

```
┌─────────────────┐
│   フロントエンド   │ ← ユーザーが見る画面
│   (React/Next.js) │
├─────────────────┤
│     API層        │ ← データ処理・ビジネスロジック
│  (Next.js API)   │
├─────────────────┤
│   サービス層      │ ← 機能の実装
│  (Services)      │
├─────────────────┤
│  リポジトリ層     │ ← データベース操作
│ (Repositories)   │
├─────────────────┤
│  データベース     │ ← データ保存
│  (Supabase)      │
└─────────────────┘
```

### 主要機能の流れ

#### 🔐 ユーザー認証
```
1. ユーザーがログイン画面で情報入力
2. フロントエンド → API → Supabase認証
3. 成功時にJWTトークンを取得
4. 以降のリクエストでトークンを使用
```

#### 📝 プロンプト投稿
```
1. ユーザーがプロンプト作成画面で入力
2. フロントエンド → API → 入力検証
3. データベースに保存
4. 投稿完了画面を表示
```

#### 💰 決済処理
```
1. ユーザーが購入ボタンをクリック
2. Stripe決済画面を表示
3. 決済成功 → Webhook → データベース更新
4. ユーザーにコンテンツへのアクセス権付与
```

---

## 🔧 開発方法

### 新機能を追加する手順

#### 1. 画面を追加する場合

```bash
# 1. 新しいページファイルを作成
touch src/pages/new-feature.tsx

# 2. 基本的なページ構造を追加
```

```tsx
// src/pages/new-feature.tsx
import React from 'react';
import { Header } from '../components/layout/Header';

export default function NewFeaturePage() {
  return (
    <div>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">新機能</h1>
        <p>ここに新機能の内容を追加</p>
      </main>
    </div>
  );
}
```

#### 2. API機能を追加する場合

```bash
# 1. APIエンドポイントを作成
touch src/pages/api/new-feature.ts

# 2. 基本的なAPI構造を追加
```

```typescript
// src/pages/api/new-feature.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withSecurityHeaders } from '../../lib/security/security-headers';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ここに機能を実装
    const result = { message: '成功' };
    
    res.status(200).json(result);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withSecurityHeaders()(handler);
```

#### 3. コンポーネントを追加する場合

```bash
# 1. 機能別フォルダにコンポーネントを作成
mkdir -p src/components/features/new-feature
touch src/components/features/new-feature/NewFeatureComponent.tsx
```

```tsx
// src/components/features/new-feature/NewFeatureComponent.tsx
import React from 'react';

interface NewFeatureProps {
  title: string;
  description?: string;
}

export const NewFeatureComponent: React.FC<NewFeatureProps> = ({
  title,
  description
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      {description && (
        <p className="text-gray-600">{description}</p>
      )}
    </div>
  );
};
```

### よく使うコマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# コードフォーマット
npm run lint

# 型チェック
npm run type-check

# データベーススキーマ更新
npx supabase db push

# 依存関係の更新
npm update
```

---

## 🛡️ セキュリティ

### 組み込み済みセキュリティ機能

Promptyには以下のセキュリティ機能が既に実装されています：

#### 🔒 入力検証・サニタイゼーション
```typescript
// 自動的に危険な入力をブロック
const safeInput = sanitizeString(userInput);
```

#### 🚦 レート制限
```typescript
// API呼び出し回数制限
// 管理者API: 1分間5回
// 一般API: 15分間100回
```

#### 🛡️ CSRF保護
```typescript
// 偽装リクエストを防止
export default withCSRFProtection(handler);
```

#### 🔐 SQLインジェクション対策
```typescript
// パラメータ化クエリで安全にデータベースアクセス
const result = await secureDB.searchPrompts(sanitizedQuery);
```

### セキュリティ チェックリスト

新機能を追加する際は以下を確認してください：

- [ ] ユーザー入力の検証を行っている
- [ ] 認証が必要な機能に認証チェックがある
- [ ] 管理者機能に適切な権限チェックがある
- [ ] データベースクエリがパラメータ化されている
- [ ] エラーメッセージに内部情報が含まれていない

---

## 🚢 デプロイ方法

### Vercelへのデプロイ（推奨）

#### 1. アカウント準備
```
1. https://vercel.com にアクセス
2. GitHubアカウントでサインアップ
3. プロジェクトをGitHubにプッシュ
```

#### 2. プロジェクトインポート
```
1. Vercelダッシュボードで「Import Project」
2. GitHubリポジトリを選択
3. プロジェクト名を設定
```

#### 3. 環境変数設定
```
1. Project Settings → Environment Variables
2. .env.local の内容をすべて追加
3. Production, Preview, Development すべてにチェック
```

#### 4. デプロイ実行
```
1. 「Deploy」ボタンをクリック
2. 自動的にビルド・デプロイが実行
3. 完了後、URLが発行される
```

### その他のデプロイ先

#### Netlify
```bash
# 1. ビルド
npm run build

# 2. out フォルダをNetlifyにアップロード
```

#### 自サーバー
```bash
# 1. サーバーでプロジェクトをクローン
git clone <your-repo>
cd prompty

# 2. 依存関係インストール
npm ci

# 3. 環境変数設定
cp .env.example .env.local
# .env.local を編集

# 4. ビルド・起動
npm run build
npm start
```

---

## ❓ トラブルシューティング

### よくある問題と解決方法

#### 🔧 開発サーバーが起動しない

**症状**: `npm run dev` でエラーが発生
```bash
Error: Cannot find module 'next'
```

**解決方法**:
```bash
# 1. node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install

# 2. Node.js バージョン確認
node --version  # v18.0.0 以上必要

# 3. キャッシュクリア
npm cache clean --force
```

#### 🔐 認証エラー

**症状**: ログインできない、401エラー
```
Authentication failed
```

**解決方法**:
```bash
# 1. 環境変数確認
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# 2. Supabaseプロジェクト確認
# ダッシュボードでプロジェクトが稼働中か確認

# 3. APIキーの更新
# Settings → API でキーを再生成
```

#### 💳 決済エラー

**症状**: Stripe決済が動作しない
```
Payment processing failed
```

**解決方法**:
```bash
# 1. Stripeキー確認
echo $STRIPE_SECRET_KEY
echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# 2. Webhookエンドポイント確認
# Stripe Dashboard → Webhooks
# https://your-domain.com/api/stripe/webhook が設定されているか

# 3. テストモード確認
# 本番環境では本番キー、開発環境ではテストキーを使用
```

#### 📊 データベースエラー

**症状**: データが保存されない、取得できない
```
Database connection failed
```

**解決方法**:
```bash
# 1. Supabase接続確認
npx supabase status

# 2. テーブル作成確認
npx supabase db push

# 3. RLSポリシー確認
# Supabase Dashboard → Authentication → Policies
# 適切なポリシーが設定されているか確認
```

### ログの確認方法

#### 開発環境
```bash
# 1. ブラウザの開発者ツール
# F12 → Console タブでエラー確認

# 2. サーバーログ
# ターミナルでnpm run dev実行中のログを確認

# 3. ネットワークタブ
# F12 → Network タブでAPI通信を確認
```

#### 本番環境
```bash
# 1. Vercelの場合
# Vercel Dashboard → Functions → Logs

# 2. サーバーの場合
tail -f /var/log/prompty.log

# 3. Supabase
# Supabase Dashboard → Logs
```

---

## 📞 サポート

### 🆘 困ったときの連絡先

#### コミュニティサポート
- **GitHub Issues**: バグ報告・機能要望
- **Discord**: リアルタイムサポート
- **フォーラム**: 質問・議論

#### ドキュメント
- **API リファレンス**: `/docs/api-reference.md`
- **コンポーネント一覧**: `/docs/components.md`
- **デプロイガイド**: `/docs/deployment.md`

#### 緊急時の連絡先
- **セキュリティ問題**: security@prompty.com
- **システム障害**: support@prompty.com

### 🔗 関連リンク

- [Next.js 公式ドキュメント](https://nextjs.org/docs)
- [Supabase 公式ドキュメント](https://supabase.com/docs)
- [Stripe 公式ドキュメント](https://stripe.com/docs)
- [React 公式ドキュメント](https://react.dev/)

---

## 🎉 おつかれさまでした！

このガイドでPromptyの基本的な使い方から高度な開発まで学習できました。

### 次のステップ

1. **基本機能を試してみる**
   - ユーザー登録・ログイン
   - プロンプト投稿
   - 決済テスト

2. **カスタマイズする**
   - UI の調整
   - 新機能の追加
   - デザインの変更

3. **本番環境へデプロイ**
   - 環境変数の設定
   - ドメインの設定
   - SSL証明書の設定

4. **運用・保守**
   - ログの監視
   - セキュリティアップデート
   - パフォーマンス最適化

**質問や困ったことがあれば、いつでもサポートにお気軽にご連絡ください！** 🚀

---

*最終更新: 2024年6月7日*
*バージョン: 1.0.0*