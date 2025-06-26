"use client";

// lib/auth-context.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode, startTransition } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, forceAuthSync, getInstanceId } from './supabase-unified';
import { authDiagnostics } from './auth-diagnostics';

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
    startTransition(() => {
      setIsMounted(true);
    });
  }, []);
  
  // 初期化時のセッション取得処理
  useEffect(() => {
    // マウントされていない場合は何もしない
    if (!isMounted) return;
    
    const initializeAuth = async () => {
      try {
        console.log(`🔧 AuthProvider: Initializing with unified client (${getInstanceId()})`);
        
        // 複数インスタンスのチェック
        authDiagnostics.checkForMultipleInstances();
        
        // 強制的に認証状態を同期
        await forceAuthSync();
        
        // Supabaseから最新のセッション情報を取得
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ セッション取得エラー:', error);
          throw error;
        }
        
        // startTransitionで状態更新をラップ
        startTransition(() => {
          if (data.session) {
            console.log('✅ AuthProvider: Session found, setting user', {
              userId: data.session.user.id,
              email: data.session.user.email,
              expiresAt: data.session.expires_at
            });
            setSession(data.session);
            setUser(data.session.user);
            
            // トークンの有効期限をチェック（非同期処理は別途実行）
            const expiresAt = new Date(data.session.expires_at || 0).getTime();
            const now = new Date().getTime();
            
            // 有効期限が10分以内の場合はリフレッシュ（バックグラウンドで実行）
            if (expiresAt <= now + 600000) {
              setTimeout(async () => {
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                
                if (!refreshError && refreshData.session) {
                  startTransition(() => {
                    setSession(refreshData.session!);
                    setUser(refreshData.session!.user);
                    setLastRefreshed(Date.now());
                  });
                }
              }, 100);
            }
          } else {
            // セッションがない場合
            console.log('❌ AuthProvider: No session found');
            setSession(null);
            setUser(null);
          }
          setIsLoading(false);
        });
      } catch (error) {
        console.error('❌ 認証初期化エラー:', error);
        // 認証エラー時はリセット
        startTransition(() => {
          setSession(null);
          setUser(null);
          setIsLoading(false);
        });
      }
    };
    
    // URLハッシュ変更を検知して認証状態を再チェック
    const handleHashChange = () => {
      if (typeof window !== 'undefined' && (window.location.hash.includes('access_token') || window.location.hash.includes('refresh_token'))) {
        // 少し待ってから認証状態を再取得
        setTimeout(async () => {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            startTransition(() => {
              setSession(data.session!);
              setUser(data.session!.user);
              setIsLoading(false);
            });
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
        console.log(`🔄 AuthProvider: Auth state changed - ${event}`, {
          hasSession: !!newSession,
          userId: newSession?.user?.id || null
        });
        
        // startTransitionで状態更新をラップ
        startTransition(() => {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setSession(newSession);
            setUser(newSession?.user || null);
            setIsLoading(false);
            
            if (event === 'TOKEN_REFRESHED') {
              setLastRefreshed(Date.now());
            }
          }
          
          if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            setIsLoading(false);
          }
          
          if (event === 'USER_UPDATED') {
            setSession(newSession);
            setUser(newSession?.user || null);
          }
        });
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
              startTransition(() => {
                setSession(null);
                setUser(null);
              });
            }
          } else if (data.session) {
            startTransition(() => {
              setSession(data.session!);
              setUser(data.session!.user);
              setLastRefreshed(Date.now());
            });
          }
        } catch (e) {
          console.error('定期リフレッシュ例外:', e);
        }
      }
    }, 30 * 60 * 1000); // 30分ごと
    
    // 初期化を実行（遅延を追加してハイドレーション完了を待つ）
    setTimeout(() => {
      initializeAuth();
    }, 100);
    
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
      startTransition(() => {
        setUser(null);
        setSession(null);
      });
    } catch (error) {
      console.error('ログアウトエラー:', error);
      // エラーが発生しても強制的にクリア
      startTransition(() => {
        setUser(null);
        setSession(null);
      });
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