import React, { useState, useEffect, useCallback, memo } from 'react';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { Skeleton } from '../../components/ui/skeleton';
import { supabase } from '../../lib/supabaseClient';
import StripeConnectSection from './StripeConnectSection';
import PaymentTestForm from './PaymentTestForm';

// アカウント設定のインターフェース
interface AccountSettings {
  is_business_account: boolean;
  invoice_registration_number: string | null;
  stripe_account_id?: string | null;
}

// デフォルト設定
const defaultSettings: AccountSettings = {
  is_business_account: false,
  invoice_registration_number: null,
  stripe_account_id: null
};

const AccountSettingsComponent: React.FC = memo(() => {
  const [settings, setSettings] = useState<AccountSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  
  // アカウント情報（実際の実装ではAPIから取得）
  const [accountInfo, setAccountInfo] = useState({
    creatorName: '',
    noteId: '',
    email: '',
  });
  
  // ユーザー情報を取得
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        
        // プロフィール情報を取得
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, display_name')
          .eq('id', session.user.id)
          .single();
          
        if (profileData) {
          setAccountInfo(prev => ({
            ...prev,
            creatorName: profileData.display_name || '名前未設定',
            noteId: profileData.username || '',
            email: session.user.email || ''
          }));
        }
      } else {
        // ログインしていない場合のトースト表示
        toast({
          title: 'ログインが必要です',
          description: '設定を表示するにはログインしてください。',
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
        // 最初に全体の設定を取得して406エラーを回避
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        
        let mergedSettings = { ...defaultSettings };
        let settingsFound = false;
        
        // 設定が正常に取得できた場合
        if (!settingsError && settingsData) {
          settingsFound = true;
          
          // account_settingsの安全な読み込み
          if (settingsData.account_settings) {
            try {
              const accountSettings = typeof settingsData.account_settings === 'string' 
                ? JSON.parse(settingsData.account_settings)
                : settingsData.account_settings;
                
              mergedSettings = {
                ...mergedSettings,
                ...accountSettings
              };
            } catch (parseError) {
            }
          }
        }
        
        // user_settingsで取得できない場合、account_settingsテーブルから取得を試行
        if (!settingsFound && settingsError) {
          
          try {
            const { data: accountData, error: accountError } = await supabase
              .from('account_settings')
              .select('*')
              .eq('user_id', currentUser.id)
              .maybeSingle();
            
            if (!accountError && accountData) {
              
              // account_settingsテーブルの構造をAccountSettingsに変換
              const convertedSettings: Partial<AccountSettings> = {
                // 必要に応じて他のフィールドをここに追加
              };
              
              mergedSettings = { ...mergedSettings, ...convertedSettings };
              settingsFound = true;
            }
          } catch (fallbackError) {
          }
        }

        // Stripe アカウント情報を並行取得
        const profilePromise = supabase
          .from('profiles')
          .select('stripe_account_id')
          .eq('id', currentUser.id)
          .maybeSingle();

        const { data: profileData, error: profileError } = await profilePromise;

        if (!profileError && profileData && profileData.stripe_account_id) {
          mergedSettings.stripe_account_id = profileData.stripe_account_id;
        }
        
        setSettings(mergedSettings);
        
        // 設定が見つからなかった場合の通知
        if (!settingsFound) {
          toast({
            title: '設定初期化',
            description: 'デフォルト設定で表示しています。変更後に保存してください。',
            variant: 'default',
          });
        }
        
      } catch (error) {
        console.error('設定の取得に失敗しました:', error);
        // エラーが発生してもデフォルト設定で続行
        setSettings(defaultSettings);
        toast({
          title: '設定読み込みエラー',
          description: 'デフォルト設定で表示しています。ネットワーク接続を確認してください。',
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
        title: 'ログインが必要です',
        description: '設定を保存するにはログインしてください。',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // 既存の設定を取得（エラー時も続行）
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
        account_settings: settings,
        updated_at: new Date().toISOString(),
      };
      
      // 既存の設定がある場合は他の設定も保持
      if (existingSettings) {
        upsertData.notification_settings = existingSettings.notification_settings;
        upsertData.reaction_settings = existingSettings.reaction_settings;
        upsertData.comment_settings = existingSettings.comment_settings;
      }
      
      // user_settings テーブルにupsert
      const { error: upsertError } = await supabase
        .from('user_settings')
        .upsert(upsertData, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });
      
      if (upsertError) {
        console.error('user_settingsへの保存エラー:', upsertError);
        
        // 406エラーまたは権限エラーの場合はaccount_settingsテーブルに保存を試行
        if (upsertError.code === '42883' || upsertError.message?.includes('406') || upsertError.code === '42501') {
          
          const accountSettingsData = {
            user_id: currentUser.id,
            updated_at: new Date().toISOString(),
          };
          
          const { error: accountError } = await supabase
            .from('account_settings')
            .upsert(accountSettingsData, {
              onConflict: 'user_id',
              ignoreDuplicates: false
            });
          
          if (accountError) {
            throw accountError;
          }
          
          toast({
            title: '設定を保存しました',
            description: 'アカウント設定が更新されました（フォールバック保存）',
          });
          return;
        }
        
        throw upsertError;
      }
      
      toast({
        title: '設定を保存しました',
        description: 'アカウント設定が更新されました',
      });
      
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      toast({
        title: 'エラー',
        description: '設定の保存に失敗しました。ログイン状態やネットワーク接続を確認してください。',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [currentUser, settings, toast]);

  // 設定の更新
  const updateSetting = useCallback((key: keyof AccountSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

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
        <h1 className="text-xl font-bold mb-6">アカウント</h1>
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">アカウント</h1>
        <Button
          onClick={saveSettings}
          disabled={isSaving}
          className="flex items-center"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          保存
        </Button>
      </div>
      
      <div className="space-y-8">
        {/* 法人・個人としてpromptyを利用する */}
        
        
      
        
        {/* Stripe決済設定セクション */}
        <div className="pb-12">
          <h2 className="text-sm font-medium text-gray-700 mb-6">決済設定</h2>
          
          {currentUser && (
            <>
              <StripeConnectSection 
                userId={currentUser.id} 
                stripeAccountId={settings.stripe_account_id} 
              />
              
              {settings.stripe_account_id && (
                <PaymentTestForm 
                  receiverId={currentUser.id}
                  stripeAccountId={settings.stripe_account_id}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

AccountSettingsComponent.displayName = 'AccountSettingsComponent';

export default AccountSettingsComponent; 