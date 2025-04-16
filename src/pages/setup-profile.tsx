"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

export default function SetupProfile() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState('');
  const [bio, setBio] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [initialUsername, setInitialUsername] = useState('');

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        // Supabaseクライアントの初期化
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // URLからハッシュフラグメントを取得（認証コールバック処理）
        if (typeof window !== 'undefined') {
          const hashFragment = window.location.hash;
          if (hashFragment) {
            // 認証コールバックからハッシュフラグメントがある場合、セッションを処理
            console.log('🔄 認証コールバックからのハッシュフラグメントを処理中...');
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              throw error;
            }
            
            // ハッシュフラグメントをクリア（URLを綺麗にする）
            window.history.replaceState(null, '', window.location.pathname);
          }
        }

        // セッション情報を取得
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        // セッションが存在しない場合はログインページにリダイレクト
        if (!session || !session.user) {
          router.push('/Login');
          return;
        }

        const { id: userId, email } = session.user;
        const userMetadata = session.user.user_metadata || {};
        const provider = session.user.app_metadata?.provider;
        
        setUserId(userId);

        // プロバイダー別の名前取得ロジック
        let username;
        
        switch (provider) {
          case 'google':
            username = userMetadata.name || userMetadata.full_name;
            if (!username && (userMetadata.given_name || userMetadata.family_name)) {
              username = [userMetadata.given_name, userMetadata.family_name]
                .filter(Boolean)
                .join(' ');
            }
            break;
            
          case 'github':
            username = userMetadata.preferred_username || 
                      userMetadata.username || 
                      userMetadata.name || 
                      userMetadata.login;
            break;
            
          case 'twitter':
            username = userMetadata.name || 
                      userMetadata.preferred_username || 
                      userMetadata.screen_name;
            break;
            
          case 'apple':
            username = userMetadata.name || 
                      userMetadata.email?.split('@')[0];
            break;
            
          default:
            username = userMetadata.name || 
                      userMetadata.full_name || 
                      userMetadata.preferred_username || 
                      userMetadata.username || 
                      userMetadata.user_name;
        }
        
        // ユーザー名が取得できなかった場合はメールアドレスの @ 前を使用
        if (!username && email) {
          username = email.split('@')[0];
        }

        // プロフィール情報の初期保存
        try {
          console.log('🔄 プロフィール情報を初期保存中...');
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
            console.error('🔴 プロフィール初期保存エラー:', await response.json());
          } else {
            console.log('🟢 プロフィール情報が初期保存されました');
          }
        } catch (profileError) {
          console.error('🔴 プロフィール初期保存中にエラーが発生:', profileError);
        }

        setAccountName(username || '');
        setInitialUsername(username || '');
        setIsLoading(false);

      } catch (err) {
        console.error('プロフィール読み込みエラー:', err);
        setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim() || !userId) return;

    setIsSaving(true);
    try {
      // Supabaseクライアントの初期化
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // プロフィールを更新
      const { error } = await supabase
        .from('profiles')
        .update({ 
          account_name: accountName.trim(),
          bio: bio.trim() || null
        })
        .eq('id', userId);

      if (error) throw error;

      // 設定が完了したらホームに遷移
      router.push('/');
    } catch (err) {
      console.error('プロフィール設定エラー:', err);
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // ローディング中
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-prompty-background">
        <div className="w-full max-w-md p-8 text-center">
          <div className="rounded-md bg-gray-50 p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900">読み込み中...</h2>
            <div className="mt-4 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-prompty-primary"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-prompty-background items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/">
            <img src="/prompty_logo.jpg" alt="Prompty" className="h-20 mx-auto" />
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold mb-6">プロフィール設定</h1>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 mb-4 rounded-md text-sm">
              <p>{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block mb-2 font-medium">ユーザー名 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="ユーザー名を入力"
                required
                className="border rounded-md px-4 py-2 w-full bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">他のユーザーに表示される名前です</p>
            </div>
            
            <div className="mb-8">
              <label className="block mb-2 font-medium">自己紹介</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="自己紹介を入力（任意）"
                className="border rounded-md px-4 py-2 w-full bg-gray-50 resize-none"
                rows={4}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">200文字まで入力できます</p>
            </div>
            
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('ユーザー名を設定せずに続けますか？後からプロフィール設定で変更できます。')) {
                    router.push('/');
                  }
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                スキップして続ける
              </button>
              
              <button
                type="submit"
                disabled={isSaving}
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-md"
              >
                {isSaving ? '保存中...' : '保存して続ける'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 