import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { supabase } from '../../lib/supabaseClient';
import { Avatar } from '../common/Avatar';
import { getDisplayName } from '../../lib/avatar-utils';

type UserProfile = {
  id: string;
  username: string;
  display_name?: string;
  avatar_url: string;
};

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

type CommentListProps = {
  promptId: string;
};

const CommentList: React.FC<CommentListProps> = ({ promptId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(false);

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

  // プロフィールデータを取得する関数
  const fetchUser = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      return data as UserProfile;
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      return null;
    }
  };

  // コメントの取得
  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error, count } = await supabase
        .from('comments')
        .select('*', { count: 'exact' })
        .eq('prompt_id', promptId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const commentsWithUsers = await Promise.all(
        (data as Comment[]).map(async (comment) => {
          const userProfile = await fetchUser(comment.user_id);
          if (userProfile) {
            return { 
              ...comment, 
              user: {
                username: userProfile.username,
                display_name: userProfile.display_name || userProfile.username,
                avatar_url: userProfile.avatar_url
              } 
            };
          }
          return comment;
        })
      );
      
      setComments(commentsWithUsers);
      setCommentCount(count || 0);
    } catch (error) {
      console.error('コメント取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // 新しいコメントのユーザー情報を取得して更新
  const fetchUserForComment = async (comment: Comment) => {
    try {
      const userProfile = await fetchUser(comment.user_id);
      if (!userProfile) return;
      
      setComments((prev) => 
        prev.map((c) => 
          c.id === comment.id ? { 
            ...c, 
            user: {
              username: userProfile.username,
              display_name: userProfile.display_name || userProfile.username,
              avatar_url: userProfile.avatar_url
            } 
          } : c
        )
      );
    } catch (error) {
      console.error('コメントのユーザー情報取得エラー:', error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [promptId]);

  // リアルタイムサブスクリプション
  useEffect(() => {
    if (promptId) {
      const channel = supabase
        .channel('comments-channel')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'comments',
            filter: `prompt_id=eq.${promptId}` 
          }, 
          (payload) => {
            const newComment = payload.new as Comment;
            fetchUserForComment(newComment);
            // 新しいコメントを追加
            setComments((prev) => [newComment, ...prev]);
            // コメント数を更新
            setCommentCount((prev) => prev + 1);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [promptId]);

  // コメント送信
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !currentUser) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('comments')
        .insert([
          {
            prompt_id: promptId,
            user_id: currentUser.id,
            content: newComment.trim(),
            is_edited: false
          }
        ]);
        
      if (error) throw error;
      
      setNewComment('');
    } catch (error) {
      console.error('コメント送信エラー:', error);
      alert('コメントの送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <h3 className="text-lg font-medium mb-4">コメント ({commentCount})</h3>
      
      <div className="space-y-6 mb-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex space-x-3">
            <Avatar 
              src={comment.user?.avatar_url}
              displayName={getDisplayName(comment.user?.display_name)}
              size="sm"
              className="mr-2"
            />
            <div className="flex-1">
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
              <p className="text-sm mt-1 text-gray-700">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>

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
    </div>
  );
};

export default CommentList; 