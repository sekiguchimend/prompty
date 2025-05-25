# シンプル版 analytics_views テーブル導入ガイド

## テーブル作成方法

1. Supabaseダッシュボードにログインする
2. 左メニューから「SQL Editor」を選択
3. `recreate_analytics_views_table.sql` の内容をコピーする
4. 「New Query」をクリックしてSQLをペースト
5. 「Run」ボタンをクリックして実行

## 確認方法

実行後、以下のSQLで確認できます：

```sql
-- テーブルの存在確認
SELECT * FROM analytics_views LIMIT 10;

-- カラム構造の確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analytics_views';
```

## トラブルシューティング

### スキーマキャッシュの問題が継続する場合

1. Supabaseダッシュボードの「Settings > Database」に移動
2. 「Database Pooling」セクションで「PgBouncer」タブを開く
3. 「Refresh Schema Cache」ボタンをクリック
4. または、「Database Settings」タブで「Restart Database」を試す
5. 特に、「recreate_analytics_views_table.sql」の末尾にある `NOTIFY pgrst, 'reload schema';` が実行されていることを確認

### それでも問題が解決しない場合

以下の極めてシンプルなSQLをコピーして実行してみてください：

```sql
DROP TABLE IF EXISTS page_views;
CREATE TABLE page_views (
  id SERIAL PRIMARY KEY,
  page_id TEXT NOT NULL,
  viewer_id TEXT NOT NULL,
  viewed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(page_id, viewer_id)
);
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert" ON page_views FOR INSERT WITH CHECK (true);
```

次に、`src/lib/analytics.ts` のコードを以下のように修正します：

```typescript
// テーブル名をpage_viewsに変更
// カラム名をpage_idとviewer_idに変更
```

## 注意点

このシンプル版では最低限の構造に抑えています：

- カラム名に一般的な `user_id` を使用せず、`visitor_id` にしています
- 複雑な制約や詳細データは省略しています
- 必要最小限のポリシーのみ設定しています

これは最低限の機能を確保するためのアプローチです。正常に動作が確認できた後、必要に応じて機能を拡張してください。 