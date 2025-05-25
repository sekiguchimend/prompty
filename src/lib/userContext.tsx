import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// ユーザー型定義
export interface User {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  // 必要に応じて他のユーザープロパティを追加
}

// コンテキスト型定義
interface UserContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refreshUser: () => Promise<void>;
}

// デフォルト値
const defaultUserContext: UserContextType = {
  user: null,
  loading: true,
  error: null,
  refreshUser: async () => {},
};

// コンテキスト作成
const UserContext = createContext<UserContextType>(defaultUserContext);

// カスタムフックを作成
export const useUser = () => useContext(UserContext);

// プロバイダーコンポーネント
export const UserProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ユーザー情報取得関数
  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      // Supabaseから現在のセッションを取得
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        setUser(null);
        return;
      }

      // ユーザー情報を取得
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      // ユーザーデータを設定
      if (userData) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          ...userData
        });
      } else {
        // プロフィールが未作成の場合は基本情報のみ設定
        setUser({
          id: session.user.id,
          email: session.user.email
        });
      }
    } catch (err) {
      console.error('ユーザー情報取得エラー:', err);
      setError(err instanceof Error ? err : new Error('ユーザー情報の取得に失敗しました'));
    } finally {
      setLoading(false);
    }
  };

  // 初期ロード時にユーザー情報取得
  useEffect(() => {
    fetchUser();

    // 認証状態変更をリッスン
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUser();
      } else {
        setUser(null);
      }
    });

    // クリーンアップ関数
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // コンテキスト値
  const value = {
    user,
    loading,
    error,
    refreshUser: fetchUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserProvider; 