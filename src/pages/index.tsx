import React, { Suspense, useEffect, startTransition } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth-context';
import Head from 'next/head';
import { generateSiteUrl, getDefaultOgImageUrl } from '../utils/seo-helpers';

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
    // ハイドレーション後にプリフェッチを実行
    const timer = setTimeout(() => {
      startTransition(() => {
        // ユーザーがログインしていれば、フォローページをプリフェッチ
        if (user) {
          router.prefetch('/following');
        }
      });
    }, 100); // 短い遅延でハイドレーション完了を待つ

    return () => clearTimeout(timer);
  }, [router, user]);

  return (
    <>
      <Head>
        <title>Prompty｜プロンプトを売って、広めて、稼げる。新しいAI時代のマーケットプレイス</title>
        <meta name="description" content="業務効率化・自動返信・デザイン生成など、すぐに使えるプロンプトを多数掲載。誰でも気軽にAI活用を始められる、新しいプロンプト共有・販売プラットフォームです。" />
        <meta name="keywords" content="AIプロンプト,プロンプト販売,プロンプトマーケットプレイス,AI収益化,プロンプトエンジニアリング,AI副業,クリエイター収入,プロンプト共有,AI活用,デジタルコンテンツ販売" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={generateSiteUrl('/')} />
        <meta property="og:title" content="Prompty｜プロンプトを売って、広めて、稼げる。新しいAI時代のマーケットプレイス" />
        <meta property="og:description" content="業務効率化・自動返信・デザイン生成など、すぐに使えるプロンプトを多数掲載。誰でも気軽にAI活用を始められる、新しいプロンプト共有・販売プラットフォームです。" />
        <meta property="og:image" content={getDefaultOgImageUrl()} />
        <meta property="og:site_name" content="Prompty" />
        <meta property="og:locale" content="ja_JP" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={generateSiteUrl('/')} />
        <meta name="twitter:title" content="Prompty｜プロンプトを売って、広めて、稼げる。新しいAI時代のマーケットプレイス" />
        <meta name="twitter:description" content="業務効率化・自動返信・デザイン生成など、すぐに使えるプロンプトを多数掲載。誰でも気軽にAI活用を始められる、新しいプロンプト共有・販売プラットフォームです。" />
        <meta name="twitter:image" content={getDefaultOgImageUrl()} />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="author" content="Prompty" />
        <link rel="canonical" href={generateSiteUrl('/')} />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Prompty",
              "description": "業務効率化・自動返信・デザイン生成など、すぐに使えるプロンプトを多数掲載。誰でも気軽にAI活用を始められる、新しいプロンプト共有・販売プラットフォームです。",
              "url": generateSiteUrl(),
              "potentialAction": {
                "@type": "SearchAction",
                "target": generateSiteUrl("/search?q={search_term_string}"),
                "query-input": "required name=search_term_string"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Prompty",
                "url": generateSiteUrl()
              }
            })
          }}
        />
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
