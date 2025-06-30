import { useAuth } from '../lib/auth-context';

/**
 * 認証状態の同期を管理するカスタムフック - 最適化版
 * パフォーマンス改善のため、重複したイベントリスナーを削除し
 * 新しい認証コンテキストが統合管理する
 */
export const useAuthSync = () => {
  const { user, session, refreshAuth } = useAuth();

  // 最適化されたauth-contextが統合管理するため、
  // 重複したイベントリスナーは削除済み
  
  return {
    user,
    session,
    syncAuthState: refreshAuth, // 新しいデバウンス済みリフレッシュ関数を使用
    instanceId: 'optimized' // デバッグ用
  };
}; 