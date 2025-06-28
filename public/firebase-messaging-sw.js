// firebase-messaging-sw.js

// Firebase SDK の最新版をインポート
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

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

// Firebase初期化（エラーハンドリング付き）
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase Service Worker initialized successfully');
} catch (error) {
    console.error('Firebase Service Worker initialization failed:', error);
}

// Firebase Messaging を取得
const messaging = firebase.messaging();

// バックグラウンド通知のハンドリング
messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || '通知';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/prompty_logo.jpg', // ローカルアイコンを使用
        badge: '/prompty_logo.jpg',
        data: payload.data || {}
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 通知クリック時の処理
self.addEventListener('notificationclick', function(event) {
    console.log('[firebase-messaging-sw.js] Notification click received:', event);
    
    event.notification.close();
    
    // 通知データに基づいてページを開く
    const data = event.notification.data;
    let url = '/';
    
    if (data?.type === 'comment' && data?.prompt_id) {
        url = `/prompts/${data.prompt_id}`;
    } else if (data?.type === 'like' && data?.prompt_id) {
        url = `/prompts/${data.prompt_id}`;
    } else if (data?.type === 'follow' && data?.follower_id) {
        url = `/users/${data.follower_id}`;
    }
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(function(clientList) {
            // 既にタブが開いている場合はそこにフォーカス
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(url) && 'focus' in client) {
                    return client.focus();
                }
            }
            // 新しいタブで開く
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
