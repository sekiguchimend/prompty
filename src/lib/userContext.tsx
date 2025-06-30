import React, { createContext, useContext } from 'react';
import { useProfile, useAuth } from './auth-context';

// ユーザー型定義（下位互換性のため維持）
export interface User {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  // 必要に応じて他のユーザープロパティを追加
}

// コンテキスト型定義（下位互換性のため維持）
interface UserContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refreshUser: () => Promise<void>;
}

// 最適化されたプロバイダーは不要
// 代わりに最適化された認証コンテキストを使用

// 下位互換性のためのカスタムフック（最適化版）
export const useUser = () => {
  const { user, isLoading, error, refreshProfile } = useAuth();
  
  return {
    user: user ? {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar_url: user.avatar_url
    } : null,
    loading: isLoading,
    error: error ? new Error(error) : null,
    refreshUser: refreshProfile,
  };
};

// プロバイダーコンポーネント（最適化版 - パススルー）
export const UserProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // 最適化された認証コンテキストが全てを管理するため、
  // 追加のプロバイダーやリスナーは不要
  return <>{children}</>;
};

export default UserProvider; 