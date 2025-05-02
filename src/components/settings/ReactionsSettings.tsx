import React, { useState, useEffect } from 'react';
import { Switch } from '../../components/ui/switch';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { useToast } from '../../hooks/use-toast';
import { Skeleton } from '../../components/ui/skeleton';
import { supabase } from '../../lib/supabaseClient';

// リアクション設定のインターフェース
interface ReactionSettings {
  allow_comments: boolean;
  allow_likes: boolean;
  allow_reactions: boolean;
  comment_approval_required: boolean;
  comment_notifications: boolean;
  comment_reply_notifications: boolean;
}

// デフォルト設定
const defaultSettings: ReactionSettings = {
  allow_comments: true,
  allow_likes: true,
  allow_reactions: true,
  comment_approval_required: false,
  comment_notifications: true,
  comment_reply_notifications: true
};

const ReactionsSettingsComponent: React.FC = () => {
  const [settings, setSettings] = useState<ReactionSettings>(defaultSettings);
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
          .select('reaction_settings')
          .eq('user_id', currentUser.id)
          .single();
        
        if (settingsError && settingsError.code !== 'PGRST116') { // 'PGRST116'は結果が見つからないエラー
          throw settingsError;
        }
        
        if (settingsData && settingsData.reaction_settings) {
          setSettings(settingsData.reaction_settings);
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
        reaction_settings: settings,
        updated_at: new Date().toISOString(),
      };
      
      // 既存の設定がある場合は他の設定も保持
      if (existingSettings) {
        upsertData.notification_settings = existingSettings.notification_settings;
        upsertData.account_settings = existingSettings.account_settings;
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
        description: 'リアクション設定が更新されました',
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

  // 設定の更新
  const updateSetting = (key: keyof ReactionSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
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
          <h1 className="text-xl font-bold mb-2">リアクション</h1>
          <p className="text-sm text-gray-500">コンテンツへのリアクション設定を管理します</p>
        </div>
        <Separator />
        <div className="space-y-4">
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
        <h1 className="text-xl font-bold mb-2">リアクション</h1>
        <p className="text-sm text-gray-500">コンテンツへのリアクション設定を管理します</p>
      </div>
      
      <Separator />
      
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">リアクション設定</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm">コメントを許可する</span>
                <p className="text-xs text-gray-500 mt-1">
                  オフにすると、あなたのコンテンツにコメントできなくなります。
                </p>
              </div>
              <Switch 
                checked={settings.allow_comments} 
                onCheckedChange={(checked) => updateSetting('allow_comments', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm">いいねを許可する</span>
                <p className="text-xs text-gray-500 mt-1">
                  オフにすると、あなたのコンテンツにいいねできなくなります。
                </p>
              </div>
              <Switch 
                checked={settings.allow_likes} 
                onCheckedChange={(checked) => updateSetting('allow_likes', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm">イイねを許可する</span>
                <p className="text-xs text-gray-500 mt-1">
                  オフにすると、あなたのコンテンツをイイねできなくなります。
                </p>
              </div>
              <Switch 
                checked={settings.allow_reactions} 
                onCheckedChange={(checked) => updateSetting('allow_reactions', checked)}
              />
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-4">コメント設定</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm">コメントの承認制</span>
                <p className="text-xs text-gray-500 mt-1">
                  オンにすると、あなたの承認後にコメントが公開されます。
                </p>
              </div>
              <Switch 
                checked={settings.comment_approval_required} 
                onCheckedChange={(checked) => updateSetting('comment_approval_required', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm">コメント通知</span>
                <p className="text-xs text-gray-500 mt-1">
                  オフにすると、コメントの通知を受け取りません。
                </p>
              </div>
              <Switch 
                checked={settings.comment_notifications} 
                onCheckedChange={(checked) => updateSetting('comment_notifications', checked)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm">コメント返信通知</span>
                <p className="text-xs text-gray-500 mt-1">
                  オフにすると、コメントへの返信の通知を受け取りません。
                </p>
              </div>
              <Switch 
                checked={settings.comment_reply_notifications} 
                onCheckedChange={(checked) => updateSetting('comment_reply_notifications', checked)}
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

export default ReactionsSettingsComponent; 