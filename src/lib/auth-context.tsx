"use client";

// lib/auth-context.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

// ローカルストレージのキー
const STORAGE_KEY = 'supabase.auth.token';

type AuthContextType = {
  user: any;
  session: any;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

// セッションをローカルストレージに保存する関数
function persistSession(session: any) {
  if (!session) return;
  
  try {
    console.log('🔄 Persisting session to localStorage');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('🔴 Failed to persist session:', error);
  }
}

// ローカルストレージからセッションを取得する関数
function getPersistedSession() {
  try {
    const storedSession = localStorage.getItem(STORAGE_KEY);
    if (!storedSession) return null;
    
    const parsedSession = JSON.parse(storedSession);
    
    // セッションの有効期限をチェック
    if (parsedSession.expires_at) {
      const expiresAt = new Date(parsedSession.expires_at).getTime();
      const now = new Date().getTime();
      
      if (now >= expiresAt) {
        console.log('🟠 Stored session expired, removing');
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
    }
    
    return parsedSession;
  } catch (error) {
    console.error('🔴 Error reading stored session:', error);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('🔍 AuthProvider initialized');
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // デバッグ情報を取得
  const { url, path } = getDebugInfo();
  console.log(`🔍 AuthProvider mounted at path: ${path}`);

  useEffect(() => {
    // 初期セッションの取得
    const getInitialSession = async () => {
      try {
        console.log('🔍 Getting initial session');
        
        // 1. ローカルストレージから保存されたセッションを試みる
        const storedSession = getPersistedSession();
        if (storedSession) {
          console.log('🟢 Found valid session in localStorage');
          
          // Supabaseにセッションを設定
          try {
            await supabase.auth.setSession({
              access_token: storedSession.access_token,
              refresh_token: storedSession.refresh_token
            });
            console.log('🟢 Session set in Supabase client');
          } catch (setError) {
            console.error('🔴 Error setting session:', setError);
          }
          
          setSession(storedSession);
          setUser(storedSession.user || null);
        }
        
        // 2. supabaseから現在のセッションを取得
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('🔴 認証エラー:', error);
          throw error;
        }
        
        console.log('🟢 Session retrieved from Supabase:', data.session ? 'exists' : 'null');
        
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user || null);
          
          // 新しいセッションをローカルストレージに保存
          persistSession(data.session);
          
          if (data.session.user) {
            console.log('🟢 User ID:', data.session.user.id);
            console.log('🟢 User email:', data.session.user.email);
          }
        } else if (!storedSession) {
          // ストレージにもSupabaseにもセッションがない場合
          console.log('🟠 No authenticated user found');
        }
      } catch (error) {
        console.error('🔴 認証エラー詳細:', error);
      } finally {
        console.log('🟢 Initial loading complete');
        setIsLoading(false);
      }
    };

    getInitialSession();

    // 認証変更のリスナー
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('🟢 User signed in or token refreshed');
          setSession(newSession);
          setUser(newSession?.user || null);
          
          // セッションをローカルストレージに保存
          if (newSession) {
            persistSession(newSession);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('🟠 User signed out');
          setSession(null);
          setUser(null);
          localStorage.removeItem(STORAGE_KEY);
        } else if (event === 'USER_UPDATED') {
          console.log('🟢 User updated');
          setSession(newSession);
          setUser(newSession?.user || null);
          
          // 更新されたセッションを保存
          if (newSession) {
            persistSession(newSession);
          }
        }
        
        if (newSession?.user) {
          console.log('🟢 New user state - User ID:', newSession.user.id);
        } else if (event !== 'SIGNED_OUT') {
          console.log('🟠 New user state - No user');
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      console.log('🧹 AuthProvider cleanup - path:', path);
      subscription.unsubscribe();
    };
  }, [path]);

  const signOut = async () => {
    try {
      console.log('🔄 Signing out user');
      // ローカルストレージからセッション情報を削除
      localStorage.removeItem(STORAGE_KEY);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('🔴 ログアウトエラー:', error);
        throw error;
      }
      console.log('🟢 Signed out successfully');
      
      // セッション情報をクリア
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('🔴 ログアウト処理エラー:', error);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signOut,
  };

  console.log('🔄 AuthProvider rendering - Path:', path);
  console.log('🔄 isLoading:', isLoading, 'user:', user ? 'exists' : 'null');
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// カスタムフック
export function useAuth() {
  const { url, path } = getDebugInfo();
  console.log('🔍 useAuth called from path:', path);
  const stackLines = getDetailedComponentStack();
  
  // コンポーネント名の抽出を試みる
  let callerComponent = 'Unknown';
  for (const line of stackLines) {
    const match = line.match(/at\s+([A-Za-z0-9_]+)\s+\(/);
    if (match && match[1] && match[1] !== 'useAuth' && match[1] !== 'getDetailedComponentStack') {
      callerComponent = match[1];
      break;
    }
  }
  
  console.log('🔍 Called from component:', callerComponent);
  
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('🔴 AUTH CONTEXT IS UNDEFINED at path:', path);
    console.error('🔴 Caller component:', callerComponent);
    
    // DOM情報からコンポーネントの階層を推測
    try {
      if (typeof window !== 'undefined' && document) {
        console.log('🔍 Attempting to trace DOM hierarchy');
        const componentTree = [];
        let element = document.activeElement;
        while (element && element !== document.body) {
          componentTree.push(element.tagName + (element.id ? `#${element.id}` : ''));
          element = element.parentElement;
        }
        
        if (componentTree.length > 0) {
          console.error('🔴 DOM path:', componentTree.reverse().join(' > '));
        } else {
          console.error('🔴 Could not determine DOM path');
        }
        
        // ページ内の最上位コンポーネントを表示
        console.log('🔍 Page structure:');
        const rootElements = document.body.children;
        Array.from(rootElements).forEach((el, index) => {
          console.log(`Root element ${index}:`, el.tagName, el.id ? `id="${el.id}"` : '');
        });
      }
    } catch (e) {
      console.error('🔴 Failed to trace component tree:', e);
    }
    
    throw new Error(`useAuth must be used within an AuthProvider (called from ${callerComponent} at ${path})`);
  }
  
  console.log('🟢 Auth context found, user:', context.user ? 'exists' : 'null');
  return context;
}