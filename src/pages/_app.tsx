// pages/_app.tsx
import { useEffect } from 'react';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../lib/auth-context';
import { useRouter } from 'next/router';
import { initializeSupabaseSession, validateSession } from '../lib/supabaseClient';
import { Toaster } from '../components/ui/toaster';
import Head from 'next/head';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // ページ遷移時にセッションを検証
  useEffect(() => {
    const handleRouteChange = async () => {
      console.log('ページ遷移を検出: セッション検証を実行...');
      try {
        // Supabaseセッションの初期化を試みる
        await initializeSupabaseSession();
        
        // 定期的なセッション検証（オプション）
        const sessionValid = await validateSession();
        console.log('セッション検証結果:', sessionValid ? '有効' : '無効');
      } catch (error) {
        console.error('ルート変更時のセッション検証エラー:', error);
      }
    };

    // 初期ロード時にセッションを初期化
    (async () => {
      try {
        await initializeSupabaseSession();
      } catch (error) {
        console.error('初期セッション初期化エラー:', error);
      }
    })();

    // ルート変更イベントにリスナーを追加
    router.events.on('routeChangeComplete', handleRouteChange);

    // クリーンアップ
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="https://qrxrulntwojimhhhnwqk.supabase.co/storage/v1/object/public/prompt-thumbnails/prompty_logo.jpg" type="image/jpeg" />
      </Head>
      <AuthProvider>
        <Component {...pageProps} />
        <Toaster />
      </AuthProvider>
    </>
  );
}

export default MyApp;