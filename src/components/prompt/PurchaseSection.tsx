import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/router';
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
import ReportDialog from '../shared/ReportDialog';
import { UnifiedAvatar, DEFAULT_AVATAR_URL } from '../index';

// ユーザー情報の型定義
interface AuthorInfo {
  name: string;
  avatarUrl: string;
  bio: string;
  website: string;
  userId: string;
  stripe_price_id?: string;
}

// ソーシャルリンクの型定義
interface SocialLink {
  icon: string;
  url: string;
}

// プロンプト詳細の型定義
interface PromptDetails {
  id?: string;
  title: string;
  author: AuthorInfo;
  price: number;
}

// コンポーネントのProps型定義
interface PurchaseSectionProps {
  wordCount: number;
  price: number;
  tags: string[];
  reviewers: string[];
  reviewCount: number;
  likes: number;
  author: AuthorInfo | null;
  socialLinks: SocialLink[];
}

// ユーザー型定義
interface User {
  id: string;
  email?: string;
  avatar_url?: string;
  username?: string;
  display_name?: string;
  user_metadata?: {
    avatar_url?: string;
    username?: string;
    full_name?: string;
    name?: string;
  };
}

// コメントの型定義
interface CommentType {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id?: string | null;
  replies?: CommentType[];
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
  const [isCommentSectionVisible, setIsCommentSectionVisible] = useState(false);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [promptId, setPromptId] = useState<string>("");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [commentLikes, setCommentLikes] = useState<{ [commentId: string]: { count: number; liked: boolean } }>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const router = useRouter();

  useEffect(() => {
    setLikes(initialLikes);
  }, [initialLikes]);

  // fetchComments関数を先に定義（useCallbackを使用）
  const fetchComments = useCallback(async (promptId: string) => {
    if (!promptId) {
      console.error("プロンプトIDが指定されていません");
      return;
    }
    
    setIsCommentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id, user_id, content, created_at, parent_id,
          user:profiles(id, username, display_name, avatar_url)
        `)
        .eq('prompt_id', promptId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("コメント取得エラー:", error);
        toast({
          title: "コメントの取得に失敗しました",
          description: "しばらくしてから再度お試しください",
          variant: "destructive",
        });
      } else {
        const safeComments = Array.isArray(data) ? data.map(comment => {
          const userObj = comment.user as any || {};
          
          return {
            id: String(comment.id || `temp-${Date.now()}`),
            user_id: String(comment.user_id || ''),
            content: String(comment.content || ''),
            created_at: String(comment.created_at || new Date().toISOString()),
            parent_id: comment.parent_id ? String(comment.parent_id) : null,
            replies: [],
            user: {
              username: userObj.username ? String(userObj.username) : undefined,
              display_name: userObj.display_name ? String(userObj.display_name) : undefined,
              avatar_url: userObj.avatar_url ? String(userObj.avatar_url) : undefined
            }
          } as CommentType;
        }) : [];
        
        // 階層構造を構築
        const commentMap = new Map<string, CommentType>();
        const rootComments: CommentType[] = [];
        
        // 全コメントをマップに登録
        safeComments.forEach(comment => {
          commentMap.set(comment.id, comment);
        });
        
        // 親子関係を構築
        safeComments.forEach(comment => {
          if (comment.parent_id) {
            const parent = commentMap.get(comment.parent_id);
            if (parent) {
              if (!parent.replies) parent.replies = [];
              parent.replies.push(comment);
            }
          } else {
            rootComments.push(comment);
          }
        });
        
        // 返信を日時順にソート（新しい順）
        rootComments.forEach(comment => {
          if (comment.replies) {
            comment.replies.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          }
        });
        
        // ルートコメントを新しい順にソート
        rootComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setComments(rootComments);
        setCommentCount(safeComments.length);
      }
    } catch (err) {
      console.error("コメント取得中の例外:", err);
    } finally {
      setIsCommentsLoading(false);
    }
  }, []);

  // routerからpromptIdを取得し、IDが変わった時にコメント状態をリセット
  useEffect(() => {
    const id = router.query.id as string;
    if (id && id !== promptId) {
      // 記事IDが変わった時は全てのコメント関連状態をリセット
      setPromptId(id);
      setComments([]);
      setCommentCount(0);
      setNewComment("");
      setIsSubmittingComment(false);
      setReplyingTo(null);
      setReplyContent('');
      setIsCommentSectionVisible(false);
      setCommentLikes({});
      
      // 新しい記事のコメントを取得
      fetchComments(id);
    }
  }, [router.query.id, promptId, fetchComments]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user as User);
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .eq('id', session.user.id)
          .single();
          
        if (profileData) {
          setCurrentUser({
            ...session.user,
            avatar_url: profileData.avatar_url || session.user.user_metadata?.avatar_url,
            username: profileData.username || session.user.user_metadata?.username,
            display_name: profileData.display_name || session.user.user_metadata?.full_name
          } as User);
        }
      }
    };
    
    fetchUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profileData }) => {
            if (profileData) {
              setCurrentUser({
                ...session.user,
                avatar_url: profileData.avatar_url || session.user.user_metadata?.avatar_url,
                username: profileData.username || session.user.user_metadata?.username,
                display_name: profileData.display_name || session.user.user_metadata?.full_name
              } as User);
            } else {
              setCurrentUser(session.user as User);
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

  useEffect(() => {
    if (promptId && currentUser) {
      checkUserLikeStatus();
      checkUserFollowStatus();
    } else if (promptId) {
      fetchCurrentLikeCount();
    }
  }, [promptId, currentUser]);

  const fetchCurrentLikeCount = async () => {
    if (!promptId) return;

    try {
      const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('prompt_id', promptId);

      if (!error && count !== null) {
        setLikes(count);
      }
    } catch (err) {
      console.error("いいね数取得エラー:", err);
    }
  };

  const checkUserLikeStatus = async () => {
    if (!currentUser || !promptId) return;

    try {
      const [likeStatusResult, likeCountResult] = await Promise.all([
        supabase
        .from('likes')
        .select('id')
        .eq('prompt_id', promptId)
        .eq('user_id', currentUser.id)
          .limit(1),
        supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('prompt_id', promptId)
      ]);

      if (!likeStatusResult.error && likeStatusResult.data && likeStatusResult.data.length > 0) {
        setLiked(true);
      } else if (likeStatusResult.error) {
        console.error("いいね状態取得エラー:", likeStatusResult.error);
      }

      if (!likeCountResult.error && likeCountResult.count !== null) {
        setLikes(likeCountResult.count);
      } else if (likeCountResult.error) {
        console.error("いいね数取得エラー:", likeCountResult.error);
      }
    } catch (err) {
      console.error("いいね状態取得エラー:", err);
    }
  };

  const checkUserFollowStatus = async () => {
    if (!currentUser || !author?.userId) return;

    try {
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
        
        setLikes(prev => Math.max(0, prev - 1));
        setLiked(false);
        return true;
      } else {
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

    if (currentUser.id === author.userId) {
      toast({
        title: "自分自身をフォローすることはできません",
        variant: "destructive",
      });
      return false;
    }

    setIsFollowLoading(true);
    setIsAnimating(true);
    
    try {
      if (isFollowing) {
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
        
        setIsFollowing(false);
        return true;
      } else {
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



  // Supabaseリアルタイム購読の設定
  useEffect(() => {
    if (promptId) {
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
            if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE' || payload.eventType === 'UPDATE') {
              fetchComments(promptId);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [promptId, fetchComments]);

  const handleFollowClick = async () => {
    if (!author) return;

    const success = await toggleFollow();
    
    if (success) {
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
      // コメントの内容を保存
      const commentContent = newComment.trim();
      
      // 先にフォームをクリア
      setNewComment('');
      
      // フォームの高さをリセット
      setTimeout(() => {
        const textareas = document.querySelectorAll('textarea[placeholder="コメントを入力..."]');
        textareas.forEach((textarea: Element) => {
          const textareaEl = textarea as HTMLTextAreaElement;
          textareaEl.style.height = '32px';
        });
      }, 0);
      
      const { error } = await supabase
        .from('comments')
        .insert({
          prompt_id: promptId,
          user_id: currentUser.id,
          content: commentContent,
        });
      
      if (error) {
        console.error("コメント投稿エラー:", error);
        // エラー時は入力内容を復元
        setNewComment(commentContent);
        toast({
          title: "コメントの投稿に失敗しました",
          description: "しばらくしてから再度お試しください",
          variant: "destructive",
        });
      } else {
        // 成功時はコメントリストを再取得（正確な情報で表示）
        await fetchComments(promptId);
        toast({
          title: "コメントを投稿しました",
          variant: "default",
        });
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

  const handleReportButtonClick = () => {
    if (!currentUser) {
      toast({
        title: "ログインが必要です",
        description: "報告機能を利用するにはログインしてください",
        variant: "destructive"
      });
      return;
    }
    setIsReportDialogOpen(true);
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

  // コメントのいいね状態を取得
  const fetchCommentLikes = async (promptId: string) => {
    if (!promptId) return;
    
    try {
      // すべてのコメントのいいね状態を取得
      const { data, error } = await supabase
        .from('comment_likes')
        .select('comment_id, user_id');

      if (!error && data) {
        const likesMap: { [commentId: string]: { count: number; liked: boolean } } = {};
        
        comments.forEach(comment => {
          const commentLikesData = data.filter(like => like.comment_id === comment.id);
          likesMap[comment.id] = {
            count: commentLikesData.length,
            liked: currentUser ? commentLikesData.some(like => like.user_id === currentUser.id) : false
          };
        });
        
        setCommentLikes(likesMap);
      }
    } catch (err) {
      console.error("コメントのいいね状態取得エラー:", err);
    }
  };

  useEffect(() => {
    if (promptId && comments.length > 0) {
      fetchCommentLikes(promptId);
    }
  }, [promptId, comments, currentUser]);

  // コメントのいいね切り替え
  const toggleCommentLike = async (commentId: string) => {
    if (!currentUser) {
      toast({
        title: "ログインが必要です",
        description: "いいねするにはログインしてください",
        variant: "destructive",
      });
      return;
    }

    if (!promptId) return;

    const currentLike = commentLikes[commentId] || { count: 0, liked: false };
    
    try {
      if (currentLike.liked) {
        // いいね削除
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUser.id);

        if (!error) {
          setCommentLikes(prev => ({
            ...prev,
            [commentId]: {
              count: Math.max(0, currentLike.count - 1),
              liked: false
            }
          }));
        }
      } else {
        // いいね追加
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: currentUser.id
          });

        if (!error) {
          setCommentLikes(prev => ({
            ...prev,
            [commentId]: {
              count: currentLike.count + 1,
              liked: true
            }
          }));
        }
      }
    } catch (err) {
      console.error("コメントのいいね処理エラー:", err);
      toast({
        title: "エラーが発生しました",
        variant: "destructive",
      });
    }
  };

  // リプライ送信
  const handleReplySubmit = async (parentCommentId: string) => {
    if (!currentUser || !replyContent.trim() || !promptId) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          prompt_id: promptId,
          user_id: currentUser.id,
          content: replyContent.trim(),
          parent_id: parentCommentId
        });

      if (!error) {
        setReplyContent('');
        setReplyingTo(null);
        
        // リプライフォームの高さをリセット
        setTimeout(() => {
          const textareas = document.querySelectorAll('textarea[placeholder*="さんに返信"]');
          textareas.forEach((textarea: Element) => {
            const textareaEl = textarea as HTMLTextAreaElement;
            textareaEl.style.height = '32px';
          });
        }, 0);
        
        fetchComments(promptId);
        toast({
          title: "返信を投稿しました",
        });
      } else {
        toast({
          title: "返信の投稿に失敗しました",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("返信投稿エラー:", err);
      toast({
        title: "エラーが発生しました",
        variant: "destructive",
      });
    }
  };

  // コメント削除機能
  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser || !promptId) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUser.id); // 自分のコメントのみ削除可能

      if (!error) {
        fetchComments(promptId);
        toast({
          title: "コメントを削除しました",
        });
      } else {
        toast({
          title: "コメントの削除に失敗しました",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("コメント削除エラー:", err);
      toast({
        title: "エラーが発生しました",
        variant: "destructive",
      });
    }
  };

  // コメントアイテムコンポーネント（再帰的階層表示対応）
  const CommentItem: React.FC<{ comment: CommentType; depth: number }> = React.memo(({ comment, depth }) => {
    const isOwnComment = currentUser && comment.user_id === currentUser.id;
    const hasReplies = comment.replies && comment.replies.length > 0;
    
    // リプライフォームのローカルstate（IME安定化のため）
    const [localReplyingTo, setLocalReplyingTo] = useState<string | null>(null);
    const [localReplyContent, setLocalReplyContent] = useState('');
    
    // ローカルリプライ送信ハンドラー
    const handleLocalReplySubmit = async (parentCommentId: string) => {
      if (!currentUser || !localReplyContent.trim() || !promptId) return;

      try {
        const { error } = await supabase
          .from('comments')
          .insert({
            prompt_id: promptId,
            user_id: currentUser.id,
            content: localReplyContent.trim(),
            parent_id: parentCommentId
          });

        if (!error) {
          setLocalReplyContent('');
          setLocalReplyingTo(null);
          
          fetchComments(promptId);
          toast({
            title: "返信を投稿しました",
          });
        } else {
          toast({
            title: "返信の投稿に失敗しました",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("返信投稿エラー:", err);
        toast({
          title: "エラーが発生しました",
          variant: "destructive",
        });
      }
    };

    return (
      <div className={`${depth > 0 ? 'ml-8 pl-4 border-l-2 border-gray-200' : ''}`}>
        <div className="flex space-x-3 p-3 rounded-lg bg-card hover:bg-gray-50 transition-colors">
          <div className="flex-shrink-0">
            {comment.user?.username ? (
              <Link href={`/users/${comment.user.username}`}>
                <UnifiedAvatar
                  src={comment.user?.avatar_url}
                  displayName={comment.user?.display_name || comment.user?.username || "ユーザー"}
                  size="md"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
            ) : (
              <UnifiedAvatar
                src={comment.user?.avatar_url}
                displayName={comment.user?.display_name || comment.user?.username || "ユーザー"}
                size="md"
              />
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {comment.user?.username ? (
                  <Link href={`/users/${comment.user.username}`}>
                    <p className="font-medium text-foreground hover:text-blue-600 cursor-pointer transition-colors">
                      {comment.user?.display_name || comment.user?.username || "不明なユーザー"}
                    </p>
                  </Link>
                ) : (
                  <p className="font-medium text-foreground">
                    {comment.user?.display_name || comment.user?.username || "不明なユーザー"}
                  </p>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { 
                    addSuffix: true,
                    locale: ja 
                  })}
                </span>
              </div>
              {/* 削除ボタン（自分のコメントのみ） */}
              {isOwnComment && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  title="削除"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
            <p className="mt-1 text-foreground leading-relaxed font-noto break-words whitespace-pre-wrap">
              {comment.content}
            </p>
            
            <div className="flex items-center gap-4 mt-3">
              <button
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                  commentLikes[comment.id]?.liked 
                    ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                    : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                }`}
                title="いいね"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleCommentLike(comment.id);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-all ${commentLikes[comment.id]?.liked ? 'fill-current' : ''}`} fill={commentLikes[comment.id]?.liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="font-medium">{commentLikes[comment.id]?.count || 0}</span>
              </button>
              
              <button
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                  localReplyingTo === comment.id
                    ? 'text-blue-500 bg-blue-50 hover:bg-blue-100'
                    : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                }`}
                title="返信する"
                onClick={() => {
                  setLocalReplyingTo(localReplyingTo === comment.id ? null : comment.id);
                  setLocalReplyContent('');
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>返信</span>
              </button>

              {/* 返信数表示 */}
              {hasReplies && (
                <span className="text-xs text-gray-500">
                  {comment.replies!.length}件の返信
                </span>
              )}
            </div>
            
            {/* リプライフォーム */}
            {localReplyingTo === comment.id && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (localReplyContent.trim()) {
                      handleLocalReplySubmit(comment.id);
                    }
                  }}
                  className="flex gap-2"
                >
                  {currentUser?.username ? (
                    <Link href={`/users/${currentUser.username}`}>
                      <UnifiedAvatar
                        src={currentUser?.avatar_url}
                        displayName={currentUser?.display_name || currentUser?.username || 'User'}
                        size="sm"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </Link>
                  ) : (
                    <UnifiedAvatar
                      src={currentUser?.avatar_url}
                      displayName={currentUser?.display_name || currentUser?.username || 'User'}
                      size="sm"
                    />
                  )}
                  <div className="flex-1">
                    <Textarea
                      key={`reply-${comment.id}`}
                      placeholder={`${comment.user?.display_name || comment.user?.username || "ユーザー"}さんに返信...`}
                      value={localReplyContent}
                      onChange={(e) => setLocalReplyContent(e.target.value)}
                      className="resize-none min-h-[32px] max-h-[100px] text-sm py-1.5 px-3 overflow-y-auto overflow-x-hidden leading-normal"
                      style={{
                        height: '32px',
                        minHeight: '32px',
                        lineHeight: '1.5',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                      }}
                      onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                        const target = e.target as HTMLTextAreaElement;
                        // IME入力中は高さ調整をスキップ
                        if (!(target as any).composing) {
                          target.style.height = '32px';
                          target.style.height = `${Math.min(target.scrollHeight, 100)}px`;
                        }
                      }}
                      onCompositionStart={(e) => {
                        // IME入力開始時にフラグを設定
                        (e.target as any).composing = true;
                      }}
                      onCompositionEnd={(e) => {
                        // IME入力終了時にフラグを解除し、高さを調整
                        (e.target as any).composing = false;
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = '32px';
                        target.style.height = `${Math.min(target.scrollHeight, 100)}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                          e.preventDefault();
                          e.stopPropagation();
                          if (localReplyContent.trim()) {
                            handleLocalReplySubmit(comment.id);
                          }
                        }
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!localReplyContent.trim()}
                    className="flex-shrink-0 p-1.5 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* 返信コメントを再帰表示 */}
        {hasReplies && (
          <div className="mt-2">
            {comment.replies!.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }, (prevProps, nextProps) => {
    // コメント内容が変わらない限り再レンダリングしない（ローカルstate使用により安定化）
    return (
      prevProps.comment.id === nextProps.comment.id &&
      prevProps.comment.content === nextProps.comment.content &&
      prevProps.depth === nextProps.depth &&
      JSON.stringify(prevProps.comment.replies) === JSON.stringify(nextProps.comment.replies)
    );
  });

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
              <DropdownMenuItem onClick={handleReportButtonClick}>
                <Flag className="h-4 w-4 mr-2" />
                報告する
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {isCommentSectionVisible && (
        <div className="mb-8 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium mb-4">コメント ({commentCount})</h3>
          
          <div className="space-y-4 mt-4">
            {isCommentsLoading ? (
              <div className="flex justify-center p-4">
                <LoadingSpinner size="md" />
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} depth={0} />
              ))
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-muted-foreground font-noto font-medium">まだコメントはありません</p>
                <p className="text-sm text-muted-foreground font-noto mt-1">最初のコメントを投稿して会話を始めましょう！</p>
              </div>
            )}
          </div>
          
          <form onSubmit={handleCommentSubmit} className="mt-4 flex flex-col gap-3">
            {currentUser ? (
              <div className="flex gap-2">
                {currentUser?.username ? (
                  <Link href={`/users/${currentUser.username}`}>
                    <UnifiedAvatar
                      src={currentUser?.avatar_url}
                      displayName={currentUser?.display_name || currentUser?.username || 'User'}
                      size="sm"
                      className="ml-2 cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  </Link>
                ) : (
                  <UnifiedAvatar
                    src={currentUser?.avatar_url}
                    displayName={currentUser?.display_name || currentUser?.username || 'User'}
                    size="sm"
                    className="ml-2"
                  />
                )}
                <div className="flex-1">
                  <Textarea 
                    placeholder="コメントを入力..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="resize-none min-h-[32px] max-h-[120px] py-1.5 px-3 overflow-y-auto overflow-x-hidden leading-normal"
                    disabled={isSubmittingComment}
                    style={{
                      height: '32px',
                      minHeight: '32px',
                      lineHeight: '1.5',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    }}
                    onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                      const target = e.target as HTMLTextAreaElement;
                      // IME入力中は高さ調整をスキップ
                      if (!(target as any).composing) {
                        target.style.height = '32px';
                        target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                      }
                    }}
                    onCompositionStart={(e) => {
                      // IME入力開始時にフラグを設定
                      (e.target as any).composing = true;
                    }}
                    onCompositionEnd={(e) => {
                      // IME入力終了時にフラグを解除し、高さを調整
                      (e.target as any).composing = false;
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = '32px';
                      target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (newComment.trim() && !isSubmittingComment) {
                          const form = e.currentTarget.closest('form') as HTMLFormElement;
                          if (form) {
                            form.requestSubmit();
                          }
                        }
                      }
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="flex-shrink-0 p-1.5 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
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
      
      <div className="border-t border-gray-200 pt-6 mb-8">
        <div className="flex flex-col">
          <div className="flex items-start space-x-4 mb-6">
            {author?.userId ? (
              <Link href={`/users/${author.userId}`}>
                <UnifiedAvatar
                  src={author?.avatarUrl || DEFAULT_AVATAR_URL}
                  displayName={author?.name || 'ユーザー'}
                  size="xl"
                  className="flex-shrink-0 border border-gray-200 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
            ) : (
              <UnifiedAvatar
                src={author?.avatarUrl || DEFAULT_AVATAR_URL}
                displayName={author?.name || 'ユーザー'}
                size="xl"
                className="flex-shrink-0 border border-gray-200 shadow-sm"
              />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">{author?.name || 'ユーザー不明'}</h3>
              
              {author?.bio && (
                <p className="text-sm text-gray-600 mt-1 mb-2 line-clamp-3">
                  {author.bio}
                </p>
              )}
              
              <div className="flex items-center flex-wrap gap-3 mt-2">
                {author?.website && (
                  <a 
                    href={author.website}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="inline-flex items-center text-xs text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                    {formatWebsiteUrl(author.website)}
                  </a>
                )}
                
                {socialLinks?.length > 0 && socialLinks.map((link, index) => (
                  <a 
                    key={index} 
                    href={link?.url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
                  >
                    <div className="w-3.5 h-3.5 flex items-center justify-center mr-1.5">
                      <span>{link?.icon?.charAt(0).toUpperCase()}</span>
                    </div>
                    {link?.icon || 'リンク'}
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          {currentUser && author?.userId && currentUser.id !== author.userId && (
          <div className="flex justify-center">
            <Button 
              className={`${
                isFollowing 
                  ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100' 
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              } rounded-md text-sm py-2 px-6 h-auto transition-all duration-200 ${
                isAnimating ? 'scale-95' : ''
              } ${isFollowLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              onClick={handleFollowClick}
              disabled={isFollowLoading || !author}
            >
              {isFollowing ? (
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  フォロー中
                </span>
              ) : (
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="20" y1="8" x2="20" y2="14"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                  </svg>
                  フォローする
                </span>
              )}
            </Button>
          </div>
          )}
          
          {author?.userId && (
            <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{likes || 0}</p>
                <p className="text-xs text-gray-500">いいね</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{commentCount || 0}</p>
                <p className="text-xs text-gray-500">コメント</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{wordCount || 0}</p>
                <p className="text-xs text-gray-500">文字数</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <PurchaseDialog
        isOpen={isPurchaseDialogOpen}
        onClose={() => setIsPurchaseDialogOpen(false)}
        prompt={{
          id: promptId,
          title: author?.name || 'コンテンツタイトル',
          author: {
            name: author?.name || 'ユーザー不明',
            avatarUrl: author?.avatarUrl || DEFAULT_AVATAR_URL,
            userId: author?.userId || '',
            stripe_price_id: author?.stripe_price_id
          },
          price: price
        }}
      />

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
                    <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.572-3.844 2.572-5.992zm-18.988-2.595c.129 0 .234.105.234v4.153h2.287c.129 0 .233.104.233v.842a.233.233 0 01-.233.234H4.781a.233.233 0 01-.234-.234V7.943c0-.129.105-.234.234-.234h.465zm14.701 0c.129 0 .233.105.233.234v.842a.232.232 0 01-.233.234h-2.287v.922h2.287c.129 0 .233.105.233.234v.842a.232.232 0 01-.233.234h-2.287v.922h2.287c.129 0 .233.105.233.234v.842a.232.232 0 01-.233.234h-3.363a.233.233 0 01-.234-.234V7.943c0-.129.105-.234.234-.234h3.363zm-10.12.002c.128 0 .233.104.233.233v4.153c0 .129-.105.234-.233.234h-.842a.233.233 0 01-.234-.234V7.944c0-.129.105-.233.234-.233h.842zm2.894 0a.233.233 0 01.233.233v4.153a.232.232 0 01-.233.234h-.842a.232.232 0 01-.233-.234V7.944c0-.129.104-.233.233-.233h.842z" />
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

      <ReportDialog
        open={isReportDialogOpen}
        onOpenChange={() => setIsReportDialogOpen(false)}
        targetId={promptId}
        promptId={promptId}
        targetType="prompt"
      />
    </div>
  );
};

export default PurchaseSection;