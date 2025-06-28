import React, { useState, useEffect, useCallback, memo } from 'react';
import { Switch } from '../../components/ui/switch';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { useToast } from '../../hooks/use-toast';
import { Skeleton } from '../../components/ui/skeleton';
import { supabase } from '../../lib/supabaseClient';
import { useNotifications } from '../../hooks/useNotifications';
import { Loader2, Bell, BellOff, TestTube } from 'lucide-react';

// 通知設定のインターフェース
interface NotificationSettings {
  email_notifications: {
    new_posts: boolean;
    likes: boolean;
    comments: boolean;
    mentions: boolean;
    follows: boolean;
    reactions: boolean;
    newsletter: boolean;
    promotions: boolean;
  };
  push_notifications: {
    new_posts: boolean;
    likes: boolean;
    comments: boolean;
    mentions: boolean;
    follows: boolean;
    reactions: boolean;
  };
}

// デフォルト設定
const defaultSettings: NotificationSettings = {
  email_notifications: {
    new_posts: true,
    likes: true,
    comments: true,
    mentions: true,
    follows: true,
    reactions: true,
    newsletter: true,
    promotions: true
  },
  push_notifications: {
    new_posts: true,
    likes: true,
    comments: true,
    mentions: true,
    follows: true,
    reactions: true
  }
};

const NotificationSettingsComponent: React.FC = memo(() => {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  
  // FCM通知フック
  const {
    isSupported,
    permission,
    isLoading: fcmLoading,
    fcmTokens,
    enableNotifications,
    disableNotifications,
    sendTestNotification,
    processNotificationQueue
  } = useNotifications();

  // ユーザー情報を取得
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
      } else {
        // ログインしていない場合のトースト表示
        toast({
          title: 'ログインが必要です',
          description: '通知設定を表示するにはログインしてください。',
          variant: 'destructive',
        });
      }
    };
    
    fetchUser();
  }, [toast]);

  // 設定を取得
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchSettings = async () => {
      setIsLoading(true);
      
      try {
        // ユーザー設定を取得
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('notification_settings')
          .eq('user_id', currentUser.id)
          .single();
        
        if (settingsError && settingsError.code !== 'PGRST116') { // 'PGRST116'は結果が見つからないエラー
        }
        
        if (settingsData && settingsData.notification_settings) {
          setSettings(settingsData.notification_settings);
        } else {
          // デフォルト設定
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error('設定の取得に失敗しました:', error);
        setSettings(defaultSettings);
        toast({
          title: '設定読み込み注意',
          description: 'デフォルト設定で表示しています。ログイン状態を確認してください。',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [currentUser, toast]);

  // 設定の保存
  const saveSettings = useCallback(async () => {
    if (!currentUser) {
      toast({
        title: 'エラー',
        description: 'ログインが必要です',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // 既存の設定を取得
      const { data: existingSettings, error: fetchError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
      }
      
      // upsertするデータを準備
      const upsertData: Record<string, any> = {
        user_id: currentUser.id,
        notification_settings: settings,
        updated_at: new Date().toISOString(),
      };
      
      // 既存の設定がある場合は他の設定も保持
      if (existingSettings) {
        upsertData.account_settings = existingSettings.account_settings;
        upsertData.reaction_settings = existingSettings.reaction_settings;
        upsertData.comment_settings = existingSettings.comment_settings;
      }
      
      // user_settings テーブルにupsert
      const { error } = await supabase
        .from('user_settings')
        .upsert(upsertData, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });
      
      if (error) throw error;
      
      toast({
        title: '設定を保存しました',
        description: '通知設定が更新されました',
      });
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      toast({
        title: 'エラー',
        description: '設定の保存に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [currentUser, settings, toast]);

  // 設定の更新
  const updateEmailNotification = useCallback((key: keyof NotificationSettings['email_notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      email_notifications: {
        ...prev.email_notifications,
        [key]: value
      }
    }));
  }, []);

  const updatePushNotification = useCallback((key: keyof NotificationSettings['push_notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      push_notifications: {
        ...prev.push_notifications,
        [key]: value
      }
    }));
  }, []);

  // 🎯 通知キューを処理する関数
  const handleProcessQueue = async () => {
    try {
      const result = await processNotificationQueue();
      toast({
        title: "通知キュー処理完了",
        description: `${result.processedCount || 0}件の通知を処理しました`,
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: "通知キューの処理中にエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-8">
        <p>設定を表示するにはログインが必要です。</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold mb-6">通知</h1>
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold mb-2">通知</h1>
        <p className="text-sm text-gray-500">通知の受信設定を管理します</p>
      </div>
      
      <Separator />
      
      <div className="space-y-8">
        <div className="pb-12">
          <h2 className="text-sm font-medium text-gray-700 mb-6">メール通知</h2>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-sm">フォローしているクリエイターの新着投稿</span>
              <Switch 
                checked={settings.email_notifications.new_posts} 
                onCheckedChange={(checked) => updateEmailNotification('new_posts', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">コンテンツへのいいね</span>
              <Switch 
                checked={settings.email_notifications.likes} 
                onCheckedChange={(checked) => updateEmailNotification('likes', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">コメント</span>
              <Switch 
                checked={settings.email_notifications.comments} 
                onCheckedChange={(checked) => updateEmailNotification('comments', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">メンション</span>
              <Switch 
                checked={settings.email_notifications.mentions} 
                onCheckedChange={(checked) => updateEmailNotification('mentions', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">フォロー</span>
              <Switch 
                checked={settings.email_notifications.follows} 
                onCheckedChange={(checked) => updateEmailNotification('follows', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">イイね</span>
              <Switch 
                checked={settings.email_notifications.reactions} 
                onCheckedChange={(checked) => updateEmailNotification('reactions', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">ニュースレター</span>
              <Switch 
                checked={settings.email_notifications.newsletter} 
                onCheckedChange={(checked) => updateEmailNotification('newsletter', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">プロモーション</span>
              <Switch 
                checked={settings.email_notifications.promotions} 
                onCheckedChange={(checked) => updateEmailNotification('promotions', checked)}
              />
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-6">プッシュ通知</h2>
          
          {/* Web Push通知制御セクション */}
          <div className="mb-8 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Web Push通知設定
            </h3>
            
            <div className="space-y-4">
              {/* サポート状況表示 */}
              <div className="text-xs text-gray-600">
                {isSupported ? (
                  <span className="text-green-600">✓ ブラウザがWeb Push通知をサポートしています</span>
                ) : (
                  <span className="text-red-600">✗ ブラウザがWeb Push通知をサポートしていません</span>
                )}
              </div>
              
              {/* 権限状況表示 */}
              {isSupported && (
                <div className="text-xs text-gray-600">
                  権限状態: {
                    permission === 'granted' ? (
                      <span className="text-green-600">許可済み</span>
                    ) : permission === 'denied' ? (
                      <span className="text-red-600">拒否</span>
                    ) : (
                      <span className="text-yellow-600">未設定</span>
                    )
                  }
                </div>
              )}
              
              {/* アクティブなトークン数表示 */}
              {fcmTokens.length > 0 && (
                <div className="text-xs text-gray-600">
                  アクティブなデバイス: {fcmTokens.filter(t => t.is_active).length}台
                </div>
              )}
              
              {/* 制御ボタン */}
              <div className="flex gap-2">
                {fcmTokens.filter(t => t.is_active).length === 0 ? (
                  <Button
                    size="sm"
                    onClick={enableNotifications}
                    disabled={!isSupported || fcmLoading}
                    className="flex items-center gap-2"
                  >
                    {fcmLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                    通知を有効にする
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={disableNotifications}
                      disabled={fcmLoading}
                      className="flex items-center gap-2"
                    >
                      {fcmLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <BellOff className="h-4 w-4" />
                      )}
                      通知を無効にする
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendTestNotification('テスト通知', 'これはテスト通知です')}
                      disabled={fcmLoading}
                      className="flex items-center gap-2"
                    >
                      <TestTube className="h-4 w-4" />
                      テスト送信
                    </Button>
                    
                    {/* 🎯 通知キュー処理ボタンを追加 */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleProcessQueue}
                      disabled={fcmLoading}
                      className="flex items-center gap-2"
                    >
                      🔧 通知キューを処理
                    </Button>
                  </>
                )}
              </div>
              
              {!isSupported && (
                <p className="text-xs text-gray-500 mt-2">
                  Web Push通知を利用するには、Chrome、Firefox、Safariなどの対応ブラウザをご利用ください。
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-sm">フォローしているクリエイターの新着投稿</span>
              <Switch 
                checked={settings.push_notifications.new_posts} 
                onCheckedChange={(checked) => updatePushNotification('new_posts', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">記事やノートへのいいね</span>
              <Switch 
                checked={settings.push_notifications.likes} 
                onCheckedChange={(checked) => updatePushNotification('likes', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">コメント</span>
              <Switch 
                checked={settings.push_notifications.comments} 
                onCheckedChange={(checked) => updatePushNotification('comments', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">メンション</span>
              <Switch 
                checked={settings.push_notifications.mentions} 
                onCheckedChange={(checked) => updatePushNotification('mentions', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">フォロー</span>
              <Switch 
                checked={settings.push_notifications.follows} 
                onCheckedChange={(checked) => updatePushNotification('follows', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">イイね</span>
              <Switch 
                checked={settings.push_notifications.reactions} 
                onCheckedChange={(checked) => updatePushNotification('reactions', checked)}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-4 flex justify-end">
        <Button 
          onClick={saveSettings} 
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSaving ? '保存中...' : '設定を保存'}
        </Button>
      </div>
    </div>
  );
});

NotificationSettingsComponent.displayName = 'NotificationSettingsComponent';

export default NotificationSettingsComponent; 