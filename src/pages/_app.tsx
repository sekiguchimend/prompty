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
        <title>Prompty - プロンプト共有・販売プラットフォーム</title>
        <meta name="description" content="LLMを活用したプロンプト共有・販売プラットフォーム" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        
        {/* ファビコン設定 - app/layout.tsxと一致させる */}
        <link rel="icon" href="https://prompty-zeta.vercel.app/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="https://prompty-zeta.vercel.app/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="https://prompty-zeta.vercel.app/favicon.ico" type="image/x-icon" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* OGP設定 */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Prompty - プロンプト共有・販売プラットフォーム" />
        <meta property="og:description" content="LLMを活用したプロンプト共有・販売プラットフォーム" />
        <meta property="og:image" content="https://prompty-zeta.vercel.app/favicon.ico" />
      </Head>
      <AuthProvider>
        <Component {...pageProps} />
        <Toaster />
      </AuthProvider>
    </>
  );
}

export default MyApp;