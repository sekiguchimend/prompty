"use client";

import React, { Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '../src/lib/auth-context';

// Dynamically import the HomePage component with optimized loading strategy
const HomePage = dynamic(() => import('../src/components/HomePage'), {
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
      router.prefetch('/Following');
    }
  }, [router, user]);

  return (
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
  );
} 