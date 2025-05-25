import React, { Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth-context';
import Head from 'next/head';

// Dynamically import the HomePage component with optimized loading strategy
const HomePage = dynamic(() => import('../components/home-page'), {
  ssr: true,
  loading: () => (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  )
});

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  // ホームページがロードされたら、バックグラウンドでフォローページをプリフェッチ
  useEffect(() => {
    // ユーザーがログインしていれば、フォローページをプリフェッチ
    if (user) {
      router.prefetch('/following');
    }
  }, [router, user]);

  return (
    <>
      <Head>
        <title>Prompty - AIプロンプト共有サービス</title>
        <meta name="description" content="AIプロンプトを共有・検索できるサービスです。ChatGPT、MidJourney、Stable Diffusionなど各種AIツールのプロンプトを見つけましょう。" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <Suspense fallback={
        <div className="h-screen flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="grid grid-cols-2 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-40 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      }>
        <HomePage />
      </Suspense>
    </>
  );
} 
