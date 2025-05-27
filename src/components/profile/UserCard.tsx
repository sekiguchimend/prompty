import React from 'react';
import Link from 'next/link';
import { UnifiedAvatar } from '../index';
import { Button } from '../../components/ui/button';
import { UserPlus, UserMinus } from 'lucide-react';
import { UserData, getDisplayName, getAvatarUrl } from '../../types/profile';

interface UserCardProps {
  userData: UserData;
  currentUserId: string | null;
  followLoading: {[key: string]: boolean};
  onFollowToggle: (userId: string, isFollowing: boolean) => void;
}

const UserCard: React.FC<UserCardProps> = ({ userData, currentUserId, followLoading, onFollowToggle }) => {
  // 表示名を取得（nullや空の場合は「匿名」）
  const displayName = getDisplayName(userData.display_name);
  // アバターURLを取得
  const avatarUrl = getAvatarUrl(userData.avatar_url);

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100">
      <Link href={`/users/${userData.id}`} className="flex items-center space-x-4 flex-1 min-w-0">
        <UnifiedAvatar
          src={avatarUrl}
          displayName={displayName}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-900 truncate">{displayName}</h3>
          <p className="text-sm text-gray-500 hidden sm:block">@{userData.username}</p>
        </div>
      </Link>
      {currentUserId && currentUserId !== userData.id && (
        <Button 
          variant={userData.is_following ? "outline" : "default"}
          size="sm"
          disabled={followLoading[userData.id]}
          onClick={() => onFollowToggle(userData.id, !!userData.is_following)}
          className={`ml-2 sm:ml-4 flex-shrink-0 ${userData.is_following ? 'rounded-full border-gray-300' : 'rounded-full'}`}
        >
          {followLoading[userData.id] ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          ) : userData.is_following ? (
            <>
              <UserMinus className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">フォロー中</span>
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">フォローする</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default UserCard; 