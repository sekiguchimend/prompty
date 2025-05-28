# Gemini API + Nginx セットアップガイド

このガイドでは、Gemini APIだけを専用サーバー（3002ポート）で動作させ、Nginxでプロキシする設定について説明します。

## 🏗️ アーキテクチャ

### ローカル開発環境
```
ブラウザ → Nginx (80) → Gemini API (3002) (/api/gemini/*)
                    → Next.js App (3000) (その他のAPI)
```

### 本番環境
```
ブラウザ → Next.js App (3000) → すべてのAPI
```

## 📋 必要な環境

- Node.js 18以上
- Nginx
- npm または yarn

## 🚀 セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下を設定：

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_PORT=3002
NODE_ENV=development
```

### 3. Nginxの設定

#### Windows (Nginxをダウンロードして使用)

1. [Nginx公式サイト](http://nginx.org/en/download.html)からWindows版をダウンロード
2. 解凍したフォルダの`conf/nginx.conf`を本プロジェクトの`nginx.conf`で置き換え
3. Nginxを起動：
   ```cmd
   cd nginx-1.xx.x
   nginx.exe
   ```

#### macOS (Homebrewを使用)

```bash
# Nginxをインストール
brew install nginx

# 設定ファイルをコピー
sudo cp nginx.conf /usr/local/etc/nginx/nginx.conf

# Nginxを起動
sudo nginx
```

#### Linux (Ubuntu/Debian)

```bash
# Nginxをインストール
sudo apt update
sudo apt install nginx

# 設定ファイルをコピー
sudo cp nginx.conf /etc/nginx/nginx.conf

# Nginxを起動
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4. アプリケーションの起動

#### 開発環境（推奨）

```bash
# Next.jsアプリとGeminiサーバーを同時起動
npm run dev:with-gemini
```

または個別に起動：

```bash
# ターミナル1: Next.jsアプリ
npm run dev

# ターミナル2: Geminiサーバー
npm run dev:gemini
```

#### 本番環境

```bash
# ビルド
npm run build

# Next.jsアプリとGeminiサーバーを同時起動
npm run start:with-gemini
```

## 🔍 動作確認

### 1. サービスの確認

```bash
# Next.jsアプリ
curl http://localhost:3000

# Geminiサーバー
curl http://localhost:3002/health

# Nginx経由でのGemini API
curl http://localhost/api/gemini/health
```

### 2. ブラウザでの確認

- メインアプリ: http://localhost （Nginx経由）
- 直接アクセス: http://localhost:3000 （Next.js直接）
- Geminiサーバー: http://localhost:3002/health

## 📁 ファイル構成

```
project/
├── gemini-server.js          # Gemini専用サーバー
├── nginx.conf               # Nginx設定ファイル
├── src/lib/gemini.ts        # Gemini APIクライアント
├── package.json             # 新しいスクリプト追加済み
└── GEMINI_NGINX_SETUP.md    # このファイル
```

## 🔧 トラブルシューティング

### Nginxが起動しない

```bash
# 設定ファイルの構文チェック
nginx -t

# プロセス確認
ps aux | grep nginx

# ポート使用状況確認
netstat -tulpn | grep :80
```

### Geminiサーバーが起動しない

```bash
# ポート使用状況確認
netstat -tulpn | grep :3002

# ログ確認
npm run dev:gemini
```

### API呼び出しが失敗する

1. ブラウザの開発者ツールでネットワークタブを確認
2. Geminiサーバーのログを確認
3. Nginxのエラーログを確認：
   ```bash
   # Linux/macOS
   tail -f /var/log/nginx/error.log
   
   # Windows
   # nginx/logs/error.log を確認
   ```

## 🌐 本番環境での注意事項

1. **環境変数**: `NODE_ENV=production`を設定
2. **ドメイン設定**: `nginx.conf`の`server_name`を実際のドメインに変更
3. **SSL設定**: HTTPS用の設定を追加
4. **セキュリティ**: APIキーの適切な管理

## 📝 カスタマイズ

### ポート変更

1. `gemini-server.js`の`PORT`変数を変更
2. `nginx.conf`の`upstream gemini_api`を変更
3. 環境変数`GEMINI_PORT`を更新

### 追加のAPI分離

他のAPIも分離したい場合は、同様の手順で専用サーバーを作成し、Nginxの設定を追加してください。

## 🔗 関連リンク

- [Nginx公式ドキュメント](http://nginx.org/en/docs/)
- [Express.js公式ドキュメント](https://expressjs.com/)
- [Google Generative AI](https://ai.google.dev/) 