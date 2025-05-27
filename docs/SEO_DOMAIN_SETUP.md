# SEO ドメイン設定ガイド

## 概要
Promptyプラットフォームでは、www有り/無しの両方のドメインに対応できるよう、動的なURL生成システムを実装しています。

## 環境変数設定

### .env.local ファイルの作成
プロジェクトルートに `.env.local` ファイルを作成し、以下の環境変数を設定してください：

```bash
# www無しの場合（デフォルト）
NEXT_PUBLIC_BASE_DOMAIN=prompty-ai.com
NEXT_PUBLIC_PROTOCOL=https

# www有りの場合
# NEXT_PUBLIC_BASE_DOMAIN=www.prompty-ai.com
# NEXT_PUBLIC_PROTOCOL=https
```

## 設定例

### 本番環境（www無し）
```bash
NEXT_PUBLIC_BASE_DOMAIN=prompty-ai.com
NEXT_PUBLIC_PROTOCOL=https
```

### 本番環境（www有り）
```bash
NEXT_PUBLIC_BASE_DOMAIN=www.prompty-ai.com
NEXT_PUBLIC_PROTOCOL=https
```

### 開発環境
```bash
NEXT_PUBLIC_BASE_DOMAIN=localhost:3000
NEXT_PUBLIC_PROTOCOL=http
```

### ステージング環境
```bash
NEXT_PUBLIC_BASE_DOMAIN=staging.prompty-ai.com
NEXT_PUBLIC_PROTOCOL=https
```

## 使用方法

### ヘルパー関数の使用
```typescript
import { generateSiteUrl, getDefaultOgImageUrl } from '../utils/seo-helpers';

// URL生成
const homeUrl = generateSiteUrl('/');
const userUrl = generateSiteUrl('/users/123');

// 画像URL生成
const logoUrl = getDefaultOgImageUrl();
```

### SEOメタデータの生成
```typescript
import { generateSEOMetadata } from '../utils/seo-helpers';

const seoData = generateSEOMetadata({
  title: 'カスタムタイトル',
  description: 'カスタム説明文',
  path: '/custom-page',
  imageUrl: 'https://example.com/custom-image.jpg'
});
```

## 自動生成されるURL例

### www無しの場合
- ホーム: `https://prompty-ai.com/`
- 検索: `https://prompty-ai.com/search`
- ユーザー: `https://prompty-ai.com/users/123`
- 画像: `https://prompty-ai.com/images/prompty_logo.jpg`

### www有りの場合
- ホーム: `https://www.prompty-ai.com/`
- 検索: `https://www.prompty-ai.com/search`
- ユーザー: `https://www.prompty-ai.com/users/123`
- 画像: `https://www.prompty-ai.com/images/prompty_logo.jpg`

## 注意事項

1. **環境変数の優先順位**
   - `.env.local` > `.env.production` > `.env` > デフォルト値

2. **デプロイ時の設定**
   - Vercel: 環境変数をダッシュボードで設定
   - Netlify: サイト設定の環境変数で設定
   - その他: 各プラットフォームの環境変数設定方法に従う

3. **SEO影響**
   - 全URLが統一されるため、SEOに悪影響なし
   - canonical URLも自動で正しく設定される
   - Open Graph、Twitter Cardsも自動対応

## トラブルシューティング

### 画像が表示されない場合
1. 画像ファイル `prompty_logo.jpg` が `public/images/` に存在するか確認
2. 環境変数が正しく設定されているか確認
3. ブラウザのキャッシュをクリア

### URLが正しく生成されない場合
1. 環境変数の設定を確認
2. Next.jsアプリケーションを再起動
3. ビルドキャッシュをクリア: `npm run build`

## 関連ファイル

- `src/utils/seo-helpers.ts` - SEOヘルパー関数
- `src/pages/index.tsx` - ホームページ実装例
- `SEO_IMPLEMENTATION_SUMMARY.txt` - SEO実装の詳細 