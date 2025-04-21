import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import Link from 'next/link';
import { Badge } from '../../components/ui/badge';
import { Heart, Share2, MessageSquare, MoreHorizontal, Flag, Send } from 'lucide-react';
import PurchaseDialog from './PurchaseDialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '../../components/ui/dialog';
import { toast } from '../../components/ui/use-toast';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../../components/ui/dropdown-menu';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/ui/loading-spinner';

interface PurchaseSectionProps {
  wordCount: number;
  price: number;
  tags: string[];
  reviewers: string[];
  reviewCount: number;
  likes: number;
  author: {
    name: string;
    avatarUrl: string;
    bio: string;
    website: string;
    userId: string;
  };
  socialLinks: {
    icon: string;
    url: string;
  }[];
}

// コメントの型定義
interface CommentType {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

// URLを表示用に加工する関数を追加
const formatWebsiteUrl = (url: string) => {
  if (!url) return '';
  
  try {
    // URLからホスト名を抽出
    const hostname = new URL(url).hostname;
    return hostname;
  } catch (e) {
    // 無効なURLの場合はそのまま返す
    return url;
  }
};

// イニシャル取得関数
const getInitials = (name: string): string => {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};

const PurchaseSection: React.FC<PurchaseSectionProps> = ({ 
  wordCount, 
  price, 
  tags, 
  reviewers, 
  reviewCount,
  likes: initialLikes,
  author,
  socialLinks
}) => {
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCommentSectionVisible, setIsCommentSectionVisible] = useState(true);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [promptId, setPromptId] = useState<string>("");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false); // いいね処理中のローディング状態
  const [isFollowLoading, setIsFollowLoading] = useState(false); // フォロー処理中のローディング状態

  // Get the prompt ID from the URL
  useEffect(() => {
    const pathname = window.location.pathname;
    const id = pathname.split('/').pop();
    if (id) {
      setPromptId(id);
      // プロンプトIDが取得できたらすぐにコメントを読み込む
      fetchComments(id);
    }
  }, []);

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
        
        // ユーザープロフィール情報も取得
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profileData) {
          // プロフィール情報をcurrentUserに追加
          setCurrentUser({
            ...session.user,
            avatar_url: profileData.avatar_url || session.user.user_metadata?.avatar_url,
            username: profileData.username || session.user.user_metadata?.username,
            display_name: profileData.display_name || session.user.user_metadata?.full_name
          });
        }
      }
    };
    
    fetchUser();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // セッション変更時にもプロフィール情報を取得
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profileData }) => {
            if (profileData) {
              setCurrentUser({
                ...session.user,
                avatar_url: profileData.avatar_url || session.user.user_metadata?.avatar_url,
                username: profileData.username || session.user.user_metadata?.username,
                display_name: profileData.display_name || session.user.user_metadata?.full_name
              });
            } else {
              setCurrentUser(session.user);
            }
          });
      } else {
        setCurrentUser(null);
      }
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // ユーザーのいいね状態を取得
  useEffect(() => {
    if (promptId && currentUser) {
      checkUserLikeStatus();
      checkUserFollowStatus(); // フォロー状態も確認
    }
  }, [promptId, currentUser]);

  // ユーザーがいいねしているか確認
  const checkUserLikeStatus = async () => {
    if (!currentUser || !promptId) return;

    try {
      // シンプルなクエリに修正
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('prompt_id', promptId)
        .eq('user_id', currentUser.id)
        .limit(1);

      if (!error && data && data.length > 0) {
        setLiked(true);
      } else if (error) {
        console.error("いいね状態取得エラー:", error);
      }
    } catch (err) {
      console.error("いいね状態取得エラー:", err);
    }
  };

  // ユーザーがフォローしているか確認
  const checkUserFollowStatus = async () => {
    if (!currentUser || !author?.userId) return;

    try {
      // シンプルなクエリに修正
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', author.userId)
        .limit(1);

      if (!error && data && data.length > 0) {
        setIsFollowing(true);
      } else if (error) {
        console.error("フォロー状態取得エラー:", error);
      }
    } catch (err) {
      console.error("フォロー状態取得エラー:", err);
    }
  };

  // いいねをAPIで処理する関数
  const toggleLike = async () => {
    if (!currentUser) {
      toast({
        title: "ログインが必要です",
        description: "いいねするにはログインしてください",
        variant: "destructive",
      });
      return false;
    }

    if (!promptId || isLikeLoading) return false;

    setIsLikeLoading(true);
    
    try {
      if (liked) {
        // いいねを削除
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('prompt_id', promptId)
          .eq('user_id', currentUser.id);

        if (error) {
          console.error("いいね削除エラー:", error);
          toast({
            title: "いいねの削除に失敗しました",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }
        
        // 成功したらカウント減少
        setLikes(prev => Math.max(0, prev - 1));
        setLiked(false);
        return true;
      } else {
        // いいねを追加
        const { error } = await supabase
          .from('likes')
          .insert({
            prompt_id: promptId,
            user_id: currentUser.id,
          });

        if (error) {
          console.error("いいね追加エラー:", error);
          toast({
            title: "いいねの追加に失敗しました",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }
        
        // 成功したらカウント増加
        setLikes(prev => prev + 1);
        setLiked(true);
        return true;
      }
    } catch (err) {
      console.error("いいね処理中のエラー:", err);
      toast({
        title: "エラーが発生しました",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLikeLoading(false);
    }
  };

  // フォロー/アンフォローを処理する関数
  const toggleFollow = async () => {
    if (!currentUser) {
      toast({
        title: "ログインが必要です",
        description: "フォローするにはログインしてください",
        variant: "destructive",
      });
      return false;
    }

    if (!author?.userId || isFollowLoading) return false;

    setIsFollowLoading(true);
    setIsAnimating(true);
    
    try {
      if (isFollowing) {
        // フォロー解除
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', author.userId);

        if (error) {
          console.error("フォロー解除エラー:", error);
          toast({
            title: "フォロー解除に失敗しました",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }
        
        // 成功したらフォロー状態を更新
        setIsFollowing(false);
        return true;
      } else {
        // フォロー追加
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: author.userId,
          });

        if (error) {
          console.error("フォロー追加エラー:", error);
          toast({
            title: "フォロー追加に失敗しました",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }
        
        // 成功したらフォロー状態を更新
        setIsFollowing(true);
        return true;
      }
    } catch (err) {
      console.error("フォロー処理中のエラー:", err);
      toast({
        title: "エラーが発生しました",
        variant: "destructive",
      });
      return false;
    } finally {
      setTimeout(() => {
        setIsAnimating(false);
        setIsFollowLoading(false);
      }, 300);
    }
  };

  const fetchComments = async (promptId: string) => {
    if (!promptId) {
      console.error("プロンプトIDが指定されていません");
      return;
    }
    
    setIsCommentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles(id, username, display_name, avatar_url)
        `)
        .eq('prompt_id', promptId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("コメント取得エラー:", error);
        toast({
          title: "コメントの取得に失敗しました",
          description: "しばらくしてから再度お試しください",
          variant: "destructive",
        });
      } else {
        // 型キャストの処理を修正
        const safeComments = Array.isArray(data) ? data.map(comment => {
          // データの安全な取得のために、Optional Chainingとnullishチェックを使用
          const userObj = comment.user as any || {};
          
          return {
            id: String(comment.id || `temp-${Date.now()}`),
            user_id: String(comment.user_id || ''),
            content: String(comment.content || ''),
            created_at: String(comment.created_at || new Date().toISOString()),
            user: {
              username: userObj.username ? String(userObj.username) : undefined,
              display_name: userObj.display_name ? String(userObj.display_name) : undefined,
              avatar_url: userObj.avatar_url ? String(userObj.avatar_url) : undefined
            }
          } as CommentType;
        }) : [];
        
        setComments(safeComments);
        setCommentCount(safeComments.length);
      }
    } catch (err) {
      console.error("コメント取得中の例外:", err);
    } finally {
      setIsCommentsLoading(false);
    }
  };

  // Fetch comments when section is visible and promptId is available
  useEffect(() => {
    if (promptId) {
      fetchComments(promptId);

      // リアルタイム更新のためのチャンネル設定
      const channel = supabase
        .channel(`comments-${promptId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'comments',
            filter: `prompt_id=eq.${promptId}`
          },
          (payload) => {
            // ペイロードの種類に応じて異なる処理を行う
            if (payload.eventType === 'INSERT') {
              // 新しいコメントが追加された場合
              const newComment = payload.new as CommentType;
              
              // ユーザー情報を取得
              supabase
                .from('profiles')
                .select('id, username, display_name, avatar_url')
                .eq('id', newComment.user_id)
                .single()
                .then(({ data: userData, error: userError }) => {
                  if (!userError && userData) {
                    // 既存のコメントに新しいコメントを追加
                    setComments(prevComments => {
                      // 既に同じIDのコメントがあれば追加しない
                      if (prevComments.some(comment => comment.id === newComment.id)) {
                        return prevComments;
                      }
                      
                      // 新しいコメントにユーザー情報を追加
                      const commentWithUser: CommentType = {
                        ...newComment,
                        user: userData
                      } as CommentType;
                      
                      // 新しいコメントを先頭に追加
                      return [commentWithUser, ...prevComments];
                    });
                    
                    // コメント数も更新
                    setCommentCount(prev => prev + 1);
                  } else {
                    // ユーザー情報が取得できない場合は全体を再取得
                    fetchComments(promptId);
                  }
                });
            } else if (payload.eventType === 'DELETE') {
              // コメントが削除された場合
              const deletedComment = payload.old as CommentType;
              setComments(prevComments => 
                prevComments.filter(comment => comment.id !== deletedComment.id)
              );
              setCommentCount(prev => Math.max(0, prev - 1));
            } else if (payload.eventType === 'UPDATE') {
              // コメントが更新された場合
              fetchComments(promptId);
            }
          }
        )
        .subscribe((status) => {
          if (status !== 'SUBSCRIBED') {
            console.warn('リアルタイム接続に問題が発生しました:', status);
          } else {
            console.log('コメントのリアルタイム更新を開始しました');
          }
        });

      // クリーンアップ関数
      return () => {
        console.log('コメントのリアルタイム更新を停止します');
        supabase.removeChannel(channel);
      };
    }
  }, [promptId]);

  const handleFollowClick = async () => {
    const success = await toggleFollow();
    
    if (success) {
      // 操作が成功した場合のみトースト表示
      if (isFollowing) {
        toast({
          title: `${author.name}さんのフォローを解除しました`,
          variant: "destructive"
        });
      } else {
        toast({
          title: `${author.name}さんをフォローしました`,
          description: "新しい投稿があればお知らせします",
        });
      }
    }
  };

  const handleLikeClick = async () => {
    const success = await toggleLike();
    
    if (success) {
      // 操作が成功した場合のみトースト表示
      if (liked) {
        toast({
          title: "いいねを取り消しました",
        });
      } else {
        toast({
          title: "いいねしました",
          description: "このプロンプトにいいねしました",
        });
      }
    }
  };

  const handleShareClick = () => {
    setIsShareDialogOpen(true);
  };

  const handleCommentClick = () => {
    setIsCommentSectionVisible(!isCommentSectionVisible);
    if (!isCommentSectionVisible && promptId) {
      fetchComments(promptId);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: "ログインが必要です",
        description: "コメントを投稿するにはログインしてください",
        variant: "destructive",
      });
      return;
    }
    
    if (!promptId) {
      console.error("プロンプトIDが指定されていません");
      return;
    }
    
    if (!newComment.trim()) return;
    
    setIsSubmittingComment(true);
    
    try {
      // 画面表示を即時更新するため、現在のユーザー情報を使用して一時的なコメントを作成
      const tempComment: CommentType = {
        id: `temp-${Date.now()}`,
        user_id: currentUser.id,
        content: newComment.trim(),
        created_at: new Date().toISOString(),
        user: {
          username: currentUser?.user_metadata?.username,
          display_name: currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name,
          avatar_url: currentUser?.user_metadata?.avatar_url
        }
      };
      
      // 一時的なコメントを追加して即時表示
      setComments(prev => [tempComment, ...prev]);
      setCommentCount(prev => prev + 1);
      
      // フォームをクリア
      setNewComment('');
      
      // 実際のコメントをデータベースに保存
      const { error, data } = await supabase
        .from('comments')
        .insert({
          prompt_id: promptId,
          user_id: currentUser.id,
          content: tempComment.content,
        })
        .select();
      
      if (error) {
        console.error("コメント投稿エラー:", error);
        
        // エラーの場合、一時的なコメントを削除
        setComments(prev => prev.filter(comment => comment.id !== tempComment.id));
        setCommentCount(prev => prev - 1);
        
        // エラーメッセージを表示
        toast({
          title: "コメントの投稿に失敗しました",
          description: error.message,
          variant: "destructive",
        });
        
        // 入力内容を復元
        setNewComment(tempComment.content);
      } else {
        toast({
          title: "コメントを投稿しました",
          variant: "default",
        });
        
        // 一時的なコメントを実際のコメントに置き換える処理は、
        // リアルタイム更新のリスナーが処理するのでここでは行わない
      }
    } catch (err) {
      console.error("コメント投稿中の例外:", err);
      toast({
        title: "エラーが発生しました",
        description: "コメントの投稿中に問題が発生しました",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReport = () => {
    setIsReportDialogOpen(false);
    if (reportReason.trim()) {
      toast({
        title: "報告を受け付けました",
        description: "ご報告ありがとうございます。内容を確認いたします。",
      });
      setReportReason("");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "コピーしました",
        description: "クリップボードにコピーしました",
      });
    }).catch(err => {
      console.error('クリップボードへのコピーに失敗しました:', err);
    });
  };

  return (
    <div className="mt-16 border-t border-gray-200 pt-10">
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {tags.map((tag, index) => (
          <Badge 
            key={index} 
            variant="outline" 
            className="px-4 py-1 rounded-sm bg-gray-50 hover:bg-gray-100 cursor-pointer"
          >
            #{tag}
          </Badge>
        ))}
      </div>
      
      {/* Social interaction buttons */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button 
            className={`flex items-center ${liked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-700'} focus:outline-none transition-colors ${isLikeLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={handleLikeClick}
            disabled={isLikeLoading}
          >
            <Heart className={`h-6 w-6 mr-1 ${liked ? 'fill-current text-red-500' : 'text-gray-500'} transition-colors`} />
            <span>{likes}</span>
          </button>
          <button 
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={handleShareClick}
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button 
            className={`flex items-center ${isCommentSectionVisible ? 'text-blue-500 hover:text-blue-600' : 'text-gray-500 hover:text-gray-700'} focus:outline-none transition-colors`}
            onClick={handleCommentClick}
          >
            <MessageSquare className={`h-5 w-5 ${isCommentSectionVisible ? 'text-blue-500' : ''}`} />
            <span className="ml-1 text-sm">{commentCount}</span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)}>
                <Flag className="h-4 w-4 mr-2" />
                報告する
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* コメントセクション - 位置を上に移動 */}
      {isCommentSectionVisible && (
        <div className="mb-8 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium mb-4">コメント ({commentCount})</h3>
          
          {/* コメントリスト */}
          <div className="space-y-4 mt-4">
            {isCommentsLoading ? (
              <div className="flex justify-center p-4">
                <LoadingSpinner size="md" />
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3 p-3 rounded-lg bg-card hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0">
                    {comment.user?.avatar_url ? (
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={comment.user.avatar_url} 
                          alt={comment.user?.display_name || comment.user?.username || "ユーザー"} 
                        />
                        <AvatarFallback>
                          {(comment.user?.display_name || comment.user?.username || "U").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {(comment.user?.display_name || comment.user?.username || "U").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-foreground">
                        {comment.user?.display_name || comment.user?.username || "不明なユーザー"}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { 
                          addSuffix: true,
                          locale: ja 
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-foreground leading-relaxed font-noto break-words whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-muted-foreground font-noto font-medium">まだコメントはありません</p>
                <p className="text-sm text-muted-foreground font-noto mt-1">最初のコメントを投稿して会話を始めましょう！</p>
              </div>
            )}
          </div>
          
          {/* コメント入力フォーム */}
          <form onSubmit={handleCommentSubmit} className="mt-4 flex flex-col gap-3">
            {currentUser ? (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 ml-2">
                  <AvatarImage
                    src={currentUser?.avatar_url || currentUser?.user_metadata?.avatar_url}
                    alt={currentUser?.username || currentUser?.user_metadata?.username || 'User avatar'}
                  />
                  <AvatarFallback>{getInitials(currentUser?.display_name || currentUser?.user_metadata?.full_name || 'User')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 relative">
                  <Textarea 
                    placeholder="コメントを入力..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="resize-none min-h-[80px] p-3 pr-10"
                    disabled={isSubmittingComment}
                  />
                  <button 
                    type="submit" 
                    disabled={isSubmittingComment || !newComment.trim()} 
                    className="absolute bottom-3 right-3 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center p-4 border border-gray-200 rounded-md">
                <p className="text-sm text-gray-500 mb-2">
                  コメントするにはログインしてください
                </p>
                <Link href="/login">
                  <Button size="sm" variant="outline">
                    ログイン
                  </Button>
                </Link>
              </div>
            )}
          </form>
        </div>
      )}
      
      {/* Author profile - Smaller version - 位置を下に移動 */}
      <div className="border-t border-gray-200 pt-6 mb-8">
        <div className="flex flex-col">
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
              <img 
                src={author.avatarUrl} 
                alt={author.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h4 className="text-sm font-medium">{author.name}</h4>
              <p className="text-xs text-gray-600 mt-1">
                <span>📚新刊『発信をお金にかえる勇気』予約開始！！</span>
              </p>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                著者、コンサルタント/『発信する勇気』（きずな出版）/ コンテンツビジネススクール主宰 / 公式メルマガ→
                <a href={author.website} className="text-gray-700 hover:underline" title={author.website}>
                  {formatWebsiteUrl(author.website)}
                </a>
              </p>
              
              <div className="flex space-x-2 mt-2">
                {socialLinks.map((link, index) => (
                  <a key={index} href={link.url} className="text-gray-500 hover:text-gray-700">
                    <div className="w-5 h-5 flex items-center justify-center rounded-sm bg-gray-200">
                      <span className="text-xs">{link.icon.charAt(0).toUpperCase()}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          <Button 
            className={`${
              isFollowing 
                ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100' 
                : 'bg-gray-700 text-white hover:bg-gray-600'
            } rounded-sm text-xs py-1 px-5 h-auto transition-all duration-200 ${
              isAnimating ? 'scale-95' : ''
            } w-auto mx-auto block ${isFollowLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={handleFollowClick}
            disabled={isFollowLoading}
          >
            {isFollowing ? 'フォロー中' : 'フォロー'}
          </Button>
        </div>
      </div>
      
      <PurchaseDialog
        isOpen={isPurchaseDialogOpen}
        onClose={() => setIsPurchaseDialogOpen(false)}
        prompt={{
          title: author.name,
          author,
          price
        }}
      />

      {/* 共有ダイアログ */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>共有</DialogTitle>
            <DialogDescription>
              このプロンプトを共有する方法を選択してください
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  className="flex-1 justify-center"
                  onClick={() => window.open("https://twitter.com/intent/tweet?text=すごいプロンプトを見つけました！&url=" + window.location.href, "_blank")}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                  X（Twitter）
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 justify-center"
                  onClick={() => window.open("https://www.facebook.com/sharer/sharer.php?u=" + window.location.href, "_blank")}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  className="flex-1 justify-center"
                  onClick={() => window.open("https://line.me/R/msg/text/?" + window.location.href, "_blank")}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" fill="#06C755">
                    <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.572-3.844 2.572-5.992zm-18.988-2.595c.129 0 .234.105.234v4.153h2.287c.129 0 .233.104.233.233v.842a.233.233 0 01-.233.234H4.781a.233.233 0 01-.234-.234V7.943c0-.129.105-.234.234-.234h.465zm14.701 0c.129 0 .233.105.233.234v.842a.232.232 0 01-.233.234h-2.287v.922h2.287c.129 0 .233.105.233.234v.842a.232.232 0 01-.233.234h-2.287v.922h2.287c.129 0 .233.105.233.234v.842a.232.232 0 01-.233.234h-3.363a.233.233 0 01-.234-.234V7.943c0-.129.105-.234.234-.234h3.363zm-10.12.002c.128 0 .233.104.233.233v4.153c0 .129-.105.234-.233.234h-.842a.233.233 0 01-.234-.234V7.944c0-.129.105-.233.234-.233h.842zm2.894 0a.233.233 0 01.233.233v4.153a.232.232 0 01-.233.234h-.842a.232.232 0 01-.233-.234V7.944c0-.129.104-.233.233-.233h.842z" />
                  </svg>
                  LINE
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 justify-center"
                  onClick={() => copyToClipboard(window.location.href)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  URLをコピー
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                閉じる
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 報告ダイアログ */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>コンテンツを報告</DialogTitle>
            <DialogDescription>
              このコンテンツを報告する理由を教えてください。すべての報告は匿名で処理されます。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea 
              placeholder="報告の詳細を入力してください..." 
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsReportDialogOpen(false)}>
              キャンセル
            </Button>
            <Button type="button" onClick={handleReport} disabled={!reportReason.trim()}>
              報告する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseSection;
