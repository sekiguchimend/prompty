"use client";

// lib/auth-context.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

// セッションの持続化のための定数
const SESSION_STORAGE_KEY = 'prompty_session';
const SESSION_EXPIRY_WINDOW = 12 * 60 * 60 * 1000; // 12時間 (ミリ秒)

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// セッションのローカルストレージへの保存と取得
const persistSession = (session: Session | null) => {
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  
  const persistedSession = {
    ...session,
    expiresAt: Date.now() + SESSION_EXPIRY_WINDOW
  };
  
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(persistedSession));
};

// ローカルストレージからのセッション取得
const getStoredSession = (): Session | null => {
  try {
    const storedData = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!storedData) return null;
    
    const parsedSession = JSON.parse(storedData);
    
    // セッションの有効期限をチェック
    if (parsedSession.expiresAt && parsedSession.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    
    return parsedSession;
  } catch (error) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
};

// コンポーネントとURLの情報を取得
function getDebugInfo() {
  let url = '';
  let path = '';
  
  // クライアントサイドでのみ実行
  if (typeof window !== 'undefined') {
    url = window.location.href;
    path = window.location.pathname;
    
    console.log('Current URL:', url);
    console.log('Current Path:', path);
  }
  
  return { url, path };
}

// 詳細なコンポーネントスタックを取得
function getDetailedComponentStack() {
  const stack = new Error().stack || '';
  const stackLines = stack.split('\n').slice(1); // 最初の行を除外
  
  console.log('----------- Component Stack -----------');
  stackLines.forEach((line, index) => {
    console.log(`${index}: ${line.trim()}`);
  });
  console.log('--------------------------------------');
  
  return stackLines;
}

// 認証プロバイダーのコンポーネント
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 初期化時のセッション取得処理
  useEffect(() => {
    const initializeAuth = async () => {
      // ローカルストレージからセッションを取得
      const storedSession = getStoredSession();
      
      if (storedSession) {
        // ローカルストレージに有効なセッションがある場合
        supabase.auth.setSession({
          access_token: storedSession.access_token,
          refresh_token: storedSession.refresh_token
        });
        
        setSession(storedSession);
        setUser(storedSession.user);
      }
      
      // Supabaseから最新のセッション情報を取得
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          persistSession(data.session);
        } else {
          setSession(null);
          setUser(null);
          persistSession(null);
        }
      } catch (error) {
        // 認証エラー時はリセット
        setSession(null);
        setUser(null);
        persistSession(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    // 認証状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: string, newSession: Session | null) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(newSession);
          setUser(newSession?.user || null);
          persistSession(newSession);
        }
        
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          persistSession(null);
        }
        
        if (event === 'USER_UPDATED') {
          setSession(newSession);
          setUser(newSession?.user || null);
          persistSession(newSession);
        }
      }
    );
    
    // 初期化を実行
    initializeAuth();
    
    // クリーンアップ時にリスナーを削除
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  // サインアウト処理
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      persistSession(null);
    } catch (error) {
      // サインアウト時のエラーハンドリング（必要に応じてエラーレポート）
    }
  };
  
  // コンテキストの値を提供
  const value = {
    user,
    session,
    isLoading,
    signOut
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Authコンテキストを使用するためのカスタムフック
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};