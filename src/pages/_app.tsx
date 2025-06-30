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
import { notoSansJP } from '../lib/fonts';
import { preloadCriticalImages } from '../lib/image-optimization';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // 統合プリロードサービスを使用
  useEffect(() => {
    const handleRouteChangeComplete = () => {
      // デフォルト画像をプリロード
      const criticalImages = ['/images/default-thumbnail.svg', '/images/default-avatar.svg'];
      preloadCriticalImages(criticalImages);
    };

    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router.events]);

  return (
    <>
      <Head>
        {/* 基本SEO設定 */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="author" content="Prompty" />
        <meta name="language" content="Japanese" />
        <meta name="geo.region" content="JP" />
        <meta name="geo.country" content="Japan" />
        
        {/* 検索エンジン最適化 */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="bingbot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        
        {/* PWA対応 */}
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="application-name" content="Prompty" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Prompty" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="no" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* ファビコン設定 */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        
        {/* DNS prefetch */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        
        {/* Preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <AuthProvider>
        <div className={notoSansJP.className}>
          <Header />
          <div className="header-spacing">
            <Component {...pageProps} />
          </div>
          <Toaster />
        </div>
      </AuthProvider>
    </>
  );
}

export default MyApp;