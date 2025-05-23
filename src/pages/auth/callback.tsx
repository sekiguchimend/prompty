"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

const AuthCallback = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 認証コールバック処理開始...');
        
        // クライアントサイドでのみ実行
        if (typeof window === 'undefined') {
          return;
        }
        
        // URLのハッシュから認証情報を取得
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ 認証コールバックエラー:', error);
          // エラーの場合はログインページにリダイレクト
          router.replace('/Login?error=auth_failed');
          return;
        }

        if (data.session) {
          console.log('✅ 認証成功:', data.session.user.email);
          // 認証成功時はホームページにリダイレクト
          router.replace('/');
        } else {
          console.log('⚠️ セッションが見つかりません');
          // セッションがない場合はログインページにリダイレクト
          router.replace('/Login');
        }
      } catch (error) {
        console.error('❌ 認証コールバック処理エラー:', error);
        router.replace('/Login?error=callback_failed');
      } finally {
        setIsLoading(false);
      }
    };

    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      // URLハッシュが存在する場合のみ処理実行
      if (window.location.hash) {
        handleAuthCallback();
      } else {
        // ハッシュがない場合は直接ホームに移動
        setIsLoading(false);
        router.replace('/');
      }
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-2xl font-bold">認証処理中...</div>
          <div className="animate-spin h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">しばらくお待ちください</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback; 