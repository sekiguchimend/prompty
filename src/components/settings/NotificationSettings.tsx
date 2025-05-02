import React, { useState, useEffect } from 'react';
import { Switch } from '../../components/ui/switch';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { useToast } from '../../hooks/use-toast';
import { Skeleton } from '../../components/ui/skeleton';
import { supabase } from '../../lib/supabaseClient';

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

const NotificationSettingsComponent: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  // ユーザー情報を取得
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
      }
    };
    
    fetchUser();
  }, []);

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
          throw settingsError;
        }
        
        if (settingsData && settingsData.notification_settings) {
          setSettings(settingsData.notification_settings);
        } else {
          // デフォルト設定
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error('設定の取得に失敗しました:', error);
        toast({
          title: 'エラー',
          description: '設定の読み込みに失敗しました',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [currentUser, toast]);

  // 設定の保存
  const saveSettings = async () => {
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
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
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
  };

  // Eメール通知設定の更新
  const updateEmailSetting = (key: keyof NotificationSettings['email_notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      email_notifications: {
        ...prev.email_notifications,
        [key]: value
      }
    }));
  };

  // プッシュ通知設定の更新
  const updatePushSetting = (key: keyof NotificationSettings['push_notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      push_notifications: {
        ...prev.push_notifications,
        [key]: value
      }
    }));
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
        <div>
          <h1 className="text-xl font-bold mb-2">通知</h1>
          <p className="text-sm text-gray-500">通知の受信設定を管理します</p>
        </div>
        <Separator />
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
      
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">メール通知</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">フォローしているクリエイターの新着投稿</span>
              <Switch 
                checked={settings.email_notifications.new_posts} 
                onCheckedChange={(checked) => updateEmailSetting('new_posts', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">コンテンツへのいいね</span>
              <Switch 
                checked={settings.email_notifications.likes} 
                onCheckedChange={(checked) => updateEmailSetting('likes', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">コメント</span>
              <Switch 
                checked={settings.email_notifications.comments} 
                onCheckedChange={(checked) => updateEmailSetting('comments', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">メンション</span>
              <Switch 
                checked={settings.email_notifications.mentions} 
                onCheckedChange={(checked) => updateEmailSetting('mentions', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">フォロー</span>
              <Switch 
                checked={settings.email_notifications.follows} 
                onCheckedChange={(checked) => updateEmailSetting('follows', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">イイね</span>
              <Switch 
                checked={settings.email_notifications.reactions} 
                onCheckedChange={(checked) => updateEmailSetting('reactions', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">ニュースレター</span>
              <Switch 
                checked={settings.email_notifications.newsletter} 
                onCheckedChange={(checked) => updateEmailSetting('newsletter', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">プロモーション</span>
              <Switch 
                checked={settings.email_notifications.promotions} 
                onCheckedChange={(checked) => updateEmailSetting('promotions', checked)}
              />
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-4">プッシュ通知</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">フォローしているクリエイターの新着投稿</span>
              <Switch 
                checked={settings.push_notifications.new_posts} 
                onCheckedChange={(checked) => updatePushSetting('new_posts', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">記事やノートへのいいね</span>
              <Switch 
                checked={settings.push_notifications.likes} 
                onCheckedChange={(checked) => updatePushSetting('likes', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">コメント</span>
              <Switch 
                checked={settings.push_notifications.comments} 
                onCheckedChange={(checked) => updatePushSetting('comments', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">メンション</span>
              <Switch 
                checked={settings.push_notifications.mentions} 
                onCheckedChange={(checked) => updatePushSetting('mentions', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">フォロー</span>
              <Switch 
                checked={settings.push_notifications.follows} 
                onCheckedChange={(checked) => updatePushSetting('follows', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">イイね</span>
              <Switch 
                checked={settings.push_notifications.reactions} 
                onCheckedChange={(checked) => updatePushSetting('reactions', checked)}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-4 flex justify-end">
        <Button 
          onClick={saveSettings} 
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : '設定を保存'}
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettingsComponent; 