# 📡 API リファレンス

Prompty APIの完全なリファレンスガイドです。すべてのエンドポイント、パラメータ、レスポンス形式を詳しく説明します。

## 📑 目次

1. [🔰 API概要](#-api概要)
2. [🔐 認証](#-認証)
3. [📊 共通仕様](#-共通仕様)
4. [👤 ユーザー管理API](#-ユーザー管理api)
5. [📝 プロンプト管理API](#-プロンプト管理api)
6. [🔍 検索API](#-検索api)
7. [❤️ インタラクションAPI](#-インタラクションapi)
8. [💬 コメントAPI](#-コメントapi)
9. [💳 決済API](#-決済api)
10. [🤖 AI生成API](#-ai生成api)
11. [🛠️ 管理者API](#-管理者api)
12. [📁 メディアAPI](#-メディアapi)

---

## 🔰 API概要

### ベースURL
```
本番環境: https://your-domain.com/api
開発環境: http://localhost:3000/api
```

### サポート形式
- **リクエスト**: JSON
- **レスポンス**: JSON
- **文字エンコーディング**: UTF-8

### HTTPメソッド
- `GET`: データ取得
- `POST`: データ作成
- `PUT`: データ更新
- `PATCH`: データ部分更新
- `DELETE`: データ削除

---

## 🔐 認証

### 認証方式
Prompty APIは **Bearer Token** 認証を使用します。

```http
Authorization: Bearer <your_jwt_token>
```

### トークン取得
```javascript
// Supabase認証経由でトークンを取得
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

### 権限レベル
- **public**: 認証不要
- **authenticated**: ログインユーザーのみ
- **owner**: リソース所有者のみ
- **admin**: 管理者のみ

---

## 📊 共通仕様

### レスポンス形式

#### 成功レスポンス
```json
{
  "success": true,
  "data": {
    // レスポンスデータ
  },
  "pagination": {  // ページング対応API のみ
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### エラーレスポンス
```json
{
  "success": false,
  "error": "エラーメッセージ",
  "code": "ERROR_CODE",
  "details": {
    // 詳細情報（開発環境のみ）
  }
}
```

### HTTPステータスコード
- `200`: 成功
- `201`: 作成成功
- `400`: 不正なリクエスト
- `401`: 認証エラー
- `403`: 権限エラー
- `404`: リソースが見つからない
- `429`: レート制限
- `500`: サーバーエラー

### ページング
```http
GET /api/prompts?page=1&limit=20
```

### ソート
```http
GET /api/prompts?sort_by=created_at&sort_order=desc
```

### フィルタリング
```http
GET /api/prompts?category=development&is_premium=true
```

---

## 👤 ユーザー管理API

### ユーザー情報取得
```http
GET /api/users/get-user
```

**権限**: authenticated

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "username": "john_doe",
    "display_name": "John Doe",
    "email": "john@example.com",
    "avatar_url": "https://example.com/avatar.jpg",
    "bio": "プロンプトエンジニア",
    "location": "Tokyo, Japan",
    "followers_count": 150,
    "following_count": 75,
    "posts_count": 25,
    "is_premium": false,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### プロフィール更新
```http
POST /api/users/update-profile
```

**権限**: authenticated

**リクエストボディ**:
```json
{
  "display_name": "新しい表示名",
  "bio": "新しい自己紹介",
  "location": "新しい場所",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**バリデーション**:
- `display_name`: 1-50文字
- `bio`: 最大500文字
- `location`: 最大100文字
- `avatar_url`: 有効なURL形式

### ユーザー検索
```http
GET /api/search?q={query}&type=users
```

**権限**: public

**パラメータ**:
- `q`: 検索クエリ（必須）
- `limit`: 結果数（デフォルト: 20、最大: 100）

---

## 📝 プロンプト管理API

### プロンプト一覧取得
```http
GET /api/prompts
```

**権限**: public

**パラメータ**:
- `page`: ページ番号（デフォルト: 1）
- `limit`: 件数（デフォルト: 20、最大: 100）
- `category`: カテゴリフィルタ
- `is_featured`: 注目プロンプトのみ
- `is_premium`: 有料プロンプトのみ
- `sort_by`: ソート項目（`created_at`, `view_count`, `like_count`）
- `sort_order`: ソート順（`asc`, `desc`）

**レスポンス**:
```json
{
  "success": true,
  "data": [
    {
      "id": "prompt-uuid",
      "title": "効果的なマーケティングプロンプト",
      "description": "商品売上を向上させるプロンプト集",
      "thumbnail_url": "https://example.com/thumb.jpg",
      "author": {
        "id": "user-uuid",
        "username": "john_doe",
        "display_name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg"
      },
      "category": {
        "id": "cat-uuid",
        "name": "マーケティング",
        "slug": "marketing"
      },
      "stats": {
        "view_count": 1250,
        "like_count": 89,
        "bookmark_count": 45,
        "comment_count": 12
      },
      "is_premium": true,
      "price": 500,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### プロンプト詳細取得
```http
GET /api/prompts/{id}
```

**権限**: public（有料コンテンツは購入者・作者のみ）

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "id": "prompt-uuid",
    "title": "効果的なマーケティングプロンプト",
    "description": "商品売上を向上させるプロンプト集",
    "content": "プロンプトの詳細内容...",
    "thumbnail_url": "https://example.com/thumb.jpg",
    "author": {
      "id": "user-uuid",
      "username": "john_doe",
      "display_name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg"
    },
    "category": {
      "id": "cat-uuid",
      "name": "マーケティング",
      "slug": "marketing"
    },
    "tags": ["marketing", "sales", "conversion"],
    "stats": {
      "view_count": 1250,
      "like_count": 89,
      "bookmark_count": 45,
      "comment_count": 12
    },
    "is_premium": true,
    "price": 500,
    "is_purchased": false,  // ログインユーザーのみ
    "is_liked": false,     // ログインユーザーのみ
    "is_bookmarked": false, // ログインユーザーのみ
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-02T00:00:00Z"
  }
}
```

### プロンプト作成
```http
POST /api/prompts/create
```

**権限**: authenticated

**リクエストボディ**:
```json
{
  "title": "新しいプロンプト",
  "description": "プロンプトの説明",
  "content": "プロンプトの詳細内容",
  "category_id": "category-uuid",
  "tags": ["tag1", "tag2"],
  "thumbnail_url": "https://example.com/thumb.jpg",
  "is_premium": false,
  "price": 0,
  "is_public": true
}
```

**バリデーション**:
- `title`: 3-200文字（必須）
- `description`: 10-1000文字
- `content`: 10-50000文字（必須）
- `price`: 0以上の整数
- `tags`: 最大10個、各タグ最大20文字

### プロンプト更新
```http
PUT /api/prompts/{id}
```

**権限**: owner または admin

### プロンプト削除
```http
DELETE /api/prompts/{id}
```

**権限**: owner または admin

---

## 🔍 検索API

### 統合検索
```http
GET /api/search
```

**権限**: public

**パラメータ**:
- `q`: 検索クエリ（必須、1-100文字）
- `type`: 検索対象（`prompts`, `users`, `all`）
- `category`: カテゴリフィルタ
- `page`: ページ番号
- `limit`: 件数（最大50）

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "prompts": [
      // プロンプト一覧
    ],
    "users": [
      // ユーザー一覧
    ],
    "total_count": 25,
    "query": "検索クエリ"
  }
}
```

### カテゴリ別検索
```http
GET /api/prompts/by-category
```

**パラメータ**:
- `category`: カテゴリスラッグ（必須）
- その他は通常の一覧取得と同様

---

## ❤️ インタラクションAPI

### いいね追加/削除
```http
POST /api/interactions/toggle
```

**権限**: authenticated

**リクエストボディ**:
```json
{
  "type": "like",  // "like" または "bookmark"
  "target_id": "prompt-uuid"
}
```

### いいね状態確認
```http
GET /api/interactions/check
```

**パラメータ**:
- `type`: `like` または `bookmark`
- `target_id`: 対象UUID

### ブックマーク一覧
```http
GET /api/interactions/list
```

**パラメータ**:
- `type`: `bookmark`
- `page`, `limit`: ページング

### フォロー/アンフォロー
```http
POST /api/interactions/follow
```

**リクエストボディ**:
```json
{
  "action": "follow",  // "follow" または "unfollow"
  "user_id": "target-user-uuid"
}
```

---

## 💬 コメントAPI

### コメント一覧取得
```http
GET /api/content/comments
```

**パラメータ**:
- `prompt_id`: プロンプトUUID（必須）
- `page`, `limit`: ページング

**レスポンス**:
```json
{
  "success": true,
  "data": [
    {
      "id": "comment-uuid",
      "content": "コメント内容",
      "author": {
        "id": "user-uuid",
        "username": "commenter",
        "display_name": "コメント者",
        "avatar_url": "https://example.com/avatar.jpg"
      },
      "parent_id": null,  // 返信の場合は親コメントID
      "replies": [
        // 返信一覧
      ],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### コメント作成
```http
POST /api/content/create
```

**権限**: authenticated

**リクエストボディ**:
```json
{
  "prompt_id": "prompt-uuid",
  "content": "コメント内容",
  "parent_id": "parent-comment-uuid"  // 返信の場合のみ
}
```

**バリデーション**:
- `content`: 1-1000文字（必須）

### コメント報告
```http
POST /api/content/report
```

**権限**: authenticated

**リクエストボディ**:
```json
{
  "target_type": "comment",  // "comment" または "prompt"
  "target_id": "comment-uuid",
  "reason": "inappropriate",  // 報告理由
  "details": "詳細な説明"
}
```

**報告理由**:
- `inappropriate`: 不適切なコンテンツ
- `spam`: スパム
- `harassment`: 嫌がらせ
- `misinformation`: 誤情報
- `other`: その他

---

## 💳 決済API

### 決済Intent作成
```http
POST /api/payments/create-payment-intent
```

**権限**: authenticated

**リクエストボディ**:
```json
{
  "prompt_id": "prompt-uuid",
  "amount": 500,
  "currency": "jpy"
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "client_secret": "pi_xxx_secret_xxx",
    "payment_intent_id": "pi_xxx",
    "amount": 500,
    "currency": "jpy"
  }
}
```

### 購入履歴
```http
GET /api/payments/history
```

**権限**: authenticated

### Webhook（Stripe）
```http
POST /api/payments/webhook
```

**権限**: Stripe署名検証

---

## 🤖 AI生成API

### コード生成
```http
POST /api/ai/generate/code
```

**権限**: authenticated

**リクエストボディ**:
```json
{
  "prompt": "Reactでボタンコンポーネントを作成して",
  "language": "ja",  // "ja" または "en"
  "model": "claude-3-5-sonnet"
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "files": {
      "index.html": "<!DOCTYPE html>..."
    },
    "description": "作成されたアプリの説明",
    "framework": "React",
    "language": "JavaScript",
    "styling": "CSS3",
    "usedModel": "claude-3-5-sonnet",
    "warnings": []
  }
}
```

### UI生成
```http
POST /api/ai/generate/ui
```

**リクエストボディ**:
```json
{
  "prompt": "ログインフォームを作成して",
  "style": "modern",  // "modern", "minimal", "colorful"
  "framework": "react"  // "react", "vue", "vanilla"
}
```

### コード改善
```http
POST /api/ai/generate/improve
```

**リクエストボディ**:
```json
{
  "code": "改善したいコード",
  "language": "javascript",
  "improvements": ["performance", "security", "readability"]
}
```

---

## 🛠️ 管理者API

### 管理者認証ヘッダー
```http
Authorization: Bearer <admin_jwt_token>
X-API-Key: <admin_api_key>
```

### コメント移行
```http
POST /api/admin/migrate-comments
```

**権限**: admin

**レート制限**: 1分間5回

### ユーザー統計
```http
GET /api/admin/stats/users
```

**権限**: admin

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "total_users": 1500,
    "active_users_7d": 350,
    "new_users_7d": 45,
    "premium_users": 125
  }
}
```

### コンテンツ統計
```http
GET /api/admin/stats/content
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "total_prompts": 3500,
    "published_prompts": 3200,
    "premium_prompts": 450,
    "total_views": 125000,
    "total_likes": 8500
  }
}
```

---

## 📁 メディアAPI

### 画像アップロード
```http
POST /api/media/upload-image
```

**権限**: authenticated

**リクエスト**: `multipart/form-data`
```
file: <image_file>
type: "avatar" | "thumbnail" | "content"
```

**制限**:
- ファイルサイズ: 5MB以下
- 形式: JPEG, PNG, GIF, WebP
- ディメンション: 最大4096x4096px

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.example.com/images/xxx.jpg",
    "filename": "uploaded_image.jpg",
    "size": 1024000,
    "width": 1920,
    "height": 1080
  }
}
```

### サムネイル生成
```http
POST /api/media/thumbnail-upload
```

**自動サムネイル生成**:
- 複数サイズ（150x150, 300x300, 600x600）
- WebP形式での最適化
- 自動画質調整

---

## 🔒 セキュリティ仕様

### レート制限

| エンドポイント | 制限 | ウィンドウ |
|---------------|------|-----------|
| 管理者API | 5回 | 1分 |
| 認証API | 10回 | 15分 |
| 検索API | 50回 | 1分 |
| 一般API | 100回 | 15分 |

### 入力検証
すべてのAPIエンドポイントで以下の検証を実施：
- SQLインジェクション対策
- XSS対策
- CSRF対策
- 入力サイズ制限

### エラーレスポンス
本番環境では内部情報を隠蔽：
```json
{
  "success": false,
  "error": "処理でエラーが発生しました",
  "code": "INTERNAL_ERROR"
}
```

---

## 📝 サンプルコード

### JavaScript/TypeScript

#### 基本的なAPI呼び出し
```typescript
const response = await fetch('/api/prompts', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
```

#### プロンプト作成
```typescript
const createPrompt = async (promptData: CreatePromptRequest) => {
  const response = await fetch('/api/prompts/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(promptData)
  });

  if (!response.ok) {
    throw new Error('プロンプト作成に失敗しました');
  }

  return response.json();
};
```

#### エラーハンドリング
```typescript
try {
  const data = await apiCall();
} catch (error) {
  if (error.status === 401) {
    // 認証エラー - ログイン画面にリダイレクト
    router.push('/login');
  } else if (error.status === 429) {
    // レート制限 - 待機してリトライ
    setTimeout(() => retry(), error.retryAfter * 1000);
  } else {
    // その他のエラー
    showErrorMessage(error.message);
  }
}
```

### cURL例

#### プロンプト一覧取得
```bash
curl -X GET "https://api.prompty.com/api/prompts?page=1&limit=10" \
  -H "Content-Type: application/json"
```

#### プロンプト作成
```bash
curl -X POST "https://api.prompty.com/api/prompts/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{
    "title": "新しいプロンプト",
    "description": "説明",
    "content": "プロンプト内容",
    "is_premium": false,
    "price": 0
  }'
```

---

## 🔄 バージョニング

現在のAPIバージョン: **v1**

### 変更履歴
- **v1.0.0** (2024-06-07): 初回リリース
  - 基本的なCRUD操作
  - 認証・認可システム
  - セキュリティ機能

### 下位互換性
- マイナーバージョンアップでは下位互換性を保証
- メジャーバージョンアップ時は6ヶ月の移行期間を提供

---

*最終更新: 2024年6月7日*
*API バージョン: v1.0.0*