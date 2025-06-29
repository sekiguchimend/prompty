import React, { useEffect, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { supabase } from '../../lib/supabaseClient';
import { MoreVertical, Heart, MessageCircle, ChevronDown, ChevronRight, User } from 'lucide-react';
import ReportDialog from '../shared/ReportDialog';
import { Avatar } from '../shared/Avatar';
import { getDisplayName } from '../../lib/avatar-utils';
import { CommentWithUser } from '../../types/entities/comment';
import Link from 'next/link';

type UserSettings = {
  auto_hide_reported: boolean;
  hidden_comments: string[];
};

type CommentsProps = {
  promptId: string;
};

const Comments: React.FC<CommentsProps> = ({ promptId }) => {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [collapsedComments, setCollapsedComments] = useState<string[]>([]);

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

  // コメントの取得関数を拡張（階層構造とリプライを考慮）
  const fetchComments = useCallback(async () => {
    if (!promptId) return;
    
    setIsLoading(true);
    try {
      // 全てのコメントを取得（parent_idでソート）
      const { data, error, count } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles(username, display_name, avatar_url)
        `, { count: 'exact' })
        .eq('prompt_id', promptId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('コメント取得エラー:', error);
        return;
      }
      
      // データを階層構造に変換
      const commentsMap = new Map<string, CommentWithUser>();
      const rootComments: CommentWithUser[] = [];

      // まず全てのコメントをマップに追加
      (data || []).forEach(item => {
        const commentItem = item as any;
        const typedComment: CommentWithUser = {
          id: commentItem.id,
          content: commentItem.content,
          created_at: commentItem.created_at,
          user_id: commentItem.user_id,
          prompt_id: commentItem.prompt_id,
          parent_id: commentItem.parent_id,
          updated_at: commentItem.updated_at,
          is_edited: commentItem.is_edited,
          user: commentItem.user ? {
            username: String(commentItem.user.username || ''),
            display_name: commentItem.user.display_name ? String(commentItem.user.display_name) : '',
            avatar_url: String(commentItem.user.avatar_url || '')
          } : undefined,
          like_count: 0, // デフォルト値
          liked_by_user: false, // デフォルト値
          reply_count: 0, // デフォルト値
          replies: [],
          is_collapsed: collapsedComments.includes(commentItem.id)
        };
        commentsMap.set(commentItem.id, typedComment);
      });

      // いいね情報を別途取得（comment_likesテーブルが存在する場合のみ）
      try {
        const commentIds = Array.from(commentsMap.keys());
        if (commentIds.length > 0) {
          const { data: likesData, error: likesError } = await supabase
            .from('comment_likes')
            .select('comment_id, user_id')
            .in('comment_id', commentIds);

          if (!likesError && likesData) {
            // いいね情報を集計
            const likesCount: { [key: string]: number } = {};
            const userLikes: { [key: string]: boolean } = {};

            likesData.forEach((like: any) => {
              likesCount[like.comment_id] = (likesCount[like.comment_id] || 0) + 1;
              if (currentUser && like.user_id === currentUser.id) {
                userLikes[like.comment_id] = true;
              }
            });

            // コメントにいいね情報を追加
            commentsMap.forEach((comment, commentId) => {
              comment.like_count = likesCount[commentId] || 0;
              comment.liked_by_user = userLikes[commentId] || false;
            });
          }
        }
      } catch (likesError) {
        console.log('いいね情報の取得をスキップしました（テーブルが存在しない可能性があります）');
      }

      // リプライ数を計算
      commentsMap.forEach((comment, commentId) => {
        const replyCount = Array.from(commentsMap.values()).filter(c => c.parent_id === commentId).length;
        comment.reply_count = replyCount;
      });

      // 階層構造を構築
      commentsMap.forEach(comment => {
        if (comment.parent_id) {
          const parent = commentsMap.get(comment.parent_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(comment);
            // リプライを時間順にソート
            parent.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          }
        } else {
          rootComments.push(comment);
        }
      });

      setComments(rootComments);
      setCommentCount(count || 0);
    } catch (err) {
      console.error('コメント取得中に例外が発生:', err);
    } finally {
      setIsLoading(false);
    }
  }, [promptId, currentUser?.id, collapsedComments]);
  
  // promptIdが変更された時にコメント状態をリセット
  useEffect(() => {
    if (promptId) {
      // 記事IDが変わった時は全てのコメント関連状態をリセット
      setComments([]);
      setCommentCount(0);
      setNewComment('');
      setIsSubmitting(false);
      setReplyingTo(null);
      setReplyContent('');
      setOpenMenuId(null);
      setSelectedCommentId(null);
      setIsReportDialogOpen(false);
      
      // 新しい記事のコメントを取得
      fetchComments();
    }
  }, [promptId, fetchComments]);
  
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
      // コメントいいねのリアルタイム更新
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comment_likes'
      }, (payload) => {
        fetchComments();
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'comment_likes'
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

  // コメント送信（APIエンドポイント経由）
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !currentUser || !promptId) return;
    
    setIsSubmitting(true);
    
    // 入力内容をローカル変数に保存（非同期処理の前に）
    const commentContent = newComment.trim();
    
    try {
      // 送信前にフォームをクリア（UX向上）
      setNewComment('');
      
      // APIを呼び出し
      const response = await fetch('/api/content/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt_id: promptId,
          user_id: currentUser.id,
          content: commentContent,
          parent_id: null // 通常のコメント
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'コメントの送信に失敗しました');
      }

      // 成功時はコメントを再取得
      fetchComments();
      
    } catch (error: any) {
      console.error('コメント送信エラー:', error);
      alert(error.message || 'コメントの送信に失敗しました');
      // エラー時は入力内容を復元
      setNewComment(commentContent);
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

  // いいね機能の実装（APIエンドポイント経由）
  const toggleCommentLike = async (commentId: string) => {
    if (!currentUser) {
      alert('いいねするにはログインが必要です');
      return;
    }

    try {
      // 楽観的更新（UIを先に更新）
      const updatedComments = [...comments];
      const updateCommentLike = (commentsList: CommentWithUser[]) => {
        commentsList.forEach(comment => {
          if (comment.id === commentId) {
            comment.liked_by_user = !comment.liked_by_user;
            comment.like_count = (comment.like_count || 0) + (comment.liked_by_user ? 1 : -1);
          }
          if (comment.replies) {
            updateCommentLike(comment.replies);
          }
        });
      };
      updateCommentLike(updatedComments);
      setComments(updatedComments);

      // APIを呼び出し
      const response = await fetch('/api/interactions/comment-like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commentId }),
      });

      if (!response.ok) {
        // エラーの場合は元に戻す
        fetchComments();
        
        if (response.status === 401) {
          alert('ログインが必要です');
        } else if (response.status === 404) {
          alert('コメントが見つかりません');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'いいね操作に失敗しました');
        }
        return;
      }

      const result = await response.json();
      
      // 成功時は正確な数値で更新
      const finalComments = [...comments];
      const updateFinalCommentLike = (commentsList: CommentWithUser[]) => {
        commentsList.forEach(comment => {
          if (comment.id === commentId) {
            comment.liked_by_user = result.liked;
            comment.like_count = result.count;
          }
          if (comment.replies) {
            updateFinalCommentLike(comment.replies);
          }
        });
      };
      updateFinalCommentLike(finalComments);
      setComments(finalComments);

    } catch (error: any) {
      console.error('いいね操作エラー:', error);
      // エラー時は状態を復元
      fetchComments();
      alert(error.message || 'いいね操作に失敗しました');
    }
  };

  // リプライ送信（APIエンドポイント経由）
  const handleReplySubmit = async (parentId: string) => {
    if (!replyContent.trim() || !currentUser) return;

    setIsSubmitting(true);
    
    // 入力内容をローカル変数に保存
    const replyContentData = replyContent.trim();
    
    try {
      // 楽観的更新（UIをクリア）
      setReplyContent('');
      setReplyingTo(null);

      // APIを呼び出し
      const response = await fetch('/api/content/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt_id: promptId,
          user_id: currentUser.id,
          content: replyContentData,
          parent_id: parentId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'リプライの送信に失敗しました');
      }

      // 成功時はコメントを再取得
      fetchComments();
      
    } catch (error: any) {
      console.error('リプライ送信エラー:', error);
      alert(error.message || 'リプライの送信に失敗しました');
      // エラー時は入力内容を復元
      setReplyContent(replyContentData);
      setReplyingTo(parentId);
    } finally {
      setIsSubmitting(false);
    }
  };

  // コメントの折りたたみ/展開
  const toggleCommentCollapse = (commentId: string) => {
    setCollapsedComments(prev => 
      prev.includes(commentId) 
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    );
  };

  // コメントコンポーネント（再帰的にレンダリング）
  const CommentItem: React.FC<{ comment: CommentWithUser; depth?: number }> = ({ comment, depth = 0 }) => {
    const isHidden = hiddenComments.includes(comment.id);
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isCollapsed = comment.is_collapsed;

    if (isHidden) return null;

  return (
      <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
        <div className="flex space-x-3 group">
          <Link href={`/users/${comment.user?.username || comment.user_id}`} className="flex-shrink-0">
                  <Avatar 
                    src={comment.user?.avatar_url}
                    displayName={getDisplayName(comment.user?.display_name, comment.user?.username)}
                    size="sm"
              className="mr-2 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
                  />
          </Link>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                <Link href={`/users/${comment.user?.username || comment.user_id}`} className="hover:underline">
                        <span className="font-medium text-sm">
                          {getDisplayName(comment.user?.display_name, comment.user?.username)}
                        </span>
                </Link>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.created_at), { 
                            addSuffix: true, 
                            locale: ja 
                          })}
                        </span>
                {comment.is_edited && (
                  <span className="text-xs text-gray-400">(編集済み)</span>
                )}
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
            
            {/* アクションボタン */}
            <div className="flex items-center gap-4 mt-3">
              <button
                onClick={() => toggleCommentLike(comment.id)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all duration-200 ${
                  comment.liked_by_user 
                    ? 'text-red-500 hover:text-red-600 hover:bg-red-50' 
                    : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                } ${!currentUser ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                disabled={!currentUser}
                title={!currentUser ? 'ログインしていいねしよう' : comment.liked_by_user ? 'いいねを取り消す' : 'いいね'}
              >
                <Heart 
                  className={`h-4 w-4 transition-all ${comment.liked_by_user ? 'fill-current scale-110' : ''}`} 
                />
                <span className="font-medium">{comment.like_count || 0}</span>
              </button>
              
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all duration-200 ${
                  replyingTo === comment.id
                    ? 'text-blue-500 bg-blue-50'
                    : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                } ${!currentUser ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                disabled={!currentUser}
                title={!currentUser ? 'ログインして返信しよう' : replyingTo === comment.id ? '返信をキャンセル' : '返信する'}
              >
                <MessageCircle className="h-4 w-4" />
                <span>返信</span>
              </button>

              {hasReplies && (
                <button
                  onClick={() => toggleCommentCollapse(comment.id)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  title={isCollapsed ? '返信を表示' : '返信を非表示'}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 transition-transform" />
                  ) : (
                    <ChevronDown className="h-4 w-4 transition-transform" />
                  )}
                  <span className="font-medium">{comment.reply_count || comment.replies?.length || 0}件の返信</span>
                </button>
              )}
            </div>

            {/* リプライフォーム */}
            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-3">
                <Avatar 
                  src={currentUser?.user_metadata?.avatar_url}
                  displayName={getDisplayName(currentUser?.user_metadata?.full_name)}
                  size="sm"
                  className="mr-2"
                />
                <div className="flex-1 relative">
                  <textarea 
                    className="flex w-full rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none min-h-[60px] p-3 pr-20" 
                    placeholder={`@${getDisplayName(comment.user?.display_name, comment.user?.username)}さんに返信...`}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    disabled={!currentUser || isSubmitting}
                  />
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent('');
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                    >
                      キャンセル
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleReplySubmit(comment.id)}
                      disabled={!currentUser || isSubmitting || !replyContent.trim()} 
                      className="text-xs bg-blue-500 text-white px-3 py-1 rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                    >
                      返信
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* リプライ表示 */}
        {hasReplies && !isCollapsed && (
          <div className="mt-4 space-y-4">
            {comment.replies?.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

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
              <CommentItem key={comment.id} comment={comment} />
            ))
          ) : (
            <div className="py-8 text-center">
              <div className="flex flex-col items-center">
                <MessageCircle className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-600 font-medium">まだコメントがありません</p>
                <p className="text-sm text-gray-500 mt-1">
                  {currentUser 
                    ? '最初のコメントを投稿して会話を始めましょう！' 
                    : 'ログインしてコメントに参加しましょう'
                  }
                </p>
              </div>
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
        targetType="comment"
        targetId={selectedCommentId || ''}
        promptId={promptId}
      />
    </div>
  );
};

export default Comments; 