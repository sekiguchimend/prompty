"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // ページが読み込まれたときに実行される
    const handleCallback = async () => {
      try {
        // Supabaseクライアントの初期化
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // セッション情報を取得
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        // セッションが存在し、ユーザー情報が含まれている場合
        if (session && session.user) {
          // デバッグのためにユーザー情報とメタデータを詳細に出力
          console.log('🟢 認証成功:', { 
            userId: session.user.id,
            email: session.user.email
          });
          console.log('🔍 ユーザーメタデータ:', JSON.stringify(session.user.user_metadata, null, 2));
          console.log('🔍 プロバイダー:', session.user.app_metadata?.provider);
          
          // セッション情報をローカルストレージに保存
          try {
            localStorage.setItem('supabase.auth.token', JSON.stringify(session));
            console.log('🟢 セッション情報をローカルストレージに保存しました');
          } catch (storageError) {
            console.error('🔴 セッション情報の保存エラー:', storageError);
          }
          
          const { id: userId, email } = session.user;
          const userMetadata = session.user.user_metadata || {};
          const provider = session.user.app_metadata?.provider;
          
          // URLから認証モードを取得（新規登録かログインか）
          const urlParams = new URLSearchParams(window.location.search);
          const isSignup = urlParams.get('mode') === 'signup';
          
          // 新規登録の場合はプロフィール設定ページに、ログインの場合はホームページにリダイレクト
          const redirectPath = isSignup ? '/setup-profile' : '/';
          console.log(`🔍 認証モード: ${isSignup ? '新規登録' : 'ログイン'}, リダイレクト先: ${redirectPath}`);
          
          // プロバイダー別の名前取得ロジック
          let username;
          
          switch (provider) {
            case 'google':
              // Googleの場合は name, full_name, given_name+family_name などの組み合わせを試す
              username = userMetadata.name || userMetadata.full_name;
              
              // nameが取得できない場合は、given_nameとfamily_nameを組み合わせる
              if (!username && (userMetadata.given_name || userMetadata.family_name)) {
                username = [userMetadata.given_name, userMetadata.family_name]
                  .filter(Boolean)
                  .join(' ');
              }
              
              // display_nameがあれば使用
              if (!username && userMetadata.display_name) {
                username = userMetadata.display_name;
              }
              
              console.log('🟢 Google認証からユーザー名を取得:', username);
              break;
              
            case 'github':
              // GitHubの場合は username, name, login などを使用
              username = userMetadata.preferred_username || 
                         userMetadata.username || 
                         userMetadata.name || 
                         userMetadata.login;
              console.log('🟢 GitHub認証からユーザー名を取得:', username);
              break;
              
            case 'twitter':
              // Twitterの場合は name, screen_name などを使用
              username = userMetadata.name || 
                         userMetadata.preferred_username || 
                         userMetadata.screen_name;
              console.log('🟢 Twitter認証からユーザー名を取得:', username);
              break;
              
            case 'apple':
              // Appleの場合は name, email の @ 前などを使用
              username = userMetadata.name || 
                         userMetadata.email?.split('@')[0];
              console.log('🟢 Apple認証からユーザー名を取得:', username);
              break;
              
            default:
              // その他のプロバイダーの場合はメタデータから探索
              username = userMetadata.name || 
                         userMetadata.full_name || 
                         userMetadata.preferred_username || 
                         userMetadata.username || 
                         userMetadata.user_name;
              console.log('🟢 その他の認証からユーザー名を取得:', username);
          }
          
          // ユーザー名が取得できなかった場合はメールアドレスの @ 前を使用
          if (!username && email) {
            username = email.split('@')[0];
            console.log('🟠 メタデータからユーザー名を取得できなかったため、メールアドレスから生成:', username);
          } else {
            console.log('🟢 最終的に使用するユーザー名:', username);
          }
          
          // プロフィールにメールアドレスとユーザー名を保存
          try {
            console.log('🔄 プロフィール情報を保存中...');
            const response = await fetch('/api/auth/save-profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId,
                email,
                username,
                user_metadata: userMetadata,
                provider
              }),
            });
            
            if (!response.ok) {
              console.error('🔴 プロフィール保存エラー:', await response.json());
            } else {
              const result = await response.json();
              console.log('🟢 プロフィール情報が保存されました', result);
            }
            
            // 認証モードに応じたページにリダイレクト
            console.log(`🔄 ${redirectPath}にリダイレクトします`);
            window.location.href = redirectPath;
            return;
            
          } catch (profileError) {
            console.error('🔴 プロフィール保存中にエラーが発生:', profileError);
            // プロフィール保存に失敗しても認証モードに応じたページにリダイレクト
            console.log(`🔄 ${redirectPath}にリダイレクトします`);
            window.location.href = redirectPath;
            return;
          }
          
          // 注：以下のコードは到達しないはずだが、念のために残しておく
          console.log(`🔄 ${redirectPath}にリダイレクトします`);
          window.location.href = redirectPath;
        } else {
          throw new Error('ユーザーセッションが見つかりません');
        }
      } catch (err) {
        console.error('🔴 認証コールバックエラー:', err);
        setError(err instanceof Error ? err.message : '認証処理中にエラーが発生しました');
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [router]);

  // エラーが発生した場合はエラーメッセージを表示
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-prompty-background">
        <div className="w-full max-w-md p-8 text-center">
          <div className="rounded-md bg-red-50 p-4">
            <h2 className="text-lg font-medium text-red-800">認証エラー</h2>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              onClick={() => router.push('/Register')}
              className="mt-4 rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-200"
            >
              登録ページに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 処理中の表示
  return (
    <div className="flex min-h-screen items-center justify-center bg-prompty-background">
      <div className="w-full max-w-md p-8 text-center">
        <div className="rounded-md bg-gray-50 p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900">認証中...</h2>
          <p className="mt-2 text-sm text-gray-600">ログイン情報を処理しています。しばらくお待ちください。</p>
          <div className="mt-4 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-prompty-primary"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 