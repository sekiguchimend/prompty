import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { UnifiedAvatar } from '../index';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';

interface User {
  id: string;
  display_name: string;
  account_name?: string;
  avatar_url?: string;
  bio?: string;
  isFollowing?: boolean;
}

interface FollowModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  title: string;
  onFollowChange?: () => void;
}

const FollowModal: React.FC<FollowModalProps> = ({
  isOpen,
  onClose,
  userId,
  type,
  title,
  onFollowChange
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // ユーザー一覧を取得
  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        let userList: User[] = [];
        
        if (type === 'followers') {
          // フォロワー一覧を取得
          const { data: followData, error: followError } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', userId);
            
          if (followError || !followData) {
            console.error('フォロワー取得エラー:', followError);
            toast({
              title: 'エラー',
              description: 'ユーザー一覧の取得に失敗しました',
              variant: 'destructive',
            });
            return;
          }
          
          const followerIds = followData.map(f => f.follower_id);
          console.log('フォロワーIDs:', followerIds);
          
          if (followerIds.length === 0) {
            setUsers([]);
            return;
          }
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url, bio')
            .in('id', followerIds);
            
          if (profileError) {
            console.error('プロフィール取得エラー:', profileError);
            toast({
              title: 'エラー',
              description: 'ユーザー一覧の取得に失敗しました',
              variant: 'destructive',
            });
            return;
          }
          
          console.log('プロフィールデータ:', profileData);
          
          userList = profileData?.map((profile: any) => ({
            id: profile.id,
            display_name: profile.display_name || 'ユーザー',
            account_name: profile.username,
            avatar_url: profile.avatar_url,
            bio: profile.bio
          })) || [];
          
        } else {
          // フォロー一覧を取得
          const { data: followData, error: followError } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', userId);
            
          if (followError || !followData) {
            console.error('フォロー取得エラー:', followError);
            toast({
              title: 'エラー',
              description: 'ユーザー一覧の取得に失敗しました',
              variant: 'destructive',
            });
            return;
          }
          
          const followingIds = followData.map(f => f.following_id);
          console.log('フォローIDs:', followingIds);
          
          if (followingIds.length === 0) {
            setUsers([]);
            return;
          }
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url, bio')
            .in('id', followingIds);
            
          if (profileError) {
            console.error('プロフィール取得エラー:', profileError);
            toast({
              title: 'エラー',
              description: 'ユーザー一覧の取得に失敗しました',
              variant: 'destructive',
            });
            return;
          }
          
          console.log('プロフィールデータ:', profileData);
          
          userList = profileData?.map((profile: any) => ({
            id: profile.id,
            display_name: profile.display_name || 'ユーザー',
            account_name: profile.username,
            avatar_url: profile.avatar_url,
            bio: profile.bio
          })) || [];
        }

        setUsers(userList);

        // 現在のユーザーがログインしている場合、各ユーザーのフォロー状態を取得
        if (currentUser && userList.length > 0) {
          const userIds = userList.map(u => u.id);
          const { data: followData } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUser.id)
            .in('following_id', userIds);

          const followingMap: Record<string, boolean> = {};
          followData?.forEach(follow => {
            followingMap[follow.following_id] = true;
          });

          setFollowingStates(followingMap);
        }

      } catch (error) {
        console.error('ユーザー一覧取得エラー:', error);
        toast({
          title: 'エラー',
          description: 'ユーザー一覧の取得に失敗しました',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, userId, type, currentUser, toast]);

  // フォロー/アンフォロー処理
  const handleFollowToggle = async (targetUserId: string) => {
    if (!currentUser) {
      toast({
        title: 'ログインが必要です',
        description: 'フォローするにはログインしてください',
        variant: 'destructive',
      });
      return;
    }

    if (targetUserId === currentUser.id) {
      toast({
        title: 'エラー',
        description: '自分自身をフォローすることはできません',
        variant: 'destructive',
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, [targetUserId]: true }));

    try {
      const isCurrentlyFollowing = followingStates[targetUserId];

      if (isCurrentlyFollowing) {
        // アンフォロー
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', targetUserId);

        if (error) throw error;

        setFollowingStates(prev => ({ ...prev, [targetUserId]: false }));
        toast({
          title: 'アンフォローしました',
          description: 'ユーザーのフォローを解除しました',
        });
      } else {
        // フォロー
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: targetUserId
          });

        if (error) throw error;

        setFollowingStates(prev => ({ ...prev, [targetUserId]: true }));
        toast({
          title: 'フォローしました',
          description: 'ユーザーをフォローしました',
        });
      }

      if (onFollowChange) {
        onFollowChange();
      }
    } catch (error) {
      console.error('フォロー処理エラー:', error);
      toast({
        title: 'エラー',
        description: 'フォロー処理に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  // ユーザーページに遷移
  const navigateToUser = (targetUserId: string) => {
    onClose();
    router.push(`/users/${targetUserId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {type === 'followers' ? 'フォロワーがいません' : 'フォローしているユーザーがいません'}
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div 
                    className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigateToUser(user.id)}
                  >
                    <UnifiedAvatar
                      src={user.avatar_url}
                      displayName={user.display_name}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{user.display_name}</p>
                      {user.account_name && (
                        <p className="text-xs text-gray-500 truncate">@{user.account_name}</p>
                      )}
                      {user.bio && (
                        <p className="text-xs text-gray-600 truncate mt-1">{user.bio}</p>
                      )}
                    </div>
                  </div>
                  
                  {currentUser && user.id !== currentUser.id && (
                    <Button
                      variant={followingStates[user.id] ? "outline" : "default"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollowToggle(user.id);
                      }}
                      disabled={loadingStates[user.id]}
                      className="ml-3 flex-shrink-0"
                    >
                      {loadingStates[user.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : followingStates[user.id] ? (
                        'フォロー中'
                      ) : (
                        'フォロー'
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowModal; 