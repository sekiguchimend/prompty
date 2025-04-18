"use client";

// lib/auth-context.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

// セッションの持続化のための定数
const SESSION_STORAGE_KEY = 'prompty_session';
const SESSION_EXPIRY_WINDOW = 30 * 24 * 60 * 60 * 1000; // 30日間 (ミリ秒)

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
  
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(persistedSession));
    console.log('セッションを保存しました。有効期限:', new Date(Date.now() + SESSION_EXPIRY_WINDOW));
  } catch (error) {
    console.error('セッション保存エラー:', error);
  }
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
  const [lastRefreshed, setLastRefreshed] = useState<number>(0);
  
  // トークンのリフレッシュ処理
  const refreshToken = async (currentSession: Session) => {
    const now = Date.now();
    
    // 1時間に1回だけリフレッシュする（過剰なリフレッシュを防止）
    if (now - lastRefreshed < 60 * 60 * 1000) {
      return currentSession;
    }
    
    try {
      console.log('トークンをリフレッシュしています...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('トークンリフレッシュエラー:', error);
        return currentSession;
      }
      
      if (data.session) {
        console.log('トークンリフレッシュ成功');
        setLastRefreshed(now);
        return data.session;
      }
      
      return currentSession;
    } catch (error) {
      console.error('トークンリフレッシュ例外:', error);
      return currentSession;
    }
  };
  
  // 初期化時のセッション取得処理
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('認証初期化を開始します...');
        // ローカルストレージからセッションを取得
        const storedSession = getStoredSession();
        
        if (storedSession) {
          console.log('ローカルストレージからセッションを復元しました');
          // ローカルストレージに有効なセッションがある場合
          supabase.auth.setSession({
            access_token: storedSession.access_token,
            refresh_token: storedSession.refresh_token
          });
          
          setSession(storedSession);
          setUser(storedSession.user);
          
          // 保存されたセッションがあれば自動的にリフレッシュを試みる
          const refreshedSession = await refreshToken(storedSession);
          if (refreshedSession !== storedSession) {
            setSession(refreshedSession);
            setUser(refreshedSession.user);
            persistSession(refreshedSession);
          }
        }
        
        // Supabaseから最新のセッション情報を取得
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('セッション取得エラー:', error);
          throw error;
        }
        
        if (data.session) {
          console.log('Supabaseから新しいセッションを取得しました');
          setSession(data.session);
          setUser(data.session.user);
          persistSession(data.session);
        } else if (!storedSession) {
          // Supabaseからもローカルストレージからもセッションが取得できなかった場合
          console.log('セッションが存在しません');
          setSession(null);
          setUser(null);
          persistSession(null);
        }
      } catch (error) {
        console.error('認証初期化エラー:', error);
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
      async (event: string, newSession: Session | null) => {
        console.log('認証状態の変更:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('ログイン検出 or トークンリフレッシュ');
          setSession(newSession);
          setUser(newSession?.user || null);
          persistSession(newSession);
          if (event === 'TOKEN_REFRESHED') {
            setLastRefreshed(Date.now());
          }
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('ログアウト検出');
          setSession(null);
          setUser(null);
          persistSession(null);
        }
        
        if (event === 'USER_UPDATED') {
          console.log('ユーザー情報更新');
          setSession(newSession);
          setUser(newSession?.user || null);
          persistSession(newSession);
        }
      }
    );
    
    // 定期的なトークンリフレッシュ (8時間ごと)
    const refreshInterval = setInterval(async () => {
      if (session) {
        console.log('定期的なトークンリフレッシュを実行');
        const refreshedSession = await refreshToken(session);
        if (refreshedSession !== session) {
          setSession(refreshedSession);
          setUser(refreshedSession.user);
          persistSession(refreshedSession);
        }
      }
    }, 8 * 60 * 60 * 1000);
    
    // 初期化を実行
    initializeAuth();
    
    // クリーンアップ時にリスナーとインターバルを削除
    return () => {
      authListener?.subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);
  
  // サインアウト処理
  const signOut = async () => {
    try {
      console.log('ログアウト処理を開始...');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      persistSession(null);
      console.log('ログアウト完了');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      // エラーが発生しても強制的にクリア
      setUser(null);
      setSession(null);
      persistSession(null);
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