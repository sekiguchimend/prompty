import React, { useEffect, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { supabase } from '../../lib/supabaseClient';
import { MoreVertical } from 'lucide-react';
import ReportDialog from '../shared/ReportDialog';
import { Avatar } from '../shared/Avatar';
import { getDisplayName } from '../../lib/avatar-utils';

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  is_edited?: boolean;
  user?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
};

type UserSettings = {
  auto_hide_reported: boolean;
  hidden_comments: string[];
};

type CommentsProps = {
  promptId: string;
};

const Comments: React.FC<CommentsProps> = ({ promptId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [hiddenComments, setHiddenComments] = useState<string[]>([]);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    auto_hide_reported: false,
    hidden_comments: [],
  });

  // ユーザー情報の取得
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
      }
    };
    
    fetchUser();
    
    // 認証状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user || null);
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // ユーザー設定とローカルストレージから非表示コメントを読み込む
  useEffect(() => {
    const loadHiddenComments = async () => {
      try {
        // ローカルストレージからの読み込み
        const storedHiddenComments = localStorage.getItem('hiddenComments');
        let hiddenCommentsFromStorage: string[] = [];
        
        if (storedHiddenComments) {
          try {
            const parsed = JSON.parse(storedHiddenComments);
            if (Array.isArray(parsed)) {
              hiddenCommentsFromStorage = parsed;
            }
          } catch (error) {
            // 非表示コメントの読み込みに失敗
          }
        }
        
        if (currentUser) {
          // Supabaseからユーザー設定を取得
          const { data, error } = await supabase
            .from('user_settings')
            .select('auto_hide_reported, hidden_comments')
            .eq('user_id', currentUser.id)
            .single();
            
          if (error && error.code !== 'PGRST116') { // 'PGRST116'は結果が見つからないエラー
            // 設定取得エラー
          } else if (data) {
            // 設定を保存
            setUserSettings({
              auto_hide_reported: Boolean(data.auto_hide_reported),
              hidden_comments: Array.isArray(data.hidden_comments) ? data.hidden_comments : [],
            });
            
            // ローカルとDBの非表示コメントを統合
            // Set型を使わず配列の重複を除去
            const combinedHiddenComments = Array.from(new Set([
              ...hiddenCommentsFromStorage,
              ...(Array.isArray(data.hidden_comments) ? data.hidden_comments : [])
            ]));
            
            setHiddenComments(combinedHiddenComments);
            
            // ローカルストレージを最新の状態に更新
            localStorage.setItem('hiddenComments', JSON.stringify(combinedHiddenComments));
            
            return;
          }
        }
        
        // ユーザーがログインしていない場合や設定が見つからない場合は
        // ローカルストレージの値だけを使用
        setHiddenComments(hiddenCommentsFromStorage);
        
      } catch (error) {
        // 非表示コメント設定の読み込みエラー
      }
    };
    
    loadHiddenComments();
  }, [currentUser]);

  // コメントの取得関数をuseCallbackでメモ化
  const fetchComments = useCallback(async () => {
    if (!promptId) return;
    
    setIsLoading(true);
    try {
      const { data, error, count } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles(username, display_name, avatar_url)
        `, { count: 'exact' })
        .eq('prompt_id', promptId)
        .order('created_at', { ascending: false });
        
      if (error) {
        return;
      }
      
      // データを正しい型に変換
      const typedComments: Comment[] = (data || []).map(item => {
        const commentItem = item as any; // anyを使用して型エラーを回避
        return {
          id: commentItem.id as string,
          content: commentItem.content as string,
          created_at: commentItem.created_at as string,
          user_id: commentItem.user_id as string,
          is_edited: commentItem.is_edited as boolean | undefined,
          user: commentItem.user ? {
            username: String(commentItem.user.username || ''),
            display_name: String(commentItem.user.display_name || ''),
            avatar_url: String(commentItem.user.avatar_url || '')
          } : undefined
        };
      });
      
      setComments(typedComments);
      setCommentCount(count || 0);
    } catch (err) {
      // コメント取得中に例外が発生
    } finally {
      setIsLoading(false);
    }
  }, [promptId]);
  
  // コメントの初回読み込み
  useEffect(() => {
    if (promptId) {
      fetchComments();
    }
  }, [fetchComments, promptId]);
  
  // リアルタイム購読のセットアップ
  useEffect(() => {
    if (!promptId) return;
    
    // リアルタイム購読をセットアップ
    
    // チャンネル作成
    const channelName = `comments-channel-${promptId}`;
    const channel = supabase.channel(channelName);
    
    // 購読設定
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `prompt_id=eq.${promptId}`
      }, (payload) => {
        fetchComments();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'comments',
        filter: `prompt_id=eq.${promptId}`
      }, (payload) => {
        fetchComments();
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'comments',
        filter: `prompt_id=eq.${promptId}`
      }, (payload) => {
        fetchComments();
      })
      .subscribe((status) => {
        // 購読ステータスの管理
      });
    
    // クリーンアップ関数
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchComments, promptId]);

  // コメント送信
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !currentUser || !promptId) return;
    
    setIsSubmitting(true);
    
    try {
      // コメントを送信
      
      // 入力内容をローカル変数に保存（非同期処理の前に）
      const commentContent = newComment.trim();
      
      // 送信前にフォームをクリア（UX向上）
      setNewComment('');
      
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            prompt_id: promptId,
            user_id: currentUser.id,
            content: commentContent,
            is_edited: false
          }
        ])
        .select();
        
      if (error) {
        throw error;
      }
      
      // コメント送信成功
      
      // リアルタイム更新が遅れる場合に備え、手動でコメントリストを更新
      // 新しいコメントをローカルで追加
      if (data && data.length > 0) {
        const newCommentData = data[0] as Comment;
        
        // ユーザープロフィール情報を取得
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('username, display_name, avatar_url')
          .eq('id', currentUser.id)
          .single();
          
        if (!userError && userData) {
          newCommentData.user = {
            username: String(userData.username || ''),
            display_name: String(userData.display_name || ''),
            avatar_url: String(userData.avatar_url || '')
          };
        }
        
        // コメントリストの先頭に新しいコメントを追加（降順表示のため）
        setComments(prev => [newCommentData, ...prev]);
        setCommentCount(prev => prev + 1);
      }
      
      // 念のため全件取得も実行
      setTimeout(() => {
        fetchComments();
      }, 300);
      
    } catch (error) {
      alert('コメントの送信に失敗しました');
      // エラー時は入力内容を復元
      setNewComment(newComment);
    } finally {
      setIsSubmitting(false);
    }
  };

  // コメントの表示/非表示を切り替え
  const toggleHideComment = async (commentId: string) => {
    // 現在の状態を確認
    const isHidden = hiddenComments.includes(commentId);
    
    // 表示状態を更新
    const updatedHiddenComments = isHidden
      ? hiddenComments.filter(id => id !== commentId)
      : [...hiddenComments, commentId];
    
    setHiddenComments(updatedHiddenComments);
    
    // ローカルストレージに保存
    localStorage.setItem('hiddenComments', JSON.stringify(updatedHiddenComments));
    
    // ログインしているユーザーの場合、Supabaseにも設定を保存
    if (currentUser) {
      try {
        // 現在の設定を取得
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();
          
        if (error && error.code !== 'PGRST116') { // 'PGRST116'は結果が見つからないエラー
          // 設定取得エラー
        }
          
        // 設定をアップデートする
        const updatedSettings = {
          user_id: currentUser.id,
          hidden_comments: updatedHiddenComments,
          auto_hide_reported: data?.auto_hide_reported || userSettings.auto_hide_reported,
          updated_at: new Date().toISOString()
        };
        
        const { error: updateError } = await supabase
          .from('user_settings')
          .upsert(updatedSettings);
          
        if (updateError) {
          // 設定更新エラー
        }
      } catch (error) {
        // 設定保存エラー
      }
    }
    
    // メニューを閉じる
    setOpenMenuId(null);
  };

  // 報告ダイアログを開く
  const openReportDialog = (commentId: string) => {
    setSelectedCommentId(commentId);
    setIsReportDialogOpen(true);
    // メニューを閉じる
    setOpenMenuId(null);
  };
  
  // 報告ダイアログを閉じる
  const closeReportDialog = () => {
    setIsReportDialogOpen(false);
    
    // 自動非表示設定がオンなら、報告したコメントを非表示にする
    if (userSettings.auto_hide_reported && selectedCommentId && !hiddenComments.includes(selectedCommentId)) {
      toggleHideComment(selectedCommentId);
    }
    
    setSelectedCommentId(null);
  };

  // メニューの表示/非表示を切り替え
  const toggleMenu = (commentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpenMenuId(prev => prev === commentId ? null : commentId);
  };

  // ドキュメントクリックでメニューを閉じる
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <h3 className="text-lg font-medium mb-4">コメント ({commentCount})</h3>
      
      {isLoading ? (
        <div className="py-4 text-center text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500 mx-auto mb-2"></div>
          <p>コメントを読み込み中...</p>
        </div>
      ) : (
        <div className="space-y-6 mb-6">
          {comments.length > 0 ? (
            comments.map((comment) => (
              !hiddenComments.includes(comment.id) && (
                <div key={comment.id} className="flex space-x-3 group">
                  <Avatar 
                    src={comment.user?.avatar_url}
                    displayName={getDisplayName(comment.user?.display_name)}
                    size="sm"
                    className="mr-2"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {comment.user?.display_name || comment.user?.username || '匿名ユーザー'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.created_at), { 
                            addSuffix: true, 
                            locale: ja 
                          })}
                        </span>
                      </div>
                      <div className="relative">
                        <button 
                          className="text-gray-400 hover:text-gray-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => toggleMenu(comment.id, e)}
                          aria-label="コメントメニュー"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {openMenuId === comment.id && (
                          <div 
                            className="absolute right-0 top-6 mt-1 bg-white shadow-lg rounded-md border border-gray-200 py-1 z-[100] w-32"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button 
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => toggleHideComment(comment.id)}
                            >
                              非表示にする
                            </button>
                            <button
                              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                              onClick={() => openReportDialog(comment.id)}
                            >
                              報告する
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm mt-1 text-gray-700">{comment.content}</p>
                  </div>
                </div>
              )
            ))
          ) : (
            <div className="py-6 text-center text-gray-500">
              <p>コメントはまだありません</p>
              <p className="text-sm mt-1">最初のコメントを投稿しましょう</p>
            </div>
          )}
        </div>
      )}

      <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmitComment}>
        <div className="flex gap-3">
          <Avatar 
            src={currentUser?.user_metadata?.avatar_url}
            displayName={getDisplayName(currentUser?.user_metadata?.full_name)}
            size="sm"
            className="mr-2"
          />
          <div className="flex-1 relative">
            <textarea 
              className="flex w-full rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none min-h-[80px] p-3 pr-10" 
              placeholder="コメントを入力..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={!currentUser || isSubmitting}
            />
            <button 
              type="submit" 
              disabled={!currentUser || isSubmitting || !newComment.trim()} 
              className="absolute bottom-3 right-3 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send h-5 w-5">
                <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path>
                <path d="m21.854 2.147-10.94 10.939"></path>
              </svg>
            </button>
          </div>
        </div>
        {!currentUser && (
          <p className="text-sm text-center text-gray-500">
            コメントするにはログインしてください
          </p>
        )}
      </form>

      {/* 報告ダイアログ */}
      <ReportDialog
        open={isReportDialogOpen}
        onOpenChange={(open: boolean) => {
          if (!open) closeReportDialog();
        }}
        targetId={selectedCommentId || ''}
        promptId={promptId}
        targetType="comment"
      />
    </div>
  );
};

export default Comments; 