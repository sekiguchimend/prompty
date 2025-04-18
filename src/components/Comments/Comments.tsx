import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { supabase } from '../../lib/supabaseClient';

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

type CommentsProps = {
  promptId: string;
};

const Comments: React.FC<CommentsProps> = ({ promptId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [commentCount, setCommentCount] = useState(0);

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

  // コメントの取得
  useEffect(() => {
    const fetchComments = async () => {
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
      
      setComments(data || []);
      setCommentCount(count || 0);
    };
    
    fetchComments();
    
    // リアルタイム購読
    const commentsSubscription = supabase
      .channel('comments-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `prompt_id=eq.${promptId}`
      }, () => {
        fetchComments();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(commentsSubscription);
    };
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
            <span className="relative flex shrink-0 overflow-hidden rounded-full h-9 w-9">
              <img 
                className="aspect-square h-full w-full" 
                alt={comment.user?.display_name || comment.user?.username || '匿名ユーザー'} 
                src={comment.user?.avatar_url || 'https://github.com/shadcn.png'} 
              />
            </span>
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
          <span className="relative flex shrink-0 overflow-hidden rounded-full h-9 w-9">
            <img 
              className="aspect-square h-full w-full" 
              alt="あなた" 
              src={currentUser?.user_metadata?.avatar_url || "https://github.com/shadcn.png"} 
            />
          </span>
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

export default Comments; 