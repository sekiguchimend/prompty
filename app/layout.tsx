import React, { Suspense } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { RouterProvider } from '../src/components/RouterProvider';
import { AuthProvider } from '../src/lib/auth-context';
import dynamic from 'next/dynamic';
import { Noto_Sans_JP } from 'next/font/google';
import { notoSansJP } from '../lib/fonts'; // パスは調整


// コンポーネントの遅延ロード
const Header = dynamic(() => import('../src/components/Header'), {
  loading: () => <div className="h-16 border-b border-gray-200"></div>,
  ssr: true
});

// フォントの設定（サブセットを最適化）
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',    // FLCPを改善するためにフォント表示方法を最適化
  preload: true,      // プリロードを有効化
  fallback: ['system-ui', 'sans-serif'] // フォールバックフォントを指定
});

// メタデータの設定
export const metadata = {
  title: 'Prompty - プロンプト共有・販売プラットフォーム',
  description: 'LLMを活用したプロンプト共有・販売プラットフォーム',
  icons: {
    icon: [
      { url: 'https://prompty-zeta.vercel.app/favicon.ico', type: 'image/x-icon' }
    ],
    shortcut: [
      { url: 'https://prompty-zeta.vercel.app/favicon.ico', type: 'image/x-icon' }
    ],
    apple: [
      { url: 'https://prompty-zeta.vercel.app/favicon.ico', type: 'image/x-icon' }
    ]
  },
  manifest: '/site.webmanifest',
  themeColor: '#ffffff',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Prompty',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  openGraph: {
    type: 'website',
    title: 'Prompty - プロンプト共有・販売プラットフォーム',
    description: 'LLMを活用したプロンプト共有・販売プラットフォーム',
    images: [{ url: 'https://prompty-zeta.vercel.app/favicon.ico' }]
  },
};

// リンクのプリロード設定
export const viewport = {
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning className={notoSansJP.className}>
      <head>
        <link rel="icon" href="https://prompty-zeta.vercel.app/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="https://prompty-zeta.vercel.app/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="https://prompty-zeta.vercel.app/favicon.ico" type="image/x-icon" />
        <meta property="og:image" content="https://prompty-zeta.vercel.app/favicon.ico" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <RouterProvider>
            <div className="relative flex min-h-screen flex-col">
              <Suspense fallback={<div className="h-16 border-b border-gray-200"></div>}>
                <Header />
              </Suspense>
              <main className="flex-1">{children}</main>
            </div>
          </RouterProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 