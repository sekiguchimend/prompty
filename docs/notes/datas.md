# Prompty データベース設計書

## プロジェクト概要

- **プロジェクト名**: prompty
- **プロジェクトID**: qrxrulntwojimhhhnwqk
- **組織ID**: vrjsciesfdmlnopcwwjb
- **リージョン**: ap-northeast-1 (東日本)
- **ステータス**: ACTIVE_HEALTHY
- **PostgreSQLバージョン**: 15.8.1.070
- **作成日**: 2025-04-15T07:54:55.274711Z

## データベース構造

### メインエンティティ

#### 1. profiles (ユーザープロフィール)
プラットフォームのユーザー情報を管理するメインテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | - | PRIMARY KEY, FOREIGN KEY (auth.users) | ユーザーID |
| username | varchar | NO | - | UNIQUE, CHECK (length >= 3) | ユーザー名 |
| display_name | varchar | YES | - | - | 表示名 |
| email | varchar | NO | - | UNIQUE | メールアドレス |
| bio | text | YES | - | - | プロフィール |
| avatar_url | text | YES | - | - | アバター画像URL |
| banner_url | text | YES | - | - | バナー画像URL |
| website | varchar | YES | - | - | ウェブサイトURL |
| github | varchar | YES | - | - | GitHub URL |
| location | varchar | YES | - | - | 場所 |
| is_premium | boolean | YES | false | - | プレミアムユーザーフラグ |
| premium_until | timestamptz | YES | - | - | プレミアム期限 |
| is_business | boolean | YES | false | - | ビジネスアカウントフラグ |
| stripe_account_id | text | YES | - | - | StripeアカウントID |
| status | text | YES | - | - | ユーザーステータス |
| created_at | timestamptz | NO | now() | - | 作成日時 |
| updated_at | timestamptz | NO | now() | - | 更新日時 |

#### 2. prompts (プロンプト)
投稿されたプロンプトを管理するメインテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | プロンプトID |
| author_id | uuid | NO | - | FOREIGN KEY (profiles) | 作成者ID |
| title | varchar | NO | - | CHECK (length >= 5) | タイトル |
| description | text | YES | - | - | 説明 |
| content | text | NO | - | CHECK (length >= 10) | プロンプト内容 |
| thumbnail_url | text | YES | - | - | サムネイル画像URL |
| category_id | uuid | YES | - | FOREIGN KEY (categories) | カテゴリID |
| price | numeric | YES | 0 | - | 価格 |
| is_free | boolean | YES | true | - | 無料フラグ |
| is_featured | boolean | YES | false | - | フィーチャーフラグ |
| is_premium | boolean | YES | false | - | プレミアムフラグ |
| published | boolean | YES | true | - | 公開フラグ |
| view_count | integer | YES | 0 | - | 閲覧数 |
| like_count | smallint | YES | 0 | - | いいね数 |
| site_url | text | YES | - | - | サイトURL |
| prompt_title | text | YES | - | - | プロンプトタイトル |
| prompt_content | text | YES | - | - | プロンプト詳細内容 |
| stripe_product_id | text | YES | - | - | Stripe製品ID |
| stripe_price_id | text | YES | - | - | Stripe価格ID |
| stripe_error | text | YES | - | - | Stripeエラー |
| currency | text | YES | 'jpy' | - | 通貨 |
| preview_lines | integer | YES | 3 | CHECK (1-20) | プレビュー行数 |
| media_type | varchar | YES | 'image' | - | メディアタイプ (image/video) |
| ai_model | varchar | YES | - | - | 使用AIモデル名 |
| created_at | timestamptz | NO | now() | - | 作成日時 |
| updated_at | timestamptz | NO | now() | - | 更新日時 |

#### 3. categories (カテゴリ)
プロンプトを分類するためのカテゴリテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | カテゴリID |
| name | text | NO | - | - | カテゴリ名 |
| slug | text | NO | - | UNIQUE | URL用スラッグ |
| description | text | YES | - | - | 説明 |
| icon | text | YES | - | - | アイコン |
| parent_id | uuid | YES | - | FOREIGN KEY (categories) | 親カテゴリID |
| created_by | uuid | YES | - | FOREIGN KEY (auth.users) | 作成者ID |
| created_at | timestamptz | YES | now() | - | 作成日時 |
| updated_at | timestamptz | YES | now() | - | 更新日時 |

### インタラクション関連テーブル

#### 4. likes (いいね)
プロンプトに対するいいねを管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | いいねID |
| user_id | uuid | NO | - | FOREIGN KEY (profiles) | ユーザーID |
| prompt_id | uuid | NO | - | FOREIGN KEY (prompts) | プロンプトID |
| created_at | timestamptz | NO | now() | - | 作成日時 |

#### 5. bookmarks (ブックマーク)
プロンプトのブックマークを管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | ブックマークID |
| user_id | uuid | NO | - | FOREIGN KEY (profiles) | ユーザーID |
| prompt_id | uuid | NO | - | FOREIGN KEY (prompts) | プロンプトID |
| created_at | timestamptz | NO | now() | - | 作成日時 |

#### 6. comments (コメント)
プロンプトに対するコメント機能

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | コメントID |
| prompt_id | uuid | NO | - | FOREIGN KEY (prompts) | プロンプトID |
| user_id | uuid | NO | - | FOREIGN KEY (profiles) | ユーザーID |
| parent_id | uuid | YES | - | FOREIGN KEY (comments) | 親コメントID |
| content | text | NO | - | CHECK (length >= 1) | コメント内容 |
| is_edited | boolean | YES | false | - | 編集フラグ |
| created_at | timestamptz | NO | now() | - | 作成日時 |
| updated_at | timestamptz | NO | now() | - | 更新日時 |

#### 7. follows (フォロー関係)
ユーザー間のフォロー関係を管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | フォローID |
| follower_id | uuid | NO | - | FOREIGN KEY (profiles) | フォロワーID |
| following_id | uuid | NO | - | FOREIGN KEY (profiles) | フォロー対象ID |
| created_at | timestamptz | NO | now() | - | 作成日時 |

### 購入・決済関連テーブル

#### 8. purchases (購入)
プロンプトの購入記録を管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | 購入ID |
| buyer_id | uuid | NO | - | FOREIGN KEY (profiles) | 購入者ID |
| prompt_id | uuid | NO | - | FOREIGN KEY (prompts) | プロンプトID |
| amount | numeric | NO | - | - | 金額 |
| status | varchar | YES | 'completed' | - | ステータス |
| payment_id | varchar | YES | - | - | 決済ID |
| currency | text | YES | 'JPY' | - | 通貨 |
| created_at | timestamptz | NO | now() | - | 作成日時 |

#### 9. payments (決済情報)
決済の詳細情報を管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | 決済ID |
| user_id | uuid | YES | - | FOREIGN KEY (profiles) | ユーザーID |
| amount | bigint | NO | - | - | 金額 |
| currency | text | NO | - | - | 通貨 |
| intent_id | text | NO | - | - | インテントID |
| status | text | NO | - | - | ステータス |
| created_at | timestamptz | YES | now() | - | 作成日時 |

#### 10. payment_methods (決済方法)
ユーザーの決済方法を管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | 決済方法ID |
| user_id | uuid | NO | - | FOREIGN KEY (profiles) | ユーザーID |
| provider | varchar | NO | - | - | 決済プロバイダー |
| token_id | varchar | NO | - | - | トークンID |
| card_last4 | varchar | YES | - | - | カード下4桁 |
| card_brand | varchar | YES | - | - | カードブランド |
| expiry_month | integer | YES | - | - | 有効期限月 |
| expiry_year | integer | YES | - | - | 有効期限年 |
| is_default | boolean | YES | false | - | デフォルトフラグ |
| created_at | timestamptz | NO | now() | - | 作成日時 |
| updated_at | timestamptz | NO | now() | - | 更新日時 |

### システム機能テーブル

#### 11. notifications (通知)
システム通知を管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | 通知ID |
| recipient_id | uuid | NO | - | FOREIGN KEY (profiles) | 受信者ID |
| sender_id | uuid | YES | - | FOREIGN KEY (profiles) | 送信者ID |
| type | varchar | NO | - | - | 通知タイプ |
| content | text | YES | - | - | 通知内容 |
| resource_type | varchar | YES | - | - | リソースタイプ |
| resource_id | uuid | YES | - | - | リソースID |
| is_read | boolean | YES | false | - | 既読フラグ |
| created_at | timestamptz | NO | now() | - | 作成日時 |

#### 12. announcements (お知らせ)
システムからのお知らせを管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | お知らせID |
| title | text | NO | - | - | タイトル |
| content | text | NO | - | - | 内容 |
| icon | text | YES | - | - | アイコン |
| icon_color | text | YES | - | - | アイコン色 |
| start_date | timestamptz | NO | now() | - | 開始日時 |
| end_date | timestamptz | YES | - | - | 終了日時 |
| is_active | boolean | NO | true | - | アクティブフラグ |
| created_at | timestamptz | NO | now() | - | 作成日時 |
| updated_at | timestamptz | NO | now() | - | 更新日時 |

#### 13. feedback (フィードバック)
ユーザーからのフィードバックを管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | フィードバックID |
| feedback_type | text | NO | - | - | フィードバック種別 |
| email | text | YES | - | - | メールアドレス |
| message | text | NO | - | - | メッセージ |
| is_read | boolean | NO | false | - | 既読フラグ |
| created_at | timestamptz | NO | now() | - | 作成日時 |
| updated_at | timestamptz | NO | now() | - | 更新日時 |

#### 14. contacts (お問い合わせ)
ユーザーからのお問い合わせを管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | お問い合わせID |
| name | text | NO | - | - | 名前 |
| email | text | NO | - | - | メールアドレス |
| subject | text | NO | - | - | 件名 |
| message | text | NO | - | - | メッセージ |
| is_read | boolean | YES | false | - | 既読フラグ |
| created_at | timestamptz | NO | now() | - | 作成日時 |
| updated_at | timestamptz | NO | now() | - | 更新日時 |

### 分析・レポート関連テーブル

#### 15. analytics_views (アクセス解析)
プロンプトの閲覧ログを記録

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | 閲覧ID |
| prompt_id | uuid | NO | - | - | プロンプトID |
| visitor_id | text | NO | - | - | 訪問者ID |
| viewed_at | timestamptz | YES | now() | - | 閲覧日時 |

#### 16. analytics_summary (分析サマリー)
プロンプトの分析データを日次で集計

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | サマリーID |
| prompt_id | uuid | NO | - | FOREIGN KEY (prompts) | プロンプトID |
| date | date | NO | - | - | 対象日 |
| view_count | integer | YES | 0 | - | 閲覧数 |
| unique_viewer_count | integer | YES | 0 | - | ユニーク閲覧者数 |
| like_count | integer | YES | 0 | - | いいね数 |
| comment_count | integer | YES | 0 | - | コメント数 |
| bookmark_count | integer | YES | 0 | - | ブックマーク数 |
| purchase_count | integer | YES | 0 | - | 購入数 |
| created_at | timestamptz | NO | now() | - | 作成日時 |
| updated_at | timestamptz | NO | now() | - | 更新日時 |

#### 17. reports (レポート)
不適切なコンテンツの報告を管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | レポートID |
| target_id | uuid | NO | - | - | 対象ID |
| target_type | text | NO | - | CHECK (comment/prompt) | 対象タイプ |
| prompt_id | uuid | NO | - | - | プロンプトID |
| reporter_id | uuid | NO | - | FOREIGN KEY (auth.users) | 報告者ID |
| reason | text | NO | - | CHECK (inappropriate/spam/harassment/misinformation/other) | 理由 |
| details | text | YES | - | - | 詳細 |
| status | text | NO | 'pending' | CHECK (pending/reviewed/dismissed) | ステータス |
| created_at | timestamptz | NO | now() | - | 作成日時 |
| updated_at | timestamptz | YES | now() | - | 更新日時 |

### 設定・プリファレンス関連テーブル

#### 18. account_settings (アカウント設定)
ユーザーのアカウント設定を管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | 設定ID |
| user_id | uuid | NO | - | UNIQUE, FOREIGN KEY (profiles) | ユーザーID |
| show_creator_page | boolean | YES | true | - | クリエイターページ表示 |
| add_mentions_on_share | boolean | YES | true | - | シェア時メンション有効 |
| allow_reposts | boolean | YES | true | - | リポスト許可 |
| show_recommended_creators | boolean | YES | true | - | 推奨クリエイター表示 |
| use_serif_font | boolean | YES | false | - | セリフフォント使用 |
| accept_tips | boolean | YES | true | - | チップ受け取り |
| allow_anonymous_purchase | boolean | YES | true | - | 匿名購入許可 |
| opt_out_ai_training | boolean | YES | false | - | AI学習オプトアウト |
| created_at | timestamptz | NO | now() | - | 作成日時 |
| updated_at | timestamptz | NO | now() | - | 更新日時 |

#### 19. notification_preferences (通知設定)
ユーザーの通知設定を管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | 設定ID |
| user_id | uuid | NO | - | UNIQUE, FOREIGN KEY (profiles) | ユーザーID |
| likes_enabled | boolean | YES | true | - | いいね通知有効 |
| comments_enabled | boolean | YES | true | - | コメント通知有効 |
| follows_enabled | boolean | YES | true | - | フォロー通知有効 |
| mentions_enabled | boolean | YES | true | - | メンション通知有効 |
| system_enabled | boolean | YES | true | - | システム通知有効 |
| email_notifications_enabled | boolean | YES | true | - | メール通知有効 |
| push_notifications_enabled | boolean | YES | true | - | プッシュ通知有効 |
| created_at | timestamptz | NO | now() | - | 作成日時 |
| updated_at | timestamptz | NO | now() | - | 更新日時 |

#### 20. user_settings (ユーザー設定)
詳細なユーザー設定をJSONBで管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | 設定ID |
| user_id | uuid | NO | - | UNIQUE, FOREIGN KEY (auth.users) | ユーザーID |
| account_settings | jsonb | YES | 詳細設定JSON | - | アカウント設定 |
| notification_settings | jsonb | YES | 通知設定JSON | - | 通知設定 |
| reaction_settings | jsonb | YES | リアクション設定JSON | - | リアクション設定 |
| comment_settings | jsonb | YES | コメント設定JSON | - | コメント設定 |
| created_at | timestamptz | NO | now() | - | 作成日時 |
| updated_at | timestamptz | NO | now() | - | 更新日時 |

#### 21. recently_viewed_prompts (最近閲覧したプロンプト)
ユーザーの閲覧履歴を管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | 履歴ID |
| user_id | uuid | NO | - | FOREIGN KEY (auth.users) | ユーザーID |
| prompt_id | uuid | NO | - | FOREIGN KEY (prompts) | プロンプトID |
| viewed_at | timestamptz | NO | now() | - | 閲覧日時 |

### その他のテーブル

#### 22. drafts (下書き)
投稿前の下書きを管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | 下書きID |
| author_id | uuid | NO | - | FOREIGN KEY (profiles) | 作成者ID |
| title | varchar | YES | - | - | タイトル |
| description | text | YES | - | - | 説明 |
| content | text | YES | - | - | 内容 |
| thumbnail_url | text | YES | - | - | サムネイルURL |
| category_id | uuid | YES | - | - | カテゴリID |
| price | numeric | YES | 0 | - | 価格 |
| is_free | boolean | YES | true | - | 無料フラグ |
| created_at | timestamptz | NO | now() | - | 作成日時 |
| updated_at | timestamptz | NO | now() | - | 更新日時 |

#### 23. tags (タグ)
プロンプトのタグ機能

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | タグID |
| name | varchar | NO | - | UNIQUE | タグ名 |
| slug | varchar | NO | - | UNIQUE | URLスラッグ |
| created_at | timestamptz | NO | now() | - | 作成日時 |

#### 24. prompt_tags (プロンプトタグ関連)
プロンプトとタグの関連テーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | 関連ID |
| prompt_id | uuid | NO | - | FOREIGN KEY (prompts) | プロンプトID |
| tag_id | uuid | NO | - | FOREIGN KEY (tags) | タグID |
| created_at | timestamptz | NO | now() | - | 作成日時 |

### コンテスト・マガジン関連テーブル

#### 25. contests (コンテスト)
プロンプトコンテストを管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | コンテストID |
| title | varchar | NO | - | - | タイトル |
| description | text | YES | - | - | 説明 |
| rules | text | YES | - | - | ルール |
| start_date | timestamptz | NO | - | - | 開始日時 |
| end_date | timestamptz | NO | - | - | 終了日時 |
| prize | text | YES | - | - | 賞品 |
| banner_url | text | YES | - | - | バナーURL |
| is_active | boolean | YES | true | - | アクティブフラグ |
| created_at | timestamptz | NO | now() | - | 作成日時 |
| updated_at | timestamptz | NO | now() | - | 更新日時 |

#### 26. magazines (マガジン)
プロンプトマガジン機能

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | マガジンID |
| author_id | uuid | NO | - | FOREIGN KEY (profiles) | 作成者ID |
| title | varchar | NO | - | CHECK (length >= 3) | タイトル |
| description | text | YES | - | - | 説明 |
| cover_url | text | YES | - | - | カバー画像URL |
| is_public | boolean | YES | true | - | 公開フラグ |
| created_at | timestamptz | NO | now() | - | 作成日時 |
| updated_at | timestamptz | NO | now() | - | 更新日時 |

### バッジ・実績システム

#### 27. badges (バッジ)
ユーザーに付与されるバッジを管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | バッジID |
| name | varchar | NO | - | UNIQUE | バッジ名 |
| description | text | YES | - | - | 説明 |
| icon | varchar | YES | - | - | アイコン |
| requirements | text | YES | - | - | 取得条件 |
| created_at | timestamptz | NO | now() | - | 作成日時 |

#### 28. user_badges (ユーザーバッジ)
ユーザーが取得したバッジを管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | ユーザーバッジID |
| user_id | uuid | NO | - | FOREIGN KEY (profiles) | ユーザーID |
| badge_id | uuid | NO | - | FOREIGN KEY (badges) | バッジID |
| awarded_at | timestamptz | NO | now() | - | 取得日時 |

### サブスクリプション・決済関連

#### 29. subscriptions (サブスクリプション)
ユーザー間のサブスクリプション関係を管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | サブスクリプションID |
| subscriber_id | uuid | NO | - | FOREIGN KEY (profiles) | 購読者ID |
| creator_id | uuid | NO | - | FOREIGN KEY (profiles) | クリエイターID |
| status | varchar | YES | 'active' | - | ステータス |
| price_tier_id | uuid | YES | - | - | 価格ティアID |
| current_period_start | timestamptz | NO | - | - | 現在期間開始 |
| current_period_end | timestamptz | NO | - | - | 現在期間終了 |
| cancel_at_period_end | boolean | YES | false | - | 期間終了時キャンセル |
| payment_method_id | uuid | YES | - | FOREIGN KEY (payment_methods) | 決済方法ID |
| created_at | timestamptz | NO | now() | - | 作成日時 |
| updated_at | timestamptz | NO | now() | - | 更新日時 |

#### 30. price_tiers (価格ティア)
サブスクリプションの価格プランを管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | 価格ティアID |
| creator_id | uuid | NO | - | FOREIGN KEY (profiles) | クリエイターID |
| name | varchar | NO | - | - | プラン名 |
| description | text | YES | - | - | 説明 |
| price | numeric | NO | - | - | 価格 |
| billing_interval | varchar | YES | 'month' | - | 請求間隔 |
| is_active | boolean | YES | true | - | アクティブフラグ |
| benefits | jsonb | YES | - | - | 特典 |
| created_at | timestamptz | NO | now() | - | 作成日時 |
| updated_at | timestamptz | NO | now() | - | 更新日時 |

#### 31. payouts (支払い)
クリエイターへの支払いを管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | 支払いID |
| user_id | uuid | NO | - | FOREIGN KEY (profiles) | ユーザーID |
| amount | numeric | NO | - | - | 金額 |
| status | varchar | YES | 'pending' | - | ステータス |
| transaction_id | varchar | YES | - | - | 取引ID |
| payout_method | varchar | YES | - | - | 支払い方法 |
| notes | text | YES | - | - | 備考 |
| completed_at | timestamptz | YES | - | - | 完了日時 |
| created_at | timestamptz | NO | now() | - | 作成日時 |
| updated_at | timestamptz | NO | now() | - | 更新日時 |

#### 32. payout_accounts (支払いアカウント)
クリエイターの支払い先アカウント情報を管理

| カラム名 | データ型 | NULL許可 | デフォルト値 | 制約 | 説明 |
|---------|---------|---------|------------|-----|-----|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | 支払いアカウントID |
| user_id | uuid | NO | - | FOREIGN KEY (profiles) | ユーザーID |
| account_type | varchar | NO | - | - | アカウント種別 |
| account_holder | varchar | NO | - | - | アカウント保有者 |
| account_details | jsonb | NO | - | - | アカウント詳細 |
| is_default | boolean | YES | false | - | デフォルトフラグ |
| is_verified | boolean | YES | false | - | 検証済みフラグ |
| created_at | timestamptz | NO | now() | - | 作成日時 |
| updated_at | timestamptz | NO | now() | - | 更新日時 |

## インストール済み拡張機能

以下の拡張機能がインストールされています：

| 拡張機能名 | バージョン | スキーマ | 説明 |
|-----------|----------|---------|-----|
| pgcrypto | 1.3 | extensions | 暗号化機能 |
| pgjwt | 0.2.0 | extensions | JSON Web Token API |
| uuid-ossp | 1.1 | extensions | UUID生成機能 |
| pg_stat_statements | 1.10 | extensions | SQL統計追跡 |
| pg_graphql | 1.5.11 | graphql | GraphQL サポート |
| supabase_vault | 0.3.1 | vault | Supabase Vault拡張機能 |

## セキュリティ設定

- **Row Level Security (RLS)**: すべてのpublicテーブルでRLSが有効化されています
- **認証**: Supabase Authを使用したユーザー認証システム
- **API**: PostgREST経由でのRESTful API
- **GraphQL**: pg_graphql拡張機能によるGraphQLサポート

## マイグレーション履歴

| バージョン | 名前 | 説明 |
|-----------|------|-----|
| 20250416073545 | create_contacts_table | お問い合わせテーブル作成 |
| 20250416074830 | create_contacts_table | お問い合わせテーブル作成（再） |
| 20250416081257 | create_feedback_table | フィードバックテーブル作成 |
| 20250416082410 | fix_feedback_insert_function | フィードバック挿入関数修正 |
| 20250416082723 | create_feedback_table | フィードバックテーブル作成（再） |
| 20250416083050 | create_get_all_feedback_function | フィードバック取得関数作成 |
| 20250416083709 | create_insert_contact_function | お問い合わせ挿入関数作成 |
| 20250416084430 | create_announcements_table | お知らせテーブル作成 |
| 20250416091712 | create_announcement_reads_table | お知らせ既読テーブル作成 |
| 20250416092634 | create_notifications_table | 通知テーブル作成 |
| 20250416092659 | update_notifications_table_safe | 通知テーブル更新（安全） |
| 20250421101753 | create_bookmarks_table | ブックマークテーブル作成 |

## データベース設計のポイント

### 1. スケーラビリティ
- UUIDを主キーとして使用し、分散環境でのスケーラビリティを確保
- 適切なインデックス設計により高速検索を実現
- JSON/JSONBカラムを活用した柔軟なデータ構造

### 2. セキュリティ
- Row Level Security (RLS) による細粒度のアクセス制御
- 外部キー制約による参照整合性の保証
- CHECK制約による入力値の検証

### 3. パフォーマンス
- 分析データの事前集計（analytics_summary）
- 適切な正規化とクエリ最適化
- キャッシュ戦略の考慮

### 4. 拡張性
- プラグイン型のバッジシステム
- 柔軟な通知システム
- JSONBを活用した設定管理

### 5. 監査・分析
- 作成・更新日時の自動記録
- 詳細なアクセスログ
- レポート機能による品質管理

## 今後の拡張予定

1. **AI機能強化**: プロンプト生成支援、自動タグ付け
2. **コラボレーション機能**: 共同編集、レビュー機能
3. **高度な分析**: 機械学習による推奨システム
4. **API拡張**: より豊富なWebhook、外部連携
5. **パフォーマンス最適化**: クエリ最適化、キャッシュ改善

---

*このドキュメントは2025年1月時点の情報です。データベース構造は継続的に改善・拡張されています。*