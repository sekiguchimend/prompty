import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '../src/components/Header';
import { RouterProvider } from '../src/components/RouterProvider';
import { AuthProvider } from '../src/lib/auth-context';

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
      { url: '/prompty_logo.jpg', sizes: '192x192', type: 'image/jpeg' }
    ],
    apple: [
      { url: '/prompty_logo.jpg', sizes: '192x192', type: 'image/jpeg' }
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
    <html lang="ja" suppressHydrationWarning>
      <head>
        {/* ファビコンとアイコン */}
        <link rel="shortcut icon" href="/prompty_logo.jpg" type="image/jpeg" />
        <link rel="icon" href="/prompty_logo.jpg" type="image/jpeg" sizes="any" />
        <link rel="apple-touch-icon" href="/prompty_logo.jpg" />
        <meta name="image" content="/prompty_logo.jpg" />
        
        {/* 頻繁に使用されるページへのプリロード */}
        <link rel="preload" href="/Following" as="document" />
        <link rel="preload" href="/ContestPage" as="document" />
        
        {/* クリティカルなCSSプリロード */}
        <link rel="preload" href="/styles/globals.css" as="style" />
        
        {/* 重要な画像のプリロード */}
        <link rel="preload" href="/prompty_logo.jpg" as="image" type="image/jpeg" />
        <link rel="preload" href="/images/default-thumbnail.svg" as="image" />
        <link rel="preload" href="/images/default-avatar.svg" as="image" />
      </head>
      <body className={inter.className}>
      <AuthProvider>
        <RouterProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
        </RouterProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 