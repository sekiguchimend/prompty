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