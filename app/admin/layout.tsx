"use client";

import React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/lib/auth-context';

// 管理者メールアドレスとドメインを定義
const ADMIN_EMAILS = ['queue@queuetech.jp', 'admin@queuetech.jp', 'queue@queue-tech.jp'];

// 管理者かどうかをチェックする関数
const isAdminUser = (email: string | undefined): boolean => {
  if (!email) return false;
  // 特定のメールアドレスリストに含まれるかチェック
  if (ADMIN_EMAILS.includes(email)) return true;
  // 特定のドメインを持つメールアドレスかチェック
  return email.endsWith('@queuetech.jp') || email.endsWith('@queue-tech.jp');
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // 管理者かどうかをチェック
  useEffect(() => {
    const checkAdmin = () => {
      if (!isLoading) {
        console.log('管理者チェック:', user?.email, isAdminUser(user?.email));
        if (!user || !isAdminUser(user.email)) {
          // 管理者でない場合はホームページへリダイレクト
          router.push('/');
        }
      }
    };
    
    checkAdmin();
  }, [user, isLoading, router]);

  // ローディング中または未認証時は何も表示しない
  if (isLoading || (!user && !isLoading)) {
    return <div className="flex justify-center items-center h-screen">認証確認中...</div>;
  }

  // 管理者でない場合は何も表示しない（リダイレクト中）
  if (!user || !isAdminUser(user.email)) {
    return null;
  }

  return (
    <div className="pt-20 pb-6">
      {children}
    </div>
  );
} 