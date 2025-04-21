"use client";

import React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/lib/auth-context';

// 管理者メールアドレスとドメインを定義
const ADMIN_EMAILS = [
  'queue@queue-tech.jp'
];

// 管理者かどうかをチェックする関数
const isAdminUser = (email: string | null | undefined): boolean => {
  if (!email) {
    console.log('ADMIN CHECK: Email is null or undefined');
    return false;
  }
  
  console.log('ADMIN CHECK - Email:', email);
  console.log('ADMIN LIST:', ADMIN_EMAILS);
  
  // 特定のメールアドレスリストに含まれるかチェック
  // 大文字小文字を区別せずに比較
  const normalizedEmail = email.toLowerCase().trim();
  
  // すべての許可リストのメールアドレスも正規化
  const normalizedAdminEmails = ADMIN_EMAILS.map(e => e.toLowerCase().trim());
  
  // 正規化したメールアドレスでチェック
  if (normalizedAdminEmails.includes(normalizedEmail)) {
    console.log('ADMIN CHECK - Matched by email list');
    return true;
  }
  
  // 特定のドメインを持つメールアドレスかチェック - 無効化
  // const isDomainMatch = 
  //   normalizedEmail.endsWith('@queuetech.jp') || 
  //   normalizedEmail.endsWith('@queue-tech.jp');
  
  // console.log('ADMIN CHECK - Domain match:', isDomainMatch);
  
  // 最終的な結果をログに出力
  const isAdmin = normalizedAdminEmails.includes(normalizedEmail);
  console.log('ADMIN CHECK - Final result:', isAdmin);
  
  return isAdmin;
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  // ユーザー情報のデバッグ出力
  useEffect(() => {
    if (user) {
      console.log('==== USER DEBUG INFO ====');
      console.log('User object:', user);
      console.log('User ID:', user.id);
      console.log('User email:', user.email);
      console.log('User role:', user.role);
      console.log('User metadata:', user.user_metadata);
      console.log('========================');
    } else if (!isLoading) {
      console.log('==== NO USER FOUND ====');
    }
  }, [user, isLoading]);

  // 管理者かどうかをチェック
  useEffect(() => {
    const checkAdmin = () => {
      if (!isLoading) {
        console.log('管理者チェック - ユーザーメール:', user?.email);
        
        if (!user) {
          console.log('未ログイン - ホームページへリダイレクト');
          router.push('/');
          return;
        }
        
        // 強制的に管理者として扱う（デバッグ用）
        // 本番環境では削除すること
        const DEBUG_MODE = false;
        if (DEBUG_MODE) {
          console.log('デバッグモード: 管理者として認証します');
          setIsAuthorized(true);
          return;
        }
        
        const isAdmin = isAdminUser(user.email);
        console.log('管理者チェック結果:', isAdmin);
        
        if (!isAdmin) {
          console.log('管理者でない - ホームページへリダイレクト');
          router.push('/');
          return;
        }
        
        console.log('管理者として認証成功');
        setIsAuthorized(true);
      }
    };
    
    checkAdmin();
  }, [user, isLoading, router]);

  // ローディング中は読み込み中を表示
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <span className="ml-3">認証確認中...</span>
      </div>
    );
  }

  // デバッグモードのためにスキップ
  // 未認証時は権限がない旨を表示
  // if (!isAuthorized && !isLoading) {
  //   return (
  //     <div className="flex justify-center items-center h-screen">
  //       <div className="text-center">
  //         <h1 className="text-xl font-bold mb-2">権限がありません</h1>
  //         <p className="text-gray-600 mb-4">このページにアクセスする権限がありません。</p>
  //         <p className="text-gray-600 mb-4">Email: {user?.email}</p>
  //         <button 
  //           onClick={() => router.push('/')}
  //           className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
  //         >
  //           ホームに戻る
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="pt-20 pb-6">
      {children}
    </div>
  );
} 