import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { supabase } from './supabaseClient';

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyCGNPHVp6HYqri4AB_1ZrtNtW81NySCwqI",
  authDomain: "rapid-access-457000-v3.firebaseapp.com",
  projectId: "rapid-access-457000-v3",
  storageBucket: "rapid-access-457000-v3.firebasestorage.app",
  messagingSenderId: "409852032440",
  appId: "1:409852032440:web:f6eb29166a8bb9de988b4d",
  measurementId: "G-1QWX7QV6PE"
};

// 🚨 VAPID KEY設定 - 正しい値を設定してください！
// 【重要】下記のデフォルト値は仮の値です。正しい手順で取得したVAPID KEYに置き換えてください。
// 
// 【VAPID KEY取得手順】:
// 1. https://console.firebase.google.com/ にアクセス
// 2. プロジェクト「rapid-access-457000-v3」を選択
// 3. ⚙️ Project Settings → Cloud Messaging タブ
// 4. "Web configuration" セクション → "Generate key pair" をクリック  
// 5. 生成された公開鍵（88文字程度、"B"で始まる）をコピー
// 6. 環境変数 NEXT_PUBLIC_VAPID_KEY に設定するか、下記のデフォルト値を置き換え
//
// ⚠️ 現在のデフォルト値は正しくない可能性があります！
const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || "YOUR_VAPID_KEY_HERE";

// デバッグ情報をコンソールに出力
console.log('🔑 VAPID Key Debug Info:', {
  hasEnvVar: !!process.env.NEXT_PUBLIC_VAPID_KEY,
  keyLength: VAPID_KEY?.length,
  startsWithB: VAPID_KEY?.startsWith('B'),
  isPlaceholder: VAPID_KEY === "YOUR_VAPID_KEY_HERE",
  firstChars: VAPID_KEY?.substring(0, 10)
});

// Firebase初期化
const app = initializeApp(firebaseConfig);

let messaging: any = null;
let isFirebaseSupported = false;

// Service Worker登録
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('✅ Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      throw error;
    }
  } else {
    throw new Error('Service Worker is not supported');
  }
};

// Firebase Messaging のサポート確認と初期化
const initMessaging = async () => {
  try {
    const supported = await isSupported();
    if (supported && typeof window !== 'undefined') {
      messaging = getMessaging(app);
      isFirebaseSupported = true;
      console.log('✅ Firebase Messaging initialized successfully');
      
      // Service Workerを登録
      await registerServiceWorker();
    } else {
      console.warn('⚠️ Firebase Messaging is not supported in this environment');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Messaging:', error);
  }
};

// 初期化を実行
if (typeof window !== 'undefined') {
  initMessaging();
}

/**
 * 通知トークンを取得する
 */
export const getNotificationToken = async (): Promise<string | null> => {
  if (!isFirebaseSupported || !messaging) {
    throw new Error('Firebase Messaging is not supported');
  }

  try {
    // Service Workerが登録されているか確認
    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      throw new Error('Service Worker is not ready');
    }

    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    
    if (currentToken) {
      return currentToken;
    } else {
      throw new Error('No registration token available');
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    throw error;
  }
};

// フォアグラウンドメッセージを処理
export const onMessageListener = () => 
    new Promise((resolve) => {
        if (!messaging) {
            resolve(null);
            return;
        }
        
        onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);
            resolve(payload);
        });
    });

/**
 * フォアグラウンド通知を処理する
 */
export const setupForegroundNotifications = (callback?: (payload: any) => void) => {
  if (!messaging) {
    console.warn('Firebase messaging is not available');
    return;
  }

  onMessage(messaging, (payload) => {
    console.log('フォアグラウンド通知を受信:', payload);
    
    // カスタムコールバックがある場合は実行
    if (callback) {
      callback(payload);
    }
    
    // デフォルトの通知表示
    if (payload.notification) {
      new Notification(payload.notification.title || '通知', {
        body: payload.notification.body,
        icon: payload.notification.icon || '/prompty_logo.jpg'
      });
    }
  });
};

/**
 * 通知権限をリクエストする
 */
export const requestNotificationPermission = async (): Promise<string> => {
  if (!isFirebaseSupported || !messaging) {
    throw new Error('Firebase Messaging is not supported');
  }

  try {
    // VAPID Key検証（詳細）
    console.log('🔍 VAPID Key Validation:', {
      key: VAPID_KEY,
      length: VAPID_KEY?.length,
      valid: validateVapidKey()
    });

    if (!validateVapidKey()) {
      const errorMsg = VAPID_KEY === "YOUR_VAPID_KEY_HERE" 
        ? 'VAPID Keyが設定されていません。FirebaseコンソールからVAPID Keyを取得して設定してください。' 
        : `VAPID Keyが無効です。Length: ${VAPID_KEY?.length}, Expected: ~88 chars starting with "B"`;
      throw new Error(errorMsg);
    }

    // Service Workerを確実に登録
    await registerServiceWorker();
    const registration = await navigator.serviceWorker.ready;

    // 通知権限を要求
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      
      // FCMトークンを取得
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });
      
      if (currentToken) {
        console.log('✅ FCM Token obtained:', currentToken.substring(0, 20) + '...');
        return currentToken;
      } else {
        throw new Error('No registration token available');
      }
    } else {
      throw new Error('Notification permission denied');
    }
  } catch (error) {
    console.error('❌ Error getting notification permission:', error);
    throw error;
  }
};

// FCMトークンをSupabaseに保存
export const saveFCMToken = async (token: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // デバイス情報を取得
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timestamp: new Date().toISOString()
    };

    const { error } = await supabase
      .from('fcm_tokens')
      .upsert({
        user_id: user.id,
        token: token,
        device_info: deviceInfo,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,token'
      });

    if (error) throw error;
    
    console.log('FCM token saved successfully');
  } catch (error) {
    console.error('Error saving FCM token:', error);
    throw error;
  }
};

// FCMトークンを削除（通知を無効化）
export const removeFCMToken = async (token: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('fcm_tokens')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('token', token);

    if (error) throw error;
    
    console.log('FCM token removed successfully');
  } catch (error) {
    console.error('Error removing FCM token:', error);
    throw error;
  }
};

// サポート状況を確認（改善版）
export const checkNotificationSupport = () => {
  if (typeof window === 'undefined') return false;
  
  // 基本的なブラウザ機能のチェック
  const hasNotification = 'Notification' in window;
  const hasServiceWorker = 'serviceWorker' in navigator;
  
  console.log('🔍 Notification Support Check:', {
    hasNotification,
    hasServiceWorker,
    isFirebaseSupported,
    userAgent: navigator.userAgent,
    protocol: window.location.protocol
  });
  
  // HTTPS または localhost の場合のみ通知が利用可能
  const isSecureContext = window.location.protocol === 'https:' || 
                          window.location.hostname === 'localhost' ||
                          window.location.hostname === '127.0.0.1';
  
  if (!isSecureContext) {
    console.warn('⚠️ 通知はHTTPS環境でのみ利用可能です');
    return false;
  }
  
  return hasNotification && hasServiceWorker;
};

// 非同期でFirebaseサポートをチェック
export const checkFirebaseMessagingSupport = async (): Promise<boolean> => {
  try {
    const supported = await isSupported();
    console.log('🔍 Firebase Messaging Support:', supported);
    return supported;
  } catch (error) {
    console.error('❌ Firebase Messaging Support Check Error:', error);
    return false;
  }
};

// VAPID Key検証
export const validateVapidKey = () => {
  const isValid = VAPID_KEY && 
                  VAPID_KEY !== "YOUR_VAPID_KEY_HERE" && 
                  VAPID_KEY.length >= 80 && 
                  VAPID_KEY.startsWith('B');
  return isValid;
};

// 現在の通知権限を取得
export const getNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default';
  }
  return Notification.permission;
};

/**
 * VAPID KEYをテストする（実際にFCMトークンの取得を試行）
 */
export const testVapidKey = async (): Promise<{ isValid: boolean; error?: string; token?: string }> => {
  try {
    console.log('🧪 VAPID KEYテスト開始...');
    
    // 基本的な検証
    if (!validateVapidKey()) {
      return {
        isValid: false,
        error: 'VAPID KEYの形式が無効です'
      };
    }
    
    // 実際にFCMトークンの取得を試行
    const token = await getNotificationToken();
    
    if (token) {
      console.log('✅ VAPID KEYテスト成功');
      return {
        isValid: true,
        token: token.substring(0, 20) + '...'
      };
    } else {
      return {
        isValid: false,
        error: 'FCMトークンの取得に失敗しました'
      };
    }
  } catch (error) {
    console.error('❌ VAPID KEYテスト失敗:', error);
    return {
      isValid: false,
      error: (error as Error).message
    };
  }
};

export { app, messaging }; 