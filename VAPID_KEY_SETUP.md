# VAPID Key設定手順 🔑

Firebase Web Push通知を有効にするためのVAPID Key設定手順です。

## 🚨 現在のエラー

```
401 (Unauthorized)
messaging/token-subscribe-failed
```

このエラーは**VAPID Keyが無効または未設定**のため発生しています。

## 📋 VAPID Key取得手順

### 1️⃣ Firebaseコンソールにアクセス

1. https://console.firebase.google.com/ を開く
2. プロジェクト「**rapid-access-457000-v3**」を選択

### 2️⃣ VAPID Keyを生成

1. 左メニューから ⚙️ **Project Settings** をクリック
2. 上部タブから **Cloud Messaging** を選択  
3. **Web configuration** セクションを探す
4. **Generate key pair** ボタンをクリック
5. 生成されたキー（約88文字、`B`で始まる）をコピー

### 3️⃣ コードに設定

`src/lib/firebase.ts`の17行目を修正：

```typescript
// 修正前
const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || "BCmrKPYqpPcV9zcxqPjU_GJdFrlCXx9zOuPbNR4zjb6X6VuQOgwN6o6L8FtHZJnBzSDnNWKjN6pR4HwLgJbGqAw";

// 修正後（YOUR_ACTUAL_VAPID_KEYを実際のキーに置き換え）
const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || "YOUR_ACTUAL_VAPID_KEY";
```

### 4️⃣ 開発サーバー再起動

```bash
npm run dev
```

### 5️⃣ テスト

1. ブラウザでページをリロード（Ctrl+F5）
2. `/settings` → 「通知」タブ
3. 「通知を有効にする」ボタンをクリック

## ✅ 成功の確認

ブラウザのコンソール（F12）に以下が表示されれば成功：

```
✅ VAPID Key validation: { isValid: true }
✅ Service Worker registered successfully
✅ Notification permission granted
✅ FCM Token: [長い文字列]
```

## 🚨 まだエラーが出る場合

1. **VAPID Keyの確認**: 88文字程度で`B`で始まっているか確認
2. **Service Worker**: `/firebase-messaging-sw.js`が正しく配置されているか確認
3. **HTTPS**: localhostまたはHTTPS環境で実行しているか確認

## 📞 サポート

問題が解決しない場合は、ブラウザのコンソールエラーをお知らせください。 