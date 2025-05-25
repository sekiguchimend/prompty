# Stripe Webhook 設定ガイド

## Webhookとは

WebhookはStripeから重要なイベント通知を受け取るためのエンドポイントです。支払いが完了した時、失敗した時、アカウント更新時など様々なイベントが通知されます。

## 設定手順

### 1. Webhook エンドポイントの追加

1. [Stripeダッシュボード](https://dashboard.stripe.com/test/webhooks)にアクセスし、「ウェブフックを追加」をクリックします。

2. 以下の情報を入力します：
   - **エンドポイントURL**: アプリケーションのWebhookエンドポイント
     - 開発環境: `http://localhost:3000/api/stripe/webhook`
     - 本番環境: `https://あなたのドメイン/api/stripe/webhook`
   
   - **説明**: わかりやすい説明（例: 「C to C決済通知の受信」）
   
   - **イベント**: 少なくとも以下のイベントを選択
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `account.updated`

3. 「ウェブフックを追加」ボタンをクリックして保存します。

### 2. Webhookシークレットの取得とアプリへの設定

1. Webhook作成後に表示される「署名シークレット」をコピーします。
   これは`whsec_`で始まる文字列です。

2. アプリケーションの環境変数に設定します：
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

3. このシークレットは`src/pages/api/stripe/webhook.ts`で使用され、受信したイベントの署名を検証します。

### 3. ローカル開発環境でのテスト方法

ローカル環境（localhost）でWebhookをテストするには、以下のいずれかの方法が使えます：

#### A. Stripe CLI を使用する方法

1. [Stripe CLI](https://stripe.com/docs/stripe-cli)をインストールします。

2. 認証を行います：
   ```
   stripe login
   ```

3. ローカルサーバーへのウェブフックの転送を開始します：
   ```
   stripe listen --forward-to http://localhost:3000/api/stripe/webhook
   ```

4. 表示されたウェブフックシークレットを環境変数に設定します。

#### B. ngrok を使用する方法

1. [ngrok](https://ngrok.com/)をインストールします：
   ```
   npm install -g ngrok
   ```

2. HTTPSトンネルを開始します：
   ```
   ngrok http 3000
   ```

3. 表示されたHTTPSのURLを使って、Stripeダッシュボードでウェブフックを設定します：
   ```
   https://xxxx-xxx-xx-xx-xx.ngrok-free.app/api/stripe/webhook
   ```

### 4. テスト方法

1. Webhook設定後、Stripe Dashboard上でイベントをテスト送信できます：
   - Webhooks詳細ページ内の「テストイベントを送信」をクリック
   - イベントタイプを選択（例：`payment_intent.succeeded`）
   - 「テストイベントを送信」をクリック

2. アプリケーションのログに受信と処理が記録されていることを確認します。

### 5. 本番環境への移行時の注意点

1. 本番環境では別のWebhookエンドポイントを設定します（テスト用と本番用は別々に管理）。

2. 本番用のウェブフックシークレットを取得し、本番環境の環境変数に設定します。

3. 本番環境では実際のイベント処理に対する適切なエラーハンドリングとロギングを実装してください。

以上がStripe Webhookの基本的な設定手順です。これにより、決済イベントをリアルタイムに受け取り、適切な処理を行うことができます。 