import { useEffect, useCallback } from 'react';
import { supabase, forceAuthSync, getInstanceId } from '../lib/supabase-unified';
import { useAuth } from '../lib/auth-context';

/**
 * 認証状態の同期を管理するカスタムフック
 * 複数のコンポーネント間でログイン状態の整合性を保つ
 */
export const useAuthSync = () => {
  const { user, session } = useAuth();

  // 認証状態を強制的に同期する関数
  const syncAuthState = useCallback(async () => {
    try {
      console.log(`🔄 Manual auth sync triggered (${getInstanceId()})`);
      const syncedSession = await forceAuthSync();
      return syncedSession;
    } catch (error) {
      console.error('🔴 Manual auth sync failed:', error);
      return null;
    }
  }, []);

  // ページの可視性が変更された時に認証状態を同期
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Page became visible, syncing auth state');
        syncAuthState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncAuthState]);

  // フォーカス時に認証状態を同期
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Window focused, syncing auth state');
      syncAuthState();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [syncAuthState]);

  // ローカルストレージの変更を監視
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'supabase.auth.token') {
        console.log('🔄 Auth token storage changed, syncing auth state');
        syncAuthState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [syncAuthState]);

  return {
    user,
    session,
    syncAuthState,
    instanceId: getInstanceId()
  };
}; 