// pages/_app.tsx
import { useEffect } from 'react';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../lib/auth-context';
import { useRouter } from 'next/router';
import { initializeSupabaseSession, validateSession } from '../lib/supabaseClient';
import { Toaster } from '../components/ui/toaster';
import Head from 'next/head';
import "../styles/NotePage.css"
// セッション検証のデバウンス状態管理
let isValidating = false;
let lastValidationTime = 0;
const VALIDATION_COOLDOWN = 5000; // 5秒間のクールダウン

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // ページ遷移時にセッションを検証
  useEffect(() => {
    const handleRouteChange = async (url: string) => {
      // セッション検証が現在実行中の場合やクールダウン中の場合はスキップ
      const now = Date.now();
      if (isValidating || now - lastValidationTime < VALIDATION_COOLDOWN) {
        return;
      }

      try {
        isValidating = true;
        console.log('ページ遷移を検出: セッション検証を実行...', url);
        
        // Supabaseセッションの初期化を試みる
        await initializeSupabaseSession();
        
        // セッション検証
        const sessionValid = await validateSession();
        console.log('セッション検証結果:', sessionValid ? '有効' : '無効');
        
        // 保護されたルートでセッションが無効な場合、ログインページにリダイレクト
        const protectedRoutes = ['/profile', '/dashboard', '/settings', '/prompts/create'];
        const isProtectedRoute = protectedRoutes.some(route => url.startsWith(route));
        
        if (!sessionValid && isProtectedRoute) {
          console.log('保護されたルートへのアクセスを試みましたが、セッションが無効です');
          router.replace('/login?redirect=' + encodeURIComponent(url));
        }
      } catch (error) {
        console.error('ルート変更時のセッション検証エラー:', error);
      } finally {
        isValidating = false;
        lastValidationTime = Date.now();
      }
    };

    // 初期ロード時にセッションを初期化
    (async () => {
      try {
        const initialized = await initializeSupabaseSession();
        console.log('初期セッション初期化:', initialized ? '成功' : '失敗');
        
        // 現在のルートが保護されたルートで、セッションが無効な場合はリダイレクト
        const currentPath = router.pathname;
        const protectedRoutes = ['/profile', '/dashboard', '/settings', '/prompts/create'];
        const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));
        
        if (isProtectedRoute) {
          const sessionValid = await validateSession();
          if (!sessionValid) {
            console.log('保護されたルートへのアクセスを試みましたが、セッションが無効です');
            router.replace('/login?redirect=' + encodeURIComponent(currentPath));
          }
        }
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
        
        {/* ファビコン設定 */}
        <link rel="icon" href="https://prompty-ai.com/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="https://prompty-ai.com/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="https://prompty-ai.com/apple-touch-icon.png" type="image/png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* OGP設定 */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Prompty - プロンプト共有・販売プラットフォーム" />
        <meta property="og:description" content="LLMを活用したプロンプト共有・販売プラットフォーム" />
        <meta property="og:image" content="https://prompty-ai.com/og-image.png" />
      </Head>
      <AuthProvider>
        <Component {...pageProps} />
        <Toaster />
      </AuthProvider>
    </>
  );
}

export default MyApp;