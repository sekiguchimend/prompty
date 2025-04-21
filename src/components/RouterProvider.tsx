"use client";

import React, { useEffect, useState, memo } from 'react';

// メモ化によるパフォーマンス最適化
export const RouterProvider = memo(({ children }: { children: React.ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // マウント状態を設定（クライアントサイドでのみ実行される）
    setIsMounted(true);
    
    // コンポーネントがマウントされたときにログを出力（開発時のデバッグ用）
    if (process.env.NODE_ENV !== 'production') {
      console.log('RouterProvider mounted');
    }
  }, []);

  // サーバーサイドレンダリング時または初期マウント前は何も表示しない
  if (!isMounted) {
    return null;
  }

  // Next.jsでは実際のルーターは不要なので、子コンポーネントをそのまま返す
  return <>{children}</>;
}); 