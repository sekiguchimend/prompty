# VAPID KEY取得場所ガイド 🔑

## 📍 取得場所：Firebaseコンソール

### 1️⃣ **アクセス先**
https://console.firebase.google.com/

### 2️⃣ **プロジェクト選択**
プロジェクト名：**rapid-access-457000-v3**

### 3️⃣ **設定メニューの場所**
```
Firebase Console
├── プロジェクト概要
├── 認証
├── Firestore Database
└── ⚙️ プロジェクトの設定 ← ここをクリック
    ├── 全般
    ├── ユーザーと権限
    ├── 統合
    ├── **Cloud Messaging** ← このタブを選択
    └── 使用量と請求
```

### 4️⃣ **VAPID KEY生成場所**

**Cloud Messaging** タブ内の **Web configuration** セクション：

```
📱 Web configuration
─────────────────────────────────────
Web Push certificates

Web Push certificatesを使って、あなたのWebアプリが
バックグラウンドでメッセージを受信できるようにします。

🔑 Key pair: [生成後はここに表示]

[ Generate key pair ] ← このボタンをクリック
─────────────────────────────────────
```

### 5️⃣ **生成される形式**
```
例: BEIhO6yNlVnbzfmTYuYj3W9tKuDWOayGXKs6QQHJT45rWQ96a2HSOTgGCHQ0avY76UzadHCli8wBQWBeWrwDgaw

特徴:
- 約88文字
- "B"で始まる
- 英数字とアンダースコア、ハイフンを含む
```

## 🚨 **注意点**

### ❌ 間違いやすい場所
- **サービスアカウント** → これは秘密鍵（FIREBASE_PRIVATE_KEY）
- **Web アプリの設定** → これは Firebase Config
- **API キー** → これは Firebase API Key

### ✅ 正しい場所
- **Cloud Messaging** > **Web configuration** > **Generate key pair**

## 🔧 **取得後の設定**

取得したVAPID KEYは以下のいずれかで設定：

### 方法1: 環境変数（推奨）
```bash
# .env.local
NEXT_PUBLIC_VAPID_KEY=取得したVAPID_KEY
```

### 方法2: コード内直接設定
```typescript
// src/lib/firebase.ts の17行目
const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || "取得したVAPID_KEY";
```

## 🧪 **設定確認**
```bash
npm run diagnose:vapid
``` 