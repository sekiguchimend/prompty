import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../hooks/use-toast';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Skeleton } from '../ui/skeleton';
import { Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';

// コメント設定のインターフェース
interface CommentSettings {
  allow_comments: boolean;
  comment_notification: boolean;
  require_approval: boolean;
  allow_anonymous_comments: boolean;
  auto_hide_reported: boolean;
  hidden_comments: string[];
}

// デフォルト設定
const defaultSettings: CommentSettings = {
  allow_comments: true,
  comment_notification: true,
  require_approval: false,
  allow_anonymous_comments: true,
  auto_hide_reported: false,
  hidden_comments: []
};

const CommentSettingsComponent: React.FC = () => {
  const [settings, setSettings] = useState<CommentSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [reportedComments, setReportedComments] = useState<any[]>([]);
  const { toast } = useToast();

  // 理由を日本語に変換する関数
  const translateReason = (reason: string): string => {
    const reasonMap: Record<string, string> = {
      'inappropriate': '不適切',
      'spam': 'スパム',
      'harassment': 'ハラスメント',
      'misinformation': '誤情報',
      'other': 'その他'
    };
    return reasonMap[reason] || reason;
  };

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
          description: 'コメント設定を表示するにはログインしてください。',
          variant: 'destructive',
        });
      }
    };
    
    fetchUser();
  }, [toast]);

  // 設定とレポート済みコメントを取得
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchSettings = async () => {
      setIsLoading(true);
      
      try {
        // ユーザー設定を取得
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('comment_settings')
          .eq('user_id', currentUser.id)
          .single();
        
        if (settingsError && settingsError.code !== 'PGRST116') { // 'PGRST116'は結果が見つからないエラー
        }
        
        if (settingsData && settingsData.comment_settings) {
          // 取得した設定データにhidden_commentsが含まれているか確認
          const loadedSettings = {
            ...settingsData.comment_settings,
            hidden_comments: settingsData.comment_settings.hidden_comments || []
          };
          setSettings(loadedSettings);
        } else {
          // デフォルト設定
          setSettings(defaultSettings);
        }
        
        // ローカルストレージの非表示コメントを読み込んで統合
        const storedHiddenComments = localStorage.getItem('hiddenComments');
        if (storedHiddenComments) {
          try {
            const parsedHiddenComments = JSON.parse(storedHiddenComments);
            if (Array.isArray(parsedHiddenComments)) {
              setSettings(prev => ({
                ...prev,
                hidden_comments: Array.from(new Set([...prev.hidden_comments, ...parsedHiddenComments])),
              }));
            }
          } catch (error) {
            console.error('非表示コメントの読み込みに失敗しました:', error);
          }
        }
        
        // ユーザーが報告したコメントを取得
        const { data: reportedData, error: reportedError } = await supabase
          .from('reports')
          .select(`
            id,
            target_id,
            prompt_id,
            reason,
            created_at
          `)
          .eq('reporter_id', currentUser.id)
          .eq('target_type', 'comment')
          .order('created_at', { ascending: false });
        
        if (reportedError) {
          throw reportedError;
        }
        
        // 報告されたコメントの詳細情報を個別に取得
        let commentDetails: any[] = [];
        if (reportedData && reportedData.length > 0) {
          // target_idの配列を作成
          const commentIds = reportedData.map(report => report.target_id);
          
          // コメント情報を取得
          const { data: commentsData, error: commentsError } = await supabase
            .from('comments')
            .select(`
              id,
              content,
              created_at,
              user_id,
              profiles:user_id(username, display_name, avatar_url)
            `)
            .in('id', commentIds);
          
          if (commentsError) {
            console.error('コメント情報の取得に失敗しました:', commentsError);
          }
          
          // 報告データとコメントデータを結合
          if (commentsData) {
            commentDetails = reportedData.map(report => {
              const commentData = commentsData.find(comment => comment.id === report.target_id);
              return {
                ...report,
                comments: commentData || null
              };
            });
          } else {
            commentDetails = reportedData;
          }
        }
        
        setReportedComments(commentDetails);
        
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
        comment_settings: settings,
        updated_at: new Date().toISOString(),
      };
      
      // 既存の設定がある場合は他の設定も保持
      if (existingSettings) {
        upsertData.notification_settings = existingSettings.notification_settings;
        upsertData.account_settings = existingSettings.account_settings;
        upsertData.reaction_settings = existingSettings.reaction_settings;
      }
      
      // user_settings テーブルにupsert（存在すれば更新、なければ挿入）
      const { error } = await supabase
        .from('user_settings')
        .upsert(upsertData, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });
      
      if (error) throw error;
      
      // ローカルストレージも更新
      localStorage.setItem('hiddenComments', JSON.stringify(settings.hidden_comments));
      
      toast({
        title: '設定を保存しました',
        description: 'コメント設定が更新されました',
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
  const updateSetting = (key: keyof CommentSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 非表示コメントの削除（表示に戻す）
  const removeHiddenComment = (commentId: string) => {
    setSettings(prev => ({
      ...prev,
      hidden_comments: (prev.hidden_comments || []).filter(id => id !== commentId),
    }));
  };

  // すべての非表示コメントをクリア
  const clearAllHiddenComments = () => {
    setSettings(prev => ({
      ...prev,
      hidden_comments: [],
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
        <h3 className="text-lg font-medium">コメント設定</h3>
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">コメント設定</h3>
          <p className="text-sm text-gray-500">
            コメントの表示設定と報告したコメントを管理します
          </p>
        </div>
        <Button
          onClick={saveSettings}
          disabled={isSaving}
          className="flex items-center ml-2"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          保存
        </Button>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 mr-2">
            <Label className="text-base">コメントを許可する</Label>
            <p className="text-sm text-gray-500">
              あなたの記事へのコメントを許可します
            </p>
          </div>
          <Switch
            checked={settings.allow_comments}
            onCheckedChange={(checked) => updateSetting('allow_comments', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 mr-2">
            <Label className="text-base">コメント通知</Label>
            <p className="text-sm text-gray-500">
              新しいコメントが投稿されたときに通知を受け取ります
            </p>
          </div>
          <Switch
            checked={settings.comment_notification}
            onCheckedChange={(checked) => updateSetting('comment_notification', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 mr-2">
            <Label className="text-base">コメント承認制</Label>
            <p className="text-sm text-gray-500">
              コメントがあなたの承認後に表示されるようにします
            </p>
          </div>
          <Switch
            checked={settings.require_approval}
            onCheckedChange={(checked) => updateSetting('require_approval', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 mr-2">
            <Label className="text-base">匿名コメントを許可</Label>
            <p className="text-sm text-gray-500">
              ログインしていないユーザーからのコメントを許可します
            </p>
          </div>
          <Switch
            checked={settings.allow_anonymous_comments}
            onCheckedChange={(checked) => updateSetting('allow_anonymous_comments', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 mr-2">
            <Label className="text-base">自動非表示</Label>
            <p className="text-sm text-gray-500">
              報告したコメントを自動的に非表示にします
            </p>
          </div>
          <Switch
            checked={settings.auto_hide_reported}
            onCheckedChange={(checked) => updateSetting('auto_hide_reported', checked)}
          />
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h4 className="text-base font-medium mb-4">非表示コメント管理</h4>
        
        {settings.hidden_comments?.length > 0 ? (
          <>
            <div className="space-y-3 max-h-80 overflow-y-auto p-2">
              {settings.hidden_comments.map(commentId => (
                <div key={commentId} className="flex items-center justify-between p-2 border border-gray-200 rounded-md bg-gray-50">
                  <span className="text-sm truncate max-w-md">
                    ID: {commentId}
                  </span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => removeHiddenComment(commentId)}
                  >
                    表示に戻す
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllHiddenComments}
              >
                すべて表示に戻す
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 italic">
            非表示にしたコメントはありません
          </p>
        )}
      </div>
      
      <Separator />
      
      <div>
        <h4 className="text-base font-medium mb-4">報告したコメント</h4>
        
        {reportedComments.length > 0 ? (
          <div className="space-y-4 max-h-80 overflow-y-auto p-2">
            {reportedComments.map(report => (
              <div key={report.id} className="p-3 border rounded-md bg-gray-50 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium">
                      {report.comments?.profiles?.display_name || report.comments?.profiles?.username || '不明なユーザー'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(report.created_at).toLocaleString('ja-JP')}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {translateReason(report.reason)}
                  </Badge>
                </div>
                <div className="mt-3 p-2 bg-white rounded border text-sm">
                  {report.comments?.content || '（コメントは削除されました）'}
                </div>
                
                <div className="mt-2 flex justify-end">
                  <Checkbox 
                    id={`hide-${report.target_id}`}
                    checked={settings.hidden_comments?.includes(report.target_id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSettings(prev => ({
                          ...prev,
                          hidden_comments: [...(prev.hidden_comments || []), report.target_id]
                        }));
                      } else {
                        removeHiddenComment(report.target_id);
                      }
                    }}
                  />
                  <Label htmlFor={`hide-${report.target_id}`} className="ml-2 text-sm cursor-pointer">
                    非表示にする
                  </Label>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">
            報告したコメントはありません
          </p>
        )}
      </div>
    </div>
  );
};

export default CommentSettingsComponent; 