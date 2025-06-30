#!/usr/bin/env node
// VAPID KEY 診断スクリプト
// 実行方法: node scripts/diagnose-vapid-key.js

console.log('\n🔍 VAPID KEY 診断スクリプト');
console.log('='.repeat(50));

// 環境変数チェック
const envVapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
console.log('\n📋 環境変数チェック:');
console.log(`NEXT_PUBLIC_VAPID_KEY: ${envVapidKey ? '✅ 設定済み' : '❌ 未設定'}`);

if (envVapidKey) {
  console.log(`長さ: ${envVapidKey.length} 文字`);
  console.log(`先頭文字: ${envVapidKey.charAt(0)}`);
  console.log(`有効性: ${envVapidKey.length >= 80 && envVapidKey.startsWith('B') ? '✅ 有効' : '❌ 無効'}`);
}

// firebase.ts ファイルのチェック
const fs = require('fs');
const path = require('path');

try {
  const firebaseFile = fs.readFileSync(path.join(__dirname, '../src/lib/firebase.ts'), 'utf8');
  const vapidKeyMatch = firebaseFile.match(/const VAPID_KEY = .* \|\| "([^"]+)"/);
  
  if (vapidKeyMatch) {
    const defaultVapidKey = vapidKeyMatch[1];
    console.log('\n📝 firebase.ts デフォルト値:');
    console.log(`デフォルトVAPID KEY: ${defaultVapidKey.substring(0, 20)}...`);
    console.log(`長さ: ${defaultVapidKey.length} 文字`);
    console.log(`先頭文字: ${defaultVapidKey.charAt(0)}`);
    console.log(`有効性: ${defaultVapidKey.length >= 80 && defaultVapidKey.startsWith('B') ? '✅ 有効' : '❌ 無効'}`);
  }
} catch (error) {
  console.log('\n❌ firebase.ts ファイルの読み込みに失敗:', error.message);
}

console.log('\n🛠️ 修正手順:');
console.log('1. Firebaseコンソールにアクセス: https://console.firebase.google.com/');
console.log('2. プロジェクト「rapid-access-457000-v3」を選択');
console.log('3. ⚙️ Project Settings → Cloud Messaging');
console.log('4. "Web configuration" → "Generate key pair"');
console.log('5. 生成された公開鍵をコピー');
console.log('6. 以下のいずれかで設定:');
console.log('   - 環境変数: NEXT_PUBLIC_VAPID_KEY=YOUR_KEY');
console.log('   - または src/lib/firebase.ts のデフォルト値を置き換え');

console.log('\n⚠️ 注意: VAPID KEYとFIREBASE_PRIVATE_KEYは別物です');
console.log('- VAPID KEY: クライアント側でのFCMトークン取得用（公開鍵）');
console.log('- FIREBASE_PRIVATE_KEY: サーバー側でのFirebase Admin API用（秘密鍵）');

console.log('\n' + '='.repeat(50)); 