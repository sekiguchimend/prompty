# Prompty - プロンプト共有・販売プラットフォーム

## 概要

Promptyは大規模言語モデル（LLM）を活用したプロンプト共有・販売プラットフォームです。ユーザーがプロンプトとその実行履歴を投稿・共有・販売できます。システムやアプリケーションの完成したUI画像（サムネイル）を表示し、実際のシステムへのリンクも提供します。

## システム構成

### 使用技術

- **フロントエンド基盤**: React（TypeScript）+ Vite
- **UIフレームワーク**: shadcn/ui + Tailwind CSS
- **状態管理**: React Query
- **ルーティング**: React Router
- **フォーム処理**: React Hook Form + Zod
- **アイコン**: Lucide React
- **その他**: date-fns, recharts (グラフ)

### アプリケーション構造

```
prompty/
├── public/           # 静的ファイル
├── src/
│   ├── components/   # 再利用可能なコンポーネント
│   ├── pages/        # ページコンポーネント
│   ├── data/         # データモック/サービス
│   ├── hooks/        # カスタムフック
│   ├── lib/          # ユーティリティ関数
│   ├── styles/       # スタイル関連
│   ├── App.tsx       # メインアプリコンポーネント
│   └── main.tsx      # エントリーポイント
└── [設定ファイル]     # 各種設定ファイル
```

## ページ構成と機能詳細

### メインページ

1. **ホームページ (`/`)** 
   - 機能: プロンプトの一覧表示、カテゴリタブ（すべて/フォロー中/注目/投稿企画）
   - 主要コンポーネント: `HomePage`, `PromptSection`, `PromptGrid`, `PromptCard`
   - 特徴: レスポンシブデザイン、カテゴリ別表示切替

2. **検索ページ (`/search`)** 
   - 機能: キーワード検索、検索結果表示
   - 主要コンポーネント: `Search`
   - 特徴: クエリパラメータによる検索、フィルタリング機能

3. **プロンプト詳細ページ (`/prompts/:id`)**
   - 機能: プロンプト詳細表示、実行結果表示、いいね、コメント
   - 主要コンポーネント: `PromptDetail`, `ArticleActionsMenu`
   - 特徴: 詳細情報表示、インタラクション機能

### ユーザー関連ページ

4. **ログイン (`/login`)** 
   - 機能: ユーザー認証
   - 主要コンポーネント: `Login`
   - 特徴: フォームバリデーション、エラーハンドリング

5. **会員登録 (`/register`)**
   - 機能: 新規ユーザー登録
   - 主要コンポーネント: `Register`
   - 特徴: 段階的な登録フロー、バリデーション

6. **パスワード忘れ (`/forgot-password`)**
   - 機能: パスワードリセット
   - 主要コンポーネント: `ForgotPassword`
   - 特徴: メール送信フロー

7. **マイ記事ページ (`/my-articles`)**
   - 機能: 自分の投稿管理、編集、削除
   - 主要コンポーネント: `MyArticles`, `myArticle/`配下のコンポーネント
   - 特徴: 投稿管理、統計表示

8. **設定ページ (`/settings`)**
   - 機能: ユーザー設定変更
   - 主要コンポーネント: `SettingsPage`, `settings/`配下のコンポーネント
   - 特徴: プロフィール編集、通知設定など

### コンテンツ作成・管理

9. **投稿作成ページ (`/create-post`)**
   - 機能: 新規プロンプト投稿作成
   - 主要コンポーネント: `CreatePost`, `create-post/`配下のコンポーネント
   - 特徴: リッチテキストエディタ、プレビュー機能

10. **ダッシュボード (`/dashboard`)**
    - 機能: クリエイター向け分析、統計表示
    - 主要コンポーネント: `DashboardPage`, `dashboard/`配下のコンポーネント
    - 特徴: データ可視化、パフォーマンス指標

11. **プレミアム (`/premium`)**
    - 機能: 有料プラン紹介、登録
    - 主要コンポーネント: `Premium`
    - 特徴: 料金表示、特典説明

### 特集・イベント

12. **コンテスト (`/contests`)**
    - 機能: 投稿企画・コンテスト表示
    - 主要コンポーネント: `ContestPage`
    - 特徴: コンテスト一覧、参加方法

13. **ハッシュタグページ (`/hashtag/:tag`)**
    - 機能: 特定タグの投稿表示
    - 主要コンポーネント: `HashtagPage`
    - 特徴: タグフィルタリング

### サポート・規約

14. **フィードバック (`/feedback`)**
    - 機能: ユーザーフィードバック送信
    - 主要コンポーネント: `Feedback`
    - 特徴: フォーム送信

15. **ヘルプセンター (`/help-center`)**
    - 機能: FAQ、サポート情報
    - 主要コンポーネント: `HelpCenter`, `help/`配下のコンポーネント
    - 特徴: カテゴリ別ヘルプ

16. **使い方ガイド (`/how-to-use`)**
    - 機能: プラットフォーム利用方法説明
    - 主要コンポーネント: `HowToUse` 
    - 特徴: ステップバイステップガイド

17. **各種規約ページ**
    - プライバシーポリシー (`/privacy`)
    - 利用規約 (`/terms`)
    - 特定商取引法に基づく表記 (`/commercial-transaction`)
    - 支払い開示 (`/payment-disclosure`)
    - ビジネス向け (`/business`)

18. **404ページ (`*`)**
    - 機能: 存在しないURLへのフォールバック
    - 主要コンポーネント: `NotFound`
    - 特徴: ユーザーフレンドリーなエラー表示

## 主要コンポーネント構造

### 共通UI要素

- **ヘッダー (`Header.tsx`)**
  - 検索バー、ナビゲーション、ユーザーメニュー
  - レスポンシブ対応（モバイル/デスクトップ表示切替）
  - 認証状態に応じた表示切替

- **フッター (`Footer.tsx`)**
  - サイト情報、リンク集
  - SNSアイコン

- **サイドバー (`Sidebar.tsx`)**
  - ナビゲーションリンク
  - カテゴリツリー
  - ダッシュボードやマイページでの補助ナビゲーション

### インタラクション要素

- **通知ドロップダウン (`NotificationDropdown.tsx`)**
  - 通知一覧表示
  - 既読/未読管理

- **ユーザーメニュー (`UserMenu.tsx`)**
  - プロフィール、設定へのリンク
  - ログアウト機能

- **プロンプトカード (`PromptCard.tsx`)**
  - プロンプト概要表示
  - サムネイル、タイトル、作者情報
  - いいね数、アクション

### ダッシュボード関連

- **ダッシュボードレイアウト (`DashboardLayout.tsx`)**
  - タブナビゲーション
  - コンテンツ表示領域
  - 統計グラフ

## レスポンシブデザイン

- モバイルファースト設計
- 画面サイズに応じた表示切替
- Tailwind CSSのブレークポイントを活用
- カスタムビューポート設定（`App.tsx`内の`ResponsiveLayout`）

## 開発環境構築と実行方法

### 必要条件

- Node.js（最新安定版推奨）
- npm または bun

### 環境構築手順

```sh
# リポジトリのクローン
git clone <リポジトリURL>

# プロジェクトディレクトリに移動
cd prompty

# 依存パッケージのインストール
npm install
# または
bun install

# 開発サーバーの起動
npm run dev
# または
bun run dev
```

開発サーバーは通常 http://localhost:5173 で起動します。

## デプロイ方法

静的ビルドを作成し、お好みのホスティングサービスにデプロイします。

```sh
# 本番用ビルドを作成
npm run build
# または
bun run build
```

## 貢献方法

プルリクエストやイシューを通じてプロジェクトに貢献できます。

## ライセンスと権利

プロジェクト固有のライセンス情報を参照してください。

## 新機能

### ログイン・会員登録の強化

- **Login/Register**: モバイル表示時の最適化 - フォーム表示位置を画面上部に調整し、すべての入力フィールドが見やすく
- **認証フロー**: ログイン済みユーザーへの自動リダイレクト機能

### プロンプト投稿機能の強化

- **匿名投稿制限**: 認証されたユーザーのみがプロンプトを投稿可能に変更
- **プロフィール設定**: ユーザー名の保存処理を改善 (`display_name` フィールド対応)

### UI/UX改善

- **PromptGrid**: プロンプトカードの高さを均一化し、タイトル長に関わらず一貫したレイアウトを実現
- **レスポンシブデザイン**: モバイル表示時の各種フォーム配置を最適化

### エラーハンドリング

- **エラー表示の改善**: より詳細なエラーメッセージとログ出力によるデバッグ性向上
- **API通信の安定化**: プロフィール更新時の通信エラー対策

## Stripe有料記事連携機能の設定方法

Stripeと連携した有料記事機能を使用するには、以下の手順でセットアップを行ってください。

### 1. 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定してください：

```
# Supabase 関連
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Supabaseダッシュボードから取得
SUPABASE_FUNC_URL=https://xxxxxxxxxxxx.supabase.co/functions/v1  # プロジェクト固有のURL

# Stripe 関連
STRIPE_SECRET_KEY=sk_test_...  # Stripeダッシュボードから取得
STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook設定時に取得
```

### 2. Supabase Edge Functionのデプロイ

Supabase Edge Functionをデプロイするには、Docker Desktopをインストールした上で以下のコマンドを実行します：

```bash
# Supabase CLIをインストール (初回のみ)
npm install -g supabase

# ログイン (初回のみ)
supabase login

# Edge Functionのデプロイ
npx supabase functions deploy handle_prompts_insert
```

### 3. Supabase Edge Functionの環境変数設定

Supabaseダッシュボードの「Functions」タブから、以下の環境変数を設定します：

```
STRIPE_SECRET_KEY=sk_test_...  # Stripeダッシュボードから取得
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co  # プロジェクトURL
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # サービスロールキー
```

### 4. テーブルスキーマの拡張とRLSポリシーの設定

Supabaseのクエリエディタで以下のSQLを実行します：

```sql
-- スキーマ拡張：Stripe 連携カラム
ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id   TEXT,
  ADD COLUMN IF NOT EXISTS stripe_error      TEXT;

-- RLS ポリシー：有料投稿は Stripe アカウント必須
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY prompts_insert_policy
  ON public.prompts
  FOR INSERT
  WITH CHECK (
    (
      is_free = TRUE
      OR price IS NULL
      OR price = 0
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.stripe_account_id IS NOT NULL
    )
  );
```

### 5. デプロイと動作確認

すべての設定が完了したら、アプリケーションを再デプロイし、以下の動作を確認します：

1. Stripeアカウントの連携（設定ページ）
2. 有料記事の投稿（価格設定あり）
3. 投稿後のStripe商品情報の生成確認
4. promptsテーブルのstripe_product_id, stripe_price_idフィールドに値が入っているか確認

エラーが発生した場合は、ブラウザのコンソールログとサーバーログを確認してください。
#   p r o m p t y 2  
 #   p r o m p t y 2  
 