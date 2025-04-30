import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../hooks/use-toast';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Skeleton } from '../ui/skeleton';

type CommentSettings = {
  auto_hide_reported: boolean;
  hidden_comments: string[];
};

const CommentSettings: React.FC = () => {
  const [settings, setSettings] = useState<CommentSettings>({
    auto_hide_reported: false,
    hidden_comments: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [reportedComments, setReportedComments] = useState<any[]>([]);
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

  // 設定とレポート済みコメントを取得
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchSettings = async () => {
      setIsLoading(true);
      
      try {
        // ユーザー設定を取得
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();
        
        if (settingsError && settingsError.code !== 'PGRST116') { // 'PGRST116'は結果が見つからないエラー
          throw settingsError;
        }
        
        if (settingsData) {
          setSettings({
            auto_hide_reported: settingsData.auto_hide_reported || false,
            hidden_comments: settingsData.hidden_comments || [],
          });
        } else {
          // デフォルト設定
          setSettings({
            auto_hide_reported: false,
            hidden_comments: [],
          });
        }
        
        // ローカルストレージの非表示コメントを読み込んで統合
        const storedHiddenComments = localStorage.getItem('hiddenComments');
        if (storedHiddenComments) {
          try {
            const parsedHiddenComments = JSON.parse(storedHiddenComments);
            if (Array.isArray(parsedHiddenComments)) {
              setSettings(prev => ({
                ...prev,
                hidden_comments: [...new Set([...prev.hidden_comments, ...parsedHiddenComments])],
              }));
            }
          } catch (error) {
            console.error('非表示コメントの読み込みに失敗しました:', error);
          }
        }
        
        // ユーザーが報告したコメントを取得
        const { data: reportedData, error: reportedError } = await supabase
          .from('comment_reports')
          .select(`
            id,
            comment_id,
            prompt_id,
            reason,
            created_at,
            comments:comment_id(
              id,
              content,
              created_at,
              user_id,
              profiles:user_id(username, display_name, avatar_url)
            )
          `)
          .eq('reporter_id', currentUser.id)
          .order('created_at', { ascending: false });
        
        if (reportedError) {
          throw reportedError;
        }
        
        setReportedComments(reportedData || []);
        
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
      // user_settings テーブルにupsert（存在すれば更新、なければ挿入）
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: currentUser.id,
          auto_hide_reported: settings.auto_hide_reported,
          hidden_comments: settings.hidden_comments,
          updated_at: new Date().toISOString(),
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

  // 非表示コメントの削除（表示に戻す）
  const removeHiddenComment = (commentId: string) => {
    setSettings(prev => ({
      ...prev,
      hidden_comments: prev.hidden_comments.filter(id => id !== commentId),
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">コメント設定</h3>
        <p className="text-sm text-gray-500">
          コメントの表示設定と報告したコメントを管理します
        </p>
      </div>
      
      <Separator />
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">自動非表示</Label>
                <p className="text-sm text-gray-500">
                  報告したコメントを自動的に非表示にします
                </p>
              </div>
              <Switch
                checked={settings.auto_hide_reported}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, auto_hide_reported: checked }))
                }
              />
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="text-base font-medium mb-4">非表示コメント管理</h4>
            
            {settings.hidden_comments.length > 0 ? (
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
                        表示する
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-right">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearAllHiddenComments}
                  >
                    すべて表示する
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 py-2">
                非表示にしたコメントはありません
              </p>
            )}
          </div>
          
          <Separator />
          
          <div>
            <h4 className="text-base font-medium mb-4">報告済みコメント</h4>
            
            {reportedComments.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto p-2">
                {reportedComments.map(report => (
                  <div key={report.id} className="p-3 border border-gray-200 rounded-md">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium">
                          {report.comments?.profiles?.display_name || report.comments?.profiles?.username || '削除されたユーザー'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(report.created_at).toLocaleDateString('ja-JP')}に報告 - 理由: {report.reason}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm line-clamp-2">
                      {report.comments?.content || '[コメントは削除されました]'}
                    </p>
                    <div className="mt-2 flex justify-end">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          // 非表示リストにコメントIDがなければ追加
                          if (!settings.hidden_comments.includes(report.comment_id)) {
                            setSettings(prev => ({
                              ...prev,
                              hidden_comments: [...prev.hidden_comments, report.comment_id],
                            }));
                          } else {
                            // すでにリストにある場合は削除
                            removeHiddenComment(report.comment_id);
                          }
                        }}
                      >
                        {settings.hidden_comments.includes(report.comment_id) ? '表示する' : '非表示にする'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-2">
                報告したコメントはありません
              </p>
            )}
          </div>
          
          <div className="pt-4 text-right">
            <Button 
              onClick={saveSettings} 
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '設定を保存'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default CommentSettings; 