// pages/_app.tsx
import { useEffect } from 'react';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../lib/auth-context';
import { useRouter } from 'next/router';
import { Toaster } from '../components/ui/toaster';
import Head from 'next/head';
import Header from '../components/Header';
import "../styles/NotePage.css"
import '../index.css';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // プリロード警告を抑制するための設定
  useEffect(() => {
    // プリロードされたリソースの使用を促進
    const handleRouteChangeComplete = () => {
      // ページ遷移完了時にプリロードされた画像を強制的に使用
      const preloadedImages = document.querySelectorAll('link[rel="preload"][as="image"]');
      preloadedImages.forEach((link) => {
        const img = new Image();
        img.src = (link as HTMLLinkElement).href;
      });
    };

    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router.events]);

  return (
    <>
      <Head>
        <title>Prompty - プロンプト共有・販売プラットフォーム</title>
        <meta name="description" content="LLMを活用したプロンプト共有・販売プラットフォーム" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        
        {/* ファビコン設定 */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        
        {/* OGP設定 */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Prompty - プロンプト共有・販売プラットフォーム" />
        <meta property="og:description" content="LLMを活用したプロンプト共有・販売プラットフォーム" />
        <meta property="og:image" content="/og-image.png" />
      </Head>
      <AuthProvider>
        <Header />
        <Component {...pageProps} />
        <Toaster />
      </AuthProvider>
    </>
  );
}

export default MyApp;