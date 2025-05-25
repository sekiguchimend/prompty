"use client";

// lib/auth-context.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 認証プロバイダーのコンポーネント
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<number>(0);
  const [isMounted, setIsMounted] = useState(false);
  
  // マウント状態を管理
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // 初期化時のセッション取得処理
  useEffect(() => {
    // マウントされていない場合は何もしない
    if (!isMounted) return;
    
    const initializeAuth = async () => {
      try {
        console.log('🚀 認証コンテキスト初期化開始...');
        // Supabaseから最新のセッション情報を取得
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ セッション取得エラー:', error);
          throw error;
        }
        
        if (data.session) {
          console.log('✅ 既存セッション発見:', data.session.user.email);
          setSession(data.session);
          setUser(data.session.user);
          
          // トークンの有効期限をチェック
          const expiresAt = new Date(data.session.expires_at || 0).getTime();
          const now = new Date().getTime();
          
          // 有効期限が10分以内の場合はリフレッシュ
          if (expiresAt <= now + 600000) {
            console.log('⏰ セッションの期限が近いためリフレッシュ...');
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (!refreshError && refreshData.session) {
              setSession(refreshData.session);
              setUser(refreshData.session.user);
              setLastRefreshed(Date.now());
              console.log('🔄 セッションリフレッシュ完了');
            }
          }
        } else {
          // セッションがない場合
          console.log('🔓 セッションなし - 未ログイン状態');
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('❌ 認証初期化エラー:', error);
        // 認証エラー時はリセット
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
        console.log('✅ 認証コンテキスト初期化完了');
      }
    };
    
    // URLハッシュ変更を検知して認証状態を再チェック
    const handleHashChange = () => {
      console.log('🔄 URLハッシュ変更検知 - 認証状態を再チェック');
      if (typeof window !== 'undefined' && window.location.hash.includes('access_token') || window.location.hash.includes('refresh_token')) {
        console.log('🔑 認証トークンを含むハッシュを検知');
        // 少し待ってから認証状態を再取得
        setTimeout(async () => {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            console.log('✅ ハッシュ変更後の認証成功:', data.session.user.email);
            setSession(data.session);
            setUser(data.session.user);
            setIsLoading(false);
          }
        }, 100);
      }
    };

    // ハッシュ変更イベントを監視（クライアントサイドのみ）
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', handleHashChange);
    }
    
    // 認証状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: string, newSession: Session | null) => {
        console.log('🔑 認証状態変更イベント:', event, newSession ? '有効' : '無効');
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(newSession);
          setUser(newSession?.user || null);
          setIsLoading(false);
          
          if (event === 'TOKEN_REFRESHED') {
            setLastRefreshed(Date.now());
          }
          console.log('✅ ログイン/トークン更新:', newSession?.user?.email);
        }
        
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setIsLoading(false);
          console.log('🔴 ログアウト完了');
        }
        
        if (event === 'USER_UPDATED') {
          setSession(newSession);
          setUser(newSession?.user || null);
          console.log('👤 ユーザー情報更新:', newSession?.user?.email);
        }
      }
    );
    
    // 定期的なトークンリフレッシュ (30分ごと)
    const refreshInterval = setInterval(async () => {
      if (session) {
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            console.error('定期リフレッシュエラー:', error);
            // リフレッシュに失敗した場合、現在のセッション情報が無効である可能性がある
            if (error.message.includes('expired') || error.message.includes('invalid')) {
              setSession(null);
              setUser(null);
            }
          } else if (data.session) {
            setSession(data.session);
            setUser(data.session.user);
            setLastRefreshed(Date.now());
          }
        } catch (e) {
          console.error('定期リフレッシュ例外:', e);
        }
      }
    }, 30 * 60 * 1000); // 30分ごと
    
    // 初期化を実行
    initializeAuth();
    
    // クリーンアップ時にリスナーとインターバルを削除
    return () => {
      authListener?.subscription.unsubscribe();
      clearInterval(refreshInterval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('hashchange', handleHashChange);
      }
    };
  }, [isMounted]);
  
  // サインアウト処理
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('ログアウトエラー:', error);
      // エラーが発生しても強制的にクリア
      setUser(null);
      setSession(null);
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