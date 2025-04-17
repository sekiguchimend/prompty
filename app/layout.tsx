"use client";

import React from 'react';
import { Inter } from 'next/font/google';
import '../src/index.css';
import './globals.css';
import Header from '../src/components/Header';
import { RouterProvider } from '../src/components/RouterProvider';
import { AuthProvider } from '../src/lib/auth-context';
// フォントの設定

const inter = Inter({ subsets: ['latin'] });

// Metadata cannot be used in Client Components
const title = 'Prompty - プロンプト共有・販売プラットフォーム';
const description = 'LLMを活用したプロンプト共有・販売プラットフォーム';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/prompty_logo.jpg?v=2" sizes="192x192" />
        <link rel="icon" type="image/png" sizes="192x192" href="/prompty_logo.jpg?v=2" />
        <link rel="icon" type="image/jpeg" sizes="192x192" href="/prompty_logo.jpg?v=2" />
        <link rel="apple-touch-icon" sizes="192x192" href="/prompty_logo.jpg?v=2" />
        <link rel="manifest" href="/site.webmanifest?v=2" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileImage" content="/prompty_logo.jpg?v=2" />
        <meta name="msapplication-TileColor" content="#ffffff" />
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