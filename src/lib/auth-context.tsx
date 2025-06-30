"use client";

// lib/auth-context.tsx - 完全最適化版
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase-unified';

// 拡張ユーザー型定義（プロフィール情報を含む）
interface ExtendedUser extends User {
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  website?: string;
  location?: string;
  profile_loaded?: boolean;
}

// 認証コンテキストの型定義
interface AuthContextType {
  user: ExtendedUser | null;
  session: Session | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// デバウンス用のユーティリティ
const useDebounce = (callback: () => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(callback, delay);
  }, [callback, delay]);
};

// 認証プロバイダーのコンポーネント
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 基本状態
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // パフォーマンス最適化のための状態
  const [isInitialized, setIsInitialized] = useState(false);
  const sessionRef = useRef<Session | null>(null);
  const profileCacheRef = useRef<{ [userId: string]: ExtendedUser }>({});
  const lastRefreshRef = useRef<number>(0);
  
  // プロフィール情報を取得する関数（メモ化）
  const fetchProfile = useCallback(async (userId: string, session: Session): Promise<ExtendedUser | null> => {
    // キャッシュをチェック
    if (profileCacheRef.current[userId]?.profile_loaded) {
      return profileCacheRef.current[userId];
    }
    
    try {
      setIsProfileLoading(true);
      
      // 🚀 タイムアウト機能付きでプロフィール取得
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('プロフィール取得タイムアウト')), 5000)
      );
      
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const { data: profileData, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('プロフィール取得エラー:', profileError);
      }

      const extendedUser: ExtendedUser = {
        ...session.user,
        ...profileData,
        profile_loaded: true
      };

      // キャッシュに保存
      profileCacheRef.current[userId] = extendedUser;
      
      return extendedUser;
    } catch (err) {
      console.error('プロフィール取得例外:', err);
      return {
        ...session.user,
        profile_loaded: false
      };
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  // 認証状態を更新する関数（メモ化）
  const updateAuthState = useCallback(async (newSession: Session | null, skipProfileFetch = false) => {
    sessionRef.current = newSession;
    setSession(newSession);
    setError(null);

    if (newSession?.user) {
      if (skipProfileFetch) {
        // 基本ユーザー情報のみ設定
        setUser(prev => prev ? { ...prev, ...newSession.user } : newSession.user as ExtendedUser);
      } else {
        // プロフィール情報を含む完全なユーザー情報を取得
        const extendedUser = await fetchProfile(newSession.user.id, newSession);
        setUser(extendedUser);
      }
    } else {
      setUser(null);
      // キャッシュをクリア
      profileCacheRef.current = {};
    }
    
    setIsLoading(false);
  }, [fetchProfile]);

  // 認証状態を手動でリフレッシュ（デバウンス付き）
  const refreshAuth = useCallback(async () => {
    const now = Date.now();
    // 1秒以内の重複呼び出しを防ぐ
    if (now - lastRefreshRef.current < 1000) {
      return;
    }
    lastRefreshRef.current = now;
    
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('認証リフレッシュエラー:', error);
        setError(error.message);
        setIsLoading(false); // 🚀 エラー時もローディング解除
        return;
      }
      await updateAuthState(data.session, true); // プロフィール取得をスキップ
    } catch (err) {
      console.error('認証リフレッシュ例外:', err);
      setError(err instanceof Error ? err.message : '認証の更新に失敗しました');
      setIsLoading(false); // 🚀 例外時もローディング解除
    }
  }, [updateAuthState]);

  // プロフィール情報のみリフレッシュ
  const refreshProfile = useCallback(async () => {
    if (!sessionRef.current?.user) return;
    
    const userId = sessionRef.current.user.id;
    // キャッシュを無効化
    delete profileCacheRef.current[userId];
    
    const extendedUser = await fetchProfile(userId, sessionRef.current);
    setUser(extendedUser);
  }, [fetchProfile]);

  // デバウンスされたリフレッシュ関数
  const debouncedRefresh = useDebounce(refreshAuth, 500);

  // サインアウト処理（メモ化）
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      sessionRef.current = null;
      setSession(null);
      setUser(null);
      setError(null);
      profileCacheRef.current = {};
    } catch (err) {
      console.error('ログアウトエラー:', err);
      setError(err instanceof Error ? err.message : 'ログアウトに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // 初期化とメイン認証状態リスナー
  useEffect(() => {
    let isMounted = true;
    let authSubscription: any = null;
    
    const initializeAuth = async () => {
      try {
        // 初期セッション取得
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('初期セッション取得エラー:', error);
          setError(error.message);
          if (isMounted) {
            setIsLoading(false); // エラー時もローディング解除
          }
          return;
        }
        
        if (isMounted) {
          // 🚀 最適化: 初期化時はプロフィール取得をスキップしてすぐにローディング解除
          await updateAuthState(data.session, true);
          setIsInitialized(true);
            
          // プロフィール情報は別途バックグラウンドで取得
          if (data.session?.user) {
            fetchProfile(data.session.user.id, data.session).then(extendedUser => {
              if (isMounted && extendedUser) {
                setUser(extendedUser);
              }
            }).catch(err => {
              console.warn('バックグラウンドプロフィール取得エラー:', err);
            });
          }
        }
      } catch (err) {
        console.error('認証初期化エラー:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : '認証の初期化に失敗しました');
          setIsLoading(false);
        }
      }
    };
    
    // 認証状態変更リスナー（統合された単一のリスナー）
    const setupAuthListener = () => {
      authSubscription = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!isMounted) return;
        
        console.log('🔄 Auth state changed:', event);
        
        try {
          switch (event) {
            case 'SIGNED_IN':
            case 'TOKEN_REFRESHED':
              await updateAuthState(newSession, event === 'TOKEN_REFRESHED');
              break;
            case 'SIGNED_OUT':
              sessionRef.current = null;
                setSession(null);
                setUser(null);
              setError(null);
              profileCacheRef.current = {};
              setIsLoading(false);
              break;
            case 'USER_UPDATED':
              if (newSession?.user && sessionRef.current) {
                // ユーザー情報更新時はプロフィールキャッシュを無効化
                delete profileCacheRef.current[newSession.user.id];
                await updateAuthState(newSession, true); // 🚀 プロフィール取得をスキップ
              }
              break;
          }
        } catch (err) {
          console.error('認証状態変更処理エラー:', err);
          setError(err instanceof Error ? err.message : '認証状態の更新に失敗しました');
          // 🚀 エラー時も確実にローディング解除
          setIsLoading(false);
        }
      });
    };

    // 初期化とリスナー設定
    initializeAuth();
    setupAuthListener();

    // 最小限のイベントリスナー（visibilitychange のみ）
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isInitialized) {
        debouncedRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // クリーンアップ
    return () => {
      isMounted = false;
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateAuthState, debouncedRefresh, isInitialized]);

  // コンテキスト値をメモ化
  const contextValue = useMemo(() => ({
    user,
    session,
    isLoading,
    isProfileLoading,
    error,
    signOut,
    refreshAuth,
    refreshProfile
  }), [user, session, isLoading, isProfileLoading, error, signOut, refreshAuth, refreshProfile]);
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// カスタムフック（エラーハンドリング付き）
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// 軽量な認証チェック用フック
export const useAuthCheck = () => {
  const { user, isLoading } = useAuth();
  
  return useMemo(() => ({
    isAuthenticated: !!user,
    isLoading,
    userId: user?.id || null
  }), [user, isLoading]);
};

// プロフィール情報専用フック
export const useProfile = () => {
  const { user, isProfileLoading, refreshProfile } = useAuth();
  
  return useMemo(() => ({
    profile: user ? {
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      website: user.website,
      location: user.location
    } : null,
    isLoading: isProfileLoading,
    refresh: refreshProfile
  }), [user, isProfileLoading, refreshProfile]);
};