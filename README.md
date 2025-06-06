# Prompty - AI搭載プロンプト共有プラットフォーム

エンタープライズグレードのセキュリティ機能を備えた、AIプロンプトの共有と収益化のための安全で本格的なNext.jsアプリケーション。

## 🔒 セキュリティ機能

### ✅ 包括的なセキュリティ実装
- **認証・認可**: JWT ベースの認証とロールベースアクセス制御
- **入力検証**: すべての API エンドポイントに対する Zod スキーマ検証
- **レート制限**: IP ベースの追跡による高度なレート制限
- **ファイルアップロードセキュリティ**: ウイルススキャン、タイプ検証、安全なストレージ
- **SQL インジェクション防止**: パラメータ化クエリと入力サニタイゼーション
- **XSS 保護**: コンテンツセキュリティポリシーと HTML サニタイゼーション
- **CSRF 保護**: トークンベースの CSRF 保護
- **セキュリティヘッダー**: 包括的なセキュリティヘッダー実装
- **エラーハンドリング**: 情報漏洩のない安全なエラーレスポンス
- **監査ログ**: セキュリティイベントのログ記録と監視

### 🛡️ 本番環境セキュリティ標準
- **HTTPS 強制**: HTTP から HTTPS への自動リダイレクト
- **コンテンツセキュリティポリシー**: インジェクション攻撃を防ぐ厳格な CSP
- **CORS 設定**: 本番環境での制限されたオリジン
- **環境検証**: 起動時に必要なセキュリティ変数をチェック
- **依存関係セキュリティ**: 定期的なセキュリティ監査とアップデート
- **秘密管理**: 適切な環境変数の取り扱い

## 🚀 クイックスタート

### 前提条件
- Node.js 18+ 
- npm または yarn
- Supabase アカウント
- Stripe アカウント（決済用）
- Google AI API キー（Gemini 用）

### インストール

1. **リポジトリのクローン**
```bash
git clone https://github.com/your-repo/prompty.git
cd prompty
```

2. **依存関係のインストール**
```bash
npm install
```

3. **環境設定**
```bash
# 環境テンプレートをコピー
cp .env.example .env

# 環境変数を設定
# 完全なリストは PRODUCTION_DEPLOYMENT.md を参照
```

4. **データベース設定**
```bash
# Supabase の初期化
npx supabase init
npx supabase start
npx supabase db push
```

5. **開発サーバー**
```bash
# 開発サーバーを開始
npm run dev

# Gemini サーバーと一緒に開始
npm run dev:with-gemini
```

## 📁 プロジェクト構造

```
prompty/
├── src/
│   ├── components/          # React コンポーネント
│   ├── pages/              # Next.js ページと API ルート
│   │   └── api/            # API エンドポイント
│   │       ├── auth/       # 認証エンドポイント
│   │       ├── stripe/     # 決済処理
│   │       └── upload-image-secure.ts  # 安全なファイルアップロード
│   ├── lib/                # ユーティリティライブラリ
│   │   ├── security/       # セキュリティモジュール
│   │   │   ├── auth-middleware.ts     # 認証ミドルウェア
│   │   │   ├── rate-limiter.ts        # レート制限
│   │   │   ├── validation.ts          # 入力検証
│   │   │   ├── error-handler.ts       # エラーハンドリング
│   │   │   └── config.ts              # セキュリティ設定
│   │   └── supabase/       # データベースクライアント
│   │       ├── client-secure.ts       # セキュアクライアント
│   │       └── admin-secure.ts        # セキュア管理者クライアント
│   ├── styles/             # CSS スタイル
│   └── types/              # TypeScript 型
├── supabase/               # データベースマイグレーションと関数
├── SECURITY.md             # セキュリティドキュメント
├── PRODUCTION_DEPLOYMENT.md # デプロイメントガイド
└── next.config.js          # セキュリティ機能付き Next.js 設定
```

## 🔧 設定

### 環境変数

#### 本番環境で必須
```bash
# アプリケーション
NODE_ENV=production
NEXT_PUBLIC_URL=https://your-domain.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# セキュリティ
JWT_SECRET=your_32_character_secret
ENCRYPTION_KEY=your_32_character_key
```

#### オプションのセキュリティ設定
```bash
# レート制限
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# ファイルアップロード
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif
VIRUS_SCAN_ENABLED=true

# 監視
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn
```

### セキュリティ設定

アプリケーションは `src/lib/security/config.ts` に包括的なセキュリティ設定を含んでいます：

- **レート制限**: エンドポイントタイプごとの異なる制限
- **ファイルアップロードセキュリティ**: タイプ検証、サイズ制限、ウイルススキャン
- **CORS**: 本番環境での制限されたオリジン
- **CSP**: 厳格なコンテンツセキュリティポリシー
- **ヘッダー**: すべてのレスポンスに対するセキュリティヘッダー

## 🛠️ 開発

### 利用可能なスクリプト

```bash
# 開発
npm run dev                 # 開発サーバーを開始
npm run dev:gemini         # Gemini AI サーバーを開始
npm run dev:with-gemini    # 両方のサーバーを開始

# 本番
npm run build              # 本番用ビルド
npm run start              # 本番サーバーを開始
npm run start:with-gemini  # Gemini と一緒に本番開始

# ユーティリティ
npm run lint               # ESLint を実行
npm run type-check         # TypeScript チェックを実行
```

### セキュリティ開発ガイドライン

1. **入力検証**: Zod スキーマを使用して常に入力を検証
2. **認証**: 保護されたルートには提供された認証ミドルウェアを使用
3. **レート制限**: 新しいエンドポイントに適切なレート制限を適用
4. **エラーハンドリング**: 情報を漏洩しない安全なエラーハンドラーを使用
5. **ファイルアップロード**: 検証付きの安全なアップロードハンドラーを使用
6. **データベースアクセス**: 提供されたセキュアなデータベースクライアントを使用

### 新しい API エンドポイントの追加

```typescript
// セキュアな API エンドポイントの例
import { withAuth } from '../../lib/security/auth-middleware';
import { withRateLimit, generalRateLimit } from '../../lib/security/rate-limiter';
import { withErrorHandler } from '../../lib/security/error-handler';
import { validateRequest, yourSchema } from '../../lib/security/validation';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  // 入力検証
  const validatedData = validateRequest(yourSchema, req.body);
  
  // あなたのロジックをここに
  
  res.status(200).json({ success: true });
};

export default withRateLimit(
  generalRateLimit,
  withAuth({ requireAuth: true }, withErrorHandler(handler))
);
```

## 🚀 デプロイメント

### 本番環境デプロイメント

包括的なデプロイメント手順については [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) を参照してください。

#### クイックデプロイチェックリスト
- [ ] 環境変数が設定済み
- [ ] SSL 証明書がインストール済み
- [ ] セキュリティヘッダーが有効
- [ ] レート制限が設定済み
- [ ] データベースマイグレーションが適用済み
- [ ] 監視がセットアップ済み
- [ ] バックアップ手順が確立済み

### サポートされているプラットフォーム
- **Vercel**: Next.js アプリケーションに推奨
- **Netlify**: フルスタックデプロイメントサポート
- **AWS**: EC2、ECS、または Lambda デプロイメント
- **Google Cloud**: App Engine または Compute Engine
- **DigitalOcean**: App Platform または Droplets

## 📊 監視とアナリティクス

### セキュリティ監視
- 認証失敗
- レート制限違反
- 疑わしいファイルアップロード
- API エラー率
- データベースクエリパフォーマンス

### パフォーマンス監視
- ページ読み込み時間
- API レスポンス時間
- メモリ使用量
- CPU 使用率
- データベースパフォーマンス

## 🔍 セキュリティ監査

### 定期的なセキュリティタスク
- **週次**: セキュリティログと認証失敗の確認
- **月次**: 依存関係の更新とアクセス権限の確認
- **四半期**: セキュリティ評価とペネトレーションテストの実施

### セキュリティテスト
```bash
# セキュリティ監査を実行
npm audit

# 脆弱性をチェック
npm audit fix

# セキュリティ問題のためのバンドル分析
npm run build && npm run analyze
```

## 🤝 貢献

### 貢献者向けセキュリティガイドライン
1. セキュアコーディング慣行に従う
2. すべての入力を検証する
3. 提供されたセキュリティミドルウェアを使用する
4. ログに機密情報を公開しない
5. セキュリティ機能を徹底的にテストする
6. セキュリティドキュメントを更新する

### プルリクエスト要件
- [ ] セキュリティレビューが完了
- [ ] 入力検証が実装済み
- [ ] エラーハンドリングが安全なパターンに従う
- [ ] テストにセキュリティシナリオを含む
- [ ] ドキュメントが更新済み

## 📚 ドキュメント

- [セキュリティ実装](./SECURITY.md) - 包括的なセキュリティドキュメント
- [本番環境デプロイメント](./PRODUCTION_DEPLOYMENT.md) - デプロイメントガイド
- [API ドキュメント](./docs/API.md) - API エンドポイントドキュメント
- [データベーススキーマ](./docs/DATABASE.md) - データベース構造と関係

## 🆘 サポートとセキュリティ

### セキュリティ問題
セキュリティ脆弱性については、以下にメールしてください: security@prompty-ai.com

セキュリティ脆弱性について公開 issue を**作成しないでください**。

### 一般的なサポート
- GitHub で issue を作成
- 既存のドキュメントを確認
- セキュリティガイドラインを確認

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下でライセンスされています - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🙏 謝辞

- **Next.js** - React フレームワーク
- **Supabase** - Backend as a Service
- **Stripe** - 決済処理
- **Zod** - スキーマ検証
- **Radix UI** - UI コンポーネント
- **Tailwind CSS** - スタイリングフレームワーク

---

## 🔐 セキュリティ通知

このアプリケーションは以下を含むエンタープライズグレードのセキュリティ機能を実装しています：
- 入力検証とサニタイゼーション
- 認証と認可
- レート制限と DDoS 保護
- 安全なファイルアップロード処理
- SQL インジェクション防止
- XSS 保護
- CSRF 保護
- セキュリティヘッダーと CSP
- 監査ログと監視

本番環境デプロイメントでは、デプロイメントガイドに従ってすべてのセキュリティ設定が適切にセットアップされていることを確認してください。