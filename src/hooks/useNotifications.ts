import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase-unified';
import { 
  getNotificationToken, 
  requestNotificationPermission,
  checkNotificationSupport,
  getNotificationPermission,
  saveFCMToken,
  removeFCMToken,
  onMessageListener,
  validateVapidKey
} from '../lib/firebase';
import { useToast } from './use-toast';

interface FCMToken {
  id: string;
  user_id: string;
  token: string;
  device_info: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface NotificationHook {
  isSupported: boolean;
  permission: NotificationPermission | null;
  isLoading: boolean;
  fcmTokens: FCMToken[];
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<void>;
      sendTestNotification: (title: string, body: string, data?: any) => Promise<boolean>;
    refreshTokens: () => Promise<void>;
    processNotificationQueue: () => Promise<{processedCount: number, errorCount: number, totalItems: number}>;
}

export const useNotifications = (): NotificationHook => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fcmTokens, setFcmTokens] = useState<FCMToken[]>([]);
  const { toast } = useToast();

  // 通知サポートチェック
  useEffect(() => {
    const checkSupport = () => {
      const supported = checkNotificationSupport();
      setIsSupported(supported);
      
      if (supported) {
        setPermission(getNotificationPermission());
      }
    };

    checkSupport();
  }, []);

  // フォアグラウンド通知の設定
  useEffect(() => {
    if (!isSupported) return;

    onMessageListener().then((payload: any) => {
      if (payload) {
        toast({
          title: payload.notification?.title || '通知',
          description: payload.notification?.body || '',
        });
      }
    }).catch((error: any) => {
      console.error('Foreground message error:', error);
    });
  }, [isSupported, toast]);

  // FCMトークンを取得
  const refreshTokens = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('fcm_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('FCMトークン取得エラー:', error);
        return;
      }

      setFcmTokens(data || []);
    } catch (error) {
      console.error('FCMトークン取得エラー:', error);
    }
  }, []);

  // 初期化時にトークンを取得
  useEffect(() => {
    refreshTokens();
  }, [refreshTokens]);

  // 通知を有効化
  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: '通知がサポートされていません',
        description: 'このブラウザは通知機能をサポートしていません。',
        variant: 'destructive'
      });
      return false;
    }

    // VAPID Key検証
    if (!validateVapidKey()) {
      toast({
        title: 'VAPID Key設定エラー',
        description: 'VAPID_KEY_SETUP.mdファイルを参照してFirebaseからVAPID Keyを取得してください。',
        variant: 'destructive'
      });
      return false;
    }

    setIsLoading(true);

    try {
      // 権限をリクエストしてトークンを取得
      const token = await requestNotificationPermission();
      setPermission(getNotificationPermission());

      if (typeof token !== 'string' || !token) {
        toast({
          title: 'トークン取得に失敗しました',
          description: 'ブラウザの設定で通知を許可してください。',
          variant: 'destructive'
        });
        return false;
      }

      // FCMトークンをSupabaseに直接保存
      await saveFCMToken(token);
      console.log('✅ FCMトークンをSupabaseに保存しました');

      await refreshTokens();

      toast({
        title: '通知が有効になりました',
        description: '新しい通知を受け取ることができます。',
      });

      return true;

    } catch (error: any) {
      console.error('通知有効化エラー:', error);
      toast({
        title: '通知の有効化に失敗しました',
        description: String(error) || 'エラーが発生しました。もう一度お試しください。',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, toast, refreshTokens]);

  // 通知を無効化
  const disableNotifications = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      // アクティブなトークンをすべて無効化
      for (const tokenData of fcmTokens) {
        try {
          // Firebase経由で削除
          await removeFCMToken(tokenData.token);
        } catch (tokenError) {
          console.warn('トークン削除エラー:', tokenError);
        }
      }

      await refreshTokens();

      toast({
        title: '通知が無効になりました',
        description: '通知を受け取らなくなります。',
      });

    } catch (error) {
      console.error('通知無効化エラー:', error);
      toast({
        title: '通知の無効化に失敗しました',
        description: 'エラーが発生しました。',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [fcmTokens, toast, refreshTokens]);

  // テスト通知を送信
  const sendTestNotification = useCallback(async (
    title: string, 
    body: string, 
    data?: any
  ): Promise<boolean> => {
    if (fcmTokens.length === 0) {
      toast({
        title: '通知トークンがありません',
        description: '先に通知を有効にしてください。',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token || !user) {
        toast({
          title: 'ログインが必要です',
          description: 'ログインしてからテスト通知を送信してください。',
          variant: 'destructive'
        });
        return false;
      }

      // アクティブなトークンがあるか確認
      const activeToken = fcmTokens.find(t => t.is_active);
      if (!activeToken) {
        toast({
          title: 'アクティブなトークンがありません',
          description: '通知を再度有効にしてください。',
          variant: 'destructive'
        });
        return false;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,  // Edge Functionが期待するuserIdを送信
          title,
          body
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`通知送信に失敗しました: ${errorText}`);
      }

      toast({
        title: 'テスト通知を送信しました',
        description: '通知が届くかご確認ください。',
      });

      return true;

    } catch (error: any) {
      console.error('テスト通知送信エラー:', error);
      toast({
        title: 'テスト通知の送信に失敗しました',
        description: String(error) || 'エラーが発生しました。',
        variant: 'destructive'
      });
      return false;
    }
  }, [fcmTokens, toast]);

  // 🎯 通知キューを手動で処理する関数（直接Supabaseアクセス）
  const processNotificationQueue = async (): Promise<{processedCount: number, errorCount: number, totalItems: number}> => {
    try {
      console.log('🔧 直接Supabaseを使用した通知キュー処理開始');
      
      // 未処理の通知を取得
      const { data: queueItems, error: queueError } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('processed', false)
        .order('created_at', { ascending: true })
        .limit(10);

      if (queueError) {
        throw new Error(`キュー取得エラー: ${queueError.message}`);
      }

      console.log(`🔄 処理対象の通知: ${queueItems?.length || 0}件`);

      if (!queueItems || queueItems.length === 0) {
        toast({
          title: '✅ 処理対象の通知はありません',
          description: '全ての通知が処理済みです。',
        });
        return {
          processedCount: 0,
          errorCount: 0,
          totalItems: 0
        };
      }

      let processedCount = 0;
      let errorCount = 0;

      // 各通知キューアイテムを処理
      for (const item of queueItems) {
        try {
          console.log(`🔄 処理中: ${item.table_name} - ID: ${item.id}`);

          // 通知キューを処理済みにマーク（実際の通知送信はEdge Functionに任せる）
          const { error: updateError } = await supabase
            .from('notification_queue')
            .update({ 
              processed: true, 
              processed_at: new Date().toISOString(),
              error_message: 'Manual processing - Edge Function bypass'
            })
            .eq('id', item.id);

          if (updateError) {
            throw new Error(`更新エラー: ${updateError.message}`);
          }

          processedCount++;
          console.log(`✅ キューアイテム処理完了: ${item.id}`);

        } catch (error: any) {
          console.error(`❌ キューアイテム処理エラー: ${item.id}`, error);
          
          // エラーをキューに記録
          await supabase
            .from('notification_queue')
            .update({ 
              error_message: error.message,
              processed: true,
              processed_at: new Date().toISOString()
            })
            .eq('id', item.id);
          
          errorCount++;
        }
      }

      const result = {
        processedCount,
        errorCount,
        totalItems: queueItems.length
      };

      console.log('🎉 通知キュー処理結果:', result);

      toast({
        title: '🎉 通知キュー処理完了',
        description: `処理済み: ${processedCount}件、エラー: ${errorCount}件`,
      });

      return result;

    } catch (error: any) {
      console.error('通知キュー処理エラー:', error);
      toast({
        title: '通知キュー処理エラー',
        description: error.message || 'エラーが発生しました。',
        variant: 'destructive'
      });
      throw error;
    }
  };

  return {
    isSupported,
    permission,
    isLoading,
    fcmTokens,
    enableNotifications,
    disableNotifications,
    sendTestNotification,
    refreshTokens,
    processNotificationQueue
  };
}; 